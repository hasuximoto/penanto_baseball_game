import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

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
    // 将来的な機能
    // {
    //   title: '投手起用設定',
    //   icon: 'baseball',
    //   description: '先発ローテーションや中継ぎの役割を設定します',
    //   onPress: () => {},
    //   disabled: true
    // }
  ];

  if (!selectedTeamId) {
    return (
      <View style={styles.container}>
        <View style={styles.messageContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
          <Text style={styles.messageText}>チームが選択されていません</Text>
          <Text style={styles.subMessageText}>メインメニューから「プレイする」を選択してチームを選んでください</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>球団管理</Text>
      </View>
      
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, item.disabled && styles.disabledItem]}
            onPress={item.onPress}
            disabled={item.disabled}
          >
            <View style={styles.iconContainer}>
              <Ionicons name={item.icon as any} size={32} color={item.disabled ? '#ccc' : '#4CAF50'} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.menuTitle, item.disabled && styles.disabledText]}>{item.title}</Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  menuContainer: {
    padding: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  disabledItem: {
    backgroundColor: '#f9f9f9',
    elevation: 0,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  disabledText: {
    color: '#999',
  },
  menuDescription: {
    fontSize: 14,
    color: '#666',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
    marginBottom: 10,
  },
  subMessageText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
