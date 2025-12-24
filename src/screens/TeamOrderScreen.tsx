import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, TouchableOpacity, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Player, Team, TeamId, LineupSlot, Position } from '../types';
import { dbManager } from '../services/databaseManager';
import { getGameDateString, formatDateJP } from '../utils/dateUtils';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { Ionicons } from '@expo/vector-icons';

interface TeamOrderScreenProps {
  route: {
    params: {
      teamId: TeamId;
    };
  };
  navigation: any;
}

const POSITIONS: Position[] = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];

export const TeamOrderScreen: React.FC<TeamOrderScreenProps> = ({ route, navigation }) => {
  const { teamId } = route.params;
  const gameState = useSelector((state: RootState) => state.game);
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [lineupPlayers, setLineupPlayers] = useState<Player[]>([]);
  const [benchPlayers, setBenchPlayers] = useState<Player[]>([]);
  const [pitchers, setPitchers] = useState<{
    starters: Player[];
    relievers: Player[];
    closer: Player[];
  }>({ starters: [], relievers: [], closer: [] });
  const [activeTab, setActiveTab] = useState<'batters' | 'pitchers'>('batters');
  const [selectedSlot, setSelectedSlot] = useState<{ type: 'lineup' | 'bench' | 'starter' | 'reliever' | 'closer', index: number } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Position Change Modal
  const [positionModalVisible, setPositionModalVisible] = useState(false);
  const [targetPlayerIndex, setTargetPlayerIndex] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [teamId, gameState.currentDate])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const teams = await dbManager.getInitialTeams();
      const targetTeam = teams.find(t => t.id === teamId);
      if (targetTeam) {
        setTeam(targetTeam);
        
        const allPlayers = await dbManager.getTeamRoster(teamId);
        const activePlayers = allPlayers.filter(p => p.registrationStatus === 'active' || !p.registrationStatus); // Default to active if undefined
        setPlayers(activePlayers);

        // Organize Batters
        const lineup: Player[] = [];
        const bench: Player[] = [];


        // フォールバック: getStartingLineup を使用して現在のベストオーダーを生成
        try {
            const { batters } = await dbManager.getStartingLineup(teamId, activePlayers, gameState.currentDate);
            batters.forEach(p => lineup.push(p));
        } catch (e) {
            console.error("Failed to generate starting lineup", e);
            // さらにフォールバック: チーム設定のラインナップを使用
            const currentLineupIds = targetTeam.lineup || [];
            currentLineupIds.forEach((id: any) => {
                const p = activePlayers.find(ap => ap.id === id);
                if (p) lineup.push(p);
            });
        }

        // If lineup is empty or incomplete, just take first 9 non-pitchers (fallback)
        if (lineup.length === 0) {
             const nonPitchers = activePlayers.filter(p => p.position !== 'P');
             nonPitchers.slice(0, 9).forEach(p => lineup.push(p));
        }

        // Bench: Active non-pitchers not in lineup
        activePlayers.forEach(p => {
            if (p.position !== 'P' && !lineup.find(lp => lp.id === p.id)) {
                bench.push(p);
            }
        });

        setLineupPlayers(lineup);
        setBenchPlayers(bench);

        // Organize Pitchers
        const activePitchers = activePlayers.filter(p => p.position === 'P');
        
        const rotation: Player[] = [];
        const bullpen: Player[] = [];
        const closerList: Player[] = [];

        // Load settings
        let pitcherSettings = targetTeam.pitcherSettings || [];
        
        // Migration: if no pitcherSettings but rotationSettings exist
        if (pitcherSettings.length === 0 && targetTeam.rotationSettings && targetTeam.rotationSettings.length > 0) {
             pitcherSettings = targetTeam.rotationSettings.map((s: any) => ({
                 playerId: s.playerId,
                 role: 'starter',
                 isLocked: s.isLocked,
                 slotNumber: s.slotNumber
             }));
        }
        
        // 1. Fill Rotation from Settings
        for (let i = 0; i < 6; i++) {
             const setting = pitcherSettings.find(s => s.role === 'starter' && s.slotNumber === i + 1);
             if (setting) {
                 const p = activePitchers.find(ap => ap.id === setting.playerId);
                 if (p) rotation.push(p);
             } else {
                 // Placeholder for empty slot if needed, but we'll fill it below
                 rotation.push(null as any); // Temporary null
             }
        }

        // Remove nulls for now to fill
        let currentRotation = rotation.filter(p => p !== null);

        // 2. Fill from 'starter' role if not in rotation yet
        const potentialStarters = activePitchers.filter(p => p.pitcherRole === 'starter' && !currentRotation.some(r => r.id === p.id));
        
        // Fill empty slots
        for (let i = 0; i < 6; i++) {
            if (!rotation[i]) {
                if (potentialStarters.length > 0) {
                    rotation[i] = potentialStarters.shift()!;
                }
            }
        }
        
        // 3. Fill remaining slots with best available pitchers
        currentRotation = rotation.filter(p => p !== null); // Update
        if (currentRotation.length < 6) {
             const others = activePitchers.filter(p => !currentRotation.some(r => r && r.id === p.id) && !potentialStarters.includes(p));
             for (let i = 0; i < 6; i++) {
                 if (!rotation[i] && others.length > 0) {
                     rotation[i] = others.shift()!;
                 }
             }
        }

        // Clean up rotation (remove any remaining nulls if we ran out of pitchers)
        const finalRotation = rotation.filter(p => p !== null);

        // Identify Closer
        // Check settings first
        const closerSettings = pitcherSettings.filter(s => s.role === 'closer');
        closerSettings.forEach(s => {
            const p = activePitchers.find(ap => ap.id === s.playerId);
            if (p && !finalRotation.some(r => r.id === p.id)) {
                closerList.push(p);
            }
        });

        if (closerList.length === 0) {
            // First check if anyone has role 'closer' and is not in rotation
            const potentialClosers = activePitchers.filter(p => 
                p.pitcherRole === 'closer' && 
                !finalRotation.some(r => r.id === p.id)
            );

            if (potentialClosers.length > 0) {
                closerList.push(potentialClosers[0]);
            } else {
                // If no explicit closer, pick best available from remaining
                const remaining = activePitchers.filter(p => 
                    !finalRotation.some(r => r.id === p.id)
                );
                if (remaining.length > 0) {
                    closerList.push(remaining[0]);
                }
            }
        }

        // Bullpen: Everyone else
        activePitchers.forEach(p => {
            const isRotation = finalRotation.some(r => r.id === p.id);
            const isCloser = closerList.some(c => c.id === p.id);
            if (!isRotation && !isCloser) {
                bullpen.push(p);
            }
        });

        setPitchers({
            starters: finalRotation,
            relievers: bullpen,
            closer: closerList 
        });

      }
    } catch (error) {
      console.error("Failed to load team order data", error);
    } finally {
      setLoading(false);
      setHasUnsavedChanges(false);
    }
  };

  if (loading || !team) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const handlePlayerPress = async (type: 'lineup' | 'bench' | 'starter' | 'reliever' | 'closer', index: number) => {
    if (!selectedSlot) {
      setSelectedSlot({ type, index });
      return;
    }

    if (selectedSlot.type === type && selectedSlot.index === index) {
      setSelectedSlot(null); // Deselect
      return;
    }

    // Prevent swapping between Batters and Pitchers
    const isBatterSwap = ['lineup', 'bench'].includes(selectedSlot.type) && ['lineup', 'bench'].includes(type);
    const isPitcherSwap = ['starter', 'reliever', 'closer'].includes(selectedSlot.type) && ['starter', 'reliever', 'closer'].includes(type);

    if (isBatterSwap || isPitcherSwap) {
        await swapPlayers(selectedSlot, { type, index });
    } else {
        // Switch selection if clicking across types (e.g. Batter -> Pitcher)
        setSelectedSlot({ type, index });
        return;
    }
    
    setSelectedSlot(null);
  };

  const swapPlayers = async (source: { type: 'lineup' | 'bench' | 'starter' | 'reliever' | 'closer', index: number }, target: { type: 'lineup' | 'bench' | 'starter' | 'reliever' | 'closer', index: number }) => {
    if (!team) return;

    if (['lineup', 'bench'].includes(source.type)) {
        const newLineup = [...lineupPlayers];
        const newBench = [...benchPlayers];

        let sourcePlayer: Player;
        let targetPlayer: Player;

        // Get players
        if (source.type === 'lineup') sourcePlayer = newLineup[source.index];
        else sourcePlayer = newBench[source.index];

        if (target.type === 'lineup') targetPlayer = newLineup[target.index];
        else targetPlayer = newBench[target.index];

        // Swap logic
        if (source.type === 'lineup' && target.type === 'lineup') {
            // Swap within lineup
            // ポジションは選手に紐づくため、スワップしない (選手と一緒に移動する)
            newLineup[source.index] = targetPlayer;
            newLineup[target.index] = sourcePlayer;

        } else if (source.type === 'bench' && target.type === 'bench') {
            // Swap within bench
            newBench[source.index] = targetPlayer;
            newBench[target.index] = sourcePlayer;
        } else {
            // Swap between lineup and bench
            if (source.type === 'lineup') {
                // Lineup -> Bench
                // スタメンからベンチへ: 本職に戻す
                const originalSource = players.find(p => p.id === sourcePlayer.id);
                if (originalSource) {
                    sourcePlayer.position = originalSource.position;
                }
                
                // ベンチからスタメンへ: 本職で入る (重複はユーザーが修正)
                const originalTarget = players.find(p => p.id === targetPlayer.id);
                if (originalTarget) {
                    targetPlayer.position = originalTarget.position;
                }
                
                newLineup[source.index] = targetPlayer;
                newBench[target.index] = sourcePlayer;
            } else {
                // Bench -> Lineup
                // ベンチからスタメンへ: 本職で入る
                const originalSource = players.find(p => p.id === sourcePlayer.id);
                if (originalSource) {
                    sourcePlayer.position = originalSource.position;
                }

                // スタメンからベンチへ: 本職に戻す
                const originalTarget = players.find(p => p.id === targetPlayer.id);
                if (originalTarget) {
                    targetPlayer.position = originalTarget.position;
                }

                newLineup[target.index] = sourcePlayer;
                newBench[source.index] = targetPlayer;
            }
        }

        setLineupPlayers(newLineup);
        setBenchPlayers(newBench);

        // Update Team Data
        const newLineupIds = newLineup.map(p => p.id as number);
        
        // Update Lineup Settings (Lock swapped players)
        let newSettings = [...(team.lineupSettings || [])];
        
        // Helper to update setting
        const updateSetting = (slotIndex: number, player: Player) => {
            const slotNumber = slotIndex + 1;
            const existingIndex = newSettings.findIndex(s => s.slotNumber === slotNumber);
            if (existingIndex >= 0) {
                newSettings[existingIndex] = {
                    ...newSettings[existingIndex],
                    playerId: player.id,
                    position: player.position,
                    isLocked: false // Do not auto-lock
                };
            } else {
                newSettings.push({
                    slotNumber,
                    playerId: player.id,
                    position: player.position,
                    isLocked: false
                });
            }
        };

        if (source.type === 'lineup') updateSetting(source.index, newLineup[source.index]);
        if (target.type === 'lineup') updateSetting(target.index, newLineup[target.index]);

        const updatedTeam = { 
            ...team, 
            lineup: newLineupIds,
            lineupSettings: newSettings
        };
        setTeam(updatedTeam);
        setHasUnsavedChanges(true);
    } else {
        // Pitcher Swap Logic
        const newRotation = [...pitchers.starters];
        const newBullpen = [...pitchers.relievers];
        const newCloser = [...pitchers.closer];

        let sourcePlayer: Player;
        let targetPlayer: Player;

        const getPlayer = (t: string, i: number) => {
            if (t === 'starter') return newRotation[i];
            if (t === 'reliever') return newBullpen[i];
            return newCloser[i];
        };

        sourcePlayer = getPlayer(source.type, source.index);
        targetPlayer = getPlayer(target.type, target.index);

        const setPlayer = (t: string, i: number, p: Player) => {
            if (t === 'starter') newRotation[i] = p;
            else if (t === 'reliever') newBullpen[i] = p;
            else newCloser[i] = p;
        };

        setPlayer(source.type, source.index, targetPlayer);
        setPlayer(target.type, target.index, sourcePlayer);

        // Update Roles
        const updateRole = (p: Player, t: string) => {
            if (t === 'starter') p.pitcherRole = 'starter';
            else if (t === 'reliever') p.pitcherRole = 'reliever';
            else if (t === 'closer') p.pitcherRole = 'closer';
        };

        updateRole(sourcePlayer, target.type); // Source moved to Target
        updateRole(targetPlayer, source.type); // Target moved to Source

        setPitchers({
            starters: newRotation,
            relievers: newBullpen,
            closer: newCloser
        });

        // Update Rotation Settings
        let newSettings = [...(team.pitcherSettings || [])];
        // Migration if needed
        if (newSettings.length === 0 && team.rotationSettings && team.rotationSettings.length > 0) {
             newSettings = team.rotationSettings.map((s: any) => ({
                 playerId: s.playerId,
                 role: 'starter',
                 isLocked: s.isLocked,
                 slotNumber: s.slotNumber
             }));
        }
        
        const updateSettingForPlayer = (player: Player, role: string, index: number) => {
             // Remove old setting
             const oldIdx = newSettings.findIndex(s => s.playerId === player.id);
             if (oldIdx >= 0) newSettings.splice(oldIdx, 1);
             
             // Add new setting
             if (role === 'starter') {
                 newSettings.push({
                     playerId: player.id,
                     role: 'starter',
                     slotNumber: index + 1,
                     isLocked: false
                 });
             } else if (role === 'closer') {
                 newSettings.push({
                     playerId: player.id,
                     role: 'closer',
                     isLocked: false
                 });
             } else {
                 // Reliever
                 newSettings.push({
                     playerId: player.id,
                     role: 'reliever',
                     isLocked: false
                 });
             }
        };

        // Source is now at Target position
        updateSettingForPlayer(sourcePlayer, target.type, target.index);
        // Target is now at Source position
        updateSettingForPlayer(targetPlayer, source.type, source.index);

        const updatedTeam = { 
            ...team, 
            pitcherSettings: newSettings,
            rotationSettings: undefined // Clear old settings
        };
        setTeam(updatedTeam);
        setHasUnsavedChanges(true);
    }
  };

  const toggleLock = async (slotNumber: number, player: Player, type: 'lineup' | 'starter' | 'reliever' | 'closer' = 'lineup') => {
    if (!team) return;

    if (type === 'lineup') {
        const currentSettings = team.lineupSettings || [];
        const existingIndex = currentSettings.findIndex(s => s.slotNumber === slotNumber);
        
        let newSettings = [...currentSettings];
        
        if (existingIndex >= 0) {
            const setting = newSettings[existingIndex];
            if (setting.playerId === player.id) {
                newSettings[existingIndex] = { ...setting, isLocked: !setting.isLocked };
            } else {
                newSettings[existingIndex] = { 
                    slotNumber, 
                    playerId: player.id, 
                    position: player.position, 
                    isLocked: true 
                };
            }
        } else {
            newSettings.push({
                slotNumber,
                playerId: player.id,
                position: player.position,
                isLocked: true
            });
        }

        const updatedTeam = { ...team, lineupSettings: newSettings };
        setTeam(updatedTeam);
        setHasUnsavedChanges(true);
    } else {
        // Pitcher Lock
        let newSettings = [...(team.pitcherSettings || [])];
        // Migration
        if (newSettings.length === 0 && team.rotationSettings && team.rotationSettings.length > 0) {
             newSettings = team.rotationSettings.map((s: any) => ({
                 playerId: s.playerId,
                 role: 'starter',
                 isLocked: s.isLocked,
                 slotNumber: s.slotNumber
             }));
        }

        const existingIndex = newSettings.findIndex(s => s.playerId === player.id);
        
        if (existingIndex >= 0) {
            const setting = newSettings[existingIndex];
            newSettings[existingIndex] = { ...setting, isLocked: !setting.isLocked };
        } else {
            // Create new setting
            const setting: any = {
                playerId: player.id,
                role: type,
                isLocked: true
            };
            if (type === 'starter') {
                setting.slotNumber = slotNumber;
            }
            newSettings.push(setting);
        }

        const updatedTeam = { 
            ...team, 
            pitcherSettings: newSettings,
            rotationSettings: undefined
        };
        setTeam(updatedTeam);
        setHasUnsavedChanges(true);
    }
  };

  const renderBatterRow = (player: Player, index: number, isBench: boolean = false) => {
    const stats = player.stats || {};
    const avg = stats.average !== undefined ? stats.average.toFixed(3).substring(1) : '.---';
    const hr = stats.homeRuns !== undefined ? stats.homeRuns : 0;
    const rbi = stats.rbi !== undefined ? stats.rbi : 0;
    const sb = stats.stolenBases !== undefined ? stats.stolenBases : 0;
    const obp = stats.obp !== undefined ? stats.obp.toFixed(3).substring(1) : '.---';

    // スタメンの場合、打順を表示する (index + 1)
    // ベンチの場合は '-'
    const orderDisplay = isBench ? '-' : (index + 1).toString();
    
    // ロック状態の確認
    const slotNumber = index + 1;
    const isLocked = !isBench && team?.lineupSettings?.some(s => 
        s.slotNumber === slotNumber && s.playerId === player.id && s.isLocked
    );

    const isSelected = selectedSlot?.type === (isBench ? 'bench' : 'lineup') && selectedSlot?.index === index;

    // 本職ポジションの取得
    const originalPlayer = players.find(p => p.id === player.id);
    const mainPosition = originalPlayer ? originalPlayer.position : player.position;
    const isPositionChanged = !isBench && player.position !== mainPosition;

    // ポジション重複チェック
    const isDuplicate = !isBench && lineupPlayers.filter(p => p.position === player.position).length > 1;

    return (
      <TouchableOpacity 
        style={[styles.row, isSelected && styles.selectedRow]} 
        key={player.id}
        onPress={() => handlePlayerPress(isBench ? 'bench' : 'lineup', index)}
      >
        {!isBench ? (
            <TouchableOpacity onPress={() => toggleLock(slotNumber, player)} style={{ width: 30, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name={isLocked ? "checkbox" : "square-outline"} size={20} color={isLocked ? "#4CAF50" : "#757575"} />
            </TouchableOpacity>
        ) : (
            <View style={{ width: 30 }} />
        )}
        <Text style={[styles.cell, styles.posCell]}>{orderDisplay}</Text>
        
        {/* ポジション表示 (タップで変更可能) */}
        {!isBench ? (
            <TouchableOpacity 
                style={[styles.cell, styles.posCell, { backgroundColor: isDuplicate ? '#FFEBEE' : 'transparent' }]}
                onPress={() => {
                    setTargetPlayerIndex(index);
                    setPositionModalVisible(true);
                }}
            >
                <Text style={{ fontWeight: 'bold', color: isDuplicate ? 'red' : '#000' }}>{player.position}</Text>
            </TouchableOpacity>
        ) : (
            <Text style={[styles.cell, styles.posCell]}>{player.position}</Text>
        )}

        <View style={[styles.cell, styles.nameCell]}>
            <Text style={{ color: '#0000EE' }}>{player.name}</Text>
            {!isBench && isPositionChanged && player.position !== 'DH' && (
                <Text style={{ fontSize: 10, color: '#757575' }}>(本:{mainPosition})</Text>
            )}
        </View>
        
        <Text style={styles.cell}>{avg}</Text>
        <Text style={styles.cell}>{hr}</Text>
        <Text style={styles.cell}>{rbi}</Text>
        <Text style={styles.cell}>{sb}</Text>
        <Text style={styles.cell}>{obp}</Text>
      </TouchableOpacity>
    );
  };

  const renderPitcherRow = (player: Player, index: number, role: 'starter' | 'reliever' | 'closer') => {
    const stats = player.stats || {};
    const g = stats.gamesPitched || 0;
    const ip = stats.inningsPitched ? stats.inningsPitched.toFixed(0) : '0'; // Simplified IP display
    const era = stats.era !== undefined ? stats.era.toFixed(2) : '-.--';
    const wl = `${stats.wins || 0}-${stats.losses || 0}`;
    const so = stats.strikeOuts || 0;

    let roleLabel = '中';
    if (role === 'starter') roleLabel = '先';
    if (role === 'closer') roleLabel = '抑';

    const slotNumber = index + 1;
    
    // Check lock status
    let isLocked = false;
    let effectiveSettings = team?.pitcherSettings || [];
    
    // Fallback/Migration for display
    if (effectiveSettings.length === 0 && team?.rotationSettings && team.rotationSettings.length > 0) {
         effectiveSettings = team.rotationSettings.map((s: any) => ({
             playerId: s.playerId,
             role: 'starter',
             isLocked: s.isLocked,
             slotNumber: s.slotNumber
         }));
    }

    isLocked = effectiveSettings.some(s => 
        s.playerId === player.id && s.isLocked && s.role === role
    );

    const isSelected = selectedSlot?.type === role && selectedSlot?.index === index;

    return (
      <TouchableOpacity 
        style={[styles.row, isSelected && styles.selectedRow]} 
        key={player.id}
        onPress={() => handlePlayerPress(role, index)}
      >
        <TouchableOpacity onPress={() => toggleLock(slotNumber, player, role)} style={{ width: 30, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name={isLocked ? "checkbox" : "square-outline"} size={20} color={isLocked ? "#4CAF50" : "#757575"} />
        </TouchableOpacity>
        <Text style={[styles.cell, styles.posCell]}>{role === 'starter' ? slotNumber : '-'}</Text>
        <Text style={[styles.cell, styles.posCell]}>{roleLabel}</Text>
        <Text style={[styles.cell, styles.nameCell, { color: '#0000EE' }]}>{player.name}</Text>
        <Text style={styles.cell}>{g}</Text>
        <Text style={styles.cell}>{ip}</Text>
        <Text style={styles.cell}>{era}</Text>
        <Text style={styles.cell}>{wl}</Text>
        <Text style={styles.cell}>{so}</Text>
      </TouchableOpacity>
    );
  };

  const handlePositionChange = async (newPosition: Position) => {
    if (targetPlayerIndex === null || !team) return;

    const newLineup = [...lineupPlayers];
    // Clone the player object to avoid mutating the original roster data
    const player = { ...newLineup[targetPlayerIndex] };
    
    // Update position
    player.position = newPosition;
    newLineup[targetPlayerIndex] = player;
    setLineupPlayers(newLineup);
    
    // Update settings and save
    const newLineupIds = newLineup.map(p => p.id as number);
    let newSettings = [...(team.lineupSettings || [])];
    
    const slotNumber = targetPlayerIndex + 1;
    const existingIndex = newSettings.findIndex(s => s.slotNumber === slotNumber);
    
    if (existingIndex >= 0) {
        newSettings[existingIndex] = {
            ...newSettings[existingIndex],
            playerId: player.id,
            position: newPosition,
            isLocked: false
        };
    } else {
        newSettings.push({
            slotNumber,
            playerId: player.id,
            position: newPosition,
            isLocked: false
        });
    }

    const updatedTeam = { 
        ...team, 
        lineup: newLineupIds,
        lineupSettings: newSettings
    };
    setTeam(updatedTeam);
    setHasUnsavedChanges(true);
    // await dbManager.updateTeams([updatedTeam]); // Removed immediate save
    
    setPositionModalVisible(false);
    setTargetPlayerIndex(null);
  };

  const saveChanges = async () => {
    if (!team) return;
    setLoading(true);
    try {
        await dbManager.updateTeams([team]);
        setHasUnsavedChanges(false);
    } catch (error) {
        console.error("Failed to save changes", error);
    } finally {
        setLoading(false);
    }
  };

  const cancelChanges = () => {
    loadData();
  };

  const currentDateStr = formatDateJP(getGameDateString(gameState.currentDate, gameState.season));

  return (
    <View style={styles.container}>
      {/* Position Selection Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={positionModalVisible}
        onRequestClose={() => setPositionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>守備位置を選択</Text>
                <View style={styles.positionGrid}>
                    {POSITIONS.map(pos => (
                        <TouchableOpacity
                            key={pos}
                            style={styles.positionButton}
                            onPress={() => handlePositionChange(pos)}
                        >
                            <Text style={styles.positionButtonText}>{pos}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setPositionModalVisible(false)}
                >
                    <Text style={styles.closeButtonText}>キャンセル</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.teamInfo}>
            <TouchableOpacity 
                onPress={() => {
                    if (hasUnsavedChanges) {
                        cancelChanges();
                    }
                    navigation.goBack();
                }} 
                style={{ marginRight: 10 }}
            >
                <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.teamName}>{team.name}</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
            style={[styles.tabButton, activeTab === 'batters' && styles.activeTabButton]}
            onPress={() => setActiveTab('batters')}
        >
            <Text style={[styles.tabText, activeTab === 'batters' && styles.activeTabText]}>野手</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={[styles.tabButton, activeTab === 'pitchers' && styles.activeTabButton]}
            onPress={() => setActiveTab('pitchers')}
        >
            <Text style={[styles.tabText, activeTab === 'pitchers' && styles.activeTabText]}>投手</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {activeTab === 'batters' ? (
            <View style={styles.column}>
                {/* Header Row */}
                <View style={[styles.row, styles.headerRow]}>
                    <View style={{ width: 30, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold' }}>固定</Text>
                    </View>
                    <Text style={[styles.cell, styles.posCell]}>順</Text>
                    <Text style={[styles.cell, styles.posCell]}>守</Text>
                    <Text style={[styles.cell, styles.nameCell]}>選手名</Text>
                    <Text style={styles.cell}>AVG</Text>
                    <Text style={styles.cell}>HR</Text>
                    <Text style={styles.cell}>RBI</Text>
                    <Text style={styles.cell}>SB</Text>
                    <Text style={styles.cell}>OBP</Text>
                </View>
                <ScrollView>
                    {lineupPlayers.map((p, i) => renderBatterRow(p, i))}
                    <View style={styles.divider} />
                    {benchPlayers.map((p, i) => renderBatterRow(p, i, true))}
                </ScrollView>
            </View>
        ) : (
            <View style={styles.column}>
                {/* Header Row */}
                <View style={[styles.row, styles.headerRow]}>
                    <View style={{ width: 30, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold' }}>固定</Text>
                    </View>
                    <Text style={[styles.cell, styles.posCell]}>順</Text>
                    <Text style={[styles.cell, styles.posCell]}>役</Text>
                    <Text style={[styles.cell, styles.nameCell]}>選手名</Text>
                    <Text style={styles.cell}>G</Text>
                    <Text style={styles.cell}>IP</Text>
                    <Text style={styles.cell}>ERA</Text>
                    <Text style={styles.cell}>W-L</Text>
                    <Text style={styles.cell}>SO</Text>
                </View>
                <ScrollView>
                    <Text style={{fontWeight: 'bold', margin: 5, backgroundColor: '#eee', padding: 5}}>先発ローテーション</Text>
                    {pitchers.starters.map((p, i) => renderPitcherRow(p, i, 'starter'))}
                    <View style={styles.divider} />
                    <Text style={{fontWeight: 'bold', margin: 5, backgroundColor: '#eee', padding: 5}}>抑え</Text>
                    {pitchers.closer.map((p, i) => renderPitcherRow(p, i, 'closer'))}
                    <View style={styles.divider} />
                    <Text style={{fontWeight: 'bold', margin: 5, backgroundColor: '#eee', padding: 5}}>ブルペン</Text>
                    {pitchers.relievers.map((p, i) => renderPitcherRow(p, i, 'reliever'))}
                </ScrollView>
            </View>
        )}
      </View>

      {/* Footer for Save/Cancel */}
      {hasUnsavedChanges && (
          <View style={styles.footer}>
            <TouchableOpacity style={[styles.footerButton, { backgroundColor: '#757575', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 5 }]} onPress={cancelChanges}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.footerButton, { backgroundColor: '#2196F3', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 5 }]} onPress={saveChanges}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>確定する</Text>
            </TouchableOpacity>
          </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#4CAF50',
    borderBottomWidth: 1,
    borderBottomColor: '#388E3C',
    paddingTop: 10, // Adjust based on status bar needs
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  teamName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#4CAF50',
  },
  contentContainer: {
    flex: 1,
    padding: 10,
  },
  column: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 4,
    padding: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  selectedRow: {
    backgroundColor: '#E3F2FD',
  },
  headerRow: {
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
    marginBottom: 5,
  },
  cell: {
    flex: 1,
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
  },
  posCell: {
    flex: 0.5,
    fontWeight: 'bold',
  },
  nameCell: {
    flex: 2,
    textAlign: 'left',
    paddingLeft: 5,
  },
  divider: {
    height: 10,
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: '#333',
    paddingVertical: 10,
    justifyContent: 'space-around',
  },
  footerButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerButtonText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  positionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  positionButton: {
    width: 60,
    height: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    borderRadius: 5,
  },
  positionButtonText: {
    fontWeight: 'bold',
    color: '#1976D2',
  },
  closeButton: {
    marginTop: 15,
    padding: 10,
  },
  closeButtonText: {
    color: '#757575',
  },
});
