import { Difficulty, STAKES, Stake } from './config';

export type UiState = {
  active: boolean;
  busy: boolean;
  autoplay: boolean;
  stake: Stake;
  difficulty: Difficulty;
  roundValue: number;
  pool: number;
  goBlocked: boolean;
  online: number;
  finalWin: boolean;
  liveWin?: { name: string; amount: number };
};

export type UiHandlers = {
  onPlay: () => void;
  onGo: () => void;
  onCashout: () => void;
  onInstallClick: (event: MouseEvent) => void;
  onPlayMarketClick: (event: MouseEvent) => void;
  onToggleAutoplay: () => void;
  onStake: (stake: Stake) => void;
  onDifficulty: (difficulty: Difficulty) => void;
};

const money = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 2 }).replace(/,/g, ' ');

export class GameUi {
  private readonly root: HTMLElement;
  private readonly handlers: UiHandlers;
  private state!: UiState;

  constructor(root: HTMLElement, handlers: UiHandlers) {
    this.root = root;
    this.handlers = handlers;
  }

  render(state: UiState) {
    const canvas = this.root.querySelector('canvas');
    this.state = state;
    const locked = state.active || state.busy;
    this.root.innerHTML = `
      <header class="topbar">
        <img class="logo" src="${import.meta.env.BASE_URL}assets/logo.png" alt="Chicken Crush" />
        <div class="header-actions">
          <button class="top-action how">ⓘ&nbsp; How to play?</button>
          <div class="pool"><b>${money(state.pool)}</b> <span>$</span></div>
          <button class="top-action icon" data-fullscreen>⛶</button>
          <button class="top-action icon">☰</button>
        </div>
      </header>
      <section class="live-wins">
        <div><strong>Live wins:</strong> <i></i> <strong>Online:</strong>&nbsp; <span class="online">${state.online}</span></div>
        <div class="live-row ${state.liveWin ? 'show' : ''}">
          <b class="avatar">●</b><strong>${state.liveWin?.name ?? ''}</strong>
          <em>${state.liveWin ? `+$${money(state.liveWin.amount)}` : ''}</em>
        </div>
      </section>
      <main id="canvas-host"></main>
      ${state.finalWin ? `
        <section
          class="final-win-overlay"
          aria-label="Win install prompt"
          style="--win-bg: url('${import.meta.env.BASE_URL}assets/win-notification.png'); --win-bg-mobile: url('${import.meta.env.BASE_URL}assets/win-notification-mobile.png')"
        >
          <div class="final-win-card">
            <h1>YOU WON</h1>
            <div class="final-win-actions">
              <button type="button" class="final-win-install">Install</button>
              <button type="button" class="final-win-market">Download from play market</button>
            </div>
          </div>
        </section>
      ` : ''}
      <section class="controls-shell">
        <div class="controls ${state.active ? 'round-active' : 'round-ready'}">
          <div class="stakes">
            <div class="stepper panel">
              <button data-stake="${STAKES[0]}" ${locked ? 'disabled' : ''}>MIN</button>
              <strong>${state.stake}</strong>
              <button data-stake="${STAKES[STAKES.length - 1]}" ${locked ? 'disabled' : ''}>MAX</button>
            </div>
            <div class="stake-row">
              ${STAKES.map((stake) => `<button data-stake="${stake}" class="${state.stake === stake ? 'selected' : ''}" ${locked ? 'disabled' : ''}>${stake} <span>$</span></button>`).join('')}
            </div>
          </div>
          <div class="difficulty">
            <div class="difficulty-heading"><span>Difficulty</span><small>Chance of being shot down</small></div>
            <select ${locked ? 'disabled' : ''}>
              ${(['easy', 'medium', 'hard', 'hardcore'] as Difficulty[]).map((difficulty) => `<option value="${difficulty}" ${state.difficulty === difficulty ? 'selected' : ''}>${difficulty[0].toUpperCase()}${difficulty.slice(1)}</option>`).join('')}
            </select>
            <div class="difficulty-tabs panel">
              ${(['easy', 'medium', 'hard', 'hardcore'] as Difficulty[]).map((difficulty) => `<button data-difficulty="${difficulty}" class="${state.difficulty === difficulty ? 'selected' : ''}" ${locked ? 'disabled' : ''}>${difficulty[0].toUpperCase()}${difficulty.slice(1)}</button>`).join('')}
            </div>
          </div>
          ${state.active ? '' : `<button class="autoplay ${state.autoplay ? 'selected' : ''}" aria-label="Toggle autoplay"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M20 50a30 30 0 0 1 56-15" /><path d="M80 50a30 30 0 0 1-56 15" /><path class="autoplay-arrow" d="m68 30 10 4 2-11Z" /><path class="autoplay-arrow" d="m32 70-10-4-2 11Z" /><path class="autoplay-play" d="m43 35 26 15-26 15Z" /></svg></button>`}
          <div class="primary">
            ${state.active
              ? `<button class="cashout" ${state.busy ? 'disabled' : ''}>CASH OUT<br><b>${money(state.roundValue)} USD</b></button><button class="go" ${state.busy || state.goBlocked ? 'disabled' : ''}>GO</button>`
              : `<button class="play" ${state.busy || state.goBlocked ? 'disabled' : ''}>Play</button>`}
          </div>
        </div>
      </section>`;
    this.bind();
    if (canvas) this.getCanvasHost().appendChild(canvas);
  }

  getCanvasHost() {
    return this.root.querySelector<HTMLElement>('#canvas-host')!;
  }

  updateDecorations(state: UiState) {
    const pool = this.root.querySelector('.pool b');
    const online = this.root.querySelector('.online');
    const row = this.root.querySelector('.live-row');
    if (pool) pool.textContent = money(state.pool);
    if (online) online.textContent = String(state.online);
    if (row) {
      row.classList.toggle('show', Boolean(state.liveWin));
      row.innerHTML = state.liveWin
        ? `<b class="avatar">●</b><strong>${state.liveWin.name}</strong><em>+$${money(state.liveWin.amount)}</em>`
        : '<b class="avatar">●</b><strong></strong><em></em>';
    }
  }

  private bind() {
    this.root.querySelector('.play')?.addEventListener('click', this.handlers.onPlay);
    this.root.querySelector('.go')?.addEventListener('click', this.handlers.onGo);
    this.root.querySelector('.cashout')?.addEventListener('click', this.handlers.onCashout);
    this.root.querySelector('.final-win-install')?.addEventListener('click', (event) => {
      this.handlers.onInstallClick(event as MouseEvent);
    });
    this.root.querySelector('.final-win-market')?.addEventListener('click', (event) => {
      this.handlers.onPlayMarketClick(event as MouseEvent);
    });
    this.root.querySelector('.autoplay')?.addEventListener('click', this.handlers.onToggleAutoplay);
    this.root.querySelectorAll<HTMLButtonElement>('[data-stake]').forEach((button) => {
      button.addEventListener('click', () => this.handlers.onStake(Number(button.dataset.stake) as Stake));
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-difficulty]').forEach((button) => {
      button.addEventListener('click', () => this.handlers.onDifficulty(button.dataset.difficulty as Difficulty));
    });
    this.root.querySelector('select')?.addEventListener('change', (event) => {
      this.handlers.onDifficulty((event.target as HTMLSelectElement).value as Difficulty);
    });
    this.root.querySelector('[data-fullscreen]')?.addEventListener('click', () => {
      void (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen());
    });
  }
}
