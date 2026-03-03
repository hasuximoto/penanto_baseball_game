import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, SafeAreaView } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { TEAM_ABBREVIATIONS, OFF_SEASON_TURNS } from '../utils/constants';
import { startNewSeason, setOffSeasonStep, setReinforcementTurn } from '../redux/slices/gameSlice';
import { ContractManager } from '../services/contractManager';
import { SpringCampManager } from '../services/springCampManager';
import { SeasonManager } from '../services/seasonManager';
import { dbManager } from '../services/databaseManager';
import { COLORS, FONTS, SPACING } from '@/utils/theme';
import { Ionicons } from '@expo/vector-icons';

export const StoveLeagueScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const gameState = useSelector((state: RootState) => state.game);
  const currentSeason = gameState.season;
  const offSeasonStep = gameState.offSeasonStep || 'draft';
  const selectedTeamId = gameState.selectedTeamId;

  const [teamPayroll, setTeamPayroll] = useState(0);
  const [teamBudget, setTeamBudget] = useState<number | null>(null);

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

  const persistGameProgress = async (updates: Partial<typeof gameState>) => {
    const nextState = {
      ...gameState,
      ...updates,
    };
    await dbManager.saveGameState(nextState);
  };

  const loadTeamFinance = async () => {
    if (!selectedTeamId) {
      setTeamPayroll(0);
      setTeamBudget(null);
      return;
    }

    try {
      const [roster, teams] = await Promise.all([
        dbManager.getTeamRoster(selectedTeamId),
        dbManager.getInitialTeams(),
      ]);

      const payroll = roster.reduce((sum: number, player: any) => sum + (player.contract?.salary || 0), 0);
      const team = teams.find((t: any) => t.id === selectedTeamId);

      setTeamPayroll(payroll);
      setTeamBudget(typeof team?.budget === 'number' ? team.budget : null);
    } catch (error) {
      console.error('Failed to load team finance:', error);
      setTeamPayroll(0);
      setTeamBudget(null);
    }
  };

  useEffect(() => {
    loadTeamFinance();
  }, [selectedTeamId, offSeasonStep]);

  const handleDraft = () => {
    navigation.navigate('Draft' as never);
  };

  const handleContract = async () => {
    showAlert(
      "契約更改",
      "全チームの契約更改、引退処理、戦力外通告を行います。\n実行しますか？",
      [
        { text: "キャンセル", style: "cancel" },
        { 
          text: "実行する", 
          onPress: async () => {
            try {
              const logs = await ContractManager.processOffSeasonContracts(gameState.selectedTeamId, currentSeason);

              if (gameState.selectedTeamId) {
                dispatch(setOffSeasonStep('contract_user'));
                dispatch(setReinforcementTurn(0));
                await persistGameProgress({ offSeasonStep: 'contract_user', reinforcementTurn: 0 });
              }

              // モーダルの開閉タイミングを調整するために少し待つ
              setTimeout(() => {
                if (gameState.selectedTeamId) {
                  showAlert(
                    "契約更改完了", 
                    "契約更改と引退処理が完了しました。\n続いて戦力外通告を行います。",
                    [{ 
                        text: "戦力外通告へ", 
                        onPress: () => {
                          console.log("Navigating to ReleasePlayers");
                          navigation.navigate('ReleasePlayers' as never);
                        }
                    }]
                  );
                } else {
                  dispatch(setOffSeasonStep('reinforcement'));
                  dispatch(setReinforcementTurn(1));
                  persistGameProgress({ offSeasonStep: 'reinforcement', reinforcementTurn: 1 });
                  showAlert("完了", "契約更改が完了しました。\n\n" + "引退・戦力外はニュースを確認してください。");
                }
              }, 500);
            } catch (error) {
              console.error(error);
              setTimeout(() => {
                showAlert("エラー", "処理中にエラーが発生しました。");
              }, 500);
            }
          }
        }
      ]
    );
  };
  const handleReinforcement = () => {
    const turn = gameState.reinforcementTurn || 1;
    
    showAlert(
      `戦力補強期間 (ターン ${turn}/${OFF_SEASON_TURNS})`,
      "行うアクションを選択してください。",
      [
        { text: "キャンセル", style: "cancel" },
        { 
            text: "FA交渉", 
            onPress: () => (navigation as any).navigate('OffSeasonMarket')
        },
        { 
            text: "トレード", 
            onPress: () => showAlert("トレード", "トレード機能は仮実装です。") 
        },
        {
            text: "次のターンへ",
            onPress: () => processNextTurn(turn)
        }
      ]
    );
  };

  const processNextTurn = async (currentTurn: number) => {
      // 他球団の動向などをシミュレート
      try {
        const logs = await ContractManager.processFATurn(gameState, currentTurn);
        if (logs.length > 0) {
            // 移籍決定などのニュースがあれば表示したいが、ここではログ出力のみ
            console.log(logs);
        }
      } catch (e) {
        console.error("FA turn processing failed", e);
      }
      
      if (currentTurn >= OFF_SEASON_TURNS) {
          dispatch(setOffSeasonStep('camp'));
          await persistGameProgress({ offSeasonStep: 'camp' });
          showAlert("期間終了", "戦力補強期間が終了しました。\n次は春季キャンプです。");
      } else {
          dispatch(setReinforcementTurn(currentTurn + 1));
          await persistGameProgress({ reinforcementTurn: currentTurn + 1 });
          showAlert("ターン経過", `ターン ${currentTurn + 1} になりました。`);
      }
  };

  const handleSpringCamp = async () => {
    showAlert(
      "春季キャンプ",
      "全選手の能力変動処理を行います。\n実行しますか？",
      [
        { text: "キャンセル", style: "cancel" },
        { 
          text: "実行する", 
          onPress: async () => {
            try {
              const logs = await SpringCampManager.processSpringCamp();
              
              // 次のフェーズへ
              dispatch(setOffSeasonStep('next_season'));
              await persistGameProgress({ offSeasonStep: 'next_season' });

              const changedCount = logs.filter(l => l.includes(':')).length;
              showAlert("完了", `春季キャンプが終了しました。\n${changedCount}人の能力が変動しました。`);
            } catch (error) {
              console.error(error);
              showAlert("エラー", "処理中にエラーが発生しました。");
            }
          }
        }
      ]
    );
  };

  const handleNextSeason = () => {
    showAlert(
      "シーズン終了",
      "現在のシーズンを終了し、翌シーズンへ移行します。\nよろしいですか？",
      [
        { text: "キャンセル", style: "cancel" },
        { 
          text: "翌シーズンへ", 
          onPress: async () => {
            try {
              // 0. 未所属選手の引退処理
              await ContractManager.retireUnsignedPlayers();

              // 1. DBデータの更新 (スケジュール、成績リセット)
              await SeasonManager.startNewSeason(currentSeason + 1);
              
              // 2. Reduxステートの更新 (年度更新、日付リセット)
              dispatch(startNewSeason());
              
              // 3. 新しい状態をDBに保存 (MainMenuScreenでのリロード対策)
              // ReduxのstartNewSeasonと同じ状態を作成して保存
              const nextState = {
                  ...gameState,
                  season: currentSeason + 1,
                  currentDate: 1,
                  day: 1,
                  gameStatus: 'before',
                  playableFlags: {
                    canPlayGame: true,
                    gameExecuted: false,
                    seasonEnded: false,
                  },
                  homeTeamScore: 0,
                  awayTeamScore: 0,
                  currentInning: 1,
                  currentOuts: 0,
                  baseRunners: [false, false, false],
                  offSeasonStep: 'draft'
              };
              await dbManager.saveGameState(nextState);

              // 4. メインメニューへ戻る (スタックをリセット)
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [
                    { name: 'MainMenu' },
                  ],
                })
              );
              
              showAlert("新シーズン開始", `${currentSeason + 1}年シーズンを開始します！`);
            } catch (error) {
              console.error(error);
                            showAlert("エラー", "シーズン移行中にエラーが発生しました。");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color={COLORS.textMain} />
            </TouchableOpacity>
        </View>
        <View style={styles.headerCenter}>
            <Text style={styles.title}>オフシーズンメニュー</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.menuContainer}>
        <View style={styles.financeCard}>
          <Text style={styles.financeLabel}>チーム財務</Text>
          <View style={styles.financeRow}>
            <Text style={styles.financeKey}>総年俸</Text>
            <Text style={styles.financeValue}>{teamPayroll.toLocaleString('ja-JP')}万円</Text>
          </View>
          <View style={styles.financeRow}>
            <Text style={styles.financeKey}>予算</Text>
            <Text style={styles.financeValue}>
              {teamBudget !== null ? `${teamBudget.toLocaleString('ja-JP')}万円` : '--'}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
            style={[styles.menuButton, offSeasonStep !== 'draft' && styles.disabledButton]} 
            onPress={handleDraft}
            disabled={offSeasonStep !== 'draft'}
        >
          <View style={styles.iconContainer}>
              <Ionicons name="people-outline" size={32} color={offSeasonStep === 'draft' ? COLORS.primary : COLORS.textMuted} />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.menuButtonText, offSeasonStep !== 'draft' && { color: COLORS.textMuted }]}>ドラフト会議</Text>
            <Text style={styles.menuDescription}>新人選手を獲得します</Text>
          </View>
          {offSeasonStep !== 'draft' && <Text style={styles.completedText}>完了</Text>}
        </TouchableOpacity>

        <TouchableOpacity 
            style={[styles.menuButton, offSeasonStep !== 'contract' && styles.disabledButton]} 
            onPress={handleContract}
            disabled={offSeasonStep !== 'contract'}
        >
          <View style={styles.iconContainer}>
              <Ionicons name="document-text-outline" size={32} color={offSeasonStep === 'contract' ? COLORS.primary : COLORS.textMuted} />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.menuButtonText, offSeasonStep !== 'contract' && { color: COLORS.textMuted }]}>契約更改</Text>
            <Text style={styles.menuDescription}>全チームの契約更改と引退処理を行います</Text>
          </View>
          {offSeasonStep === 'contract_user' || offSeasonStep === 'reinforcement' || offSeasonStep === 'camp' || offSeasonStep === 'next_season' ? <Text style={styles.completedText}>完了</Text> : null}
        </TouchableOpacity>

        <TouchableOpacity
            style={[styles.menuButton, offSeasonStep !== 'contract_user' && styles.disabledButton]}
            onPress={() => navigation.navigate('ReleasePlayers' as never)}
            disabled={offSeasonStep !== 'contract_user'}
        >
          <View style={styles.iconContainer}>
              <Ionicons name="person-outline" size={32} color={offSeasonStep === 'contract_user' ? COLORS.primary : COLORS.textMuted} />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.menuButtonText, offSeasonStep !== 'contract_user' && { color: COLORS.textMuted }]}>自チーム契約・戦力外</Text>
            <Text style={styles.menuDescription}>自チームの契約調整と戦力外通知を行います</Text>
          </View>
          {offSeasonStep === 'reinforcement' || offSeasonStep === 'camp' || offSeasonStep === 'next_season' ? <Text style={styles.completedText}>完了</Text> : null}
        </TouchableOpacity>

        <TouchableOpacity 
            style={[styles.menuButton, offSeasonStep !== 'reinforcement' && styles.disabledButton]} 
            onPress={handleReinforcement}
            disabled={offSeasonStep !== 'reinforcement'}
        >
          <View style={styles.iconContainer}>
              <Ionicons name="briefcase-outline" size={32} color={offSeasonStep === 'reinforcement' ? COLORS.primary : COLORS.textMuted} />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.menuButtonText, offSeasonStep !== 'reinforcement' && { color: COLORS.textMuted }]}>戦力補強期間</Text>
            <Text style={styles.menuDescription}>FA交渉・トレード・外国人獲得 (残り{OFF_SEASON_TURNS + 1 - (gameState.reinforcementTurn || 1)}ターン)</Text>
          </View>
          {offSeasonStep === 'camp' || offSeasonStep === 'next_season' ? <Text style={styles.completedText}>完了</Text> : null}
        </TouchableOpacity>

        <TouchableOpacity 
            style={[styles.menuButton, offSeasonStep !== 'camp' && styles.disabledButton]} 
            onPress={handleSpringCamp}
            disabled={offSeasonStep !== 'camp'}
        >
           <View style={styles.iconContainer}>
              <Ionicons name="fitness-outline" size={32} color={offSeasonStep === 'camp' ? COLORS.primary : COLORS.textMuted} />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.menuButtonText, offSeasonStep !== 'camp' && { color: COLORS.textMuted }]}>春季キャンプ</Text>
            <Text style={styles.menuDescription}>選手の能力を強化します</Text>
          </View>
          {offSeasonStep === 'next_season' && <Text style={styles.completedText}>完了</Text>}
        </TouchableOpacity>

        <View style={styles.separator} />

        <TouchableOpacity 
            style={[styles.menuButton, styles.nextSeasonButton, offSeasonStep !== 'next_season' && styles.disabledButton]} 
            onPress={handleNextSeason}
            disabled={offSeasonStep !== 'next_season'}
        >
          <View style={styles.iconContainer}>
              <Ionicons name="calendar-outline" size={32} color={COLORS.background} />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.menuButtonText, { color: COLORS.background }]}>翌シーズンへ</Text>
            <Text style={[styles.menuDescription, { color: 'rgba(18, 18, 18, 0.7)' }]}>新しいシーズンを開始します</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

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
                  <Text style={[styles.modalButtonText, btn.style === 'cancel' ? { color: COLORS.textMuted } : { color: COLORS.background }]}>{btn.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
  },
  headerLeft: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textMain,
    fontFamily: FONTS.bold,
  },
  menuContainer: {
    padding: SPACING.md,
  },
  financeCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  financeLabel: {
    color: COLORS.textMuted,
    fontFamily: FONTS.bold,
    fontSize: 12,
    marginBottom: SPACING.xs,
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  financeKey: {
    color: COLORS.textMain,
    fontFamily: FONTS.regular,
    fontSize: 14,
  },
  financeValue: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  iconContainer: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  textContainer: {
    flex: 1,
  },
  disabledButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.border,
    opacity: 0.7,
  },
  completedText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 10,
  },
  menuButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textMain,
    marginBottom: 4,
    fontFamily: FONTS.regular,
  },
  menuDescription: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
  },
  separator: {
    height: 20,
  },
  nextSeasonButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: COLORS.textMain,
    fontFamily: FONTS.regular,
  },
  modalButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    marginBottom: 5,
  },
  okButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.textMuted,
  },
  modalButtonText: {
    fontWeight: 'bold',
    fontFamily: FONTS.bold,
  },
});
