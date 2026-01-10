import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { GameResult } from '../types';
import { COLORS, FONTS, SPACING } from '@/utils/theme';
import { Ionicons } from '@expo/vector-icons';

export const DailyResultsScreen = ({ route, navigation }: any) => {
  const { results } = route.params;

  const renderItem = ({ item }: { item: GameResult }) => (
    <TouchableOpacity
      style={styles.gameContainer}
      onPress={() => navigation.navigate('BoxScore', { gameResult: item })}
    >
      <View style={styles.matchupContainer}>
          <View style={styles.teamColumn}>
              <Text style={styles.teamName}>{item.homeTeam.toUpperCase()}</Text>
              <Text style={styles.score}>{item.homeScore}</Text>
          </View>
          <View style={styles.divider}>
              <Text style={styles.vsText}>-</Text>
          </View>
          <View style={styles.teamColumn}>
              <Text style={styles.teamName}>{item.awayTeam.toUpperCase()}</Text>
              <Text style={styles.score}>{item.awayScore}</Text>
          </View>
      </View>
      <View style={styles.footer}>
          <Text style={styles.status}>試合終了</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={results}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textMain,
    fontFamily: FONTS.bold,
  },
  listContent: {
    padding: SPACING.md,
  },
  gameContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  matchupContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.sm,
  },
  teamColumn: {
      alignItems: 'center',
      flex: 1,
  },
  divider: {
      width: 20,
      alignItems: 'center',
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textMain,
    fontFamily: FONTS.regular,
    marginBottom: 4,
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },
  vsText: {
      fontSize: 20,
      color: COLORS.textMuted,
      fontFamily: FONTS.bold,
  },
  footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
      paddingTop: SPACING.sm,
  },
  status: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
  },
});
