import './styles.css';
import { collisionChanceFor, Difficulty, INITIAL_POOL, LIVE_WINS, multiplierFor, ROUTE_STEPS, Stake } from './config';
import { playSound } from './audio';
import { GameScene } from './scene';
import { loadBankedTotal, saveBankedTotal } from './storage';
import { GameUi, UiState } from './ui';

type Phase = 'ready' | 'jumping' | 'active' | 'crashed' | 'finishing' | 'won';
type ButtonObserver = (event: MouseEvent) => void;
type Unsubscribe = () => void;

type ChickenCrashPublicApi = {
  observeInstallButton: (callback: ButtonObserver) => Unsubscribe;
  observePlayMarketButton: (callback: ButtonObserver) => Unsubscribe;
  showGame: () => void;
  hideGame: () => void;
  showFinalWinScreen: (prize?: number) => void;
  hideFinalWinScreen: () => void;
};

declare global {
  interface Window {
    ChickenCrash: ChickenCrashPublicApi;
  }
}

const root = document.querySelector<HTMLElement>('#chicken-crash-playable')!;
const scene = new GameScene();
const installObservers = new Set<ButtonObserver>();
const playMarketObservers = new Set<ButtonObserver>();
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
let finalWinPrize = 0;
let gameVisible = true;
const AUTOPLAY_DELAY_MS = 180;

const ui = new GameUi(root, {
  onPlay: () => void start(),
  onGo: () => void attemptStep(),
  onCashout: () => void cashout(),
  onInstallClick: (event) => notifyObservers(installObservers, event),
  onPlayMarketClick: (event) => notifyObservers(playMarketObservers, event),
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
    finalWin: phase === 'won',
    finalWinPrize: phase === 'won' ? finalWinPrize : undefined,
    liveWin,
  };
}

function render() {
  ui.render(state());
  if (gameVisible && root.querySelector('canvas')) scene.resize(ui.getCanvasHost());
}

function syncGoBlocked() {
  if (!gameVisible) return;
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
  if (!gameVisible || phase !== 'ready') return;
  stepIndex = -1;
  roundValue = 0;
  goBlocked = false;
  scene.reset(difficulty);
  await attemptStep();
}

async function attemptStep() {
  if (!gameVisible || (phase !== 'ready' && phase !== 'active')) return;
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
    if (!gameVisible) return;
    resetRound();
    return;
  }
  await scene.jumpTo(next, difficulty, { placeBarrier: !existingVehicleWillHit });
  if (!gameVisible) return;
  stepIndex = next;
  if (existingVehicleWillHit || scene.hasVehicleThreatOnStep(next)) {
    phase = 'crashed';
    roundValue = 0;
    goBlocked = false;
    render();
    autoplay = false;
    const crashed = await scene.crashWithExistingVehicle(next);
    if (!gameVisible) return;
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
    finalWinPrize = prize;
    bank(prize);
    await scene.finish();
    if (!gameVisible) return;
    phase = 'won';
    render();
    return;
  }
  phase = 'active';
  syncGoBlocked();
  render();
  scheduleAutoplay();
}

function scheduleAutoplay() {
  if (!gameVisible || !autoplay || phase !== 'active') return;
  window.setTimeout(() => void attemptStep(), AUTOPLAY_DELAY_MS);
}

async function cashout() {
  if (!gameVisible || phase !== 'active') return;
  const prize = roundValue;
  phase = 'finishing';
  autoplay = false;
  goBlocked = false;
  render();
  playSound('cashout');
  await scene.showWinNotification(prize);
  if (!gameVisible) return;
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
  if (!gameVisible || phase === 'won') return;
  const [name, amount] = LIVE_WINS[Math.floor(Math.random() * LIVE_WINS.length)];
  liveWin = { name, amount };
  marketingPool = Math.max(0, marketingPool - amount);
  online += Math.floor(Math.random() * 17) - 8;
  ui.updateDecorations(state());
  window.setTimeout(() => {
    if (!gameVisible) return;
    liveWin = undefined;
    ui.updateDecorations(state());
  }, 2300);
}

function subscribe(observers: Set<ButtonObserver>, callback: ButtonObserver) {
  observers.add(callback);
  return () => {
    observers.delete(callback);
  };
}

function notifyObservers(observers: Set<ButtonObserver>, event: MouseEvent) {
  Array.from(observers).forEach((observer) => {
    try {
      observer(event);
    } catch (error) {
      window.setTimeout(() => { throw error; });
    }
  });
}

function showGame() {
  root.hidden = false;
  gameVisible = true;
  scene.setPaused(false);
  resetRound();
}

function hideGame() {
  gameVisible = false;
  autoplay = false;
  liveWin = undefined;
  phase = 'ready';
  stepIndex = -1;
  roundValue = 0;
  goBlocked = false;
  finalWinPrize = 0;
  scene.reset(difficulty);
  render();
  scene.setPaused(true);
  root.hidden = true;
}

function showFinalWinScreen(prize = 42.12) {
  if (!gameVisible) showGame();
  autoplay = false;
  finalWinPrize = Number(prize.toFixed(2));
  phase = 'won';
  goBlocked = false;
  render();
}

function hideFinalWinScreen() {
  if (phase !== 'won') return;
  finalWinPrize = 0;
  resetRound();
}

render();
await scene.mount(ui.getCanvasHost(), difficulty);
window.ChickenCrash = {
  observeInstallButton: (callback) => subscribe(installObservers, callback),
  observePlayMarketButton: (callback) => subscribe(playMarketObservers, callback),
  showGame,
  hideGame,
  showFinalWinScreen,
  hideFinalWinScreen,
};
window.addEventListener('resize', () => {
  if (gameVisible) scene.resize(ui.getCanvasHost());
});
window.setInterval(syncGoBlocked, 100);
window.setInterval(showLiveWin, 4200);
window.setTimeout(showLiveWin, 900);
