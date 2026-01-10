import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SPACING } from '@/utils/theme';

export const TeamMenuScreen = () => {
  const navigation = useNavigation<any>();
  const gameState = useSelector((state: RootState) => state.game);
  const selectedTeamId = gameState.selectedTeamId;

  const menuItems = [
    {
      title: '一軍登録・抹消',
      icon: 'swap-vertical',
      description: '一軍と二軍の選手の入れ替えを行います',
      onPress: () => navigation.navigate('RosterMove', { teamId: selectedTeamId }),
      disabled: !selectedTeamId
    },
    {
      title: 'オーダー設定',
      icon: 'list',
      description: 'スターティングメンバーと打順を設定します',
      onPress: () => navigation.navigate('TeamOrder', { teamId: selectedTeamId }),
      disabled: !selectedTeamId
    },
    {
      title: 'チーム成績',
      icon: 'stats-chart',
      description: 'チームの成績詳細を確認します',
      onPress: () => navigation.navigate('TeamStats', { teamId: selectedTeamId }),
      disabled: !selectedTeamId
    },
  ];

  if (!selectedTeamId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.messageContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.messageText}>チームが選択されていません</Text>
          <Text style={styles.subMessageText}>メインメニューから「プレイする」を選択してチームを選んでください</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>球団管理</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, item.disabled && styles.disabledItem]}
            onPress={item.onPress}
            disabled={item.disabled}
          >
            <View style={styles.iconContainer}>
              <Ionicons name={item.icon as any} size={32} color={item.disabled ? COLORS.textSecondary : COLORS.primary} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.menuTitle, item.disabled && styles.disabledText]}>{item.title}</Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ))}
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
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: FONTS.bold,
  },
  menuContainer: {
    padding: SPACING.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  disabledItem: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    opacity: 0.6,
  },
  iconContainer: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  textContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
    fontFamily: FONTS.regular,
  },
  disabledText: {
    color: COLORS.textSecondary,
  },
  menuDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  messageText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  subMessageText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});
