import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { dbManager } from '../services/databaseManager';
import { Player, TeamId } from '../types';
import { TEAM_ABBREVIATIONS } from '../utils/constants';

type ViewMode = 'batter' | 'pitcher';
type SortOrder = 'asc' | 'desc';

const TEAMS: TeamId[] = [
  "hawks", "lions", "fighters", "buffaloes", "eagles", "marines",
  "giants", "tigers", "dragons", "baystars", "carp", "swallows"
];

const PACIFIC_TEAMS: TeamId[] = ["hawks", "lions", "fighters", "buffaloes", "eagles", "marines"];
const CENTRAL_TEAMS: TeamId[] = ["giants", "tigers", "dragons", "baystars", "carp", "swallows"];

export const PlayerListScreen = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('batter');
  const [selectedTeam, setSelectedTeam] = useState<TeamId | 'all' | 'central' | 'pacific'>('all');
  const [sortField, setSortField] = useState<string>('average'); // Default sort
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showRegulationOnly, setShowRegulationOnly] = useState(false);
  const [showRookieOnly, setShowRookieOnly] = useState(false);
  const [showRookieEligibleOnly, setShowRookieEligibleOnly] = useState(false);
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
      // Set default sort based on initial view mode
      // setSortField('average'); // Keep user selected sort
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
      setSortOrder('desc'); // Default to desc for stats usually
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

    // 3. Filter by Regulation
    if (showRegulationOnly) {
      const teamGameCounts = new Map();
      teams.forEach(t => {
        const games = (t.record?.wins || 0) + (t.record?.losses || 0) + (t.record?.draws || 0);
        teamGameCounts.set(t.id, games);
      });

      result = result.filter(p => {
        const teamGames = teamGameCounts.get(p.team) || 0;
        if (teamGames === 0) return true; // No games played yet

        if (viewMode === 'pitcher') {
           // Regulation Innings = Team Games * 1.0
           return (p.stats?.inningsPitched || 0) >= teamGames;
        } else {
           // Regulation Plate Appearances = Team Games * 3.1
           return (p.stats?.plateAppearances || 0) >= (teamGames * 3.1);
        }
      });
    }

    // 4. Filter by Rookie Only
    if (showRookieOnly) {
      result = result.filter(p => p.experienceYears === 1);
    }

    // 5. Filter by Rookie Eligible Only
    if (showRookieEligibleOnly) {
      result = result.filter(p => p.isRookieEligible === true);
    }

    // 6. Sort
    result = [...result].sort((a, b) => {
      let valA: any;
      let valB: any;

      // Handle nested stats object
      if (sortField === 'name') {
        valA = a.name;
        valB = b.name;
      } else if (sortField === 'age') {
        valA = a.age || 0;
        valB = b.age || 0;
      } else if (sortField === 'team') {
        valA = a.team;
        valB = b.team;
      } else if (sortField === 'position') {
        valA = a.position;
        valB = b.position;
      } else {
        // Assume stats field
        valA = (a.stats as any)?.[sortField] || 0;
        valB = (b.stats as any)?.[sortField] || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [players, teams, viewMode, selectedTeam, sortField, sortOrder, showRegulationOnly, showRookieOnly, showRookieEligibleOnly]);

  const renderHeaderCell = (label: string, field: string, width: number) => (
    <TouchableOpacity 
      style={[styles.headerCell, { width }]} 
      onPress={() => handleSort(field)}
    >
      <Text style={[
        styles.headerText, 
        sortField === field && styles.activeSortText
      ]}>
        {label} {sortField === field ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
      </Text>
    </TouchableOpacity>
  );

  const renderBatterHeader = () => (
    <View style={styles.headerRow}>
      {renderHeaderCell('名前', 'name', 120)}
      {renderHeaderCell('年齢', 'age', 50)}
      {renderHeaderCell('球団', 'team', 40)}
      {renderHeaderCell('守備', 'position', 50)}
      {renderHeaderCell('試合', 'gamesPlayed', 50)}
      {renderHeaderCell('打席', 'plateAppearances', 50)}
      {renderHeaderCell('打数', 'atBats', 50)}
      {renderHeaderCell('安打', 'hits', 50)}
      {renderHeaderCell('二塁打', 'doubles', 50)}
      {renderHeaderCell('三塁打', 'triples', 50)}
      {renderHeaderCell('本塁打', 'homeRuns', 50)}
      {renderHeaderCell('打点', 'rbi', 50)}
      {renderHeaderCell('三振', 'batterStrikeouts', 50)}
      {renderHeaderCell('四球', 'walks', 50)}
      {renderHeaderCell('死球', 'hitByPitch', 50)}
      {renderHeaderCell('犠打', 'sacrificeBunts', 50)}
      {renderHeaderCell('犠飛', 'sacrificeFlies', 50)}
      {renderHeaderCell('盗塁', 'stolenBases', 50)}
      {renderHeaderCell('盗塁死', 'caughtStealing', 50)}
      {renderHeaderCell('併殺', 'doublePlays', 50)}
      {renderHeaderCell('失策', 'errors', 50)}
      {renderHeaderCell('打率', 'average', 60)}
      {renderHeaderCell('出塁率', 'obp', 60)}
      {renderHeaderCell('長打率', 'slugging', 60)}
      {renderHeaderCell('OPS', 'ops', 60)} 
      {renderHeaderCell('UZR', 'uzr', 60)}
      {renderHeaderCell('UBR', 'ubr', 60)}
      {renderHeaderCell('WAR', 'war', 60)}
    </View>
  );

  const renderPitcherHeader = () => (
    <View style={styles.headerRow}>
      {renderHeaderCell('名前', 'name', 120)}
      {renderHeaderCell('年齢', 'age', 50)}
      {renderHeaderCell('球団', 'team', 40)}
      {renderHeaderCell('登板', 'gamesPitched', 50)}
      {renderHeaderCell('投球回', 'inningsPitched', 60)}
      {renderHeaderCell('自責点', 'earnedRuns', 50)}
      {renderHeaderCell('被安打', 'pitchingHits', 50)}
      {renderHeaderCell('被本塁打', 'pitchingHomeRuns', 60)}
      {renderHeaderCell('奪三振', 'strikeOuts', 50)}
      {renderHeaderCell('与四球', 'pitchingWalks', 50)}
      {renderHeaderCell('与死球', 'pitchingHitByPitch', 50)}
      {renderHeaderCell('完投', 'completeGames', 50)}
      {renderHeaderCell('完封', 'shutouts', 50)}
      {renderHeaderCell('勝', 'wins', 50)}
      {renderHeaderCell('敗', 'losses', 50)}
      {renderHeaderCell('セーブ', 'saves', 50)}
      {renderHeaderCell('先発', 'gamesStarted', 50)}
      {renderHeaderCell('QS', 'qualityStarts', 50)}
      {renderHeaderCell('防御率', 'era', 60)}
      {renderHeaderCell('奪三振率', 'k9', 60)}
      {renderHeaderCell('与四球率', 'bb9', 60)}
      {renderHeaderCell('WHIP', 'whip', 60)}
      {renderHeaderCell('WAR', 'war', 60)}
    </View>
  );

  const renderBatterRow = ({ item }: { item: Player }) => (
    <TouchableOpacity 
      style={styles.row} 
      onPress={() => (navigation as any).navigate('PlayerDetail', { player: item })}
    >
      <Text style={[styles.cell, { width: 120 }]} numberOfLines={1}>{item.name}</Text>
      <Text style={[styles.cell, { width: 50 }]}>{item.age || 0}</Text>
      <Text style={[styles.cell, { width: 40, fontWeight: 'bold' }]}>{item.team ? (TEAM_ABBREVIATIONS[item.team] || item.team.toUpperCase()) : ''}</Text>
      <Text style={[styles.cell, { width: 50 }]}>{item.position}</Text>
      <Text style={[styles.cell, { width: 50 }]}>{item.stats?.gamesPlayed || 0}</Text>
      <Text style={[styles.cell, { width: 50 }]}>{item.stats?.plateAppearances || 0}</Text>
      <Text style={[styles.cell, { width: 50 }]}>{item.stats?.atBats || 0}</Text>
      <Text style={[styles.cell, { width: 50 }]}>{item.stats?.hits || 0}</Text>
      <Text style={[styles.cell, { width: 50 }]}>{item.stats?.doubles || 0}</Text>
      <Text style={[styles.cell, { width: 50 }]}>{item.stats?.triples || 0}</Text>
      <Text style={[styles.cell, { width: 50 }]}>{item.stats?.homeRuns || 0}</Text>
      <Text style={[styles.cell, { width: 50 }]}>{item.stats?.rbi || 0}</Text>
      <Text style={[styles.cell, { width: 50 }]}>{item.stats?.batterStrikeouts || item.stats?.strikeOuts || 0}</Text>
      <Text style={[styles.cell, { width: 50 }]}>{item.stats?.walks || 0}</Text>
      <Text style={[styles.cell, { width: 50 }]}>{item.stats?.hitByPitch || 0}</Text>
      <Text style={[styles.cell, { width: 50 }]}>{item.stats?.sacrificeBunts || 0}</Text>
      <Text style={[styles.cell, { width: 50 }]}>{item.stats?.sacrificeFlies || 0}</Text>
      <Text style={[styles.cell, { width: 50 }]}>{item.stats?.stolenBases || 0}</Text>
      <Text style={[styles.cell, { width: 50 }]}>{item.stats?.caughtStealing || 0}</Text>
      <Text style={[styles.cell, { width: 50 }]}>{item.stats?.doublePlays || 0}</Text>
      <Text style={[styles.cell, { width: 50 }]}>{item.stats?.errors || 0}</Text>
      <Text style={[styles.cell, { width: 60 }]}>{item.stats?.average?.toFixed(3)}</Text>
      <Text style={[styles.cell, { width: 60 }]}>{item.stats?.obp?.toFixed(3)}</Text>
      <Text style={[styles.cell, { width: 60 }]}>{item.stats?.slugging?.toFixed(3)}</Text>
      <Text style={[styles.cell, { width: 60 }]}>{item.stats?.ops?.toFixed(3)}</Text>
      <Text style={[styles.cell, { width: 60 }]}>{item.stats?.uzr?.toFixed(2) || 0}</Text>
      <Text style={[styles.cell, { width: 60 }]}>{item.stats?.ubr?.toFixed(2) || 0}</Text>
      <Text style={[styles.cell, { width: 60 }]}>{item.stats?.war?.toFixed(2) || 0}</Text>
    </TouchableOpacity>
  );

  const renderPitcherRow = ({ item }: { item: Player }) => {
    const formatInnings = (innings: number) => {
      const rounded = Math.round(innings * 3) / 3;
      const integerPart = Math.floor(rounded);
      const decimalPart = rounded - integerPart;
      if (decimalPart > 0.6) return `${integerPart > 0 ? integerPart + ' ' : ''}2/3`;
      if (decimalPart > 0.3) return `${integerPart > 0 ? integerPart + ' ' : ''}1/3`;
      return integerPart.toString();
    };

    return (
      <TouchableOpacity 
        style={styles.row}
        onPress={() => (navigation as any).navigate('PlayerDetail', { player: item })}
      >
        <Text style={[styles.cell, { width: 120 }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.cell, { width: 50 }]}>{item.age || 0}</Text>
        <Text style={[styles.cell, { width: 40, fontWeight: 'bold' }]}>{item.team ? (TEAM_ABBREVIATIONS[item.team] || item.team.toUpperCase()) : ''}</Text>
        <Text style={[styles.cell, { width: 50 }]}>{item.stats?.gamesPitched || 0}</Text>
        <Text style={[styles.cell, { width: 60 }]}>{formatInnings(item.stats?.inningsPitched || 0)}</Text>
        <Text style={[styles.cell, { width: 50 }]}>{item.stats?.earnedRuns || 0}</Text>
        <Text style={[styles.cell, { width: 50 }]}>{item.stats?.pitchingHits || 0}</Text>
        <Text style={[styles.cell, { width: 60 }]}>{item.stats?.pitchingHomeRuns || 0}</Text>
        <Text style={[styles.cell, { width: 50 }]}>{item.stats?.strikeOuts || 0}</Text>
        <Text style={[styles.cell, { width: 50 }]}>{item.stats?.pitchingWalks || 0}</Text>
        <Text style={[styles.cell, { width: 50 }]}>{item.stats?.pitchingHitByPitch || 0}</Text>
        <Text style={[styles.cell, { width: 50 }]}>{item.stats?.completeGames || 0}</Text>
        <Text style={[styles.cell, { width: 50 }]}>{item.stats?.shutouts || 0}</Text>
        <Text style={[styles.cell, { width: 50 }]}>{item.stats?.wins || 0}</Text>
        <Text style={[styles.cell, { width: 50 }]}>{item.stats?.losses || 0}</Text>
        <Text style={[styles.cell, { width: 50 }]}>{item.stats?.saves || 0}</Text>
        <Text style={[styles.cell, { width: 50 }]}>{item.stats?.gamesStarted || 0}</Text>
        <Text style={[styles.cell, { width: 50 }]}>{item.stats?.qualityStarts || 0}</Text>
        <Text style={[styles.cell, { width: 60 }]}>{item.stats?.era?.toFixed(2)}</Text>
        <Text style={[styles.cell, { width: 60 }]}>{item.stats?.k9?.toFixed(2) || 0}</Text>
        <Text style={[styles.cell, { width: 60 }]}>{item.stats?.bb9?.toFixed(2) || 0}</Text>
        <Text style={[styles.cell, { width: 60 }]}>{item.stats?.whip?.toFixed(2) || 0}</Text>
        <Text style={[styles.cell, { width: 60 }]}>{item.stats?.war?.toFixed(2) || 0}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
            style={styles.abilityLinkButton}
            onPress={() => navigation.navigate('PlayerAbility' as never)}
        >
            <Text style={styles.abilityLinkText}>能力一覧を表示 ➡</Text>
        </TouchableOpacity>

        <View style={styles.modeSwitch}>
          <TouchableOpacity 
            style={[styles.modeButton, viewMode === 'batter' && styles.activeModeButton]}
            onPress={() => { setViewMode('batter'); setSortField('average'); }}
          >
            <Text style={[styles.modeText, viewMode === 'batter' && styles.activeModeText]}>野手</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modeButton, viewMode === 'pitcher' && styles.activeModeButton]}
            onPress={() => { setViewMode('pitcher'); setSortField('era'); setSortOrder('asc'); }}
          >
            <Text style={[styles.modeText, viewMode === 'pitcher' && styles.activeModeText]}>投手</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teamFilter}>
          <TouchableOpacity 
            style={[styles.teamButton, selectedTeam === 'all' && styles.activeTeamButton]}
            onPress={() => setSelectedTeam('all')}
          >
            <Text style={[styles.teamText, selectedTeam === 'all' && styles.activeTeamText]}>全</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.teamButton, selectedTeam === 'central' && styles.activeTeamButton]}
            onPress={() => setSelectedTeam('central')}
          >
            <Text style={[styles.teamText, selectedTeam === 'central' && styles.activeTeamText]}>セ</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.teamButton, selectedTeam === 'pacific' && styles.activeTeamButton]}
            onPress={() => setSelectedTeam('pacific')}
          >
            <Text style={[styles.teamText, selectedTeam === 'pacific' && styles.activeTeamText]}>パ</Text>
          </TouchableOpacity>

          {TEAMS.map(team => (
            <TouchableOpacity 
              key={team}
              style={[styles.teamButton, selectedTeam === team && styles.activeTeamButton]}
              onPress={() => setSelectedTeam(team)}
            >
              <Text style={[styles.teamText, selectedTeam === team && styles.activeTeamText]}>
                {TEAM_ABBREVIATIONS[team] || team.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teamFilter}>
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setShowRegulationOnly(!showRegulationOnly)}
          >
            <View style={[styles.checkbox, showRegulationOnly && styles.checkboxChecked]}>
              {showRegulationOnly && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>規定{viewMode === 'batter' ? '打席' : '投球回'}到達のみ</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setShowRookieOnly(!showRookieOnly)}
          >
            <View style={[styles.checkbox, showRookieOnly && styles.checkboxChecked]}>
              {showRookieOnly && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>新人のみ表示</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setShowRookieEligibleOnly(!showRookieEligibleOnly)}
          >
            <View style={[styles.checkbox, showRookieEligibleOnly && styles.checkboxChecked]}>
              {showRookieEligibleOnly && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>新人王資格ありのみ表示</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Table */}
      <ScrollView horizontal>
        <View>
          {viewMode === 'batter' ? renderBatterHeader() : renderPitcherHeader()}
          <FlatList
            data={filteredAndSortedPlayers}
            renderItem={viewMode === 'batter' ? renderBatterRow : renderPitcherRow}
            keyExtractor={(item, index) => item?.id != null ? item.id.toString() : `player-${index}`}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>
      </ScrollView>
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
  abilityLinkButton: {
    backgroundColor: '#FF9800',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  abilityLinkText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  filterContainer: {
    backgroundColor: 'white',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modeSwitch: {
    flexDirection: 'row',
    marginBottom: 10,
    backgroundColor: '#eee',
    borderRadius: 8,
    padding: 2,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  checkboxChecked: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
  },
  activeModeButton: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  modeText: {
    fontWeight: 'bold',
    color: '#666',
  },
  activeModeText: {
    color: '#2196F3',
  },
  teamFilter: {
    flexDirection: 'row',
  },
  teamButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  activeTeamButton: {
    backgroundColor: '#2196F3',
  },
  teamText: {
    fontSize: 12,
    color: '#666',
  },
  activeTeamText: {
    color: 'white',
    fontWeight: 'bold',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  headerCell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#333',
  },
  activeSortText: {
    color: '#2196F3',
  },
  row: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cell: {
    fontSize: 13,
    textAlign: 'center',
    color: '#333',
  },
});
