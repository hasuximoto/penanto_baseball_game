import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { dbManager } from '../services/databaseManager';
import { NewsItem } from '../types';
import { getGameDateString } from '../utils/dateUtils';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING } from '@/utils/theme';

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
      <View style={styles.cardHeader}>
        <View style={styles.typeContainer}>
          <Text style={[styles.type, item.type === 'roster_move' ? styles.rosterType : styles.defaultType]}>
            {item.type === 'roster_move' ? 'TEAM' : 'NEWS'}
          </Text>
        </View>
        <Text style={styles.date}>{getGameDateString(item.date, currentSeason)}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.content} numberOfLines={2}>{item.content}</Text>
      </View>
      <View style={styles.cardFooter}>
          <Text style={styles.readMore}>詳細を見る {'>'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
          <Text style={styles.screenTitle}>ニュース一覧</Text>
      </View>
      <View style={styles.container}>
        <FlatList
          data={news}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchNews} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>現在ニュースはありません</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
      paddingHorizontal: SPACING.md,
      paddingTop: SPACING.sm,
      paddingBottom: SPACING.sm,
      backgroundColor: COLORS.background,
  },
  screenTitle: {
      fontSize: 24,
      fontWeight: '900',
      color: COLORS.textPrimary,
      letterSpacing: 1,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
      padding: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.card,
    marginBottom: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  date: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  typeContainer: {
      flexDirection: 'row',
  },
  type: {
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rosterType: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)', // Gold tint
    color: COLORS.primary,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  defaultType: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: COLORS.textSecondary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardBody: {
      padding: SPACING.md,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  content: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  cardFooter: {
      paddingHorizontal: SPACING.md,
      paddingBottom: SPACING.md,
      alignItems: 'flex-end',
  },
  readMore: {
      color: COLORS.primary,
      fontSize: 12,
      fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
});
