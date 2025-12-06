import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { dbManager } from '../services/databaseManager';
import { Player } from '../types';
import { ContractManager } from '../services/contractManager';

type TabType = 'fa' | 'released' | 'foreign';
type SortKey = 'position' | 'age' | 'salary';
type SortOrder = 'asc' | 'desc';

const POSITION_ORDER: Record<string, number> = {
  'P': 1, 'C': 2, '1B': 3, '2B': 4, '3B': 5, 'SS': 6,
  'LF': 7, 'CF': 8, 'RF': 9, 'OF': 10, 'DH': 11
};

export const OffSeasonMarketScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const gameState = useSelector((state: RootState) => state.game);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('fa');
  
  const [sortKey, setSortKey] = useState<SortKey>('position');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Negotiation Modal
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [offerSalary, setOfferSalary] = useState('');
  const [offerYears, setOfferYears] = useState('1');

  useFocusEffect(
    useCallback(() => {
      loadPlayers();
    }, [activeTab])
  );

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const allPlayers = await dbManager.getInitialPlayers();
      
      let filtered: Player[] = [];
      if (activeTab === 'fa') {
        // FA宣言していて、まだ所属が決まっていない選手 (team === 'free_agent' かつ faState.declared === true)
        filtered = allPlayers.filter(p => p.team === 'free_agent' && p.faState?.declared);
      } else if (activeTab === 'released') {
        // 自由契約選手 (FA宣言以外で free_agent の選手)
        filtered = allPlayers.filter(p => p.team === 'free_agent' && !p.faState?.declared);
      } else if (activeTab === 'foreign') {
        // TODO: 外国人リストの実装
        filtered = [];
      }
      
      setPlayers(filtered);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc'); // Default to asc for new key
    }
  };

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      let result = 0;
      if (sortKey === 'position') {
        const orderA = POSITION_ORDER[a.position] || 99;
        const orderB = POSITION_ORDER[b.position] || 99;
        result = orderA - orderB;

        // ポジションが同じ場合は年齢降順（年長順）でソート
        if (result === 0) {
            const ageDiff = b.age - a.age;
            return sortOrder === 'asc' ? ageDiff : -ageDiff;
        }
      } else if (sortKey === 'age') {
        result = a.age - b.age;
      } else if (sortKey === 'salary') {
        result = (a.contract?.salary || 0) - (b.contract?.salary || 0);
      }

      return sortOrder === 'asc' ? result : -result;
    });
  }, [players, sortKey, sortOrder]);

  const handlePlayerPress = (player: Player) => {
    setSelectedPlayer(player);
    // 初期値設定: 現在の年俸か、少し上乗せした額
    setOfferSalary(player.contract?.salary ? player.contract.salary.toString() : '1000');
    setOfferYears('1');
    setModalVisible(true);
  };

  const handleOffer = async () => {
    if (!selectedPlayer || !gameState.selectedTeamId) return;

    const salary = parseInt(offerSalary, 10);
    const years = parseInt(offerYears, 10);

    if (isNaN(salary) || isNaN(years) || salary <= 0 || years <= 0) {
      Alert.alert("エラー", "有効な数値を入力してください。");
      return;
    }

    try {
      await ContractManager.makeOffer(
        selectedPlayer.id,
        gameState.selectedTeamId,
        salary,
        years,
        gameState.reinforcementTurn || 1
      );
      
      Alert.alert("提示完了", "条件を提示しました。");
      setModalVisible(false);
      loadPlayers(); // リロード
    } catch (error) {
      console.error(error);
      Alert.alert("エラー", "オファーの送信に失敗しました。");
    }
  };

  const renderPlayerItem = ({ item }: { item: Player }) => {
    const isOffered = item.faState?.offers?.some(o => o.teamId === gameState.selectedTeamId);
    const isFA = item.faState?.declared;
    const isPitcher = item.position === 'P';

    return (
      <TouchableOpacity style={styles.playerRow} onPress={() => handlePlayerPress(item)}>
        <View style={styles.playerInfo}>
          <View style={styles.mainInfo}>
            <Text style={styles.position}>{item.position}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                {isFA && <Text style={styles.faBadge}>FA</Text>}
            </View>
            <Text style={styles.age}>{item.age}歳</Text>
            <Text style={styles.salary}>{item.contract?.salary || 0}万</Text>
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
        <View style={styles.statusContainer}>
            {isOffered && <Text style={styles.offeredBadge}>提示済</Text>}
            <Text style={styles.arrow}>＞</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
            style={[styles.tab, activeTab === 'fa' && styles.activeTab]} 
            onPress={() => setActiveTab('fa')}
        >
          <Text style={[styles.tabText, activeTab === 'fa' && styles.activeTabText]}>FA選手</Text>
        </TouchableOpacity>
        <TouchableOpacity 
            style={[styles.tab, activeTab === 'released' && styles.activeTab]} 
            onPress={() => setActiveTab('released')}
        >
          <Text style={[styles.tabText, activeTab === 'released' && styles.activeTabText]}>自由契約</Text>
        </TouchableOpacity>
        <TouchableOpacity 
            style={[styles.tab, activeTab === 'foreign' && styles.activeTab]} 
            onPress={() => setActiveTab('foreign')}
        >
          <Text style={[styles.tabText, activeTab === 'foreign' && styles.activeTabText]}>新外国人</Text>
        </TouchableOpacity>
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
        data={sortedPlayers}
        renderItem={renderPlayerItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>該当する選手はいません</Text>
            </View>
        }
      />

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedPlayer?.name} へのオファー</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>年俸 (万円)</Text>
              <TextInput
                style={styles.input}
                value={offerSalary}
                onChangeText={setOfferSalary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>契約年数 (年)</Text>
              <TextInput
                style={styles.input}
                value={offerYears}
                onChangeText={setOfferYears}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={handleOffer}>
                <Text style={styles.buttonText}>提示する</Text>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 10,
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
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
  playerRow: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
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
    fontWeight: 'bold',
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offeredBadge: {
      backgroundColor: '#4CAF50',
      color: 'white',
      fontSize: 12,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      marginRight: 10,
      overflow: 'hidden',
  },
  faBadge: {
      backgroundColor: '#FF9800',
      color: 'white',
      fontSize: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 8,
      overflow: 'hidden',
      fontWeight: 'bold',
  },
  arrow: {
    fontSize: 18,
    color: '#ccc',
  },
  emptyContainer: {
      padding: 40,
      alignItems: 'center',
  },
  emptyText: {
      color: '#999',
      fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  submitButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
