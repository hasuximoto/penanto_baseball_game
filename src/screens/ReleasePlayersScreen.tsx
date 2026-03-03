import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, SafeAreaView, TextInput } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { dbManager } from '../services/databaseManager';
import { ContractManager } from '../services/contractManager';
import { Player } from '../types';
import { useNavigation } from '@react-navigation/native';
import { setOffSeasonStep, setReinforcementTurn } from '../redux/slices/gameSlice';
import { COLORS, FONTS, SPACING } from '@/utils/theme';
import { Ionicons } from '@expo/vector-icons';

type SortKey = 'position' | 'age' | 'salary';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'simple' | 'detail';

type ContractEditState = Record<string, { salary: string; years: string }>;

const POSITION_ORDER: Record<string, number> = {
  'P': 1, 'C': 2, '1B': 3, '2B': 4, '3B': 5, 'SS': 6,
  'LF': 7, 'CF': 8, 'RF': 9, 'OF': 10, 'DH': 11
};

export const ReleasePlayersScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const gameState = useSelector((state: RootState) => state.game);
  const selectedTeamId = useSelector((state: RootState) => state.game.selectedTeamId);
  const currentSeason = useSelector((state: RootState) => state.game.season);
  const [roster, setRoster] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Array<string | number>>([]); // Player IDs
  const [exitConfirmVisible, setExitConfirmVisible] = useState(false);
  const [warningVisible, setWarningVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('simple');
  const [contractEdits, setContractEdits] = useState<ContractEditState>({});
  const [pendingReleaseIds, setPendingReleaseIds] = useState<string[]>([]);
  const [savingContracts, setSavingContracts] = useState(false);
  const [teamBudget, setTeamBudget] = useState<number | null>(null);
  const [infoModal, setInfoModal] = useState({
    visible: false,
    title: '',
    message: '',
  });
  
  const [sortKey, setSortKey] = useState<SortKey>('position');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const ROSTER_LIMIT = 70;
  const pendingReleaseCount = pendingReleaseIds.length;
  const effectiveRosterCount = Math.max(0, roster.length - pendingReleaseCount);
  const totalPayroll = useMemo(() => {
    return roster.reduce((sum, player) => sum + (player.contract?.salary || 0), 0);
  }, [roster]);

  const getInitialContractEdit = (player: Player): { salary: string; years: string } => {
    const yearsRemaining = player.contract?.yearsRemaining || 0;
    const useRecommendedSalary = yearsRemaining <= 0;
    return {
      salary: String(useRecommendedSalary ? ContractManager.getRecommendedRenewalSalary(player) : (player.contract?.salary || 0)),
      years: String(Math.max(1, yearsRemaining || 1)),
    };
  };

  useEffect(() => {
    if (selectedTeamId) {
      loadRoster();
    }
  }, [selectedTeamId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (exitConfirmVisible || warningVisible || infoModal.visible) {
        return;
      }

      e.preventDefault();

      if (effectiveRosterCount > ROSTER_LIMIT) {
        setWarningVisible(true);
      } else {
        setPendingAction(e.data.action);
        setExitConfirmVisible(true);
      }
    });

    return unsubscribe;
  }, [navigation, effectiveRosterCount, exitConfirmVisible, warningVisible, infoModal.visible]);

  const isProtectedPlayer = (player: Player) => {
    const isDraftedThisYear = player.draftYear === currentSeason;
    const isMultiYearContract = (player.contract?.yearsRemaining || 0) > 1;
    return isDraftedThisYear || isMultiYearContract;
  };

  const handleConfirmExit = async () => {
    setExitConfirmVisible(false);

    if (pendingReleaseIds.length > 0) {
      const pendingReleaseSet = new Set(pendingReleaseIds);
      const releasedPlayers = roster
        .filter(player => pendingReleaseSet.has(player.id.toString()))
        .map(player => ({
          ...player,
          team: 'free_agent' as const,
          faState: {
            declared: false,
            negotiating: true,
            offers: [],
          },
        }));

      if (releasedPlayers.length > 0) {
        await dbManager.updatePlayers(releasedPlayers);
      }

      setPendingReleaseIds([]);
    }

    dispatch(setOffSeasonStep('reinforcement'));
    dispatch(setReinforcementTurn(1));
    await dbManager.saveGameState({
      ...gameState,
      offSeasonStep: 'reinforcement',
      reinforcementTurn: 1,
    });

    if (pendingAction) {
      navigation.dispatch(pendingAction);
    } else {
      navigation.goBack();
    }
  };

  const loadRoster = async () => {
    if (!selectedTeamId) return;
    const [players, teams] = await Promise.all([
      dbManager.getTeamRoster(selectedTeamId),
      dbManager.getInitialTeams(),
    ]);

    const team = teams.find((t: any) => t.id === selectedTeamId);
    setTeamBudget(typeof team?.budget === 'number' ? team.budget : null);

    setRoster(players);
    const nextEdits: ContractEditState = {};
    players.forEach(player => {
      nextEdits[player.id.toString()] = getInitialContractEdit(player);
    });
    setContractEdits(nextEdits);
    setPendingReleaseIds(prev => prev.filter(id => players.some(player => player.id.toString() === id)));
    setSelectedPlayers(prev => prev.filter(id => players.some(player => player.id === id)));
  };

  const toggleSelection = (playerId: string | number) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
    } else {
      setSelectedPlayers([...selectedPlayers, playerId]);
    }
  };

  const handleReleaseNotify = () => {
    if (selectedPlayers.length === 0) return;

    const selectedSet = new Set(selectedPlayers.map(id => id.toString()));
    const targetPlayers = roster.filter(player => selectedSet.has(player.id.toString()));
    const releasablePlayers = targetPlayers.filter(player => !isProtectedPlayer(player));
    const releasableIds = releasablePlayers.map(player => player.id.toString());
    const alreadyPendingCount = releasableIds.filter(id => pendingReleaseIds.includes(id)).length;
    const newIds = releasableIds.filter(id => !pendingReleaseIds.includes(id));
    const skippedProtectedCount = targetPlayers.length - releasablePlayers.length;

    if (newIds.length === 0) {
      setInfoModal({
        visible: true,
        title: '通知対象なし',
        message: skippedProtectedCount > 0
          ? '選択した選手は保護対象のため通知できません。'
          : '選択した選手はすでに通知済みです。',
      });
      return;
    }

    setPendingReleaseIds(prev => [...prev, ...newIds]);
    setSelectedPlayers([]);

    const details: string[] = [];
    if (skippedProtectedCount > 0) details.push(`保護対象 ${skippedProtectedCount} 名を除外`);
    if (alreadyPendingCount > 0) details.push(`既通知 ${alreadyPendingCount} 名を除外`);

    setInfoModal({
      visible: true,
      title: '戦力外通知を設定',
      message: `${newIds.length}名を通知対象に設定しました。${details.length > 0 ? `\n${details.join(' / ')}` : ''}`,
    });
  };

  const handleSelectAllToggle = () => {
    const selectablePlayerIds = roster
      .filter(player => !isProtectedPlayer(player))
      .map(player => player.id);

    const isAllSelected = selectablePlayerIds.length > 0
      && selectablePlayerIds.every(id => selectedPlayers.includes(id));

    if (isAllSelected) {
      setSelectedPlayers([]);
    } else {
      setSelectedPlayers(selectablePlayerIds);
    }
  };

  const cancelPendingReleaseForSelected = () => {
    if (selectedPlayers.length === 0) return;

    const selectedSet = new Set(selectedPlayers.map(id => id.toString()));
    const removableIds = pendingReleaseIds.filter(id => selectedSet.has(id));

    if (removableIds.length === 0) {
      setInfoModal({
        visible: true,
        title: '取消対象なし',
        message: '選択した選手に通知済みの戦力外はありません。',
      });
      return;
    }

    setPendingReleaseIds(prev => prev.filter(id => !selectedSet.has(id)));
    setSelectedPlayers([]);
    setInfoModal({
      visible: true,
      title: '通知取消完了',
      message: `${removableIds.length}名の戦力外通知を取り消しました。`,
    });
  };

  const saveSelectedContractChanges = async () => {
    if (selectedPlayers.length === 0) {
      setInfoModal({
        visible: true,
        title: '未選択',
        message: '契約保存する選手を選択してください。',
      });
      return;
    }

    const selectedSet = new Set(selectedPlayers.map(id => id.toString()));
    const selectedRoster = roster.filter(player => selectedSet.has(player.id.toString()));

    const invalidPlayer = selectedRoster.find(player => {
      const edit = contractEdits[player.id.toString()];
      if (!edit) return false;
      const salary = Number(edit.salary);
      const years = Number(edit.years);
      return !Number.isInteger(salary) || !Number.isInteger(years) || salary <= 0 || years <= 0;
    });

    if (invalidPlayer) {
      setInfoModal({
        visible: true,
        title: '入力エラー',
        message: `${invalidPlayer.name} の契約入力が不正です。年俸・年数は1以上の整数を入力してください。`,
      });
      return;
    }

    const baseSeason = typeof currentSeason === 'number' ? currentSeason : 0;
    const playersToUpdate = selectedRoster
      .map(player => {
        const edit = contractEdits[player.id.toString()];
        if (!edit) return null;

        const salary = Number(edit.salary);
        const years = Number(edit.years);
        const currentSalary = player.contract?.salary || 0;
        const currentYears = player.contract?.yearsRemaining || 1;

        if (salary === currentSalary && years === currentYears) {
          return null;
        }

        return {
          ...player,
          contract: {
            ...player.contract,
            salary,
            yearsRemaining: years,
            totalYears: years,
            expirationYear: baseSeason + years,
          },
        };
      })
      .filter((player): player is Player => player !== null);

    if (playersToUpdate.length === 0) {
      setInfoModal({
        visible: true,
        title: '変更なし',
        message: '選択した選手の契約内容に変更はありません。',
      });
      return;
    }

    setSavingContracts(true);
    await dbManager.updatePlayers(playersToUpdate);
    await loadRoster();
    setSavingContracts(false);
    setSelectedPlayers([]);

    setInfoModal({
      visible: true,
      title: '保存完了',
      message: `選択した${playersToUpdate.length}名の契約を更新しました。`,
    });
  };

  const updateContractInput = (playerId: string | number, field: 'salary' | 'years', value: string) => {
    const sanitized = value.replace(/[^0-9]/g, '');
    const playerKey = playerId.toString();
    setContractEdits(prev => ({
      ...prev,
      [playerKey]: {
        salary: field === 'salary' ? sanitized : (prev[playerKey]?.salary || '0'),
        years: field === 'years' ? sanitized : (prev[playerKey]?.years || '1'),
      },
    }));
  };

  const getFaYearsRemaining = (player: Player) => {
    return Math.max(0, 7 - (player.faQualifiedYears || 0));
  };

  const hasContractChanges = useMemo(() => {
    return roster.some(player => {
      const edit = contractEdits[player.id.toString()];
      if (!edit) return false;
      const editedSalary = Number(edit.salary);
      const editedYears = Number(edit.years);
      return editedSalary !== (player.contract?.salary || 0) || editedYears !== (player.contract?.yearsRemaining || 1);
    });
  }, [roster, contractEdits]);

  const saveContractChanges = async () => {
    const invalidPlayer = roster.find(player => {
      const edit = contractEdits[player.id.toString()];
      if (!edit) return false;
      const salary = Number(edit.salary);
      const years = Number(edit.years);
      return !Number.isInteger(salary) || !Number.isInteger(years) || salary <= 0 || years <= 0;
    });

    if (invalidPlayer) {
      setInfoModal({
        visible: true,
        title: '入力エラー',
        message: `${invalidPlayer.name} の契約入力が不正です。年俸・年数は1以上の整数を入力してください。`,
      });
      return;
    }

    const baseSeason = typeof currentSeason === 'number' ? currentSeason : 0;
    const playersToUpdate = roster
      .map(player => {
        const edit = contractEdits[player.id.toString()];
        if (!edit) return null;

        const salary = Number(edit.salary);
        const years = Number(edit.years);
        const currentSalary = player.contract?.salary || 0;
        const currentYears = player.contract?.yearsRemaining || 1;

        if (salary === currentSalary && years === currentYears) {
          return null;
        }

        return {
          ...player,
          contract: {
            ...player.contract,
            salary,
            yearsRemaining: years,
            totalYears: years,
            expirationYear: baseSeason + years,
          },
        };
      })
      .filter((player): player is Player => player !== null);

    if (playersToUpdate.length === 0) {
      setInfoModal({
        visible: true,
        title: '変更なし',
        message: '契約内容の変更はありません。',
      });
      return;
    }

    setSavingContracts(true);
    await dbManager.updatePlayers(playersToUpdate);
    await loadRoster();
    setSavingContracts(false);

    setInfoModal({
      visible: true,
      title: '保存完了',
      message: `${playersToUpdate.length}名の契約を更新しました。`,
    });
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
    
    const playerKey = item.id.toString();
    const isProtected = isProtectedPlayer(item);
    const isPendingRelease = pendingReleaseIds.includes(playerKey);
    const isDraftedThisYear = item.draftYear === currentSeason;
    const currentEdit = contractEdits[playerKey] || getInitialContractEdit(item);

    const isEdited = Number(currentEdit.salary) !== (item.contract?.salary || 0)
      || Number(currentEdit.years) !== (item.contract?.yearsRemaining || 1);

    if (viewMode === 'simple') {
      return (
        <View style={[styles.tableRow, isPendingRelease && styles.pendingReleaseRow]}>
          <TouchableOpacity
            style={[styles.tableCell, styles.selectCell, isSelected && styles.selectedCell]}
            onPress={() => !isProtected && toggleSelection(item.id)}
            disabled={isProtected}
          >
            {isSelected ? <Ionicons name="checkmark" size={14} color={COLORS.background} /> : <Text style={styles.cellText}>□</Text>}
          </TouchableOpacity>
          <View style={[styles.tableCell, styles.posCell]}><Text style={styles.cellText}>{item.position}</Text></View>
          <View style={[styles.tableCell, styles.nameCell]}><Text style={styles.cellText} numberOfLines={1}>{item.name}</Text></View>
          <View style={[styles.tableCell, styles.numCell]}><Text style={styles.cellText}>{item.age}</Text></View>
          <View style={[styles.tableCell, styles.numCell]}><Text style={styles.cellText}>{item.contract?.salary || 0}</Text></View>
          <View style={[styles.tableCell, styles.numCell]}><Text style={styles.cellText}>{item.contract?.yearsRemaining || 1}</Text></View>
          <View style={[styles.tableCell, styles.numCell]}><Text style={styles.cellText}>{getFaYearsRemaining(item)}</Text></View>
          <View style={[styles.tableCell, styles.statusCell]}>
            <Text style={[styles.cellText, (isProtected || isPendingRelease) && styles.protectedText]}>
              {isPendingRelease ? '通知済' : (isProtected ? (isDraftedThisYear ? '新人' : '複数年') : '-')}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.tableRow, isEdited && styles.editedRow, isPendingRelease && styles.pendingReleaseRow]}>
        <TouchableOpacity
          style={[styles.tableCell, styles.selectCell, isSelected && styles.selectedCell]}
          onPress={() => !isProtected && toggleSelection(item.id)}
          disabled={isProtected}
        >
          {isSelected ? <Ionicons name="checkmark" size={14} color={COLORS.background} /> : <Text style={styles.cellText}>□</Text>}
        </TouchableOpacity>
        <View style={[styles.tableCell, styles.posCell]}><Text style={styles.cellText}>{item.position}</Text></View>
        <View style={[styles.tableCell, styles.detailNameCell]}><Text style={styles.cellText} numberOfLines={1}>{item.name}</Text></View>
        <View style={[styles.tableCell, styles.numCell]}><Text style={styles.cellText}>{item.age}</Text></View>
        <View style={[styles.tableCell, styles.numCell]}><Text style={styles.cellText}>{item.contract?.salary || 0}</Text></View>
        <View style={[styles.tableCell, styles.inputCell]}>
          <TextInput
            style={styles.input}
            value={currentEdit.salary}
            keyboardType="number-pad"
            onChangeText={(value) => updateContractInput(item.id, 'salary', value)}
          />
        </View>
        <View style={[styles.tableCell, styles.inputCell]}>
          <TextInput
            style={styles.input}
            value={currentEdit.years}
            keyboardType="number-pad"
            onChangeText={(value) => updateContractInput(item.id, 'years', value)}
          />
        </View>
        <View style={[styles.tableCell, styles.numCell]}><Text style={styles.cellText}>{getFaYearsRemaining(item)}</Text></View>
        <View style={[styles.tableCell, styles.statsCell]}>
          <Text style={styles.cellText} numberOfLines={1}>
            {isPitcher
              ? `${item.stats?.gamesPitched || 0}登板 ${item.stats?.wins || 0}勝 ${item.stats?.losses || 0}敗 ${(item.stats?.holds || 0)}H ${item.stats?.saves || 0}S`
              : `${item.stats?.gamesPlayed || 0}試合 打${item.stats?.average?.toFixed(3) || '.---'} ${item.stats?.homeRuns || 0}本 ${item.stats?.rbi || 0}点`}
          </Text>
        </View>
        <View style={[styles.tableCell, styles.statusCell, styles.detailStatusCell]}>
          <Text style={[styles.cellText, (isProtected || isPendingRelease) && styles.protectedText]} numberOfLines={1}>
            {isPendingRelease ? '通知済' : (isProtected ? (isDraftedThisYear ? '新人' : '複年') : (isEdited ? '変更' : '-'))}
          </Text>
        </View>
      </View>
    );
  };

  const renderTableHeader = () => {
    if (viewMode === 'simple') {
      return (
        <View style={[styles.tableRow, styles.tableHeaderRow]}>
          <View style={[styles.tableCell, styles.selectCell]}><Text style={styles.headerCellText}>選</Text></View>
          <View style={[styles.tableCell, styles.posCell]}><Text style={styles.headerCellText}>位</Text></View>
          <View style={[styles.tableCell, styles.nameCell]}><Text style={styles.headerCellText}>選手名</Text></View>
          <View style={[styles.tableCell, styles.numCell]}><Text style={styles.headerCellText}>年齢</Text></View>
          <View style={[styles.tableCell, styles.numCell]}><Text style={styles.headerCellText}>年俸</Text></View>
          <View style={[styles.tableCell, styles.numCell]}><Text style={styles.headerCellText}>契約年</Text></View>
          <View style={[styles.tableCell, styles.numCell]}><Text style={styles.headerCellText}>FA残</Text></View>
          <View style={[styles.tableCell, styles.statusCell]}><Text style={styles.headerCellText}>状態</Text></View>
        </View>
      );
    }

    return (
      <View style={[styles.tableRow, styles.tableHeaderRow]}>
        <View style={[styles.tableCell, styles.selectCell]}><Text style={styles.headerCellText}>選</Text></View>
        <View style={[styles.tableCell, styles.posCell]}><Text style={styles.headerCellText}>位</Text></View>
        <View style={[styles.tableCell, styles.detailNameCell]}><Text style={styles.headerCellText}>選手名</Text></View>
        <View style={[styles.tableCell, styles.numCell]}><Text style={styles.headerCellText}>年齢</Text></View>
        <View style={[styles.tableCell, styles.numCell]}><Text style={styles.headerCellText}>現年俸</Text></View>
        <View style={[styles.tableCell, styles.inputCell]}><Text style={styles.headerCellText}>新年俸</Text></View>
        <View style={[styles.tableCell, styles.inputCell]}><Text style={styles.headerCellText}>新年数</Text></View>
        <View style={[styles.tableCell, styles.numCell]}><Text style={styles.headerCellText}>FA残</Text></View>
        <View style={[styles.tableCell, styles.statsCell]}><Text style={styles.headerCellText}>成績</Text></View>
        <View style={[styles.tableCell, styles.statusCell, styles.detailStatusCell]}><Text style={styles.headerCellText}>状態</Text></View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.title}>契約・戦力外管理</Text>
        </View>
        <View>
            <Text style={styles.count}>
            支配下登録(予定): <Text style={{ color: COLORS.text, fontWeight: 'bold' }}>{effectiveRosterCount}</Text> / {ROSTER_LIMIT}
            </Text>
          <Text style={styles.financeText}>
            総年俸: {totalPayroll.toLocaleString('ja-JP')}万円 / 予算: {teamBudget !== null ? `${teamBudget.toLocaleString('ja-JP')}万円` : '--'}
          </Text>
          {pendingReleaseCount > 0 && (
            <Text style={styles.pendingInfo}>戦力外通知: {pendingReleaseCount}名（次画面で自由契約）</Text>
          )}
          {effectiveRosterCount > ROSTER_LIMIT && (
                <Text style={styles.warning}>
              あと {effectiveRosterCount - ROSTER_LIMIT} 人削減必須
                </Text>
            )}
        </View>
      </View>

      <View style={styles.modeContainer}>
        <TouchableOpacity
          style={[styles.modeButton, viewMode === 'simple' && styles.activeModeButton]}
          onPress={() => setViewMode('simple')}
        >
          <Text style={[styles.modeButtonText, viewMode === 'simple' && styles.activeModeButtonText]}>簡易</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, viewMode === 'detail' && styles.activeModeButton]}
          onPress={() => setViewMode('detail')}
        >
          <Text style={[styles.modeButtonText, viewMode === 'detail' && styles.activeModeButtonText]}>詳細</Text>
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
        data={sortedRoster}
        ListHeaderComponent={renderTableHeader}
        stickyHeaderIndices={[0]}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
      />

      <View style={styles.footer}>
        <View style={styles.bulkActionRow}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleSelectAllToggle}
          >
            <Text style={styles.buttonText}>全選択/解除</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, selectedPlayers.length === 0 && styles.disabledButton]}
            onPress={saveSelectedContractChanges}
            disabled={selectedPlayers.length === 0}
          >
            <Text style={[styles.buttonText, selectedPlayers.length === 0 && { color: COLORS.textSecondary }]}>選択選手の契約を保存</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.button, styles.contractButton, (!hasContractChanges || savingContracts) && styles.disabledButton]}
          onPress={saveContractChanges}
          disabled={!hasContractChanges || savingContracts}
        >
          <Text style={[styles.buttonText, (!hasContractChanges || savingContracts) && { color: COLORS.textSecondary }]}> 
            契約条件を保存
          </Text>
        </TouchableOpacity>
        <View style={styles.bulkActionRow}>
          <TouchableOpacity 
            style={[styles.button, styles.releaseButton, selectedPlayers.length === 0 && styles.disabledButton]} 
            onPress={handleReleaseNotify}
            disabled={selectedPlayers.length === 0}
          >
              <Text style={[styles.buttonText, selectedPlayers.length === 0 && { color: COLORS.textSecondary }]}>
                  戦力外通知する ({selectedPlayers.length})
              </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton, selectedPlayers.length === 0 && styles.disabledButton]} 
            onPress={cancelPendingReleaseForSelected}
            disabled={selectedPlayers.length === 0}
          >
              <Text style={[styles.buttonText, selectedPlayers.length === 0 && { color: COLORS.textSecondary }]}>通知を取り消す</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        transparent={true}
        visible={infoModal.visible}
        onRequestClose={() => setInfoModal({ visible: false, title: '', message: '' })}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{infoModal.title}</Text>
            <Text style={styles.modalMessage}>{infoModal.message}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.okButton]}
                onPress={() => setInfoModal({ visible: false, title: '', message: '' })}
              >
                <Text style={styles.modalButtonText}>OK</Text>
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
              {`支配下登録選手（予定）が${ROSTER_LIMIT}名を超えています。\nあと${effectiveRosterCount - ROSTER_LIMIT}名削減してください。`}
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
  pendingInfo: {
    fontSize: 12,
    color: COLORS.secondary,
    textAlign: 'right',
    marginTop: 2,
  },
  financeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 2,
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
    paddingBottom: SPACING.xl,
  },
  modeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  modeButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.card,
  },
  activeModeButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modeButtonText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeModeButtonText: {
    color: COLORS.background,
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
    color: COLORS.background,
    fontWeight: 'bold',
  },
  tableHeaderRow: {
    backgroundColor: COLORS.border,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  tableCell: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: 4,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    minHeight: 44,
  },
  selectCell: {
    width: 34,
    alignItems: 'center',
  },
  posCell: {
    width: 44,
    alignItems: 'center',
  },
  nameCell: {
    flex: 1.4,
  },
  detailNameCell: {
    flex: 1.8,
  },
  numCell: {
    width: 56,
    alignItems: 'center',
  },
  statusCell: {
    width: 62,
    alignItems: 'center',
    borderRightWidth: 0,
  },
  detailStatusCell: {
    width: 46,
  },
  statsCell: {
    flex: 1.4,
  },
  inputCell: {
    width: 66,
    alignItems: 'center',
  },
  cellText: {
    color: COLORS.text,
    fontSize: 12,
  },
  headerCellText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    textAlign: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    fontSize: 12,
  },
  selectedCell: {
    backgroundColor: COLORS.primary,
  },
  editedRow: {
    borderColor: COLORS.secondary,
  },
  pendingReleaseRow: {
    backgroundColor: COLORS.border,
    borderColor: COLORS.negative,
    borderWidth: 2,
  },
  protectedText: {
    color: COLORS.negative,
    fontWeight: 'bold',
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
    gap: SPACING.sm,
  },
  bulkActionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  button: {
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
  },
  contractButton: {
    backgroundColor: COLORS.primary,
  },
  releaseButton: {
    backgroundColor: COLORS.negative,
    padding: SPACING.md,
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
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  formLabel: {
    width: 72,
    color: COLORS.text,
    fontSize: 14,
  },
  formInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    backgroundColor: COLORS.background,
    color: COLORS.text,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    textAlign: 'center',
  },
});
