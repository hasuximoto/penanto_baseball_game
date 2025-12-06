import { GameState, GameResult, GameStatus, TeamId, AtBatResult, Player, PlayerStats, PlayerGameStats, GameDetails } from '../types';
import { dbManager as databaseManager } from './databaseManager';
import { rosterManager } from './rosterManager';
import { calculateAtBatProbabilities } from './formulaCalculations';
import { getGameDateString } from '../utils/dateUtils';

/**
 * GameEngine - ゲーム実行のメインエンジン
 * VBA の 試合実行() から変換
 * 試合aシートのロジックを参考に、確率ベースのシミュレーションを実装
 */
export class GameEngine {
  
  private leagueAverages: Record<string, { fielding: number, arm: number, speed: number }> | null = null;
  private lastCalculatedSeason: number | null = null;

  /**
   * リーグ全体の1日分の試合をシミュレート
   */
  async simulateLeagueDay(gameState: GameState, saveDetails: boolean = true): Promise<GameResult[]> {
    // 週次更新 (月曜日の試合前)
    await rosterManager.processWeeklyUpdates(gameState);

    // リーグ平均能力値を取得 (キャッシュがない場合、またはシーズンが変わった場合)
    if (!this.leagueAverages || this.lastCalculatedSeason !== gameState.season) {
        console.log(`Recalculating league averages for season ${gameState.season}...`);
        this.leagueAverages = await databaseManager.getLeagueAverageAbilities();
        this.lastCalculatedSeason = gameState.season;
    }

    const results: GameResult[] = [];
    const dateStr = getGameDateString(gameState.currentDate, gameState.season);
    
    // スケジュール全体を取得して、試合済みフラグを管理する
    const fullSchedule = await databaseManager.getSchedule();
    let scheduleUpdated = false;
    
    // 今日の試合を抽出 (インデックスを保持するため、fullScheduleを走査)
    const todaysGamesIndices: number[] = [];
    fullSchedule.forEach((g: any, i: number) => {
        if (g.date === dateStr) {
            todaysGamesIndices.push(i);
        }
    });
    
    if (todaysGamesIndices.length === 0) {
        console.log(`No games scheduled for ${dateStr} (Day ${gameState.currentDate})`);
        // 試合がない日も疲労回復などは行う
    } else {
        console.log(`Found ${todaysGamesIndices.length} games for ${dateStr}`);
        for (const index of todaysGamesIndices) {
            const game = fullSchedule[index];
            
            // 既に試合済みの場合はスキップ (重複防止)
            if (game.played) {
                console.log(`Game ${game.home} vs ${game.away} already played. Skipping.`);
                continue;
            }

            const result = await this.simulateGame(game.home as TeamId, game.away as TeamId, gameState);
            // スケジュールから試合タイプを引き継ぐ
            result.type = game.type || 'regular';
            results.push(result);
            
            // 試合済みフラグを立てる
            fullSchedule[index].played = true;
            scheduleUpdated = true;
        }
        
        // スケジュール更新を保存
        if (scheduleUpdated) {
            await databaseManager.updateSchedule(fullSchedule);
        }
    }

    // Batch update stats for performance
    if (results.length > 0) {
        await databaseManager.updateStatsBatch(results);

        // Save history (strip details if requested or for non-user games to save space)
        for (const result of results) {
          // ユーザーのチームの試合のみ詳細を保存する (容量節約のため)
          // saveDetailsがfalseの場合は強制的に詳細なし
          const isUserGame = gameState.selectedTeamHuman && (result.homeTeam === gameState.selectedTeamHuman || result.awayTeam === gameState.selectedTeamHuman);
          const shouldSaveDetails = saveDetails && isUserGame;

          const resultForHistory = shouldSaveDetails ? result : { ...result, details: undefined };
          
          try {
            await databaseManager.saveGameHistory(resultForHistory);
          } catch (e) {
            console.warn('Failed to save game history (likely full), skipping...', e);
          }
        }
    }

    // 全試合終了後、疲労回復
    await databaseManager.recoverDailyFatigue();

    // ロスター管理 (一軍・二軍入れ替え)
    await rosterManager.processDailyMoves(gameState);

    return results;
  }

  /**
   * ゲーム実行メイン関数
   * VBA: Sub 実行()
   */
  async executeGame(gameState: GameState): Promise<GameResult> {
    // 1. 検証
    if (gameState.gameStatus !== 'after') {
      throw new Error('試合は試前に行われます');
    }

    if (!gameState.playableFlags.canPlayGame) {
      throw new Error('チームはまだ選択されていません');
    }

    // 2. チーム検証
    if (!gameState.selectedTeamId) {
      throw new Error('チームが選択されていません');
    }

    // 3. 試合シミュレーション
    // 対戦相手をランダムに決定 (自分以外)
    const teams = await databaseManager.getInitialTeams();
    const opponents = teams.filter(t => t.id !== gameState.selectedTeamId).map(t => t.id);
    const awayTeamId = opponents[Math.floor(Math.random() * opponents.length)] as TeamId;

    const result = await this.simulateGame(gameState.selectedTeamId, awayTeamId, gameState);

    // 4. 結果を返す
    return result;
  }

  /**
   * 試合シミュレーション
   * VBA: Sub 試合実行()
   */
  private async simulateGame(homeTeamId: TeamId, awayTeamId: TeamId, gameState: GameState): Promise<GameResult> {
    let homeScore = 0;
    let awayScore = 0;
    const plays: any[] = [];

    // データベースからロスター取得 (失敗時はダミーデータ)
    let homeRoster = await databaseManager.getTeamRoster(homeTeamId);
    let awayRoster = await databaseManager.getTeamRoster(awayTeamId);

    // 一軍登録選手のみにフィルタリング
    // (registrationStatus が未設定の場合は全員一軍扱いとするが、rosterManager が初期化するはず)
    let activeHomeRoster = homeRoster.filter(p => p.registrationStatus === 'active' || !p.registrationStatus);
    let activeAwayRoster = awayRoster.filter(p => p.registrationStatus === 'active' || !p.registrationStatus);

    // 安全策: 一軍が極端に少ない、または投手がいない場合は全ロスターを使用（試合成立優先）
    if (activeHomeRoster.length < 9 || !activeHomeRoster.some(p => p.position === 'P')) {
        activeHomeRoster = homeRoster;
    }
    if (activeAwayRoster.length < 9 || !activeAwayRoster.some(p => p.position === 'P')) {
        activeAwayRoster = awayRoster;
    }

    homeRoster = activeHomeRoster;
    awayRoster = activeAwayRoster;

    if (homeRoster.length === 0) homeRoster = this.createDummyRoster(homeTeamId);
    if (awayRoster.length === 0) awayRoster = this.createDummyRoster(awayTeamId);

    // スタッツ初期化
    const homeBattingStats = this.initializeGameStats(homeRoster);
    const awayBattingStats = this.initializeGameStats(awayRoster);
    // 投手成績も全ロスターで初期化（野手登板対応）
    const homePitchingStats = this.initializeGameStats(homeRoster);
    const awayPitchingStats = this.initializeGameStats(awayRoster);

    // スターティングラインナップと先発投手を取得
    let { batters: homeLineup, pitcher: homeStarter } = await databaseManager.getStartingLineup(homeTeamId, homeRoster, gameState.currentDate);
    let { batters: awayLineup, pitcher: awayStarter } = await databaseManager.getStartingLineup(awayTeamId, awayRoster, gameState.currentDate);

    // --- ローテーション適用 (火～日) ---
    const dateStr = getGameDateString(gameState.currentDate, gameState.season);
    const dayOfWeek = new Date(dateStr).getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    // 火(2) -> 0, 水(3) -> 1, ..., 土(6) -> 4, 日(0) -> 5
    let rotationIndex = -1;
    if (dayOfWeek >= 2) rotationIndex = dayOfWeek - 2;
    else if (dayOfWeek === 0) rotationIndex = 5;

    if (rotationIndex !== -1) {
        // Home Team Rotation
        const homeStarters = homeRoster.filter(p => p.pitcherRole === 'starter');
        // ソート (rosterManagerと同じロジックで)
        homeStarters.sort((a, b) => this.evaluatePitcherForRotation(b) - this.evaluatePitcherForRotation(a));
        if (homeStarters[rotationIndex]) {
            homeStarter = homeStarters[rotationIndex];
        }

        // Away Team Rotation
        const awayStarters = awayRoster.filter(p => p.pitcherRole === 'starter');
        awayStarters.sort((a, b) => this.evaluatePitcherForRotation(b) - this.evaluatePitcherForRotation(a));
        if (awayStarters[rotationIndex]) {
            awayStarter = awayStarters[rotationIndex];
        }
    }

    // 安全策: 先発投手がいない場合
    if (!homeStarter) homeStarter = homeRoster.find(p => p.position === 'P') || homeRoster[0];
    if (!awayStarter) awayStarter = awayRoster.find(p => p.position === 'P') || awayRoster[0];

    let homePitcher = homeStarter;
    let awayPitcher = awayStarter;

    // 登板順カウンター
    const homePitchingCounter = { value: 1 };
    const awayPitchingCounter = { value: 1 };

    // 先発投手の登板順を記録
    const homeStarterStat = homePitchingStats.find(s => s.playerId === homeStarter.id);
    if (homeStarterStat) {
        homeStarterStat.pitchingOrder = homePitchingCounter.value++;
        homeStarterStat.isStarter = true;
    }

    const awayStarterStat = awayPitchingStats.find(s => s.playerId === awayStarter.id);
    if (awayStarterStat) {
        awayStarterStat.pitchingOrder = awayPitchingCounter.value++;
        awayStarterStat.isStarter = true;
    }

    // 打順をスタッツに記録
    homeLineup.forEach((p, i) => {
      const stat = homeBattingStats.find(s => s.playerId === p.id);
      if (stat) {
        stat.order = i + 1;
        stat.position = p.position; // スタメンのポジション（DH含む）を反映
        stat.isStarter = true;
      }
    });
    awayLineup.forEach((p, i) => {
      const stat = awayBattingStats.find(s => s.playerId === p.id);
      if (stat) {
        stat.order = i + 1;
        stat.position = p.position; // スタメンのポジション（DH含む）を反映
        stat.isStarter = true;
      }
    });

    let homeBatterIndex = 0;
    let awayBatterIndex = 0;

    const homeLineScore: number[] = [];
    const awayLineScore: number[] = [];

    // 勝利・敗戦投手の候補追跡用
    let winningPitcherCandidate: Player | null = null;
    let losingPitcherCandidate: Player | null = null;
    let currentLead: 'home' | 'away' | 'tie' = 'tie';

    const updateDecisions = (hScore: number, aScore: number, hPitcher: Player, aPitcher: Player) => {
        const newLead = hScore > aScore ? 'home' : (aScore > hScore ? 'away' : 'tie');
        if (newLead !== currentLead) {
            if (newLead === 'home') {
                // Home took the lead: Home Pitcher (waiting) wins, Away Pitcher (just pitched) loses
                winningPitcherCandidate = hPitcher;
                losingPitcherCandidate = aPitcher;
            } else if (newLead === 'away') {
                // Away took the lead: Away Pitcher (waiting) wins, Home Pitcher (just pitched) loses
                winningPitcherCandidate = aPitcher;
                losingPitcherCandidate = hPitcher;
            } else {
                // Tied
                winningPitcherCandidate = null;
                losingPitcherCandidate = null;
            }
            currentLead = newLead;
        }
    };

    // 交代した選手を追跡
    const removedPlayerIds = new Set<string | number>();

    // 12 イニング分ループ (延長戦含む)
    for (let inning = 1; inning <= 12; inning++) {
      // 9回終了時、または延長戦で決着がついている場合は終了
      if (inning > 9 && homeScore !== awayScore) {
        break;
      }

      // トップ・オブ・イニング（アウェイチーム打席 vs ホーム投手）
      const topHalf = await this.simulateHalfInning(
        inning, 'top', awayLineup, homeLineup, homePitcher, awayBatterIndex, 
        awayBattingStats, homePitchingStats, homeBattingStats, 
        homeRoster, homeStarter.id, homePitchingCounter,
        removedPlayerIds, homeScore - awayScore
      );
      awayScore += topHalf.runs;
      awayLineScore.push(topHalf.runs);
      awayBatterIndex = topHalf.nextBatterIndex;
      homePitcher = topHalf.endPitcher; // 投手更新
      plays.push(...topHalf.plays);

      // Update decisions after Top Half
      updateDecisions(homeScore, awayScore, homePitcher, awayPitcher);

      // ボトム・オブ・イニング（ホームチーム打席 vs アウェイ投手）
      // 9回裏以降、後攻が勝っている場合は裏を行わない（サヨナラではない通常の勝利）
      if (inning >= 9 && homeScore > awayScore) {
        homeLineScore.push(-1); // X表示用 (UI側で処理)
      } else {
        const bottomHalf = await this.simulateHalfInning(
          inning, 'bottom', homeLineup, awayLineup, awayPitcher, homeBatterIndex, 
          homeBattingStats, awayPitchingStats, awayBattingStats, 
          awayRoster, awayStarter.id, awayPitchingCounter,
          removedPlayerIds, awayScore - homeScore
        );
        homeScore += bottomHalf.runs;
        homeLineScore.push(bottomHalf.runs);
        homeBatterIndex = bottomHalf.nextBatterIndex;
        awayPitcher = bottomHalf.endPitcher; // 投手更新
        plays.push(...bottomHalf.plays);

        // Update decisions after Bottom Half
        updateDecisions(homeScore, awayScore, homePitcher, awayPitcher);
      }
      
      // サヨナラゲーム判定 (9回裏以降終了時、後攻が勝っていれば終了)
      if (inning >= 9 && homeScore > awayScore) {
        break; 
      }
    }

    // 勝利・敗戦・セーブ投手の決定
    let winningPitcherId: string | number | null = null;
    let losingPitcherId: string | number | null = null;
    let savePitcherId: string | number | null = null;

    if (currentLead !== 'tie' && winningPitcherCandidate && losingPitcherCandidate) {
        winningPitcherId = (winningPitcherCandidate as Player).id;
        losingPitcherId = (losingPitcherCandidate as Player).id;

        // 先発投手の勝利条件チェック (5回以上)
        const isHomeWin = currentLead === 'home';
        const winnerStats = isHomeWin ? homePitchingStats : awayPitchingStats;
        const starterId = isHomeWin ? homeStarter.id : awayStarter.id;
        
        if (winningPitcherId === starterId) {
            const starterStat = winnerStats.find(s => s.playerId === starterId);
            // 5回未満なら権利剥奪
            if (starterStat && (starterStat.inningsPitched || 0) < 5) {
                // 次に投げた投手に権利を移す (簡易ロジック)
                const nextPitcher = winnerStats.find(s => s.pitchingOrder === (starterStat.pitchingOrder || 0) + 1);
                if (nextPitcher) {
                    winningPitcherId = nextPitcher.playerId;
                } else {
                    // いなければ最後に投げた投手
                    winningPitcherId = isHomeWin ? homePitcher.id : awayPitcher.id;
                }
            }
        }

        // セーブ判定
        const closingPitcherId = isHomeWin ? homePitcher.id : awayPitcher.id;
        if (closingPitcherId !== winningPitcherId) {
             const closerStats = winnerStats.find(s => s.playerId === closingPitcherId);
             if (closerStats) {
                 const scoreDiff = Math.abs(homeScore - awayScore);
                 const ip = closerStats.inningsPitched || 0;
                 // 条件: 3点差以内かつ1回以上、または3回以上
                 if ((scoreDiff <= 3 && ip >= 1) || ip >= 3) {
                     savePitcherId = closingPitcherId;
                 }
             }
        }
    }

    // Stats反映
    const applyPitcherResult = (stats: PlayerGameStats[], pid: string | number | null, field: 'wins' | 'losses' | 'saves') => {
        if (!pid) return;
        const s = stats.find(stat => stat.playerId === pid);
        if (s) s[field] = 1;
    };

    applyPitcherResult(homePitchingStats, winningPitcherId, 'wins');
    applyPitcherResult(awayPitchingStats, winningPitcherId, 'wins');
    applyPitcherResult(homePitchingStats, losingPitcherId, 'losses');
    applyPitcherResult(awayPitchingStats, losingPitcherId, 'losses');
    applyPitcherResult(homePitchingStats, savePitcherId, 'saves');
    applyPitcherResult(awayPitchingStats, savePitcherId, 'saves');

    // 完投・完封・QSの判定
    const checkPitcherAchievements = (stats: PlayerGameStats[], opponentScore: number) => {
        stats.forEach(s => {
            if (s.isStarter) {
                // 完投: 9回以上投げた (簡易判定: 交代していない)
                // 注意: 延長戦やコールドゲームを考慮すると inningsPitched >= ゲームイニング数 が正確だが、
                // ここでは inningsPitched >= 9 または (inningsPitched >= ゲーム終了イニング && 交代なし) とする
                // 浮動小数点誤差を考慮して少し余裕を持たせる
                const innings = s.inningsPitched || 0;
                const gameInnings = homeLineScore.length;
                
                if (innings >= gameInnings - 0.1) {
                    s.completeGame = true;
                    if (opponentScore === 0) {
                        s.shutout = true;
                    }
                }

                // QS: 6回以上投げ、自責点3以下
                if ((s.inningsPitched || 0) >= 6 && (s.earnedRuns || 0) <= 3) {
                    s.qualityStart = true;
                }
            }
        });
    };

    checkPitcherAchievements(homePitchingStats, awayScore);
    checkPitcherAchievements(awayPitchingStats, homeScore);

    // MVP の決定
    const mvp = this.determineMVP(plays, homeScore, awayScore, homeRoster, awayRoster);

    // フィルタリング条件: 打席に立った、投球した、または打順が設定されている(出場した)選手
    const filterParticipated = (s: PlayerGameStats) => 
        s.atBats > 0 || (s.inningsPitched || 0) > 0 || s.order !== undefined || s.plateAppearances > 0;

    const details: GameDetails = {
      homeBatting: homeBattingStats.filter(filterParticipated),
      awayBatting: awayBattingStats.filter(filterParticipated),
      homePitching: homePitchingStats.filter(s => (s.inningsPitched || 0) > 0),
      awayPitching: awayPitchingStats.filter(s => (s.inningsPitched || 0) > 0),
    };

    return {
      id: `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: gameState.currentDate,
      season: gameState.season,
      homeTeam: homeTeamId,
      awayTeam: awayTeamId,
      homeScore,
      awayScore,
      innings: homeLineScore.length,
      status: 'completed',
      mvp: mvp ? { playerId: mvp.id, playerName: mvp.name } : undefined,
      details,
      lineScore: {
        home: homeLineScore,
        away: awayLineScore
      }
    };
  }

  private initializeGameStats(roster: Player[]): PlayerGameStats[] {
    return roster.map(p => ({
      playerId: p.id,
      playerName: p.name,
      position: p.position,
      plateAppearances: 0,
      atBats: 0,
      hits: 0,
      doubles: 0,
      triples: 0,
      homeRuns: 0,
      runs: 0,
      rbi: 0,
      walks: 0,
      hitByPitch: 0,
      sacrificeBunts: 0,
      sacrificeFlies: 0,
      strikeouts: 0,
      stolenBases: 0,
      caughtStealing: 0,
      doublePlays: 0,
      errors: 0,
      inningsPitched: 0,
      earnedRuns: 0,
      pitchingStrikeouts: 0,
      pitchingWalks: 0,
      pitchingHits: 0,
      pitchingHomeRuns: 0,
      pitchingHitByPitch: 0,
      wins: 0,
      losses: 0,
      saves: 0,
      isStarter: false,
      completeGame: false,
      shutout: false,
      qualityStart: false,
      pitchCount: 0,
      atBatDetails: []
    }));
  }

  /**
   * 守備固めの交代チェック
   * 試合終盤(7回以降)でリードしている場合、守備力の低い選手や適正外の選手を交代する
   */
  private checkDefensiveSubstitution(
    defenseLineup: Player[],
    defenseBattingStats: PlayerGameStats[],
    roster: Player[],
    removedPlayerIds: Set<string | number>,
    inning: number,
    lead: number
  ): any[] {
    const plays: any[] = [];
    // 7回以降かつリードしている(または同点)場合のみ
    if (inning < 7 || lead < 0) return plays;

    const posMap: Record<string, string> = {
        'C': 'catcher', '1B': 'first', '2B': 'second', '3B': 'third',
        'SS': 'short', 'LF': 'outfield', 'CF': 'outfield', 'RF': 'outfield'
    };

    // 現在のラインナップにいる選手のID
    const currentLineupIds = new Set(defenseLineup.map(p => p.id));

    // 各ポジションについてチェック
    // defenseLineup は打順順だが、positionプロパティで守備位置を判断
    for (let i = 0; i < defenseLineup.length; i++) {
        const player = defenseLineup[i];
        const pos = player.position;

        // 投手とDHは対象外
        if (pos === 'P' || pos === 'DH') continue;

        const aptitudeKey = posMap[pos];
        if (!aptitudeKey) continue;

        const aptitude = player.aptitudes ? (player.aptitudes[aptitudeKey as keyof typeof player.aptitudes] || 0) : 0;
        const fielding = player.abilities.fielding || 0;
        const arm = player.abilities.arm || 0;

        // 交代条件:
        // 1. 適性が低い (3未満)
        // 2. 守備力が低い (10未満) かつ 接戦(3点差以内)
        // 3. 適性が全くない (0)
        let needsSub = false;
        if (aptitude < 3) needsSub = true;
        if (fielding < 10 && lead <= 3) needsSub = true;
        if (aptitude === 0) needsSub = true;

        if (needsSub) {
            // 控え選手から候補を探す
            const candidates = roster.filter(p => 
                !currentLineupIds.has(p.id) && 
                !removedPlayerIds.has(p.id) &&
                p.position !== 'P' // 投手は除外
            );

            // 候補を評価
            let bestCandidate: Player | null = null;
            let maxScore = -1;

            for (const candidate of candidates) {
                const cApt = candidate.aptitudes ? (candidate.aptitudes[aptitudeKey as keyof typeof candidate.aptitudes] || 0) : 0;
                // 適性が低い選手は除外
                if (cApt < 3) continue;

                const cFielding = candidate.abilities.fielding || 0;
                const cArm = candidate.abilities.arm || 0;

                // 現在の選手より守備が良いこと
                if (cFielding <= fielding) continue;

                const score = cApt * 2 + cFielding + cArm * 0.5;
                if (score > maxScore) {
                    maxScore = score;
                    bestCandidate = candidate;
                }
            }

            if (bestCandidate) {
                // 交代実行
                removedPlayerIds.add(player.id);
                currentLineupIds.add(bestCandidate.id); // 重複防止
                currentLineupIds.delete(player.id);
                
                // ポジションを引き継ぐ
                const newPlayer = { ...bestCandidate, position: pos };
                defenseLineup[i] = newPlayer;

                // スタッツ情報の更新 (打順などを引き継ぐ)
                const oldPlayerStat = defenseBattingStats.find(s => s.playerId === player.id);
                const newPlayerStat = defenseBattingStats.find(s => s.playerId === bestCandidate!.id);
                
                if (newPlayerStat && oldPlayerStat) {
                    newPlayerStat.order = oldPlayerStat.order;
                    newPlayerStat.position = pos;
                }

                plays.push({
                    inning,
                    type: 'substitution',
                    description: `守備交代: ${player.name} -> ${newPlayer.name} (守備位置: ${pos})`
                });
            }
        }
    }
    return plays;
  }

  /**
   * 代打チェック
   */
  private checkPinchHitter(
    currentBatter: Player,
    roster: Player[],
    removedPlayerIds: Set<string | number>,
    inning: number,
    scoreDiff: number, // 自分のチーム - 相手チーム
    runners: { occupied: boolean }[],
    outs: number,
    lineup: Player[]
  ): Player | null {
    // 7回以降
    if (inning < 7) return null;
    
    // 負けているか同点、または僅差(1点リード)でダメ押し
    // 基本はビハインド展開で攻撃的交代
    if (scoreDiff > 1) return null; // 2点以上リードなら代打出さない(守備固め優先)

    // チャンス判定: 得点圏にランナーがいるか
    const isChance = runners[1].occupied || runners[2].occupied;
    
    // 代打を出す条件:
    // 1. 投手が打席 (DHなしの場合) -> 常に代打 (ただしスタミナ残ってて好投中は除く...今回は簡易化して投手は交代)
    // 2. 打力が低い選手 (打率.250未満かつパワー12未満) で、チャンス時
    // 3. 9回裏などで一発が欲しい時

    let needsPinchHitter = false;

    // 投手なら代打 (DH制なら投手は打席に立たないはずだが、念のため)
    if (currentBatter.position === 'P') {
        // 僅差リードで投手が好投している場合は続投させたいが、ここでは攻撃優先で交代
        needsPinchHitter = true;
    } else {
        // 野手の場合
        const contact = currentBatter.abilities.contact || 0;
        const power = currentBatter.abilities.power || 0;
        
        // 貧打の選手 (基準: ミート10未満かつパワー12未満)
        if (contact < 10 && power < 12) {
            // チャンスなら代打
            if (isChance) needsPinchHitter = true;
            // 終盤(8回以降)で負けていれば代打
            if (inning >= 8 && scoreDiff < 0) needsPinchHitter = true;
        }
    }

    if (!needsPinchHitter) return null;

    // 現在出場中の選手ID
    const currentLineupIds = new Set(lineup.map(p => p.id));

    // 代打候補を探す
    // ベンチ入り(removedでない、現在出場中でない)選手から、打撃力の高い選手を選ぶ
    const candidates = roster.filter(p => 
        !currentLineupIds.has(p.id) && 
        !removedPlayerIds.has(p.id) &&
        p.position !== 'P' // 投手は代打に出さない
    );

    if (candidates.length === 0) return null;

    // 評価関数: ミート重視かパワー重視か
    // チャンスならミート重視、一発狙いならパワー重視だが、総合力で選ぶ
    let bestCandidate: Player | null = null;
    let maxScore = -1;

    for (const candidate of candidates) {
        const cContact = candidate.abilities.contact || 0;
        const cPower = candidate.abilities.power || 0;

        // 代打適性 (もしあれば)
        // ここでは単純に打撃能力で評価
        // チャンス時はミートの重みを増やす
        let score = 0;
        if (isChance) {
            score = cContact * 2 + cPower;
        } else {
            score = cContact + cPower * 2;
        }

        if (score > maxScore) {
            maxScore = score;
            bestCandidate = candidate;
        }
    }

    // 現在の打者より能力が高ければ交代
    if (bestCandidate) {
        const currentScore = isChance 
            ? (currentBatter.abilities.contact || 0) * 2 + (currentBatter.abilities.power || 0)
            : (currentBatter.abilities.contact || 0) + (currentBatter.abilities.power || 0) * 2;
        
        // 投手の場合は無条件交代、野手の場合は能力比較
        if (currentBatter.position === 'P' || maxScore > currentScore) {
            return bestCandidate;
        }
    }

    return null;
  }

  /**
   * 代走チェック
   */
  private checkPinchRunner(
    runners: { occupied: boolean, isEarned: boolean, playerId?: string | number }[],
    roster: Player[],
    removedPlayerIds: Set<string | number>,
    inning: number,
    scoreDiff: number,
    battingStats: PlayerGameStats[],
    lineup: Player[]
  ): any[] {
    const plays: any[] = [];
    // 8回以降、僅差(2点差以内)
    if (inning < 8 || Math.abs(scoreDiff) > 2) return plays;

    // 現在出場中の選手ID
    const currentLineupIds = new Set(lineup.map(p => p.id));

    // 各ランナーについてチェック
    for (let i = 0; i < runners.length; i++) {
        const runner = runners[i];
        if (!runner.occupied || !runner.playerId) continue;

        // ランナーの選手データを取得
        // rosterから探す (battingStatsから探すと能力値がわからないため)
        const runnerPlayer = roster.find(p => p.id === runner.playerId);
        if (!runnerPlayer) continue;

        // 走力が低い場合 (10未満)
        const speed = runnerPlayer.abilities.speed || 0;
        if (speed < 10) {
            // 代走候補を探す
            const candidates = roster.filter(p => 
                !currentLineupIds.has(p.id) && 
                !removedPlayerIds.has(p.id) &&
                p.position !== 'P'
            );

            let bestCandidate: Player | null = null;
            let maxSpeed = speed; // 現在の走力より高いことが条件

            for (const candidate of candidates) {
                const cSpeed = candidate.abilities.speed || 0;
                if (cSpeed > maxSpeed) {
                    maxSpeed = cSpeed;
                    bestCandidate = candidate;
                }
            }

            if (bestCandidate) {
                // 代走実行
                removedPlayerIds.add(runnerPlayer.id);
                removedPlayerIds.add(bestCandidate.id);
                
                // ランナー入れ替え
                runner.playerId = bestCandidate.id;
                
                // ラインナップの入れ替えも必要 (打順が回ってきたときのため)
                // runnerPlayer が lineup のどこにいるか探す
                const lineupIndex = lineup.findIndex(p => p.id === runnerPlayer.id);
                if (lineupIndex !== -1) {
                    lineup[lineupIndex] = bestCandidate;
                    
                    // スタッツ更新
                    const newStat = battingStats.find(s => s.playerId === bestCandidate!.id);
                    if (newStat) {
                        newStat.order = lineupIndex + 1;
                        newStat.position = 'PR'; // 代走
                        newStat.stolenBases = 0; // 初期化
                        newStat.caughtStealing = 0;
                    }
                }

                plays.push({
                    inning,
                    type: 'substitution',
                    description: `代走: ${runnerPlayer.name} -> ${bestCandidate.name}`
                });
                
                // 1イニングに1回だけ代走 (複数同時は複雑になるので)
                break;
            }
        }
    }
    
    return plays;
  }

  /**
   * 投手交代が必要かチェックする
   * SimBaseBall.xml のロジックを再現
   * 交代条件: ベンチ投手の評価値 > 現在の投手のスタミナ上限
   * ベンチ評価値 = ベンチ投手のスタミナ / (現在の投手の残りスタミナ/10 + 1)
   */
  private checkPitcherChange(
    currentPitcher: Player,
    pitcherStats: PlayerGameStats[],
    inning: number,
    currentInningRuns: number,
    roster: Player[],
    gameStarterId: string,
    lead: number = 0
  ): Player | null {
    const stat = pitcherStats.find(s => s.playerId === currentPitcher.id);
    if (!stat) return null;

    // スタミナ値を投球数に換算
    // 先発投手: x9.5 (完投抑制のため少し下げる。スタミナ15->127.5球, スタミナ10->85球)
    // リリーフ: x3 (平均スタミナ7.88 -> 24球 = 1.5回, スタミナ5 -> 15球 = 1回)
    const isStarter = currentPitcher.id === gameStarterId;
    const multiplier = isStarter ? 8.5 : 3;

    // データ不整合対策: スタミナ上限を15とする (15以上は15として扱う)
    const rawStamina = Math.min(currentPitcher.abilities.stamina || 10, 15);
    const maxStamina = rawStamina * multiplier;
    
    // 疲労度計算 (実球数があれば使用、なければ推定)
    let currentPitchCount = stat.pitchCount || 0;
    if (currentPitchCount === 0) {
        // 推定
        currentPitchCount = (stat.inningsPitched || 0) * 15 + 
                            (stat.pitchingHits || 0) * 5 + 
                            (stat.pitchingWalks || 0) * 5;
    }
    
    // 残りスタミナ (投球数ベース)
    const currentStaminaPitches = maxStamina - currentPitchCount;
    
    // スタミナ係数 (Excel数式の分母: VLOOKUP(181)/10 + 1 に相当)
    // VLOOKUP(181) は生のスタミナ値(0-15)を指すため、投球数から逆変換して計算
    const currentStaminaRaw = currentStaminaPitches / multiplier;
    const staminaFactor = Math.max(0.1, (currentStaminaRaw / 10) + 1);

    // 交代条件2: 炎上 (このイニング5失点以上、または合計8失点以上)
    const isExploded = currentInningRuns >= 5 || (stat.earnedRuns || 0) >= 8;

    // --- 完投・完封ペース判定 ---
    // 先発投手で、9回以降、リードしていて、炎上していない場合
    if (isStarter && inning >= 9 && lead > 0 && !isExploded) {
        const earnedRuns = stat.earnedRuns || 0;
        const isShutoutPace = earnedRuns === 0;
        
        // 許容球数 (通常より多めに設定)
        let limit = 115;
        if (isShutoutPace) limit += 10; // 完封ペースなら135球まで
        
        // 球数が許容範囲内で、疲労が極端でなければ続投
        if (currentPitchCount < limit && (currentPitcher.fatigue || 0) < 30) {
             return null; 
        }
    }

    // リリーフ候補を探す (ベンチ入り投手で、まだ登板していない選手)
    const usedPitcherIds = new Set(pitcherStats.filter(s => s.inningsPitched && s.inningsPitched > 0).map(s => s.playerId));
    usedPitcherIds.add(currentPitcher.id);

    // --- 抑え投手判定 ---
    // セーブシチュエーション: 3点差以内のリード、9回以降
    const isSaveSituation = lead > 0 && lead <= 3 && inning >= 9;
    
    if (isSaveSituation) {
        // 現在の投手が抑えなら、炎上していない限り続投
        if (currentPitcher.pitcherRole === 'closer') {
             if (!isExploded) return null;
        } else {
            // 抑え投手を優先的に探す
            const closer = roster.find(p => p.pitcherRole === 'closer' && !usedPitcherIds.has(p.id));
            // 疲労が溜まりすぎていなければ投入
            if (closer && (closer.fatigue || 0) < 20) {
                return closer;
            }
        }
    }

    // 交代条件3: 終盤の疲労考慮
    let fatiguePenalty = 0;
    if (inning >= 7) {
        if (!isStarter && (stat.inningsPitched || 0) >= 1) {
             // 回跨ぎリリーフ: 評価値を下げて交代を促す
             fatiguePenalty = 50;
        } else if (isStarter) {
             // 先発も7回以降は交代しやすくする (完投抑制)
             // 球数が100を超えていたら交代圧力を強める
             if (currentPitchCount > 100) {
                 fatiguePenalty = 40; 
             } else {
                 fatiguePenalty = 20;
             }
             
             // 8回以降はさらに厳しくして、完投を減らす
             if (inning >= 8) {
                 fatiguePenalty += 30;
             }
        }
    }

    // チームIDを特定
    const teamId = roster.length > 0 ? roster[0].team : null;
    
    // ローテーション投手を特定（リリーフ登板させないため）
    // let rotationPlayerIds: (string | number)[] = []; // 不要

    const reliefCandidates = roster.filter(p => 
      p.position === 'P' && 
      !usedPitcherIds.has(p.id) &&
      p.pitcherRole !== 'starter' // 先発投手はリリーフ登板しない
    );

    let bestRelief: Player | null = null;
    let maxReliefScore = -1;

    for (const relief of reliefCandidates) {
        // 疲労度チェック: 疲労が溜まっている投手は避ける
        // 疲労度8以上は登板回避 (緊急時を除く)
        if ((relief.fatigue || 0) >= 10 && !isExploded) continue;

        // ベンチ投手のスタミナも投球数換算 (リリーフなので x3)
        const reliefRawStamina = Math.min(relief.abilities.stamina || 10, 15);
        const reliefStamina = reliefRawStamina * 3;
        
        // ベンチ投手の評価値計算
        // 疲労度によるペナルティ: 疲労度1につき評価15%ダウン (疲労していると選ばれにくくする)
        const fatigueFactor = 1 - Math.min(0.9, (relief.fatigue || 0) * 0.15);
        
        // 登板過多の抑制: 既に多く投げている投手は優先度を下げる
        const gamesPitched = relief.stats?.gamesPitched || 0;
        const usageFactor = gamesPitched > 50 ? 0.7 : 1.0; // 50試合超えたら抑制

        const score = (reliefStamina / staminaFactor) * fatigueFactor * usageFactor;
        
        if (score > maxReliefScore) {
            maxReliefScore = score;
            bestRelief = relief;
        }
    }

    // 判定: ベンチ投手の最高評価値が、現在の投手の最大スタミナを超えたら交代
    // 回跨ぎペナルティがある場合は、交代基準を下げる（交代しやすくする）
    const threshold = maxStamina - fatiguePenalty;

    if (bestRelief && (maxReliefScore > threshold || isExploded)) {
        return bestRelief;
    }

    return null;
  }

  /**
   * ランナーが追加進塁できるか判定し、UBRを計算
   */
  private calculateExtraAdvance(
    runnerId: string | number | undefined,
    hitType: 'single' | 'double',
    direction: number | undefined,
    roster: Player[],
    isScoringAttempt: boolean = false
  ): { success: boolean, ubrChange: number } {
    if (!runnerId) return { success: false, ubrChange: 0 };
    const runner = roster.find(p => p.id === runnerId);
    if (!runner) return { success: false, ubrChange: 0 };

    const speed = runner.abilities.speed || 10;
    let baseChance = 0;

    if (hitType === 'single') {
        // シングルヒットの場合
        if (isScoringAttempt) {
            // 2塁ランナーがホームを狙う (2nd -> Home)
            if (direction && direction >= 7) {
                baseChance = 0.6; 
                if (direction === 7) baseChance = 0.45; 
            } else {
                baseChance = 0.0;
            }
        } else {
            // 1塁ランナーが3塁を狙う (1st -> 3rd)
            if (direction === 9) baseChance = 0.5;
            else if (direction === 8) baseChance = 0.25;
            else if (direction === 7) baseChance = 0.05;
            else baseChance = 0.0;
        }
    } else if (hitType === 'double') {
        // 2塁打の場合 (1st -> Home)
        baseChance = 0.4;
    }

    if (baseChance <= 0) return { success: false, ubrChange: 0 };

    // 平均的な選手(Speed 6)の成功率
    // DBから取得したリーグ平均を使用。なければ6
    let avgSpeed = 6;
    if (this.leagueAverages && this.leagueAverages['All']) {
        avgSpeed = this.leagueAverages['All'].speed;
    }
    
    // 平均的な選手の確率
    let avgChance = baseChance + (avgSpeed - 5) * 0.01;
    avgChance = Math.max(0.0, Math.min(0.95, avgChance));

    // 実際の選手の確率
    let chance = baseChance + (speed - 5) * 0.01;
    chance = Math.max(0.0, Math.min(0.95, chance));

    const success = Math.random() < chance;
    
    // UBR計算
    // 成功時: (1 - 平均確率) * 価値
    // 失敗時(自重): (0 - 平均確率) * 価値
    // 価値は簡易的に0.2とする
    const runValue = 0.2;
    const ubrChange = ((success ? 1 : 0) - avgChance) * runValue;

    return { success, ubrChange };
  }

  /**
   * ハーフイニングシミュレーション
   */
  private async simulateHalfInning(
    inning: number,
    phase: 'top' | 'bottom',
    lineup: Player[],
    defenseLineup: Player[],
    startPitcher: Player,
    startIndex: number,
    battingStats: PlayerGameStats[],
    pitchingStats: PlayerGameStats[],
    defenseBattingStats: PlayerGameStats[],
    roster: Player[],
    gameStarterId: string,
    pitchingCounter: { value: number },
    removedPlayerIds: Set<string | number>,
    scoreDiff: number
  ): Promise<{ runs: number, plays: any[], nextBatterIndex: number, endPitcher: Player }> {
    let runs = 0;
    let outs = 0;
    const plays: any[] = [];

    // 守備交代チェック
    const subPlays = this.checkDefensiveSubstitution(defenseLineup, defenseBattingStats, roster, removedPlayerIds, inning, scoreDiff);
    if (subPlays.length > 0) {
        plays.push(...subPlays);
    }

    // ランナー状態: { occupied: boolean, isEarned: boolean, playerId?: string | number }
    // isEarned: true = 自責点対象ランナー, false = 非自責ランナー（エラー出塁など）
    let baseRunners: { occupied: boolean, isEarned: boolean, playerId?: string | number }[] = [
        { occupied: false, isEarned: true },
        { occupied: false, isEarned: true },
        { occupied: false, isEarned: true }
    ]; 
    let currentBatterIndex = startIndex;
    let currentPitcher = startPitcher;
    
    // みなしアウト（エラーがなければアウトになっていた数）
    let potentialOuts = 0;

    // 投手スタッツ取得 (先発投手)
    let pitcherStat = pitchingStats.find(s => s.playerId === currentPitcher.id);
    if (pitcherStat) {
      // イニング開始時の加算は削除し、アウトカウントで加算する
    }

    // 最大 27 アウトまでシミュレート（安全性のため）
    while (outs < 3) {
      // 投手交代チェック
      const pitchingTeamLead = phase === 'top' ? scoreDiff : -scoreDiff;
      const reliefPitcher = this.checkPitcherChange(currentPitcher, pitchingStats, inning, runs, roster, gameStarterId, pitchingTeamLead);
      if (reliefPitcher) {
        currentPitcher = reliefPitcher;
        pitcherStat = pitchingStats.find(s => s.playerId === currentPitcher.id);
        
        // リリーフ投手の登板順を記録
        if (pitcherStat && !pitcherStat.pitchingOrder) {
            pitcherStat.pitchingOrder = pitchingCounter.value++;
        }

        plays.push({
          inning,
          phase,
          outs,
          result: 'pitcher_change',
          pitcher: currentPitcher.name
        });
      }

      // 盗塁判定 (ランナーがいる場合)
      if (baseRunners.some(r => r.occupied)) {
          const stealResult = this.processStealAttempts(baseRunners, lineup, battingStats, defenseLineup, outs);
          
          if (stealResult.stolenBasePlays.length > 0) {
              plays.push(...stealResult.stolenBasePlays);
              baseRunners = stealResult.updatedRunners;
              outs = stealResult.newOuts;
              
              // 盗塁死でチェンジになった場合
              if (outs >= 3) break;
          }
      }

      let batter = lineup[currentBatterIndex];

      // 代打チェック
      const pinchHitter = this.checkPinchHitter(batter, roster, removedPlayerIds, inning, scoreDiff, baseRunners, outs, lineup);
      if (pinchHitter) {
          // 代打実行
          removedPlayerIds.add(batter.id);
          removedPlayerIds.add(pinchHitter.id); // 代打選手も出場済みに
          
          // ラインナップ更新
          lineup[currentBatterIndex] = pinchHitter;
          batter = pinchHitter;

          // スタッツ更新 (打順引き継ぎ)
          const newStat = battingStats.find(s => s.playerId === pinchHitter.id);
          if (newStat) {
              newStat.order = currentBatterIndex + 1;
              newStat.position = 'PH'; // 代打
          }

          plays.push({
              inning,
              type: 'substitution',
              description: `代打: ${pinchHitter.name}`
          });
      }

      const batterStat = battingStats.find(s => s.playerId === batter.id);
      
      // アットバット結果を取得 (確率ベース + 守備)
      const result = await this.simulateAtBat(batter, currentPitcher, defenseLineup);

      // 併殺打判定
      let isDoublePlay = false;
      if (result.type === 'out' && result.isGroundBall && outs < 2 && baseRunners[0].occupied) {
          // 併殺確率 (簡易計算: 60% - 走力補正 + 守備補正)
          const runnerId = baseRunners[0].playerId;
          const runner = lineup.find(p => p.id === runnerId);
          const runnerSpeed = runner ? (runner.abilities.speed || 10) : 10;
          
          // 二遊間の守備力 (SS, 2B)
          const ss = defenseLineup.find(p => p.position === 'SS');
          const second = defenseLineup.find(p => p.position === '2B');
          const ssFielding = ss ? (ss.abilities.fielding || 10) : 10;
          const secondFielding = second ? (second.abilities.fielding || 10) : 10;
          const defenseAvg = (ssFielding + secondFielding) / 2;
          
          let dpChance = 0.60 - (runnerSpeed - 10) * 0.02 + (defenseAvg - 10) * 0.02;
          dpChance = Math.max(0.1, Math.min(0.9, dpChance));
          
          if (Math.random() < dpChance) {
              isDoublePlay = true;
          }
      }

      // 打席結果テキスト生成 (BoxScore用)
      let resultText = '';
      const dirMap = ['投', '捕', '一', '二', '三', '遊', '左', '中', '右'];
      const dir = result.direction ? dirMap[result.direction - 1] : '';

      if (isDoublePlay) {
          resultText = '併殺打';
      } else if (result.type === 'strikeout') {
          resultText = Math.random() > 0.3 ? '空三振' : '見三振';
      } else if (result.type === 'walk') {
          resultText = '四球';
      } else if (result.type === 'hitByPitch') {
          resultText = '死球';
      } else if (result.type === 'homeRun') {
          resultText = dir + '本';
      } else if (result.type === 'single') {
          resultText = dir + '安';
      } else if (result.type === 'double') {
          resultText = dir + '２';
      } else if (result.type === 'triple') {
          resultText = dir + '３';
      } else if (result.type === 'error') {
          resultText = dir + '失';
      } else if (result.type === 'out') {
          // Outfield -> Fly, Infield -> Grounder mostly
          if (result.direction && result.direction >= 7) {
              resultText = dir + '飛';
          } else {
              // Infield
              const r = Math.random();
              if (r < 0.1) resultText = dir + '直'; // Liner
              else if (r < 0.25) resultText = dir + '飛'; // Fly
              else resultText = dir + 'ゴロ'; // Grounder
          }
      }

      if (batterStat) {
          if (!batterStat.atBatDetails) batterStat.atBatDetails = [];
          batterStat.atBatDetails.push({
              inning: inning,
              result: resultText
          });
      }

      // 投球数加算 (簡易シミュレーション)
      let pitchesInAtBat = 3; // デフォルト
      if (result.type === 'strikeout') pitchesInAtBat = 5;
      else if (result.type === 'walk') pitchesInAtBat = 6;
      else if (result.type === 'hitByPitch') pitchesInAtBat = 2;
      else if (['single', 'double', 'triple', 'homeRun'].includes(result.type)) pitchesInAtBat = 4;
      
      // ランダム要素 (+-1球)
      pitchesInAtBat += Math.floor(Math.random() * 3) - 1;
      if (pitchesInAtBat < 1) pitchesInAtBat = 1;

      if (pitcherStat) {
          pitcherStat.pitchCount = (pitcherStat.pitchCount || 0) + pitchesInAtBat;
      }

      if (batterStat) {
        batterStat.plateAppearances++; // 打席数加算
        if (result.type !== 'walk' && result.type !== 'hitByPitch') {
          batterStat.atBats++;
        }
      }

      // エラー記録
      if (result.type === 'error' && result.errorPlayerId) {
          // 守備側の打撃スタッツ（野手成績）にエラーを記録する
          const fielderStat = defenseBattingStats.find(s => s.playerId === result.errorPlayerId);
          if (fielderStat) {
              fielderStat.errors = (fielderStat.errors || 0) + 1;
          }
      }

      // UZR記録
      if (result.defenseStats) {
          const fielderStat = defenseBattingStats.find(s => s.playerId === result.defenseStats.fielderId);
          if (fielderStat) {
              fielderStat.uzrChange = (fielderStat.uzrChange || 0) + result.defenseStats.uzrChange;
          }
      }

      if (result.type === 'out' || result.type === 'strikeout') {
        outs++;
        potentialOuts++; // アウトならみなしアウトも増える

        if (isDoublePlay) {
            outs++; // もう1つアウト
            potentialOuts++;
            
            // 1塁ランナー消滅
            baseRunners[0] = { occupied: false, isEarned: true };
            
            // スタッツ記録
            if (batterStat) batterStat.doublePlays = (batterStat.doublePlays || 0) + 1;
            
            // 投球回加算 (追加の1アウト分)
            if (pitcherStat) {
                pitcherStat.inningsPitched = (pitcherStat.inningsPitched || 0) + (1 / 3);
            }
        }

        if (pitcherStat) {
            pitcherStat.inningsPitched = (pitcherStat.inningsPitched || 0) + (1 / 3);
        }

        if (result.type === 'strikeout') {
          if (batterStat) batterStat.strikeouts++;
          if (pitcherStat) pitcherStat.pitchingStrikeouts = (pitcherStat.pitchingStrikeouts || 0) + 1;
        }
      } else {
        // ランナーを進める処理
        let newRuns = 0;
        let earnedRunsToAdd = 0;
        
        // 現在のランナー状態をコピー
        const currentRunners = JSON.parse(JSON.stringify(baseRunners));
        // 次のランナー状態（初期化）
        let nextRunners: typeof baseRunners = [
            { occupied: false, isEarned: true },
            { occupied: false, isEarned: true },
            { occupied: false, isEarned: true }
        ];

        if (result.type === 'homeRun') {
          // 全ランナー生還
          currentRunners.forEach((r: any) => {
              if (r.occupied) {
                  newRuns++;
                  if (r.isEarned && potentialOuts < 3) earnedRunsToAdd++;
              }
          });
          // 打者生還
          newRuns++;
          // HRは打者自身の責任なので自責点（ただしみなしアウト3未満なら）
          if (potentialOuts < 3) earnedRunsToAdd++;
          
          // ランナーなし
          nextRunners = [
            { occupied: false, isEarned: true },
            { occupied: false, isEarned: true },
            { occupied: false, isEarned: true }
          ];

          if (batterStat) {
            batterStat.hits++;
            batterStat.homeRuns++;
          }
          if (pitcherStat) {
              pitcherStat.pitchingHits = (pitcherStat.pitchingHits || 0) + 1;
              pitcherStat.pitchingHomeRuns = (pitcherStat.pitchingHomeRuns || 0) + 1;
          }
        } else if (result.type === 'triple') {
          currentRunners.forEach((r: any) => {
              if (r.occupied) {
                  newRuns++;
                  if (r.isEarned && potentialOuts < 3) earnedRunsToAdd++;
              }
          });
          nextRunners[2] = { occupied: true, isEarned: true, playerId: batter.id }; // 打者は自責ランナー
          
          if (batterStat) {
            batterStat.hits++;
            batterStat.triples++;
          }
          if (pitcherStat) pitcherStat.pitchingHits = (pitcherStat.pitchingHits || 0) + 1;
        } else if (result.type === 'double') {
          // 2塁打: 2塁・3塁ランナーは生還
          if (currentRunners[2].occupied) {
              newRuns++;
              if (currentRunners[2].isEarned && potentialOuts < 3) earnedRunsToAdd++;
          }
          if (currentRunners[1].occupied) {
              newRuns++;
              if (currentRunners[1].isEarned && potentialOuts < 3) earnedRunsToAdd++;
          }
          
          // 1塁ランナー: 通常3塁へ。条件次第で生還(Home)。
          if (currentRunners[0].occupied) {
              const runnerId = currentRunners[0].playerId;
              // Check extra advance (1st -> Home)
              const advanceResult = this.calculateExtraAdvance(runnerId, 'double', result.direction, roster);
              
              // UBR記録
              if (runnerId) {
                  const runnerStat = battingStats.find(s => s.playerId === runnerId);
                  if (runnerStat) {
                      runnerStat.ubrChange = (runnerStat.ubrChange || 0) + advanceResult.ubrChange;
                  }
              }

              if (advanceResult.success) {
                  newRuns++;
                  if (currentRunners[0].isEarned && potentialOuts < 3) earnedRunsToAdd++;
                  // Runner scores, so nextRunners[2] remains empty
              } else {
                  nextRunners[2] = currentRunners[0]; // 1塁ランナー -> 3塁
              }
          }
          nextRunners[1] = { occupied: true, isEarned: true, playerId: batter.id }; // 打者は自責ランナー

          if (batterStat) {
            batterStat.hits++;
            batterStat.doubles++;
          }
          if (pitcherStat) pitcherStat.pitchingHits = (pitcherStat.pitchingHits || 0) + 1;
        } else if (result.type === 'single') {
          // 単打: 3塁生還
          if (currentRunners[2].occupied) {
              newRuns++;
              if (currentRunners[2].isEarned && potentialOuts < 3) earnedRunsToAdd++;
          }
          
          // 2塁ランナー: 通常3塁へ。条件次第で生還(Home)。
          if (currentRunners[1].occupied) {
             const runnerId = currentRunners[1].playerId;
             // Check extra advance (2nd -> Home)
             const advanceResult = this.calculateExtraAdvance(runnerId, 'single', result.direction, roster, true);
             
             // UBR記録
             if (runnerId) {
                 const runnerStat = battingStats.find(s => s.playerId === runnerId);
                 if (runnerStat) {
                     runnerStat.ubrChange = (runnerStat.ubrChange || 0) + advanceResult.ubrChange;
                 }
             }

             if (advanceResult.success) {
                 newRuns++;
                 if (currentRunners[1].isEarned && potentialOuts < 3) earnedRunsToAdd++;
             } else {
                 nextRunners[2] = currentRunners[1]; // Stops at 3rd
             }
          }

          // 1塁ランナー: 通常2塁へ。条件次第で3塁へ。
          if (currentRunners[0].occupied) {
             const runnerId = currentRunners[0].playerId;
             // Check extra advance (1st -> 3rd)
             // ただし、2塁ランナーが3塁に止まっている場合は行けない
             const advanceResult = this.calculateExtraAdvance(runnerId, 'single', result.direction, roster);
             
             // UBR記録
             if (runnerId) {
                 const runnerStat = battingStats.find(s => s.playerId === runnerId);
                 if (runnerStat) {
                     runnerStat.ubrChange = (runnerStat.ubrChange || 0) + advanceResult.ubrChange;
                 }
             }

             if (advanceResult.success) {
                 if (!nextRunners[2].occupied) {
                     nextRunners[2] = currentRunners[0];
                 } else {
                     nextRunners[1] = currentRunners[0]; // Forced to stop at 2nd
                 }
             } else {
                 nextRunners[1] = currentRunners[0];
             }
          }
          
          nextRunners[0] = { occupied: true, isEarned: true, playerId: batter.id }; // 打者は自責ランナー

          if (batterStat) batterStat.hits++;
          if (pitcherStat) pitcherStat.pitchingHits = (pitcherStat.pitchingHits || 0) + 1;
        } else if (result.type === 'walk' || result.type === 'hitByPitch') {
          // 押し出し判定
          let pushTo2nd = false;
          let pushTo3rd = false;
          let pushHome = false;

          nextRunners[0] = { occupied: true, isEarned: true, playerId: batter.id }; // 打者は自責ランナー

          if (currentRunners[0].occupied) {
              pushTo2nd = true;
              nextRunners[1] = currentRunners[0];
          } else {
              // 1塁空きならそのまま
              if (currentRunners[1].occupied) nextRunners[1] = currentRunners[1];
              if (currentRunners[2].occupied) nextRunners[2] = currentRunners[2];
          }

          if (pushTo2nd && currentRunners[1].occupied) {
              pushTo3rd = true;
              nextRunners[2] = currentRunners[1];
          } else if (pushTo2nd) {
              if (currentRunners[2].occupied) nextRunners[2] = currentRunners[2];
          }

          if (pushTo3rd && currentRunners[2].occupied) {
              pushHome = true;
              newRuns++;
              if (currentRunners[2].isEarned && potentialOuts < 3) earnedRunsToAdd++;
          }

          if (batterStat) {
             if (result.type === 'walk') batterStat.walks++;
             if (result.type === 'hitByPitch') batterStat.hitByPitch++;
          }
          if (pitcherStat) {
              if (result.type === 'walk') pitcherStat.pitchingWalks = (pitcherStat.pitchingWalks || 0) + 1;
              if (result.type === 'hitByPitch') pitcherStat.pitchingHitByPitch = (pitcherStat.pitchingHitByPitch || 0) + 1;
          }
        } else if (result.type === 'error') {
            // エラー: みなしアウト加算
            potentialOuts++;
            
            // エラー出塁は単打扱いだが、打者は非自責
            // 3塁生還、2塁->3塁、1塁->2塁 (エラーの内容によるが簡易化)
            if (currentRunners[2].occupied) {
                newRuns++;
                // エラープレイでの得点は非自責 (簡易判定)
            }
            if (currentRunners[1].occupied) nextRunners[2] = currentRunners[1];
            if (currentRunners[0].occupied) nextRunners[1] = currentRunners[0];
            
            // 打者は非自責ランナーとして出塁
            nextRunners[0] = { occupied: true, isEarned: false, playerId: batter.id };
        }

        // 代走チェック (出塁後)
        const pinchRunnerPlays = this.checkPinchRunner(nextRunners, roster, removedPlayerIds, inning, scoreDiff, battingStats, lineup);
        if (pinchRunnerPlays.length > 0) {
            plays.push(...pinchRunnerPlays);
        }

        baseRunners = nextRunners;
        runs += newRuns;
        
        if (batterStat) {
          if (result.type !== 'error') {
             batterStat.rbi += newRuns;
          }
        }
        if (pitcherStat) {
          // 失点は常に加算
          pitcherStat.runsAllowed = (pitcherStat.runsAllowed || 0) + newRuns;
          // 自責点は条件付き加算
          pitcherStat.earnedRuns = (pitcherStat.earnedRuns || 0) + earnedRunsToAdd;
        }
      }

      plays.push({
        inning,
        phase,
        outs,
        batter: batter.name,
        pitcher: currentPitcher.name,
        result: result.type,
        rbi: result.rbiEarned
      });

      // 次の打者へ
      currentBatterIndex = (currentBatterIndex + 1) % lineup.length;
    }

    return { runs, plays, nextBatterIndex: currentBatterIndex, endPitcher: currentPitcher };
  }

  /**
   * 盗塁処理
   */
  private processStealAttempts(
    baseRunners: { occupied: boolean, isEarned: boolean, playerId?: string | number }[],
    lineup: Player[],
    battingStats: PlayerGameStats[],
    defenseLineup: Player[],
    currentOuts: number
  ): { 
    newOuts: number, 
    stolenBasePlays: any[], 
    updatedRunners: typeof baseRunners 
  } {
      let outs = currentOuts;
      const plays: any[] = [];
      const nextRunners = JSON.parse(JSON.stringify(baseRunners));
      
      // キャッチャー特定
      const catcher = defenseLineup.find(p => p.position === 'C');
      const catcherArm = catcher ? (catcher.abilities.arm || 3) : 3;
      const catcherAptitude = catcher && catcher.aptitudes ? (catcher.aptitudes.catcher || 0) : 0;

      // 盗塁試行ヘルパー
      const attemptSteal = (runnerIndex: number, targetBaseIndex: number) => {
          if (!nextRunners[runnerIndex].occupied) return;
          if (nextRunners[targetBaseIndex].occupied) return; // 塁が埋まっている
          
          const runnerId = nextRunners[runnerIndex].playerId;
          const runner = lineup.find(p => p.id === runnerId);
          if (!runner) return;

          const speed = runner.abilities.speed || 0;
          
          // 盗塁判断
          // 走力6未満は走らない (緩和)
          if (speed < 6) return;
          
          // 試行確率計算
          // 基準: (Speed - 5) * 係数
          // 捕手補正: (10 - Arm) / 7 * (10.2 - Aptitude) / 7
          
          // 走力要素: Speed 10で75, 15で150程度 (走力の影響を強化)
          let speedFactor = (speed - 5) * 15;
          
          // 捕手肩補正: Arm 3->1.0, Arm 5->0.7
          let armFactor = Math.max(0, (10 - catcherArm) / 7);
          
          // 捕手適性補正: Apt 5->0.74, Apt 10->0.02 (適性が高いと激減)
          let aptitudeFactor = Math.max(0, (10.2 - catcherAptitude) / 5);
          
          // 総合スコア
          let stealScore = speedFactor * armFactor * aptitudeFactor;
          
          // 閾値 (ランダム要素)
          // スコア50の場合 -> 5%程度にしたい -> 0.001だと5%
          const attemptChance = stealScore * 0.008; 

          if (Math.random() > attemptChance) return;

          // 成功率計算
          // 基準成功率 65%
          // 走力ボーナス: (Speed - 10) * 5%
          // 守備ペナルティ: (Arm * 2 + Aptitude * 0.5) を指標とする
          // 基準守備力: Arm 3.5 * 2 + Apt 10 * 0.5 = 7 + 5 = 12
          
          const defensePower = catcherArm * 2 + catcherAptitude * 0.5;
          
          let successRate = 0.65 + (speed - 10) * 0.05 - (defensePower - 12) * 0.03;
          
          // 上限下限
          successRate = Math.max(0.1, Math.min(0.95, successRate));

          const isSuccess = Math.random() < successRate;
          const stat = battingStats.find(s => s.playerId === runnerId);

          if (isSuccess) {
              // 成功: 進塁
              nextRunners[targetBaseIndex] = nextRunners[runnerIndex];
              nextRunners[runnerIndex] = { occupied: false, isEarned: true };
              
              if (stat) stat.stolenBases++;
              
              plays.push({
                  result: 'stolenBase',
                  player: runner.name,
                  base: targetBaseIndex + 1 // 1: 2塁, 2: 3塁
              });
          } else {
              // 失敗: アウト
              nextRunners[runnerIndex] = { occupied: false, isEarned: true };
              outs++;
              
              if (stat) stat.caughtStealing++;

              plays.push({
                  result: 'caughtStealing',
                  player: runner.name,
                  base: targetBaseIndex + 1
              });
          }
      };

      // 2塁ランナーの3盗 (index 1 -> 2)
      if (outs < 3) attemptSteal(1, 2);
      
      // 1塁ランナーの2盗 (index 0 -> 1)
      // 2塁が空いている場合のみ (3盗で空いた場合も含む)
      if (outs < 3) attemptSteal(0, 1);

      return { newOuts: outs, stolenBasePlays: plays, updatedRunners: nextRunners };
  }

  /**
   * アットバット結果のシミュレーション
   * 確率計算ロジックを使用
   */
  private async simulateAtBat(batter: Player, pitcher: Player, defenseLineup: Player[]): Promise<AtBatResult> {
    // 確率を計算
    const probs = calculateAtBatProbabilities(pitcher, batter);
    
    // 乱数生成 (0.0 - 1.0)
    const rand = Math.random();
    
    let type: AtBatResult['type'] = 'out';
    let advanceBases = 0;
    let rbiEarned = 0;
    let errorPlayerId: string | number | undefined;
    let direction: number | undefined;
    let fielder: Player | undefined;
    let uzrChange: number | undefined;

    // 確率に基づいて結果を決定
    let cumulative = 0;
    
    if (rand < (cumulative += probs.homeRun)) {
      type = 'homeRun';
      advanceBases = 4;
      rbiEarned = 1;
      // HR方向 (7-9)
      direction = Math.floor(Math.random() * 3) + 7;
    } else if (rand < (cumulative += probs.triple)) {
      type = 'triple';
      advanceBases = 3;
    } else if (rand < (cumulative += probs.double)) {
      type = 'double';
      advanceBases = 2;
    } else if (rand < (cumulative += probs.single)) {
      type = 'single';
      advanceBases = 1;
    } else if (rand < (cumulative += probs.walk)) {
      type = 'walk';
      advanceBases = 1;
    } else if (rand < (cumulative += probs.strikeout)) {
      type = 'strikeout'; 
    } else {
      type = 'out';
    }

    // 守備の影響を計算 (HR, 四死球, 三振以外)
    if (type !== 'homeRun' && type !== 'walk' && type !== 'strikeout') {
        // 打球方向を決定 (1-9)
        // 1: P, 2: C, 3: 1B, 4: 2B, 5: 3B, 6: SS, 7: LF, 8: CF, 9: RF
        const location = Math.floor(Math.random() * 9) + 1;
        direction = location;
        const posMap = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
        const posName = posMap[location - 1];
        
        // 野手を特定
        fielder = defenseLineup.find(p => p.position === posName);
        if (!fielder && location === 1) fielder = pitcher; // Pitcher
        if (!fielder) fielder = defenseLineup.find(p => p.position === 'Unknown') || defenseLineup[0]; // Fallback

        uzrChange = 0;
        if (fielder) {
            const fielding = fielder.abilities.fielding || 0;
            const arm = fielder.abilities.arm || 0;
            const speed = fielder.abilities.speed || 0;

            // 平均的な選手の能力 (UZR基準値計算用)
            // DBから取得したリーグ平均を使用。なければ6
            let avgFielding = 6;
            let avgArm = 6;
            let avgSpeed = 6;

            if (this.leagueAverages) {
                // ポジション別の平均があればそれを使う
                const posAvg = this.leagueAverages[posName];
                if (posAvg) {
                    avgFielding = posAvg.fielding;
                    avgArm = posAvg.arm;
                    avgSpeed = posAvg.speed;
                } else {
                    // なければ全体平均
                    const allAvg = this.leagueAverages['All'];
                    if (allAvg) {
                        avgFielding = allAvg.fielding;
                        avgArm = allAvg.arm;
                        avgSpeed = allAvg.speed;
                    }
                }
            }

            // A. エラー判定
            // ポジションによってエラー率を変える
            let baseErrorRate = 0.04;
            let fieldingFactor = 0.03;

            if (['LF', 'CF', 'RF'].includes(posName)) {
                baseErrorRate = 0.015;
                fieldingFactor = 0.013;
            } else if (['SS', '2B', '3B'].includes(posName)) {
                baseErrorRate = 0.045;
                fieldingFactor = 0.040;
            } else {
                baseErrorRate = 0.03;
                fieldingFactor = 0.025;
            }

            // 実際の選手のエラー率
            const errorChance = baseErrorRate - (fielding / 80) * fieldingFactor;
            // 平均的な選手のエラー率
            const avgErrorChance = baseErrorRate - (avgFielding / 80) * fieldingFactor;
            
            // UZR計算用の期待アウト確率 (P) と 結果 (R)
            let expectedOutProb = 0;
            let resultIsOut = 0;
            const runValue = 0.75; // 1アウトの価値係数

            if (Math.random() < Math.max(0.001, errorChance)) {
                // エラー発生
                type = 'error';
                advanceBases = 1;
                errorPlayerId = fielder.id;
                resultIsOut = 0;
            } else {
                // エラー回避 -> 次の判定へ
                
                // B. 好守備判定 (ヒット性の当たりをアウトにする)
                if (type === 'single' || type === 'double' || type === 'triple') {
                    // 守備範囲(Speed)と捕球(Fielding)で判定
                    const defenseScore = (fielding + speed) / 2; 
                    const saveChance = (defenseScore / 100) * 0.15; 
                    
                    // 平均的な選手の阻止率
                    const avgDefenseScore = (avgFielding + avgSpeed) / 2;
                    const avgSaveChance = (avgDefenseScore / 100) * 0.15;

                    // この打球における平均的な選手のアウト確率
                    // (エラーせず) かつ (好守備で阻止する)
                    expectedOutProb = (1 - avgErrorChance) * avgSaveChance;

                    if (Math.random() < saveChance) {
                        type = 'out';
                        advanceBases = 0;
                        resultIsOut = 1;
                    } else {
                        resultIsOut = 0;
                    }
                }
                // C. 内野安打判定 (アウト性の当たりがヒットになる)
                else if (type === 'out') {
                    // 内野ゴロの場合 (1-6)
                    if (location <= 6) {
                        const batterSpeed = batter.abilities.speed || 0;
                        const defensePower = (fielding + arm) / 2;
                        
                        // 平均的な選手の守備力
                        const avgDefensePower = (avgFielding + avgArm) / 2;

                        // 実際の選手の内野安打許容率
                        let infieldHitChance = 0;
                        if (batterSpeed > defensePower) {
                            const diff = batterSpeed - defensePower;
                            infieldHitChance = 0.05 + (diff / 100) * 0.2;
                        }

                        // 平均的な選手の内野安打許容率
                        let avgInfieldHitChance = 0;
                        if (batterSpeed > avgDefensePower) {
                            const diff = batterSpeed - avgDefensePower;
                            avgInfieldHitChance = 0.05 + (diff / 100) * 0.2;
                        }

                        // この打球における平均的な選手のアウト確率
                        // (エラーせず) かつ (内野安打にされない)
                        expectedOutProb = (1 - avgErrorChance) * (1 - avgInfieldHitChance);

                        if (Math.random() < infieldHitChance) {
                            type = 'single';
                            advanceBases = 1;
                            resultIsOut = 0;
                        } else {
                            resultIsOut = 1;
                        }
                    } else {
                        // 外野フライ/ライナーなど (ほぼアウト)
                        expectedOutProb = 1 - avgErrorChance;
                        resultIsOut = 1;
                    }
                }
            }

            // UZR変動値の計算: (結果 - 期待値) * 価値
            // 結果: アウト=1, セーフ=0
            // 期待値: 平均的な選手がアウトにする確率
            uzrChange = (resultIsOut - expectedOutProb) * runValue;
        }
    }

    // ゴロ判定 (アウトかつ内野の場合)
    let isGroundBall = false;
    if (type === 'out' && direction && direction <= 6) {
        // 75%の確率でゴロ (ライナー・フライ以外)
        if (Math.random() >= 0.25) {
            isGroundBall = true;
        }
    }

    return { 
        type, 
        advanceBases, 
        rbiEarned, 
        errorPlayerId, 
        direction, 
        isGroundBall,
        defenseStats: fielder ? {
            fielderId: fielder.id,
            uzrChange
        } : undefined
    };
  }

  /**
   * MVP の決定
   */
  private determineMVP(plays: any[], homeScore: number, awayScore: number, homeRoster: Player[], awayRoster: Player[]) {
    const winningTeam = homeScore > awayScore ? homeRoster : awayRoster;
    if (winningTeam.length > 0) {
      const randomIndex = Math.floor(Math.random() * Math.min(9, winningTeam.length));
      return winningTeam[randomIndex];
    }
    return undefined;
  }

  /**
   * ダミーロスター生成 (データ不足時用)
   */
  private createDummyRoster(teamId: string): Player[] {
    const roster: Player[] = [];
    for (let i = 1; i <= 9; i++) {
      roster.push({
        id: `dummy_${teamId}_${i}`,
        name: `Player ${i}`,
        position: 'Unknown',
        handedness: 'R',
        age: 20,
        team: teamId as TeamId,
        stats: { average: 0.250, homeRuns: 10, era: 4.00 } as any,
        abilities: {
          contact: 0,
          power: 0,
          speed: 0,
          arm: 0,
          fielding: 0
        },
        contract: {} as any,
        careerStats: {} as any,
        recentForm: [],
        injuryStatus: 'healthy',
        morale: 50
      });
    }
    return roster;
  }

  /**
   * 次試合準備
   * VBA: Sub 次試合準備()
   */
  async prepareNextGame(): Promise<void> {
    // オーダーシート初期化
    // ベンチプレイヤー設定
    // 各種フラグセット
  }

  /**
   * リネアップ適用
   * VBA: Sub harituke()
   */
  async applyLineup(): Promise<void> {
    // ポジション割当更新
    // 計算シート再計算
    // C6 = 2 (実行済み) にセット
  }

  /**
   * ゲーム日付をインクリメント
   * VBA: Sub 日付カウント()
   */
  async incrementGameDate(): Promise<void> {
    // 日付を +1
    // ゲーム状態をリセット
  }

  /**
   * オートプレイ機能
   * 指定した日数分、試合を進行させる
   */
  async autoPlayGames(initialGameState: GameState, daysToSkip: number): Promise<{ results: GameResult[], daysSkipped: number, stopReason?: string }> {
    // Memory optimization: Don't accumulate all results if skipping many days
    const results: GameResult[] = [];
    let currentGameState = { ...initialGameState };
    let daysSkipped = 0;
    let stopReason: string | undefined;

    for (let i = 0; i < daysToSkip; i++) {
      // 1日分の試合を実行 (saveDetails = false to save disk space)
      const dailyResults = await this.simulateLeagueDay(currentGameState, false);
      
      // ポストシーズン生成チェック
      const psStatus = await databaseManager.checkAndGeneratePostSeason(currentGameState.currentDate + 1, currentGameState.season);

      // Only keep results if daysToSkip is small, otherwise just keep the last day
      // If we are stopping early, we definitely want to keep the last day's results
      if (daysToSkip <= 5 || psStatus) {
        results.push(...dailyResults);
      } else if (i === daysToSkip - 1) {
        results.push(...dailyResults);
      }
      
      // 日付を更新 (次のループのため)
      currentGameState = {
        ...currentGameState,
        currentDate: currentGameState.currentDate + 1,
        day: currentGameState.day + 1
      };
      daysSkipped++;

      // クラッシュ対策: 1日ごとに進行状況を保存する
      // これにより、途中でアプリが落ちても、再開時に正しい日付からスタートできる
      await databaseManager.saveGameState(currentGameState);

      // ポストシーズンイベントが発生したら中断
      if (psStatus) {
          console.log(`Auto play stopped due to: ${psStatus}`);
          stopReason = psStatus;
          break;
      }
    }

    return { results, daysSkipped, stopReason };
  }

  /**
   * 選手の総合能力(Overall)を再計算する
   * Excelの数式を参考にしたロジック
   */
  recalculatePlayerOverall(player: Player): number {
    const abilities = player.abilities;
    let overall = 0;

    // 共通係数 (ExcelのX列相当)
    const X = 1.5; 

    if (player.position === 'P') {
      // 投手
      const control = abilities.control || 0;
      const stamina = abilities.stamina || 0;
      const speed = abilities.speed || 0; // 球速
      
      // 補正巧打・投手 (V列) があればそれを使う、なければControl
      const correctedContact = abilities.correctedContact || control;
      
      // 投手用の数式ロジック (推測)
      const term1 = (control * 15 / X + Math.pow(correctedContact, 2) * X) / 2;
      const term2 = Math.pow(stamina, 1.5);
      const term3 = Math.pow(speed, 1.4) * 3.5;
      
      overall = term1 + term2 + term3;
      
      // 補正
      overall = overall / 10; // スケール調整

    } else {
      // 野手
      const contact = abilities.contact || 0;
      const eye = abilities.eye || 0;
      const power = abilities.power || 0;
      const speed = abilities.speed || 0;
      const defense = abilities.defense || 0;
      const fielding = abilities.fielding || 0;
      const pinchHitter = abilities.pinchHitter || 0;
      
      // 補正巧打 (FF列相当) -> Contactを使う
      const correctedContact = contact;

      // ([.BA3]*15/[.X3] + [.FF3]^2*[.X3])/2
      const term1 = (1 * 15 / X + Math.pow(correctedContact, 2) * X) / 2;
      
      // [.D3]^1.5
      const term2 = Math.pow(eye, 1.5);
      
      // [.W3]^1.4 * 3.5
      const term3 = Math.pow(power, 1.4) * 3.5;
      
      // (([.Y3]-6)*[.F3]^1.5)/5
      // Y=140? 野手の場合は不明だが、とりあえず定数として扱う
      // F=Speed
      const term4 = ((140 - 6) * Math.pow(speed, 1.5)) / 500; // 500で割って調整
      
      // [.G3]^1.5/5
      const term5 = Math.pow(defense, 1.5) / 5;
      
      // [.AG3] + [.S3]*5
      const term6 = fielding + pinchHitter * 5;
      
      overall = term1 + term2 + term3 + term4 + term5 + term6;
    }

    return Math.round(overall * 100) / 100;
  }

  /**
   * ローテーション順序決定用の投手評価
   * rosterManager.getStarterScore と同じロジック
   */
  private evaluatePitcherForRotation(p: Player): number {
      // 先発適性 > スタミナ > 総合値
      const aptitude = p.abilities.starterAptitude || p.starter_aptitude || 0;
      return aptitude * 2 + (p.abilities.stamina || 0) + (p.abilities.overall || 0);
  }

  /**
   * 全選手の総合能力を更新する
   */
  async updateAllPlayersOverall(): Promise<void> {
    const players = await databaseManager.getInitialPlayers();
    let updated = false;

    const newPlayers = players.map(p => {
      const newOverall = this.recalculatePlayerOverall(p);
      if (p.abilities.overall !== newOverall) {
        updated = true;
        return {
          ...p,
          abilities: {
            ...p.abilities,
            overall: newOverall
          }
        };
      }
      return p;
    });

    if (updated) {
      console.log('Updating players with recalculated overall ratings...');
      await databaseManager.savePlayers(newPlayers);
    }
  }
}

export const gameEngine = new GameEngine();
