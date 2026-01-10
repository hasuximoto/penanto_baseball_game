import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Animated, SafeAreaView } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { dbManager } from '../services/databaseManager';
import { Player, TeamId } from '../types';
import { TEAM_ABBREVIATIONS } from '../utils/constants';
import { COLORS, FONTS, SPACING } from '@/utils/theme';
import { Ionicons } from '@expo/vector-icons';

type ViewMode = 'batter' | 'pitcher';
type SortOrder = 'asc' | 'desc';

const TEAMS: TeamId[] = [
  "hawks", "lions", "fighters", "buffaloes", "eagles", "marines",
  "giants", "tigers", "dragons", "baystars", "carp", "swallows"
];

const PACIFIC_TEAMS: TeamId[] = ["hawks", "lions", "fighters", "buffaloes", "eagles", "marines"];
const CENTRAL_TEAMS: TeamId[] = ["giants", "tigers", "dragons", "baystars", "carp", "swallows"];

export const PlayerListScreen = () => {
  const route = useRoute<any>();
  const initialFilter = route.params?.filter;
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('batter');
  const [selectedTeam, setSelectedTeam] = useState<TeamId | 'all' | 'central' | 'pacific' | 'free_agent'>(initialFilter === 'free_agent' ? 'free_agent' : 'all');
  const [sortField, setSortField] = useState<string>('average'); // Default sort
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showRegulationOnly, setShowRegulationOnly] = useState(false);
  const [showRookieOnly, setShowRookieOnly] = useState(false);
  const [showRookieEligibleOnly, setShowRookieEligibleOnly] = useState(false);
  const navigation = useNavigation();
  const scrollX = React.useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      loadPlayers();
    }, [])
  );

  const loadPlayers = async () => {
    try {
      // setLoading(true); // 画面遷移戻り時に再レンダリングされてスクロール位置がリセットされるのを防ぐ
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
        result = result.filter(p => CENTRAL_TEAMS.includes(p.team as TeamId));
      } else if (selectedTeam === 'pacific') {
        result = result.filter(p => PACIFIC_TEAMS.includes(p.team as TeamId));
      } else if (selectedTeam === 'free_agent') {
        result = result.filter(p => p.team === 'free_agent');
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
      } else if (sortField === 'experienceYears') {
        valA = a.experienceYears || 0;
        valB = b.experienceYears || 0;
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

  const renderHeaderCell = (label: string, field: string, width: number) => {
    const isSticky = field === 'name';
    const cellContent = (
      <TouchableOpacity 
        style={[styles.headerCell, { width }, isSticky ? { borderRightWidth: 1, borderRightColor: COLORS.border } : null]} 
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

    if (isSticky) {
      return (
        <Animated.View 
          style={{
            width,
            zIndex: 100,
            backgroundColor: COLORS.card,
            transform: [{ translateX: scrollX }]
          }}
        >
          {cellContent}
        </Animated.View>
      );
    }
    return cellContent;
  };

  const renderBatterHeader = () => (
    <View style={styles.headerRow}>
      {renderHeaderCell('名前', 'name', 120)}
      {renderHeaderCell('年齢', 'age', 50)}
      {renderHeaderCell('年数', 'experienceYears', 40)}
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
      {renderHeaderCell('年数', 'experienceYears', 40)}
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
      <Animated.View style={{
        width: 120,
        zIndex: 100,
        backgroundColor: COLORS.card,
        borderRightWidth: 1,
        borderRightColor: COLORS.border,
        transform: [{ translateX: scrollX }]
      }}>
        <Text style={[styles.cell, { width: 120 }]} numberOfLines={1}>{item.name}</Text>
      </Animated.View>
      <Text style={[styles.cell, { width: 50 }]}>{item.age || 0}</Text>
      <Text style={[styles.cell, { width: 40 }]}>{item.experienceYears || 0}</Text>
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
        <Animated.View style={{
          width: 120,
          zIndex: 100,
          backgroundColor: COLORS.card,
          borderRightWidth: 1,
          borderRightColor: COLORS.border,
          transform: [{ translateX: scrollX }]
        }}>
          <Text style={[styles.cell, { width: 120 }]} numberOfLines={1}>{item.name}</Text>
        </Animated.View>
        <Text style={[styles.cell, { width: 50 }]}>{item.age || 0}</Text>
        <Text style={[styles.cell, { width: 40 }]}>{item.experienceYears || 0}</Text>
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
        <ActivityIndicator size="large" color={COLORS.primary} />
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
          <TouchableOpacity 
            style={[styles.teamButton, selectedTeam === 'free_agent' && styles.activeTeamButton]}
            onPress={() => setSelectedTeam('free_agent')}
          >
            <Text style={[styles.teamText, selectedTeam === 'free_agent' && styles.activeTeamText]}>FA</Text>
          </TouchableOpacity>
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
      <Animated.ScrollView 
        horizontal 
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <View>
          {viewMode === 'batter' ? renderBatterHeader() : renderPitcherHeader()}
          <FlatList
            data={filteredAndSortedPlayers}
            renderItem={viewMode === 'batter' ? renderBatterRow : renderPitcherRow}
            keyExtractor={(item, index) => item?.id != null ? item.id.toString() : `player-${index}`}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>
      </Animated.ScrollView>
    </View>
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
  abilityLinkButton: {
    backgroundColor: COLORS.card,
    padding: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  abilityLinkText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  filterContainer: {
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modeSwitch: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    marginRight: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  activeModeButton: {
    backgroundColor: COLORS.primary,
  },
  modeText: {
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  activeModeText: {
    color: COLORS.background,
    fontWeight: 'bold',
  },
  teamFilter: {
    flexDirection: 'row',
  },
  teamButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeTeamButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  teamText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  activeTeamText: {
    color: COLORS.background,
    fontWeight: 'bold',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerCell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: COLORS.textMuted,
  },
  activeSortText: {
    color: COLORS.primary,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cell: {
    fontSize: 13,
    textAlign: 'center',
    color: COLORS.textPrimary,
  },
});
