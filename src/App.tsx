import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Provider } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import { store } from './redux/store';
import { DataManager } from './services/dataManager';
import { RootNavigator } from './navigation/RootNavigator';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
});

/**
 * メインアプリケーション
 */
export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // アイコンフォントを読み込む
      await Font.loadAsync(Ionicons.font);

      const dataManager = new DataManager();
      await dataManager.initialize();
      setIsInitialized(true);
      console.log('✅ アプリ初期化完了');
    } catch (error) {
      console.error('❌ アプリ初期化エラー:', error);
      setInitError(error instanceof Error ? error.message : '初期化に失敗しました');
    }
  };

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.statusText}>
          {initError ? `エラー: ${initError}` : '初期化中...'}
        </Text>
      </View>
    );
  }

  return (
    <Provider store={store}>
      <RootNavigator />
    </Provider>
  );
}
