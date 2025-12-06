/**
 * SQLite データベース初期化と管理
 * 初期データの永続化とゲーム状態の管理
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import localforage from 'localforage';
import INITIAL_PLAYERS_DATA from '../data/initialPlayers.json';
import INITIAL_TEAMS_DATA from '../data/teams.json';
import INITIAL_SCHEDULE from '../data/initialSchedule.json';
import NAME_MASTER_DATA from '../data/nameMaster.json';
import { GameResult, PlayerGameStats, Player, NewsItem, TeamId, YearlyStats, PlayerStats, Title } from '../types';
import { getGameDateString } from '../utils/dateUtils';
import { AwardManager } from './awardManager';
import { calculateWAR } from '../utils/calculations';

const POS_JP_TO_EN: Record<string, string> = {
  '右': 'RF', '中': 'CF', '左': 'LF',
  '遊': 'SS', '一': '1B', '二': '2B', '三': '3B',
  '捕': 'C', '指': 'DH', '投': 'P'
};

/**
 * データベーススキーマ定義
 */
export const DATABASE_SCHEMA = {
  // 選手マスターデータ
  players: `
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      team TEXT NOT NULL,
      position TEXT NOT NULL,
      age INTEGER,
      handedness TEXT,
      salary INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      experience_years INTEGER DEFAULT 0,
      contact REAL DEFAULT 0,
      power REAL DEFAULT 0,
      speed REAL DEFAULT 0,
      arm REAL DEFAULT 0,
      fielding REAL DEFAULT 0,
      control REAL DEFAULT 0,
      stamina REAL DEFAULT 0,
      eye REAL DEFAULT 0,
      bunt REAL DEFAULT 0,
      aggressiveness REAL DEFAULT 0,
      steal REAL DEFAULT 0,
      trajectory REAL DEFAULT 0,
      experience REAL DEFAULT 0,
      pinch_hitter REAL DEFAULT 0,
      roster_slot TEXT,
      starter_aptitude REAL DEFAULT 0,
      reliever_aptitude REAL DEFAULT 0,
      closer_aptitude REAL DEFAULT 0,
      stuff REAL DEFAULT 0,
      pitching_form TEXT,
      corrected_power REAL DEFAULT 0,
      corrected_contact REAL DEFAULT 0,
      overall REAL DEFAULT 0,
      apt_catcher REAL DEFAULT 0,
      apt_first REAL DEFAULT 0,
      apt_second REAL DEFAULT 0,
      apt_third REAL DEFAULT 0,
      apt_short REAL DEFAULT 0,
      apt_outfield REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  // 選手統計
  player_stats: `
    CREATE TABLE IF NOT EXISTS player_stats (
      id INTEGER PRIMARY KEY,
      player_id INTEGER NOT NULL,
      season INTEGER NOT NULL,
      avg REAL,
      home_runs INTEGER,
      rbi INTEGER,
      stolen_bases INTEGER,
      obp REAL,
      hits INTEGER,
      at_bats INTEGER,
      singles INTEGER,
      doubles INTEGER,
      triples INTEGER,
      walks INTEGER,
      strikeouts INTEGER,
      era REAL,
      wins INTEGER,
      losses INTEGER,
      saves INTEGER,
      innings_pitched REAL,
      earned_runs INTEGER,
      uzr REAL DEFAULT 0,
      ubr REAL DEFAULT 0,
      war REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(player_id) REFERENCES players(id),
      UNIQUE(player_id, season)
    )
  `,

  // タイトル履歴
  titles: `
    CREATE TABLE IF NOT EXISTS titles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL,
      title_name TEXT NOT NULL,
      player_id INTEGER NOT NULL,
      team_id TEXT,
      value TEXT,
      league TEXT,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(player_id) REFERENCES players(id)
    )
  `,

  // チームマスターデータ
  teams: `
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      budget INTEGER DEFAULT 0,
      payroll INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  // チームロスター
  team_rosters: `
    CREATE TABLE IF NOT EXISTS team_rosters (
      id INTEGER PRIMARY KEY,
      team_id TEXT NOT NULL,
      player_id INTEGER NOT NULL,
      season INTEGER NOT NULL,
      position TEXT,
      salary INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(team_id) REFERENCES teams(id),
      FOREIGN KEY(player_id) REFERENCES players(id),
      UNIQUE(team_id, player_id, season)
    )
  `,

  // 試合結果
  game_results: `
    CREATE TABLE IF NOT EXISTS game_results (
      id TEXT PRIMARY KEY,
      season INTEGER NOT NULL,
      game_date DATETIME,
      home_team TEXT NOT NULL,
      away_team TEXT NOT NULL,
      home_score INTEGER,
      away_score INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(home_team) REFERENCES teams(id),
      FOREIGN KEY(away_team) REFERENCES teams(id)
    )
  `,

  // ゲーム状態（セーブデータ）
  game_states: `
    CREATE TABLE IF NOT EXISTS game_states (
      id INTEGER PRIMARY KEY,
      season INTEGER,
      current_date DATETIME,
      game_status TEXT,
      selected_team TEXT,
      state_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  // スケジュール
  schedule: `
    CREATE TABLE IF NOT EXISTS schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      home_team TEXT NOT NULL,
      away_team TEXT NOT NULL,
      is_interleague INTEGER DEFAULT 0,
      played INTEGER DEFAULT 0,
      result_id TEXT
    )
  `,

  // インデックス
  players_team_idx: `CREATE INDEX IF NOT EXISTS idx_players_team ON players(team)`,
  player_stats_season_idx: `CREATE INDEX IF NOT EXISTS idx_player_stats_season ON player_stats(season)`,
  team_rosters_season_idx: `CREATE INDEX IF NOT EXISTS idx_team_rosters_season ON team_rosters(season)`,
  game_results_date_idx: `CREATE INDEX IF NOT EXISTS idx_game_results_date ON game_results(game_date)`,
  schedule_date_idx: `CREATE INDEX IF NOT EXISTS idx_schedule_date ON schedule(date)`,
};

/**
 * 初期データ（選手マスター）
 */
export const INITIAL_PLAYERS = INITIAL_PLAYERS_DATA as any[];

/**
 * チーム初期化データ
 */
export const INITIAL_TEAMS = INITIAL_TEAMS_DATA as any[];

/**
 * データベース初期化処理
 */
export class DatabaseManager {
  private dbKey = 'simbaseball_db_initialized';
  private dbVersionKey = 'simbaseball_db_version';
  private currentVersion = 13;

  constructor() {
    if (Platform.OS === 'web') {
      localforage.config({
        driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
        name: 'simbaseball_db',
        version: 1.0,
        storeName: 'keyvalue_pairs',
        description: 'SimBaseball Database'
      });
    }
  }

  /**
   * ストレージからデータを取得するヘルパー
   */
  public async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return await localforage.getItem<string>(key);
    } else {
      return await AsyncStorage.getItem(key);
    }
  }

  /**
   * ストレージにデータを保存するヘルパー
   */
  public async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      await localforage.setItem(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  }

  /**
   * ストレージからデータを削除するヘルパー
   */
  public async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      await localforage.removeItem(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  }

  /**
   * ストレージの全キーを取得するヘルパー
   */
  private async getAllKeys(): Promise<string[]> {
    if (Platform.OS === 'web') {
      return await localforage.keys();
    } else {
      return await AsyncStorage.getAllKeys();
    }
  }

  /**
   * 複数のキーを削除するヘルパー
   */
  private async multiRemove(keys: string[]): Promise<void> {
    if (Platform.OS === 'web') {
      await Promise.all(keys.map(key => localforage.removeItem(key)));
    } else {
      await AsyncStorage.multiRemove(keys);
    }
  }

  /**
   * データベースの初期化状態を確認
   */
  async isInitialized(): Promise<boolean> {
    try {
      const initialized = await this.getItem(this.dbKey);
      const version = await this.getItem(this.dbVersionKey);

      return initialized === 'true' && parseInt(version || '0') === this.currentVersion;
    } catch (error) {
      console.error('Failed to check DB initialization:', error);
      return false;
    }
  }

  /**
   * データベースをリセット（デバッグ用）
   */
  async reset(): Promise<void> {
    try {
      const keys = await this.getAllKeys();
      const simbaseballKeys = keys.filter(key => key.startsWith('simbaseball_'));
      await this.multiRemove(simbaseballKeys);
      console.log('Database reset successfully');
    } catch (error) {
      console.error('Failed to reset database:', error);
      throw error;
    }
  }

  /**
   * プレイヤーの偏りを修正して再分配し、IDを付与する
   */
  private distributePlayersIfNeeded(players: any[]): any[] {
    const teamCounts: Record<string, number> = {};
    INITIAL_TEAMS.forEach(t => teamCounts[t.id] = 0);
    
    // Count players per team
    players.forEach(p => {
      if (teamCounts[p.team] !== undefined) {
        teamCounts[p.team]++;
      }
    });

    const emptyTeams = INITIAL_TEAMS.filter(t => teamCounts[t.id] === 0).map(t => t.id);
    const overloadedTeams = INITIAL_TEAMS.filter(t => teamCounts[t.id] > 100).map(t => t.id);

    let processedPlayers = [...players];

    if (emptyTeams.length > 0 && overloadedTeams.length > 0) {
      console.log('Redistributing players from overloaded teams to empty teams...');
      
      processedPlayers = JSON.parse(JSON.stringify(players));
      
      overloadedTeams.forEach(sourceTeamId => {
        const sourcePlayersIndices = processedPlayers
          .map((p: any, index: number) => p.team === sourceTeamId ? index : -1)
          .filter((index: number) => index !== -1);
          
        const keepCount = 70; 
        
        if (sourcePlayersIndices.length > keepCount) {
           const indicesToMove = sourcePlayersIndices.slice(keepCount);
           
           indicesToMove.forEach((playerIndex: number, i: number) => {
             const targetTeamId = emptyTeams[i % emptyTeams.length];
             processedPlayers[playerIndex].team = targetTeamId;
           });
        }
      });
    }
    
    // Assign IDs and ensure stats structure
    return processedPlayers.map((p, index) => ({
        ...p,
        id: p.id || `player_${index}`, // Assign persistent ID
        stats: p.stats || {
          average: 0.0,
          homeRuns: 0,
          rbi: 0,
          stolenBases: 0,
          obp: 0.0,
          hits: 0,
          atBats: 0,
          era: 0.0,
          wins: 0,
          losses: 0,
          saves: 0,
          inningsPitched: 0,
          strikeOuts: 0,
          earnedRuns: 0,
          walks: 0
        }
    }));
  }

  /**
   * データベース初期化
   */
  async initialize(): Promise<void> {
    try {
      // 既に初期化済みか確認
      if (await this.isInitialized()) {
        console.log('Database already initialized');
        // 既存データのOBPなどを再計算して修正 (データ不整合対策)
        await this.recalculateAllPlayerStats();
        return;
      }

      // バージョン不一致などで再初期化する場合は、一度データをクリアする
      console.log('Re-initializing database (Version mismatch or first run)...');
      await this.reset();

      // スキーマ作成のシミュレーション（AsyncStorage を使用）
      console.log('Initializing database...');

      // プレイヤーデータの再分配（必要な場合）
      // const distributedPlayers = this.distributePlayersIfNeeded(INITIAL_PLAYERS);
      // データ抽出ロジック修正により、再分配は不要になったため無効化
      const distributedPlayers = INITIAL_PLAYERS.map((p, index) => ({
        ...p,
        id: p.id || `player_${index}`,
        stats: p.stats || {
          average: 0.0,
          homeRuns: 0,
          rbi: 0,
          stolenBases: 0,
          obp: 0.0,
          hits: 0,
          atBats: 0,
          era: 0.0,
          wins: 0,
          losses: 0,
          saves: 0,
          inningsPitched: 0,
          strikeOuts: 0,
          earnedRuns: 0,
          walks: 0
        }
      }));

      // 初期データをスキーマと共に保存
      const dbSchema = {
        schema: DATABASE_SCHEMA,
        initialData: {
          teams: INITIAL_TEAMS,
          players: distributedPlayers,
          schedule: INITIAL_SCHEDULE,
          titles: [],
        },
        version: this.currentVersion,
      };

      await this.setItem(
        'simbaseball_db_schema',
        JSON.stringify(dbSchema)
      );

      // 初期化フラグを設定
      await this.setItem(this.dbKey, 'true');
      await this.setItem(this.dbVersionKey, this.currentVersion.toString());

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * 初期プレイヤーデータを取得
   */
  async getInitialPlayers(): Promise<typeof INITIAL_PLAYERS> {
    try {
      const schemaData = await this.getItem('simbaseball_db_schema');
      if (!schemaData) {
        await this.initialize();
        return INITIAL_PLAYERS;
      }

      const parsed = JSON.parse(schemaData);
      return parsed.initialData?.players || INITIAL_PLAYERS;
    } catch (error) {
      console.error('Failed to get initial players:', error);
      return INITIAL_PLAYERS;
    }
  }

  /**
   * 初期チームデータを取得
   */
  async getInitialTeams(): Promise<typeof INITIAL_TEAMS> {
    try {
      const schemaData = await this.getItem('simbaseball_db_schema');
      if (!schemaData) {
        await this.initialize();
        return INITIAL_TEAMS;
      }

      const parsed = JSON.parse(schemaData);
      return parsed.initialData?.teams || INITIAL_TEAMS;
    } catch (error) {
      console.error('Failed to get initial teams:', error);
      return INITIAL_TEAMS;
    }
  }

  /**
   * 複数の選手情報を更新する
   */
  async updatePlayers(updatedPlayers: Player[]): Promise<void> {
    try {
      const schemaData = await this.getItem('simbaseball_db_schema');
      if (!schemaData) return;

      const parsed = JSON.parse(schemaData);
      const currentPlayers = parsed.initialData.players as Player[];
      
      // 更新対象のIDマップを作成
      const updateMap = new Map(updatedPlayers.map(p => [p.id, p]));
      
      const newPlayers = currentPlayers.map(p => {
        if (updateMap.has(p.id)) {
          return updateMap.get(p.id)!;
        }
        return p;
      });

      parsed.initialData.players = newPlayers;
      await this.setItem('simbaseball_db_schema', JSON.stringify(parsed));
    } catch (error) {
      console.error('Failed to update players:', error);
    }
  }

  /**
   * 複数の選手を削除する
   */
  async removePlayers(playerIds: (string | number)[]): Promise<void> {
    try {
      const schemaData = await this.getItem('simbaseball_db_schema');
      if (!schemaData) return;

      const parsed = JSON.parse(schemaData);
      const currentPlayers = parsed.initialData.players as Player[];
      
      const removeSet = new Set(playerIds);
      const newPlayers = currentPlayers.filter(p => !removeSet.has(p.id));

      parsed.initialData.players = newPlayers;
      await this.setItem('simbaseball_db_schema', JSON.stringify(parsed));
    } catch (error) {
      console.error('Failed to remove players:', error);
    }
  }

  /**
   * 複数の選手を自由契約にする (チームをfree_agentに変更)
   */
  async releasePlayersToFreeAgency(playerIds: (string | number)[]): Promise<void> {
    try {
      const schemaData = await this.getItem('simbaseball_db_schema');
      if (!schemaData) return;

      const parsed = JSON.parse(schemaData);
      const currentPlayers = parsed.initialData.players as Player[];
      
      const releaseSet = new Set(playerIds);
      const newPlayers = currentPlayers.map(p => {
        if (releaseSet.has(p.id)) {
          return { ...p, team: 'free_agent' };
        }
        return p;
      });

      parsed.initialData.players = newPlayers;
      await this.setItem('simbaseball_db_schema', JSON.stringify(parsed));
    } catch (error) {
      console.error('Failed to release players to free agency:', error);
    }
  }

  /**
   * 複数のチーム情報を更新する
   */
  async updateTeams(updatedTeams: any[]): Promise<void> {
    try {
      const schemaData = await this.getItem('simbaseball_db_schema');
      if (!schemaData) return;

      const parsed = JSON.parse(schemaData);
      const currentTeams = parsed.initialData.teams as any[];
      
      // 更新対象のIDマップを作成
      const updateMap = new Map(updatedTeams.map((t: any) => [t.id, t]));
      
      const newTeams = currentTeams.map((t: any) => {
        if (updateMap.has(t.id)) {
          return updateMap.get(t.id)!;
        }
        return t;
      });

      parsed.initialData.teams = newTeams;
      await this.setItem('simbaseball_db_schema', JSON.stringify(parsed));
    } catch (error) {
      console.error('Failed to update teams:', error);
    }
  }

  /**
   * チームのロスターを取得
   */
  async getTeamRoster(teamId: string): Promise<any[]> {
    const players = await this.getInitialPlayers();
    const teamPlayers = players.filter(p => p.team === teamId);
    console.log(`getTeamRoster: Found ${teamPlayers.length} players for team ${teamId}`);
    
    if (teamPlayers.length === 0) {
      console.warn(`No players found for team ${teamId}. Total players in DB: ${players.length}`);
    }

    return teamPlayers;
  }

  /**
   * スターティングラインナップを取得
   * Excelのロジックに基づいて決定する
   */
  async getStartingLineup(teamId: string, providedRoster?: any[], gameDate: number = 1): Promise<{ batters: any[], pitcher: any }> {
    const roster = providedRoster || await this.getTeamRoster(teamId);
    
    // 1. 投手選出 (ローテーション + 疲労考慮)
    let pitcher = null;
    const pitchers = roster.filter(p => p.position === 'P' || p.position === '投');
    
    // 先発適性のある投手を優先
    const starterCandidates = pitchers.filter(p => {
        if (p.starter_aptitude !== undefined) {
            return p.starter_aptitude >= 3 && (p.abilities.stamina || 0) >= 8;
        }
        return (p.abilities.stamina || 0) >= 10;
    });

    const candidates = starterCandidates.length > 0 ? starterCandidates : pitchers;
    const fatigueThreshold = 5;
    const availablePitchers = candidates.filter(p => (p.fatigue || 0) < fatigueThreshold);
    
    if (availablePitchers.length > 0) {
        availablePitchers.sort((a, b) => {
            const fatigueDiff = (a.fatigue || 0) - (b.fatigue || 0);
            if (Math.abs(fatigueDiff) > 1) return fatigueDiff;
            
            const aptA = a.starter_aptitude || 0;
            const aptB = b.starter_aptitude || 0;
            if (Math.abs(aptA - aptB) > 0) return aptB - aptA;

            const scoreA = (a.abilities.control || 0) + (a.abilities.stamina || 0) + (a.abilities.speed || 0);
            const scoreB = (b.abilities.control || 0) + (b.abilities.stamina || 0) + (b.abilities.speed || 0);
            return scoreB - scoreA;
        });
        pitcher = availablePitchers[0];
    } else {
        candidates.sort((a, b) => (a.fatigue || 0) - (b.fatigue || 0));
        pitcher = candidates[0];
    }
    
    if (!pitcher) {
        pitcher = roster.find(p => p.position === 'P' || p.position === '投') || roster[roster.length - 1];
    }

    // 2. 野手スタメン選出 (Excelロジック)
    // まず、各ポジションのベストプレイヤーを選出する
    const fielders = roster.filter(p => p.position !== 'P' && p.position !== '投' && p.id !== pitcher?.id);
    const starters = this.selectBestStarters(fielders);
    
    // 3. 打順決定 (Excelロジック: 逐次グリーディ法)
    const orderedBatters = this.optimizeBattingOrder(starters);

    return { batters: orderedBatters, pitcher };
  }

  /**
   * 各ポジションのベストプレイヤーを選出する
   */
  private selectBestStarters(fielders: any[]): any[] {
      const positions = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
      const selectedPlayers: any[] = [];
      const usedPlayerIds = new Set<string | number>();

      // DHありと仮定 (パ・リーグ仕様)
      // まず守備位置を埋める
      const defensivePositions = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
      
      // ポジションごとの適性マップ
      const posMap: Record<string, string> = {
          'C': 'catcher', '1B': 'first', '2B': 'second', '3B': 'third',
          'SS': 'short', 'LF': 'outfield', 'CF': 'outfield', 'RF': 'outfield'
      };

      for (const pos of defensivePositions) {
          const aptitudeKey = posMap[pos];
          
          // 候補者: まだ選ばれていない選手
          const candidates = fielders.filter(p => !usedPlayerIds.has(p.id));
          
          if (candidates.length === 0) break;

          // スコアリング: 守備適性 + 守備力 + 打撃力(少し)
          // 守備重視
          candidates.sort((a, b) => {
              const aptA = a.aptitudes ? (a.aptitudes[aptitudeKey] || 0) : 0;
              const aptB = b.aptitudes ? (b.aptitudes[aptitudeKey] || 0) : 0;
              
              const defA = (a.abilities.fielding || 0) + (a.abilities.arm || 0) * 0.5;
              const defB = (b.abilities.fielding || 0) + (b.abilities.arm || 0) * 0.5;
              
              // 適性が低い(C以下)場合はペナルティ大
              const penA = aptA < 3 ? (3 - aptA) * 10 : 0;
              const penB = aptB < 3 ? (3 - aptB) * 10 : 0;

              // 打撃力も考慮 (少し)
              // calculatePlayerBattingScoreにはランダム要素(調子)も含まれるため、
              // これにより野手もローテーションされるようになる
              const batA = this.calculatePlayerBattingScore(a);
              const batB = this.calculatePlayerBattingScore(b);

              const scoreA = (aptA * 2) + defA - penA + (batA * 0.15);
              const scoreB = (aptB * 2) + defB - penB + (batB * 0.15);
              
              return scoreB - scoreA;
          });

          const best = candidates[0];
          if (best) {
              selectedPlayers.push({ ...best, position: pos });
              usedPlayerIds.add(best.id);
          }
      }

      // DH選出 (残りの選手で最も打撃力が高い選手)
      const dhCandidates = fielders.filter(p => !usedPlayerIds.has(p.id));
      if (dhCandidates.length > 0) {
          dhCandidates.sort((a, b) => {
              const scoreA = this.calculatePlayerBattingScore(a);
              const scoreB = this.calculatePlayerBattingScore(b);
              return scoreB - scoreA;
          });
          const bestDH = dhCandidates[0];
          selectedPlayers.push({ ...bestDH, position: 'DH' });
          usedPlayerIds.add(bestDH.id);
      }

      return selectedPlayers;
  }

  /**
   * 打順を最適化する (Excelロジック再現)
   */
  private optimizeBattingOrder(starters: any[]): any[] {
      const ordered: any[] = [];
      const remaining = [...starters];
      
      // 1番から9番まで順番に決定
      for (let slot = 1; slot <= 9; slot++) {
          if (remaining.length === 0) break;

          let bestPlayerIndex = -1;
          let maxScore = -9999;

          for (let i = 0; i < remaining.length; i++) {
              const player = remaining[i];
              const score = this.calculateExcelBattingScore(player, slot);
              
              if (score > maxScore) {
                  maxScore = score;
                  bestPlayerIndex = i;
              }
          }

          if (bestPlayerIndex !== -1) {
              ordered.push(remaining[bestPlayerIndex]);
              remaining.splice(bestPlayerIndex, 1);
          }
      }
      
      return ordered;
  }

  /**
   * Excelの計算式に基づいた打順スコア計算
   */
  private calculateExcelBattingScore(player: any, slot: number): number {
      const ab = player.abilities || {};
      const contact = parseFloat(ab.contact || 0);
      const eye = parseFloat(ab.eye || 0);
      const power = parseFloat(ab.power || 0);
      const speed = parseFloat(ab.speed || 0);
      const bunt = parseFloat(ab.bunt || 0); // 新しく追加した属性
      
      // 定数 (Excelの [.B$90] など)
      const W1 = 1.0; 
      
      switch (slot) {
          case 1: // 1番: 巧打, 選球眼, 走力
              return (contact * 2 + eye + speed * 2) * 1.5;
          
          case 2: // 2番: 巧打, 選球眼, 走力, バント
              return (contact * 1.5 + eye * 1.5 + speed + bunt) * 1.5;
          
          case 3: // 3番: 巧打, 長打, 選球眼
              return (contact - 3) * 8 + eye + power * 3;
          
          case 4: // 4番: 長打, 巧打 (複雑な式を近似)
              // Excel: (([.C191]*2-ABS(10-[.C191])-5+[.B$91]*2)*([.E191]*2-ABS(10-[.E191]))*([.B$91]/1.5))/([.B$91]*2)+[.D191]/5-[.F191]
              // 近似: (Contact * 2 + Power * 3) * 2
              return (contact * 2 + power * 3) * 2 + (eye / 5) - speed;
          
          case 5: // 5番: 長打, 巧打
              return (contact + eye / 3 + power * 2) * 2;
          
          case 6: // 6番: バランス
              return (contact + eye / 3 + power) * 2;
          
          case 7: // 7番: バランス (6番より少し低い評価になる傾向)
              return (contact + eye / 3 + power) * 2 - 1;
          
          case 8: // 8番: バランス
              return (contact + eye / 3 + power) * 2 - 2;
          
          case 9: // 9番: その他 (Excelでは固定値1だが、ここでは残りの中でマシな選手を選ぶためにスコア計算する)
              return (contact + eye + power + speed);
          
          default:
              return 0;
      }
  }


  /**
   * 打撃評価スコアを計算
   */
  private calculatePlayerBattingScore(player: any): number {
      const abilities = player.abilities || player;
      const contact = parseFloat(abilities.contact || 0);
      const power = parseFloat(abilities.power || 0);
      const eye = parseFloat(abilities.eye || 0);
      
      // 基礎能力 (Contact重視)
      let score = (contact * 1.5) + power + (eye * 0.5);
      
      // 調子（ランダム要素）を追加 (0〜15の乱数)
      // これにより、能力が少し劣る選手や不調の選手でも、たまに起用されるようになる
      score += Math.random() * 15;

      // 成績補正
      // 打席数が少ないうちは成績による変動を抑える (10 -> 30)
      if (player.stats && player.stats.atBats > 30) {
          // 打率
          // 係数を下げる (50 -> 25)
          score += (player.stats.average * 25); 
          
          // OPS的な要素
          const hits = player.stats.hits || 0;
          const doubles = player.stats.doubles || 0;
          const triples = player.stats.triples || 0;
          const homeRuns = player.stats.homeRuns || 0;
          const atBats = player.stats.atBats || 1;
          const walks = player.stats.walks || 0;
          
          const obp = (hits + walks) / (atBats + walks) || 0;
          const slg = (hits + doubles + triples*2 + homeRuns*3) / atBats || 0;
          
          // 係数を下げる (20 -> 10)
          score += ((obp + slg) * 10);
      }
      
      return score;
  }

  /**
   * ゲーム状態を保存
   */
  async saveGameState(gameState: any): Promise<void> {
    try {
      await this.setItem(
        'simbaseball_game_state',
        JSON.stringify(gameState)
      );
    } catch (error) {
      console.error('Failed to save game state:', error);
      throw error;
    }
  }

  /**
   * ゲーム状態を読み込み
   */
  async loadGameState(): Promise<any | null> {
    try {
      const stateData = await this.getItem('simbaseball_game_state');
      return stateData ? JSON.parse(stateData) : null;
    } catch (error) {
      console.error('Failed to load game state:', error);
      return null;
    }
  }

  /**
   * ゲーム履歴を保存
   */
  async saveGameHistory(gameResult: any): Promise<void> {
    try {
      const historyKey = `simbaseball_game_history_${gameResult.id}`;
      await this.setItem(historyKey, JSON.stringify(gameResult));

      // 履歴リストを更新
      const historyList = await this.getItem('simbaseball_game_history_list');
      const list = historyList ? JSON.parse(historyList) : [];
      list.push(gameResult.id);

      await this.setItem(
        'simbaseball_game_history_list',
        JSON.stringify(list)
      );
    } catch (error) {
      console.error('Failed to save game history:', error);
      throw error;
    }
  }

  /**
   * 古いシーズンの試合履歴を削除する
   */
  async cleanupOldGameHistory(currentSeason: number): Promise<void> {
    try {
      const historyListStr = await this.getItem('simbaseball_game_history_list');
      if (!historyListStr) return;
      
      const list = JSON.parse(historyListStr) as string[];
      const keepList: string[] = [];
      const removeKeys: string[] = [];

      for (const id of list) {
          const key = `simbaseball_game_history_${id}`;
          const itemStr = await this.getItem(key);
          if (itemStr) {
              try {
                  const item = JSON.parse(itemStr);
                  if (item.season === currentSeason) {
                      keepList.push(id);
                  } else {
                      removeKeys.push(key);
                  }
              } catch (e) {
                  removeKeys.push(key);
              }
          }
      }
      
      if (removeKeys.length > 0) {
          await this.multiRemove(removeKeys);
          await this.setItem('simbaseball_game_history_list', JSON.stringify(keepList));
          console.log(`Cleaned up ${removeKeys.length} old game history items.`);
      }
    } catch (error) {
        console.error('Failed to cleanup old history:', error);
    }
  }

  /**
   * ゲーム履歴を取得
   */
  async loadGameHistory(): Promise<any[]> {
    try {
      const historyList = await this.getItem('simbaseball_game_history_list');
      if (!historyList) return [];

      const list = JSON.parse(historyList);
      const results = [];

      for (const id of list) {
        const gameData = await this.getItem(`simbaseball_game_history_${id}`);
        if (gameData) {
          results.push(JSON.parse(gameData));
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to load game history:', error);
      return [];
    }
  }

  /**
   * 試合結果に基づいてチームの成績を更新
   */
  async updateTeamStats(gameResult: GameResult): Promise<void> {
    try {
      const teams = await this.getInitialTeams();
      const teamMap = new Map(teams.map(t => [t.id, t]));
      let updated = false;

      const homeTeam = teamMap.get(gameResult.homeTeam);
      const awayTeam = teamMap.get(gameResult.awayTeam);

      if (homeTeam && awayTeam) {
        // Initialize records if needed
        if (!homeTeam.record) homeTeam.record = { wins: 0, losses: 0, winPercentage: 0, gamesBack: 0, runs: 0, runsAllowed: 0 };
        if (!awayTeam.record) awayTeam.record = { wins: 0, losses: 0, winPercentage: 0, gamesBack: 0, runs: 0, runsAllowed: 0 };

        homeTeam.record.runs += gameResult.homeScore;
        homeTeam.record.runsAllowed += gameResult.awayScore;
        awayTeam.record.runs += gameResult.awayScore;
        awayTeam.record.runsAllowed += gameResult.homeScore;

        if (gameResult.homeScore > gameResult.awayScore) {
          homeTeam.record.wins++;
          awayTeam.record.losses++;
        } else if (gameResult.awayScore > gameResult.homeScore) {
          awayTeam.record.wins++;
          homeTeam.record.losses++;
        } else {
          // Draw
          homeTeam.record.draws = (homeTeam.record.draws || 0) + 1;
          awayTeam.record.draws = (awayTeam.record.draws || 0) + 1;
        }

        // Calculate Win %
        const calcWinPct = (record: any) => {
          const total = record.wins + record.losses;
          return total > 0 ? record.wins / total : 0;
        };

        homeTeam.record.winPercentage = calcWinPct(homeTeam.record);
        awayTeam.record.winPercentage = calcWinPct(awayTeam.record);

        updated = true;
      }

      if (updated) {
        // Save back to AsyncStorage
        const schemaData = await this.getItem('simbaseball_db_schema');
        if (schemaData) {
          const parsed = JSON.parse(schemaData);
          parsed.initialData.teams = Array.from(teamMap.values());
          await this.setItem('simbaseball_db_schema', JSON.stringify(parsed));
        }
      }
    } catch (error) {
      console.error('Failed to update team stats:', error);
    }
  }

  /**
   * タイトル履歴を保存
   */
  async saveTitle(title: Title): Promise<void> {
    try {
      const schemaData = await this.getItem('simbaseball_db_schema');
      if (schemaData) {
        const parsed = JSON.parse(schemaData);
        if (!parsed.initialData.titles) {
          parsed.initialData.titles = [];
        }
        // ID付与
        const newTitle = { ...title, id: parsed.initialData.titles.length + 1 };
        parsed.initialData.titles.push(newTitle);
        await this.setItem('simbaseball_db_schema', JSON.stringify(parsed));
      }
    } catch (error) {
      console.error('Failed to save title:', error);
    }
  }

  /**
   * 指定年度のタイトル一覧を取得
   */
  async getTitlesByYear(year: number): Promise<Title[]> {
    try {
      const schemaData = await this.getItem('simbaseball_db_schema');
      if (!schemaData) return [];
      
      const parsed = JSON.parse(schemaData);
      const titles = parsed.initialData.titles || [];
      return titles.filter((t: Title) => t.year === year);
    } catch (error) {
      console.error('Failed to get titles:', error);
      return [];
    }
  }

  /**
   * 選手ごとのタイトル履歴を取得
   */
  async getPlayerTitles(playerId: number | string): Promise<Title[]> {
    try {
      const schemaData = await this.getItem('simbaseball_db_schema');
      if (!schemaData) return [];
      
      const parsed = JSON.parse(schemaData);
      const titles = parsed.initialData.titles || [];
      return titles.filter((t: Title) => t.playerId === playerId);
    } catch (error) {
      console.error('Failed to get player titles:', error);
      return [];
    }
  }

  /**
   * 全プレイヤーの派生スタッツ（OBP, SLG, OPSなど）を再計算する
   * データ不整合修正用
   */
  async recalculateAllPlayerStats(): Promise<void> {
    try {
      const players = await this.getInitialPlayers();
      let updated = false;

      players.forEach(player => {
        if (player.stats) {
          // OBP
          const obpNumerator = (player.stats.hits || 0) + (player.stats.walks || 0) + (player.stats.hitByPitch || 0);
          const obpDenominator = (player.stats.atBats || 0) + (player.stats.walks || 0) + (player.stats.hitByPitch || 0) + (player.stats.sacrificeFlies || 0);
          const newObp = obpDenominator > 0 ? obpNumerator / obpDenominator : 0;
          
          if (player.stats.obp !== newObp) {
            player.stats.obp = newObp;
            updated = true;
          }

          // SLG
          const singles = (player.stats.hits || 0) - (player.stats.doubles || 0) - (player.stats.triples || 0) - (player.stats.homeRuns || 0);
          const totalBases = singles + ((player.stats.doubles || 0) * 2) + ((player.stats.triples || 0) * 3) + ((player.stats.homeRuns || 0) * 4);
          const newSlugging = (player.stats.atBats || 0) > 0 ? totalBases / player.stats.atBats : 0;

          if (player.stats.slugging !== newSlugging) {
            player.stats.slugging = newSlugging;
            updated = true;
          }

          // OPS
          const newOps = (player.stats.obp || 0) + (player.stats.slugging || 0);
          if (player.stats.ops !== newOps) {
            player.stats.ops = newOps;
            updated = true;
          }

          // Pitching Stats Recalculation
          if (player.stats.inningsPitched && player.stats.inningsPitched > 0) {
             // ERA
             const newEra = (player.stats.earnedRuns * 9) / player.stats.inningsPitched;
             if (player.stats.era !== newEra) {
                 player.stats.era = newEra;
                 updated = true;
             }
             
             // WHIP
             const newWhip = ((player.stats.pitchingWalks || 0) + (player.stats.pitchingHits || 0)) / player.stats.inningsPitched;
             if (player.stats.whip !== newWhip) {
                 player.stats.whip = newWhip;
                 updated = true;
             }

             // K/9
             const newK9 = (player.stats.strikeOuts * 9) / player.stats.inningsPitched;
             if (player.stats.k9 !== newK9) {
                 player.stats.k9 = newK9;
                 updated = true;
             }

             // BB/9
             const newBb9 = (player.stats.pitchingWalks * 9) / player.stats.inningsPitched;
             if (player.stats.bb9 !== newBb9) {
                 player.stats.bb9 = newBb9;
                 updated = true;
             }
          }
        }
      });

      if (updated) {
        console.log('Recalculated stats for players.');
        const schemaData = await this.getItem('simbaseball_db_schema');
        if (schemaData) {
            const parsed = JSON.parse(schemaData);
            parsed.initialData.players = players;
            await this.setItem('simbaseball_db_schema', JSON.stringify(parsed));
        }
      }
    } catch (error) {
      console.error('Failed to recalculate stats:', error);
    }
  }

  /**
   * 試合結果に基づいてプレイヤーの成績を更新
   */
  /**
   * バッチ処理でスタッツを更新 (パフォーマンス向上)
   */
  async updateStatsBatch(gameResults: GameResult[]): Promise<void> {
    try {
      const players = await this.getInitialPlayers();
      const teams = await this.getInitialTeams();
      const playerMap = new Map(players.map(p => [p.id, p]));
      const teamMap = new Map(teams.map(t => [t.id, t]));
      let playersUpdated = false;
      let teamsUpdated = false;

      for (const gameResult of gameResults) {
        // レギュラーシーズン以外の試合は、通常のチーム成績・個人成績には加算しない
        // (ポストシーズン成績として別途管理するか、単に加算しない)
        if (gameResult.type && gameResult.type !== 'regular') {
            continue;
        }

        // --- Update Team Stats ---
        const homeTeam = teamMap.get(gameResult.homeTeam);
        const awayTeam = teamMap.get(gameResult.awayTeam);

        if (homeTeam && awayTeam) {
          if (!homeTeam.record) homeTeam.record = { wins: 0, losses: 0, winPercentage: 0, gamesBack: 0, runs: 0, runsAllowed: 0 };
          if (!awayTeam.record) awayTeam.record = { wins: 0, losses: 0, winPercentage: 0, gamesBack: 0, runs: 0, runsAllowed: 0 };

          homeTeam.record.runs += gameResult.homeScore;
          homeTeam.record.runsAllowed += gameResult.awayScore;
          awayTeam.record.runs += gameResult.awayScore;
          awayTeam.record.runsAllowed += gameResult.homeScore;

          if (gameResult.homeScore > gameResult.awayScore) {
            homeTeam.record.wins++;
            awayTeam.record.losses++;
          } else if (gameResult.awayScore > gameResult.homeScore) {
            awayTeam.record.wins++;
            homeTeam.record.losses++;
          } else {
            homeTeam.record.draws = (homeTeam.record.draws || 0) + 1;
            awayTeam.record.draws = (awayTeam.record.draws || 0) + 1;
          }

          const calcWinPct = (record: any) => {
            const total = record.wins + record.losses;
            return total > 0 ? record.wins / total : 0;
          };
          homeTeam.record.winPercentage = calcWinPct(homeTeam.record);
          awayTeam.record.winPercentage = calcWinPct(awayTeam.record);
          teamsUpdated = true;
        }

        // --- Update Player Stats ---
        if (gameResult.details) {
          const updateStats = (gameStats: PlayerGameStats[]) => {
            gameStats.forEach(gs => {
              const player = playerMap.get(gs.playerId);
              if (player) {
                if (!player.stats) player.stats = {};
                
                // Batting
                player.stats.gamesPlayed = (player.stats.gamesPlayed || 0) + 1;
                player.stats.plateAppearances = (player.stats.plateAppearances || 0) + (gs.plateAppearances || 0);
                player.stats.hits = (player.stats.hits || 0) + (gs.hits || 0);
                player.stats.atBats = (player.stats.atBats || 0) + (gs.atBats || 0);
                player.stats.doubles = (player.stats.doubles || 0) + (gs.doubles || 0);
                player.stats.triples = (player.stats.triples || 0) + (gs.triples || 0);
                player.stats.homeRuns = (player.stats.homeRuns || 0) + (gs.homeRuns || 0);
                player.stats.rbi = (player.stats.rbi || 0) + (gs.rbi || 0);
                player.stats.stolenBases = (player.stats.stolenBases || 0) + (gs.stolenBases || 0);
                player.stats.caughtStealing = (player.stats.caughtStealing || 0) + (gs.caughtStealing || 0);
                player.stats.walks = (player.stats.walks || 0) + (gs.walks || 0);
                player.stats.hitByPitch = (player.stats.hitByPitch || 0) + (gs.hitByPitch || 0);
                player.stats.sacrificeBunts = (player.stats.sacrificeBunts || 0) + (gs.sacrificeBunts || 0);
                player.stats.sacrificeFlies = (player.stats.sacrificeFlies || 0) + (gs.sacrificeFlies || 0);
                player.stats.batterStrikeouts = (player.stats.batterStrikeouts || 0) + (gs.strikeouts || 0);
                player.stats.doublePlays = (player.stats.doublePlays || 0) + (gs.doublePlays || 0);
                player.stats.errors = (player.stats.errors || 0) + (gs.errors || 0);
                player.stats.uzr = (player.stats.uzr || 0) + (gs.uzrChange || 0);
                player.stats.ubr = (player.stats.ubr || 0) + (gs.ubrChange || 0);
                
                // Calculate derived stats
                if (player.stats.atBats > 0) {
                  player.stats.average = player.stats.hits / player.stats.atBats;
                } else {
                  player.stats.average = 0;
                }

                const onBase = (player.stats.hits || 0) + (player.stats.walks || 0) + (player.stats.hitByPitch || 0);
                const plateApps = (player.stats.atBats || 0) + (player.stats.walks || 0) + (player.stats.hitByPitch || 0) + (player.stats.sacrificeFlies || 0);
                player.stats.obp = plateApps > 0 ? onBase / plateApps : 0;

                const singles = (player.stats.hits || 0) - ((player.stats.doubles || 0) + (player.stats.triples || 0) + (player.stats.homeRuns || 0));
                player.stats.singles = singles;
                const totalBases = singles + ((player.stats.doubles || 0) * 2) + ((player.stats.triples || 0) * 3) + ((player.stats.homeRuns || 0) * 4);
                player.stats.slugging = (player.stats.atBats || 0) > 0 ? totalBases / player.stats.atBats : 0;

                player.stats.ops = (player.stats.obp || 0) + (player.stats.slugging || 0);

                // WAR計算
                player.stats.war = calculateWAR(player, player.stats);

                // Pitching
                // 登板判定: イニングを投げたか、登板順が記録されているか、先発フラグがあるか
                const hasPitched = (gs.inningsPitched && gs.inningsPitched > 0) || gs.pitchingOrder !== undefined || gs.isStarter;

                if (hasPitched) {
                  player.stats.gamesPitched = (player.stats.gamesPitched || 0) + 1;
                  
                  if (gs.isStarter) {
                    player.stats.gamesStarted = (player.stats.gamesStarted || 0) + 1;
                  }
                  
                  if (gs.qualityStart) {
                    player.stats.qualityStarts = (player.stats.qualityStarts || 0) + 1;
                  }

                  player.stats.inningsPitched = (player.stats.inningsPitched || 0) + (gs.inningsPitched || 0);
                  player.stats.earnedRuns = (player.stats.earnedRuns || 0) + (gs.earnedRuns || 0);
                  player.stats.runsAllowed = (player.stats.runsAllowed || 0) + (gs.runsAllowed || 0); // 失点
                  player.stats.strikeOuts = (player.stats.strikeOuts || 0) + (gs.pitchingStrikeouts || 0);
                  player.stats.pitchingWalks = (player.stats.pitchingWalks || 0) + (gs.pitchingWalks || 0);
                  player.stats.pitchingHits = (player.stats.pitchingHits || 0) + (gs.pitchingHits || 0);
                  player.stats.pitchingHomeRuns = (player.stats.pitchingHomeRuns || 0) + (gs.pitchingHomeRuns || 0);
                  player.stats.pitchingHitByPitch = (player.stats.pitchingHitByPitch || 0) + (gs.pitchingHitByPitch || 0);
                  player.stats.wins = (player.stats.wins || 0) + (gs.wins || 0);
                  player.stats.losses = (player.stats.losses || 0) + (gs.losses || 0);
                  player.stats.saves = (player.stats.saves || 0) + (gs.saves || 0);
                  player.stats.completeGames = (player.stats.completeGames || 0) + (gs.completeGame ? 1 : 0);
                  player.stats.shutouts = (player.stats.shutouts || 0) + (gs.shutout ? 1 : 0);
                  
                  // Derived Pitching Stats
                  if (player.stats.inningsPitched > 0) {
                    player.stats.era = (player.stats.earnedRuns * 9) / player.stats.inningsPitched;
                    player.stats.whip = ((player.stats.pitchingWalks || 0) + (player.stats.pitchingHits || 0)) / player.stats.inningsPitched;
                    player.stats.k9 = (player.stats.strikeOuts * 9) / player.stats.inningsPitched;
                    player.stats.bb9 = (player.stats.pitchingWalks * 9) / player.stats.inningsPitched;
                  }

                  // Fatigue Calculation
                  // 疲労度を加算 (ローテーション用)
                  // 球数ベースで計算
                  // スタミナによる軽減を導入: スタミナ15で疲労30%軽減
                  const baseFatigue = gs.isStarter ? 0 : 3.3; // リリーフは基本疲労3.3
                  const pitchCount = gs.pitchCount || ((gs.inningsPitched || 0) * 15);
                  const fatigueDivisor = 4.5; // 100球で20疲労 -> 中5-6日ペースに戻す
                  
                  // スタミナ(0-15)による軽減
                  // スタミナ15 -> 0.7倍
                  // スタミナ0 -> 1.0倍
                  const staminaFactor = 1 - ((player.abilities.stamina || 0) / 15) * 0.3;
                  
                  player.fatigue = (player.fatigue || 0) + baseFatigue + ((pitchCount / fatigueDivisor) * Math.max(0.7, staminaFactor));
                }
              }
            });
          };

          updateStats(gameResult.details.homeBatting);
          updateStats(gameResult.details.awayBatting);
          updateStats(gameResult.details.homePitching);
          updateStats(gameResult.details.awayPitching);
          playersUpdated = true;
        }
      }

      if (playersUpdated || teamsUpdated) {
        const schemaData = await this.getItem('simbaseball_db_schema');
        if (schemaData) {
          const parsed = JSON.parse(schemaData);
          if (playersUpdated) parsed.initialData.players = Array.from(playerMap.values());
          if (teamsUpdated) parsed.initialData.teams = Array.from(teamMap.values());
          await this.setItem('simbaseball_db_schema', JSON.stringify(parsed));
        }
      }
    } catch (error) {
      console.error('Failed to update stats batch:', error);
    }
  }

  async updatePlayerStats(gameResult: GameResult): Promise<void> {
    if (!gameResult.details) return;
    
    try {
      const players = await this.getInitialPlayers();
      const playerMap = new Map(players.map(p => [p.id, p]));
      let updated = false;

      const updateStats = (gameStats: PlayerGameStats[]) => {
          gameStats.forEach(gs => {
              const player = playerMap.get(gs.playerId);
              if (player) {
                  // Update stats
                  if (!player.stats) player.stats = {};
                  
                  // Batting
                  player.stats.gamesPlayed = (player.stats.gamesPlayed || 0) + 1;
                  player.stats.plateAppearances = (player.stats.plateAppearances || 0) + (gs.plateAppearances || 0);
                  player.stats.hits = (player.stats.hits || 0) + (gs.hits || 0);
                  player.stats.atBats = (player.stats.atBats || 0) + (gs.atBats || 0);
                  player.stats.doubles = (player.stats.doubles || 0) + (gs.doubles || 0);
                  player.stats.triples = (player.stats.triples || 0) + (gs.triples || 0);
                  player.stats.homeRuns = (player.stats.homeRuns || 0) + (gs.homeRuns || 0);
                  player.stats.rbi = (player.stats.rbi || 0) + (gs.rbi || 0);
                  player.stats.stolenBases = (player.stats.stolenBases || 0) + (gs.stolenBases || 0);
                  player.stats.caughtStealing = (player.stats.caughtStealing || 0) + (gs.caughtStealing || 0);
                  player.stats.walks = (player.stats.walks || 0) + (gs.walks || 0);
                  player.stats.hitByPitch = (player.stats.hitByPitch || 0) + (gs.hitByPitch || 0);
                  player.stats.sacrificeBunts = (player.stats.sacrificeBunts || 0) + (gs.sacrificeBunts || 0);
                  player.stats.sacrificeFlies = (player.stats.sacrificeFlies || 0) + (gs.sacrificeFlies || 0);
                  player.stats.batterStrikeouts = (player.stats.batterStrikeouts || 0) + (gs.strikeouts || 0);
                  player.stats.doublePlays = (player.stats.doublePlays || 0) + (gs.doublePlays || 0);
                  player.stats.errors = (player.stats.errors || 0) + (gs.errors || 0);
                  
                  // Calculate derived stats
                  if (player.stats.atBats > 0) {
                      player.stats.average = player.stats.hits / player.stats.atBats;
                  } else {
                      player.stats.average = 0;
                  }

                  // OBP = (H + BB + HBP) / (AB + BB + HBP + SF)
                  const obpNumerator = (player.stats.hits || 0) + (player.stats.walks || 0) + (player.stats.hitByPitch || 0);
                  const obpDenominator = (player.stats.atBats || 0) + (player.stats.walks || 0) + (player.stats.hitByPitch || 0) + (player.stats.sacrificeFlies || 0);
                  player.stats.obp = obpDenominator > 0 ? obpNumerator / obpDenominator : 0;

                  // SLG = (1B + 2B*2 + 3B*3 + HR*4) / AB
                  const singles = (player.stats.hits || 0) - (player.stats.doubles || 0) - (player.stats.triples || 0) - (player.stats.homeRuns || 0);
                  const totalBases = singles + ((player.stats.doubles || 0) * 2) + ((player.stats.triples || 0) * 3) + ((player.stats.homeRuns || 0) * 4);
                  player.stats.slugging = (player.stats.atBats || 0) > 0 ? totalBases / player.stats.atBats : 0;

                  // OPS
                  player.stats.ops = player.stats.obp + player.stats.slugging;

                  // Pitching
                  const hasPitched = (gs.inningsPitched && gs.inningsPitched > 0) || gs.pitchingOrder !== undefined || gs.isStarter;

                  if (hasPitched) {
                      player.stats.gamesPitched = (player.stats.gamesPitched || 0) + 1;
                      if (gs.isStarter) {
                          player.stats.gamesStarted = (player.stats.gamesStarted || 0) + 1;
                      }
                      if (gs.completeGame) {
                          player.stats.completeGames = (player.stats.completeGames || 0) + 1;
                      }
                      if (gs.shutout) {
                          player.stats.shutouts = (player.stats.shutouts || 0) + 1;
                      }
                      if (gs.qualityStart) {
                          player.stats.qualityStarts = (player.stats.qualityStarts || 0) + 1;
                      }

                      player.stats.inningsPitched = (player.stats.inningsPitched || 0) + (gs.inningsPitched || 0);
                      player.stats.earnedRuns = (player.stats.earnedRuns || 0) + (gs.earnedRuns || 0);
                      player.stats.strikeOuts = (player.stats.strikeOuts || 0) + (gs.pitchingStrikeouts || 0);
                      player.stats.pitchingWalks = (player.stats.pitchingWalks || 0) + (gs.pitchingWalks || 0);
                      player.stats.pitchingHits = (player.stats.pitchingHits || 0) + (gs.pitchingHits || 0);
                      player.stats.pitchingHomeRuns = (player.stats.pitchingHomeRuns || 0) + (gs.pitchingHomeRuns || 0);
                      player.stats.pitchingHitByPitch = (player.stats.pitchingHitByPitch || 0) + (gs.pitchingHitByPitch || 0);
                      
                      player.stats.wins = (player.stats.wins || 0) + (gs.wins || 0);
                      player.stats.losses = (player.stats.losses || 0) + (gs.losses || 0);
                      player.stats.saves = (player.stats.saves || 0) + (gs.saves || 0);
                      
                      if (player.stats.inningsPitched > 0) {
                          // ERA = (ER * 9) / IP
                          player.stats.era = (player.stats.earnedRuns * 9) / player.stats.inningsPitched;
                          
                          // WHIP = (Walks + Hits) / IP
                          player.stats.whip = ((player.stats.pitchingWalks || 0) + (player.stats.pitchingHits || 0)) / player.stats.inningsPitched;

                          // K/9 = (Strikeouts * 9) / IP
                          player.stats.k9 = (player.stats.strikeOuts * 9) / player.stats.inningsPitched;

                          // BB/9 = (Walks * 9) / IP
                          player.stats.bb9 = (player.stats.pitchingWalks * 9) / player.stats.inningsPitched;
                      }

                      // Increase Fatigue
                      // 1 Inning = 4 Fatigue.
                      // リリーフの場合は登板するだけで疲労が溜まる (肩を作るなど)
                      // 登板固定疲労: 2 + イニング * 4
                      // 例: 1回投げると 2 + 4 = 6疲労 (2日で回復)
                      // 例: 0/3回(ワンポイント)でも 2疲労
                      
                      // 変更: 球数ベースの疲労計算
                      // 目標: 優秀な先発投手が年間25試合程度登板する (中6日ペース)
                      // 100球投げた場合 -> 中6日(5日休養)で回復させたい
                      // 回復力: 3/日 -> 5日で15回復
                      // 100球 / X = 15 -> X = 6.66
                      // 係数を 7 とすると、100/7 = 14.2 -> 5日必要 (中5日) -> 年間24-25試合
                      
                      const pitchCount = gs.pitchCount || ((gs.inningsPitched || 0) * 15); // フォールバック: 1回15球
                      const fatigueDivisor = 5;
                      // リリーフの登板固定疲労を増加 (2 -> 4)
                      // これにより連投が難しくなり、登板数が抑制される
                      const baseFatigue = gs.isStarter ? 0 : 4; 
                      
                      // スタミナによる軽減 (0-15)
                      const staminaFactor = 1 - ((player.abilities.stamina || 0) / 15) * 0.3;
                      const fatigueAdded = (pitchCount / fatigueDivisor) * Math.max(0.7, staminaFactor);

                      player.fatigue = (player.fatigue || 0) + baseFatigue + fatigueAdded;
                  }
                  
                  updated = true;
              }
          });
      };

      updateStats(gameResult.details.homeBatting);
      updateStats(gameResult.details.awayBatting);
      updateStats(gameResult.details.homePitching);
      updateStats(gameResult.details.awayPitching);

      if (updated) {
        // Save back to DB
        const schemaData = await this.getItem('simbaseball_db_schema');
        if (schemaData) {
            const parsed = JSON.parse(schemaData);
            parsed.initialData.players = Array.from(playerMap.values());
            await this.setItem('simbaseball_db_schema', JSON.stringify(parsed));
        }
      }
    } catch (error) {
      console.error('Failed to update player stats:', error);
    }
  }

  /**
   * 全選手の疲労を回復させる (1日経過)
   */
  async recoverDailyFatigue(): Promise<void> {
    try {
      const players = await this.getInitialPlayers();
      let updated = false;

      players.forEach(p => {
        if (p.fatigue && p.fatigue > 0) {
            const recovery = p.recovery || 3; // Default recovery
            p.fatigue = Math.max(0, p.fatigue - recovery);
            updated = true;
        }
      });

      if (updated) {
        const schemaData = await this.getItem('simbaseball_db_schema');
        if (schemaData) {
            const parsed = JSON.parse(schemaData);
            parsed.initialData.players = players;
            await this.setItem('simbaseball_db_schema', JSON.stringify(parsed));
        }
      }
    } catch (error) {
      console.error('Failed to recover fatigue:', error);
    }
  }

  /**
   * プレイヤーデータを保存
   */
  async savePlayers(players: Player[]): Promise<void> {
    try {
        const schemaData = await this.getItem('simbaseball_db_schema');
        if (schemaData) {
            const parsed = JSON.parse(schemaData);
            parsed.initialData.players = players;
            await this.setItem('simbaseball_db_schema', JSON.stringify(parsed));
        }
    } catch (error) {
        console.error('Failed to save players:', error);
    }
  }

  /**
   * ドラフト候補を保存
   */
  async saveDraftCandidates(candidates: Player[]): Promise<void> {
    try {
      await this.setItem('simbaseball_draft_candidates', JSON.stringify(candidates));
    } catch (error) {
      console.error('Failed to save draft candidates:', error);
      throw error;
    }
  }

  /**
   * ドラフト候補を取得
   */
  async getDraftCandidates(): Promise<Player[]> {
    try {
      const data = await this.getItem('simbaseball_draft_candidates');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get draft candidates:', error);
      return [];
    }
  }

  /**
   * ニュースを追加
   */
  async addNews(newsItems: NewsItem[]): Promise<void> {
      try {
          const schemaData = await this.getItem('simbaseball_db_schema');
          if (schemaData) {
              const parsed = JSON.parse(schemaData);
              if (!parsed.news) parsed.news = [];
              
              // 重複チェック (IDが既に存在する場合は追加しない)
              const existingIds = new Set(parsed.news.map((n: any) => n.id));
              const newItems = newsItems.filter(item => !existingIds.has(item.id));
              
              if (newItems.length > 0) {
                  parsed.news.push(...newItems);
                  await this.setItem('simbaseball_db_schema', JSON.stringify(parsed));
              }
          }
      } catch (error) {
          console.error('Failed to add news:', error);
      }
  }

  /**
   * ニュースを取得
   */
  async getNews(): Promise<NewsItem[]> {
      try {
          const schemaData = await this.getItem('simbaseball_db_schema');
          if (schemaData) {
              const parsed = JSON.parse(schemaData);
              const news = parsed.news || [];
              
              // 重複排除 (念のため)
              const uniqueNews = Array.from(new Map(news.map((item: any) => [item.id, item])).values());
              return uniqueNews as NewsItem[];
          }
          return [];
      } catch (error) {
          console.error('Failed to get news:', error);
          return [];
      }
  }

  /**
   * ニュースを全削除
   */
  async clearNews(): Promise<void> {
      try {
          const schemaData = await this.getItem('simbaseball_db_schema');
          if (schemaData) {
              const parsed = JSON.parse(schemaData);
              parsed.news = [];
              await this.setItem('simbaseball_db_schema', JSON.stringify(parsed));
          }
      } catch (error) {
          console.error('Failed to clear news:', error);
      }
  }

  /**
   * スケジュールを更新
   */
  async updateSchedule(newSchedule: any[]): Promise<void> {
    try {
      const schemaData = await this.getItem('simbaseball_db_schema');
      if (schemaData) {
        const parsed = JSON.parse(schemaData);
        if (!parsed.initialData) parsed.initialData = {};
        parsed.initialData.schedule = newSchedule;
        await this.setItem('simbaseball_db_schema', JSON.stringify(parsed));
      }
    } catch (error) {
      console.error('Failed to update schedule:', error);
    }
  }

  /**
   * ドラフト指名選手を登録
   */
  async registerDraftPlayers(newPlayers: Player[]): Promise<void> {
    try {
      const schemaData = await this.getItem('simbaseball_db_schema');
      if (schemaData) {
        const parsed = JSON.parse(schemaData);
        if (!parsed.initialData) parsed.initialData = {};
        
        // 既存の選手リストに追加
        const currentPlayers = parsed.initialData.players || [];
        parsed.initialData.players = [...currentPlayers, ...newPlayers];
        
        await this.setItem('simbaseball_db_schema', JSON.stringify(parsed));
        console.log(`Registered ${newPlayers.length} drafted players.`);
      }
    } catch (error) {
      console.error('Failed to register draft players:', error);
      throw error;
    }
  }

  /**
   * ポストシーズンのスケジュール生成チェック
   */
  async checkAndGeneratePostSeason(currentDateIndex: number, season: number): Promise<string | null> {
    const schedule = await this.getSchedule();
    const allGameHistory = await this.loadGameHistory();
    const gameHistory = allGameHistory.filter(g => g.season === season);
    
    // 1. レギュラーシーズン終了チェック
    const regularGames = schedule.filter(g => !g.type || g.type === 'regular');
    const regularGamesPlayed = gameHistory.filter(g => !g.type || g.type === 'regular');
    
    // まだレギュラーシーズンが終わっていない
    if (regularGames.length > regularGamesPlayed.length) {
        return null;
    }

    // 2. CS 1st Stage チェック
    const csFirstGames = schedule.filter(g => g.type === 'cs_first');
    if (csFirstGames.length === 0) {
        console.log('Generating CS First Stage schedule...');
        await this.generateCSFirstStage(currentDateIndex, season);
        return 'cs_first_generated';
    }

    // CS 1st 終了チェック
    const csFirstWinners = await this.determineCSFirstWinners(gameHistory, schedule);
    
    // 3. CS Final Stage チェック
    const csFinalGames = schedule.filter(g => g.type === 'cs_final');
    if (csFinalGames.length === 0) {
         if (csFirstWinners) {
             console.log('Generating CS Final Stage schedule...');
             
             // ニュース追加
             const teams = await this.getInitialTeams();
             const getTeamName = (id: string) => teams.find(t => t.id === id)?.name || id;
             
             await this.addNews([{
                 id: `cs_first_result_${currentDateIndex}`,
                 date: currentDateIndex,
                 title: 'CS 1stステージ突破チーム決定',
                 content: `パ・リーグ: ${getTeamName(csFirstWinners.pacific)}\nセ・リーグ: ${getTeamName(csFirstWinners.central)}`,
                 type: 'game',
                 affectedTeams: [csFirstWinners.pacific as TeamId, csFirstWinners.central as TeamId]
             }]);

             // 未消化試合の削除
             const playedIds = new Set(gameHistory.map(g => g.id));
             const newSchedule = schedule.filter(g => {
                 if (g.type !== 'cs_first') return true;
                 const isPlayed = gameHistory.some(h => 
                     getGameDateString(h.date, h.season) === g.date && 
                     h.homeTeam === g.home && 
                     h.awayTeam === g.away
                 );
                 return isPlayed;
             });
             
             await this.updateSchedule(newSchedule);

             await this.generateCSFinalStage(currentDateIndex, season, csFirstWinners);
             return 'cs_final_generated';
         }
         // CS 1st ongoing
         return null;
    }

    // 4. 日本シリーズ チェック
    const nipponSeriesGames = schedule.filter(g => g.type === 'nippon_series');
    if (nipponSeriesGames.length === 0) {
        const csFinalWinners = await this.determineCSFinalWinners(gameHistory, schedule);
        if (csFinalWinners) {
            console.log('Generating Nippon Series schedule...');

            // ニュース追加
            const teams = await this.getInitialTeams();
            const getTeamName = (id: string) => teams.find(t => t.id === id)?.name || id;
            
            await this.addNews([{
                id: `cs_final_result_${currentDateIndex}`,
                date: currentDateIndex,
                title: 'CS ファイナルステージ突破！日本シリーズ進出',
                content: `パ・リーグ: ${getTeamName(csFinalWinners.pacific)}\nセ・リーグ: ${getTeamName(csFinalWinners.central)}`,
                type: 'game',
                affectedTeams: [csFinalWinners.pacific as TeamId, csFinalWinners.central as TeamId]
            }]);

            // 未消化試合の削除 (CS Final)
            const newSchedule = schedule.filter(g => {
                if (g.type !== 'cs_final') return true;
                const isPlayed = gameHistory.some(h => 
                    getGameDateString(h.date, h.season) === g.date && 
                    h.homeTeam === g.home && 
                    h.awayTeam === g.away
                );
                return isPlayed;
            });
            await this.updateSchedule(newSchedule);

            await this.generateNipponSeries(currentDateIndex, season, csFinalWinners);
            return 'nippon_series_generated';
        }
        // CS Final ongoing
        return null;
    } else {
        // 日本シリーズ終了チェック
        const nipponSeriesWinner = await this.determineNipponSeriesWinner(gameHistory, schedule);
        
        // 優勝チームが決まった場合
        if (nipponSeriesWinner) {
             // 既に終了処理済みかチェック
             const news = await this.getNews();
             const seasonNews = news.filter(n => n.title === '日本シリーズ優勝決定！' && n.date > currentDateIndex - 30);
             
             if (seasonNews.length > 0) {
                 return 'season_completed';
             }

             console.log('Nippon Series Finished!');
             
             const teams = await this.getInitialTeams();
             const getTeamName = (id: string) => teams.find(t => t.id === id)?.name || id;

             // シーズン表彰 (タイトル、ベストナイン、GG、MVP)
             const awardNews = await AwardManager.processSeasonAwards(season, currentDateIndex);
             await this.addNews(awardNews);

             await this.addNews([{
                id: `nippon_series_result_${currentDateIndex}`,
                date: currentDateIndex,
                title: '日本シリーズ優勝決定！',
                content: `優勝: ${getTeamName(nipponSeriesWinner)}`,
                type: 'game',
                affectedTeams: [nipponSeriesWinner as TeamId]
            }]);

            // 未消化試合削除
            const newSchedule = schedule.filter(g => {
                if (g.type !== 'nippon_series') return true;
                const isPlayed = gameHistory.some(h => 
                    getGameDateString(h.date, h.season) === g.date && 
                    h.homeTeam === g.home && 
                    h.awayTeam === g.away
                );
                return isPlayed;
            });
            await this.updateSchedule(newSchedule);
            
            return 'season_completed';
        }

        // 優勝チームが決まっていないが、未消化試合がない場合（引き分け等で終了した場合）
        const unplayed = nipponSeriesGames.filter(g => !g.played);
        if (unplayed.length === 0) {
            console.log('Nippon Series finished without clear winner (or tie). Ending season.');
            return 'season_completed';
        }

        // 日本シリーズ進行中
        return null;
    }
  }

  private async determineNipponSeriesWinner(history: any[], schedule: any[]): Promise<string | null> {
      const nsGames = schedule.filter(g => g.type === 'nippon_series');
      if (nsGames.length === 0) return null;

      const played = history.filter(g => g.type === 'nippon_series');
      const wins: Record<string, number> = {};
      
      played.forEach(g => {
          const winner = g.homeScore > g.awayScore ? g.homeTeam : (g.awayScore > g.homeScore ? g.awayTeam : null);
          if (winner) wins[winner] = (wins[winner] || 0) + 1;
      });

      // 4勝したチーム
      const team1 = nsGames[0].home;
      const team2 = nsGames[0].away;
      
      if ((wins[team1] || 0) >= 4) return team1;
      if ((wins[team2] || 0) >= 4) return team2;
      
      // 7戦終了時 (引き分け等で4勝に届かない場合)
      // 勝利数が多い方
      if (played.length >= 7) {
          // 第8戦以降がある場合は別だが、ここでは7戦で判定
           if ((wins[team1] || 0) > (wins[team2] || 0)) return team1;
           if ((wins[team2] || 0) > (wins[team1] || 0)) return team2;
           // 完全同率の場合は引き分け...とりあえずteam1
           return team1;
      }

      return null;
  }

  private async generateCSFirstStage(currentDateIndex: number, season: number) {
      const teams = await this.getInitialTeams();
      const pacific = teams.filter(t => t.league === 'pacific').sort((a, b) => (b.record?.winPercentage || 0) - (a.record?.winPercentage || 0));
      const central = teams.filter(t => t.league === 'central').sort((a, b) => (b.record?.winPercentage || 0) - (a.record?.winPercentage || 0));

      const p2 = pacific[1];
      const p3 = pacific[2];
      const c2 = central[1];
      const c3 = central[2];

      const newGames = [];
      let startDay = currentDateIndex + 3; // 中2日
      
      for (let i = 0; i < 3; i++) {
          const dateStr = getGameDateString(startDay + i, season);
          newGames.push({ date: dateStr, home: p2.id, away: p3.id, type: 'cs_first', gameNumber: i + 1 });
          newGames.push({ date: dateStr, home: c2.id, away: c3.id, type: 'cs_first', gameNumber: i + 1 });
      }

      const schedule = await this.getSchedule();
      await this.updateSchedule([...schedule, ...newGames]);
  }

  private async determineCSFirstWinners(history: any[], schedule: any[]): Promise<{ pacific: string, central: string } | null> {
      const csFirstGames = schedule.filter(g => g.type === 'cs_first');
      if (csFirstGames.length === 0) return null;

      const played = history.filter(g => g.type === 'cs_first');
      const wins: Record<string, number> = {};
      
      // チームごとの勝利数をカウント
      played.forEach(g => {
          const winner = g.homeScore > g.awayScore ? g.homeTeam : (g.awayScore > g.homeScore ? g.awayTeam : null);
          if (winner) wins[winner] = (wins[winner] || 0) + 1;
      });

      // パ・リーグ判定
      const pGames = csFirstGames.filter(g => ['hawks','lions','fighters','buffaloes','eagles','marines'].includes(g.home));
      let pWinner = null;

      if (pGames.length > 0) {
          const pHome = pGames[0].home; // 2位
          const pAway = pGames[0].away; // 3位
          
          if ((wins[pHome] || 0) >= 2) pWinner = pHome;
          else if ((wins[pAway] || 0) >= 2) pWinner = pAway;
          else {
              // 3戦終了 or 決着がついたか確認
              const pPlayedCount = played.filter(g => g.homeTeam === pHome || g.homeTeam === pAway).length;
              
              if (pPlayedCount === 3) {
                  // 3戦終了時: 勝利数が多い方、同数なら上位(Home)
                  if ((wins[pAway] || 0) > (wins[pHome] || 0)) pWinner = pAway;
                  else pWinner = pHome;
              } else if (pPlayedCount === 2) {
                  // 2戦終了時: 1勝1分などで決着がついている場合
                  // 残り1試合で逆転不可能なら終了
                  // Homeが1勝以上なら、残り1試合でAwayが勝っても1勝1敗1分 -> Home勝ち
                  if ((wins[pHome] || 0) >= 1 && (wins[pAway] || 0) === 0) pWinner = pHome;
              }
          }
      }

      // セ・リーグ判定
      const cGames = csFirstGames.filter(g => !['hawks','lions','fighters','buffaloes','eagles','marines'].includes(g.home));
      let cWinner = null;

      if (cGames.length > 0) {
          const cHome = cGames[0].home;
          const cAway = cGames[0].away;
          
          if ((wins[cHome] || 0) >= 2) cWinner = cHome;
          else if ((wins[cAway] || 0) >= 2) cWinner = cAway;
          else {
              const cPlayedCount = played.filter(g => g.homeTeam === cHome || g.homeTeam === cAway).length;
              
              if (cPlayedCount === 3) {
                  if ((wins[cAway] || 0) > (wins[cHome] || 0)) cWinner = cAway;
                  else cWinner = cHome;
              } else if (cPlayedCount === 2) {
                  if ((wins[cHome] || 0) >= 1 && (wins[cAway] || 0) === 0) cWinner = cHome;
              }
          }
      }

      if (pWinner && cWinner) return { pacific: pWinner, central: cWinner };
      return null;
  }

  private async generateCSFinalStage(currentDateIndex: number, season: number, winners: { pacific: string, central: string }) {
      const teams = await this.getInitialTeams();
      const pacific = teams.filter(t => t.league === 'pacific').sort((a, b) => (b.record?.winPercentage || 0) - (a.record?.winPercentage || 0));
      const central = teams.filter(t => t.league === 'central').sort((a, b) => (b.record?.winPercentage || 0) - (a.record?.winPercentage || 0));

      const p1 = pacific[0];
      const c1 = central[0];

      const newGames = [];
      let startDay = currentDateIndex + 3; // 中2日
      
      for (let i = 0; i < 6; i++) {
          const dateStr = getGameDateString(startDay + i, season);
          newGames.push({ date: dateStr, home: p1.id, away: winners.pacific, type: 'cs_final', gameNumber: i + 1 });
          newGames.push({ date: dateStr, home: c1.id, away: winners.central, type: 'cs_final', gameNumber: i + 1 });
      }

      const schedule = await this.getSchedule();
      await this.updateSchedule([...schedule, ...newGames]);
  }

  private async determineCSFinalWinners(history: any[], schedule: any[]): Promise<{ pacific: string, central: string } | null> {
      const csFinalGames = schedule.filter(g => g.type === 'cs_final');
      if (csFinalGames.length === 0) return null;

      const played = history.filter(g => g.type === 'cs_final');
      const wins: Record<string, number> = {};
      
      // パ・リーグ判定
      const pGames = csFinalGames.filter(g => ['hawks','lions','fighters','buffaloes','eagles','marines'].includes(g.home));
      let pWinner = null;
      
      if (pGames.length > 0) {
          const p1 = pGames[0].home;
          const pAway = pGames[0].away;
          
          wins[p1] = 1; // アドバンテージ

          // 勝利数カウント
          played.forEach(g => {
              // この試合がパ・リーグの試合か確認
              if (g.homeTeam === p1 || g.homeTeam === pAway) {
                  const winner = g.homeScore > g.awayScore ? g.homeTeam : (g.awayScore > g.homeScore ? g.awayTeam : null);
                  if (winner) wins[winner] = (wins[winner] || 0) + 1;
              }
          });

          if ((wins[p1] || 0) >= 4) pWinner = p1;
          else if ((wins[pAway] || 0) >= 4) pWinner = pAway;
          else {
              // 全試合終了時の判定
              const pPlayedCount = played.filter(g => g.homeTeam === p1 || g.homeTeam === pAway).length;
              const pScheduledCount = pGames.length;
              
              if (pPlayedCount >= pScheduledCount) {
                  // 勝利数が多い方
                  if ((wins[pAway] || 0) > (wins[p1] || 0)) pWinner = pAway;
                  else pWinner = p1; // 同数なら上位(p1)
              }
          }
      }

      // セ・リーグ判定
      const cGames = csFinalGames.filter(g => !['hawks','lions','fighters','buffaloes','eagles','marines'].includes(g.home));
      let cWinner = null;

      if (cGames.length > 0) {
          const c1 = cGames[0].home;
          const cAway = cGames[0].away;
          
          wins[c1] = 1; // アドバンテージ

          played.forEach(g => {
              if (g.homeTeam === c1 || g.homeTeam === cAway) {
                  const winner = g.homeScore > g.awayScore ? g.homeTeam : (g.awayScore > g.homeScore ? g.awayTeam : null);
                  if (winner) wins[winner] = (wins[winner] || 0) + 1;
              }
          });

          if ((wins[c1] || 0) >= 4) cWinner = c1;
          else if ((wins[cAway] || 0) >= 4) cWinner = cAway;
          else {
              const cPlayedCount = played.filter(g => g.homeTeam === c1 || g.homeTeam === cAway).length;
              const cScheduledCount = cGames.length;
              
              if (cPlayedCount >= cScheduledCount) {
                  if ((wins[cAway] || 0) > (wins[c1] || 0)) cWinner = cAway;
                  else cWinner = c1;
              }
          }
      }

      if (pWinner && cWinner) return { pacific: pWinner, central: cWinner };
      return null;
  }

  private async generateNipponSeries(currentDateIndex: number, season: number, winners: { pacific: string, central: string }) {
      const newGames = [];
      let startDay = currentDateIndex + 4; // 中3日
      
      // 西暦偶数年はパ・リーグ、奇数年はセ・リーグが1,2,6,7戦のホーム
      const isPacificHomeFirst = season % 2 === 0;
      
      for (let i = 0; i < 7; i++) {
          const dateStr = getGameDateString(startDay + i + (i >= 2 ? 1 : 0) + (i >= 5 ? 1 : 0), season); // 移動日あり
          
          let home, away;

          if (isPacificHomeFirst) {
              // 偶数年: パ・リーグが 1,2,6,7戦ホーム
              if (i >= 2 && i <= 4) {
                  home = winners.central;
                  away = winners.pacific;
              } else {
                  home = winners.pacific;
                  away = winners.central;
              }
          } else {
              // 奇数年: セ・リーグが 1,2,6,7戦ホーム
              if (i >= 2 && i <= 4) {
                  home = winners.pacific;
                  away = winners.central;
              } else {
                  home = winners.central;
                  away = winners.pacific;
              }
          }
          
          newGames.push({ date: dateStr, home, away, type: 'nippon_series', gameNumber: i + 1 });
      }

      const schedule = await this.getSchedule();
      await this.updateSchedule([...schedule, ...newGames]);
  }

  /**
   * スケジュールを取得
   */
  async getSchedule(): Promise<any[]> {
    try {
      const schemaData = await this.getItem('simbaseball_db_schema');
      if (!schemaData) return INITIAL_SCHEDULE;
      const parsed = JSON.parse(schemaData);
      return parsed.initialData?.schedule || INITIAL_SCHEDULE;
    } catch (error) {
      console.error('Failed to get schedule:', error);
      return INITIAL_SCHEDULE;
    }
  }

  /**
   * 指定日の試合を取得
   */
  async getDailyGames(date: string): Promise<any[]> {
    const schedule = await this.getSchedule();
    return schedule.filter(g => g.date === date);
  }

  /**
   * 順位表の詳細情報（ゲーム差、マジック）を計算して付与
   */
  calculateStandingsInfo(teams: any[]): any[] {
    // リーグごとに分ける
    const pacific = teams.filter(t => t.league === 'pacific');
    const central = teams.filter(t => t.league === 'central');

    const processLeague = (leagueTeams: any[]) => {
      // 勝率順にソート
      const sorted = [...leagueTeams].sort((a, b) => {
        const winPctA = a.record?.winPercentage || 0;
        const winPctB = b.record?.winPercentage || 0;
        return winPctB - winPctA;
      });

      if (sorted.length === 0) return sorted;

      const leader = sorted[0];
      const totalGames = 143; // シーズン試合数

      // マジックナンバー計算用
      let magicNumber = -Infinity;
      
      // ゲーム差計算
      const processed = sorted.map((team, index) => {
        const wins = team.record?.wins || 0;
        const losses = team.record?.losses || 0;
        const leaderWins = leader.record?.wins || 0;
        const leaderLosses = leader.record?.losses || 0;

        // ゲーム差
        let gamesBack = 0;
        if (index > 0) {
          gamesBack = ((leaderWins - wins) + (losses - leaderLosses)) / 2;
        }
        
        // チームオブジェクトに gamesBack をセット
        if (!team.record) team.record = {};
        team.record.gamesBack = gamesBack;

        // マジック計算 (首位チームに対してのみ計算)
        if (index > 0) {
            // ライバルチームに対するマジック
            // M = (143 + 1) - (首位勝利 + ライバル敗戦)
            const m = (totalGames + 1) - (leaderWins + losses);
            if (m > magicNumber) {
                magicNumber = m;
            }
        }
        
        return team;
      });

      // マジック点灯判定
      // マジックが0より大きく、かつ首位チームの残り試合数以下なら点灯
      const leaderWins = leader.record?.wins || 0;
      const leaderLosses = leader.record?.losses || 0;
      const leaderDraws = leader.record?.draws || 0;
      
      if (magicNumber !== -Infinity) {
          const remainingGames = totalGames - (leaderWins + leaderLosses + leaderDraws);
          
          if (magicNumber <= 0) {
             // 優勝
             if (processed[0].record) processed[0].record.magicNumber = 0;
          } else if (magicNumber <= remainingGames) {
             // 点灯
             if (processed[0].record) processed[0].record.magicNumber = magicNumber;
          }
      }

      return processed;
    };

    const processedPacific = processLeague(pacific);
    const processedCentral = processLeague(central);

    return [...processedPacific, ...processedCentral];
  }

  /**
   * チームの詳細成績を集計して取得
   */
  async getTeamDetailedStats(teamId: string): Promise<any> {
    const players = await this.getInitialPlayers();
    const teamPlayers = players.filter(p => p.team === teamId);
    
    const stats = {
      avg: 0,
      homeRuns: 0,
      rbi: 0,
      stolenBases: 0,
      era: 0,
      saves: 0,
      strikeouts: 0,
      runs: 0,
      runsAllowed: 0
    };

    let totalHits = 0;
    let totalAtBats = 0;
    let totalEarnedRuns = 0;
    let totalInningsPitched = 0;

    teamPlayers.forEach(p => {
      if (p.stats) {
        // 打撃
        totalHits += p.stats.hits || 0;
        totalAtBats += p.stats.atBats || 0;
        stats.homeRuns += p.stats.homeRuns || 0;
        stats.rbi += p.stats.rbi || 0;
        stats.stolenBases += p.stats.stolenBases || 0;
        
        // 投手
        totalEarnedRuns += p.stats.earnedRuns || 0;
        totalInningsPitched += p.stats.inningsPitched || 0;
        stats.saves += p.stats.saves || 0;
        stats.strikeouts += p.stats.pitchingStrikeouts || 0;
      }
    });

    if (totalAtBats > 0) {
      stats.avg = totalHits / totalAtBats;
    }
    
    if (totalInningsPitched > 0) {
      stats.era = (totalEarnedRuns * 9) / totalInningsPitched;
    }

    // チーム情報から得点・失点を取得
    const teams = await this.getInitialTeams();
    const team = teams.find(t => t.id === teamId);
    if (team && team.record) {
        stats.runs = team.record.runs;
        stats.runsAllowed = team.record.runsAllowed;
    }

    return stats;
  }

  /**
   * ランダムな選手名を生成する
   */
  generateRandomName(): string {
    const lastNames = NAME_MASTER_DATA.lastNames;
    const firstNames = NAME_MASTER_DATA.firstNames;
    
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    
    return `${lastName} ${firstName}`;
  }

  /**
   * 年度別成績を保存
   */
  async saveYearlyStats(year: number, players: Player[]): Promise<void> {
    try {
      const statsData = await this.getItem('simbaseball_yearly_stats');
      let allStats: YearlyStats[] = statsData ? JSON.parse(statsData) : [];

      const newStats: YearlyStats[] = players.map(p => ({
        playerId: p.id,
        year: year,
        teamId: p.team,
        stats: p.stats || {} as PlayerStats
      }));

      // 重複排除 (同年度・同選手のデータがあれば上書き)
      const statsMap = new Map<string, YearlyStats>();
      allStats.forEach(s => statsMap.set(`${s.playerId}-${s.year}`, s));
      newStats.forEach(s => statsMap.set(`${s.playerId}-${s.year}`, s));
      
      const mergedStats = Array.from(statsMap.values());

      await this.setItem('simbaseball_yearly_stats', JSON.stringify(mergedStats));
    } catch (error) {
      console.error('Failed to save yearly stats:', error);
    }
  }

  /**
   * 選手の年度別成績を取得
   */
  async getYearlyStats(playerId: string | number): Promise<YearlyStats[]> {
    try {
      const statsData = await this.getItem('simbaseball_yearly_stats');
      if (!statsData) return [];

      const allStats: YearlyStats[] = JSON.parse(statsData);
      return allStats.filter(s => s.playerId === playerId).sort((a, b) => a.year - b.year);
    } catch (error) {
      console.error('Failed to get yearly stats:', error);
      return [];
    }
  }

  /**
   * リーグ全体の平均能力値を取得 (ポジション別)
   */
  async getLeagueAverageAbilities(): Promise<Record<string, { fielding: number, arm: number, speed: number }>> {
    try {
      const players = await this.getInitialPlayers();
      const posMap: Record<string, { fielding: number[], arm: number[], speed: number[] }> = {};

      players.forEach(p => {
        if (!p.position) return;
        if (!posMap[p.position]) {
          posMap[p.position] = { fielding: [], arm: [], speed: [] };
        }
        posMap[p.position].fielding.push(p.abilities.fielding || 0);
        posMap[p.position].arm.push(p.abilities.arm || 0);
        posMap[p.position].speed.push(p.abilities.speed || 0);
      });

      const averages: Record<string, { fielding: number, arm: number, speed: number }> = {};
      
      Object.keys(posMap).forEach(pos => {
        const counts = posMap[pos];
        const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 50;
        
        // ポジションに付かない選手も計算してしまっているので平均に3を加算して調整
        averages[pos] = {
          fielding: avg(counts.fielding) + 3,
          arm: avg(counts.arm) + 3,
          speed: avg(counts.speed) + 3
        };
      });

      // 全体平均も計算しておく (Unknown用)
      const allFielding = players.map(p => p.abilities.fielding || 0);
      const allArm = players.map(p => p.abilities.arm || 0);
      const allSpeed = players.map(p => p.abilities.speed || 0);
      
      const avgAll = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 50;
      
      averages['All'] = {
        fielding: avgAll(allFielding),
        arm: avgAll(allArm),
        speed: avgAll(allSpeed)
      };

      return averages;
    } catch (error) {
      console.error('Failed to get league average abilities:', error);
      return {};
    }
  }

}

/**
 * グローバル DB インスタンス
 */
export const dbManager = new DatabaseManager();
