import { Difficulty, STAKES, Stake } from './config';

export type UiState = {
  active: boolean;
  busy: boolean;
  autoplay: boolean;
  stake: Stake;
  difficulty: Difficulty;
  roundValue: number;
  totalBank: number;
  roundHistory: number[];
  payoutFlash: number;
};

export type UiHandlers = {
  onPlay: () => void;
  onGo: () => void;
  onCashout: () => void;
  onToggleAutoplay: () => void;
  onStake: (stake: Stake) => void;
  onDifficulty: (difficulty: Difficulty) => void;
};

const money = (value: number) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, ' ');
const bankMoney = (value: number) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const stakeMoney = (value: number) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const stakePreset = (value: number) => value.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const historyValue = (value: number) => `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}x`;
const historyTone = (value: number) => {
  if (value === 0) return 'zero';
  if (value >= 100) return 'hot';
  if (value >= 2) return 'mid';
  return 'low';
};

export class GameUi {
  private readonly root: HTMLElement;
  private readonly handlers: UiHandlers;
  private state!: UiState;
  private initialized = false;
  private historyExpanded = false;

  constructor(root: HTMLElement, handlers: UiHandlers) {
    this.root = root;
    this.handlers = handlers;
  }

  render(state: UiState) {
    this.state = state;
    if (!this.initialized) {
      this.root.innerHTML = `
        <header class="topbar">
          <img class="logo logo-desktop" src="${import.meta.env.BASE_URL}assets/logo.png" alt="Chicken Pilot" />
          <img class="logo logo-mobile" src="${import.meta.env.BASE_URL}assets/logo-mobile@2x.png" alt="Chicken Pilot" />
          <div class="header-actions">
            <div class="payout-flash" aria-live="polite"></div>
            <div class="top-action total-bank"><b></b><span>USD</span></div>
            <div class="round-history" role="button" tabindex="0" aria-expanded="false"></div>
            <button class="top-action icon">☰</button>
          </div>
          <div class="header-difficulty difficulty"></div>
        </header>
        <main id="canvas-host"></main>
        <section class="controls-shell"></section>`;
      const history = this.root.querySelector<HTMLElement>('.round-history');
      history?.addEventListener('click', (event) => {
        event.stopPropagation();
        this.historyExpanded = !this.historyExpanded;
        this.updateHistory();
      });
      history?.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        this.historyExpanded = !this.historyExpanded;
        this.updateHistory();
      });
      document.addEventListener('click', (event) => {
        if (!this.historyExpanded) return;
        if (history?.contains(event.target as Node)) return;
        this.historyExpanded = false;
        this.updateHistory();
      });
      this.initialized = true;
    }

    this.updateHistory();
    this.updateTotalBank();
    this.updatePayoutFlash();

    const locked = state.active || state.busy;
    this.updateHeaderDifficulty(locked);
    const stakeIndex = Math.max(0, STAKES.indexOf(state.stake));
    const minusStake = STAKES[Math.max(0, stakeIndex - 1)];
    const plusStake = STAKES[Math.min(STAKES.length - 1, stakeIndex + 1)];
    this.root.querySelector<HTMLElement>('.controls-shell')!.innerHTML = `
        <div class="controls ${state.active ? 'round-active' : 'round-ready'}">
          <div class="stakes">
            <div class="stepper panel">
              <button class="stake-adjust" data-stake="${minusStake}" ${locked || stakeIndex === 0 ? 'disabled' : ''}>−</button>
              <strong>${stakeMoney(state.stake)}</strong>
              <button class="stake-adjust" data-stake="${plusStake}" ${locked || stakeIndex === STAKES.length - 1 ? 'disabled' : ''}>+</button>
            </div>
            <div class="stake-row">
              ${STAKES.map((stake) => `<button data-stake="${stake}" class="${state.stake === stake ? 'selected' : ''}" ${locked ? 'disabled' : ''}>${stakePreset(stake)}</button>`).join('')}
            </div>
          </div>
          <div class="primary">
            ${state.active
              ? `<button class="cashout" ${state.busy ? 'disabled' : ''}>CASH OUT<br><b>${money(state.roundValue)} USD</b></button><button class="go" ${state.busy ? 'disabled' : ''}>NEXT</button>`
              : `<button class="play" ${state.busy ? 'disabled' : ''}>BET<br><b>${stakeMoney(state.stake)} USD</b></button>`}
          </div>
        </div>`;
    this.bind();
  }

  getCanvasHost() {
    return this.root.querySelector<HTMLElement>('#canvas-host')!;
  }

  private updateTotalBank() {
    const totalBank = this.root.querySelector<HTMLElement>('.total-bank b');
    if (totalBank) totalBank.textContent = bankMoney(this.state.totalBank);
  }

  private updatePayoutFlash() {
    const payout = this.root.querySelector<HTMLElement>('.payout-flash');
    if (!payout) return;
    payout.textContent = this.state.payoutFlash > 0 ? `+${money(this.state.payoutFlash)}` : '';
    payout.classList.toggle('is-visible', this.state.payoutFlash > 0);
  }

  private updateHeaderDifficulty(locked: boolean) {
    const difficultyRoot = this.root.querySelector<HTMLElement>('.header-difficulty');
    if (!difficultyRoot) return;
    difficultyRoot.innerHTML = `
      <div class="difficulty-tabs panel">
        ${(['easy', 'medium', 'hard', 'hardcore'] as Difficulty[]).map((difficulty) => `<button data-difficulty="${difficulty}" class="${this.state.difficulty === difficulty ? 'selected' : ''}" ${locked ? 'disabled' : ''}>${difficulty[0].toUpperCase()}${difficulty.slice(1)}</button>`).join('')}
      </div>`;
  }

  private updateHistory() {
    const history = this.root.querySelector<HTMLElement>('.round-history');
    if (!history) return;
    const visibleItems = (this.historyExpanded ? this.state.roundHistory : this.state.roundHistory.slice(0, 5));
    const title = this.historyExpanded ? '<span class="round-history-title">Round History</span>' : '';
    history.classList.toggle('is-open', this.historyExpanded);
    history.setAttribute('aria-expanded', String(this.historyExpanded));
    history.innerHTML = `
      <div class="round-history-panel">
        <div class="round-history-top">
          ${title}
          <div class="round-history-actions">
            <svg class="history-clock" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 6v6l4 2" />
              <path d="M4.2 9A8 8 0 1 1 4 14" />
              <path d="M4 5v4h4" />
            </svg>
            <svg class="history-chevron" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
        <div class="round-history-list">
          ${visibleItems.map((value) => `<span class="history-item ${historyTone(value)}">${historyValue(value)}</span>`).join('')}
        </div>
      </div>`;
  }

  private bind() {
    this.root.querySelector('.play')?.addEventListener('click', this.handlers.onPlay);
    this.root.querySelector('.go')?.addEventListener('click', this.handlers.onGo);
    this.root.querySelector('.cashout')?.addEventListener('click', this.handlers.onCashout);
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
  }
}
