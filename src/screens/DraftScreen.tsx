import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { setOffSeasonStep } from '@/redux/slices/gameSlice';
import { DraftManager } from '@/services/draftManager';
import { dbManager } from '@/services/databaseManager';
import { TeamStrategyManager } from '@/services/teamStrategyManager';
import { Player, TeamId, NewsItem } from '@/types';
import { Ionicons } from '@expo/vector-icons';

const getRank = (value: number | undefined): string => {
  if (value === undefined) return '-';
  if (value >= 11) return 'S';
  if (value >= 9) return 'A';
  if (value >= 7) return 'B';
  if (value >= 5) return 'C';
  if (value >= 3) return 'D';
  return 'E';
};

export const DraftScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const gameState = useSelector((state: RootState) => state.game);
  
  const [candidates, setCandidates] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRound, setCurrentRound] = useState(1);
  const [pickOrder, setPickOrder] = useState<string[]>([]); // チームID
  const [fullPickOrder, setFullPickOrder] = useState<string[]>([]); // 本来の全チーム指名順 (ウェーバー順)
  const [currentPickIndex, setCurrentPickIndex] = useState(0);
  const [draftResults, setDraftResults] = useState<Record<string, Player[]>>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Player | null>(null);
  const [filterPosition, setFilterPosition] = useState<'All' | 'P' | 'Fielder'>('All');
  const [sortType, setSortType] = useState<'Evaluation' | 'Position'>('Evaluation');
  const [isDraftOver, setIsDraftOver] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [teamNeeds, setTeamNeeds] = useState<Record<string, any>>({});
  const [finishedTeams, setFinishedTeams] = useState<string[]>([]);
  const [teamRosterCounts, setTeamRosterCounts] = useState<Record<string, number>>({});
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    buttons: [] as { text: string; style?: string; onPress?: () => void }[]
  });

  const showAlert = (title: string, message: string, buttons: { text: string; style?: string; onPress?: () => void }[] = [{ text: 'OK' }]) => {
    setModalConfig({ title, message, buttons });
    setModalVisible(true);
  };
  
  // 1巡目入札用
  const [draftPhase, setDraftPhase] = useState<'nomination' | 'lottery' | 'waiver'>('nomination');
  const [nominations, setNominations] = useState<Record<string, Player>>({}); // teamId -> Player
  const [lotteryResults, setLotteryResults] = useState<string[]>([]); // ログ用

  const MAX_ROUNDS = 15;
  const ROSTER_LIMIT = 75;
  const MIN_ABILITY_THRESHOLD = 150; // CPUが指名を続ける最低限のスコア閾値
  const scrollViewRef = useRef<ScrollView>(null);
  const isExiting = useRef(false);

  // Initialize Draft
  useEffect(() => {
    const initDraft = async () => {
      try {
        setLoading(true);
        
        // 1. 候補選手生成
        const newCandidates = DraftManager.generateDraftCandidates(150); 
        setCandidates(newCandidates);

        // 2. チーム分析 (戦力外候補と補強ポイントの算出)
        const analysis = await TeamStrategyManager.analyzeAllTeams();
        const needsMap: Record<string, any> = {};
        const rosterCounts: Record<string, number> = {};
        
        Object.values(analysis).forEach(a => {
            needsMap[a.teamId] = a.needs;
            rosterCounts[a.teamId] = a.rosterCount;
        });
        setTeamNeeds(needsMap);
        setTeamRosterCounts(rosterCounts);

        // 3. 指名順の決定 (ウェーバー: 順位の逆順、リーグ交互)
        const initialTeams = await dbManager.getInitialTeams();
        console.log(`DraftScreen: Loaded ${initialTeams.length} teams.`);
        setTeams(initialTeams);
        
        // 順位を計算して指名順を決定
        const standings = dbManager.calculateStandingsInfo(initialTeams);
        console.log(`DraftScreen: Calculated standings for ${standings.length} teams.`);
        
        // リーグごとに分けて勝率昇順（下位から）にソート
        const pacific = standings
            .filter((t: any) => t.league === 'pacific')
            .sort((a: any, b: any) => {
                const recA = a.record || { wins: 0, games: 0 };
                const recB = b.record || { wins: 0, games: 0 };
                const winPctA = recA.games > 0 ? recA.wins / recA.games : 0;
                const winPctB = recB.games > 0 ? recB.wins / recB.games : 0;
                return winPctA - winPctB;
            });
            
        const central = standings
            .filter((t: any) => t.league === 'central')
            .sort((a: any, b: any) => {
                const recA = a.record || { wins: 0, games: 0 };
                const recB = b.record || { wins: 0, games: 0 };
                const winPctA = recA.games > 0 ? recA.wins / recA.games : 0;
                const winPctB = recB.games > 0 ? recB.wins / recB.games : 0;
                return winPctA - winPctB;
            });

        console.log(`DraftScreen: Pacific teams: ${pacific.length}, Central teams: ${central.length}`);

        // 年度によって優先リーグを決定 (例: 偶数年はパ・リーグ優先)
        const isPacificFirst = gameState.season % 2 === 0;
        
        const order: string[] = [];
        const maxLen = Math.max(pacific.length, central.length);
        
        for (let i = 0; i < maxLen; i++) {
            if (isPacificFirst) {
                if (i < pacific.length) order.push(pacific[i].id);
                if (i < central.length) order.push(central[i].id);
            } else {
                if (i < central.length) order.push(central[i].id);
                if (i < pacific.length) order.push(pacific[i].id);
            }
        }
        
        console.log(`DraftScreen: Pick order length: ${order.length}`);
        setPickOrder(order);
        setFullPickOrder(order);
        
        // 結果の初期化
        const initialResults: Record<string, Player[]> = {};
        initialTeams.forEach(t => initialResults[t.id] = []);
        setDraftResults(initialResults);

        // 1巡目は入札フェーズから開始
        setDraftPhase('nomination');

        setLoading(false);
        addLog("ドラフト会議を開始します。");
        addLog("第1巡目選択希望選手を提出してください。");

      } catch (error) {
        console.error("Draft initialization failed:", error);
        showAlert("Error", "Failed to initialize draft.");
        navigation.goBack();
      }
    };

    initDraft();
  }, []);

  // ログの自動スクロール
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [logs]);

  // CPU指名の処理 (ウェーバーフェーズのみ)
  useEffect(() => {
    if (loading || isDraftOver || draftPhase === 'nomination') return;

    // 全チームが終了しているかチェック
    if (teams.length > 0 && finishedTeams.length >= teams.length) {
        finishDraft();
        return;
    }

    const currentTeamId = pickOrder[currentPickIndex];
    
    // 既に終了しているチームかチェック
    if (finishedTeams.includes(currentTeamId)) {
        const timer = setTimeout(() => {
            advancePick();
        }, 100); 
        return () => clearTimeout(timer);
    }

    const isUserTurn = currentTeamId === gameState.selectedTeamId;

    if (!isUserTurn) {
      // CPUのターン: 演出のために少し遅延させる
      const timer = setTimeout(() => {
        handleCpuPick(currentTeamId);
      }, 500); // 少し短縮
      return () => clearTimeout(timer);
    }
  }, [currentPickIndex, currentRound, loading, isDraftOver, finishedTeams, teams, draftPhase]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
  };

  // 獲得選手に応じて補強ポイントを動的に調整する
  const getDynamicNeeds = (teamId: string) => {
      const baseNeeds = teamNeeds[teamId] || {};
      const drafted = draftResults[teamId] || [];
      
      // Deep copy
      const currentNeeds = { ...baseNeeds };

      drafted.forEach(p => {
          if (p.position === 'P') {
              // 投手を獲得したら、投手需要を下げる
              currentNeeds['P'] = Math.max(0.1, (currentNeeds['P'] || 1.0) - 0.2);
          } else {
              // 野手を獲得したら、そのポジションの需要を大きく下げる
              const pos = p.position;
              currentNeeds[pos] = Math.max(0.1, (currentNeeds[pos] || 1.0) - 0.8);
              
              // 外野手の場合は他の外野ポジションも少し下げる
              if (['LF', 'CF', 'RF'].includes(pos)) {
                  ['LF', 'CF', 'RF'].forEach(ofPos => {
                      if (ofPos !== pos) {
                          currentNeeds[ofPos] = Math.max(0.1, (currentNeeds[ofPos] || 1.0) - 0.3);
                      }
                  });
              }
          }
      });
      
      return currentNeeds;
  };

  // 1巡目入札処理 (ユーザーが指名した後に呼ばれる)
  const processFirstRoundNominations = (userNomination: Player | null) => {
      const newNominations: Record<string, Player> = {};
      
      // ユーザーの指名
      if (gameState.selectedTeamId && userNomination) {
          newNominations[gameState.selectedTeamId] = userNomination;
      }

      // CPUの指名
      teams.forEach(team => {
          if (team.id === gameState.selectedTeamId) return;
          
          // 既に指名済みのチームはスキップ
          if (draftResults[team.id] && draftResults[team.id].length >= currentRound) return;
          
          // 候補から選ぶ (既に誰かが選んでいてもOK、ただし確定済みの選手は除く)
          const available = candidates.filter(p => (p.team as string) === 'unknown');
          const needs = getDynamicNeeds(team.id);
          
          let bestPlayer: Player | null = null;
          let maxScore = -1;

          // ランダム性を持たせる (スコアに0.9~1.1倍の揺らぎ)
          available.forEach(p => {
              const baseScore = getPlayerScore(p) * (needs[p.position] || 1.0);
              const randomFactor = 0.9 + Math.random() * 0.2;
              const score = baseScore * randomFactor;
              
              if (score > maxScore) {
                  maxScore = score;
                  bestPlayer = p;
              }
          });

          if (bestPlayer) {
              newNominations[team.id] = bestPlayer;
          }
      });

      setNominations(newNominations);
      
      // 結果発表と抽選へ
      setTimeout(() => {
          processLottery(newNominations);
      }, 1000);
  };

  // 抽選処理
  const processLottery = (noms: Record<string, Player>) => {
      const playerVotes: Record<string, string[]> = {}; // playerId -> teamId[]
      
      Object.entries(noms).forEach(([teamId, player]) => {
          if (!playerVotes[player.id]) playerVotes[player.id] = [];
          playerVotes[player.id].push(teamId);
      });

      const winners: Record<string, Player> = {};
      const losers: string[] = [];
      const logsToAdd: string[] = [];

      Object.entries(playerVotes).forEach(([playerId, teamIds]) => {
          const player = candidates.find(p => p.id == playerId);
          if (!player) return;

          if (teamIds.length === 1) {
              // 単独指名
              winners[teamIds[0]] = player;
              logsToAdd.push(`${teams.find(t => t.id === teamIds[0])?.name} が ${player.name} を単独指名で獲得！`);
          } else {
              // 競合 -> 抽選
              const winnerIndex = Math.floor(Math.random() * teamIds.length);
              const winnerTeamId = teamIds[winnerIndex];
              winners[winnerTeamId] = player;
              
              logsToAdd.push(`【抽選】${player.name} に ${teamIds.length}球団が競合...`);
              logsToAdd.push(`  -> 交渉権獲得: ${teams.find(t => t.id === winnerTeamId)?.name}！`);
              
              teamIds.forEach(tid => {
                  if (tid !== winnerTeamId) losers.push(tid);
              });
          }
      });

      // 確定処理
      Object.entries(winners).forEach(([teamId, player]) => {
          executePick(teamId, player, false); // advancePickしない
      });

      logsToAdd.forEach(l => addLog(l));

      if (losers.length > 0) {
          addLog(`--- 外れ1位指名 (${losers.length}球団) ---`);
          // 外れたチームだけで再度入札させる
          setNominations({}); // リセット
          setDraftPhase('nomination'); // 再入札
          
          // ユーザーが敗者チームに含まれている場合のみアラートを表示
          if (gameState.selectedTeamId && losers.includes(gameState.selectedTeamId)) {
             showAlert("抽選結果", "抽選に外れました。\n再度、指名選手を選択してください。");
          }
          // ユーザーが敗者でない場合は、useEffectが自動的に進行させる
      } else {
          // 全員確定 -> 2巡目へ
          addLog("1巡目指名終了。2巡目へ移ります。");
          setCurrentRound(2);
          setCurrentPickIndex(0);
          // 2巡目は逆ウェーバー (Top -> Bottom)
          // fullPickOrder は Waiver (Bottom -> Top) なので、reverseする
          setPickOrder([...fullPickOrder].reverse());
          setDraftPhase('waiver');
      }
  };

  // ハズレ1位指名の自動進行 (ユーザーが指名済みの場合)
  useEffect(() => {
      if (draftPhase === 'nomination' && currentRound === 1 && !loading) {
          const userTeamId = gameState.selectedTeamId;
          if (!userTeamId) return;

          const userHasDrafted = (draftResults[userTeamId]?.length || 0) >= 1;
          
          // ユーザーが指名済みだが、まだ指名していないチームがある場合 (ハズレ1位)
          if (userHasDrafted) {
              // まだ指名していないチームがあるか確認
              const pendingTeams = teams.filter(t => {
                  const draftedCount = draftResults[t.id]?.length || 0;
                  return draftedCount < 1;
              });

              if (pendingTeams.length > 0) {
                  // 少し待ってからCPU指名を実行
                  const timer = setTimeout(() => {
                      processFirstRoundNominations(null);
                  }, 1000);
                  return () => clearTimeout(timer);
              }
          }
      }
  }, [draftPhase, currentRound, draftResults, loading, teams, gameState.selectedTeamId]);

  const handleCpuPick = (teamId: string) => {
    const currentRosterCount = (teamRosterCounts[teamId] || 0) + (draftResults[teamId]?.length || 0);
    if (currentRosterCount >= ROSTER_LIMIT) {
        addLog(`${teams.find(t => t.id === teamId)?.name || teamId} は定員に達したため選択を終了します。`);
        setFinishedTeams(prev => [...prev, teamId]);
        advancePick();
        return;
    }

    // 指名可能な候補をフィルタリング
    const available = candidates.filter(p => (p.team as string) === 'unknown');
    
    if (available.length === 0) {
      addLog("候補選手がいません。");
      setFinishedTeams(prev => [...prev, teamId]); // このチームは終了
      advancePick();
      return;
    }

    // チームの補強ポイントを取得
    const needs = getDynamicNeeds(teamId);

    // スコアリングロジック: 能力値 * 補強ポイント倍率
    let bestPlayer: Player | null = null;
    let maxScore = -1;

    available.forEach(p => {
        const score = getPlayerScore(p) * (needs[p.position] || 1.0);
        if (score > maxScore) {
            maxScore = score;
            bestPlayer = p;
        }
    });

    // 閾値チェック (能力不足なら指名終了)
    if (!bestPlayer || maxScore < MIN_ABILITY_THRESHOLD) {
        addLog(`${teams.find(t => t.id === teamId)?.name || teamId} は選択を終了します。`);
        setFinishedTeams(prev => [...prev, teamId]);
        advancePick();
        return;
    }

    executePick(teamId, bestPlayer);
  };

  const getPlayerScore = (p: Player) => {
      let score = 0;
      if (p.position === 'P') {
          // 投手: 球速100km/hを基準0とし、そこからの上積みで評価
          // 平均: (145-100)*4.5 + 7.5*15 + 7.5*12 = 202.5 + 112.5 + 90 = 405
          const speedScore = Math.max(0, (p.scoutInfo?.speed || 0) - 100) * 4.5;
          score = speedScore + (p.scoutInfo?.control || 0) * 14 + (p.scoutInfo?.stamina || 0) * 11;
      } else {
          // 野手: 各能力(0-15) * 重み
          // 平均 7.5 * 係数合計53 = 397.5
          score = ((p.scoutInfo?.contact || 0) * 16 + (p.scoutInfo?.power || 0) * 16 + (p.scoutInfo?.fielding || 0) * 9 + (p.scoutInfo?.arm || 0) * 7 + (p.scoutInfo?.speedFielder || 0) * 8) * 1.05;
      }

      // 年齢補正: 18歳(高卒)=1.05, 22歳(大卒)=1.0, 24歳(社会人)=0.95
      let ageMultiplier = 1.0;
      if (p.age <= 18) ageMultiplier = 1.05;
      else if (p.age >= 24) ageMultiplier = 0.95;

      return score * ageMultiplier;
  };

  const handleAutoPick = () => {
    console.log("handleAutoPick called");
    const teamId = gameState.selectedTeamId;
    if (!teamId) {
        console.log("No selectedTeamId");
        showAlert("エラー", "チームが選択されていません。");
        return;
    }

    const available = candidates.filter(p => (p.team as string) === 'unknown');
    console.log(`Available candidates: ${available.length}`);
    
    const needs = getDynamicNeeds(teamId);
    
    let bestPlayer: Player | null = null;
    let maxScore = -1;

    available.forEach(p => {
        const score = getPlayerScore(p) * (needs[p.position] || 1.0);
        if (score > maxScore) {
            maxScore = score;
            bestPlayer = p;
        }
    });

    if (!bestPlayer) {
        console.log("No best player found");
        showAlert("エラー", "指名可能な選手がいません。");
        return;
    }
    
    const targetPlayer = bestPlayer as Player;
    console.log(`Best player: ${targetPlayer.name}, Phase: ${draftPhase}`);

    // 1巡目入札フェーズの場合
    if (draftPhase === 'nomination') {
        showAlert(
            "自動指名",
            `CPU推奨選手: ${targetPlayer.name} (${targetPlayer.position})\nこの選手を指名しますか？`,
            [
                { text: "キャンセル", style: "cancel" },
                { 
                    text: "指名する", 
                    onPress: () => {
                        console.log("Auto pick confirmed");
                        processFirstRoundNominations(targetPlayer);
                        setSelectedCandidate(null);
                    }
                }
            ]
        );
        return;
    }

    // 通常指名
    showAlert(
        "自動指名",
        `CPU推奨選手: ${targetPlayer.name} (${targetPlayer.position})\nこの選手を指名しますか？`,
        [
            { text: "キャンセル", style: "cancel" },
            { 
                text: "指名する", 
                onPress: () => {
                    executePick(teamId, targetPlayer);
                    setSelectedCandidate(null);
                }
            }
        ]
    );
  };

  const handleUserPick = () => {
    if (!selectedCandidate) {
      showAlert("選択エラー", "指名する選手を選択してください。");
      return;
    }
    if ((selectedCandidate.team as string) !== 'unknown') {
        showAlert("選択エラー", "この選手は既に指名されています。");
        return;
    }

    // 1巡目入札フェーズの場合
    if (draftPhase === 'nomination') {
        showAlert(
            "指名確認",
            `第1巡目指名選手として ${selectedCandidate.name} を提出しますか？\n(他球団と重複した場合は抽選となります)`,
            [
                { text: "キャンセル", style: "cancel" },
                { 
                    text: "提出する", 
                    onPress: () => {
                        processFirstRoundNominations(selectedCandidate);
                        setSelectedCandidate(null);
                    }
                }
            ]
        );
        return;
    }

    const currentTeamId = pickOrder[currentPickIndex];
    
    // ロースター制限チェック (警告のみで指名は許可するか、禁止するか。ここでは禁止にする)
    const currentRosterCount = (teamRosterCounts[currentTeamId] || 0) + (draftResults[currentTeamId]?.length || 0);
    if (currentRosterCount >= ROSTER_LIMIT) {
        showAlert(
            "指名不可", 
            `支配下登録選手の上限(${ROSTER_LIMIT}人)に達しているため、これ以上指名できません。\n選択を終了してください。`
        );
        return;
    }

    executePick(currentTeamId, selectedCandidate);
    setSelectedCandidate(null);
  };

  const handleUserFinish = () => {
    showAlert(
        "選択終了",
        "今回のドラフト指名を終了しますか？\nこれ以降のラウンドでは指名できません。",
        [
            { text: "キャンセル", style: "cancel" },
            { 
                text: "終了する", 
                onPress: () => {
                    const currentTeamId = pickOrder[currentPickIndex];
                    addLog(`${teams.find(t => t.id === currentTeamId)?.name || currentTeamId} は選択を終了しました。`);
                    setFinishedTeams(prev => [...prev, currentTeamId]);
                    advancePick();
                }
            }
        ]
    );
  };

  const executePick = (teamId: string, player: Player, shouldAdvance: boolean = true) => {
    // 選手のチームを更新
    const updatedPlayer: Player = { ...player, team: teamId as unknown as TeamId, draftRank: currentRound };
    
    // 候補リストを更新 (指名済みとしてマーク)
    setCandidates(prev => prev.map(p => p.id === player.id ? updatedPlayer : p));
    
    // 結果を更新
    setDraftResults(prev => ({
        ...prev,
        [teamId]: [...(prev[teamId] || []), updatedPlayer]
    }));

    const teamName = teams.find(t => t.id === teamId)?.name || teamId;
    // 1巡目入札時はログを出さない（抽選結果で出す）
    if (draftPhase !== 'nomination') {
        addLog(`${currentRound}巡目: ${teamName} は ${player.name} (${player.position}) を指名しました。`);
    }

    if (shouldAdvance) {
        advancePick();
    }
  };

  const advancePick = () => {
    if (currentPickIndex < pickOrder.length - 1) {
      setCurrentPickIndex(prev => prev + 1);
    } else {
      // ラウンド終了
      if (currentRound < MAX_ROUNDS) {
        setCurrentRound(prev => prev + 1);
        setCurrentPickIndex(0);
        
        // 2巡目へ移行する場合 (Round 1 -> Round 2)
        if (currentRound === 1) {
             // 2巡目は逆ウェーバー (Top -> Bottom)
             // fullPickOrder は Waiver (Bottom -> Top) なので、reverseする
             setPickOrder([...fullPickOrder].reverse());
        } else {
             // 3巡目以降は前のラウンドの逆
             setPickOrder(prev => [...prev].reverse());
        }
        addLog(`--- 第${currentRound + 1}巡目 ---`);
      } else {
            finishDraft();
      }
    }
  };

  const finishDraft = () => {
    setIsDraftOver(true);
    addLog("全指名が終了しました。");
    addLog("右下の「終了する」ボタンを押してドラフトを完了してください。");
  };

  const performSave = async () => {
    try {
        setLoading(true);
        // 指名された全選手を収集
        const allDraftedPlayers = Object.values(draftResults).flat();
        
        // DBに保存
        await dbManager.registerDraftPlayers(allDraftedPlayers);

        // ニュース作成
        const newsItems: NewsItem[] = [];
        const date = Date.now();

        for (const [teamId, players] of Object.entries(draftResults)) {
            const teamName = teams.find(t => t.id === teamId)?.name || teamId;
            const content = players.map((p, index) => `${index + 1}位: ${p.name} (${p.position}・${p.age}歳)`).join('\n');
            
            newsItems.push({
                id: `draft_${teamId}_${date}`,
                date: date,
                title: `${teamName} ドラフト指名結果`,
                content: content,
                type: 'draft',
                affectedTeams: [teamId as unknown as TeamId]
            });
        }
        await dbManager.addNews(newsItems);
        
        // 次のフェーズへ進める
        dispatch(setOffSeasonStep('contract'));
        return true;
    } catch (error) {
        console.error("Failed to save draft results:", error);
        showAlert("エラー", "保存に失敗しました。");
        setLoading(false);
        return false;
    }
  };

  const saveAndExit = async () => {
    isExiting.current = true;
    const success = await performSave();
    if (success) {
        showAlert("保存完了", "ドラフト会議を終了します。", [
            { text: "OK", onPress: () => navigation.goBack() }
        ]);
    } else {
        isExiting.current = false;
    }
  };

  // Prevent going back without saving
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (isExiting.current) {
        return;
      }

      e.preventDefault();

      showAlert(
        'ドラフト会議の終了',
        'ドラフト会議を終了して結果を保存しますか？',
        [
          { text: 'キャンセル', style: 'cancel', onPress: () => {} },
          {
            text: '保存して終了',
            style: 'destructive',
            onPress: async () => {
                isExiting.current = true;
                const success = await performSave();
                if (success) {
                    navigation.dispatch(e.data.action);
                } else {
                    isExiting.current = false;
                }
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, draftResults]);

  const getOverallRankLetter = (score: number) => {
    if (score >= 530) return 'S';
    if (score >= 430) return 'A';
    if (score >= 350) return 'B';
    if (score >= 280) return 'C';
    if (score >= 220) return 'D';
    return 'E';
  };

  const renderCandidateItem = ({ item }: { item: Player }) => {
    const isSelected = selectedCandidate?.id === item.id;
    const isTaken = (item.team as string) !== 'unknown';
    const score = getPlayerScore(item);
    const rank = getOverallRankLetter(score);
    
    return (
      <TouchableOpacity 
        style={[
            styles.candidateRow, 
            isSelected && styles.selectedRow,
            isTaken && styles.takenRow
        ]}
        onPress={() => !isTaken && setSelectedCandidate(item)}
        disabled={isTaken}
      >
        <View style={styles.candidateInfo}>
            <Text style={styles.candidateName}>{item.name}</Text>
            <Text style={styles.candidateDetail}>{item.position} | {item.age}歳</Text>
        </View>
        <View style={styles.rankContainer}>
            <Text style={styles.rankLabel}>総合</Text>
            <Text style={[styles.rankValue, { color: rank === 'S' ? '#FFD700' : rank === 'A' ? '#FF5722' : '#333' }]}>{rank}</Text>
        </View>
        <View style={styles.candidateStats}>
            {item.position === 'P' ? (
                <Text style={styles.statText}>MAX: {item.scoutInfo?.speed}km | ：制球: {getRank(item.scoutInfo?.control)} | スタミナ: {getRank(item.scoutInfo?.stamina)}</Text>
            ) : (
                <Text style={styles.statText}>弾道: {item.scoutInfo?.trajectory ? Math.round(item.scoutInfo.trajectory) : '-'} | コンタクト: {getRank(item.scoutInfo?.contact)} | パワー: {getRank(item.scoutInfo?.power)} | 走力: {getRank(item.scoutInfo?.speedFielder)} | 肩: {getRank(item.scoutInfo?.arm)} | 守備: {getRank(item.scoutInfo?.fielding)}</Text>
            )}
            {isTaken && (
                <Text style={styles.takenText}>
                    {teams.find(t => t.id === item.team)?.name || item.team} {item.draftRank}位
                </Text>
            )}
        </View>
      </TouchableOpacity>
    );
  };

  const filteredCandidates = candidates.filter(p => {
      if (filterPosition === 'All') return true;
      if (filterPosition === 'P') return p.position === 'P';
      return p.position !== 'P';
  }).sort((a, b) => {
      if (sortType === 'Evaluation') {
          return getPlayerScore(b) - getPlayerScore(a);
      }
      if (sortType === 'Position') {
          const positionOrder: Record<string, number> = {
              'P': 0,
              'C': 1,
              '1B': 2, '2B': 3, '3B': 4, 'SS': 5,
              'LF': 6, 'CF': 7, 'RF': 8
          };
          const orderA = positionOrder[a.position] ?? 99;
          const orderB = positionOrder[b.position] ?? 99;
          
          if (orderA !== orderB) return orderA - orderB;
          return getPlayerScore(b) - getPlayerScore(a);
      }
      return 0; // デフォルト順（ID順など）
  });

  const currentTeamId = pickOrder[currentPickIndex];
  const currentTeamName = teams.find(t => t.id === currentTeamId)?.name || currentTeamId;
  
  // 1巡目入札時は、順番に関係なくユーザーのターンとする
  // ただし、既に指名済みの場合は除く
  const isUserDoneInRound = gameState.selectedTeamId ? (draftResults[gameState.selectedTeamId]?.length || 0) >= currentRound : false;
  const isUserTurn = !isDraftOver && (
      (draftPhase === 'nomination' && !isUserDoneInRound) || 
      (draftPhase !== 'nomination' && currentTeamId === gameState.selectedTeamId)
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ドラフト会議</Text>
        {!isDraftOver ? (
            <Text style={styles.roundText}>
              {draftPhase === 'nomination' ? '第1巡目 - 入札' :
               draftPhase === 'lottery' ? '第1巡目 - 抽選' :
               `第${currentRound}巡目 - 指名中: ${currentTeamName}`}
            </Text>
        ) : (
            <Text style={styles.roundText}>終了</Text>
        )}
      </View>

      <View style={styles.content}>
        {/* 左パネル: 候補選手 */}
        <View style={styles.leftPanel}>
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.filterContainer}
                contentContainerStyle={styles.filterContentContainer}
            >
                <TouchableOpacity style={[styles.filterButton, filterPosition === 'All' && styles.activeFilter]} onPress={() => setFilterPosition('All')}>
                    <Text style={styles.filterText}>全て</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterButton, filterPosition === 'P' && styles.activeFilter]} onPress={() => setFilterPosition('P')}>
                    <Text style={styles.filterText}>投手</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterButton, filterPosition === 'Fielder' && styles.activeFilter]} onPress={() => setFilterPosition('Fielder')}>
                    <Text style={styles.filterText}>野手</Text>
                </TouchableOpacity>
                <View style={styles.separator} />
                <TouchableOpacity style={[styles.filterButton, sortType === 'Evaluation' && styles.activeFilter]} onPress={() => setSortType('Evaluation')}>
                    <Text style={styles.filterText}>評価順</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterButton, sortType === 'Position' && styles.activeFilter]} onPress={() => setSortType('Position')}>
                    <Text style={styles.filterText}>ポジション順</Text>
                </TouchableOpacity>
            </ScrollView>
            <FlatList
                data={filteredCandidates}
                renderItem={renderCandidateItem}
                keyExtractor={item => item.id.toString()}
                style={styles.list}
            />
        </View>

        {/* 右パネル: 情報とログ */}
        <View style={styles.rightPanel}>
            <View style={styles.selectedInfo}>
                <Text style={styles.panelTitle}>選択中の選手</Text>
                {selectedCandidate ? (
                    <View>
                        <Text style={styles.selectedName}>{selectedCandidate.name}</Text>
                        <Text>{selectedCandidate.position} / {selectedCandidate.age}歳</Text>
                        {/* ここに詳細を追加 */}
                    </View>
                ) : (
                    <Text style={styles.placeholderText}>選手を選択してください</Text>
                )}
                
                <TouchableOpacity 
                    style={[styles.draftButton, (!isUserTurn || !selectedCandidate) && styles.disabledButton]}
                    onPress={handleUserPick}
                    disabled={!isUserTurn || !selectedCandidate}
                >
                    <Text style={styles.draftButtonText}>指名する</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.draftButton, styles.autoButton, !isUserTurn && styles.disabledButton]}
                    onPress={handleAutoPick}
                    disabled={!isUserTurn}
                >
                    <Text style={styles.draftButtonText}>お任せ (CPU指名)</Text>
                </TouchableOpacity>

                {isUserTurn && (
                    <TouchableOpacity 
                        style={[styles.draftButton, styles.finishTurnButton]}
                        onPress={handleUserFinish}
                    >
                        <Text style={styles.draftButtonText}>選択終了</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.logsContainer}>
                <Text style={styles.panelTitle}>指名ログ</Text>
                <ScrollView ref={scrollViewRef} style={styles.logsList}>
                    {logs.map((log, index) => (
                        <Text key={index} style={styles.logText}>{log}</Text>
                    ))}
                </ScrollView>
            </View>
            
            {isDraftOver && (
                <TouchableOpacity style={styles.finishButton} onPress={saveAndExit}>
                    <Text style={styles.finishButtonText}>終了する</Text>
                </TouchableOpacity>
            )}
        </View>
      </View>

      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalConfig.title}</Text>
            <Text style={styles.modalMessage}>{modalConfig.message}</Text>
            <View style={styles.modalButtons}>
              {modalConfig.buttons.map((btn, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.modalButton, btn.style === 'cancel' ? styles.cancelButton : styles.okButton]}
                  onPress={() => {
                    setModalVisible(false);
                    if (btn.onPress) btn.onPress();
                  }}
                >
                  <Text style={styles.modalButtonText}>{btn.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 15,
    backgroundColor: '#3F51B5',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  roundText: {
    fontSize: 16,
    color: '#E8EAF6',
    marginTop: 5,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPanel: {
    flex: 2,
    borderRightWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  rightPanel: {
    flex: 1,
    padding: 10,
    backgroundColor: '#FAFAFA',
  },
  filterContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
    flexGrow: 0,
  },
  filterContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#eee',
    marginRight: 8,
  },
  activeFilter: {
    backgroundColor: '#3F51B5',
  },
  separator: {
    width: 1,
    height: '100%',
    backgroundColor: '#ccc',
    marginHorizontal: 5,
  },
  filterText: {
    fontSize: 12,
    color: '#333',
  },
  list: {
    flex: 1,
  },
  candidateRow: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedRow: {
    backgroundColor: '#E8EAF6',
  },
  takenRow: {
    backgroundColor: '#f0f0f0',
    opacity: 0.6,
  },
  candidateInfo: {
    flex: 1,
  },
  rankContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    width: 40,
  },
  rankLabel: {
    fontSize: 10,
    color: '#666',
  },
  rankValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  candidateName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  candidateDetail: {
    fontSize: 12,
    color: '#666',
  },
  finishTurnButton: {
    backgroundColor: '#757575',
    marginTop: 10,
  },
  candidateStats: {
    flex: 2,
    alignItems: 'flex-end',
  },
  statText: {
    fontSize: 11,
    color: '#444',
  },
  takenText: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: 'bold',
    marginTop: 2,
  },
  selectedInfo: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
    elevation: 2,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#555',
  },
  selectedName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  placeholderText: {
    color: '#999',
    fontStyle: 'italic',
  },
  draftButton: {
    marginTop: 15,
    backgroundColor: '#E91E63',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  autoButton: {
    backgroundColor: '#2196F3',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  draftButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  logsContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    elevation: 2,
  },
  logsList: {
    flex: 1,
  },
  logText: {
    fontSize: 12,
    marginBottom: 4,
    color: '#333',
  },
  finishButton: {
    marginTop: 10,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  okButton: {
    backgroundColor: '#2196F3',
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
