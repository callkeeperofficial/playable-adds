import type { Difficulty } from './types';

export const DESIGN_WIDTH = 390;
export const DESIGN_HEIGHT = 844;
export const BETS = [10, 25, 50, 100, 200] as const;

export const MULTIPLIERS: Record<Difficulty, number[]> = {
  easy: [0, 1.31, 1.79, 2.43, 3.32, 4.53, 6.17, 8.42, 11.48, 15.65, 21.34, 29.1, 39.69, 54.12, 73.8, 100.64],
  medium: [0, 1.8, 3.2, 5.6, 9.8, 17.1, 29.9, 52.3, 91.5, 160.1, 280.2, 490.4, 858.2, 1201.5, 1500.2, 1812.54],
  hard: [0, 2.88, 8.64, 25.92, 77.76, 155.52, 311.04, 622.08, 933.12, 1400, 2100, 3000, 3900, 4800, 5500, 6298.56],
};

export const SAVE_CHANCE: Record<Difficulty, number> = { easy: 0.18, medium: 0.32, hard: 0.48 };

export const BONUS_CONFIG: Record<Difficulty, { priceMultiplier: number; maxWinMultiplier: number }> = {
  easy: { priceMultiplier: 30, maxWinMultiplier: 100.64 },
  medium: { priceMultiplier: 60, maxWinMultiplier: 1812.54 },
  hard: { priceMultiplier: 100, maxWinMultiplier: 6298.56 },
};

export const money = (value: number) => `$${Math.round(value).toLocaleString('en-US')}`;

