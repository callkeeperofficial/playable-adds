import './style.css';
import { loadAssets } from './game/assets';
import { GoalJackpot } from './game/GoalJackpot';

type ButtonObserver = (event: MouseEvent) => void;
type Unsubscribe = () => void;

type PenaltyCupPublicApi = {
  observeInstallButton: (callback: ButtonObserver) => Unsubscribe;
  observePlayMarketButton: (callback: ButtonObserver) => Unsubscribe;
  showGame: () => void;
  hideGame: () => void;
  showFinalWinScreen: (prize?: number, screen?: number) => void;
  hideFinalWinScreen: () => void;
};

declare global {
  interface Window {
    PenaltyCup: PenaltyCupPublicApi;
  }
}

const installObservers = new Set<ButtonObserver>();
const playMarketObservers = new Set<ButtonObserver>();

function subscribe(observers: Set<ButtonObserver>, callback: ButtonObserver): Unsubscribe {
  observers.add(callback);
  return () => {
    observers.delete(callback);
  };
}

function notifyObservers(observers: Set<ButtonObserver>, event: MouseEvent): void {
  Array.from(observers).forEach((observer) => {
    try {
      observer(event);
    } catch (error) {
      window.setTimeout(() => {
        throw error;
      });
    }
  });
}

const host = document.querySelector<HTMLElement>('#penalty-cup');
if (!host) throw new Error('Missing #penalty-cup host');

host.innerHTML = '<div style="display:grid;place-items:center;width:100%;height:100%;color:#fff;font:700 14px Arial">LOADING PENALTY CUP…</div>';

await loadAssets();
host.innerHTML = '';
const game = new GoalJackpot();
await game.mount(host);
game.bindPublicApiCallbacks(
  (event) => notifyObservers(installObservers, event),
  (event) => notifyObservers(playMarketObservers, event),
);

window.PenaltyCup = {
  observeInstallButton: (callback) => subscribe(installObservers, callback),
  observePlayMarketButton: (callback) => subscribe(playMarketObservers, callback),
  showGame: () => game.showGame(),
  hideGame: () => game.hideGame(),
  showFinalWinScreen: (prize, screen) => game.showFinalWinScreen(prize, screen),
  hideFinalWinScreen: () => game.hideFinalWinScreen(),
};

window.addEventListener('resize', () => game.resize(window.innerWidth, window.innerHeight));
