import './styles.css';
import { collisionChanceFor, Difficulty, INITIAL_POOL, multiplierFor, ROUTE_STEPS, Stake } from './config';
import { playSound, unlockAudio } from './audio';
import { GameScene, type PlaneCollisionPlan } from './scene';
import { loadBankedTotal, loadRoundHistory, saveBankedTotal, saveRoundHistory } from './storage';
import { GameUi, UiState } from './ui';

type Phase = 'ready' | 'jumping' | 'active' | 'crashed' | 'finishing' | 'won';

const root = document.querySelector<HTMLElement>('#app')!;
const scene = new GameScene();
const DEFAULT_ROUND_HISTORY = [1.5, 2.2, 0, 1.8, 0, 4, 1.8, 0, 2.2, 0, 1000, 1.8, 1.5, 1.8, 3.3, 4, 4, 2.2, 1.5, 0, 0];
let phase: Phase = 'ready';
let stake: Stake = 0.3;
let difficulty: Difficulty = 'easy';
let stepIndex = -1;
let roundValue = 0;
let bankedTotal = loadBankedTotal();
let marketingPool = INITIAL_POOL;
let roundHistory = loadRoundHistory(DEFAULT_ROUND_HISTORY);
let autoplay = false;
let payoutFlash = 0;
const AUTOPLAY_DELAY_MS = 320;

const ui = new GameUi(root, {
  onPlay: () => {
    unlockAudio();
    void start();
  },
  onGo: () => {
    unlockAudio();
    void attemptStep();
  },
  onCashout: () => {
    unlockAudio();
    void cashout();
  },
  onToggleAutoplay: () => {
    unlockAudio();
    autoplay = !autoplay;
    render();
    if (autoplay && phase === 'ready') void start();
    if (autoplay && phase === 'active') scheduleAutoplay();
  },
  onStake: (next) => {
    if (phase !== 'ready') return;
    stake = next;
    render();
  },
  onDifficulty: (next) => {
    if (phase !== 'ready') return;
    difficulty = next;
    scene.reset(difficulty);
    render();
  },
});

function state(): UiState {
  return {
    active: phase !== 'ready',
    busy: phase === 'jumping' || phase === 'crashed' || phase === 'finishing' || phase === 'won',
    autoplay,
    stake,
    difficulty,
    roundValue,
    totalBank: marketingPool,
    roundHistory,
    payoutFlash,
  };
}

function render() {
  ui.render(state());
  if (document.querySelector('canvas')) scene.resize(ui.getCanvasHost());
}

async function start() {
  if (phase !== 'ready') return;
  stepIndex = -1;
  roundValue = 0;
  scene.reset(difficulty);
  await attemptStep();
}

async function attemptStep() {
  if (phase !== 'ready' && phase !== 'active') return;
  phase = 'jumping';
  render();
  const next = stepIndex + 1;
  const randomCollision = next > 0 && Math.random() < collisionChanceFor(difficulty, next);
  const collisionPlan: PlaneCollisionPlan = scene.resolvePlaneCollision(next, randomCollision);
  if (collisionPlan !== 'none') {
    const lostAmount = roundValue;
    const crashed = await scene.crash(next, lostAmount, collisionPlan);
    if (crashed) {
      phase = 'crashed';
      roundValue = 0;
      debitTotalBank(stake);
      render();
      autoplay = false;
      recordRoundResult(multiplierFor(difficulty, next));
      resetRound();
      return;
    }
    await completeStep(next);
    return;
  }
  await scene.jumpTo(next, difficulty);
  await completeStep(next);
}

async function completeStep(next: number) {
  stepIndex = next;
  roundValue = Number((stake * multiplierFor(difficulty, stepIndex)).toFixed(2));
  if (stepIndex >= ROUTE_STEPS - 1) {
    phase = 'finishing';
    render();
    autoplay = false;
    const prize = Number((roundValue + stake * 5).toFixed(2));
    payoutFlash = prize;
    render();
    await scene.finish(prize);
    recordRoundResult(prize / stake);
    bank(prize);
    resetRound();
    return;
  }
  phase = 'active';
  render();
  scheduleAutoplay();
}

function scheduleAutoplay() {
  if (!autoplay || phase !== 'active') return;
  window.setTimeout(() => void attemptStep(), AUTOPLAY_DELAY_MS);
}

async function cashout() {
  if (phase !== 'active') return;
  phase = 'finishing';
  payoutFlash = roundValue;
  render();
  playSound('cashout');
  await scene.cashout(roundValue);
  recordRoundResult(roundValue / stake);
  bank(roundValue);
  resetRound();
}

function recordRoundResult(multiplier: number) {
  const result = Number(multiplier.toFixed(2));
  roundHistory = [result, ...roundHistory].slice(0, 40);
  saveRoundHistory(roundHistory);
}

function debitTotalBank(value: number) {
  marketingPool = Math.max(0, Number((marketingPool - value).toFixed(2)));
}

function bank(value: number) {
  bankedTotal = Number((bankedTotal + value).toFixed(2));
  marketingPool = Math.max(0, marketingPool - value);
  saveBankedTotal(bankedTotal);
}

function resetRound() {
  phase = 'ready';
  stepIndex = -1;
  roundValue = 0;
  payoutFlash = 0;
  scene.reset(difficulty);
  render();
}

render();
await scene.mount(ui.getCanvasHost(), difficulty);
window.addEventListener('resize', () => scene.resize(ui.getCanvasHost()));
