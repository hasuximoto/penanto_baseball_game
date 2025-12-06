import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { dbManager } from '../services/databaseManager';
import { Player } from '../types';
import { useNavigation } from '@react-navigation/native';

type SortKey = 'position' | 'age' | 'salary';
type SortOrder = 'asc' | 'desc';

const POSITION_ORDER: Record<string, number> = {
  'P': 1, 'C': 2, '1B': 3, '2B': 4, '3B': 5, 'SS': 6,
  'LF': 7, 'CF': 8, 'RF': 9, 'OF': 10, 'DH': 11
};

export const ReleasePlayersScreen = () => {
  const navigation = useNavigation();
  const selectedTeamId = useSelector((state: RootState) => state.game.selectedTeamId);
  const currentSeason = useSelector((state: RootState) => state.game.season);
  const [roster, setRoster] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]); // Player IDs
  const [modalVisible, setModalVisible] = useState(false);
  const [exitConfirmVisible, setExitConfirmVisible] = useState(false);
  const [warningVisible, setWarningVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);
  
  const [sortKey, setSortKey] = useState<SortKey>('position');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const ROSTER_LIMIT = 70;

  useEffect(() => {
    if (selectedTeamId) {
      loadRoster();
    }
  }, [selectedTeamId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (exitConfirmVisible || warningVisible) {
        return;
      }

      e.preventDefault();

      if (roster.length > ROSTER_LIMIT) {
        setWarningVisible(true);
      } else {
        setPendingAction(e.data.action);
        setExitConfirmVisible(true);
      }
    });

    return unsubscribe;
  }, [navigation, roster.length, exitConfirmVisible, warningVisible]);

  const handleConfirmExit = () => {
    setExitConfirmVisible(false);
    if (pendingAction) {
      navigation.dispatch(pendingAction);
    } else {
      navigation.goBack();
    }
  };

  const loadRoster = async () => {
    if (!selectedTeamId) return;
    const players = await dbManager.getTeamRoster(selectedTeamId);
    setRoster(players);
  };

  const toggleSelection = (playerId: number) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
    } else {
      setSelectedPlayers([...selectedPlayers, playerId]);
    }
  };

  const handleRelease = () => {
    if (selectedPlayers.length === 0) return;
    setModalVisible(true);
  };

  const executeRelease = async () => {
    await dbManager.removePlayers(selectedPlayers);
    setSelectedPlayers([]);
    loadRoster();
    setModalVisible(false);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc'); // Default to asc for new key
    }
  };

  const sortedRoster = useMemo(() => {
    return [...roster].sort((a, b) => {
      let result = 0;
      if (sortKey === 'position') {
        const orderA = POSITION_ORDER[a.position] || 99;
        const orderB = POSITION_ORDER[b.position] || 99;
        result = orderA - orderB;

        // ポジションが同じ場合は年齢降順（年長順）でソート
        if (result === 0) {
            const ageDiff = b.age - a.age;
            // メインのsortOrderの影響を打ち消して常に降順にするため
            return sortOrder === 'asc' ? ageDiff : -ageDiff;
        }
      } else if (sortKey === 'age') {
        result = a.age - b.age;
      } else if (sortKey === 'salary') {
        result = (a.contract?.salary || 0) - (b.contract?.salary || 0);
      }

      return sortOrder === 'asc' ? result : -result;
    });
  }, [roster, sortKey, sortOrder]);

  const renderItem = ({ item }: { item: Player }) => {
    const isSelected = selectedPlayers.includes(item.id);
    const isPitcher = item.position === 'P';
    
    // 戦力外不可の条件チェック
    const isDraftedThisYear = item.draftYear === currentSeason;
    const isMultiYearContract = (item.contract?.yearsRemaining || 0) > 1;
    const isProtected = isDraftedThisYear || isMultiYearContract;

    return (
      <TouchableOpacity 
        style={[
            styles.item, 
            isSelected && styles.selectedItem,
            isProtected && styles.protectedItem
        ]} 
        onPress={() => !isProtected && toggleSelection(item.id)}
        disabled={isProtected}
      >
        <View style={styles.playerInfo}>
            <View style={styles.mainInfo}>
                <Text style={styles.position}>{item.position}</Text>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.age}>{item.age}歳</Text>
                <Text style={styles.salary}>{item.contract?.salary}万</Text>
                {isProtected && (
                    <Text style={styles.protectedText}>
                        {isDraftedThisYear ? '新人' : '複数年'}
                    </Text>
                )}
            </View>
            <View style={styles.statsInfo}>
                {isPitcher ? (
                    <Text style={styles.statsText}>
                        {item.stats?.gamesPitched || 0}登板 防{item.stats?.era?.toFixed(2) || '-.--'} {item.stats?.wins || 0}勝 {item.stats?.saves || 0}S
                    </Text>
                ) : (
                    <Text style={styles.statsText}>
                        {item.stats?.gamesPlayed || 0}試合 打{item.stats?.average?.toFixed(3) || '.---'} {item.stats?.homeRuns || 0}本 {item.stats?.rbi || 0}点
                    </Text>
                )}
            </View>
        </View>
        <View style={styles.checkbox}>
            {isSelected && <View style={styles.checked} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>戦力外通告選択</Text>
        <View>
            <Text style={styles.count}>
                支配下登録: {roster.length} / {ROSTER_LIMIT}
            </Text>
            {roster.length > ROSTER_LIMIT && (
                <Text style={styles.warning}>
                    あと {roster.length - ROSTER_LIMIT} 人削減してください
                </Text>
            )}
        </View>
      </View>

      <View style={styles.sortContainer}>
        <TouchableOpacity 
            style={[styles.sortButton, sortKey === 'position' && styles.activeSortButton]} 
            onPress={() => handleSort('position')}
        >
            <Text style={[styles.sortButtonText, sortKey === 'position' && styles.activeSortButtonText]}>
                守備位置 {sortKey === 'position' && (sortOrder === 'asc' ? '▲' : '▼')}
            </Text>
        </TouchableOpacity>
        <TouchableOpacity 
            style={[styles.sortButton, sortKey === 'age' && styles.activeSortButton]} 
            onPress={() => handleSort('age')}
        >
            <Text style={[styles.sortButtonText, sortKey === 'age' && styles.activeSortButtonText]}>
                年齢 {sortKey === 'age' && (sortOrder === 'asc' ? '▲' : '▼')}
            </Text>
        </TouchableOpacity>
        <TouchableOpacity 
            style={[styles.sortButton, sortKey === 'salary' && styles.activeSortButton]} 
            onPress={() => handleSort('salary')}
        >
            <Text style={[styles.sortButtonText, sortKey === 'salary' && styles.activeSortButtonText]}>
                年俸 {sortKey === 'salary' && (sortOrder === 'asc' ? '▲' : '▼')}
            </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sortedRoster}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
      />

      <View style={styles.footer}>
        <TouchableOpacity 
            style={[styles.button, selectedPlayers.length === 0 && styles.disabledButton]} 
            onPress={handleRelease}
            disabled={selectedPlayers.length === 0}
        >
            <Text style={styles.buttonText}>選択した選手を戦力外にする ({selectedPlayers.length})</Text>
        </TouchableOpacity>
      </View>

      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>戦力外通告</Text>
            <Text style={styles.modalMessage}>
              {`選択した${selectedPlayers.length}人の選手を戦力外にしますか？\nこの操作は取り消せません。`}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.destructiveButton]}
                onPress={executeRelease}
              >
                <Text style={styles.modalButtonText}>実行</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 終了確認モーダル */}
      <Modal
        transparent={true}
        visible={exitConfirmVisible}
        onRequestClose={() => setExitConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>終了確認</Text>
            <Text style={styles.modalMessage}>
              戦力外通告を終了しますか？
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setExitConfirmVisible(false)}
              >
                <Text style={styles.modalButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.okButton]}
                onPress={handleConfirmExit}
              >
                <Text style={styles.modalButtonText}>終了する</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 警告モーダル */}
      <Modal
        transparent={true}
        visible={warningVisible}
        onRequestClose={() => setWarningVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>警告</Text>
            <Text style={styles.modalMessage}>
              {`支配下登録選手が${ROSTER_LIMIT}名を超えています。\nあと${roster.length - ROSTER_LIMIT}名削減してください。`}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.okButton]}
                onPress={() => setWarningVisible(false)}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
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
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  count: {
    fontSize: 14,
    color: '#666',
  },
  warning: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  list: {
    padding: 8,
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  activeSortButton: {
    backgroundColor: '#007AFF',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#333',
  },
  activeSortButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedItem: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  protectedItem: {
    backgroundColor: '#f0f0f0',
    opacity: 0.7,
  },
  protectedText: {
    fontSize: 10,
    color: '#FF9500',
    fontWeight: 'bold',
    marginLeft: 4,
    borderWidth: 1,
    borderColor: '#FF9500',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  playerInfo: {
    flex: 1,
  },
  mainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
    color: '#666',
  },
  position: {
    width: 40,
    fontWeight: 'bold',
    color: '#333',
  },
  name: {
    flex: 1,
    fontSize: 16,
  },
  age: {
    width: 50,
    textAlign: 'right',
    color: '#666',
  },
  salary: {
    width: 80,
    textAlign: 'right',
    color: '#666',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checked: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  button: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
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
  cancelButton: {
    backgroundColor: '#999',
  },
  destructiveButton: {
    backgroundColor: '#FF3B30',
  },
  okButton: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
