import { BatHandCode, HandCode, HandLabel, ThrowHandCode } from '../types';

const HAND_LABEL_MAP: Record<HandCode, HandLabel> = {
  1: '右',
  2: '左',
  3: '両',
};

export const toHandLabel = (code: HandCode): HandLabel => HAND_LABEL_MAP[code];

export const parseHandCode = (input: unknown): HandCode => {
  if (input === 1 || input === 2 || input === 3) {
    return input;
  }

  if (typeof input === 'string') {
    const normalized = input.trim().toUpperCase();
    if (normalized === '1' || normalized === 'R' || normalized === '右') return 1;
    if (normalized === '2' || normalized === 'L' || normalized === '左') return 2;
    if (normalized === '3' || normalized === 'B' || normalized === '両') return 3;
  }

  return 1;
};

export const parseThrowHandCode = (input: unknown): ThrowHandCode => {
  const code = parseHandCode(input);
  return code === 2 ? 2 : 1;
};

export const parseBatHandCode = (input: unknown): BatHandCode => parseHandCode(input);

export const formatThrowBat = (throwHand: ThrowHandCode, batHand: BatHandCode): string => {
  return `${toHandLabel(throwHand)}投${toHandLabel(batHand)}打`;
};
