import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NewsItem } from '../types';
import { getGameDateString } from '../utils/dateUtils';

export const NewsDetailScreen = ({ route }: any) => {
  const { newsItem, season } = route.params as { newsItem: NewsItem, season?: number };
  const dateStr = getGameDateString(newsItem.date, season);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.date}>{dateStr}</Text>
        <Text style={[styles.type, newsItem.type === 'roster_move' ? styles.rosterType : styles.defaultType]}>
          {newsItem.type === 'roster_move' ? '公示' : 'News'}
        </Text>
      </View>
      <Text style={styles.title}>{newsItem.title}</Text>
      <View style={styles.divider} />
      <Text style={styles.content}>{newsItem.content}</Text>
      
      {/* Additional details can be added here if NewsItem structure expands */}
      {newsItem.affectedTeams && newsItem.affectedTeams.length > 0 && (
        <View style={styles.metaContainer}>
          <Text style={styles.metaLabel}>関連チーム:</Text>
          <Text style={styles.metaValue}>{newsItem.affectedTeams.join(', ').toUpperCase()}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  type: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    lineHeight: 30,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginBottom: 20,
  },
  content: {
    fontSize: 16,
    color: '#444',
    lineHeight: 26,
    marginBottom: 30,
  },
  metaContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  metaLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
  },
  metaValue: {
    fontSize: 16,
    color: '#333',
  },
});
