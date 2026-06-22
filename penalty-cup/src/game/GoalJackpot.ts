import { Spine } from '@esotericsoftware/spine-pixi-v8';
import { Application, Circle, Container, Graphics, type Ticker } from 'pixi.js';
import { WinOverlay } from '../components/WinOverlay';
import { GameUi } from '../ui/GameUi';
import { sleep } from '../ui/primitives';
import { BETS, BONUS_CONFIG, DESIGN_HEIGHT, DESIGN_WIDTH, MULTIPLIERS, SAVE_CHANCE } from './config';
import { GOAL_LAYOUT, SCENE_LAYOUT } from './layout';
import type { BonusMode, Difficulty, GameState } from './types';
import { CLAIMS_FOR_BIG_WIN, GOALS_FOR_TIER_WIN, resolveWinScreen, winScreenForDifficulty, type WinScreen } from './winConfig';

export class GoalJackpot {
  readonly app = new Application();
  private readonly root = new Container();
  private readonly scene = new Container();
  private readonly effectLayer = new Container();
  private readonly viewportMask = new Graphics().rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT).fill(0xffffff);
  private ui!: GameUi;
  private state: GameState = 'country_select';
  private difficulty: Difficulty = 'easy';
  private balance = 1_000_000;
  private lastWin = 0;
  private betIndex = 4;
  private currentStep = 0;
  private selectedFlag = 2;
  private roundPaid = false;
  private bonus: BonusMode | null = null;
  private background!: Spine;
  private gates!: Spine;
  private goalkeeper!: Spine;
  private ball!: Spine;
  private readonly targets = new Container();
  private host!: HTMLElement;
  private gameVisible = true;
  private finalWinVisible = false;
  private finalWinPreview = false;
  private countryConfirmed = false;
  private claimCount = 0;
  private onInstallClick: (event: MouseEvent) => void = () => {};
  private onPlayMarketClick: (event: MouseEvent) => void = () => {};

  async mount(host: HTMLElement): Promise<void> {
    this.host = host;
    await this.app.init({
      width: host.clientWidth,
      height: host.clientHeight,
      background: '#101416',
      antialias: true,
      resolution: Math.min(window.devicePixelRatio, 2),
      autoDensity: true,
    });
    host.appendChild(this.app.canvas);
    this.app.stage.addChild(this.root);
    this.root.addChild(this.scene, this.effectLayer, this.viewportMask);
    this.scene.mask = this.viewportMask;
    this.effectLayer.mask = this.viewportMask;
    this.ui = new GameUi(host, {
      confirmCountry: (flag) => this.confirmCountry(flag),
      cycleDifficulty: () => this.cycleDifficulty(),
      cycleBet: () => this.cycleBet(),
      claim: () => this.claim(),
      openBonus: () => this.openBonus(),
      onInstallClick: (event) => this.onInstallClick(event),
      onPlayMarketClick: (event) => this.onPlayMarketClick(event),
    });
    this.buildScene();
    this.resize(host.clientWidth, host.clientHeight);
    this.showCountrySelect();
  }

  resize(width: number, height: number): void {
    if (!this.gameVisible) return;
    this.app.renderer.resize(width, height);
    const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
    this.root.scale.set(scale);
    this.root.position.set((width - DESIGN_WIDTH * scale) / 2, (height - DESIGN_HEIGHT * scale) / 2);
    this.ui?.resize(width, height);
  }

  private buildScene(): void {
    this.background = Spine.from({ skeleton: 'backgroundData', atlas: 'backgroundAtlas' });
    this.background.scale.set(SCENE_LAYOUT.background.scale);
    this.background.position.set(SCENE_LAYOUT.background.x, SCENE_LAYOUT.background.y);
    this.background.state.setAnimation(0, 'background', true);

    this.gates = Spine.from({ skeleton: 'gatesData', atlas: 'gatesAtlas' });
    this.gates.scale.set(GOAL_LAYOUT.gates.scale);
    this.gates.position.set(GOAL_LAYOUT.gates.x, GOAL_LAYOUT.gates.y);
    this.resetGates();

    this.goalkeeper = Spine.from({ skeleton: 'goalkeeperData', atlas: 'goalkeeperAtlas' });
    this.goalkeeper.scale.set(GOAL_LAYOUT.goalkeeper.scale);
    this.goalkeeper.position.set(GOAL_LAYOUT.goalkeeper.x, GOAL_LAYOUT.goalkeeper.y);
    this.goalkeeper.skeleton.setSkinByName(this.difficulty);
    this.goalkeeper.skeleton.setSlotsToSetupPose();
    this.goalkeeper.state.setAnimation(0, 'idle', true);

    this.buildTargets();

    this.ball = Spine.from({ skeleton: 'ballData', atlas: 'ballAtlas' });
    this.prepareIdleBallAnimation();
    this.ball.eventMode = 'static';
    this.ball.cursor = 'pointer';
    this.ball.hitArea = new Circle(0, 0, 72);
    this.ball.on('pointertap', () => void this.kick(this.randomZone()));
    this.scene.addChild(this.background, this.gates, this.goalkeeper, this.targets, this.ball);
    this.setBallIdle();
    this.syncUi();
  }

  private buildTargets(): void {
    const { x, y, width, height, columns, rows } = GOAL_LAYOUT.targetGrid;
    const cellWidth = width / columns;
    const cellHeight = height / rows;
    this.targets.position.set(x, y);
    for (let zone = 1; zone <= 15; zone += 1) {
      const column = (zone - 1) % columns;
      const row = Math.floor((zone - 1) / columns);
      const target = new Graphics()
        .rect(column * cellWidth, row * cellHeight, cellWidth, cellHeight)
        .fill({ color: 0xffffff, alpha: 0.001 });
      target.eventMode = 'static';
      target.on('pointertap', () => void this.kick(zone));
      this.targets.addChild(target);
    }
  }

  private showCountrySelect(): void {
    this.state = 'country_select';
    this.ui.showCountrySelect();
  }

  private confirmCountry(flag: number): void {
    this.selectedFlag = flag;
    this.countryConfirmed = true;
    this.ui.clearModal();
    this.state = 'idle_before_kick';
    this.resetActors();
    this.syncUi();
  }

  private async kick(zone: number): Promise<void> {
    if (this.state !== 'idle_before_kick' && this.state !== 'claim_available' && this.state !== 'bonus_shot_idle') return;
    const isBonus = Boolean(this.bonus?.active);
    if (!isBonus && !this.roundPaid) {
      const bet = BETS[this.betIndex];
      if (this.balance < bet) return this.ui.setStatus('NOT ENOUGH BALANCE', 'danger');
      this.balance -= bet;
      this.roundPaid = true;
    }
    this.state = isBonus ? 'bonus_ball_flying' : 'ball_flying';
    this.targets.eventMode = 'none';
    this.ball.eventMode = 'none';
    const save = Math.random() < SAVE_CHANCE[this.difficulty];
    const keeperZone = save ? zone : this.otherZone(zone);
    this.ball.state.clearTracks();
    this.ball.skeleton.setToSetupPose();
    this.hideBallBranding();
    this.setBallDepth(false);
    const flightAnim = `ball_${zone}`;
    const flight = this.ball.state.setAnimation(0, flightAnim, false);
    flight.listener = {
      complete: () => {
        if (this.ball.parent === this.scene) this.setBallDepth(true);
      },
    };
    this.ball.state.addAnimation(0, `ball_${zone}_${save ? 2 : 1}`, false, 0);
    const ballTransform = this.tweenBallToShotTransform();
    void sleep(90).then(() => this.goalkeeper.state.setAnimation(0, `jump_${keeperZone}`, false));
    void sleep(230).then(() => this.gates.state.setAnimation(0, String(zone), false));
    this.ui.setStatus('SHOOT!');
    this.syncUi();
    await Promise.all([ballTransform, sleep(1150)]);
    if (isBonus) await this.finishBonusShot(save);
    else await this.finishNormalShot(save);
  }

  private async finishNormalShot(save: boolean): Promise<void> {
    if (save) {
      this.state = 'fail';
      this.currentStep = 0;
      this.roundPaid = false;
      this.lastWin = 0;
      await sleep(1150);
      this.state = 'idle_before_kick';
      this.resetActors();
    } else {
      this.currentStep = Math.min(this.currentStep + 1, MULTIPLIERS[this.difficulty].length - 1);
      if (this.currentStep >= GOALS_FOR_TIER_WIN) {
        const bet = BETS[this.betIndex];
        const amount = bet * MULTIPLIERS[this.difficulty][this.currentStep];
        this.balance += amount;
        this.lastWin = amount;
        this.syncUi();
        this.presentFinalWinScreen(
          amount,
          amount / bet,
          winScreenForDifficulty(this.difficulty),
        );
        return;
      }
      this.state = 'claim_available';
      this.resetActors();
    }
    this.syncUi();
  }

  private async finishBonusShot(save: boolean): Promise<void> {
    if (!this.bonus) return;
    this.state = 'bonus_shot_result';
    this.bonus.shotsLeft -= 1;
    if (!save) {
      this.bonus.currentStep = Math.min(this.bonus.currentStep + 1, MULTIPLIERS[this.bonus.difficulty].length - 1);
      const multiplier = MULTIPLIERS[this.bonus.difficulty][this.bonus.currentStep];
      this.bonus.accumulatedWin += this.bonus.bet * multiplier;
    }
    this.currentStep = this.bonus.currentStep;
    this.lastWin = this.bonus.accumulatedWin;
    this.syncUi();
    await sleep(850);
    if (this.bonus.shotsLeft <= 0) return this.finishBonus();
    this.state = 'bonus_shot_idle';
    this.resetActors();
    this.syncUi();
  }

  private claim(): void {
    if (this.state !== 'claim_available') return;
    const amount = BETS[this.betIndex] * MULTIPLIERS[this.difficulty][this.currentStep];
    this.balance += amount;
    this.lastWin = amount;
    this.claimCount += 1;
    this.currentStep = 0;
    this.roundPaid = false;
    this.syncUi();
    if (this.claimCount >= CLAIMS_FOR_BIG_WIN) {
      this.presentFinalWinScreen(amount, undefined, 1);
      return;
    }
    this.state = 'idle_before_kick';
    this.ui.clearStatus();
    this.syncUi();
  }

  private openBonus(): void {
    if (this.bonus?.active || this.state === 'ball_flying') return;
    this.state = 'buy_bonus_overlay';
    this.background.state.setAnimation(0, 'background_bonus', true);
    this.ui.showBonus(BETS[this.betIndex], () => this.closeBonusOverlay(), (difficulty, bet) => void this.buyBonus(difficulty, bet));
  }

  private closeBonusOverlay(): void {
    this.ui.clearModal();
    this.state = this.currentStep > 0 ? 'claim_available' : 'idle_before_kick';
    this.background.state.setAnimation(0, 'background', true);
    this.syncUi();
  }

  private async buyBonus(difficulty: Difficulty, bet: number): Promise<void> {
    const price = bet * BONUS_CONFIG[difficulty].priceMultiplier;
    if (this.balance < price) return this.ui.setStatus('NOT ENOUGH BALANCE', 'danger');
    this.balance -= price;
    this.difficulty = difficulty;
    this.betIndex = BETS.indexOf(bet as (typeof BETS)[number]);
    this.currentStep = 0;
    this.roundPaid = false;
    this.state = 'bonus_roulette';
    this.syncGoalkeeperSkin();
    this.syncUi();
    const shots = await this.ui.showRoulette();
    this.ui.clearModal();
    this.bonus = { active: true, difficulty, bet, price, shotsTotal: shots, shotsLeft: shots, accumulatedWin: 0, currentStep: 0 };
    this.state = 'bonus_intro';
    this.ui.setStatus(`${shots} BONUS SHOTS`, 'gold');
    this.syncUi();
    await sleep(800);
    this.state = 'bonus_shot_idle';
    this.resetActors();
    this.syncUi();
  }

  private async finishBonus(): Promise<void> {
    if (!this.bonus) return;
    this.state = 'bonus_result';
    const amount = this.bonus.accumulatedWin;
    const bet = this.bonus.bet;
    this.balance += amount;
    this.lastWin = amount;
    this.syncUi();
    this.presentFinalWinScreen(amount, amount / bet, winScreenForDifficulty(this.bonus.difficulty));
  }

  bindPublicApiCallbacks(onInstallClick: (event: MouseEvent) => void, onPlayMarketClick: (event: MouseEvent) => void): void {
    this.onInstallClick = onInstallClick;
    this.onPlayMarketClick = onPlayMarketClick;
  }

  showGame(): void {
    this.host.hidden = false;
    this.gameVisible = true;
    this.app.ticker.start();
    this.resetPlayable();
    this.resize(this.host.clientWidth, this.host.clientHeight);
  }

  hideGame(): void {
    this.gameVisible = false;
    this.app.canvas.style.pointerEvents = 'auto';
    this.dismissFinalWinScreen(false);
    this.ui.clearModal();
    this.bonus = null;
    this.claimCount = 0;
    this.countryConfirmed = false;
    this.state = 'country_select';
    this.currentStep = 0;
    this.roundPaid = false;
    this.resetActors();
    this.app.ticker.stop();
    this.host.hidden = true;
  }

  showFinalWinScreen(prize = 42.12, screen?: number): void {
    if (!this.gameVisible) this.showGame();
    this.presentFinalWinScreen(Number(prize.toFixed(2)), undefined, resolveWinScreen(screen), true);
  }

  hideFinalWinScreen(): void {
    this.dismissFinalWinScreen(true);
  }

  private presentFinalWinScreen(
    amount: number,
    multiplier: number | undefined,
    screen?: WinScreen,
    preview = false,
  ): void {
    this.finalWinVisible = true;
    this.finalWinPreview = preview;
    this.state = 'bonus_result';
    this.syncUi();
    this.effectLayer.removeChildren();
    this.app.canvas.style.pointerEvents = 'none';
    const visual = new WinOverlay();
    this.effectLayer.addChild(visual);
    const winScreen = screen ?? 4;
    visual.show(winScreen);
    this.ui.showFinalWinScreen(amount, multiplier, winScreen);
  }

  private dismissFinalWinScreen(onlyWhenPreview: boolean): void {
    if (!this.finalWinVisible) return;
    if (onlyWhenPreview && !this.finalWinPreview) return;
    this.app.canvas.style.pointerEvents = 'auto';
    this.effectLayer.removeChildren();
    this.ui.hideFinalWinScreen();
    this.finalWinVisible = false;
    this.finalWinPreview = false;
    this.bonus = null;
    this.state = this.countryConfirmed ? 'idle_before_kick' : 'country_select';
    this.background.state.setAnimation(0, 'background', true);
    this.resetActors();
    if (!this.countryConfirmed) this.ui.showCountrySelect();
    this.syncUi();
  }

  private resetPlayable(): void {
    this.dismissFinalWinScreen(false);
    this.ui.clearModal();
    this.bonus = null;
    this.claimCount = 0;
    this.currentStep = 0;
    this.roundPaid = false;
    if (!this.countryConfirmed) {
      this.state = 'country_select';
      this.showCountrySelect();
      this.syncUi();
      return;
    }
    this.state = 'idle_before_kick';
    this.background.state.setAnimation(0, 'background', true);
    this.resetActors();
    this.syncUi();
  }

  private cycleDifficulty(): void {
    if (this.bonus?.active || this.state === 'ball_flying') return;
    const values: Difficulty[] = ['easy', 'medium', 'hard'];
    this.difficulty = values[(values.indexOf(this.difficulty) + 1) % values.length];
    this.currentStep = 0;
    this.roundPaid = false;
    this.syncGoalkeeperSkin();
    this.syncUi();
  }

  private cycleBet(): void {
    if (this.bonus?.active || this.roundPaid) return;
    this.betIndex = (this.betIndex + 1) % BETS.length;
    this.syncUi();
  }

  private syncGoalkeeperSkin(): void {
    this.goalkeeper.skeleton.setSkinByName(this.difficulty);
    this.goalkeeper.skeleton.setSlotsToSetupPose();
    this.goalkeeper.state.setAnimation(0, 'idle', true);
  }

  private resetActors(resetStatus = true): void {
    this.setBallIdle();
    this.resetGates();
    this.goalkeeper.state.setAnimation(0, 'idle', true);
    this.targets.eventMode = 'static';
    this.ball.eventMode = 'static';
    if (resetStatus) this.ui.clearStatus();
  }

  private syncUi(): void {
    this.ui.sync({
      balance: this.balance,
      lastWin: this.lastWin,
      bet: this.bonus?.bet ?? BETS[this.betIndex],
      difficulty: this.difficulty,
      step: this.currentStep,
      state: this.state,
      shotsLeft: this.bonus?.shotsLeft,
      playerFlag: this.selectedFlag,
    });
  }

  private prepareIdleBallAnimation(): void {
    const stripSlotIndices = new Set([
      'InOut Logo – White (1) 1',
      'Untitled (26) 1',
      'Layer 2111',
      'Ellipse 111111',
    ].map((slotName) => this.ball.skeleton.findSlot(slotName)!.data.index));

    const targetGreen = this.ball.skeleton.data.findAnimation('target_green')!;
    targetGreen.setTimelines(targetGreen.timelines.filter((timeline) => {
      const slotTimeline = timeline as { slotIndex?: number };
      if (timeline.constructor.name !== 'AttachmentTimeline') return true;
      if (slotTimeline.slotIndex === undefined) return true;
      return !stripSlotIndices.has(slotTimeline.slotIndex);
    }));
  }

  private hideBallBranding(): void {
    this.ball.skeleton.findSlot('InOut Logo – White (1) 1')!.setAttachment(null);
  }

  private setBallIdle(): void {
    this.setBallDepth(false);
    const { x, y, scale } = GOAL_LAYOUT.ball.idle;
    this.ball.position.set(x, y);
    this.ball.scale.set(scale);
    this.ball.state.clearTracks();
    this.ball.skeleton.setToSetupPose();
    this.hideBallBranding();
    this.ball.state.setAnimation(0, 'target_green', true);
  }

  private setBallDepth(behindGoalkeeper: boolean): void {
    if (this.ball.parent !== this.scene) return;
    const keeperIndex = this.scene.getChildIndex(this.goalkeeper);
    if (behindGoalkeeper) {
      this.scene.setChildIndex(this.ball, keeperIndex);
      return;
    }
    this.scene.setChildIndex(this.ball, this.scene.children.length - 1);
  }

  private randomZone(): number {
    return Math.floor(Math.random() * 15) + 1;
  }

  private resetGates(): void {
    this.gates.state.clearTracks();
    this.gates.skeleton.setToSetupPose();
  }

  private tweenBallToShotTransform(): Promise<void> {
    const start = GOAL_LAYOUT.ball.idle;
    const end = GOAL_LAYOUT.ball.shot;
    let elapsed = 0;

    return new Promise((resolve) => {
      const update = (ticker: Ticker) => {
        elapsed += ticker.deltaMS;
        const progress = Math.min(elapsed / GOAL_LAYOUT.ball.transitionMs, 1);
        const eased = 1 - (1 - progress) ** 3;
        this.ball.position.set(
          start.x + (end.x - start.x) * eased,
          start.y + (end.y - start.y) * eased,
        );
        this.ball.scale.set(start.scale + (end.scale - start.scale) * eased);

        if (progress < 1) return;
        this.app.ticker.remove(update);
        resolve();
      };

      this.app.ticker.add(update);
    });
  }

  private otherZone(zone: number): number {
    return ((zone - 1 + 1 + Math.floor(Math.random() * 14)) % 15) + 1;
  }
}
