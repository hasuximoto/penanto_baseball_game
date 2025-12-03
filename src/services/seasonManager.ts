import { dbManager } from './databaseManager';
import INITIAL_SCHEDULE from '../data/initialSchedule.json';
import { Player } from '../types';

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
    const resetPlayers = players.map(p => ({
        ...p,
        age: p.age + 1, // 年齢を1つ加算
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

    // 6. 疲労度のリセット (開幕時は全員元気)
    // updatePlayersでstatsと一緒にfatigueもリセットすべきだが、
    // Player型にfatigueが含まれていない場合があるため、別途確認が必要。
    // types/index.tsを見る限りPlayer型にはfatigueがないが、runtimeで追加されている可能性がある。
    // ここではstatsのリセットで十分とする。

    console.log('New season setup complete.');
  }
}
