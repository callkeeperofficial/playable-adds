import type { Difficulty } from './types';

export type WinTier = 'big' | 'mega' | 'epic' | 'legendary';
export type WinScreen = 1 | 2 | 3 | 4;

export const WIN_SCREEN_COUNT = 4 as const;
export const CLAIMS_FOR_BIG_WIN = 3;
export const GOALS_FOR_TIER_WIN = 6;

export const WIN_SCREEN_LABELS: Record<WinScreen, string> = {
  1: 'Big Win',
  2: 'Mega Win',
  3: 'Epic Win',
  4: 'Legendary Win',
};

type WinTierConfig = {
  tier: WinTier;
  screen: WinScreen;
  backgroundKey: keyof typeof WIN_BACKGROUND_FILES;
  textData: string;
  textAtlas: string;
  stageData: string;
  stageAtlas: string;
  start: string;
  idle: string;
  textY: number;
  stageY: number;
  textScale: number;
  stageScale: number;
  amountTop: number;
  ctaBottom: number;
  confetti: boolean;
};

export const WIN_BACKGROUND_FILES = {
  big: 'bgBigWin.b5ddd5f5.jpg',
  mega: 'bgMegaWin.9fd1952f.jpg',
  epic: 'bgEpicWin.9d8cce80.jpg',
  legendary: 'bgLegendaryWin.6c24bab1.jpg',
} as const;

export const WIN_TIER_CONFIG: Record<WinTier, WinTierConfig> = {
  big: {
    tier: 'big',
    screen: 1,
    backgroundKey: 'big',
    textData: 'bigwin_textData',
    textAtlas: 'bigwin_textAtlas',
    stageData: 'bigwinData',
    stageAtlas: 'bigwinAtlas',
    start: 'bigwin_start',
    idle: 'bigwin_idle',
    textY: 258,
    stageY: 464,
    textScale: 0.26,
    stageScale: 0.31,
    amountTop: 574,
    ctaBottom: 42,
    confetti: false,
  },
  mega: {
    tier: 'mega',
    screen: 2,
    backgroundKey: 'mega',
    textData: 'megawin_textData',
    textAtlas: 'megawin_textAtlas',
    stageData: 'megawinData',
    stageAtlas: 'megawinAtlas',
    start: 'megawin_start',
    idle: 'megawin_idle',
    textY: 248,
    stageY: 472,
    textScale: 0.26,
    stageScale: 0.31,
    amountTop: 574,
    ctaBottom: 42,
    confetti: false,
  },
  epic: {
    tier: 'epic',
    screen: 3,
    backgroundKey: 'epic',
    textData: 'epicwin_textData',
    textAtlas: 'epicwin_textAtlas',
    stageData: 'epicwinData',
    stageAtlas: 'epicwinAtlas',
    start: 'epicwin_start',
    idle: 'epicwin_idle',
    textY: 232,
    stageY: 490,
    textScale: 0.26,
    stageScale: 0.31,
    amountTop: 570,
    ctaBottom: 42,
    confetti: true,
  },
  legendary: {
    tier: 'legendary',
    screen: 4,
    backgroundKey: 'legendary',
    textData: 'legendarywin_textData',
    textAtlas: 'legendarywin_textAtlas',
    stageData: 'legendarywinData',
    stageAtlas: 'legendarywinAtlas',
    start: 'legendary_start',
    idle: 'legendary_idle',
    textY: 218,
    stageY: 490,
    textScale: 0.26,
    stageScale: 0.31,
    amountTop: 530,
    ctaBottom: 42,
    confetti: true,
  },
};

const SCREEN_TO_TIER: Record<WinScreen, WinTier> = {
  1: 'big',
  2: 'mega',
  3: 'epic',
  4: 'legendary',
};

export function resolveWinScreen(screen?: number): WinScreen {
  if (screen === 1 || screen === 2 || screen === 3 || screen === 4) return screen;
  return 4;
}

export function winScreenToTier(screen: WinScreen): WinTier {
  return SCREEN_TO_TIER[screen];
}

export function winScreenForDifficulty(difficulty: Difficulty): WinScreen {
  if (difficulty === 'easy') return 2;
  if (difficulty === 'medium') return 3;
  return 4;
}

export function winTierConfig(screen: WinScreen): WinTierConfig {
  return WIN_TIER_CONFIG[winScreenToTier(screen)];
}
