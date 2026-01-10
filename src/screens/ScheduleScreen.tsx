import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, SectionList, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { dbManager } from '@/services/databaseManager';
import { formatDateJP, getGameDateString } from '@/utils/dateUtils';
import { COLORS, FONTS, SPACING } from '@/utils/theme';
import { Ionicons } from '@expo/vector-icons';

export const ScheduleScreen: React.FC = () => {
  const [sections, setSections] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(3); // Default to March
  const [allSections, setAllSections] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadSchedule();
    }, [])
  );

  useEffect(() => {
    filterByMonth(selectedMonth);
  }, [selectedMonth, allSections]);

  const loadSchedule = async () => {
    const scheduleData = await dbManager.getSchedule();
    const gameResults = await dbManager.loadGameHistory();
    
    // Group by date
    const grouped: Record<string, any[]> = {};
    
    scheduleData.forEach((game: any) => {
      if (!grouped[game.date]) {
        grouped[game.date] = [];
      }
      
      // Find result if exists
      const result = gameResults.find((r: any) => {
        const resultDateStr = getGameDateString(r.date, r.season);
        return resultDateStr === game.date && 
               r.homeTeam === game.home && 
               r.awayTeam === game.away;
      });
      
      grouped[game.date].push({
        ...game,
        result: result
      });
    });

    // Convert to SectionList format
    const sectionsData = Object.keys(grouped)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map(date => ({
        title: date,
        data: grouped[date]
      }));

    setAllSections(sectionsData);
    
    // Set initial month based on current date if possible, otherwise March
    // For now, default is March (3)
  };

  const filterByMonth = (month: number) => {
    const filtered = allSections.filter(section => {
      const date = new Date(section.title);
      return date.getMonth() + 1 === month;
    });
    setSections(filtered);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.row}>
      <View style={styles.matchup}>
        <Text style={styles.team}>{item.away}</Text>
        {item.result ? (
           <Text style={styles.score}>
             {item.result.awayScore} - {item.result.homeScore}
           </Text>
        ) : (
           <Text style={styles.vs}>vs</Text>
        )}
        <Text style={styles.team}>{item.home}</Text>
      </View>
      {item.isInterleague && <Text style={styles.interleague}>交流戦</Text>}
    </View>
  );

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <View style={styles.header}>
      <Text style={styles.headerText}>{formatDateJP(title)}</Text>
    </View>
  );

  const months = [3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.monthSelector}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.monthScrollContent}
        >
          {months.map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.monthButton, selectedMonth === m && styles.selectedMonthButton]}
              onPress={() => setSelectedMonth(m)}
            >
              <Text style={[styles.monthText, selectedMonth === m && styles.selectedMonthText]}>
                {m}月
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item, index) => `${item.date}-${item.home}-${item.away}-${index}`}
        initialNumToRender={20}
        stickySectionHeadersEnabled={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  monthSelector: {
    height: 60,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  monthScrollContent: {
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  monthButton: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
    minWidth: 70,
  },
  selectedMonthButton: {
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
  },
  monthText: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
  },
  selectedMonthText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontFamily: FONTS.bold,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerText: {
    fontWeight: 'bold',
    color: COLORS.textMain,
    fontFamily: FONTS.bold,
  },
  row: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.card,
  },
  matchup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  team: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    color: COLORS.textMain,
    fontFamily: FONTS.regular,
  },
  vs: {
    marginHorizontal: 10,
    color: COLORS.textMuted,
    width: 40,
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
  score: {
    marginHorizontal: 10,
    color: COLORS.primary,
    fontWeight: 'bold',
    width: 60,
    textAlign: 'center',
    fontFamily: FONTS.bold,
  },
  interleague: {
    fontSize: 10,
    color: COLORS.background,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 10,
    fontFamily: FONTS.bold,
  },
});