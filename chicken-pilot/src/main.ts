import './styles.css';
import { Difficulty, INITIAL_POOL, multiplierFor, ROUTE_STEPS, Stake } from './config';
import { playSound, unlockAudio } from './audio';
import { GameScene } from './scene';
import { loadBankedTotal, saveBankedTotal } from './storage';
import { GameUi, UiState } from './ui';

type Phase = 'ready' | 'jumping' | 'active' | 'crashed' | 'finishing' | 'won';

const root = document.querySelector<HTMLElement>('#app')!;
const scene = new GameScene();
let phase: Phase = 'ready';
let stake: Stake = 3;
let difficulty: Difficulty = 'easy';
let stepIndex = -1;
let roundValue = 0;
let bankedTotal = loadBankedTotal();
let marketingPool = INITIAL_POOL;
let autoplay = false;
const DISABLE_PLANE_COLLISIONS = true;
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
    cashout();
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
    pool: marketingPool,
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
  const collision = !DISABLE_PLANE_COLLISIONS && next > 0;
  if (collision) {
    const lostAmount = roundValue;
    phase = 'crashed';
    roundValue = 0;
    render();
    autoplay = false;
    await scene.crash(next, lostAmount);
    resetRound();
    return;
  }
  await scene.jumpTo(next, difficulty);
  stepIndex = next;
  roundValue = Number((stake * multiplierFor(difficulty, stepIndex)).toFixed(2));
  if (stepIndex >= ROUTE_STEPS - 1) {
    phase = 'finishing';
    render();
    autoplay = false;
    const prize = Number((roundValue + stake * 5).toFixed(2));
    await scene.finish(prize);
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

function cashout() {
  if (phase !== 'active') return;
  playSound('cashout');
  bank(roundValue);
  resetRound();
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
  scene.reset(difficulty);
  render();
}

render();
await scene.mount(ui.getCanvasHost(), difficulty);
window.addEventListener('resize', () => scene.resize(ui.getCanvasHost()));
