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

/**
 * MainMenuScreen - メインメニュー画面
 * VBA: main_menu.frm から変換
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

  const handleStoveLeague = () => {
    navigation.navigate('StoveLeague');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleResetDatabase = async () => {
    try {
      setLoading(true);
      await dbManager.reset();
      await dbManager.initialize();
      dispatch(resetGame());
      showAlert("完了", 'Database reset complete!');
    } catch (error) {
      console.error('Failed to reset DB:', error);
      showAlert("エラー", 'Failed to reset DB');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>SimBaseBall</Text>
        <Text style={styles.subtitle}>
          {gameState.season}年 {formatDateJP(getGameDateString(gameState.currentDate, gameState.season))}
        </Text>
      </View>

      {/* スタンディングス */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>パ・リーグ</Text>
        {pacificStandings.length > 0 ? (
          pacificStandings.map((team, index) => (
            <TouchableOpacity 
              key={team.id} 
              style={styles.standingsRow}
              onPress={() => handleTeamPress(team)}
            >
              <Text style={styles.rank}>{index + 1}</Text>
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.record}>
                {team.record?.wins || 0}勝 {team.record?.losses || 0}敗 {team.record?.draws || 0}分
                {team.record?.gamesBack !== undefined && team.record.gamesBack > 0 ? ` ${team.record.gamesBack}差` : ''}
                {team.record?.magicNumber !== undefined && (
                  team.record.magicNumber === 0 ? ' 優勝' : ` M${team.record.magicNumber}`
                )}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>データなし</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>セ・リーグ</Text>
        {centralStandings.length > 0 ? (
          centralStandings.map((team, index) => (
            <TouchableOpacity 
              key={team.id} 
              style={styles.standingsRow}
              onPress={() => handleTeamPress(team)}
            >
              <Text style={styles.rank}>{index + 1}</Text>
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.record}>
                {team.record?.wins || 0}勝 {team.record?.losses || 0}敗 {team.record?.draws || 0}分
                {team.record?.gamesBack !== undefined && team.record.gamesBack > 0 ? ` ${team.record.gamesBack}差` : ''}
                {team.record?.magicNumber !== undefined && (
                  team.record.magicNumber === 0 ? ' 優勝' : ` M${team.record.magicNumber}`
                )}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>データなし</Text>
        )}
      </View>

      {/* ボタングループ */}
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, (gameState.playableFlags.seasonEnded || loading) && styles.disabledButton]}
          onPress={handleGameStart}
          activeOpacity={0.7}
          disabled={gameState.playableFlags.seasonEnded || loading}
        >
          <Text style={styles.buttonText}>試合を開始</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#2196F3', marginTop: 10 }, (gameState.playableFlags.seasonEnded || loading) && styles.disabledButton]}
          onPress={() => setSkipModalVisible(true)}
          activeOpacity={0.7}
          disabled={gameState.playableFlags.seasonEnded || loading}
        >
          <Text style={styles.buttonText}>日程スキップ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, (!gameState.playableFlags.seasonEnded || loading) && styles.disabledButton]}
          onPress={handleStoveLeague}
          activeOpacity={0.7}
          disabled={!gameState.playableFlags.seasonEnded || loading}
        >
          <Text style={styles.buttonText}>オフシーズン</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, loading && styles.disabledButton]}
          onPress={() => navigation.navigate('TitleHistory')}
          activeOpacity={0.7}
          disabled={loading}
        >
          <Text style={styles.buttonText}>タイトル履歴</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, loading && styles.disabledButton]}
          onPress={handleSettings}
          activeOpacity={0.7}
          disabled={loading}
        >
          <Text style={styles.buttonText}>設定</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#FF5252' }, loading && styles.disabledButton]}
          onPress={handleResetDatabase}
          activeOpacity={0.7}
          disabled={loading}
        >
          <Text style={styles.buttonText}>DB初期化 (Debug)</Text>
        </TouchableOpacity>
      </View>

      {/* フッター */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>SimBaseBall v1.0</Text>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={skipModalVisible}
        onRequestClose={() => setSkipModalVisible(false)}
      >
        <View style={styles.modalCenteredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>スキップする日数を入力:</Text>
            <TextInput
              style={styles.input}
              onChangeText={setSkipDays}
              value={skipDays}
              keyboardType="numeric"
              placeholder="Days"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton, { marginRight: 10, flex: 1 }]}
                onPress={() => setSkipModalVisible(false)}
              >
                <Text style={styles.buttonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, { marginLeft: 10, flex: 1 }]}
                onPress={handleSkipDays}
              >
                <Text style={styles.buttonText}>実行</Text>
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

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.debugButton} 
          onPress={() => navigation.navigate('Debug')}
        >
          <Text style={styles.debugButtonText}>Debug Menu</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  header: {
    alignItems: 'center',
    marginVertical: 24,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  modalCenteredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%'
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 18,
    fontWeight: 'bold'
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    width: '100%',
    borderColor: '#ccc',
    borderRadius: 5
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 15,
    width: '100%',
    justifyContent: 'space-between'
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  standingsRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  rank: {
    width: 30,
    fontWeight: 'bold',
    color: '#666',
    fontSize: 14,
  },
  teamName: {
    flex: 1,
    color: '#333',
    fontSize: 14,
    marginLeft: 8,
  },
  record: {
    color: '#666',
    fontSize: 12,
    minWidth: 60,
    textAlign: 'right',
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    paddingVertical: 12,
  },
  buttonGroup: {
    marginVertical: 24,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  secondaryButton: {
    backgroundColor: '#2196F3',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  footerText: {
    color: '#999',
    fontSize: 12,
  },
  debugButton: {
    marginTop: 10,
    padding: 5,
  },
  debugButtonText: {
    color: '#ccc',
    fontSize: 10,
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
  modalButtons2: {
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
