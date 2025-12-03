import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { dbManager } from '../services/databaseManager';
import { Player, TeamId } from '../types';

type ViewMode = 'batter' | 'pitcher';
type SortOrder = 'asc' | 'desc';

const TEAMS: TeamId[] = [
  "hawks", "lions", "fighters", "buffaloes", "eagles", "marines",
  "giants", "tigers", "dragons", "baystars", "carp", "swallows"
];

const PACIFIC_TEAMS: TeamId[] = ["hawks", "lions", "fighters", "buffaloes", "eagles", "marines"];
const CENTRAL_TEAMS: TeamId[] = ["giants", "tigers", "dragons", "baystars", "carp", "swallows"];

export const PlayerAbilityScreen = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('batter');
  const [selectedTeam, setSelectedTeam] = useState<TeamId | 'all' | 'central' | 'pacific'>('all');
  const [sortField, setSortField] = useState<string>('overall'); // Default sort
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      loadPlayers();
    }, [])
  );

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const [playersData, teamsData] = await Promise.all([
        dbManager.getInitialPlayers(),
        dbManager.getInitialTeams()
      ]);
      setPlayers(playersData);
      setTeams(teamsData);
    } catch (error) {
      console.error('Failed to load players:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedPlayers = useMemo(() => {
    let result = players;

    // 1. Filter by Position Type
    if (viewMode === 'pitcher') {
      result = result.filter(p => p.position === 'P');
    } else {
      result = result.filter(p => p.position !== 'P');
    }

    // 2. Filter by Team
    if (selectedTeam !== 'all') {
      if (selectedTeam === 'central') {
        result = result.filter(p => CENTRAL_TEAMS.includes(p.team));
      } else if (selectedTeam === 'pacific') {
        result = result.filter(p => PACIFIC_TEAMS.includes(p.team));
      } else {
        result = result.filter(p => p.team === selectedTeam);
      }
    }

    // 3. Sort
    result.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      switch (sortField) {
        case 'name':
          valA = a.name;
          valB = b.name;
          break;
        case 'team':
          valA = a.team;
          valB = b.team;
          break;
        case 'age':
          valA = a.age;
          valB = b.age;
          break;
        case 'position':
          valA = a.position;
          valB = b.position;
          break;
        // Pitcher Abilities
        case 'speed':
          valA = a.abilities.speed || 0;
          valB = b.abilities.speed || 0;
          break;
        case 'control':
          valA = a.abilities.control || 0;
          valB = b.abilities.control || 0;
          break;
        case 'stamina':
          valA = a.abilities.stamina || 0;
          valB = b.abilities.stamina || 0;
          break;
        // Fielder Abilities
        case 'trajectory':
          valA = a.abilities.trajectory || 0;
          valB = b.abilities.trajectory || 0;
          break;
        case 'contact':
          valA = a.abilities.contact || 0;
          valB = b.abilities.contact || 0;
          break;
        case 'power':
          valA = a.abilities.power || 0;
          valB = b.abilities.power || 0;
          break;
        case 'run_speed': // Distinguish from pitcher speed
          valA = a.abilities.speed || 0;
          valB = b.abilities.speed || 0;
          break;
        case 'arm':
          valA = a.abilities.arm || 0;
          valB = b.abilities.arm || 0;
          break;
        case 'fielding':
          valA = a.abilities.fielding || 0;
          valB = b.abilities.fielding || 0;
          break;
        case 'overall':
          valA = a.abilities.overall || 0;
          valB = b.abilities.overall || 0;
          break;
        case 'salary':
          valA = a.contract.salary || 0;
          valB = b.contract.salary || 0;
          break;
        default:
          valA = 0;
          valB = 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [players, viewMode, selectedTeam, sortField, sortOrder]);

  const renderHeader = () => (
    <View style={styles.headerRow}>
      <TouchableOpacity style={[styles.headerCell, styles.nameCell]} onPress={() => handleSort('name')}>
        <Text style={styles.headerText}>名前 {sortField === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.headerCell, styles.teamCell]} onPress={() => handleSort('team')}>
        <Text style={styles.headerText}>球団 {sortField === 'team' && (sortOrder === 'asc' ? '▲' : '▼')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.headerCell, styles.ageCell]} onPress={() => handleSort('age')}>
        <Text style={styles.headerText}>年齢 {sortField === 'age' && (sortOrder === 'asc' ? '▲' : '▼')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.headerCell, styles.posCell]} onPress={() => handleSort('position')}>
        <Text style={styles.headerText}>守備 {sortField === 'position' && (sortOrder === 'asc' ? '▲' : '▼')}</Text>
      </TouchableOpacity>

      {viewMode === 'pitcher' ? (
        <>
          <TouchableOpacity style={[styles.headerCell, styles.abilityCell]} onPress={() => handleSort('speed')}>
            <Text style={styles.headerText}>球速 {sortField === 'speed' && (sortOrder === 'asc' ? '▲' : '▼')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerCell, styles.abilityCell]} onPress={() => handleSort('control')}>
            <Text style={styles.headerText}>コン {sortField === 'control' && (sortOrder === 'asc' ? '▲' : '▼')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerCell, styles.abilityCell]} onPress={() => handleSort('stamina')}>
            <Text style={styles.headerText}>スタ {sortField === 'stamina' && (sortOrder === 'asc' ? '▲' : '▼')}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity style={[styles.headerCell, styles.abilityCell]} onPress={() => handleSort('trajectory')}>
            <Text style={styles.headerText}>弾道 {sortField === 'trajectory' && (sortOrder === 'asc' ? '▲' : '▼')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerCell, styles.abilityCell]} onPress={() => handleSort('contact')}>
            <Text style={styles.headerText}>ミート {sortField === 'contact' && (sortOrder === 'asc' ? '▲' : '▼')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerCell, styles.abilityCell]} onPress={() => handleSort('power')}>
            <Text style={styles.headerText}>パワー {sortField === 'power' && (sortOrder === 'asc' ? '▲' : '▼')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerCell, styles.abilityCell]} onPress={() => handleSort('run_speed')}>
            <Text style={styles.headerText}>走力 {sortField === 'run_speed' && (sortOrder === 'asc' ? '▲' : '▼')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerCell, styles.abilityCell]} onPress={() => handleSort('arm')}>
            <Text style={styles.headerText}>肩力 {sortField === 'arm' && (sortOrder === 'asc' ? '▲' : '▼')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerCell, styles.abilityCell]} onPress={() => handleSort('fielding')}>
            <Text style={styles.headerText}>守備 {sortField === 'fielding' && (sortOrder === 'asc' ? '▲' : '▼')}</Text>
          </TouchableOpacity>
        </>
      )}
      <TouchableOpacity style={[styles.headerCell, styles.abilityCell]} onPress={() => handleSort('overall')}>
        <Text style={styles.headerText}>評価 {sortField === 'overall' && (sortOrder === 'asc' ? '▲' : '▼')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.headerCell, styles.abilityCell]} onPress={() => handleSort('salary')}>
        <Text style={styles.headerText}>年俸 {sortField === 'salary' && (sortOrder === 'asc' ? '▲' : '▼')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }: { item: Player }) => {
    const isPitcher = item.position === 'P';
    const teamName = teams.find(t => t.id === item.team)?.name.substring(0, 2) || item.team.substring(0, 2);

    return (
      <TouchableOpacity 
        style={styles.row} 
        onPress={() => (navigation as any).navigate('PlayerDetail', { player: item })}
      >
        <Text style={[styles.cell, styles.nameCell]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.cell, styles.teamCell]}>{teamName}</Text>
        <Text style={[styles.cell, styles.ageCell]}>{item.age}</Text>
        <Text style={[styles.cell, styles.posCell]}>{item.position}</Text>
        
        {isPitcher ? (
          <>
            <Text style={[styles.cell, styles.abilityCell]}>{item.abilities.speed}km</Text>
            <Text style={[styles.cell, styles.abilityCell]}>{item.abilities.control}</Text>
            <Text style={[styles.cell, styles.abilityCell]}>{item.abilities.stamina}</Text>
          </>
        ) : (
          <>
            <Text style={[styles.cell, styles.abilityCell]}>{item.abilities.trajectory}</Text>
            <Text style={[styles.cell, styles.abilityCell]}>{item.abilities.contact}</Text>
            <Text style={[styles.cell, styles.abilityCell]}>{item.abilities.power}</Text>
            <Text style={[styles.cell, styles.abilityCell]}>{item.abilities.speed}</Text>
            <Text style={[styles.cell, styles.abilityCell]}>{item.abilities.arm}</Text>
            <Text style={[styles.cell, styles.abilityCell]}>{item.abilities.fielding}</Text>
          </>
        )}
        <Text style={[styles.cell, styles.abilityCell]}>{item.abilities.overall}</Text>
        <Text style={[styles.cell, styles.abilityCell]}>{item.contract.salary}万</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          <TouchableOpacity 
            style={[styles.filterButton, viewMode === 'batter' && styles.activeFilter]} 
            onPress={() => setViewMode('batter')}
          >
            <Text style={[styles.filterText, viewMode === 'batter' && styles.activeFilterText]}>野手</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, viewMode === 'pitcher' && styles.activeFilter]} 
            onPress={() => setViewMode('pitcher')}
          >
            <Text style={[styles.filterText, viewMode === 'pitcher' && styles.activeFilterText]}>投手</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teamFilterScroll}>
          <TouchableOpacity 
            style={[styles.teamFilterButton, selectedTeam === 'all' && styles.activeTeamFilter]} 
            onPress={() => setSelectedTeam('all')}
          >
            <Text style={styles.teamFilterText}>全チーム</Text>
          </TouchableOpacity>
          {teams.map(team => (
            <TouchableOpacity 
              key={team.id}
              style={[styles.teamFilterButton, selectedTeam === team.id && styles.activeTeamFilter]} 
              onPress={() => setSelectedTeam(team.id)}
            >
              <Text style={styles.teamFilterText}>{team.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : (
        <View style={styles.listContainer}>
          {renderHeader()}
          <FlatList
            data={filteredAndSortedPlayers}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            initialNumToRender={20}
            maxToRenderPerBatch={20}
          />
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
  filterContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  filterButton: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRadius: 4,
    marginHorizontal: 2,
  },
  activeFilter: {
    backgroundColor: '#2196F3',
  },
  filterText: {
    fontSize: 14,
    color: '#333',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  teamFilterScroll: {
    flexDirection: 'row',
  },
  teamFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eee',
    borderRadius: 15,
    marginRight: 8,
  },
  activeTeamFilter: {
    backgroundColor: '#4CAF50',
  },
  teamFilterText: {
    fontSize: 12,
    color: '#333',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  headerCell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cell: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
  },
  headerText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333',
  },
  nameCell: {
    flex: 3,
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  teamCell: {
    flex: 1.5,
  },
  ageCell: {
    flex: 1,
  },
  posCell: {
    flex: 1,
  },
  abilityCell: {
    flex: 1.2,
  },
});
