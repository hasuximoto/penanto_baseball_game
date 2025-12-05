/**
 * Storage ユーティリティ
 * ゲームデータの永続化を担当 (Web: localforage, Native: AsyncStorage)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import localforage from 'localforage';
import { STORAGE_KEYS } from './constants';
import { GameState, SaveData } from '../types';

// Web用の設定
if (Platform.OS === 'web') {
  localforage.config({
    driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
    name: 'simbaseball_db',
    version: 1.0,
    storeName: 'keyvalue_pairs',
    description: 'SimBaseball Database'
  });
}

/**
 * 値をストレージに保存
 */
export const setStorageItem = async (key: string, value: any): Promise<void> => {
  try {
    const serialized = JSON.stringify(value);
    if (Platform.OS === 'web') {
      await localforage.setItem(key, serialized);
    } else {
      await AsyncStorage.setItem(key, serialized);
    }
  } catch (error) {
    console.error(`Failed to set storage item "${key}":`, error);
    throw error;
  }
};

/**
 * ストレージから値を取得
 */
export const getStorageItem = async <T = any>(
  key: string,
  defaultValue?: T | null
): Promise<T | null | undefined> => {
  try {
    let value: string | null;
    if (Platform.OS === 'web') {
      value = await localforage.getItem<string>(key);
    } else {
      value = await AsyncStorage.getItem(key);
    }

    if (value === null) {
      return defaultValue;
    }
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Failed to get storage item "${key}":`, error);
    throw error;
  }
};

/**
 * ストレージから値を削除
 */
export const removeStorageItem = async (key: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      await localforage.removeItem(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  } catch (error) {
    console.error(`Failed to remove storage item "${key}":`, error);
    throw error;
  }
};

/**
 * 複数の値を一度に保存
 */
export const setMultipleItems = async (items: Record<string, any>): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      const promises = Object.entries(items).map(([key, value]) => 
        localforage.setItem(key, JSON.stringify(value))
      );
      await Promise.all(promises);
    } else {
      const serializedItems: Array<[string, string]> = Object.entries(items).map(([key, value]) => [
        key,
        JSON.stringify(value),
      ]);
      await AsyncStorage.multiSet(serializedItems);
    }
  } catch (error) {
    console.error('Failed to set multiple storage items:', error);
    throw error;
  }
};

/**
 * 複数の値を一度に取得
 */
export const getMultipleItems = async (keys: string[]): Promise<Record<string, any>> => {
  try {
    const result: Record<string, any> = {};

    if (Platform.OS === 'web') {
      const promises = keys.map(async (key) => {
        const value = await localforage.getItem<string>(key);
        if (value !== null) {
          result[key] = JSON.parse(value);
        }
      });
      await Promise.all(promises);
    } else {
      const values = await AsyncStorage.multiGet(keys);
      for (const [key, value] of values) {
        if (value !== null) {
          result[key] = JSON.parse(value);
        }
      }
    }

    return result;
  } catch (error) {
    console.error('Failed to get multiple storage items:', error);
    throw error;
  }
};

/**
 * ストレージをクリア
 */
export const clearAllStorage = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      await localforage.clear();
    } else {
      await AsyncStorage.clear();
    }
  } catch (error) {
    console.error('Failed to clear storage:', error);
    throw error;
  }
};

/**
 * ゲーム状態を保存
 */
export const saveGameState = async (gameState: GameState): Promise<void> => {
  return setStorageItem(STORAGE_KEYS.GAME_STATE, gameState);
};

/**
 * ゲーム状態を読み込み
 */
export const loadGameState = async (): Promise<GameState | null> => {
  const result = await getStorageItem<GameState>(STORAGE_KEYS.GAME_STATE, null);
  return result ?? null;
};

/**
 * セーブデータを保存
 */
export const saveSaveData = async (saveData: SaveData): Promise<void> => {
  return setStorageItem(STORAGE_KEYS.SEASON_DATA, saveData);
};

/**
 * セーブデータを読み込み
 */
export const loadSaveData = async (): Promise<SaveData | null> => {
  const result = await getStorageItem<SaveData>(STORAGE_KEYS.SEASON_DATA, null);
  return result ?? null;
};

/**
 * 複数のセーブデータを読み込み（バックアップ用）
 */
export const loadAllSaveData = async (): Promise<SaveData[]> => {
  try {
    let allKeys: string[];
    if (Platform.OS === 'web') {
      allKeys = await localforage.keys();
    } else {
      allKeys = await AsyncStorage.getAllKeys() as string[];
    }
    
    const saveKeys = allKeys.filter(key => key.startsWith(STORAGE_KEYS.SEASON_DATA));
    const saves = await getMultipleItems(saveKeys);
    return Object.values(saves) as SaveData[];
  } catch (error) {
    console.error('Failed to load all save data:', error);
    return [];
  }
};

/**
 * オートセーブ用に最新のゲーム状態を保存
 */
export const autoSaveGame = async (gameState: GameState): Promise<void> => {
  try {
    const timestamp = new Date().getTime();
    const autoSaveKey = `${STORAGE_KEYS.AUTOSAVE}_${timestamp}`;
    await setStorageItem(autoSaveKey, gameState);

    // 古いオートセーブを削除（最新 5 つだけ保持）
    let allKeys: string[];
    if (Platform.OS === 'web') {
      allKeys = await localforage.keys();
    } else {
      allKeys = await AsyncStorage.getAllKeys() as string[];
    }

    const autoSaveKeys = allKeys.filter(key => key.startsWith(STORAGE_KEYS.AUTOSAVE));

    if (autoSaveKeys.length > 5) {
      const keysToDelete = autoSaveKeys.sort().slice(0, autoSaveKeys.length - 5);
      if (Platform.OS === 'web') {
        await Promise.all(keysToDelete.map(key => localforage.removeItem(key)));
      } else {
        await AsyncStorage.multiRemove(keysToDelete);
      }
    }
  } catch (error) {
    console.error('Failed to auto-save game:', error);
  }
};

/**
 * 最新のオートセーブを読み込み
 */
export const loadLatestAutoSave = async (): Promise<GameState | null> => {
  try {
    let allKeys: string[];
    if (Platform.OS === 'web') {
      allKeys = await localforage.keys();
    } else {
      allKeys = await AsyncStorage.getAllKeys() as string[];
    }

    const autoSaveKeys = allKeys.filter(key => key.startsWith(STORAGE_KEYS.AUTOSAVE));

    if (autoSaveKeys.length === 0) {
      return null;
    }

    const latestKey = autoSaveKeys.sort().pop();
    if (!latestKey) return null;

    const result = await getStorageItem<GameState>(latestKey, null);
    return result ?? null;
  } catch (error) {
    console.error('Failed to load latest auto-save:', error);
    return null;
  }
};

/**
 * ゲーム設定を保存
 */
export const saveGameSettings = async (settings: Record<string, any>): Promise<void> => {
  return setStorageItem(STORAGE_KEYS.SETTINGS, settings);
};

/**
 * ゲーム設定を読み込み
 */
export const loadGameSettings = async (): Promise<Record<string, any>> => {
  const result = await getStorageItem<Record<string, any>>(STORAGE_KEYS.SETTINGS, {});
  return result ?? {};
};

/**
 * ストレージの使用状況を取得（デバッグ用）
 */
export const getStorageInfo = async (): Promise<{ keys: number; estimatedSize: string }> => {
  try {
    let allKeys: string[];
    if (Platform.OS === 'web') {
      allKeys = await localforage.keys();
    } else {
      allKeys = await AsyncStorage.getAllKeys() as string[];
    }

    const items = await getMultipleItems(allKeys);
    const serialized = JSON.stringify(items);
    const sizeInBytes = new Blob([serialized]).size;
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

    return {
      keys: allKeys.length,
      estimatedSize: `${sizeInMB}MB`,
    };
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return { keys: 0, estimatedSize: '0MB' };
  }
};

/**
 * 特定のセーブを削除
 */
export const deleteSaveData = async (saveKey: string): Promise<void> => {
  return removeStorageItem(saveKey);
};

/**
 * すべてのセーブデータを削除
 */
export const deleteAllSaveData = async (): Promise<void> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const saveKeys = allKeys.filter(
      key =>
        key.startsWith(STORAGE_KEYS.SEASON_DATA) ||
        key.startsWith(STORAGE_KEYS.AUTOSAVE)
    );
    await AsyncStorage.multiRemove(saveKeys);
  } catch (error) {
    console.error('Failed to delete all save data:', error);
    throw error;
  }
};
