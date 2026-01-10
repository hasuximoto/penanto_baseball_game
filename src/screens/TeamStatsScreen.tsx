import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { dbManager } from '@/services/databaseManager';
import { COLORS, SPACING } from '@/utils/theme';

export const TeamStatsScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [pacificTeams, setPacificTeams] = useState<any[]>([]);
  const [centralTeams, setCentralTeams] = useState<any[]>([]);
  const [teamStats, setTeamStats] = useState<Record<string, any>>({});

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const teams = await dbManager.getInitialTeams();
      const processedTeams = dbManager.calculateStandingsInfo(teams);
      
      setPacificTeams(processedTeams.filter(t => t.league === 'pacific'));
      setCentralTeams(processedTeams.filter(t => t.league === 'central'));

      // 各チームの詳細スタッツを取得
      const statsMap: Record<string, any> = {};
      for (const team of processedTeams) {
        statsMap[team.id] = await dbManager.getTeamDetailedStats(team.id);
      }
      setTeamStats(statsMap);

    } catch (error) {
      console.error('Failed to load team stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderLeagueStats = (title: string, teams: any[]) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={styles.table}>
          <View style={styles.headerRow}>
            <View style={[styles.cellContainer, {width: 100}]}>
                <Text style={styles.headerText}>チーム</Text>
            </View>
            {[
              "試合", "勝", "敗", "分", "勝率", "差",
              "打率", "本塁", "打点", "盗塁", "防率", "得点", "失点"
            ].map(h => (
               <View key={h} style={styles.cellContainer}>
                  <Text style={styles.headerText}>{h}</Text>
               </View>
            ))}
          </View>
          {teams.map((team, index) => {
            const stats = teamStats[team.id] || {};
            const games = (team.record?.wins || 0) + (team.record?.losses || 0) + (team.record?.draws || 0);
            return (
              <View key={team.id} style={[styles.row, index % 2 === 1 && styles.altRow]}>
                <View style={[styles.cellContainer, {width: 100}]}>
                    <Text style={styles.teamNameText}>{team.name}</Text>
                </View>
                
                <View style={styles.cellContainer}><Text style={styles.cellText}>{games}</Text></View>
                <View style={styles.cellContainer}><Text style={styles.cellText}>{team.record?.wins || 0}</Text></View>
                <View style={styles.cellContainer}><Text style={styles.cellText}>{team.record?.losses || 0}</Text></View>
                <View style={styles.cellContainer}><Text style={styles.cellText}>{team.record?.draws || 0}</Text></View>
                <View style={styles.cellContainer}><Text style={[styles.cellText, {color: COLORS.primary}]}>{(team.record?.winPercentage || 0).toFixed(3)}</Text></View>
                <View style={styles.cellContainer}><Text style={styles.cellText}>{team.record?.gamesBack !== undefined && team.record.gamesBack > 0 ? team.record.gamesBack : '-'}</Text></View>
                
                <View style={styles.cellContainer}><Text style={[styles.cellText, (stats.avg || 0) >= 0.3 && styles.highlightText]}>{(stats.avg || 0).toFixed(3)}</Text></View>
                <View style={styles.cellContainer}><Text style={styles.cellText}>{stats.homeRuns || 0}</Text></View>
                <View style={styles.cellContainer}><Text style={styles.cellText}>{stats.rbi || 0}</Text></View>
                <View style={styles.cellContainer}><Text style={styles.cellText}>{stats.stolenBases || 0}</Text></View>
                <View style={styles.cellContainer}><Text style={styles.cellText}>{(stats.era || 0).toFixed(2)}</Text></View>
                <View style={styles.cellContainer}><Text style={styles.cellText}>{stats.runs || 0}</Text></View>
                <View style={styles.cellContainer}><Text style={styles.cellText}>{stats.runsAllowed || 0}</Text></View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.screenTitle}>チーム成績一覧</Text>
        {renderLeagueStats('パ・リーグ', pacificTeams)}
        {renderLeagueStats('セ・リーグ', centralTeams)}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  screenTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: COLORS.textPrimary,
      marginBottom: SPACING.md,
      marginLeft: SPACING.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  card: {
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  cardHeader: {
      padding: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: '#333',
      backgroundColor: '#1E1E1E',
      borderLeftWidth: 4,
      borderLeftColor: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  table: {
      paddingBottom: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  altRow: {
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  cellContainer: {
      width: 55,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 2,
  },
  headerText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },
  cellText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  teamNameText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'left',
    width: '100%',
    paddingLeft: 10,
  },
  highlightText: {
      color: COLORS.primary,
      fontWeight: 'bold',
  },
});
