import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Dimensions,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { gameEngine } from '@/services/gameEngine';
import { dbManager } from '@/services/databaseManager';
import { addDays, resetGame, incrementDate, setGameState, setPlayableFlags, setSelectedTeam } from '@/redux/slices/gameSlice';
import { Player } from '@/types';
import { RosterModal } from '@/components/RosterModal';
import { getGameDateString, formatDateJP } from '@/utils/dateUtils';
import { COLORS, SPACING } from '@/utils/theme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - SPACING.md * 3) / 2;

/**
 * MainMenuScreen - メインメニュー画面
 * Refactored for Modern Dark & Gold Design
 */
export const MainMenuScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch();
  const gameState = useSelector((state: RootState) => state.game);
  const [pacificStandings, setPacificStandings] = useState<any[]>([]);
  const [centralStandings, setCentralStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [skipModalVisible, setSkipModalVisible] = useState(false);
  const [skipDays, setSkipDays] = useState('1');
  
  // Roster Modal State
  const [rosterModalVisible, setRosterModalVisible] = useState(false);
  const [selectedTeamName, setSelectedTeamName] = useState('');
  const [viewingTeamId, setViewingTeamId] = useState<string | null>(null);
  const [groupedRoster, setGroupedRoster] = useState<Record<string, Player[]>>({});

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

  // Load game state from DB on mount
  useEffect(() => {
    const loadState = async () => {
      const savedState = await dbManager.loadGameState();
      if (savedState) {
        dispatch(setGameState(savedState));
      }
      
      // 選手能力の再計算（シーズン開始時や起動時にチェック）
      await gameEngine.updateAllPlayersOverall();
    };
    loadState();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStandings();
    }, [])
  );

  const loadStandings = async () => {
    try {
      setLoading(true);
      const teams = await dbManager.getInitialTeams();
      
      // ゲーム差とマジックを計算
      const processedTeams = dbManager.calculateStandingsInfo(teams);

      const pacific = processedTeams.filter(t => t.league === 'pacific');
      const central = processedTeams.filter(t => t.league === 'central');

      // calculateStandingsInfo ですでにソートされているのでそのままセット
      setPacificStandings(pacific);
      setCentralStandings(central);
    } catch (error) {
      console.error('Failed to load standings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamPress = async (team: any) => {
    try {
      setLoading(true);
      const roster = await dbManager.getTeamRoster(team.id);
      // Filter active players
      const activePlayers = roster.filter(p => p.registrationStatus === 'active' || !p.registrationStatus);
      
      // Group by position category
      const grouped: Record<string, Player[]> = {
        '投手': [],
        '捕手': [],
        '内野手': [],
        '外野手': []
      };

      activePlayers.forEach(p => {
        if (p.position === 'P') grouped['投手'].push(p);
        else if (p.position === 'C') grouped['捕手'].push(p);
        else if (['1B', '2B', '3B', 'SS'].includes(p.position)) grouped['内野手'].push(p);
        else if (['LF', 'CF', 'RF', 'OF'].includes(p.position)) grouped['外野手'].push(p);
        else if (p.position === 'DH') grouped['内野手'].push(p); // DHは便宜上内野手枠かその他へ
        else grouped['内野手'].push(p); // Fallback
      });

      setGroupedRoster(grouped);
      setSelectedTeamName(team.name);
      setViewingTeamId(team.id);
      setRosterModalVisible(true);
    } catch (error) {
      console.error('Failed to load team roster:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTeam = async () => {
      if (viewingTeamId) {
          dispatch(setSelectedTeam(viewingTeamId));
          // DBにも保存
          const nextState = { ...gameState, selectedTeamId: viewingTeamId };
          await dbManager.saveGameState(nextState);
          
          setRosterModalVisible(false);
          showAlert("チーム選択", `${selectedTeamName} を操作チームに設定しました。`);
      }
  };

  const handleGameStart = async () => {
    try {
      setLoading(true);
      const results = await gameEngine.simulateLeagueDay(gameState);
      
      // 日付を進める
      dispatch(incrementDate());
      
      // Save state to DB
      const nextState = { ...gameState, currentDate: gameState.currentDate + 1, day: gameState.day + 1 };
      await dbManager.saveGameState(nextState);

      // ポストシーズン生成チェック
      const nextDate = gameState.currentDate + 1;
      const psStatus = await dbManager.checkAndGeneratePostSeason(nextDate, gameState.season);
      console.log('Post-season status:', psStatus);
      if (psStatus) {
          let message = '';
          if (psStatus === 'cs_first_generated') message = 'クライマックスシリーズ 1stステージの日程が決定しました！';
          if (psStatus === 'cs_final_generated') message = 'クライマックスシリーズ ファイナルステージの日程が決定しました！';
          if (psStatus === 'nippon_series_generated') message = '日本シリーズの日程が決定しました！';
          if (psStatus === 'season_completed') {
            message = '全日程が終了しました。オフシーズンへ移行します。';
            dispatch(setPlayableFlags({ seasonEnded: true }));
            // Save the seasonEnded flag
            await dbManager.saveGameState({
                ...nextState,
                playableFlags: { ...nextState.playableFlags, seasonEnded: true }
            });
          }
          showAlert("お知らせ", message);
      }

      setLoading(false);
      
      if (results.length > 0) {
        navigation.navigate('DailyResults', { results });
      } else {
        showAlert("お知らせ", '今日は試合がありませんでした。(移動日)');
        // スタンディングスを更新（疲労回復などは行われているため）
        loadStandings();
      }
    } catch (error) {
      console.error('Failed to start game:', error);
      setLoading(false);
    }
  };

  const handleSkipDays = async () => {
    const days = parseInt(skipDays, 10);
    if (isNaN(days) || days <= 0) {
      showAlert("エラー", 'Please enter a valid number of days.');
      return;
    }

    try {
      setLoading(true);
      setSkipModalVisible(false);
      
      // Run auto play
      const { results, daysSkipped, stopReason } = await gameEngine.autoPlayGames(gameState, days);
      
      // Update Redux state
      dispatch(addDays(daysSkipped));
      
      // Save state to DB
      const nextState = { ...gameState, currentDate: gameState.currentDate + daysSkipped, day: gameState.day + daysSkipped };
      await dbManager.saveGameState(nextState);
      
      // Reload standings
      await loadStandings();
      
      // ポストシーズン生成チェック (autoPlayGames内でもチェックしているが、メッセージ表示のために再確認またはstopReasonを使用)
      // stopReasonがあればそれを使用、なければ念のため再チェック
      let psStatus: string | null | undefined = stopReason;
      if (!psStatus) {
          psStatus = await dbManager.checkAndGeneratePostSeason(nextState.currentDate, nextState.season);
      }
      
      if (psStatus) {
          let message = '';
          if (psStatus === 'cs_first_generated') message = 'クライマックスシリーズ 1stステージの日程が決定しました！';
          if (psStatus === 'cs_final_generated') message = 'クライマックスシリーズ ファイナルステージの日程が決定しました！';
          if (psStatus === 'nippon_series_generated') message = '日本シリーズの日程が決定しました！';
          if (psStatus === 'season_completed') {
            message = '全日程が終了しました。オフシーズンへ移行します。';
            dispatch(setPlayableFlags({ seasonEnded: true }));
            // Save the seasonEnded flag
            await dbManager.saveGameState({
                ...nextState,
                playableFlags: { ...nextState.playableFlags, seasonEnded: true }
            });
          }
          if (message) showAlert("お知らせ", message);
      } else {
          showAlert("完了", `Simulated ${daysSkipped} days successfully.`);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to skip days:', error);
      setLoading(false);
      showAlert("エラー", 'Failed to skip days.');
    }
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleStoveLeague = () => {
    navigation.navigate('StoveLeague');
  };

  // ----- Render Components -----

  const renderDashboardHeader = () => (
    <View style={styles.dashboardHeader}>
      <View style={styles.dateCard}>
        <Text style={styles.seasonText}>{gameState.season}</Text>
        <Text style={styles.dateText}>{formatDateJP(getGameDateString(gameState.currentDate, gameState.season))}</Text>
      </View>
      <View style={styles.statusBadge}>
         <Ionicons name="baseball-outline" size={16} color={COLORS.primary} />
         <Text style={styles.statusText}> SEASON ACTIVE </Text>
      </View>
    </View>
  );

  const renderActionGrid = () => (
    <View style={styles.gridContainer}>
      {/* Primary Action: Play / Skip */}
      <TouchableOpacity
        style={[styles.actionCard, styles.primaryActionCard, (gameState.playableFlags.seasonEnded || loading) && styles.disabledCard]}
        onPress={handleGameStart}
        activeOpacity={0.8}
        disabled={gameState.playableFlags.seasonEnded || loading}
      >
        <View style={styles.iconCircle}>
           <Ionicons name="play" size={32} color={COLORS.background} />
        </View>
        <Text style={styles.primaryActionTitle}>MATCH START</Text>
        <Text style={styles.primaryActionSubtitle}>本日の試合を開始</Text>
      </TouchableOpacity>

      <View style={styles.row}>
          <TouchableOpacity
            style={[styles.smallCard, (gameState.playableFlags.seasonEnded || loading) && styles.disabledCard]}
            onPress={() => setSkipModalVisible(true)}
            activeOpacity={0.7}
            disabled={gameState.playableFlags.seasonEnded || loading}
          >
            <Ionicons name="play-forward-outline" size={28} color={COLORS.primary} />
            <Text style={styles.cardTitle}>SKIP</Text>
            <Text style={styles.cardSubtitle}>日程進行</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.smallCard, (!gameState.playableFlags.seasonEnded || loading) && styles.disabledCard]}
            onPress={handleStoveLeague}
            activeOpacity={0.7}
            disabled={!gameState.playableFlags.seasonEnded || loading}
          >
            <Ionicons name="construct-outline" size={28} color={gameState.playableFlags.seasonEnded ? COLORS.primary : COLORS.textMuted} />
            <Text style={[styles.cardTitle, !gameState.playableFlags.seasonEnded && {color: COLORS.textMuted}]}>OFF SEASON</Text>
            <Text style={[styles.cardSubtitle, !gameState.playableFlags.seasonEnded && {color: COLORS.textMuted}]}>ストーブリーグ</Text>
          </TouchableOpacity>
      </View>

      <View style={styles.row}>
         <TouchableOpacity
            style={[styles.smallCard, loading && styles.disabledCard]}
            onPress={() => navigation.navigate('TitleHistory')}
            activeOpacity={0.7}
            disabled={loading}
          >
            <Ionicons name="trophy-outline" size={28} color={COLORS.secondary} />
            <Text style={styles.cardTitle}>HISTORY</Text>
            <Text style={styles.cardSubtitle}>タイトル履歴</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.smallCard, loading && styles.disabledCard]}
            onPress={handleSettings}
            activeOpacity={0.7}
            disabled={loading}
          >
            <Ionicons name="settings-outline" size={28} color={COLORS.textSecondary} />
            <Text style={styles.cardTitle}>SETTINGS</Text>
            <Text style={styles.cardSubtitle}>設定</Text>
          </TouchableOpacity>
      </View>
    </View>
  );

  const renderStandingsTable = (title: string, teams: any[], leagueColor: string) => (
    <View style={[styles.standingsCard, { borderColor: leagueColor }]}>
        <View style={[styles.standingsHeader, { borderBottomColor: leagueColor }]}>
            <Text style={[styles.standingsTitle, { color: leagueColor }]}>{title}</Text>
            <Ionicons name="podium-outline" size={20} color={leagueColor} />
        </View>
        
        {teams.length > 0 ? (
          teams.map((team, index) => (
            <TouchableOpacity 
              key={team.id} 
              style={styles.standingsRow}
              onPress={() => handleTeamPress(team)}
            >
              <View style={[styles.rankBadge, index === 0 ? {backgroundColor: leagueColor} : {}]}>
                  <Text style={[styles.rankText, index === 0 ? {color: COLORS.background} : {color: COLORS.textSecondary}]}>{index + 1}</Text>
              </View>
              <Text style={styles.teamName}>{team.name}</Text>
              <View style={styles.recordContainer}>
                <Text style={styles.recordText}>
                    {team.record?.wins}<Text style={styles.recordLabel}>W </Text> 
                    {team.record?.losses}<Text style={styles.recordLabel}>L </Text>
                    {team.record?.draws}<Text style={styles.recordLabel}>D </Text>
                </Text>
                {team.record?.gamesBack !== undefined && team.record.gamesBack > 0 && 
                    <Text style={styles.gbText}>{team.record.gamesBack} G</Text>
                }
                {team.record?.magicNumber !== undefined && team.record.magicNumber === 0 &&
                    <Text style={styles.championText}>CHAMPION</Text>
                }
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No Data</Text>
        )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {renderDashboardHeader()}
        
        {renderActionGrid()}

        <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>LEAGUE STANDINGS</Text>
        </View>
        
        {renderStandingsTable('PACIFIC LEAGUE', pacificStandings, COLORS.primary)}
        {renderStandingsTable('CENTRAL LEAGUE', centralStandings, '#4CAF50')}

        {/* Debug Button (Small) */}
        <TouchableOpacity 
          style={styles.debugLink} 
          onPress={() => navigation.navigate('Debug')}
        >
          <Text style={styles.debugLinkText}>Debug Menu</Text>
        </TouchableOpacity>

        <View style={styles.footerSpacing} />

      </ScrollView>

      {/* Modals */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={skipModalVisible}
        onRequestClose={() => setSkipModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Ionicons name="time-outline" size={24} color={COLORS.primary} />
                    <Text style={styles.modalTitle}>SKIP SCHEDULE</Text>
                </View>
                <Text style={styles.modalMessage}>何日分スキップしますか？</Text>
                <TextInput
                    style={styles.input}
                    onChangeText={setSkipDays}
                    value={skipDays}
                    keyboardType="numeric"
                    placeholder="Days"
                    placeholderTextColor={COLORS.textMuted}
                />
                <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.cancelAction} onPress={() => setSkipModalVisible(false)}>
                        <Text style={styles.cancelText}>CANCEL</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.confirmAction} onPress={handleSkipDays}>
                        <Text style={styles.confirmText}>EXECUTE</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      <RosterModal
        visible={rosterModalVisible}
        onClose={() => setRosterModalVisible(false)}
        teamName={selectedTeamName}
        groupedRoster={groupedRoster}
        onSelectTeam={handleSelectTeam}
        onViewDetails={() => {
            setRosterModalVisible(false);
            navigation.navigate('TeamOrder', { teamId: viewingTeamId });
        }}
        isMyTeam={viewingTeamId === gameState.selectedTeamId}
      />
      
      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalConfig.title}</Text>
            <Text style={styles.modalMessage}>{modalConfig.message}</Text>
            <View style={styles.modalButtons2}>
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

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
      padding: SPACING.md,
      paddingBottom: 40,
  },
  
  // Header
  dashboardHeader: {
      marginBottom: SPACING.lg,
      alignItems: 'flex-start',
  },
  dateCard: {
      marginBottom: SPACING.xs,
  },
  seasonText: {
      fontSize: 14,
      color: COLORS.primary,
      fontWeight: 'bold',
      letterSpacing: 2,
  },
  dateText: {
      fontSize: 32,
      fontWeight: 'bold',
      color: COLORS.textPrimary,
  },
  statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(212, 175, 55, 0.15)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  statusText: {
      color: COLORS.primary,
      fontSize: 12,
      fontWeight: 'bold',
      marginLeft: 4,
  },
  // Grid
  gridContainer: {
      marginBottom: SPACING.lg,
  },
  row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: SPACING.md,
  },
  
  // Action Cards
  primaryActionCard: {
      backgroundColor: COLORS.card,
      borderRadius: 12,
      padding: SPACING.lg,
      alignItems: 'center',
      justifyContent: 'center',
      height: 120,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 6,
      borderWidth: 1,
      borderColor: COLORS.primary,
  },
  iconCircle: {
      backgroundColor: COLORS.primary,
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.sm,
      position: 'absolute',
      right: 20,
      top: 20,
  },
  primaryActionTitle: {
      color: COLORS.textPrimary,
      fontSize: 24,
      fontWeight: '900',
      letterSpacing: 1,
      alignSelf: 'flex-start',
  },
  primaryActionSubtitle: {
      color: COLORS.textSecondary,
      fontSize: 14,
      fontWeight: 'bold',
      alignSelf: 'flex-start',
      marginTop: 4,
  },
  
  smallCard: {
      backgroundColor: COLORS.card,
      width: COLUMN_WIDTH,
      padding: SPACING.md,
      borderRadius: 12,
      height: 100,
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: COLORS.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
  },
  cardTitle: {
      color: COLORS.textPrimary,
      fontSize: 14,
      fontWeight: 'bold',
      marginTop: 8,
  },
  cardSubtitle: {
      color: COLORS.textSecondary,
      fontSize: 10,
  },
  disabledCard: {
      opacity: 0.5,
      backgroundColor: '#252525',
  },

  // Sections
  sectionHeader: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  sectionHeaderText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    paddingLeft: SPACING.sm,
  },

  // Standings
  standingsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginHorizontal: SPACING.sm,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
  },
  standingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderBottomWidth: 1,
  },
  standingsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  standingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  teamName: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  recordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginRight: 8,
  },
  recordLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  gbText: {
    color: COLORS.textMuted,
    fontSize: 11,
    backgroundColor: '#333',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  championText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    padding: SPACING.lg,
    fontStyle: 'italic',
  },

  // Footer / Misc
  debugLink: {
    alignSelf: 'center',
    marginTop: SPACING.xl,
    padding: 10,
  },
  debugLinkText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  footerSpacing: {
    height: 40,
  },
  loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: COLORS.background,
  },
  loadingText: {
      color: COLORS.textMuted,
      marginTop: 10,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    width: '85%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalMessage: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#333',
    color: COLORS.textPrimary,
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelAction: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 10,
  },
  cancelText: {
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },
  confirmAction: {
      backgroundColor: COLORS.primary,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
  },
  confirmText: {
      color: COLORS.background,
      fontWeight: 'bold',
  },
  modalButtons2: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 10,
  },
  okButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButton: {
    backgroundColor: COLORS.textMuted,
  },
  modalButtonText: {
    color: COLORS.background,
    fontWeight: 'bold',
  },
});

