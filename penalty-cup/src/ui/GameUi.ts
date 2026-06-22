import { BETS, BONUS_CONFIG, DESIGN_HEIGHT, DESIGN_WIDTH, money, MULTIPLIERS } from '../game/config';
import { urls } from '../game/assets';
import { GOALS_FOR_TIER_WIN, winTierConfig, type WinScreen } from '../game/winConfig';
import type { Difficulty, GameState } from '../game/types';
import { COUNTRIES, flagStyle } from './flags';

type UiCallbacks = {
  confirmCountry: (flag: number) => void;
  cycleDifficulty: () => void;
  cycleBet: () => void;
  claim: () => void;
  openBonus: () => void;
  onInstallClick: (event: MouseEvent) => void;
  onPlayMarketClick: (event: MouseEvent) => void;
};

type UiModel = {
  balance: number;
  lastWin: number;
  bet: number;
  difficulty: Difficulty;
  step: number;
  state: GameState;
  shotsLeft?: number;
  playerFlag: number;
};

export class GameUi {
  private readonly frame = document.createElement('div');
  private readonly modalLayer = document.createElement('div');
  private readonly status: HTMLElement;
  private readonly balance: HTMLElement;
  private readonly multiplier: HTMLElement;
  private readonly difficulty: HTMLElement;
  private readonly betLabel: HTMLElement;
  private readonly betValue: HTMLElement;
  private readonly lastWin: HTMLElement;
  private readonly claimButton: HTMLButtonElement;
  private readonly claimAmount: HTMLElement;
  private readonly difficultyButton: HTMLButtonElement;
  private readonly betButton: HTMLButtonElement;
  private readonly buyBonusButton: HTMLButtonElement;
  private readonly playerFlag: HTMLElement;
  private bonusBetIndex = 0;
  private multiplierKey = '';

  constructor(host: HTMLElement, private readonly callbacks: UiCallbacks) {
    this.frame.className = 'game-ui';
    this.frame.innerHTML = `
      <header class="topbar">
        <img class="brand" src="${urls.logo}" alt="Penalty Cup">
        <div class="balance"><span data-ui="balance"></span><i aria-hidden="true">$</i></div>
      </header>
      <section class="multiplier" data-ui="multiplier" aria-label="Multiplier progress"></section>
      <div class="status" data-ui="status" data-tone="default"></div>
      <div class="team-bar">
        <div class="teams"><span class="flag-sprite" data-ui="player-flag" role="img" aria-label="Your team"></span><b>VS</b><span class="flag-sprite" style="${flagStyle(8)}" role="img" aria-label="Opponent"></span></div>
        <button class="buy-bonus">BUY BONUS</button>
      </div>
      <section class="control-panel">
        <button class="control-cell" data-action="difficulty"><span class="control-copy"><small>DIFFICULTY</small><strong data-ui="difficulty"></strong></span><span class="steppers" aria-hidden="true"><i></i><i></i></span></button>
        <button class="control-cell" data-action="bet"><span class="control-copy"><small data-ui="bet-label">BET</small><strong data-ui="bet-value"></strong></span><span class="steppers" aria-hidden="true"><i></i><i></i></span></button>
        <div class="control-cell last-win"><small>LAST WIN</small><span class="money-row"><i aria-hidden="true">$</i><strong data-ui="last-win"></strong></span></div>
        <button class="claim-button" data-action="claim"><span>CLAIM</span><strong data-ui="claim-amount" hidden></strong></button>
      </section>`;
    this.modalLayer.className = 'modal-layer';
    this.frame.appendChild(this.modalLayer);
    host.appendChild(this.frame);
    this.status = this.get('[data-ui="status"]');
    this.balance = this.get('[data-ui="balance"]');
    this.multiplier = this.get('[data-ui="multiplier"]');
    this.multiplier.style.setProperty('--slider-ball', `url("${urls.sliderBall}")`);
    this.difficulty = this.get('[data-ui="difficulty"]');
    this.betLabel = this.get('[data-ui="bet-label"]');
    this.betValue = this.get('[data-ui="bet-value"]');
    this.lastWin = this.get('[data-ui="last-win"]');
    this.claimButton = this.get<HTMLButtonElement>('[data-action="claim"]');
    this.claimAmount = this.get('[data-ui="claim-amount"]');
    this.difficultyButton = this.get<HTMLButtonElement>('[data-action="difficulty"]');
    this.betButton = this.get<HTMLButtonElement>('[data-action="bet"]');
    this.buyBonusButton = this.get<HTMLButtonElement>('.buy-bonus');
    this.playerFlag = this.get('[data-ui="player-flag"]');
    this.difficultyButton.addEventListener('click', callbacks.cycleDifficulty);
    this.betButton.addEventListener('click', callbacks.cycleBet);
    this.claimButton.addEventListener('click', callbacks.claim);
    this.buyBonusButton.addEventListener('click', callbacks.openBonus);
  }

  resize(width: number, height: number): void {
    const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
    this.frame.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }

  sync(model: UiModel): void {
    const bonusMode = model.shotsLeft !== undefined;
    this.frame.dataset.state = model.state;
    this.frame.classList.toggle('bonus-mode', bonusMode);
    this.balance.textContent = Math.round(model.balance).toLocaleString('en-US').replaceAll(',', ' ');
    this.difficulty.textContent = model.difficulty.toUpperCase();
    this.betLabel.textContent = model.shotsLeft === undefined ? 'BET' : `${model.shotsLeft} SHOTS`;
    this.betValue.textContent = money(model.bet);
    this.lastWin.textContent = money(model.lastWin).slice(1);
    this.playerFlag.setAttribute('style', flagStyle(model.playerFlag));
    this.playerFlag.setAttribute('aria-label', COUNTRIES[model.playerFlag] ?? 'Your team');
    const claimAmount = model.bet * MULTIPLIERS[model.difficulty][model.step];
    const canClaim = model.state === 'claim_available';
    this.claimButton.disabled = !canClaim;
    this.claimAmount.hidden = !canClaim;
    this.claimAmount.textContent = money(claimAmount);
    this.difficultyButton.disabled = bonusMode;
    this.betButton.disabled = bonusMode;
    this.buyBonusButton.disabled = bonusMode;
    this.renderMultiplier(model.difficulty, model.step);
  }

  setStatus(text: string, tone: 'default' | 'success' | 'danger' | 'gold' = 'default'): void {
    this.status.textContent = text;
    this.status.dataset.tone = tone;
  }

  clearStatus(): void {
    this.status.textContent = '';
    this.status.dataset.tone = 'default';
  }

  showCountrySelect(): void {
    let selected = Math.floor(Math.random() * COUNTRIES.length);
    this.modalLayer.innerHTML = `
      <div class="modal-scrim"></div>
      <section class="country-modal" role="dialog" aria-modal="true" aria-label="Choose your country">
        <h1>CHOOSE YOUR COUNTRY</h1>
        <h2 data-country-name>${COUNTRIES[selected].toUpperCase()}</h2>
        <div class="flag-grid">
          ${COUNTRIES.map((country, index) => `<button class="flag-choice${index === selected ? ' selected' : ''}" data-flag="${index}" aria-label="${country}" title="${country}"><span class="flag-sprite" style="${flagStyle(index)}"></span></button>`).join('')}
        </div>
        <label class="remember"><input type="checkbox"> Don't show again</label>
        <button class="confirm-country">CONFIRM</button>
      </section>`;
    const name = this.modalLayer.querySelector<HTMLElement>('[data-country-name]')!;
    this.modalLayer.querySelectorAll<HTMLButtonElement>('[data-flag]').forEach((choice) => {
      choice.addEventListener('click', () => {
        selected = Number(choice.dataset.flag);
        this.modalLayer.querySelector('.flag-choice.selected')?.classList.remove('selected');
        choice.classList.add('selected');
        name.textContent = COUNTRIES[selected].toUpperCase();
      });
    });
    this.modalLayer.querySelector('.confirm-country')?.addEventListener('click', () => this.callbacks.confirmCountry(selected));
  }

  showBonus(initialBet: number, onClose: () => void, onBuy: (difficulty: Difficulty, bet: number) => void): void {
    this.bonusBetIndex = Math.max(0, BETS.indexOf(initialBet as (typeof BETS)[number]));
    this.modalLayer.innerHTML = `
      <div class="modal-scrim bonus-scrim"></div>
      <section class="bonus-modal" role="dialog" aria-modal="true" aria-label="Buy bonus">
        <h1>BUY BONUS:</h1><button class="close-modal icon-button" aria-label="Close">×</button>
        <div class="bonus-options">
          ${(['easy', 'medium', 'hard'] as Difficulty[]).map((difficulty) => `
            <button class="bonus-card" data-bonus="${difficulty}">
              <img src="${urls.bonusCards[difficulty]}" alt="">
              <span class="bonus-copy"><b>${difficulty.toUpperCase()}</b><small>MAX WIN<br><em>${BONUS_CONFIG[difficulty].maxWinMultiplier}x</em></small><strong data-price="${difficulty}"></strong></span>
            </button>`).join('')}
        </div>
        <p>A MISS DOES NOT WASTE THE WINNINGS</p>
        <div class="bonus-bet"><button data-shift="-1" aria-label="Previous bet">‹</button><span><small>BET</small><strong data-bonus-bet></strong></span><button data-shift="1" aria-label="Next bet">›</button></div>
        <div class="bonus-wallet"><b>$${this.balance.textContent}</b><i aria-hidden="true"></i></div>
      </section>`;
    const refresh = () => {
      const bet = BETS[this.bonusBetIndex];
      this.modalLayer.querySelector<HTMLElement>('[data-bonus-bet]')!.textContent = money(bet);
      (['easy', 'medium', 'hard'] as Difficulty[]).forEach((difficulty) => {
        this.modalLayer.querySelector<HTMLElement>(`[data-price="${difficulty}"]`)!.textContent = money(bet * BONUS_CONFIG[difficulty].priceMultiplier);
      });
    };
    this.modalLayer.querySelector('.close-modal')?.addEventListener('click', onClose);
    this.modalLayer.querySelectorAll<HTMLButtonElement>('[data-shift]').forEach((control) => control.addEventListener('click', () => {
      this.bonusBetIndex = (this.bonusBetIndex + Number(control.dataset.shift) + BETS.length) % BETS.length;
      refresh();
    }));
    this.modalLayer.querySelectorAll<HTMLButtonElement>('[data-bonus]').forEach((card) => card.addEventListener('click', () => onBuy(card.dataset.bonus as Difficulty, BETS[this.bonusBetIndex])));
    refresh();
  }

  async showRoulette(): Promise<number> {
    const shots = 12 + Math.floor(Math.random() * 4);
    const sectorValues = [12, 13, 14, 15, 12, 13];
    const matchingSectors = sectorValues.flatMap((value, index) => value === shots ? [index] : []);
    const selectedSector = matchingSectors[Math.floor(Math.random() * matchingSectors.length)];
    const sectorCenter = -60 + selectedSector * 60;
    const finalAngle = 360 * 7 - 90 - sectorCenter;
    this.modalLayer.innerHTML = `
      <div class="modal-scrim roulette-scrim"></div>
      <section class="roulette-modal"><h1>ROULETTE</h1><p>12–15 SHOTS GUARANTEED</p>
        <div class="wheel-wrap">
          <div class="wheel-rotor" style="--wheel-angle:${finalAngle}deg">
            <img class="wheel" src="${urls.rouletteWheel}" alt="Roulette wheel">
          </div>
          <img class="wheel-arrow" src="${urls.rouletteArrow}" alt="">
        </div>
        <div class="roulette-result"><b>${shots}</b><span>BONUS SHOTS</span></div>
      </section>`;
    const rotor = this.modalLayer.querySelector<HTMLElement>('.wheel-rotor')!;
    requestAnimationFrame(() => rotor.classList.add('spinning'));
    await Promise.race([
      new Promise((resolve) => rotor.addEventListener('animationend', resolve, { once: true })),
      new Promise((resolve) => window.setTimeout(resolve, 2600)),
    ]);
    this.modalLayer.querySelector('.roulette-result')?.classList.add('visible');
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    return shots;
  }

  showFinalWinScreen(amount: number, multiplier: number | undefined, onDismiss: () => void, screen = 4): void {
    const layout = winTierConfig(screen as WinScreen);
    const multiplierMarkup = multiplier === undefined
      ? ''
      : `<div class="win-multiplier">${Math.round(multiplier * 100) / 100} X BET</div>`;
    let dismissed = false;
    const dismiss = (): void => {
      if (dismissed) return;
      dismissed = true;
      onDismiss();
    };
    this.modalLayer.innerHTML = `
      <section
        class="win-controls"
        aria-label="Win result"
        data-win-screen="${screen}"
        style="--win-amount-top:${layout.amountTop}px;--win-cta-bottom:${layout.ctaBottom}px"
      >
        <button type="button" class="win-dismiss" aria-label="Continue"></button>
        <div class="win-amount">${money(amount)}</div>
        ${multiplierMarkup}
        <div class="win-cta">
          <div class="win-cta-panel">
            <button type="button" class="win-cta-install">
              <small>GET THE APP</small>
              <strong>INSTALL</strong>
            </button>
            <button type="button" class="win-cta-market">
              <small>DOWNLOAD FROM</small>
              <strong>PLAY MARKET</strong>
            </button>
          </div>
        </div>
        <b>TAP OUTSIDE BUTTONS TO CONTINUE</b>
      </section>`;
    this.modalLayer.querySelector<HTMLButtonElement>('.win-cta-install')!.addEventListener('click', (event) => {
      event.stopPropagation();
      this.callbacks.onInstallClick(event);
    });
    this.modalLayer.querySelector<HTMLButtonElement>('.win-cta-market')!.addEventListener('click', (event) => {
      event.stopPropagation();
      this.callbacks.onPlayMarketClick(event);
    });
    this.modalLayer.querySelector('.win-controls')?.addEventListener('click', (event) => {
      if ((event.target as HTMLElement).closest('.win-cta-install, .win-cta-market')) return;
      dismiss();
    });
  }

  hideFinalWinScreen(): void {
    this.clearModal();
  }

  clearModal(): void {
    this.modalLayer.innerHTML = '';
  }

  private renderMultiplier(difficulty: Difficulty, step: number): void {
    const values = MULTIPLIERS[difficulty];
    const start = Math.max(1, Math.min(values.length - 6, step - 2));
    const key = `${difficulty}:${step}:${start}`;
    if (key === this.multiplierKey) return;
    this.multiplierKey = key;
    const filledSlots = Math.min(Math.max(step, 0), GOALS_FOR_TIER_WIN);
    const progress = filledSlots <= 1 ? 0 : (filledSlots - 1) / (GOALS_FOR_TIER_WIN - 1);
    const steps = values.slice(start, start + 6).map((value, index) => {
      const absoluteIndex = start + index;
      const active = absoluteIndex === step;
      const complete = index < filledSlots;
      return `<span class="multiplier-step${active ? ' active' : ''}${complete ? ' complete' : ''}"><i aria-hidden="true"></i><b>x${value}</b></span>`;
    }).join('');
    this.multiplier.innerHTML = `<span class="multiplier-arrow" aria-hidden="true">‹</span><div class="multiplier-track" style="--progress:${progress * 100}%"><span class="multiplier-fill"></span>${steps}</div><span class="multiplier-arrow" aria-hidden="true">›</span>`;
  }

  private get<T extends HTMLElement = HTMLElement>(selector: string): T {
    return this.frame.querySelector<T>(selector)!;
  }
}
