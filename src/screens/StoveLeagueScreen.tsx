import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { startNewSeason, setOffSeasonStep } from '../redux/slices/gameSlice';
import { ContractManager } from '../services/contractManager';
import { SpringCampManager } from '../services/springCampManager';
import { SeasonManager } from '../services/seasonManager';
import { dbManager } from '../services/databaseManager';

export const StoveLeagueScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const gameState = useSelector((state: RootState) => state.game);
  const currentSeason = gameState.season;
  const offSeasonStep = gameState.offSeasonStep || 'draft';

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

  const handleDraft = () => {
    navigation.navigate('Draft');
  };

  const handleFA = () => {
    // TODO
    showAlert('FA交渉', 'FA交渉機能はまだ実装されていません');
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
              const logs = await ContractManager.processOffSeasonContracts();
              
              // 次のフェーズへ
              dispatch(setOffSeasonStep('camp'));

              showAlert("完了", "契約更改が完了しました。\n\n" + "引退・戦力外はニュースを確認してください。");
            } catch (error) {
              console.error(error);
              showAlert("エラー", "処理中にエラーが発生しました。");
            }
          }
        }
      ]
    );
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>オフシーズンメニュー</Text>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity 
            style={[styles.menuButton, offSeasonStep !== 'draft' && styles.disabledButton]} 
            onPress={handleDraft}
            disabled={offSeasonStep !== 'draft'}
        >
          <Text style={styles.menuButtonText}>ドラフト会議</Text>
          <Text style={styles.menuDescription}>新人選手を獲得します</Text>
          {offSeasonStep !== 'draft' && <Text style={styles.completedText}>完了</Text>}
        </TouchableOpacity>

        <TouchableOpacity 
            style={[styles.menuButton, offSeasonStep !== 'contract' && styles.disabledButton]} 
            onPress={handleContract}
            disabled={offSeasonStep !== 'contract'}
        >
          <Text style={styles.menuButtonText}>契約更改</Text>
          <Text style={styles.menuDescription}>所属選手と契約を更新します</Text>
          {offSeasonStep === 'camp' || offSeasonStep === 'next_season' ? <Text style={styles.completedText}>完了</Text> : null}
        </TouchableOpacity>

        <TouchableOpacity 
            style={[styles.menuButton, offSeasonStep !== 'camp' && styles.disabledButton]} 
            onPress={handleSpringCamp}
            disabled={offSeasonStep !== 'camp'}
        >
          <Text style={styles.menuButtonText}>春季キャンプ</Text>
          <Text style={styles.menuDescription}>選手の能力を強化します</Text>
          {offSeasonStep === 'next_season' && <Text style={styles.completedText}>完了</Text>}
        </TouchableOpacity>

        <View style={styles.separator} />

        <TouchableOpacity 
            style={[styles.menuButton, styles.nextSeasonButton, offSeasonStep !== 'next_season' && styles.disabledButton]} 
            onPress={handleNextSeason}
            disabled={offSeasonStep !== 'next_season'}
        >
          <Text style={styles.menuButtonText}>翌シーズンへ</Text>
        </TouchableOpacity>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  menuContainer: {
    padding: 20,
  },
  menuButton: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
    opacity: 0.7,
  },
  completedText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 5,
  },
  menuButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  menuDescription: {
    fontSize: 14,
    color: '#666',
  },
  separator: {
    height: 20,
  },
  nextSeasonButton: {
    backgroundColor: '#2196F3',
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
