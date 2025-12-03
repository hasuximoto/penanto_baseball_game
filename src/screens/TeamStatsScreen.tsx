import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { dbManager } from '@/services/databaseManager';

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
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView horizontal>
        <View>
          <View style={styles.headerRow}>
            <Text style={[styles.cell, styles.teamNameCell]}>チーム</Text>
            <Text style={styles.cell}>試合</Text>
            <Text style={styles.cell}>勝</Text>
            <Text style={styles.cell}>敗</Text>
            <Text style={styles.cell}>分</Text>
            <Text style={styles.cell}>勝率</Text>
            <Text style={styles.cell}>差</Text>
            <Text style={styles.cell}>打率</Text>
            <Text style={styles.cell}>本塁</Text>
            <Text style={styles.cell}>打点</Text>
            <Text style={styles.cell}>盗塁</Text>
            <Text style={styles.cell}>防率</Text>
            <Text style={styles.cell}>得点</Text>
            <Text style={styles.cell}>失点</Text>
          </View>
          {teams.map((team) => {
            const stats = teamStats[team.id] || {};
            const games = (team.record?.wins || 0) + (team.record?.losses || 0) + (team.record?.draws || 0);
            return (
              <View key={team.id} style={styles.row}>
                <Text style={[styles.cell, styles.teamNameCell]}>{team.name}</Text>
                <Text style={styles.cell}>{games}</Text>
                <Text style={styles.cell}>{team.record?.wins || 0}</Text>
                <Text style={styles.cell}>{team.record?.losses || 0}</Text>
                <Text style={styles.cell}>{team.record?.draws || 0}</Text>
                <Text style={styles.cell}>{(team.record?.winPercentage || 0).toFixed(3)}</Text>
                <Text style={styles.cell}>{team.record?.gamesBack !== undefined && team.record.gamesBack > 0 ? team.record.gamesBack : '-'}</Text>
                <Text style={styles.cell}>{(stats.avg || 0).toFixed(3)}</Text>
                <Text style={styles.cell}>{stats.homeRuns || 0}</Text>
                <Text style={styles.cell}>{stats.rbi || 0}</Text>
                <Text style={styles.cell}>{stats.stolenBases || 0}</Text>
                <Text style={styles.cell}>{(stats.era || 0).toFixed(2)}</Text>
                <Text style={styles.cell}>{stats.runs || 0}</Text>
                <Text style={styles.cell}>{stats.runsAllowed || 0}</Text>
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
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {renderLeagueStats('パ・リーグ', pacificTeams)}
      {renderLeagueStats('セ・リーグ', centralTeams)}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cell: {
    width: 50,
    textAlign: 'center',
    fontSize: 12,
    color: '#333',
  },
  teamNameCell: {
    width: 100,
    textAlign: 'left',
    fontWeight: 'bold',
  },
});
