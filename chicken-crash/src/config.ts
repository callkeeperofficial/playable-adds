export type Difficulty = 'easy' | 'medium' | 'hard' | 'hardcore';
export type Stake = 2 | 3 | 8 | 20;

export const STAKES: Stake[] = [2, 3, 8, 20];
export const ROUTE_STEPS = 20;
export const INITIAL_POOL = 1_000_000;
export const STORAGE_KEY = 'chicken-crash-banked-total';
export const STEP_WIDTH = 292;
export const ROAD_HEIGHT = 880;

const MULTIPLIER_CURVES: Record<Difficulty, { base: number; stepFactor: number; risk: number }> = {
  easy: { base: 1.05, stepFactor: 1.12, risk: 0.02 },
  medium: { base: 1.08, stepFactor: 1.145, risk: 0.03 },
  hard: { base: 1.12, stepFactor: 1.17, risk: 0.045 },
  hardcore: { base: 1.18, stepFactor: 1.2, risk: 0.065 },
};

export const multiplierFor = (difficulty: Difficulty, step: number) => {
  const { base, stepFactor } = MULTIPLIER_CURVES[difficulty];
  return Number((base * stepFactor ** step).toFixed(2));
};

export const collisionChanceFor = (difficulty: Difficulty, step: number) => {
  const { risk } = MULTIPLIER_CURVES[difficulty];
  return Math.min(0.38, risk + step * risk * 0.035);
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
