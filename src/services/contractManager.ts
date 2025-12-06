import { Player, TeamId, NewsItem, GameState } from '../types';
import { dbManager } from './databaseManager';
import { OFF_SEASON_TURNS } from '../utils/constants';

export class ContractManager {

  /**
   * 全チームの契約更改処理を実行する
   * 1. 年俸更新
   * 2. 引退処理
   * 3. 戦力外通告 (支配下登録枠調整)
   */
  static async processOffSeasonContracts(userTeamId: TeamId | null | undefined, season: number): Promise<string[]> {
    const logs: string[] = [];
    const newsItems: NewsItem[] = [];
    const date = Date.now();
    
    // 年度別成績を保存 (FAなどでチームが変わる前に保存)
    const allPlayers = await dbManager.getInitialPlayers();
    // ドラフトで入団したばかりの選手（experienceYearsがない、または0）は除外しない（新人王資格などで必要になる可能性があるため）
    // ただし、SeasonManagerでのロジックに合わせてフィルタリングする場合は以下
    // const playersToSave = allPlayers.filter(p => p.experienceYears && p.experienceYears > 0);
    // ここでは全選手保存する
    await dbManager.saveYearlyStats(season, allPlayers);
    logs.push(`[システム] ${season}年度の成績を保存しました`);

    const teams = await dbManager.getInitialTeams();

    for (const team of teams) {
      logs.push(`=== ${team.name} 契約更改 ===`);
      
      // 1. 年俸更新
      const roster = await dbManager.getTeamRoster(team.id);

      // 0. FA宣言
      const { remainingPlayers, faPlayers } = this.processFADeclaration(roster);
      if (faPlayers.length > 0) {
        logs.push(`[FA宣言] ${faPlayers.map(p => p.name).join(', ')}`);
        
        // FA宣言した選手のチームをfree_agentに変更し、faStateを含めて保存する
        // releasePlayersToFreeAgencyを使うとfaStateが消えてしまうため、updatePlayersを使用
        faPlayers.forEach(p => p.team = 'free_agent');
        await dbManager.updatePlayers(faPlayers);
        
        newsItems.push({
            id: `fa_${team.id}_${date}`,
            date: date,
            title: `${team.name} FA宣言選手`,
            content: faPlayers.map(p => `${p.name} (${p.position}・${p.age}歳)`).join('\n'),
            type: 'contract',
            affectedTeams: [team.id]
        });
      }

      const updatedRoster: Player[] = [];
      
      for (const player of remainingPlayers) {
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
      // FA補強や新外国人獲得のために枠を空けておく (70 -> 65)
      const ROSTER_LIMIT = 67;
      
      if (team.id === userTeamId) {
        logs.push(`[戦力外] ${team.name} (ユーザー操作待ち)`);
      } else if (currentRoster.length > ROSTER_LIMIT) {
        // 放出候補を取得 (TeamStrategyManagerのロジックを再利用または独自実装)
        // TeamStrategyManager.identifyReleaseCandidates は private なので、ここで似たロジックを実装するか、publicにする必要がある。
        // ここでは簡易的に実装する
        const releaseCandidates = this.identifyReleaseCandidates(currentRoster, currentRoster.length - ROSTER_LIMIT);
        
        if (releaseCandidates.length > 0) {
            logs.push(`[戦力外] ${releaseCandidates.map(p => p.name).join(', ')}`);
            
            // 戦力外選手にもfaStateを設定して市場に出す
            releaseCandidates.forEach(p => {
                p.team = 'free_agent';
                p.faState = {
                    declared: false, // FA宣言ではない
                    negotiating: true,
                    offers: [],
                    decisionTurn: Math.floor(Math.random() * (OFF_SEASON_TURNS - 2)) + 2
                };
            });
            await dbManager.updatePlayers(releaseCandidates);
            
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

  private static processFADeclaration(roster: Player[]): { remainingPlayers: Player[], faPlayers: Player[] } {
    const remainingPlayers: Player[] = [];
    const faPlayers: Player[] = [];

    for (const player of roster) {
      // FA権取得条件: FA資格取得年数が7年以上
      // また、シーズン終了時に登録日数145日以上でfaQualifiedYearsを加算する処理が必要だが、
      // ここでは「既に加算済み」であることを前提とするか、ここで加算するか。
      // 契約更改はシーズン終了後なので、ここで今シーズンの評価を行って加算するのが適切。
      
      // 1. 今シーズンの登録日数チェックとFA資格年数加算
      // (注意: rosterは参照渡しではないので、ここで変更しても呼び出し元のオブジェクトは変わらない可能性があるが、
      //  後続の処理でDB保存されることを期待する。ただし、processOffSeasonContracts内では
      //  remainingPlayersのみが保存対象になりがちなので、faPlayersも含めて更新が必要)
      
      let qualifiedYears = player.faQualifiedYears || 0;
      const registeredDays = player.currentYearRegisteredDays || 0;
      
      // 145日以上登録で1年加算
      if (registeredDays >= 145) {
          qualifiedYears++;
          // オブジェクト更新 (後続の保存処理のため)
          player.faQualifiedYears = qualifiedYears;
          player.currentYearRegisteredDays = 0; // リセット
      } else {
          // 満たさなくてもリセットはしておく
          player.currentYearRegisteredDays = 0;
          player.faQualifiedYears = qualifiedYears; // 初期化されていない場合のためにセット
      }

      // 2. FA宣言判定
      // 国内FA権取得は一般的に9年(大卒・社会人7年)だが、ここでは簡易的に一律7年とする
      if (qualifiedYears >= 7 && Math.random() < 0.1) {
        // FA宣言状態をセット
        player.faState = {
            declared: true,
            negotiating: true,
            offers: [],
            decisionTurn: Math.floor(Math.random() * (OFF_SEASON_TURNS - 5)) + 5 // 5~OFF_SEASON_TURNSターンの間で決断
        };
        faPlayers.push(player);
      } else {
        remainingPlayers.push(player);
      }
    }
    return { remainingPlayers, faPlayers };
  }

  /**
   * ユーザーからのオファーを登録する
   */
  static async makeOffer(playerId: string | number, teamId: TeamId, salary: number, years: number, turn: number): Promise<void> {
    const players = await dbManager.getInitialPlayers();
    const player = players.find(p => p.id === playerId);
    
    if (!player) {
        throw new Error("Player not found");
    }

    // faStateがない場合は初期化 (自由契約選手へのオファーなど)
    if (!player.faState) {
        player.faState = {
            declared: false, // FA宣言ではない
            negotiating: true,
            offers: [],
            decisionTurn: turn + 1 // 即決断、または次のターン
        };
    }

    // 既存のオファーがあれば更新、なければ追加
    const existingOfferIndex = player.faState.offers.findIndex(o => o.teamId === teamId);
    const newOffer = { teamId, salary, years, date: turn };

    if (existingOfferIndex >= 0) {
        player.faState.offers[existingOfferIndex] = newOffer;
    } else {
        player.faState.offers.push(newOffer);
    }

    await dbManager.savePlayers(players);
  }

  /**
   * FAターンの処理 (CPUオファー、移籍決断)
   */
  static async processFATurn(gameState: GameState, turn: number): Promise<string[]> {
      const logs: string[] = [];
      const players = await dbManager.getInitialPlayers();
      const faPlayers = players.filter(p => p.team === 'free_agent' && p.faState?.negotiating);
      const teams = await dbManager.getInitialTeams();
      const date = Date.now();
      const newsItems: NewsItem[] = [];

      // チームごとのロースター状況を分析
      const teamRosterInfo = new Map<TeamId, { count: number, positions: Record<string, number>, maxAbility: Record<string, number> }>();
      
      for (const team of teams) {
          const roster = players.filter(p => p.team === team.id);
          const positions: Record<string, number> = {};
          const maxAbility: Record<string, number> = {};

          roster.forEach(p => {
              const pos = p.position;
              positions[pos] = (positions[pos] || 0) + 1;
              
              const ability = this.getAbilitySum(p);
              if (ability > (maxAbility[pos] || 0)) {
                  maxAbility[pos] = ability;
              }
          });
          
          // 既にオファー中の選手数をカウントして加算 (ロースター枠 + オファー数 <= 70)
          const offeringCount = faPlayers.filter(p => p.faState?.offers.some(o => o.teamId === team.id)).length;

          teamRosterInfo.set(team.id, { count: roster.length + offeringCount, positions, maxAbility });
      }

      for (const player of faPlayers) {
          if (!player.faState) continue;
          const playerAbility = this.getAbilitySum(player);

          // 1. CPU球団からのオファー (戦力状況に基づく)
          for (const team of teams) {
              if (team.id === gameState.selectedTeamId) continue; // ユーザーチームはスキップ

              const info = teamRosterInfo.get(team.id);
              if (!info) continue;

              // ロースター枠チェック (70人以上は獲得不可)
              if (info.count >= 70) continue;

              // 補強ニーズ判定
              let offerChance = 0.0;
              
              // ポジション不足判定
              const posCount = info.positions[player.position] || 0;
              if (player.position === 'P') {
                  if (posCount < 28) offerChance += 0.5; // 投手不足
                  else if (posCount < 32) offerChance += 0.2;
              } else {
                  if (posCount < 2) offerChance += 0.5; // 野手不足
                  else if (posCount < 3) offerChance += 0.2;
              }

              // 戦力アップ判定 (既存の最高戦力より強い、またはそれに準ずる)
              const maxAb = info.maxAbility[player.position] || 0;
              if (playerAbility > maxAb) offerChance += 0.4; // エース/4番候補
              else if (playerAbility > maxAb * 0.8) offerChance += 0.1; // 準レギュラー

              // 若手有望株 (25歳以下でそこそこの能力)
              if (player.age < 25 && playerAbility > 15) offerChance += 0.1;

              // バックアップ要員としての獲得 (戦力外選手救済)
              // 能力が一定以上(25)あり、まだオファーがない場合、低確率で獲得に動く
              if (playerAbility > 25 && player.faState.offers.length === 0) {
                  offerChance += 0.05;
              }

              // 既にオファー済みならスキップ
              const existingOfferIndex = player.faState.offers.findIndex(o => o.teamId === team.id);
              if (existingOfferIndex >= 0) continue;

              // 判定実行
              if (Math.random() < offerChance) {
                  // オファー作成
                  const baseSalary = player.contract?.salary || 1000;
                  // 評価が高いほど高額オファー
                  const salaryMultiplier = 0.8 + (playerAbility / 50) + Math.random() * 0.5; 
                  const offerSalary = Math.floor(baseSalary * salaryMultiplier);
                  const offerYears = playerAbility > 25 ? (Math.floor(Math.random() * 3) + 2) : (Math.floor(Math.random() * 2) + 1);

                  const newOffer = { teamId: team.id, salary: offerSalary, years: offerYears, date: turn };
                  player.faState.offers.push(newOffer);
                  
                  // 獲得予定としてカウントを増やす (このターンの乱獲防止)
                  info.count++;
              }
          }

          // 即決ロジック: 非常に良い条件があれば即決断
          if (player.faState.offers.length > 0) {
              const bestOffer = player.faState.offers.reduce((prev, current) => {
                  const prevScore = prev.salary * (1 + prev.years * 0.1);
                  const currentScore = current.salary * (1 + current.years * 0.1);
                  return currentScore > prevScore ? current : prev;
              });

              const currentSalary = player.contract?.salary || 1000;
              // 評価値が前年俸の2.5倍以上なら即決
              const bestScore = bestOffer.salary * (1 + bestOffer.years * 0.1);
              
              if (bestScore > currentSalary * 2.5) {
                  player.faState.decisionTurn = turn;
              }
          }

          // 2. 決断判定
          // 決断ターンが来た、または最終ターン(OFF_SEASON_TURNS)
          if (turn >= (player.faState.decisionTurn || OFF_SEASON_TURNS) || turn === OFF_SEASON_TURNS) {
              if (player.faState.offers.length > 0) {
                  // 最も良い条件を選択
                  // 評価値 = 年俸 * (1 + 年数 * 0.1)
                  // ※ 本来は球団の強さや地元なども考慮するが簡易実装
                  const bestOffer = player.faState.offers.reduce((prev, current) => {
                      const prevScore = prev.salary * (1 + prev.years * 0.1);
                      const currentScore = current.salary * (1 + current.years * 0.1);
                      return currentScore > prevScore ? current : prev;
                  });

                  // 移籍決定
                  player.team = bestOffer.teamId;
                  player.contract = {
                      salary: bestOffer.salary,
                      yearsRemaining: bestOffer.years,
                      totalYears: bestOffer.years,
                      expirationYear: 0 // 計算省略
                  };
                  player.faState.negotiating = false;
                  player.faState.decisionTurn = undefined; // クリーンアップ
                  player.faState.offers = []; // オファー履歴をクリア

                  logs.push(`${player.name} が ${bestOffer.teamId} に移籍決定 (年俸${bestOffer.salary}万 ${bestOffer.years}年)`);
                  
                  // FA選手と自由契約選手でニュースを分ける
                  const isFAPlayer = player.faState?.declared;
                  if(isFAPlayer) {
                    newsItems.push({
                      id: `fa_sign_${player.id}_${date}`,
                      date: date,
                      title: `FA移籍: ${player.name}`,
                      content: `${player.name}選手が${teams.find(t => t.id === bestOffer.teamId)?.name}への移籍を表明しました。\n契約条件: ${bestOffer.years}年 総額${bestOffer.salary * bestOffer.years}万円(推定)`,
                      type: 'contract',
                      affectedTeams: [bestOffer.teamId]
                    });
                  } else {
                    newsItems.push({
                      id: `released_sign_${player.id}_${date}`,
                      date: date,
                      title: `自由契約移籍: ${player.name}`,
                      content: `${player.name}選手が${teams.find(t => t.id === bestOffer.teamId)?.name}への移籍を表明しました。\n契約条件: ${bestOffer.years}年 総額${bestOffer.salary * bestOffer.years}万円(推定)`,
                      type: 'contract',
                      affectedTeams: [bestOffer.teamId]
                    });
                  }
              } else if (turn === OFF_SEASON_TURNS) {
                  // オファーなしで期間終了 -> 自由契約継続 (来シーズンも無所属、または引退？)
                  // ここでは何もしない (free_agentのまま)
                  logs.push(`${player.name} は所属先が決まりませんでした`);
              }
          }
      }

      if (newsItems.length > 0) {
          await dbManager.savePlayers(players);
          await dbManager.addNews(newsItems);
      } else if (faPlayers.length > 0) {
          // オファー情報の更新だけでも保存
          await dbManager.savePlayers(players);
      }

      return logs;
  }

  /**
   * 未所属選手の引退処理 (シーズン移行時)
   */
  static async retireUnsignedPlayers(): Promise<string[]> {
    const logs: string[] = [];
    const players = await dbManager.getInitialPlayers();
    const unsignedPlayers = players.filter(p => p.team === 'free_agent');

    if (unsignedPlayers.length > 0) {
        logs.push(`[引退] 所属先が決まらなかった以下の選手が引退します: ${unsignedPlayers.map(p => p.name).join(', ')}`);
        await dbManager.removePlayers(unsignedPlayers.map(p => p.id));
        
        // ニュース追加
        const date = Date.now();
        await dbManager.addNews([{
            id: `retired_unsigned_${date}`,
            date: date,
            title: "未所属選手 引退",
            content: `所属先が決まらなかった以下の選手が引退を表明しました。\n${unsignedPlayers.map(p => `${p.name} (${p.position}・${p.age}歳)`).join('\n')}`,
            type: 'contract',
            affectedTeams: []
        }]);
    }

    return logs;
  }
}
