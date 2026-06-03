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
let goBlocked = false;
const AUTOPLAY_DELAY_MS = 180;

const ui = new GameUi(root, {
  onPlay: () => void start(),
  onGo: () => void attemptStep(),
  onCashout: () => void cashout(),
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
    goBlocked,
    online,
    liveWin,
  };
}

function render() {
  ui.render(state());
  if (document.querySelector('canvas')) scene.resize(ui.getCanvasHost());
}

function syncGoBlocked() {
  const next = stepIndex + 1;
  const blocked = (phase === 'ready' || phase === 'active')
    && next >= 0
    && next < ROUTE_STEPS
    && scene.isStepBlockedForJump(next);
  if (blocked === goBlocked) return;
  goBlocked = blocked;
  render();
}

async function start() {
  if (phase !== 'ready') return;
  stepIndex = -1;
  roundValue = 0;
  goBlocked = false;
  scene.reset(difficulty);
  await attemptStep();
}

async function attemptStep() {
  if (phase !== 'ready' && phase !== 'active') return;
  const next = stepIndex + 1;
  if (scene.isStepBlockedForJump(next)) {
    goBlocked = true;
    render();
    if (autoplay) scheduleAutoplay();
    return;
  }
  phase = 'jumping';
  goBlocked = false;
  render();
  const existingVehicleWillHit = scene.prepareVehicleCrash(next);
  if (!existingVehicleWillHit) scene.prepareBarrierStop(next);
  const collision = !existingVehicleWillHit
    && next > 0
    && !scene.hasVehicleOnStep(next)
    && Math.random() < collisionChanceFor(difficulty, next);
  if (collision) {
    phase = 'crashed';
    roundValue = 0;
    goBlocked = false;
    render();
    autoplay = false;
    await scene.crash(next);
    resetRound();
    return;
  }
  await scene.jumpTo(next, difficulty, { placeBarrier: !existingVehicleWillHit });
  stepIndex = next;
  if (existingVehicleWillHit || scene.hasVehicleThreatOnStep(next)) {
    phase = 'crashed';
    roundValue = 0;
    goBlocked = false;
    render();
    autoplay = false;
    const crashed = await scene.crashWithExistingVehicle(next);
    if (crashed) {
      resetRound();
      return;
    }
  }
  roundValue = Number((stake * multiplierFor(difficulty, stepIndex)).toFixed(2));
  if (stepIndex >= ROUTE_STEPS - 1) {
    phase = 'finishing';
    goBlocked = false;
    render();
    autoplay = false;
    const prize = Number((roundValue + stake * 5).toFixed(2));
    await scene.finish(prize);
    bank(prize);
    resetRound();
    return;
  }
  phase = 'active';
  syncGoBlocked();
  render();
  scheduleAutoplay();
}

function scheduleAutoplay() {
  if (!autoplay || phase !== 'active') return;
  window.setTimeout(() => void attemptStep(), AUTOPLAY_DELAY_MS);
}

async function cashout() {
  if (phase !== 'active') return;
  const prize = roundValue;
  phase = 'finishing';
  autoplay = false;
  goBlocked = false;
  render();
  playSound('cashout');
  await scene.showWinNotification(prize);
  bank(prize);
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
  goBlocked = false;
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
window.setInterval(syncGoBlocked, 100);
window.setInterval(showLiveWin, 4200);
window.setTimeout(showLiveWin, 900);
