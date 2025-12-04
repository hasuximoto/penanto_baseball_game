import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { dbManager } from '../services/databaseManager';
import { Title, Team, Player } from '../types';
import { useNavigation } from '@react-navigation/native';
import { TEAM_ABBREVIATIONS } from '../utils/constants';

export const TitleHistoryScreen = () => {
  const navigation = useNavigation();
  const [year, setYear] = useState<number | null>(null);
  const [titles, setTitles] = useState<Title[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'batting' | 'pitching' | 'award'>('batting');

  useEffect(() => {
    const initializeYear = async () => {
      try {
        const gameState = await dbManager.loadGameState();
        if (gameState && gameState.season) {
          setYear(gameState.season);
        } else {
          setYear(2026);
        }
      } catch (error) {
        console.error('Failed to load game state:', error);
        setYear(2026);
      }
    };
    initializeYear();
  }, []);

  useEffect(() => {
    if (year !== null) {
      loadData();
    }
  }, [year]);

  const loadData = async () => {
    if (year === null) return;
    setLoading(true);
    try {
      const [loadedTitles, loadedTeams, loadedPlayers] = await Promise.all([
        dbManager.getTitlesByYear(year),
        dbManager.getInitialTeams(),
        dbManager.getInitialPlayers()
      ]);
      setTitles(loadedTitles);
      setTeams(loadedTeams);
      setPlayers(loadedPlayers);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getPlayerName = (id: number | string) => {
    const player = players.find(p => p.id === id);
    return player ? player.name : 'Unknown';
  };

  const getTeamName = (id: string) => {
    return TEAM_ABBREVIATIONS[id] || id.substring(0, 1).toUpperCase();
  };

  const renderTitleRow = (title: Title) => (
    <View key={title.id} style={styles.row}>
      <View style={styles.titleNameContainer}>
        <Text style={styles.titleName}>【{title.name}】</Text>
      </View>
      <View style={styles.playerInfo}>
        <Text style={styles.teamName}>{getTeamName(title.teamId)}</Text>
        <Text style={styles.playerName}>{getPlayerName(title.playerId)}</Text>
        <Text style={styles.value}>{title.value}</Text>
      </View>
    </View>
  );

  const renderLeagueSection = (league: 'central' | 'pacific') => {
    const leagueTitles = titles.filter(t => t.league === league && t.category === activeTab);
    // Define order of titles if needed
    let order: string[] = [];
    if (activeTab === 'batting') {
      order = ['首位打者', '本塁打王', '打点王', '盗塁王', '最多安打', '最高出塁率'];
    } else if (activeTab === 'pitching') {
      order = ['最多勝', '最優秀防御率', '最多奪三振', '最多セーブ', '最高勝率'];
    } else {
      order = ['MVP', '新人王', 'ベストナイン(投手)', 'ベストナイン(捕手)', 'ベストナイン(一塁手)', 'ベストナイン(二塁手)', 'ベストナイン(三塁手)', 'ベストナイン(遊撃手)', 'ベストナイン(外野手)', 'ベストナイン(指名打者)', 'ゴールデングラブ賞(投手)', 'ゴールデングラブ賞(捕手)', 'ゴールデングラブ賞(一塁手)', 'ゴールデングラブ賞(二塁手)', 'ゴールデングラブ賞(三塁手)', 'ゴールデングラブ賞(遊撃手)', 'ゴールデングラブ賞(外野手)'];
    }
    
    // Sort titles based on predefined order
    leagueTitles.sort((a, b) => {
        const indexA = order.indexOf(a.name);
        const indexB = order.indexOf(b.name);
        
        // If not in order list, put at the end
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        
        return indexA - indexB;
    });

    return (
      <View style={styles.leagueContainer}>
        <Text style={styles.leagueHeader}>{league === 'central' ? 'セ・リーグ' : 'パ・リーグ'}</Text>
        {leagueTitles.map(renderTitleRow)}
        {leagueTitles.length === 0 && <Text style={styles.noData}>データなし</Text>}
      </View>
    );
  };

  if (year === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setYear(year - 1)} style={styles.yearButton}>
          <Text style={styles.yearButtonText}>{'<< 前年'}</Text>
        </TouchableOpacity>
        <Text style={styles.yearText}>{year}年</Text>
        <TouchableOpacity onPress={() => setYear(year + 1)} style={styles.yearButton}>
          <Text style={styles.yearButtonText}>{'翌年 >>'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'batting' && styles.activeTab]} 
          onPress={() => setActiveTab('batting')}
        >
          <Text style={[styles.tabText, activeTab === 'batting' && styles.activeTabText]}>打撃部門</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'pitching' && styles.activeTab]} 
          onPress={() => setActiveTab('pitching')}
        >
          <Text style={[styles.tabText, activeTab === 'pitching' && styles.activeTabText]}>投手部門</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'award' && styles.activeTab]} 
          onPress={() => setActiveTab('award')}
        >
          <Text style={[styles.tabText, activeTab === 'award' && styles.activeTabText]}>表彰・その他</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.leaguesRow}>
            {renderLeagueSection('central')}
            {renderLeagueSection('pacific')}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#333',
  },
  yearText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 20,
  },
  yearButton: {
    padding: 10,
  },
  yearButtonText: {
    color: 'white',
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#ddd',
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#d4af37', // Gold color
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#000',
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 50,
  },
  content: {
    flex: 1,
  },
  leaguesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leagueContainer: {
    flex: 1,
    margin: 5,
    backgroundColor: '#fff',
    borderRadius: 5,
    overflow: 'hidden',
  },
  leagueHeader: {
    backgroundColor: '#000',
    color: '#fff',
    textAlign: 'center',
    padding: 5,
    fontWeight: 'bold',
  },
  row: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  titleNameContainer: {
    marginBottom: 5,
  },
  titleName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamName: {
    fontSize: 14,
    color: '#333',
    marginRight: 5,
    width: 30,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  playerName: {
    fontSize: 16,
    flex: 1,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  noData: {
    padding: 20,
    textAlign: 'center',
    color: '#999',
  },
});
