import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Player, TeamId, Team } from '../types';
import { dbManager } from '../services/databaseManager';
import { Ionicons } from '@expo/vector-icons';

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
    const isPitcher = item.position === 'P';
    
    return (
      <TouchableOpacity 
        style={[styles.playerItem, isSelected && styles.selectedItem]}
        onPress={() => setSelectedPlayer(item)}
      >
        <View style={styles.playerInfo}>
          <Text style={styles.positionText}>{item.position}</Text>
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
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>一軍登録・抹消</Text>
        <Text style={styles.headerSubtitle}>一軍枠: {activePlayers.length} / 29</Text>
      </View>

      <View style={styles.listsContainer}>
        <View style={styles.listColumn}>
          <View style={[styles.columnHeader, { backgroundColor: '#E3F2FD' }]}>
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
          <View style={[styles.columnHeader, { backgroundColor: '#FFEBEE' }]}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 15,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
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
    backgroundColor: '#e0e0e0',
  },
  columnHeader: {
    padding: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  columnTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  listContent: {
    padding: 5,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  selectedItem: {
    backgroundColor: '#E8F5E9',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  positionText: {
    width: 30,
    fontWeight: 'bold',
    color: '#666',
  },
  nameText: {
    fontSize: 14,
    color: '#333',
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    marginLeft: 5,
  },
  promoteButton: {
    backgroundColor: '#4CAF50',
  },
  demoteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
