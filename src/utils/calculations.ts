/**
 * 計算ユーティリティ
 * VBA の各種計算ロジックを TypeScript に変換
 */

import { Player, PlayerStats, Team, Position } from '../types';

// WAR計算用の定数
const WAR_CONSTANTS = {
  wOBA_WEIGHTS: {
    uBB: 0.69,
    HBP: 0.72,
    SINGLE: 0.89,
    DOUBLE: 1.27,
    TRIPLE: 1.62,
    HR: 2.10
  },
  wOBA_SCALE: 1.24,
  LEAGUE_wOBA: 0.320,
  RUNS_PER_WIN: 10.0,
  REPLACEMENT_LEVEL_RUNS: 20.0, // 600打席あたり
  REPLACEMENT_ERA: 4.50, // 代替投手の防御率
  POSITION_ADJUSTMENTS: {
    'C': 12.5,
    '1B': -12.5,
    '2B': 2.5,
    '3B': 2.5,
    'SS': 7.5,
    'LF': -7.5,
    'CF': 2.5,
    'RF': -7.5,
    'OF': -2.5,
    'DH': -17.5,
    'P': 0,
    'Unknown': 0
  }
};

/**
 * WAR (Wins Above Replacement) を計算
 */
export const calculateWAR = (player: Player, stats: PlayerStats): number => {
  if (player.position === 'P') {
    // 投手WAR (簡易版: RA9-WARベース)
    // WAR = (Replacement_ERA - ERA) * (IP / 9) / RunsPerWin
    // ※本来はFIPを使うべきだが、データ不足のためERA(または失点率)で代用
    
    const innings = stats.inningsPitched || 0;
    if (innings === 0) return 0;

    // 失点率 (Runs Allowed per 9)
    // stats.runsAllowed があれば使うが、なければ earnedRuns (ERA) で代用
    const runsAllowed = stats.runsAllowed || stats.earnedRuns || 0;
    const ra9 = (runsAllowed * 9) / innings;
    
    // 代替水準との差分
    const runsAboveRep = (WAR_CONSTANTS.REPLACEMENT_ERA - ra9) * (innings / 9);
    
    // 勝利数に換算
    return Math.round((runsAboveRep / WAR_CONSTANTS.RUNS_PER_WIN) * 10) / 10;

  } else {
    // 野手WAR
    // WAR = (Batting + Baserunning + Fielding + Positional + Replacement) / RunsPerWin

    const pa = stats.plateAppearances || 0;
    if (pa === 0) return 0;

    // 1. Batting Runs (wRAA)
    // wOBA = (0.69×uBB + 0.72×HBP + 0.89×1B + 1.27×2B + 1.62×3B + 2.10×HR) / (AB + BB - IBB + SF + HBP)
    // 分母は PA - SH - IBB とほぼ等しいが、ここでは簡易的に PA を使うか、(AB + BB + HBP + SF) を計算する
    
    const walks = stats.walks || 0;
    const hbp = stats.hitByPitch || 0;
    const singles = stats.singles || 0;
    const doubles = stats.doubles || 0;
    const triples = stats.triples || 0;
    const homeRuns = stats.homeRuns || 0;
    const atBats = stats.atBats || 0;
    const sf = stats.sacrificeFlies || 0;

    const wobaDenominator = atBats + walks + hbp + sf;
    
    let wRAA = 0;
    if (wobaDenominator > 0) {
      const wobaNumerator = 
        WAR_CONSTANTS.wOBA_WEIGHTS.uBB * walks +
        WAR_CONSTANTS.wOBA_WEIGHTS.HBP * hbp +
        WAR_CONSTANTS.wOBA_WEIGHTS.SINGLE * singles +
        WAR_CONSTANTS.wOBA_WEIGHTS.DOUBLE * doubles +
        WAR_CONSTANTS.wOBA_WEIGHTS.TRIPLE * triples +
        WAR_CONSTANTS.wOBA_WEIGHTS.HR * homeRuns;
      
      const wOBA = wobaNumerator / wobaDenominator;
      
      // wRAA = ((wOBA - League_wOBA) / wOBA_Scale) * PA
      wRAA = ((wOBA - WAR_CONSTANTS.LEAGUE_wOBA) / WAR_CONSTANTS.wOBA_SCALE) * pa;
    }

    // 2. Baserunning Runs (UBR)
    const ubr = stats.ubr || 0;

    // 3. Fielding Runs (UZR)
    const uzr = stats.uzr || 0;

    // 4. Positional Adjustment
    // 162試合(または143試合)あたりの補正値を、打席数または試合数で按分
    // ここでは簡易的に PA / 600 で按分する
    const posAdjustmentBase = WAR_CONSTANTS.POSITION_ADJUSTMENTS[player.position] || 0;
    const posAdjustment = posAdjustmentBase * (pa / 600);

    // 5. Replacement Level
    // 600打席あたり +20点
    const replacement = WAR_CONSTANTS.REPLACEMENT_LEVEL_RUNS * (pa / 600);

    // Total Runs
    const totalRuns = wRAA + ubr + uzr + posAdjustment + replacement;

    // WAR
    return Math.round((totalRuns / WAR_CONSTANTS.RUNS_PER_WIN) * 10) / 10;
  }
};

/**
 * 打率を計算
 */
export const calculateBattingAverage = (hits: number, atBats: number): number => {
  if (atBats === 0) return 0;
  return Math.round((hits / atBats) * 1000) / 1000;
};

/**
 * 出塁率を計算
 */
export const calculateOnBasePercentage = (
  hits: number,
  walks: number,
  hitByPitch: number,
  atBats: number,
  sacrificeFlies: number
): number => {
  const numerator = hits + walks + hitByPitch;
  const denominator = atBats + walks + hitByPitch + sacrificeFlies;

  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 1000;
};

/**
 * 防御率を計算
 */
export const calculateERA = (earnedRuns: number, inningsPitched: number): number => {
  if (inningsPitched === 0) return 0;
  return Math.round((earnedRuns / inningsPitched) * 100) / 100;
};

/**
 * 勝率を計算
 */
export const calculateWinPercentage = (wins: number, losses: number): number => {
  const total = wins + losses;
  if (total === 0) return 0;
  return Math.round((wins / total) * 1000) / 1000;
};

/**
 * チーム総給与を計算
 */
export const calculateTeamPayroll = (players: Player[]): number => {
  return players.reduce((total, player) => {
    return total + player.contract.salary;
  }, 0);
};

/**
 * 選手スコアを計算（採点）
 */
export const calculatePlayerScore = (stats: PlayerStats): number => {
  const batting = (stats.average * 100 + stats.homeRuns * 10 + stats.rbi * 5) || 0;
  const pitching = (stats.era ? (100 - stats.era * 5) : 0) +
    (stats.wins || 0) * 5 +
    (stats.strikeOuts || 0);

  return Math.round((batting + pitching) / 2);
};

/**
 * ゲーム内の日付（Excel の日付形式）から実際の日付に変換
 * VBA: 41000 = 2012/1/1
 */
export const excelDateToDate = (excelDate: number): Date => {
  const baseDate = new Date('1900-01-01');
  const date = new Date(baseDate.getTime() + excelDate * 24 * 60 * 60 * 1000);
  return date;
};

/**
 * 実際の日付から Excel の日付形式に変換
 */
export const dateToExcelDate = (date: Date): number => {
  const baseDate = new Date('1900-01-01');
  const timeDifference = date.getTime() - baseDate.getTime();
  return Math.floor(timeDifference / (24 * 60 * 60 * 1000));
};

/**
 * ゲーム内日付から日本語の日付文字列に変換
 */
export const formatGameDate = (excelDate: number): string => {
  const date = excelDateToDate(excelDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
};

/**
 * シーズンから日付を計算
 * 日数 1 = シーズン開始日
 */
export const getSeasonDate = (season: number, day: number): string => {
  const seasonStartDate = new Date(season, 2, 1); // 3月1日が開始
  const gameDate = new Date(seasonStartDate);
  gameDate.setDate(gameDate.getDate() + day - 1);

  const month = String(gameDate.getMonth() + 1).padStart(2, '0');
  const dateDay = String(gameDate.getDate()).padStart(2, '0');
  return `${month}月${dateDay}日`;
};

/**
 * ゲーム内の時間経過を計算
 */
export const calculateGameProgress = (currentDay: number, totalDays: number = 140): number => {
  return Math.min((currentDay / totalDays) * 100, 100);
};
