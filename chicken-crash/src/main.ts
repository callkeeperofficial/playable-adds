import './styles.css';
import { collisionChanceFor, Difficulty, INITIAL_POOL, LIVE_WINS, multiplierFor, ROUTE_STEPS, Stake } from './config';
import { playSound } from './audio';
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
let online = 16_500 + Math.floor(Math.random() * 230);
let liveWin: UiState['liveWin'];

const ui = new GameUi(root, {
  onPlay: () => void start(),
  onGo: () => void attemptStep(),
  onCashout: cashout,
  onToggleAutoplay: () => {
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
    online,
    liveWin,
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
  const collision = next > 0 && Math.random() < collisionChanceFor(difficulty, next);
  if (collision) {
    phase = 'crashed';
    roundValue = 0;
    render();
    autoplay = false;
    await scene.crash(next);
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
  window.setTimeout(() => void attemptStep(), 650);
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

function showLiveWin() {
  const [name, amount] = LIVE_WINS[Math.floor(Math.random() * LIVE_WINS.length)];
  liveWin = { name, amount };
  marketingPool = Math.max(0, marketingPool - amount);
  online += Math.floor(Math.random() * 17) - 8;
  ui.updateDecorations(state());
  window.setTimeout(() => {
    liveWin = undefined;
    ui.updateDecorations(state());
  }, 2300);
}

render();
await scene.mount(ui.getCanvasHost(), difficulty);
window.addEventListener('resize', () => scene.resize(ui.getCanvasHost()));
window.setInterval(showLiveWin, 4200);
window.setTimeout(showLiveWin, 900);
