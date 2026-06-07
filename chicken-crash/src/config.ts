export type Difficulty = 'easy' | 'medium' | 'hard' | 'hardcore';
export type Stake = 2 | 3 | 8 | 20;

export const STAKES: Stake[] = [2, 3, 8, 20];
export const ROUTE_STEPS = 20;
export const INITIAL_POOL = 1_000_000;
export const STORAGE_KEY = 'chicken-crash-banked-total';
export const STEP_WIDTH = 292;
export const ROAD_HEIGHT = 880;

const BASE_MULTIPLIERS: Record<Difficulty, { start: number; growth: number; risk: number }> = {
  easy: { start: 1.01, growth: 0.035, risk: 0.02 },
  medium: { start: 1.06, growth: 0.065, risk: 0.03 },
  hard: { start: 1.12, growth: 0.11, risk: 0.045 },
  hardcore: { start: 1.22, growth: 0.18, risk: 0.065 },
};

export const multiplierFor = (difficulty: Difficulty, step: number) => {
  const settings = BASE_MULTIPLIERS[difficulty];
  return Number((settings.start + settings.growth * step + 0.002 * step * step).toFixed(2));
};

export const collisionChanceFor = (difficulty: Difficulty, step: number) => {
  const settings = BASE_MULTIPLIERS[difficulty];
  return Math.min(0.38, settings.risk + step * settings.risk * 0.035);
};

export const LIVE_WINS = [
  ['Amethyst Th...', 288],
  ['Pink Repulsi...', 4648],
  ['Gold Urgent ...', 284],
  ['Lime Poor Ge...', 236],
  ['Blue Ideologi...', 244.5],
  ['Plum Balance...', 220.5],
  ['Aqua Alleged...', 306],
] as const;
