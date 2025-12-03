import { GameResult } from '../types';

export const getGameDateString = (dayIndex: number, season: number = 2026): string => {
    const startDate = new Date(season, 2, 27); // March 27, 2026 (Month is 0-indexed)
    const targetDate = new Date(startDate);
    targetDate.setDate(startDate.getDate() + (dayIndex - 1));
    
    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
    const d = String(targetDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const formatDateJP = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
};
