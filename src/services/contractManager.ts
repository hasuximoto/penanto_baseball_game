import { Player, TeamId, NewsItem } from '../types';
import { dbManager } from './databaseManager';

export class ContractManager {

  /**
   * 全チームの契約更改処理を実行する
   * 1. 年俸更新
   * 2. 引退処理
   * 3. 戦力外通告 (支配下登録枠調整)
   */
  static async processOffSeasonContracts(userTeamId?: TeamId | null): Promise<string[]> {
    const logs: string[] = [];
    const newsItems: NewsItem[] = [];
    const date = Date.now();
    const teams = await dbManager.getInitialTeams();

    for (const team of teams) {
      logs.push(`=== ${team.name} 契約更改 ===`);
      
      // 1. 年俸更新
      const roster = await dbManager.getTeamRoster(team.id);
      const updatedRoster: Player[] = [];
      
      for (const player of roster) {
        const newSalary = this.calculateNewSalary(player);
        const salaryDiff = newSalary - (player.contract?.salary || 0);
        
        // 契約情報を更新
        const updatedPlayer = {
          ...player,
          contract: {
            ...player.contract,
            salary: newSalary,
            yearsRemaining: Math.max(0, (player.contract?.yearsRemaining || 1) - 1)
          }
        };
        updatedRoster.push(updatedPlayer);
        
        // ログ (大幅な変動のみ、または主力のみなど)
        if (Math.abs(salaryDiff) > 5000) { // 5000万以上の変動
             // logs.push(`${player.name}: ${player.contract?.salary}万 -> ${newSalary}万`);
        }
      }
      
      // DB更新 (一括更新はDBManagerに機能が必要だが、ここでは個別に更新するか、メモリ上で処理して最後に保存)
      // 今回はロジックの流れを示すため、後続の処理でリストを操作する
      
      // 2. 引退処理
      const { activePlayers, retiredPlayers } = this.processRetirements(updatedRoster);
      if (retiredPlayers.length > 0) {
        logs.push(`[引退] ${retiredPlayers.map(p => p.name).join(', ')}`);
        // 引退選手をDBから削除、またはステータス変更 (実装依存)
        await dbManager.removePlayers(retiredPlayers.map(p => p.id));

        newsItems.push({
            id: `retired_${team.id}_${date}`,
            date: date,
            title: `${team.name} 引退選手`,
            content: retiredPlayers.map(p => `${p.name} (${p.position}・${p.age}歳)`).join('\n'),
            type: 'contract',
            affectedTeams: [team.id]
        });
      }

      // 3. 戦力外通告 (支配下登録枠調整)
      // TeamStrategyManagerのロジックを利用して候補を選定
      // ここでは実際に削除を行う
      let currentRoster = activePlayers;
      const ROSTER_LIMIT = 70;
      
      if (team.id === userTeamId) {
        logs.push(`[戦力外] ${team.name} (ユーザー操作待ち)`);
      } else if (currentRoster.length > ROSTER_LIMIT) {
        // 放出候補を取得 (TeamStrategyManagerのロジックを再利用または独自実装)
        // TeamStrategyManager.identifyReleaseCandidates は private なので、ここで似たロジックを実装するか、publicにする必要がある。
        // ここでは簡易的に実装する
        const releaseCandidates = this.identifyReleaseCandidates(currentRoster, currentRoster.length - ROSTER_LIMIT);
        
        if (releaseCandidates.length > 0) {
            logs.push(`[戦力外] ${releaseCandidates.map(p => p.name).join(', ')}`);
            await dbManager.removePlayers(releaseCandidates.map(p => p.id));
            
            // currentRosterから削除
            const releaseIds = releaseCandidates.map(p => p.id);
            currentRoster = currentRoster.filter(p => !releaseIds.includes(p.id));

            newsItems.push({
                id: `released_${team.id}_${date}`,
                date: date,
                title: `${team.name} 戦力外通告`,
                content: releaseCandidates.map(p => `${p.name} (${p.position}・${p.age}歳)`).join('\n'),
                type: 'contract',
                affectedTeams: [team.id]
            });
        }
      }

      // 残った選手(年俸更新済み)を保存
      await dbManager.updatePlayers(currentRoster);
    }

    if (newsItems.length > 0) {
        await dbManager.addNews(newsItems);
    }

    return logs;
  }

  /**
   * 年俸計算ロジック
   */
  private static calculateNewSalary(player: Player): number {
    const currentSalary = player.contract?.salary || 1000; // デフォルト1000万
    let performanceFactor = 1.0;

    // 成績による変動
    if (player.position === 'P') {
        // 投手
        const era = player.stats.era || 4.50;
        const wins = player.stats.wins || 0;
        const saves = player.stats.saves || 0;
        
        if (era < 2.50) performanceFactor += 0.2;
        else if (era < 3.50) performanceFactor += 0.1;
        else if (era > 5.00) performanceFactor -= 0.1;
        
        if (wins > 10) performanceFactor += 0.15;
        if (saves > 20) performanceFactor += 0.15;
        
    } else {
        // 野手
        const avg = player.stats.average || 0.250;
        const hr = player.stats.homeRuns || 0;
        const rbi = player.stats.rbi || 0;
        const ops = player.stats.ops || 0.700;

        if (avg > 0.300) performanceFactor += 0.15;
        else if (avg < 0.220) performanceFactor -= 0.1;

        if (hr > 20) performanceFactor += 0.15;
        if (rbi > 80) performanceFactor += 0.1;
        if (ops > 0.850) performanceFactor += 0.1;
    }

    // 年齢による減衰 (35歳以上)
    if (player.age > 35) {
        performanceFactor -= 0.1;
    }

    // 変動幅の制限 (最大2倍、最小40%減)
    performanceFactor = Math.max(0.6, Math.min(2.0, performanceFactor));

    // 新年俸 (10万単位で丸める)
    let newSalary = currentSalary * performanceFactor;
    newSalary = Math.round(newSalary / 10) * 10;
    
    // 最低年俸保証 (400万)
    return Math.max(400, newSalary);
  }

  /**
   * 引退処理
   * 年齢と能力低下に基づいて引退を決定
   */
  private static processRetirements(roster: Player[]): { activePlayers: Player[], retiredPlayers: Player[] } {
    const activePlayers: Player[] = [];
    const retiredPlayers: Player[] = [];

    for (const player of roster) {
        let retireChance = 0;

        if (player.age >= 40) retireChance = 0.5; // 50%
        else if (player.age >= 35) retireChance = 0.1; // 10%
        else if (player.age >= 30) retireChance = 0.01; // 1%

        // 能力が著しく低い場合、引退確率アップ
        const abilitySum = this.getAbilitySum(player);
        if (abilitySum < 25 && player.age > 30) retireChance += 0.2;

        // 成績による補正 (活躍しているベテランは引退しにくい)
        const perfScore = this.calculatePerformanceScore(player);
        if (perfScore > 20) retireChance *= 0.1; // 大活躍ならほぼ引退しない
        else if (perfScore > 0) retireChance *= 0.5; // 活躍なら半減
        else if (perfScore < -10 && player.age > 30) retireChance += 0.1; // 不振なら確率アップ
        else if (perfScore < -30 && player.age > 30) retireChance += 0.2; // 大不振

        if (Math.random() < retireChance) {
            retiredPlayers.push(player);
        } else {
            activePlayers.push(player);
        }
    }

    return { activePlayers, retiredPlayers };
  }

  /**
   * 戦力外候補の選定 (スコア下位から指定人数)
   */
  private static identifyReleaseCandidates(roster: Player[], count: number): Player[] {
    // ポジションごとの人数をカウント
    const counts = {
        'P': roster.filter(p => p.position === 'P').length,
        'C': roster.filter(p => p.position === 'C').length,
        'IF': roster.filter(p => ['1B', '2B', '3B', 'SS'].includes(p.position)).length,
        'OF': roster.filter(p => ['LF', 'CF', 'RF', 'OF'].includes(p.position)).length
    };

    // 評価スコア計算
    const scoredPlayers = roster.map(p => {
        let score = this.getAbilitySum(p) + (30 - p.age) * 2; // 若さを優遇
        
        // 成績による補正を追加
        score += this.calculatePerformanceScore(p);

        // ポジション過多の場合はスコアを下げる（放出されやすくする）
        if (p.position === 'P' && counts['P'] > 35) score -= 20;
        if (p.position === 'OF' && counts['OF'] > 16) score -= 10;

        return { player: p, score };
    });

    // スコア昇順 (低い順)
    scoredPlayers.sort((a, b) => a.score - b.score);

    const candidates: Player[] = [];
    let currentCount = 0;

    for (const sp of scoredPlayers) {
        if (currentCount >= count) break;
        const p = sp.player;

        // 最低人数ガード
        if (p.position === 'P' && counts['P'] <= 28) continue;
        if (p.position === 'C' && counts['C'] <= 3) continue;
        if (['1B', '2B', '3B', 'SS'].includes(p.position) && counts['IF'] <= 10) continue;
        if (['LF', 'CF', 'RF', 'OF'].includes(p.position) && counts['OF'] <= 9) continue;

        candidates.push(p);
        
        // カウント更新
        if (p.position === 'P') counts['P']--;
        else if (p.position === 'C') counts['C']--;
        else if (['1B', '2B', '3B', 'SS'].includes(p.position)) counts['IF']--;
        else counts['OF']--;

        currentCount++;
    }

    return candidates;
  }

  private static calculatePerformanceScore(p: Player): number {
      let score = 0;
      if (!p.stats) return 0;

      if (p.position === 'P') {
          // 投手評価
          const games = p.stats.gamesPitched || 0;
          const era = p.stats.era !== undefined ? p.stats.era : 99.9;
          
          // 登板数ボーナス (一軍戦力として稼働したか)
          if (games > 10) score += 10;
          if (games > 30) score += 10;

          // 防御率評価 (登板がある場合のみ)
          if (games > 0) {
              if (era < 3.00) score += 20;
              else if (era < 3.50) score += 10;
              else if (era > 5.00) score -= 10;
              else if (era > 6.00) score -= 20;
          }
      } else {
          // 野手評価
          const games = p.stats.gamesPlayed || 0;
          const ops = p.stats.ops !== undefined ? p.stats.ops : 0.0;
          
          // 出場数ボーナス
          if (games > 20) score += 10;
          if (games > 80) score += 10;

          // OPS評価 (出場がある場合のみ)
          if (games > 0) {
              if (ops > 0.800) score += 20;
              else if (ops > 0.700) score += 10;
              else if (ops < 0.600) score -= 10;
              else if (ops < 0.500) score -= 20;
          }
      }
      return score;
  }

  private static getAbilitySum(p: Player): number {
      if (p.position === 'P') {
          return (p.abilities.speed / 10 || 0) + (p.abilities.control || 0) + (p.abilities.stamina || 0);
      } else {
          return (p.abilities.contact || 0) + (p.abilities.power || 0) + (p.abilities.fielding || 0);
      }
  }
}
