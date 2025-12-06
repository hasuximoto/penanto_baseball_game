import { Player, TeamId, NewsItem, GameState } from '../types';
import { dbManager } from './databaseManager';
import { getGameDateString } from '../utils/dateUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class RosterManager {
  
  /**
   * 日次ロスター処理
   * 一軍・二軍の入れ替え判定を行う
   */
  /**
   * 週次更新処理 (月曜日またはシーズン開始時に実行)
   * 試合前に実行することを想定
   */
  async processWeeklyUpdates(gameState: GameState): Promise<void> {
      const dateStr = getGameDateString(gameState.currentDate, gameState.season);
      const isMonday = new Date(dateStr).getDay() === 1;
      const isSeasonStart = gameState.currentDate === 1;
      
      if (!isMonday && !isSeasonStart) return;

      const players = await dbManager.getInitialPlayers();
      const teams = await dbManager.getInitialTeams();
      
      for (const team of teams) {
          const teamPlayers = players.filter(p => p.team === team.id);
          this.updatePitcherRoles(teamPlayers);
      }
      
      await dbManager.savePlayers(players);
  }

  /**
   * 日次ロスター処理
   * 一軍・二軍の入れ替え判定を行う
   */
  async processDailyMoves(gameState: GameState): Promise<NewsItem[]> {
    // シーズン終了後はロスター変更を行わない
    if (gameState.playableFlags.seasonEnded) {
        return [];
    }

    const players = await dbManager.getInitialPlayers();
    const teams = await dbManager.getInitialTeams();
    const news: NewsItem[] = [];

    // processWeeklyUpdates は GameEngine から試合前に呼ばれるため、ここでは削除

    for (const team of teams) {
      const teamPlayers = players.filter(p => p.team === team.id);
      const { promoted, demoted } = this.processTeamMoves(team.id, teamPlayers, gameState.currentDate);
      
      if (promoted.length > 0 || demoted.length > 0) {
          let content = '';
          if (promoted.length > 0) content += `【登録】${promoted.map(p => p.name).join(', ')}\n`;
          if (demoted.length > 0) content += `【抹消】${demoted.map(p => p.name).join(', ')}`;
          
          news.push({
              id: `roster_move_${team.id}_${gameState.currentDate}`,
              date: gameState.currentDate,
              title: `${team.name} 選手登録・抹消`,
              content: content.trim(),
              type: 'roster',
              affectedTeams: [team.id]
          });
      }
    }

    // 変更があれば保存
    if (news.length > 0) {
        await dbManager.savePlayers(players);
        await dbManager.addNews(news);
    }

    // 1軍登録日数の加算
    await this.updateRegisteredDays(players);

    return news;
  }

  /**
   * 1軍登録日数を加算する
   */
  private async updateRegisteredDays(players: Player[]): Promise<void> {
    let updated = false;
    for (const player of players) {
      // 1軍登録中 (active) または登録ステータスがない場合 (デフォルト1軍)
      if (player.registrationStatus === 'active' || !player.registrationStatus) {
        player.currentYearRegisteredDays = (player.currentYearRegisteredDays || 0) + 1;
        updated = true;
      }
    }
    if (updated) {
      await dbManager.savePlayers(players);
    }
  }

  /**
   * 投手起用区分を更新 (先発6人、抑え1人、残り中継ぎ)
   */
  private updatePitcherRoles(teamPlayers: Player[]) {
      const activePitchers = teamPlayers.filter(p => p.position === 'P' && p.registrationStatus === 'active');
      
      // 一旦リセット
      activePitchers.forEach(p => p.pitcherRole = undefined);

      // 評価関数
      const getStarterScore = (p: Player) => {
          // 先発適性 > スタミナ > 総合値
          // starter_aptitude も考慮
          const aptitude = p.abilities.starterAptitude || p.starter_aptitude || 0;
          return aptitude * 2 + (p.abilities.stamina || 0) + (p.abilities.overall || 0);
      };
      
      const getCloserScore = (p: Player) => {
          // 抑え適性 > 球威 > 総合値
          // closer_aptitude も考慮
          const aptitude = p.abilities.closerAptitude || p.closer_aptitude || 0;
          return aptitude * 2 + (p.abilities.stuff || 0) + (p.abilities.overall || 0);
      };

      // 1. 先発 (6人)
      activePitchers.sort((a, b) => getStarterScore(b) - getStarterScore(a));
      const starters = activePitchers.slice(0, 6);
      starters.forEach(p => p.pitcherRole = 'starter');
      
      // 残りの投手
      const remaining = activePitchers.slice(6);
      
      if (remaining.length > 0) {
          // 2. 抑え (1人)
          remaining.sort((a, b) => getCloserScore(b) - getCloserScore(a));
          const closer = remaining[0];
          closer.pitcherRole = 'closer';
          
          // 3. 中継ぎ (残り)
          const relievers = remaining.slice(1);
          relievers.forEach(p => p.pitcherRole = 'reliever');
      }
  }

  private processTeamMoves(teamId: TeamId, players: Player[], currentDate: number): { promoted: Player[], demoted: Player[] } {
    const promoted: Player[] = [];
    const demoted: Player[] = [];
    
    // 1. 初期化 (未設定の場合)
    players.forEach(p => {
        if (!p.registrationStatus) {
            // デフォルトは全員一軍扱い（初期状態）
            p.registrationStatus = 'active';
        }
    });

    // 定数定義
    const MAX_ACTIVE = 31;
    const MAX_FOREIGN_ACTIVE = 5;
    // 入れ替えの閾値。低いほど活発に入れ替わる。
    // 能力が高い選手が二軍に塩漬けになるのを防ぐため緩和
    const THRESHOLD = 10;
    const TARGET_COUNTS = {
        pitcher: 13, // 10-12人目安だが枠31なので少し余裕を持たせる
        catcher: 3,
        infielder: 8,
        outfielder: 7
    };

    const getPositionCategory = (pos: string): 'pitcher' | 'catcher' | 'infielder' | 'outfielder' => {
        if (pos === 'P') return 'pitcher';
        if (pos === 'C') return 'catcher';
        if (['1B', '2B', '3B', 'SS'].includes(pos)) return 'infielder';
        return 'outfielder';
    };

    // 2. リスト分割
    let activePlayers = players.filter(p => p.registrationStatus === 'active');
    let farmPlayers = players.filter(p => p.registrationStatus === 'farm');

    // --- 怪我人の自動抹消 ---
    const injuredActive = activePlayers.filter(p => p.injuryStatus && p.injuryStatus !== 'healthy');
    for (const p of injuredActive) {
        this.demotePlayer(p, currentDate);
        demoted.push(p);
    }
    // リスト更新
    activePlayers = players.filter(p => p.registrationStatus === 'active');

    // --- 強制降格ロジック (人数超過時) ---
    while (activePlayers.length > MAX_ACTIVE) {
        // ポジション別カウント
        const counts = { pitcher: 0, catcher: 0, infielder: 0, outfielder: 0 };
        activePlayers.forEach(p => counts[getPositionCategory(p.position)]++);

        // 目標を超過しているポジションの選手を候補にする
        let demotionCandidates = activePlayers.filter(p => {
            const cat = getPositionCategory(p.position);
            return counts[cat] > TARGET_COUNTS[cat];
        });

        // もし目標超過ポジションがない場合（全体では超過しているが、各カテゴリは許容範囲内など）は全体を候補に
        if (demotionCandidates.length === 0) {
            demotionCandidates = activePlayers;
        }

        // 評価スコアでソート (昇順 = 低い順)
        demotionCandidates.sort((a, b) => this.evaluatePlayer(a) - this.evaluatePlayer(b));
        
        const p = demotionCandidates[0];
        if (p) {
            this.demotePlayer(p, currentDate);
            demoted.push(p);
        }
        
        // リスト更新
        activePlayers = players.filter(p => p.registrationStatus === 'active');
    }

    // --- 入れ替えロジック ---
    // ファーム選手を評価順にソート (降順 = 高い順)
    farmPlayers.sort((a, b) => this.evaluatePlayer(b) - this.evaluatePlayer(a));

    for (const candidate of farmPlayers) {
        // 10日間再登録不可ルール
        if (candidate.lastDemotionDate && (currentDate - candidate.lastDemotionDate < 10)) {
            continue;
        }

        // 怪我人は昇格させない
        if (candidate.injuryStatus && candidate.injuryStatus !== 'healthy') {
            continue;
        }

        // 外国人枠チェック
        const currentForeigners = activePlayers.filter(p => p.isForeign).length;
        if (candidate.isForeign && currentForeigners >= MAX_FOREIGN_ACTIVE) {
            // 外国人枠が一杯の場合、一軍の外国人選手との入れ替えのみ検討
            const activeForeigners = activePlayers.filter(p => p.isForeign).sort((a, b) => this.evaluatePlayer(a) - this.evaluatePlayer(b));
            const worstForeigner = activeForeigners[0];
            
            if (worstForeigner && this.evaluatePlayer(candidate) > this.evaluatePlayer(worstForeigner) + THRESHOLD) {
                 this.demotePlayer(worstForeigner, currentDate);
                 this.promotePlayer(candidate);
                 demoted.push(worstForeigner);
                 promoted.push(candidate);
                 activePlayers = players.filter(p => p.registrationStatus === 'active');
            }
            continue;
        }

        const candidateCategory = getPositionCategory(candidate.position);

        // 通常昇格 (枠に空きがある場合)
        if (activePlayers.length < MAX_ACTIVE) {
            this.promotePlayer(candidate);
            promoted.push(candidate);
            activePlayers = players.filter(p => p.registrationStatus === 'active');
            continue;
        } 
        
        // 通常入れ替え (枠が一杯の場合)
        // 誰を落とすか決める
        let targetCandidates: Player[] = [];

        // 現在のポジション分布を確認
        const counts = { pitcher: 0, catcher: 0, infielder: 0, outfielder: 0 };
        activePlayers.forEach(p => counts[getPositionCategory(p.position)]++);

        // 戦略:
        // 1. 候補と同じポジションカテゴリが一軍で「目標以上」いるなら、そのカテゴリの中から落とす（同ポジション入れ替え）
        // 2. 候補と同じポジションカテゴリが一軍で「目標未満」なら、他カテゴリで「目標超過」しているところから落とす（バランス是正）
        
        if (counts[candidateCategory] >= TARGET_COUNTS[candidateCategory]) {
            targetCandidates = activePlayers.filter(p => getPositionCategory(p.position) === candidateCategory);
        } else {
            // 不足しているので他から落としたい
            const surplusCategories = (Object.keys(counts) as (keyof typeof counts)[]).filter(k => counts[k] > TARGET_COUNTS[k]);
            if (surplusCategories.length > 0) {
                targetCandidates = activePlayers.filter(p => surplusCategories.includes(getPositionCategory(p.position)));
            } else {
                // 過剰なところがないなら全体から（同ポジション含む）
                targetCandidates = activePlayers;
            }
        }

        // ターゲット候補を評価順にソート
        targetCandidates.sort((a, b) => this.evaluatePlayer(a) - this.evaluatePlayer(b));
        const worstActive = targetCandidates[0];
        
        // 候補のスコアが、ターゲット最低スコア + 閾値 を上回る場合に入れ替え
        if (worstActive && this.evaluatePlayer(candidate) > this.evaluatePlayer(worstActive) + THRESHOLD) {
            this.demotePlayer(worstActive, currentDate);
            this.promotePlayer(candidate);
            demoted.push(worstActive);
            promoted.push(candidate);
            
            // リスト更新
            activePlayers = players.filter(p => p.registrationStatus === 'active');
        }
    }

    return { promoted, demoted };
  }

  /**
   * 選手評価スコア計算
   * 能力と成績の複合評価
   */
  private evaluatePlayer(player: Player): number {
      // 1. 基礎能力スコア
      // overall (総合能力) があればそれを使用する
      let abilityScore = player.abilities.overall || 0;

      // overall がない場合のフォールバック (旧ロジック、ただしスケールが異なる可能性あり)
      if (!abilityScore) {
        if (player.position === 'P') {
            const p = player.abilities;
            abilityScore = ((p.control || 0) + (p.stamina || 0) + (p.speed ? (p.speed - 130) * 2 : 20)) / 3;
        } else {
            const p = player.abilities;
            abilityScore = (p.contact + p.power + p.fielding + p.speed) / 4;
        }
      }
      
      // 2. 成績補正 (-50 ~ +50)
      let statsScore = 0;
      if (player.stats && player.stats.gamesPlayed && player.stats.gamesPlayed > 5) {
          if (player.position === 'P') {
              // 投手: 防御率
              const era = player.stats.era !== undefined ? player.stats.era : 4.50;
              // 3.50 を基準に、良いほどプラス
              statsScore = (3.50 - era) * 15; 
          } else {
              // 野手: OPS
              const ops = player.stats.ops !== undefined ? player.stats.ops : 0.650;
              // .650 を基準に
              statsScore = (ops - 0.650) * 200;
          }
      }

      // 3. 疲労補正 (投手のみ)
      let fatiguePenalty = 0;
      if (player.position === 'P' && player.fatigue && player.fatigue > 20) {
          fatiguePenalty = player.fatigue; // 疲労が溜まっていると評価ダウン
      }

      return abilityScore + statsScore - fatiguePenalty;
  }

  private demotePlayer(player: Player, date: number) {
      player.registrationStatus = 'farm';
      player.lastDemotionDate = date;
  }

  private promotePlayer(player: Player) {
      player.registrationStatus = 'active';
  }

  private createNews(player: Player, type: 'promotion' | 'demotion', date: number): NewsItem {
      return {
          id: Math.random().toString(36).substr(2, 9),
          date: date,
          title: type === 'promotion' ? '出場選手登録' : '出場選手登録抹消',
          content: `${player.team.toUpperCase()}: ${player.name}選手が${type === 'promotion' ? '一軍に登録' : '登録を抹消'}されました。`,
          type: 'roster_move',
          affectedTeams: [player.team]
      };
  }
}

export const rosterManager = new RosterManager();
