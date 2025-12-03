/**
 * 計算ユーティリティ
 * VBA の各種計算ロジックを TypeScript に変換
 */

import { Player, PlayerStats, Team } from '../types';

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
