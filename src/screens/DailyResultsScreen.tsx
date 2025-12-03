import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { GameResult } from '../types';

export const DailyResultsScreen = ({ route, navigation }: any) => {
  const { results } = route.params;

  const renderItem = ({ item }: { item: GameResult }) => (
    <TouchableOpacity
      style={styles.gameContainer}
      onPress={() => navigation.navigate('BoxScore', { gameResult: item })}
    >
      <View style={styles.teamRow}>
        <Text style={styles.teamName}>{item.homeTeam.toUpperCase()}</Text>
        <Text style={styles.score}>{item.homeScore}</Text>
      </View>
      <View style={styles.teamRow}>
        <Text style={styles.teamName}>{item.awayTeam.toUpperCase()}</Text>
        <Text style={styles.score}>{item.awayScore}</Text>
      </View>
      <Text style={styles.status}>Final</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today's Games</Text>
      <FlatList
        data={results}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  gameContainer: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '500',
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  status: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
});
