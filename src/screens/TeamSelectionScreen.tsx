import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView, SafeAreaView } from 'react-native';
import { useDispatch } from 'react-redux';
import { dbManager } from '../services/databaseManager';
import { setSelectedTeam } from '../redux/slices/gameSlice';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '@/utils/theme';

export const TeamSelectionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch();
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const initialTeams = await dbManager.getInitialTeams();
      setTeams(initialTeams);
    } catch (error) {
      console.error(error);
      Alert.alert('エラー', 'チームデータの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamPress = (teamId: string) => {
    setSelectedTeamId(teamId);
    setModalVisible(true);
  };

  const handleStartGame = async () => {
    if (!selectedTeamId) return;
    
    try {
      setLoading(true);
      setModalVisible(false);
      // 選択したチームを保存
      dispatch(setSelectedTeam(selectedTeamId));
      
      // ゲーム開始
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (error) {
      console.error(error);
      Alert.alert('エラー', 'ゲームの開始に失敗しました');
      setLoading(false);
    }
  };

  const renderTeamItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.teamItem}
      onPress={() => handleTeamPress(item.id)}
    >
      <View style={styles.teamIconPlaceholder}>
         <Text style={styles.teamIconText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.teamInfo}>
        <Text style={styles.teamName}>{item.name}</Text>
        <Text style={styles.leagueName}>{item.league === 'pacific' ? 'パ・リーグ' : 'セ・リーグ'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={COLORS.textMuted} />
    </TouchableOpacity>
  );

  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  if (loading && !selectedTeamId) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textMain} />
        </TouchableOpacity>
        <Text style={styles.title}>チーム選択</Text>
        <View style={{width: 24}} /> 
      </View>
      
      <Text style={styles.subtitle}>プレイするチームを選択してください</Text>

      <FlatList
        data={teams}
        renderItem={renderTeamItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedTeam && (
                <>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{selectedTeam.name}</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={COLORS.textMuted} />
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView style={styles.modalBody}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>リーグ</Text>
                            <Text style={styles.detailValue}>
                            {selectedTeam.league === 'pacific' ? 'パシフィック・リーグ' : 'セントラル・リーグ'}
                            </Text>
                        </View>
                        
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>資金</Text>
                            <Text style={styles.detailValue}>
                            {(selectedTeam.budget / 10000).toFixed(0)} 億円
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>本拠地</Text>
                            <Text style={styles.detailValue}>{selectedTeam.homeStadium || '不明'}</Text>
                        </View>

                        <View style={styles.infoBox}>
                            <Text style={styles.infoText}>
                                このチームでペナントレースを開始しますか？
                            </Text>
                        </View>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.cancelButtonText}>キャンセル</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.startButton}
                            onPress={handleStartGame}
                        >
                            <Text style={styles.startButtonText}>ゲーム開始</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerBackButton: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textMain,
    fontFamily: FONTS.bold,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginVertical: 15,
    fontFamily: FONTS.regular,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  teamIconPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  teamIconText: {
    color: COLORS.background,
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: FONTS.bold,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textMain,
    fontFamily: FONTS.bold,
  },
  leagueName: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: COLORS.primary,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textMain,
    fontFamily: FONTS.bold,
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textMain,
    fontFamily: FONTS.regular,
  },
  infoBox: {
    marginTop: 25,
    padding: 15,
    backgroundColor: 'rgba(212, 175, 55, 0.1)', // Gold tint
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  infoText: {
    color: COLORS.primary,
    textAlign: 'center',
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.textMuted,
    fontWeight: 'bold',
    fontSize: 16,
  },
  startButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
