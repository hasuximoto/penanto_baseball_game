import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { Player, TeamId, Team } from '../types';
import { dbManager } from '../services/databaseManager';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '@/utils/theme';

interface RosterMoveScreenProps {
  route: {
    params: {
      teamId: TeamId;
    };
  };
  navigation: any;
}

export const RosterMoveScreen: React.FC<RosterMoveScreenProps> = ({ route, navigation }) => {
  const { teamId } = route.params;
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<Team | null>(null);
  const [activePlayers, setActivePlayers] = useState<Player[]>([]);
  const [farmPlayers, setFarmPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  useEffect(() => {
    loadData();
  }, [teamId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const teams = await dbManager.getInitialTeams();
      const targetTeam = teams.find(t => t.id === teamId);
      setTeam(targetTeam || null);

      const roster = await dbManager.getTeamRoster(teamId);
      const active = roster.filter(p => p.registrationStatus === 'active' || !p.registrationStatus);
      const farm = roster.filter(p => p.registrationStatus === 'farm');
      
      setActivePlayers(active);
      setFarmPlayers(farm);
    } catch (error) {
      console.error("Failed to load roster", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async (player: Player, targetStatus: 'active' | 'farm') => {
    if (targetStatus === 'active' && activePlayers.length >= 29) {
      Alert.alert('登録枠上限', '一軍登録枠（29人）がいっぱいです。誰かを抹消してください。');
      return;
    }

    // Check locks if demoting (active -> farm)
    if (targetStatus === 'farm' && team) {
        // Check Lineup Lock
        const isLineupLocked = team.lineupSettings?.some(s => s.playerId === player.id && s.isLocked);
        if (isLineupLocked) {
            Alert.alert('固定選手', 'この選手はスタメン固定されているため、抹消できません。');
            return;
        }

        // Check Pitcher Lock
        let pitcherSettings = team.pitcherSettings || [];
        // Migration fallback
        if (pitcherSettings.length === 0 && team.rotationSettings && team.rotationSettings.length > 0) {
             pitcherSettings = team.rotationSettings.map((s: any) => ({
                 playerId: s.playerId,
                 role: 'starter',
                 isLocked: s.isLocked,
                 slotNumber: s.slotNumber
             }));
        }

        const isPitcherLocked = pitcherSettings.some(s => s.playerId === player.id && s.isLocked);
        if (isPitcherLocked) {
            Alert.alert('固定選手', 'この選手は投手起用が固定されているため、抹消できません。');
            return;
        }
    }

    try {
      const updatedPlayer = { ...player, registrationStatus: targetStatus };
      
      // Update local state
      if (targetStatus === 'active') {
        setFarmPlayers(prev => prev.filter(p => p.id !== player.id));
        setActivePlayers(prev => [...prev, updatedPlayer]);
      } else {
        setActivePlayers(prev => prev.filter(p => p.id !== player.id));
        setFarmPlayers(prev => [...prev, updatedPlayer]);
      }
      
      setSelectedPlayer(null);

      // Save to DB
      await dbManager.updatePlayers([updatedPlayer]);
      
    } catch (error) {
      console.error("Failed to update player status", error);
      Alert.alert('エラー', '選手の移動に失敗しました');
    }
  };

  const renderPlayerItem = ({ item }: { item: Player }) => {
    const isSelected = selectedPlayer?.id === item.id;
    
    return (
      <TouchableOpacity 
        style={[styles.playerItem, isSelected && styles.selectedItem]}
        onPress={() => setSelectedPlayer(item)}
      >
        <View style={styles.playerInfo}>
          <View style={styles.positionBadge}>
               <Text style={styles.positionText}>{item.position}</Text>
          </View>
          <Text style={styles.nameText}>{item.name}</Text>
        </View>
        {isSelected && (
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              item.registrationStatus === 'farm' ? styles.promoteButton : styles.demoteButton
            ]}
            onPress={() => handleMove(item, item.registrationStatus === 'farm' ? 'active' : 'farm')}
          >
            <Text style={styles.actionButtonText}>
              {item.registrationStatus === 'farm' ? '昇格' : '抹消'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerTitle}>一軍登録・抹消</Text>
            <Text style={styles.headerSubtitle}>一軍枠: {activePlayers.length} / 29</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.listsContainer}>
        <View style={styles.listColumn}>
          <View style={[styles.columnHeader, { backgroundColor: COLORS.card }]}>
            <Text style={styles.columnTitle}>一軍 (Active)</Text>
          </View>
          <FlatList
            data={activePlayers.sort((a, b) => {
                if (a.position === 'P' && b.position !== 'P') return -1;
                if (a.position !== 'P' && b.position === 'P') return 1;
                return 0;
            })}
            renderItem={renderPlayerItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.listColumn}>
          <View style={[styles.columnHeader, { backgroundColor: COLORS.card }]}>
            <Text style={styles.columnTitle}>二軍 (Farm)</Text>
          </View>
          <FlatList
            data={farmPlayers.sort((a, b) => {
                if (a.position === 'P' && b.position !== 'P') return -1;
                if (a.position !== 'P' && b.position === 'P') return 1;
                return 0;
            })}
            renderItem={renderPlayerItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: FONTS.bold,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  listsContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  listColumn: {
    flex: 1,
  },
  divider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  columnHeader: {
    padding: SPACING.sm,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    // Background color is set inline
  },
  columnTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: COLORS.text,
  },
  listContent: {
    padding: SPACING.xs,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
    marginBottom: 4,
    borderRadius: 8,
  },
  selectedItem: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  positionBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 32,
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  positionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  nameText: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: FONTS.regular,
  },
  actionButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: SPACING.sm,
  },
  promoteButton: {
    backgroundColor: COLORS.primary,
  },
  demoteButton: {
    backgroundColor: COLORS.negative,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
