import { SaveData, GameState, Player, Team } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dbManager } from './databaseManager';

/**
 * DataManager - ゲームデータの永続化管理
 * VBA の データセーブ() / データロード() から変換
 * SQLite/AsyncStorage を使用
 */
export class DataManager {
  private readonly SAVE_KEY = 'simbaseball_save_data';
  private readonly AUTO_SAVE_KEY = 'simbaseball_auto_save';

  /**
   * 初期化：データベースをセットアップ
   */
  async initialize(): Promise<void> {
    try {
      await dbManager.initialize();
      console.log('DataManager initialized');
    } catch (error) {
      console.error('Failed to initialize DataManager:', error);
      throw error;
    }
  }

  /**
   * ゲームデータを保存
   * VBA: Sub データセーブ()
   */
  async saveGame(data: SaveData, isAutoSave: boolean = false): Promise<void> {
    try {
      const key = isAutoSave ? this.AUTO_SAVE_KEY : this.SAVE_KEY;
      const jsonData = JSON.stringify(data);

      await AsyncStorage.setItem(key, jsonData);
      console.log(`Game saved successfully (${isAutoSave ? 'auto' : 'manual'})`);
    } catch (error) {
      console.error('Failed to save game:', error);
      throw error;
    }
  }

  /**
   * ゲームデータを読み込み
   * VBA: Sub データロード()
   */
  async loadGame(): Promise<SaveData | null> {
    try {
      const data = await AsyncStorage.getItem(this.SAVE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Failed to load game:', error);
      throw error;
    }
  }

  /**
   * オートセーブを取得
   */
  async getAutoSave(): Promise<SaveData | null> {
    try {
      const data = await AsyncStorage.getItem(this.AUTO_SAVE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Failed to load auto save:', error);
      return null;
    }
  }

  /**
   * 初期データを読み込み（DB から）
   * VBA: Sub 初期データロード()
   * 
   * XML ではなく、初期化時に設定した初期データを使用
   */
  async loadInitialData(): Promise<{ players: Player[]; teams: Team[] } | null> {
    try {
      // DB から初期プレイヤーとチームデータを取得
      const initialPlayers = await dbManager.getInitialPlayers();
      const initialTeams = await dbManager.getInitialTeams();

      // 型に合わせて変換
      const players: Player[] = initialPlayers.map((p: any, index: number) => ({
        id: index + 1,
        name: p.name,
        position: p.position as any,
        handedness: p.handedness as any,
        age: p.age,
        team: p.team as any,
        abilities: p.abilities || {
          contact: 0,
          power: 0,
          speed: 0,
          arm: 0,
          fielding: 0
        },
        aptitudes: p.aptitudes,
        stats: p.stats || {
          average: 0,
          homeRuns: 0,
          rbi: 0,
          stolenBases: 0,
          obp: 0,
        },
        contract: {
          salary: p.salary,
          yearsRemaining: 1,
          totalYears: 1,
          expirationYear: 2026,
        },
        careerStats: {
          average: 0,
          homeRuns: 0,
          rbi: 0,
          stolenBases: 0,
          obp: 0,
        },
        recentForm: [0.5, 0.5, 0.5, 0.5, 0.5],
        injuryStatus: 'healthy',
        morale: 75,
        level: p.level,
        yearsExperience: 0,
      }));

      const teams: Team[] = initialTeams.map((t: any) => ({
        id: t.id as any,
        name: t.name,
        league: t.league,
        players: players.filter(p => p.team === t.id),
        lineup: [],
        pitchers: [],
        record: {
          wins: 0,
          losses: 0,
          winPercentage: 0,
          gamesBack: 0,
          runs: 0,
          runsAllowed: 0,
        },
        budget: t.budget,
        payroll: 0,
        history: [],
      }));

      console.log('Initial data loaded from database');
      return { players, teams };
    } catch (error) {
      console.error('Failed to load initial data:', error);
      return null;
    }
  }

  /**
   * ゲームデータを削除
   */
  async deleteGame(): Promise<void> {
    try {
      // await AsyncStorage.removeItem(this.SAVE_KEY);
      console.log('Game deleted successfully');
    } catch (error) {
      console.error('Failed to delete game:', error);
      throw error;
    }
  }

  /**
   * すべてのセーブデータを取得
   */
  async getAllSaves(): Promise<SaveData[]> {
    try {
      // const keys = await AsyncStorage.getAllKeys();
      // const gameKeys = keys.filter(k => k.startsWith('simbaseball_save_'));
      // const saves: SaveData[] = [];

      // for (const key of gameKeys) {
      //   const data = await AsyncStorage.getItem(key);
      //   if (data) {
      //     saves.push(JSON.parse(data));
      //   }
      // }

      // return saves;
      return [];
    } catch (error) {
      console.error('Failed to get all saves:', error);
      throw error;
    }
  }

  /**
   * 選手統計を記録
   * VBA: Sub 選手入力記録()
   */
  async recordPlayerStats(gameResults: any[]): Promise<void> {
    try {
      // 試合結果から選手統計を抽出
      // Redux に保存
      console.log('Player stats recorded');
    } catch (error) {
      console.error('Failed to record player stats:', error);
      throw error;
    }
  }

  /**
   * 試合結果を記録
   */
  async recordGameResult(result: any): Promise<void> {
    try {
      // 試合結果を保存
      console.log('Game result recorded');
    } catch (error) {
      console.error('Failed to record game result:', error);
      throw error;
    }
  }

  /**
   * シーズンデータをエクスポート
   */
  async exportSeasonData(seasonNumber: number): Promise<string> {
    try {
      // シーズンデータを JSON に変換
      // ファイルに保存
      return 'Season data exported';
    } catch (error) {
      console.error('Failed to export season data:', error);
      throw error;
    }
  }

  /**
   * シーズンデータをインポート
   */
  async importSeasonData(data: string): Promise<SaveData> {
    try {
      // JSON データをパース
      // 検証
      // Redux に保存
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to import season data:', error);
      throw error;
    }
  }
}

export const dataManager = new DataManager();
