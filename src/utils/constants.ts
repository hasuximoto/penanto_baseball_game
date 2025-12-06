/**
 * ゲーム定数
 * VBA マクロから抽出した定数値
 */

// チーム ID とチーム情報
export const TEAMS = {
  EAGLES: { id: 'eagles' as const, name: '埼玉西武ライオンズ', shortName: 'ライオンズ' },
  MARINES: { id: 'marines' as const, name: '千葉ロッテマリーンズ', shortName: 'マリーンズ' },
  BAYSTARS: { id: 'baystars' as const, name: '横浜ベイスターズ', shortName: 'ベイスターズ' },
  DRAGONS: { id: 'dragons' as const, name: '中日ドラゴンズ', shortName: 'ドラゴンズ' },
  TIGERS: { id: 'tigers' as const, name: '阪神タイガース', shortName: 'タイガース' },
  CARP: { id: 'carp' as const, name: '広島東洋カープ', shortName: 'カープ' },
} as const;

export const TEAM_IDS = ['eagles', 'marines', 'baystars', 'dragons', 'tigers', 'carp'] as const;
export type TeamIdType = typeof TEAM_IDS[number];

export const TEAM_ABBREVIATIONS: Record<string, string> = {
  'giants': 'G',
  'tigers': 'T',
  'dragons': 'D',
  'baystars': 'De',
  'carp': 'C',
  'swallows': 'S',
  'hawks': 'H',
  'lions': 'L',
  'fighters': 'F',
  'buffaloes': 'B',
  'eagles': 'E',
  'marines': 'M',
  'free_agent': 'FA'
};

// ポジション
export const POSITIONS = {
  P: { id: 'P', name: '投手', order: 1 },
  C: { id: 'C', name: 'キャッチャー', order: 2 },
  '1B': { id: '1B', name: 'ファースト', order: 3 },
  '2B': { id: '2B', name: 'セカンド', order: 4 },
  '3B': { id: '3B', name: 'サード', order: 5 },
  SS: { id: 'SS', name: 'ショート', order: 6 },
  LF: { id: 'LF', name: 'レフト', order: 7 },
  CF: { id: 'CF', name: 'センター', order: 8 },
  RF: { id: 'RF', name: 'ライト', order: 9 },
  DH: { id: 'DH', name: '指名打者', order: 10 },
} as const;

export const POSITION_IDS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'] as const;

// オフシーズン設定
export const OFF_SEASON_TURNS = 10;

// ゲーム定数
export const GAME_CONSTANTS = {
  SEASON_START_MONTH: 3, // 3月開始
  SEASON_END_MONTH: 10, // 10月終了
  REGULAR_SEASON_DAYS: 140,
  INNINGS_PER_GAME: 9,
  OUTS_PER_INNING: 3,
  MAX_BASES: 3,
  BASES: [1, 2, 3],
} as const;

// ゲーム状態
export const GAME_STATUS = {
  BEFORE_GAME: 'before_game' as const,
  GAME_PLAYING: 'game_playing' as const,
  GAME_ENDED: 'game_ended' as const,
  OFF_SEASON: 'off_season' as const,
  LOADING: 'loading' as const,
  ERROR: 'error' as const,
} as const;

// シーズンフェーズ
export const SEASON_PHASES = {
  PRE_SEASON: 'pre_season' as const,
  REGULAR_SEASON: 'regular_season' as const,
  POST_SEASON: 'post_season' as const,
  OFF_SEASON: 'off_season' as const,
  DRAFT: 'draft' as const,
  FA: 'fa' as const,
  TRADING_DEADLINE: 'trading_deadline' as const,
} as const;

// 契約タイプ
export const CONTRACT_TYPES = {
  SIGNED: 'signed' as const,
  DRAFTED: 'drafted' as const,
  FREE_AGENT: 'free_agent' as const,
  LOANED: 'loaned' as const,
  RETIRED: 'retired' as const,
} as const;

// 怪我タイプ
export const INJURY_TYPES = {
  NONE: 'none' as const,
  MINOR: 'minor' as const,
  MODERATE: 'moderate' as const,
  SERIOUS: 'serious' as const,
} as const;

// 野球用語
export const PLAY_TYPES = {
  OUT: 'out' as const,
  SINGLE: 'single' as const,
  DOUBLE: 'double' as const,
  TRIPLE: 'triple' as const,
  HOME_RUN: 'homeRun' as const,
  WALK: 'walk' as const,
  STRIKEOUT: 'strikeout' as const,
  GROUND_OUT: 'groundOut' as const,
  FLY_OUT: 'flyOut' as const,
  SACRIFICE: 'sacrifice' as const,
  ERROR: 'error' as const,
} as const;

// 出塁結果タイプ
export const AT_BAT_RESULTS = {
  HIT: 'hit' as const,
  OUT: 'out' as const,
  WALK: 'walk' as const,
} as const;

// UI テーマカラー（VBA のカラー設定から変換）
export const THEME_COLORS = {
  PRIMARY_GREEN: '#4CAF50',
  PRIMARY_BLUE: '#2196F3',
  SECONDARY_GRAY: '#9E9E9E',
  SUCCESS_GREEN: '#4CAF50',
  ERROR_RED: '#F44336',
  WARNING_ORANGE: '#FF9800',
  INFO_BLUE: '#2196F3',
  BACKGROUND_LIGHT: '#F5F5F5',
  BACKGROUND_WHITE: '#FFFFFF',
  TEXT_PRIMARY: '#212121',
  TEXT_SECONDARY: '#757575',
} as const;

// デフォルト統計値
export const DEFAULT_STATS = {
  average: 0.000,
  atBats: 0,
  hits: 0,
  homeRuns: 0,
  rbi: 0,
  runs: 0,
  stolenBases: 0,
  era: 0.00,
  wins: 0,
  losses: 0,
  saves: 0,
  strikeOuts: 0,
  walks: 0,
  hitByPitch: 0,
} as const;

// デフォルト給与
export const DEFAULT_SALARY = 20000000; // 2000万円

// ドラフト定数
export const DRAFT_CONSTANTS = {
  ROUNDS: 3,
  PICKS_PER_ROUND: 6, // 6チーム
  TOTAL_PICKS: 18,
} as const;

// FA 定数
export const FA_CONSTANTS = {
  MIN_BID_INCREMENT: 5000000, // 500万円刻み
  MAX_YEARS: 5,
  MIN_YEARS: 1,
} as const;

// トレード関連定数
export const TRADE_CONSTANTS = {
  DEADLINE_DAY: 120, // シーズン開始から120日
} as const;

// ゲーム内パラメータ（VBA マクロから抽出）
export const GAME_PARAMETERS = {
  BATTING_AVERAGE_TO_HIT_RATE: 1.0, // 打率をそのままヒット率に
  HOME_RUN_RATE_MULTIPLIER: 0.5, // ホームランレート = 打率 * 0.5
  STRIKEOUT_BASE_RATE: 0.2, // 基本三振率 20%
  WALK_BASE_RATE: 0.08, // 基本四球率 8%
  INJURY_CHANCE_PER_GAME: 0.01, // ゲームあたりの怪我確率 1%
} as const;

// ページングとリスト表示
export const LIST_CONSTANTS = {
  PLAYERS_PER_PAGE: 20,
  GAMES_PER_PAGE: 10,
  STANDINGS_PAGE_SIZE: 6,
} as const;

// ローカルストレージキー
export const STORAGE_KEYS = {
  GAME_STATE: 'simbaseball_game_state',
  SETTINGS: 'simbaseball_settings',
  AUTOSAVE: 'simbaseball_autosave',
  SEASON_DATA: 'simbaseball_season_data',
  PLAYER_DATA: 'simbaseball_player_data',
  TEAM_DATA: 'simbaseball_team_data',
} as const;

// API エンドポイント（将来使用）
export const API_ENDPOINTS = {
  PLAYERS: '/api/players',
  TEAMS: '/api/teams',
  GAMES: '/api/games',
  STANDINGS: '/api/standings',
  SEASON: '/api/season',
} as const;

// エラーメッセージ
export const ERROR_MESSAGES = {
  LOAD_ERROR: 'データの読み込みに失敗しました',
  SAVE_ERROR: 'データの保存に失敗しました',
  GAME_ERROR: '試合の実行中にエラーが発生しました',
  INVALID_TRADE: '無効な取引です',
  INSUFFICIENT_FUNDS: '給与枠が不足しています',
  NO_ACTIVE_GAME: 'アクティブなゲームがありません',
} as const;

// 通知メッセージ
export const NOTIFICATION_MESSAGES = {
  GAME_STARTED: 'ゲームを開始しました',
  GAME_COMPLETED: 'ゲームが完了しました',
  TRADE_SUCCESSFUL: 'トレードが完了しました',
  FA_SIGNING: 'FA 契約が完了しました',
  SAVE_SUCCESSFUL: 'データを保存しました',
  LOAD_SUCCESSFUL: 'データを読み込みました',
} as const;

// ゲーム難易度設定
export const DIFFICULTY_SETTINGS = {
  EASY: {
    name: '簡単',
    aiStrength: 0.5,
    playerAccuracyMultiplier: 1.2,
  },
  NORMAL: {
    name: '標準',
    aiStrength: 1.0,
    playerAccuracyMultiplier: 1.0,
  },
  HARD: {
    name: '難しい',
    aiStrength: 1.5,
    playerAccuracyMultiplier: 0.8,
  },
} as const;
