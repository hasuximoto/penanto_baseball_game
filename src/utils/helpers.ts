/**
 * その他のユーティリティ関数
 */

import { Player, Team, TeamId, Position } from '../types';
import { TEAMS } from './constants';

/**
 * チーム ID からチーム情報を取得
 */
export const getTeamInfo = (teamId: TeamId) => {
  const teamValues = Object.values(TEAMS);
  return teamValues.find(team => team.id === teamId);
};

/**
 * チーム名からチーム ID を取得
 */
export const getTeamIdByName = (teamName: string): TeamId | null => {
  const teamValues = Object.values(TEAMS);
  const team = teamValues.find(t => t.name === teamName || t.shortName === teamName);
  return team ? (team.id as TeamId) : null;
};

/**
 * ランダムな選手を生成（ドラフト用）
 */
export const generateRandomPlayer = (name: string, position: Position): Player => {
  const positions: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
  const randomPosition = position || positions[Math.floor(Math.random() * positions.length)];

  return {
    id: Math.floor(Math.random() * 1000000),
    name,
    position: randomPosition,
    handedness: 'R',
    age: randomInt(18, 40),
    team: 'eagles' as TeamId,
    abilities: {
      contact: Math.random() * 20,
      power: Math.random() * 20,
      speed: Math.random() * 20,
      arm: Math.random() * 20,
      fielding: Math.random() * 20
    },
    contract: {
      salary: 20000000,
      yearsRemaining: 1,
      totalYears: 1,
      expirationYear: new Date().getFullYear() + 1,
    },
    stats: {
      average: Math.random() * 0.3,
      homeRuns: Math.floor(Math.random() * 50),
      rbi: Math.floor(Math.random() * 150),
      stolenBases: Math.floor(Math.random() * 30),
      obp: Math.random() * 0.4,
      era: Math.random() * 5,
      wins: Math.floor(Math.random() * 20),
      losses: Math.floor(Math.random() * 20),
      inningsPitched: Math.floor(Math.random() * 200),
      strikeOuts: Math.floor(Math.random() * 200),
    },
    careerStats: {
      average: Math.random() * 0.3,
      homeRuns: Math.floor(Math.random() * 100),
      rbi: Math.floor(Math.random() * 300),
      stolenBases: Math.floor(Math.random() * 50),
      obp: Math.random() * 0.4,
    },
    recentForm: [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()],
    injuryStatus: 'healthy',
    morale: Math.floor(Math.random() * 100),
  };
};

/**
 * 配列をシャッフル
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * ランダムな整数を生成
 */
export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * ランダムなフロート値を生成
 */
export const randomFloat = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

/**
 * 確率のチェック
 */
export const checkProbability = (probability: number): boolean => {
  return Math.random() < probability;
};

/**
 * 数値をフォーマット（3 桁区切り）
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('ja-JP');
};

/**
 * 給与をフォーマット（円表記）
 */
export const formatSalary = (salary: number): string => {
  if (salary >= 100000000) {
    return `${(salary / 100000000).toFixed(1)}億円`;
  } else if (salary >= 10000000) {
    return `${(salary / 10000000).toFixed(0)}千万円`;
  }
  return `${formatNumber(salary)}円`;
};

/**
 * 打率をフォーマット（.000 形式）
 */
export const formatAverage = (average: number): string => {
  return `.${String(Math.floor(average * 1000)).padStart(3, '0')}`;
};

/**
 * 防御率をフォーマット（00.00 形式）
 */
export const formatERA = (era: number): string => {
  return era.toFixed(2);
};

/**
 * チームを勝率でソート
 */
export const sortTeamsByWinPercentage = (teams: Team[]): Team[] => {
  return [...teams].sort((a, b) => {
    const percentageA = a.record.winPercentage;
    const percentageB = b.record.winPercentage;
    return percentageB - percentageA;
  });
};

/**
 * 選手を打率でソート
 */
export const sortPlayersByBattingAverage = (players: Player[]): Player[] => {
  return [...players].sort((a, b) => b.stats.average - a.stats.average);
};

/**
 * 選手を防御率でソート（投手）
 */
export const sortPlayersByERA = (players: Player[]): Player[] => {
  return [...players]
    .filter(p => p.position === 'P')
    .sort((a, b) => (a.stats.era || 0) - (b.stats.era || 0));
};

/**
 * ゲーム内の日付から曜日を取得
 */
export const getDayOfWeek = (excelDate: number): string => {
  const date = new Date('1900-01-01');
  date.setTime(date.getTime() + excelDate * 24 * 60 * 60 * 1000);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[date.getDay()];
};

/**
 * ゲーム内の日付をローカル日付に変換
 */
export const getLocalDateString = (excelDate: number): string => {
  const date = new Date('1900-01-01');
  date.setTime(date.getTime() + excelDate * 24 * 60 * 60 * 1000);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

/**
 * リーグ別チーム分割
 */
export const getTeamsByLeague = (league: 'pacific' | 'central'): string[] => {
  if (league === 'pacific') {
    return ['eagles', 'marines', 'baystars'];
  } else {
    return ['dragons', 'tigers', 'carp'];
  }
};

/**
 * 選手の名前をフォーマット
 */
export const formatPlayerName = (firstName: string, lastName: string): string => {
  return `${lastName} ${firstName}`;
};

/**
 * 小数点以下を切り捨て
 */
export const floorDecimal = (num: number, decimals: number): number => {
  const multiplier = Math.pow(10, decimals);
  return Math.floor(num * multiplier) / multiplier;
};

/**
 * 小数点以下を四捨五入
 */
export const roundDecimal = (num: number, decimals: number): number => {
  const multiplier = Math.pow(10, decimals);
  return Math.round(num * multiplier) / multiplier;
};

/**
 * キャメルケースをスネークケースに変換
 */
export const camelToSnake = (str: string): string => {
  return str.replace(/[A-Z]/g, match => `_${match.toLowerCase()}`);
};

/**
 * スネークケースをキャメルケースに変換
 */
export const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, match) => match.toUpperCase());
};

/**
 * 値が null または undefined かチェック
 */
export const isNullOrUndefined = (value: any): value is null | undefined => {
  return value === null || value === undefined;
};

/**
 * 値が空か確認
 */
export const isEmpty = (value: any): boolean => {
  if (isNullOrUndefined(value)) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * ディープコピー
 */
export const deepCopy = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * オブジェクトをマージ
 */
export const mergeObjects = <T extends object>(target: T, ...sources: Partial<T>[]): T => {
  return Object.assign({}, target, ...sources);
};

/**
 * 複数の値から最大値を取得
 */
export const getMax = (...values: number[]): number => {
  return Math.max(...values);
};

/**
 * 複数の値から最小値を取得
 */
export const getMin = (...values: number[]): number => {
  return Math.min(...values);
};

/**
 * 値を範囲内に制限
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

/**
 * 遅延実行
 */
export const delay = async (ms: number): Promise<void> => {
  // React Native 環境では setInterval を使用します
  // 実装環境で適切に設定してください
  return new Promise(resolve => {
    let elapsed = 0;
    const check = () => {
      elapsed += 10;
      if (elapsed >= ms) {
        resolve();
      }
    };
    // 実際の実装では、各環境に合わせて実装
    // ここではスタブのままにします
  });
};

/**
 * リトライ機能付きの非同期関数実行
 */
export const retryAsync = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await delay(delayMs * (i + 1)); // Exponential backoff
    }
  }
  throw new Error('Max retries exceeded');
};
