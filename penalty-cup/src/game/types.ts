export type Difficulty = 'easy' | 'medium' | 'hard';

export type GameState =
  | 'country_select'
  | 'idle_before_kick'
  | 'ball_flying'
  | 'claim_available'
  | 'fail'
  | 'buy_bonus_overlay'
  | 'bonus_roulette'
  | 'bonus_intro'
  | 'bonus_shot_idle'
  | 'bonus_ball_flying'
  | 'bonus_shot_result'
  | 'bonus_result';

export type BonusMode = {
  active: boolean;
  difficulty: Difficulty;
  bet: number;
  price: number;
  shotsTotal: number;
  shotsLeft: number;
  accumulatedWin: number;
  currentStep: number;
};

