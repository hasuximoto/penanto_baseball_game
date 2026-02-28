import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, SafeAreaView } from 'react-native';
import { useDispatch } from 'react-redux';
import { dbManager } from '../services/databaseManager';
import { resetGame, setGameState } from '../redux/slices/gameSlice';
import { COLORS, FONTS, SPACING } from '@/utils/theme';

export const TitleScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    buttons: [] as { text: string; style?: string; onPress?: () => void }[]
  });

  const showAlert = (title: string, message: string, buttons: { text: string; style?: string; onPress?: () => void }[] = [{ text: 'OK' }]) => {
    setModalConfig({ title, message, buttons });
    setModalVisible(true);
  };

  const handleButtonPress = (button: { text: string; style?: string; onPress?: () => void }) => {
    setModalVisible(false);
    if (button.onPress) {
      button.onPress();
    }
  };

  const handleNewGame = async () => {
    showAlert(
      'はじめから',
      '新しいゲームを始めますか？\n現在のセーブデータは削除されます。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'OK',
          onPress: async () => {
            setIsLoading(true);
            try {
              await dbManager.reset();
              await dbManager.initialize();
              dispatch(resetGame());
              navigation.navigate('TeamSelection');
            } catch (error) {
              console.error('New game error:', error);
              showAlert('エラー', '初期化に失敗しました。');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleLoadGame = async () => {
    setIsLoading(true);
    try {
      const savedState = await dbManager.loadGameState();
      if (savedState) {
        dispatch(setGameState(savedState));
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      } else {
        showAlert('エラー', 'セーブデータが見つかりません。');
      }
    } catch (error) {
      console.error('Load game error:', error);
      showAlert('エラー', 'ロードに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>処理中...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>SimBaseBall</Text>
        <Text style={styles.subtitle}>Tactical Manager</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleNewGame}>
            <Text style={styles.buttonText}>はじめから</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.loadButton]} onPress={handleLoadGame}>
            <Text style={[styles.buttonText, styles.loadButtonText]}>つづきから</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalConfig.title}</Text>
            <Text style={styles.modalMessage}>{modalConfig.message}</Text>
            <View style={styles.modalButtons}>
              {modalConfig.buttons.map((btn, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.modalButton,
                    btn.style === 'cancel' ? styles.modalButtonCancel : styles.modalButtonOk
                  ]}
                  onPress={() => handleButtonPress(btn)}
                >
                  <Text style={[
                    styles.modalButtonText,
                    btn.style === 'cancel' ? styles.modalButtonTextCancel : styles.modalButtonTextOk
                  ]}>{btn.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
    fontFamily: FONTS.bold,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.textMuted,
    marginBottom: 60,
    letterSpacing: 4,
    fontFamily: FONTS.regular,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  loadButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: FONTS.bold,
  },
  loadButtonText: {
    color: COLORS.primary,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: COLORS.textMain,
    fontFamily: FONTS.regular,
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonOk: {
    backgroundColor: COLORS.primary,
  },
  modalButtonCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.textMuted,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: FONTS.bold,
  },
  modalButtonTextOk: {
    color: COLORS.background,
  },
  modalButtonTextCancel: {
    color: COLORS.textMuted,
  },
});
