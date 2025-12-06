import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { Player, Team, TeamId } from '../types';
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

  useEffect(() => {
    loadData();
  }, [teamId]);

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
            currentLineupIds.forEach(id => {
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
        const starters = activePitchers.filter(p => p.pitcherRole === 'starter');
        const relievers = activePitchers.filter(p => p.pitcherRole === 'reliever' || (!p.pitcherRole && p.position === 'P')); // Default to reliever if undefined
        const closers = activePitchers.filter(p => p.pitcherRole === 'closer');

        // If roles are not set yet (e.g. before first Monday), fallback logic could be added here, 
        // but we rely on rosterManager having run or default values.
        // For display purposes, if no roles, maybe just dump all in starters or relievers?
        // The logic above puts undefined roles into relievers.

        setPitchers({
            starters: starters,
            relievers: relievers.filter(p => p.pitcherRole !== 'starter' && p.pitcherRole !== 'closer'), // Re-filter to be safe
            closer: closers
        });

      }
    } catch (error) {
      console.error("Failed to load team order data", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !team) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

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

    return (
      <View style={styles.row} key={player.id}>
        <Text style={[styles.cell, styles.posCell]}>{orderDisplay}</Text>
        <Text style={[styles.cell, styles.posCell]}>{player.position}</Text>
        <Text style={[styles.cell, styles.nameCell, { color: '#0000EE' }]}>{player.name}</Text>
        <Text style={styles.cell}>{avg}</Text>
        <Text style={styles.cell}>{hr}</Text>
        <Text style={styles.cell}>{rbi}</Text>
        <Text style={styles.cell}>{sb}</Text>
        <Text style={styles.cell}>{obp}</Text>
      </View>
    );
  };

  const renderPitcherRow = (player: Player, role: string) => {
    const stats = player.stats || {};
    const g = stats.gamesPitched || 0;
    const ip = stats.inningsPitched ? stats.inningsPitched.toFixed(0) : '0'; // Simplified IP display
    const era = stats.era !== undefined ? stats.era.toFixed(2) : '-.--';
    const wl = `${stats.wins || 0}-${stats.losses || 0}`;
    const so = stats.strikeOuts || 0;

    let roleLabel = '中';
    if (role === 'starter') roleLabel = '先';
    if (role === 'closer') roleLabel = '抑';

    return (
      <View style={styles.row} key={player.id}>
        <Text style={[styles.cell, styles.posCell]}>{roleLabel}</Text>
        <Text style={[styles.cell, styles.nameCell, { color: '#0000EE' }]}>{player.name}</Text>
        <Text style={styles.cell}>{g}</Text>
        <Text style={styles.cell}>{ip}</Text>
        <Text style={styles.cell}>{era}</Text>
        <Text style={styles.cell}>{wl}</Text>
        <Text style={styles.cell}>{so}</Text>
      </View>
    );
  };

  const currentDateStr = formatDateJP(getGameDateString(gameState.currentDate, gameState.season));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.teamInfo}>
            {/* Placeholder for Logo */}
            <View style={[styles.logoPlaceholder, { backgroundColor: teamId === 'lions' ? '#1f366a' : '#ccc' }]}>
                <Text style={styles.logoText}>{team.name.substring(0, 1)}</Text>
            </View>
            <Text style={styles.teamName}>{team.name}</Text>
        </View>
        <Text style={styles.dateText}>{currentDateStr}</Text>
        <View style={styles.headerRight}>
            <Text style={styles.headerTitle}>最新一軍オーダー</Text>
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
                    <Text style={[styles.cell, styles.posCell]}></Text>
                    <Text style={[styles.cell, styles.nameCell]}></Text>
                    <Text style={styles.cell}>G</Text>
                    <Text style={styles.cell}>IP</Text>
                    <Text style={styles.cell}>ERA</Text>
                    <Text style={styles.cell}>W-L</Text>
                    <Text style={styles.cell}>SO</Text>
                </View>
                <ScrollView>
                    {pitchers.starters.map(p => renderPitcherRow(p, 'starter'))}
                    <View style={styles.divider} />
                    {pitchers.relievers.map(p => renderPitcherRow(p, 'reliever'))}
                    {pitchers.closer.map(p => renderPitcherRow(p, 'closer'))}
                </ScrollView>
            </View>
        )}
      </View>
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
});
