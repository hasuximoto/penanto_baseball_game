/**
 * CellBall Game - TypeScript Type Definitions
 * VBA データモデルから抽出した型定義
 */

// ========== 基本的な型定義 ==========

export type Position = 
  | "P" | "C" | "1B" | "2B" | "3B" | "SS" | "LF" | "CF" | "RF" | "OF"
  | "DH" | "Unknown";

export type TeamId = 
  | "hawks" | "lions" | "fighters" | "buffaloes" | "eagles" | "marines"
  | "giants" | "tigers" | "dragons" | "baystars" | "carp" | "swallows";

export type GameStatus = "before" | "during" | "after" | "season_end";

export type SeasonPhase = "regular" | "off_season" | "draft" | "signing";

export type OffSeasonStep = "draft" | "contract" | "camp" | "next_season";

// ========== 選手データ ==========

export interface PlayerStats {
  // 打者統計
  gamesPlayed?: number;             // 試合数
  plateAppearances?: number;        // 打席数
  atBats?: number;                  // 打数
  hits?: number;                    // 安打
  doubles?: number;                 // 二塁打
  triples?: number;                 // 三塁打
  homeRuns: number;                 // 本塁打
  rbi: number;                      // 打点
  batterStrikeouts?: number;        // 三振 (打者)
  walks?: number;                   // 四球
  hitByPitch?: number;              // 死球
  sacrificeBunts?: number;          // 犠打
  sacrificeFlies?: number;          // 犠飛
  stolenBases: number;              // 盗塁
  caughtStealing?: number;          // 盗塁死
  doublePlays?: number;             // 併殺打
  errors?: number;                  // 失策
  
  average: number;                 // 打率
  obp: number;                      // 出塁率
  slugging?: number;                // 長打率
  ops?: number;                     // OPS

  runsScored?: number;              // 得点
  singles?: number;                 // 単打 (計算用)
  
  // 投手統計
  era?: number;                     // 防御率
  wins?: number;                    // 勝利
  losses?: number;                  // 敗北
  saves?: number;                   // セーブ
  inningsPitched?: number;           // 投球回数
  pitchingInnings?: number;          // 投球回数（別表記）
  strikeOuts?: number;              // 奪三振 (投手)
  earnedRuns?: number;              // 自責点
  runsAllowed?: number;             // 失点
  
  gamesPitched?: number;            // 登板数
  gamesStarted?: number;            // 先発数
  completeGames?: number;           // 完投
  shutouts?: number;                // 完封
  qualityStarts?: number;           // QS
  pitchingHits?: number;            // 被安打
  pitchingHomeRuns?: number;        // 被本塁打
  pitchingWalks?: number;           // 与四球
  pitchingHitByPitch?: number;      // 与死球
  
  whip?: number;                    // WHIP
  k9?: number;                      // K/9
  bb9?: number;                     // BB/9
  
  pitchCount?: number;              // 投球数
}

export interface PlayerContract {
  salary: number;                   // 年俸
  yearsRemaining: number;           // 残り年数
  totalYears: number;               // 契約総年数
  expirationYear: number;           // 契約満了年
}

export interface Player {
  id: number | string;
  name: string;
  position: Position;
  handedness: "R" | "L" | "B";      // 右・左・両打ち
  age: number;
  team: TeamId;
  draftRank?: number;               // ドラフト順位
  origin?: "High School" | "University" | "Industrial" | "Foreign" | "Unknown"; // 出身
  stats: PlayerStats;
  abilities: {
    contact: number;
    power: number;
    speed: number;
    arm: number;
    fielding: number;
    defense?: number;
    control?: number;
    stamina?: number;
    
    // New abilities from Excel
    eye?: number;                   // 選球
    bunt?: number;                  // 犠打
    aggressiveness?: number;        // 積極性
    steal?: number;                 // 盗塁
    trajectory?: number;            // 弾道
    experience?: number;            // 実績
    pinchHitter?: number;           // 代打
    rosterSlot?: string;            // 選手枠
    
    // Pitcher specific
    starterAptitude?: number;       // 先発適性
    relieverAptitude?: number;      // 中継ぎ適性
    closerAptitude?: number;        // 抑え適性
    stuff?: number;                 // 球威
    pitchingForm?: string;          // 投法
    correctedPower?: number;        // 補正長打
    correctedContact?: number;      // 補正巧打
    
    overall?: number;               // 総合 (AA列)

    pitchTypes?: { name: string; value: number }[];
  };
  aptitudes?: {
    catcher: number;
    first: number;
    second: number;
    third: number;
    short: number;
    outfield: number;
  };
  contract: PlayerContract;
  careerStats: PlayerStats;
  recentForm: number[];             // 最近のパフォーマンス
  injuryStatus: "healthy" | "injured" | "out";
  morale: number;                   // 士気 (0-100)
  fatigue?: number;                 // 疲労
  recovery?: number;                // 疲労回復力
  starter_aptitude?: number;        // 先発適性
  reliever_aptitude?: number;       // 中継ぎ適性
  closer_aptitude?: number;         // 抑え適性
  level?: number;                   // プレイヤーレベル
  yearsExperience?: number;          // 経験年数
  specialQualification?: string;     // 特別資格
  
  // ロスター管理
  registrationStatus?: "active" | "farm"; // 一軍登録状況
  lastDemotionDate?: number;         // 最終抹消日 (再登録制限用)
  isForeign?: boolean;               // 外国人選手フラグ
}

// ========== チームデータ ==========

export interface TeamRecord {
  wins: number;
  losses: number;
  draws?: number;
  winPercentage: number;
  gamesBack: number;                // ゲーム差
  magicNumber?: number;             // マジックナンバー
  runs: number;
  runsAllowed: number;
}

export interface Team {
  id: TeamId;
  name: string;
  league: 'central' | 'pacific';
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

export interface PlayerGameStats {
  playerId: number | string;
  playerName: string;
  position: string;
  plateAppearances: number; // 打席
  atBats: number;           // 打数
  hits: number;             // 安打
  doubles: number;          // 二塁打
  triples: number;          // 三塁打
  homeRuns: number;         // 本塁打
  runs: number;             // 得点
  rbi: number;              // 打点
  walks: number;            // 四球
  hitByPitch: number;       // 死球
  sacrificeBunts: number;   // 犠打
  sacrificeFlies: number;   // 犠飛
  strikeouts: number;       // 三振 (打者)
  stolenBases: number;      // 盗塁
  caughtStealing: number;   // 盗塁死
  doublePlays: number;      // 併殺打
  errors: number;           // 失策
  
  order?: number; // 打順 (1-9)
  // 投手用
  inningsPitched?: number;
  earnedRuns?: number;
  runsAllowed?: number; // 失点
  pitchingStrikeouts?: number;
  pitchingWalks?: number;
  pitchingHits?: number;
  pitchingHomeRuns?: number;
  pitchingHitByPitch?: number;
  wins?: number;
  losses?: number;
  saves?: number;
  pitchingOrder?: number; // 登板順
  isStarter?: boolean;
  completeGame?: boolean;
  shutout?: boolean;
  qualityStart?: boolean;
  pitchCount?: number;

  // 打席詳細 (BoxScore用)
  atBatDetails?: {
    inning: number;
    result: string; // "中安", "遊ゴロ" etc.
  }[];
}

export interface GameDetails {
  homeBatting: PlayerGameStats[];
  awayBatting: PlayerGameStats[];
  homePitching: PlayerGameStats[];
  awayPitching: PlayerGameStats[];
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
    playerId: number | string;
    playerName: string;
  };
  details?: GameDetails;
  lineScore?: {
    home: number[];
    away: number[];
  };
  type?: 'regular' | 'cs_first' | 'cs_final' | 'nippon_series';
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
  
  // オフシーズン進行状況
  offSeasonStep?: OffSeasonStep;
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
  type: "trade" | "injury" | "signing" | "record" | "event" | "roster_move" | "game" | "award" | "draft" | "contract";
  affectedTeams: TeamId[];
}

// ========== ゲーム計算用 ==========

export interface AtBatResult {
  type: "out" | "single" | "double" | "triple" | "homeRun" | "walk" | "hitByPitch" | "strikeout" | "error";
  advanceBases: number;
  rbiEarned: number;
  errorPlayerId?: string | number; // エラーした選手のID
  direction?: number; // 打球方向 (1-9)
  isGroundBall?: boolean; // ゴロかどうか (併殺判定用)
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
