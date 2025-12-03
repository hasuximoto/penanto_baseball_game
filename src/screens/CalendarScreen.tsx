import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { dbManager } from '@/services/databaseManager';

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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => changeMonth(-1)}>
          <Text style={styles.arrow}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
        </Text>
        <TouchableOpacity onPress={() => changeMonth(1)}>
          <Text style={styles.arrow}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekHeader}>
        {['日', '月', '火', '水', '木', '金', '土'].map(d => (
          <Text key={d} style={styles.weekDayText}>{d}</Text>
        ))}
      </View>

      <ScrollView>
        <View style={styles.calendarGrid}>
          {renderCalendar()}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  arrow: {
    fontSize: 24,
    paddingHorizontal: 20,
    color: '#2196F3',
  },
  weekHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#666',
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
    borderColor: '#eee',
  },
  gameDay: {
    backgroundColor: '#e3f2fd',
  },
  dayText: {
    fontSize: 16,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2196F3',
    marginTop: 4,
  },
});
