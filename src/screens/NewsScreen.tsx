import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { dbManager } from '../services/databaseManager';
import { NewsItem } from '../types';
import { getGameDateString } from '../utils/dateUtils';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export const NewsScreen = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const currentSeason = useSelector((state: RootState) => state.game.season);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const data = await dbManager.getNews();
      // Sort by date descending (newest first)
      const sorted = data.sort((a, b) => b.date - a.date);
      setNews(sorted);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNews();
    }, [])
  );

  const renderItem = ({ item }: { item: NewsItem }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => (navigation as any).navigate('NewsDetail', { newsItem: item, season: currentSeason })}
    >
      <View style={styles.header}>
        <Text style={styles.date}>{getGameDateString(item.date, currentSeason)}</Text>
        <Text style={[styles.type, item.type === 'roster_move' ? styles.rosterType : styles.defaultType]}>
          {item.type === 'roster_move' ? '公示' : 'News'}
        </Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.content} numberOfLines={2}>{item.content}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={news}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchNews} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No news available.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginVertical: 5,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  date: {
    fontSize: 12,
    color: '#888',
  },
  type: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  rosterType: {
    backgroundColor: '#E3F2FD',
    color: '#1976D2',
  },
  defaultType: {
    backgroundColor: '#EEEEEE',
    color: '#616161',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  content: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
});
