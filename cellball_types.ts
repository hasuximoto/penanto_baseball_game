/**
 * CellBall Game - TypeScript Type Definitions
 * VBA データモデルから抽出した型定義
 */

// ========== 基本的な型定義 ==========

export type Position = 
  | "P" | "C" | "1B" | "2B" | "3B" | "SS" | "LF" | "CF" | "RF"
  | "DH" | "Unknown";

export type TeamId = "hawks" | "lions" | "fighters" | "buffaloes" | "eagles" | "marines";

export type GameStatus = "before" | "during" | "after" | "season_end";

export type SeasonPhase = "regular" | "off_season" | "draft" | "signing";

// ========== 選手データ ==========

export interface PlayerStats {
  // 打者統計
  average: number;                 // 打率
  homeRuns: number;                // 本塁打
  rbi: number;                      // RBI
  stolenBases: number;              // 盗塁
  obp: number;                      // 出塁率
  
  // 投手統計
  era?: number;                     // 防御率
  wins?: number;                    // 勝利
  losses?: number;                  // 敗北
  inningsPitched?: number;           // 投球回数
  strikeOuts?: number;              // 奪三振
}

export interface PlayerContract {
  salary: number;                   // 年俸
  yearsRemaining: number;           // 残り年数
  totalYears: number;               // 契約総年数
  expirationYear: number;           // 契約満了年
}

export interface Player {
  id: number;
  name: string;
  position: Position;
  handedness: "R" | "L" | "B";      // 右・左・両打ち
  age: number;
  team: TeamId;
  stats: PlayerStats;
  abilities: {
    contact: number;
    power: number;
    speed: number;
    arm: number;
    fielding: number;
  };
  contract: PlayerContract;
  careerStats: PlayerStats;
  recentForm: number[];             // 最近のパフォーマンス
  injuryStatus: "healthy" | "injured" | "out";
  morale: number;                   // 士気 (0-100)
}

// ========== チームデータ ==========

export interface TeamRecord {
  wins: number;
  losses: number;
  winPercentage: number;
  gamesBack: number;                // ゲーム差
  magicNumber?: number;             // マジックナンバー
  runs: number;
  runsAllowed: number;
}

export interface Team {
  id: TeamId;
  name: string;
  players: Player[];
  lineup: number[];                 // 選手ID の配列
  pitchers: number[];               // 投手の選手ID
  record: TeamRecord;
  budget: number;
  payroll: number;
  history: GameResult[];
}

// ========== ゲームデータ ==========

export interface GameLineup {
  batter: number;                   // 打者の選手ID
  pitcher: number;                  // 投手の選手ID
  inning: number;
  inningPhase: "top" | "bottom";
  outs: number;
  balls: number;
  strikes: number;
  baseRunners: [boolean, boolean, boolean]; // 1B, 2B, 3B
}

export interface GameResult {
  id: string;
  date: number;
  season: number;
  homeTeam: TeamId;
  awayTeam: TeamId;
  homeScore: number;
  awayScore: number;
  innings: number;
  status: "completed" | "cancelled" | "postponed";
  mvp?: {
    playerId: number;
    playerName: string;
  };
}

export interface GameState {
  // 基本ゲーム情報
  currentDate: number;              // ゲーム内日付 (41000 = 2012/1/1)
  season: number;                   // シーズン
  day: number;                      // シーズン内の日数
  gameStatus: GameStatus;
  
  // プレイ状態
  playableFlags: {
    canPlayGame: boolean;           // ゲーム実行可能
    gameExecuted: boolean;          // ゲーム実行済み
    seasonEnded: boolean;           // シーズン終了
  };
  
  // ゲーム設定
  autoPlay: boolean;
  selectedTeamId: TeamId | null;
  
  // スコア
  homeTeamScore: number;
  awayTeamScore: number;
  
  // 試合進行状況
  currentInning: number;
  currentOuts: number;
  baseRunners: [boolean, boolean, boolean];
  
  // その他
  selectedDifficulty: number;       // 難易度
  selectedTeamHuman: TeamId | null; // プレイヤーが操作するチーム
}

// ========== UI/UX 状態 ==========

export interface UIState {
  loading: boolean;
  notification: {
    message: string;
    type: "info" | "warning" | "error" | "success";
    visible: boolean;
  };
  activeScreen: string;
  selectedPlayer: number | null;
  showModalDialog: boolean;
  dialogContent: {
    title: string;
    message: string;
    options: string[];
  };
}

// ========== オフシーズン処理 ==========

export interface FreeAgent {
  player: Player;
  biddingTeams: TeamId[];
  highestBid: number;
  winningTeam: TeamId | null;
  status: "available" | "bidding" | "signed" | "unsigned";
}

export interface TradeOffer {
  id: string;
  fromTeam: TeamId;
  toTeam: TeamId;
  playersFromTeam: number[];       // 選手ID
  playersToTeam: number[];         // 選手ID
  cashConsideration: number;
  status: "proposed" | "accepted" | "rejected" | "expired";
}

export interface OffSeasonData {
  phase: SeasonPhase;
  freeAgents: FreeAgent[];
  tradeOffers: TradeOffer[];
  draftPicks: {
    round: number;
    pick: number;
    teamId: TeamId;
    selectedPlayer?: Player;
  }[];
  contractNegotiations: {
    player: Player;
    teams: {
      teamId: TeamId;
      offer: {
        salary: number;
        years: number;
      };
    }[];
  }[];
}

// ========== リーダーボード/統計 ==========

export interface LeaderboardEntry {
  rank: number;
  player: Player;
  stat: "average" | "homeRuns" | "rbi" | "era" | "wins" | "strikeOuts";
  value: number;
}

export interface StandingsEntry {
  rank: number;
  team: Team;
  record: TeamRecord;
}

// ========== セーブデータ ==========

export interface SaveData {
  version: number;
  lastSaved: number;               // タイムスタンプ
  gameState: GameState;
  teams: Record<TeamId, Team>;
  offSeasonData: OffSeasonData;
  gameHistory: GameResult[];
  news: NewsItem[];
}

export interface NewsItem {
  id: string;
  date: number;
  title: string;
  content: string;
  type: "trade" | "injury" | "signing" | "record" | "event";
  affectedTeams: TeamId[];
}

// ========== ゲーム計算用 ==========

export interface AtBatResult {
  type: "out" | "single" | "double" | "triple" | "homeRun" | "walk" | "hitByPitch";
  advanceBases: number;
  rbiEarned: number;
}

export interface GameSimulationConfig {
  difficulty: number;
  randomSeed: number;
  useStatistics: boolean;
  weatherEffect: number;
}

// ========== エラーハンドリング ==========

export class GameError extends Error {
  constructor(
    public code: string,
    public message: string,
    public details?: any
  ) {
    super(message);
  }
}

export type GameErrorCode = 
  | "INVALID_STATE"
  | "TEAM_NOT_FOUND"
  | "PLAYER_NOT_FOUND"
  | "INSUFFICIENT_BUDGET"
  | "INVALID_LINEUP"
  | "SAVE_FAILED"
  | "LOAD_FAILED"
  | "NETWORK_ERROR";

// ========== API レスポンス ==========

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// ========== ユーティリティ型 ==========

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
