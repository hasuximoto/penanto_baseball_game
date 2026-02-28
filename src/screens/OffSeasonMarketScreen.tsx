import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, SafeAreaView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { dbManager } from '../services/databaseManager';
import { Player } from '../types';
import { ContractManager } from '../services/contractManager';
import { COLORS, FONTS, SPACING } from '@/utils/theme';
import { Ionicons } from '@expo/vector-icons';

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
        // 自由契約選手 (FA宣言以外で free_agent の選手、かつ新外国人ではない)
        filtered = allPlayers.filter(p => p.team === 'free_agent' && !p.faState?.declared && !p.isForeign);
      } else if (activeTab === 'foreign') {
        // 外国人リストの実装 (isForeign付与者)
        filtered = allPlayers.filter(p => p.team === 'free_agent' && p.isForeign);
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
            <View style={styles.positionBadge}>
                <Text style={styles.positionText}>{item.position}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.name}>{item.name}</Text>
                    {isFA && <View style={styles.faBadge}><Text style={styles.faBadgeText}>FA</Text></View>}
                </View>
                <Text style={styles.age}>{item.age}歳</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.salary}>{item.contract?.salary || 0}万</Text>
            </View>
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
            {isOffered && <View style={styles.offeredBadge}><Text style={styles.offeredBadgeText}>提示済</Text></View>}
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>戦力補強</Text>
        <View style={{ width: 24 }} />
      </View>

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
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{selectedPlayer?.name} へのオファー</Text>
            
            <View style={styles.modalContent}>
              <Text style={styles.modalLabel}>年俸 (万円)</Text>
              <TextInput
                style={styles.input}
                value={offerSalary}
                onChangeText={setOfferSalary}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.modalLabel}>契約年数 (年)</Text>
              <TextInput
                style={styles.input}
                value={offerYears}
                onChangeText={setOfferYears}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.offerButton} onPress={handleOffer}>
                <Text style={styles.offerButtonText}>提示する</Text>
              </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  backButton: {
    padding: SPACING.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: FONTS.bold,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    margin: SPACING.sm,
    borderRadius: 8,
    padding: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  activeTabText: {
    color: COLORS.textInverse,
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  sortButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeSortButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: COLORS.primary,
  },
  sortButtonText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  activeSortButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.md,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  playerInfo: {
    flex: 1,
  },
  mainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  positionBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 32,
    alignItems: 'center',
  },
  positionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: SPACING.xs,
  },
  age: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  faBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    marginRight: SPACING.xs,
  },
  faBadgeText: {  
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textInverse,
  },
  salary: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statsInfo: {
    marginTop: SPACING.xs,
  },
  statsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  offeredBadge: {
    backgroundColor: COLORS.positive,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  offeredBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  modalContent: {
    marginBottom: SPACING.md,
  },
  modalLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.background,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.secondary,
    padding: SPACING.md,
    borderRadius: 8,
    marginRight: SPACING.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  offerButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 8,
    marginLeft: SPACING.sm,
    alignItems: 'center',
  },
  offerButtonText: {
    color: COLORS.textInverse,
    fontWeight: 'bold',
  },
});
