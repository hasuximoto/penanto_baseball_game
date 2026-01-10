import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, SafeAreaView } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { dbManager } from '../services/databaseManager';
import { Player } from '../types';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SPACING } from '@/utils/theme';
import { Ionicons } from '@expo/vector-icons';

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
                <View style={styles.positionBadge}>
                    <Text style={styles.positionText}>{item.position}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.name}>{item.name}</Text>
                        {isProtected && (
                            <View style={styles.protectedBadge}>
                                <Text style={styles.protectedBadgeText}>
                                    {isDraftedThisYear ? '新人' : '複数年'}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.age}>{item.age}歳</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                     <Text style={styles.salary}>{item.contract?.salary}万</Text>
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
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Ionicons name="checkmark" size={16} color={COLORS.background} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.title}>戦力外通告選択</Text>
        </View>
        <View>
            <Text style={styles.count}>
                支配下登録: <Text style={{ color: COLORS.text, fontWeight: 'bold' }}>{roster.length}</Text> / {ROSTER_LIMIT}
            </Text>
            {roster.length > ROSTER_LIMIT && (
                <Text style={styles.warning}>
                    あと {roster.length - ROSTER_LIMIT} 人削減必須
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
            <Text style={[styles.buttonText, selectedPlayers.length === 0 && { color: COLORS.textSecondary }]}>
                選択した選手を戦力外にする ({selectedPlayers.length})
            </Text>
        </TouchableOpacity>
      </View>

      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
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
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
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
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
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
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: FONTS.bold,
  },
  count: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  warning: {
    fontSize: 12,
    color: COLORS.negative,
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: 2,
  },
  list: {
    padding: SPACING.md,
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
    backgroundColor: COLORS.primary,
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
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedItem: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  protectedItem: {
    backgroundColor: COLORS.border, // Darker gray for disabled
    opacity: 0.6,
  },
  protectedBadge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    marginRight: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  protectedBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
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
  },
  age: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  salary: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statsInfo: {
    marginTop: SPACING.xs,
  },
  statsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  checkboxSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  footer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  button: {
    backgroundColor: COLORS.negative,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.border,
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: FONTS.bold,
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
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.secondary,
  },
  destructiveButton: {
    backgroundColor: COLORS.negative,
  },
  okButton: {
    backgroundColor: COLORS.primary,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
