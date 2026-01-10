import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { dbManager } from '@/services/databaseManager';
import { COLORS, FONTS, SPACING } from '@/utils/theme';
import { Ionicons } from '@expo/vector-icons';

export const CalendarScreen: React.FC = () => {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 2, 1)); // March 2025

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    const data = await dbManager.getSchedule();
    setSchedule(data);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return days;
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentMonth(newDate);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const games = schedule.filter(g => g.date === dateStr);
      const hasGames = games.length > 0;

      days.push(
        <TouchableOpacity key={dateStr} style={[styles.dayCell, hasGames && styles.gameDay]}>
          <Text style={styles.dayText}>{i}</Text>
          {hasGames && <View style={styles.dot} />}
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrowButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
        </Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrowButton}>
          <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekHeader}>
        {['日', '月', '火', '水', '木', '金', '土'].map(d => (
          <Text key={d} style={styles.weekDayText}>{d}</Text>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.calendarScroll}>
        <View style={styles.calendarGrid}>
          {renderCalendar()}
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.m,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textMain,
    fontFamily: FONTS.bold,
  },
  arrowButton: {
    padding: SPACING.s,
  },
  weekHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    color: COLORS.textMuted,
    fontFamily: FONTS.bold,
  },
  calendarScroll: {
    flexGrow: 1,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 100% / 7
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  gameDay: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)', // COLORS.primary with opacity
  },
  dayText: {
    fontSize: 16,
    color: COLORS.textMain,
    fontFamily: FONTS.medium,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },
});
