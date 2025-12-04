import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { GameResult, PlayerGameStats } from '../types';

export const BoxScoreScreen = ({ route }: any) => {
  const { gameResult } = route.params as { gameResult: GameResult };
  const [tab, setTab] = useState<'home' | 'away'>('home');

  const details = gameResult.details;
  if (!details) return (
    <View style={styles.container}>
      <Text>No details available for this game.</Text>
    </View>
  );

  const batting = tab === 'home' ? details.homeBatting : details.awayBatting;
  const pitching = tab === 'home' ? details.homePitching : details.awayPitching;
  const teamId = tab === 'home' ? gameResult.homeTeam : gameResult.awayTeam;

  // Sort by order. Players without order (bench) go to the end.
  const sortedBatting = [...batting].sort((a, b) => {
    if (a.order && b.order) {
      if (a.order !== b.order) return a.order - b.order;
      // Same order: Starter first
      if (a.isStarter && !b.isStarter) return -1;
      if (!a.isStarter && b.isStarter) return 1;
      return 0;
    }
    if (a.order) return -1;
    if (b.order) return 1;
    return 0;
  });

  // Sort pitching by appearance order
  const sortedPitching = [...pitching].sort((a, b) => {
    if (a.pitchingOrder && b.pitchingOrder) return a.pitchingOrder - b.pitchingOrder;
    if (a.pitchingOrder) return -1;
    if (b.pitchingOrder) return 1;
    return 0;
  });

  // Calculate Totals
  const totalHits = batting.reduce((sum, p) => sum + p.hits, 0);
  const totalRuns = batting.reduce((sum, p) => sum + p.runs, 0);
  const totalHR = batting.reduce((sum, p) => sum + p.homeRuns, 0);
  const totalRBI = batting.reduce((sum, p) => sum + p.rbi, 0);

  // Calculate Team Totals for Header
  const homeHits = details.homeBatting.reduce((sum, p) => sum + p.hits, 0);
  const awayHits = details.awayBatting.reduce((sum, p) => sum + p.hits, 0);
  const homeErrors = 0; // Not tracked yet
  const awayErrors = 0; // Not tracked yet

  const formatInnings = (innings: number) => {
    // 浮動小数点数の誤差を補正 (例: 8.991 -> 9.0, 0.333 -> 1/3)
    // 3倍して四捨五入することで、1/3単位に丸める
    const rounded = Math.round(innings * 3) / 3;
    
    const integerPart = Math.floor(rounded);
    const decimalPart = rounded - integerPart;
    
    // 誤差を考慮して判定 (1/3 = 0.333..., 2/3 = 0.666...)
    if (decimalPart > 0.6) return `${integerPart > 0 ? integerPart + ' ' : ''}2/3`;
    if (decimalPart > 0.3) return `${integerPart > 0 ? integerPart + ' ' : ''}1/3`;
    return integerPart.toString();
  };

  const renderLineScore = () => {
    if (!gameResult.lineScore) return null;

    const { home, away } = gameResult.lineScore;
    const innings = Math.max(home.length, away.length, 9);
    const inningHeaders = Array.from({ length: innings }, (_, i) => i + 1);

    return (
      <View style={styles.lineScoreContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Header Row */}
            <View style={styles.lineScoreRow}>
              <Text style={[styles.lineScoreTeam, styles.lineScoreHeader]}>Team</Text>
              {inningHeaders.map(i => (
                <Text key={i} style={[styles.lineScoreCell, styles.lineScoreHeader]}>{i}</Text>
              ))}
              <Text style={[styles.lineScoreTotal, styles.lineScoreHeader]}>R</Text>
              <Text style={[styles.lineScoreTotal, styles.lineScoreHeader]}>H</Text>
              <Text style={[styles.lineScoreTotal, styles.lineScoreHeader]}>E</Text>
            </View>

            {/* Away Team Row */}
            <View style={styles.lineScoreRow}>
              <Text style={styles.lineScoreTeam}>{gameResult.awayTeam.toUpperCase()}</Text>
              {inningHeaders.map((_, i) => (
                <Text key={i} style={styles.lineScoreCell}>
                  {away[i] !== undefined ? away[i] : ''}
                </Text>
              ))}
              <Text style={[styles.lineScoreTotal, styles.bold]}>{gameResult.awayScore}</Text>
              <Text style={styles.lineScoreTotal}>{awayHits}</Text>
              <Text style={styles.lineScoreTotal}>{awayErrors}</Text>
            </View>

            {/* Home Team Row */}
            <View style={styles.lineScoreRow}>
              <Text style={styles.lineScoreTeam}>{gameResult.homeTeam.toUpperCase()}</Text>
              {inningHeaders.map((_, i) => (
                <Text key={i} style={styles.lineScoreCell}>
                  {home[i] !== undefined ? (home[i] === -1 ? 'X' : home[i]) : ''}
                </Text>
              ))}
              <Text style={[styles.lineScoreTotal, styles.bold]}>{gameResult.homeScore}</Text>
              <Text style={styles.lineScoreTotal}>{homeHits}</Text>
              <Text style={styles.lineScoreTotal}>{homeErrors}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.scoreHeader}>
          {gameResult.awayTeam.toUpperCase()} {gameResult.awayScore} - {gameResult.homeScore} {gameResult.homeTeam.toUpperCase()}
        </Text>
        <Text style={styles.dateText}>
          Season {gameResult.season} - Day {gameResult.date}
        </Text>
      </View>

      {renderLineScore()}
      
      <View style={styles.tabs}>
        <TouchableOpacity 
          onPress={() => setTab('home')} 
          style={[styles.tab, tab === 'home' && styles.activeTab]}
        >
          <Text style={[styles.tabText, tab === 'home' && styles.activeTabText]}>
            {gameResult.homeTeam.toUpperCase()}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setTab('away')} 
          style={[styles.tab, tab === 'away' && styles.activeTab]}
        >
          <Text style={[styles.tabText, tab === 'away' && styles.activeTabText]}>
            {gameResult.awayTeam.toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Batting</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            <View style={styles.tableHeader}>
              <Text style={[styles.colOrder, styles.headerText]}>Ord</Text>
              <Text style={[styles.colName, styles.headerText]}>Name</Text>
              <Text style={[styles.colPos, styles.headerText]}>Pos</Text>
              <Text style={[styles.colStat, styles.headerText]}>AB</Text>
              <Text style={[styles.colStat, styles.headerText]}>R</Text>
              <Text style={[styles.colStat, styles.headerText]}>H</Text>
              <Text style={[styles.colStat, styles.headerText]}>HR</Text>
              <Text style={[styles.colStat, styles.headerText]}>RBI</Text>
              {Array.from({ length: gameResult.innings }, (_, i) => i + 1).map(inning => (
                <Text key={inning} style={[styles.colInning, styles.headerText]}>{inning}</Text>
              ))}
            </View>
            {sortedBatting.map((p, i) => {
              const isSub = i > 0 && p.order === sortedBatting[i-1].order;
              return (
                <View key={i} style={styles.row}>
                  <Text style={styles.colOrder}>{isSub ? '' : p.order}</Text>
                  <Text style={[styles.colName, isSub && styles.subName]}>
                    {isSub ? ' └ ' : ''}{p.playerName}
                  </Text>
                  <Text style={styles.colPos}>{p.position}</Text>
                  <Text style={styles.colStat}>{p.atBats}</Text>
                  <Text style={styles.colStat}>{p.runs}</Text>
                  <Text style={styles.colStat}>{p.hits}</Text>
                  <Text style={styles.colStat}>{p.homeRuns}</Text>
                  <Text style={styles.colStat}>{p.rbi}</Text>
                  {Array.from({ length: gameResult.innings }, (_, i) => i + 1).map(inning => {
                    const details = p.atBatDetails?.filter(d => d.inning === inning).map(d => d.result).join('\n');
                    return (
                      <Text key={inning} style={styles.colInning}>{details || ''}</Text>
                    );
                  })}
                </View>
              );
            })}
            {/* Totals Row */}
            <View style={[styles.row, styles.totalRow]}>
              <Text style={[styles.colOrder, styles.bold]}></Text>
              <Text style={[styles.colName, styles.bold]}>Totals</Text>
              <Text style={styles.colPos}></Text>
              <Text style={[styles.colStat, styles.bold]}>{batting.reduce((s, p) => s + p.atBats, 0)}</Text>
              <Text style={[styles.colStat, styles.bold]}>{totalRuns}</Text>
              <Text style={[styles.colStat, styles.bold]}>{totalHits}</Text>
              <Text style={[styles.colStat, styles.bold]}>{totalHR}</Text>
              <Text style={[styles.colStat, styles.bold]}>{totalRBI}</Text>
              {Array.from({ length: gameResult.innings }, (_, i) => i + 1).map(inning => (
                <Text key={inning} style={styles.colInning}></Text>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pitching</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.colStat, styles.headerText]}></Text>
          <Text style={[styles.colName, styles.headerText]}>Name</Text>
          <Text style={[styles.colStat, styles.headerText]}>IP</Text>
          <Text style={[styles.colStat, styles.headerText]}>H</Text>
          <Text style={[styles.colStat, styles.headerText]}>ER</Text>
          <Text style={[styles.colStat, styles.headerText]}>K</Text>
          <Text style={[styles.colStat, styles.headerText]}>BB</Text>
        </View>
        {sortedPitching.map((p, i) => {
          let prefix = '';
          if (p.wins) prefix = '(勝) ';
          else if (p.losses) prefix = '(負) ';
          else if (p.saves) prefix = '(S) ';

          return (
            <View key={i} style={styles.row}>
              <Text style={styles.colStat}>{prefix}</Text>
              <Text style={styles.colName}>{p.playerName}</Text>
              <Text style={styles.colStat}>{formatInnings(p.inningsPitched || 0)}</Text>
              <Text style={styles.colStat}>{p.pitchingHits || 0}</Text>
              <Text style={styles.colStat}>{p.earnedRuns}</Text>
              <Text style={styles.colStat}>{p.pitchingStrikeouts}</Text>
              <Text style={styles.colStat}>{p.pitchingWalks}</Text>
            </View>
          );
        })}
         {/* Pitching Totals Row */}
         <View style={[styles.row, styles.totalRow]}>
          <Text style={[styles.colStat, styles.bold]}></Text>
          <Text style={[styles.colName, styles.bold]}>Totals</Text>
          <Text style={[styles.colStat, styles.bold]}>{formatInnings(pitching.reduce((s, p) => s + (p.inningsPitched || 0), 0))}</Text>
          <Text style={[styles.colStat, styles.bold]}>{pitching.reduce((s, p) => s + (p.pitchingHits || 0), 0)}</Text>
          <Text style={[styles.colStat, styles.bold]}>{pitching.reduce((s, p) => s + (p.earnedRuns || 0), 0)}</Text>
          <Text style={[styles.colStat, styles.bold]}>{pitching.reduce((s, p) => s + (p.pitchingStrikeouts || 0), 0)}</Text>
          <Text style={[styles.colStat, styles.bold]}>{pitching.reduce((s, p) => s + (p.pitchingWalks || 0), 0)}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  scoreHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  lineScoreContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  lineScoreRow: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  lineScoreTeam: {
    width: 60,
    fontWeight: 'bold',
  },
  lineScoreCell: {
    width: 25,
    textAlign: 'center',
  },
  lineScoreTotal: {
    width: 30,
    textAlign: 'center',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  lineScoreHeader: {
    color: '#666',
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 5,
  },
  headerText: {
    fontWeight: 'bold',
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: '#ccc',
    marginTop: 5,
    backgroundColor: '#f9f9f9',
  },
  colName: {
    width: 100, // Fixed width for horizontal scroll
    fontSize: 14,
  },
  colOrder: {
    width: 30,
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
  },
  subName: {
    color: '#555',
    fontStyle: 'italic',
  },
  colPos: {
    width: 40,
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
  },
  colStat: {
    width: 35,
    fontSize: 14,
    textAlign: 'center',
  },
  colInning: {
    width: 45,
    fontSize: 12,
    textAlign: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#eee',
  },
  bold: {
    fontWeight: 'bold',
  },
});
