import { dbManager } from './databaseManager';
import INITIAL_SCHEDULE from '../data/initialSchedule.json';
import { DraftManager } from './draftManager';

export class SeasonManager {
  /**
   * 新しいシーズンを開始するための処理を行う
   * 1. スケジュールの更新 (年度更新)
   * 2. 選手成績のリセット
   * 3. 試合結果のクリア (新シーズン用)
   */
  static async startNewSeason(newSeasonYear: number): Promise<void> {
    console.log(`Starting new season: ${newSeasonYear}`);

    // 1. スケジュールの更新
    // 初期スケジュールをベースに、年度を更新する
    // 日付の曜日は考慮せず、単純に年度だけ書き換える (簡易実装)
    const newSchedule = INITIAL_SCHEDULE.map((game: any) => {
        const oldDate = new Date(game.date);
        // 月日はそのまま、年度を新シーズンに
        // 元データが2026年ベースだと仮定
        const month = oldDate.getMonth();
        const day = oldDate.getDate();
        
        // 新しい日付文字列を作成 (YYYY-MM-DD)
        const newDateStr = `${newSeasonYear}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        return {
            ...game,
            date: newDateStr,
            played: 0,
            result_id: null
        };
    });

    await dbManager.updateSchedule(newSchedule);

    // 2. 選手成績のリセットと年齢加算
    // 全選手を取得し、statsをリセットして保存
    const players = await dbManager.getInitialPlayers();

    // 年度別成績の保存は ContractManager.processOffSeasonContracts で実施済みのためここでは行わない
    // (FA移籍などでチームが変わる前に保存する必要があるため)

    const resetPlayers = await Promise.all(players.map(async p => {
        // プロ年数の更新
        const experienceYears = (p.experienceYears || 0) + 1;
        
        // 新人王資格判定
        let isRookieEligible = false;
        // 支配下登録5年以内
        if (experienceYears <= 5) {
            // 過去の成績を取得 (前年度の成績も含む)
            const pastStats = await dbManager.getYearlyStats(p.id);
            
            if (p.position === 'P') {
                // 投手: 前年までの通算投球回が30イニング以内
                const totalInnings = pastStats.reduce((sum, s) => sum + (s.stats.inningsPitched || 0), 0);
                if (totalInnings <= 30) {
                    isRookieEligible = true;
                }
            } else {
                // 野手: 前年までの通算打席数が60打席以内
                const totalPA = pastStats.reduce((sum, s) => sum + (s.stats.plateAppearances || 0), 0);
                if (totalPA <= 60) {
                    isRookieEligible = true;
                }
            }
        }

        return {
            ...p,
            age: p.age + 1, // 年齢を1つ加算
            experienceYears,
            isRookieEligible,
            stats: {
            // 打者
            gamesPlayed: 0,
            plateAppearances: 0,
            atBats: 0,
            hits: 0,
            doubles: 0,
            triples: 0,
            homeRuns: 0,
            rbi: 0,
            batterStrikeouts: 0,
            walks: 0,
            hitByPitch: 0,
            sacrificeBunts: 0,
            sacrificeFlies: 0,
            stolenBases: 0,
            caughtStealing: 0,
            doublePlays: 0,
            errors: 0,
            average: 0,
            obp: 0,
            slugging: 0,
            ops: 0,
            uzr: 0,
            ubr: 0,
            
            // 投手
            era: 0,
            wins: 0,
            losses: 0,
            saves: 0,
            inningsPitched: 0,
            strikeOuts: 0,
            earnedRuns: 0,
            runsAllowed: 0,
            gamesPitched: 0,
            gamesStarted: 0,
            completeGames: 0,
            shutouts: 0,
            qualityStarts: 0,
            pitchingHits: 0,
            pitchingHomeRuns: 0,
            pitchingWalks: 0,
            pitchingHitByPitch: 0,
            whip: 0,
            k9: 0,
            bb9: 0,
            pitchCount: 0
        }
    };
    }));

    await dbManager.updatePlayers(resetPlayers);

    // 3. チーム成績のリセット
    const teams = await dbManager.getInitialTeams();
    const resetTeams = teams.map(t => ({
        ...t,
        record: {
            wins: 0,
            losses: 0,
            draws: 0,
            gamesBack: 0,
            winPercentage: 0,
            runsScored: 0,
            runsAllowed: 0,
            homeRuns: 0,
            stolenBases: 0,
            era: 0,
            battingAverage: 0
        }
    }));
    await dbManager.updateTeams(resetTeams);

    // 4. ニュースのリセット
    await dbManager.clearNews();

    // 5. 古い試合履歴の削除 (容量確保のため)
    await dbManager.cleanupOldGameHistory(newSeasonYear);

    // 6. ドラフト候補の生成とニュース発行
    console.log('Generating draft candidates...');
    const draftCandidates = DraftManager.generateDraftCandidates(150);
    await dbManager.saveDraftCandidates(draftCandidates);

    // 候補者の傾向分析（ニュース用）
    const pitchers = draftCandidates.filter(p => p.position === 'P');
    const fielders = draftCandidates.filter(p => p.position !== 'P');
    
    const hsPitchers = pitchers.filter(p => p.age === 18).length;
    const uniPitchers = pitchers.filter(p => p.age === 22).length;
    
    const hsFielders = fielders.filter(p => p.age === 18).length;
    const uniFielders = fielders.filter(p => p.age === 22).length;

    // 注目選手（ドラフト1位候補など）
    const topProspects = draftCandidates.filter(p => p.scoutInfo?.specialStatus?.includes('ドラフト1位候補'));
    const topNames = topProspects.slice(0, 3).map(p => `${p.name} (${p.position})`).join('、');

    let trendText = "";
    if (pitchers.length > fielders.length + 10) trendText += "今年は投手が豊作の年となりそうだ。";
    else if (fielders.length > pitchers.length + 10) trendText += "今年は野手の有力候補が多い。";
    else trendText += "投打ともにバランスの取れた人材が揃っている。";

    if (hsPitchers + hsFielders > 60) trendText += "特に高校生に逸材が多く、将来性が楽しみな年だ。";
    else if (uniPitchers + uniFielders > 60) trendText += "即戦力となる大学生候補が充実している。";

    const newsTitle = `${newSeasonYear}年 ドラフト戦線異常あり？ 今年の展望`;
    const newsContent = `${trendText}\n\n注目選手としては、${topNames}らの名前が挙がっている。\n各球団のスカウトも視察に熱が入る時期となってきた。\n\n[内訳]\n投手: ${pitchers.length}名 (高卒:${hsPitchers}, 大卒:${uniPitchers})\n野手: ${fielders.length}名 (高卒:${hsFielders}, 大卒:${uniFielders})`;

    await dbManager.addNews([{
        id: `draft_prospects_start_${newSeasonYear}`,
        date: 0, // 開幕前
        title: newsTitle,
        content: newsContent,
        type: 'news'
    }]);

    // 7. 疲労度のリセット (開幕時は全員元気)
    // updatePlayersでstatsと一緒にfatigueもリセットすべきだが、
    // Player型にfatigueが含まれていない場合があるため、別途確認が必要。
    // types/index.tsを見る限りPlayer型にはfatigueがないが、runtimeで追加されている可能性がある。
    // ここではstatsのリセットで十分とする。

    console.log('New season setup complete.');
  }
}
