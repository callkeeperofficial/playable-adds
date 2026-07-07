import { Application, Assets, Container, Graphics, Rectangle, Sprite, Text, TextStyle, Texture } from 'pixi.js';
import { Spine } from '@esotericsoftware/spine-pixi-v8';
import { multiplierFor, ROAD_HEIGHT, ROUTE_STEPS, STEP_WIDTH, Difficulty } from './config';
import { playSound } from './audio';
import { assetUrl } from './publicPath';

type Frame = { x: number; y: number; w: number; h: number };
type StepQuality = 'muted' | 'active' | 'passed' | 'hidden';
type StepView = {
  root: Container;
  medal: Sprite;
  label: Text;
  vent: Sprite;
  quality: StepQuality;
  flipToken: number;
};
type AmbientVehicle = { sprite: Sprite; speed: number; stepIndex: number; stopY?: number; stopped?: boolean };
type JumpOptions = { placeBarrier?: boolean };

const WORLD_START = 500;
const ROAD_TOP = 0;
const MANHOLE_Y = 550;
const CHICKEN_Y = 580;
const MUTED_TINT = 0xe4e1dd;
const BARRIER_STOP_Y = 118;
const MANHOLE_SCALE = 0.42;
const HATCH_FLIP_MS = 260;
const FINAL_STOP_SCREEN_TRAVEL = 0.34;
const FINAL_STOP_SPEED_PX_PER_SECOND = 115;
const FINAL_STOP_MIN_MS = 1800;
const FINAL_STOP_MAX_MS = 2600;
const MULTIPLIER_BADGE_Y = CHICKEN_Y + 165;
const frames = {
  lamp: { x: 0, y: 0, w: 455, h: 770 },
  iceTruck: { x: 510, y: 0, w: 385, h: 735 },
  taxi: { x: 935, y: 0, w: 335, h: 590 },
  police: { x: 1295, y: 0, w: 390, h: 590 },
  barrier: { x: 19, y: 786, w: 511, h: 256 },
  multiplierBadge: { x: 550, y: 760, w: 364, h: 247 },
  fireTruck: { x: 0, y: 1120, w: 420, h: 820 },
  iceTruck2: { x: 430, y: 1070, w: 400, h: 780 },
  greenTruck: { x: 845, y: 1030, w: 380, h: 700 },
  vent: { x: 1386, y: 589, w: 433, h: 426 },
  medal: { x: 1386, y: 1025, w: 433, h: 433 },
} satisfies Record<string, Frame>;
const HATCH_TOP_Y = MANHOLE_Y - (frames.vent.h * MANHOLE_SCALE) / 2;
const HATCH_BOTTOM_Y = MANHOLE_Y + (frames.vent.h * MANHOLE_SCALE) / 2;

const crop = (texture: Texture, frame: Frame) => new Texture({
  source: texture.source,
  frame: new Rectangle(frame.x, frame.y, frame.w, frame.h),
});
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const ease = (value: number) => 1 - (1 - value) ** 3;

function label(value: string, size: number, color = '#e7e6e2') {
  return new Text({
    text: value,
    style: new TextStyle({
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: size,
      fontWeight: '900',
      fill: color,
      stroke: { color: '#45413e', width: Math.max(3, size / 13) },
    }),
  });
}

export class GameScene {
  private app = new Application();
  private world = new Container();
  private overlay = new Container();
  private route = new Container();
  private vehicles = new Container();
  private multiplierBadge = new Container();
  private chicken = new Container();
  private chickenParts: Container[] = [];
  private steps: StepView[] = [];
  private multiplierText!: Text;
  private objectTexture!: Texture;
  private chickenTexture!: Texture;
  private spineChicken?: Spine;
  private startTexture!: Texture;
  private finishTexture!: Texture;
  private winNotificationTexture!: Texture;
  private winNotificationMobileTexture!: Texture;
  private viewWidth = 1200;
  private viewHeight = ROAD_HEIGHT;
  private worldScale = 1;
  private currentStep = -1;
  private ambientVehicles: AmbientVehicle[] = [];
  private activeVehicleSteps = new Set<number>();
  private pendingCrashVehicle?: AmbientVehicle;
  private ambientSpawnElapsed = 0;
  private ambientPaused = false;

  async mount(host: HTMLElement, difficulty: Difficulty) {
    await this.app.init({ width: host.clientWidth, height: host.clientHeight, background: '#777370', antialias: true });
    host.appendChild(this.app.canvas);
    [
      this.objectTexture,
      this.chickenTexture,
      this.startTexture,
      this.finishTexture,
      this.winNotificationTexture,
      this.winNotificationMobileTexture,
    ] = await Promise.all([
      Assets.load(assetUrl('objects-sprite.png')),
      Assets.load(assetUrl('chicken-sprite.png')),
      Assets.load(assetUrl('start-bg.png')),
      Assets.load(assetUrl('finish-bg.png')),
      Assets.load(assetUrl('win-notification.png')),
      Assets.load(assetUrl('win-notification-mobile.png')),
    ]);
    Assets.add({ alias: 'spineChickenData', src: assetUrl('spine/chiken/chiken.json') });
    Assets.add({ alias: 'spineChickenAtlas', src: assetUrl('spine/chiken/chiken.atlas') });
    await Assets.load(['spineChickenData', 'spineChickenAtlas']);
    this.app.stage.addChild(this.world, this.overlay);
    this.drawRoad();
    this.buildMultiplierBadge(difficulty);
    this.world.addChild(this.route, this.multiplierBadge, this.chicken, this.vehicles);
    this.buildRoute(difficulty);
    this.buildChicken();
    this.reset();
    this.resize(host);
    this.app.ticker.add((ticker) => this.updateAmbientVehicles(ticker.deltaMS));
  }

  resize(host: HTMLElement) {
    this.app.renderer.resize(host.clientWidth, host.clientHeight);
    this.worldScale = host.clientHeight / ROAD_HEIGHT;
    this.world.scale.set(this.worldScale);
    this.viewWidth = host.clientWidth;
    this.viewHeight = host.clientHeight;
    if (this.ambientPaused) return;
    this.positionCamera(this.currentStep, true);
  }

  setPaused(paused: boolean) {
    if (paused) this.app.ticker.stop();
    else this.app.ticker.start();
  }

  hasVehicleOnStep(stepIndex: number) {
    return this.activeVehicleSteps.has(stepIndex)
      || this.ambientVehicles.some((vehicle) => vehicle.stepIndex === stepIndex && !vehicle.sprite.destroyed);
  }

  isStepBlockedForJump(stepIndex: number) {
    return this.hasBlockingTraffic(stepIndex);
  }

  hasUnstoppableVehicleOnStep(stepIndex: number) {
    return Boolean(this.findCrushCandidateVehicle(stepIndex));
  }

  hasVehicleThreatOnStep(stepIndex: number) {
    return Boolean(this.findCrushImpactVehicle(stepIndex));
  }

  prepareVehicleCrash(stepIndex: number) {
    const vehicle = this.findCrushCandidateVehicle(stepIndex);
    if (!vehicle) return false;
    this.pendingCrashVehicle = vehicle;
    vehicle.stopY = CHICKEN_Y;
    return true;
  }

  prepareBarrierStop(stepIndex: number) {
    const vehicle = this.findBarrierCandidateVehicle(stepIndex);
    if (!vehicle) return false;
    vehicle.stopY = BARRIER_STOP_Y;
    return true;
  }

  reset(difficulty?: Difficulty) {
    this.ambientPaused = false;
    this.currentStep = -1;
    this.world.x = 0;
    this.steps.forEach((step, index) => {
      step.flipToken += 1;
      step.root.scale.x = 1;
      step.quality = 'muted';
      this.applyStepQuality(step, 'muted');
      if (difficulty) step.label.text = `${multiplierFor(difficulty, index).toFixed(2)}x`;
    });
    this.route.children.filter((child) => child.label === 'barrier').forEach((child) => child.destroy());
    this.vehicles.removeChildren().forEach((child) => child.destroy());
    this.ambientVehicles = [];
    this.activeVehicleSteps.clear();
    this.pendingCrashVehicle = undefined;
    this.ambientSpawnElapsed = 0;
    this.restoreChicken();
    this.chicken.position.set(180, CHICKEN_Y);
    this.updateCurrentMultiplier(difficulty ?? 'easy', 0);
    this.syncMultiplierBadge();
    this.multiplierBadge.visible = false;
  }

  async jumpTo(stepIndex: number, difficulty: Difficulty, options: JumpOptions = {}) {
    const fromX = this.chicken.x;
    const targetX = WORLD_START + stepIndex * STEP_WIDTH;
    playSound('jump');
    this.setSpineAnimation('jump', false);
    await this.animate(560, (progress) => {
      this.chicken.x = fromX + (targetX - fromX) * ease(progress);
      this.chicken.y = CHICKEN_Y - Math.sin(progress * Math.PI) * 150;
      this.chicken.rotation = Math.sin(progress * Math.PI * 2) * 0.08;
      this.syncMultiplierBadge();
      this.positionCamera(stepIndex, false);
    });
    this.chicken.y = CHICKEN_Y;
    this.chicken.rotation = 0;
    this.currentStep = stepIndex;
    this.updateCurrentMultiplier(difficulty, stepIndex);
    this.syncMultiplierBadge();
    this.multiplierBadge.visible = stepIndex < ROUTE_STEPS - 1;
    this.setSpineAnimation('idle', true);
    this.positionCamera(stepIndex, true);
    if (stepIndex > 0) this.passStep(stepIndex - 1);
    this.hideCurrentStep(stepIndex);
    if (options.placeBarrier !== false && stepIndex < ROUTE_STEPS - 1 && !this.findCrushImpactVehicle(stepIndex)) {
      this.addBarrier(stepIndex);
    }
    this.updateRouteHighlights(stepIndex + 1);
  }

  async crash(stepIndex: number) {
    const targetX = WORLD_START + stepIndex * STEP_WIDTH;
    const fromX = this.chicken.x;
    playSound('jump');
    this.setSpineAnimation('jump', false);
    await this.animate(560, (progress) => {
      this.chicken.x = fromX + (targetX - fromX) * ease(progress);
      this.chicken.y = CHICKEN_Y - Math.sin(progress * Math.PI) * 150;
      this.chicken.rotation = Math.sin(progress * Math.PI * 2) * 0.08;
      this.syncMultiplierBadge();
      this.positionCamera(stepIndex, false);
    });
    this.chicken.y = CHICKEN_Y;
    this.chicken.rotation = 0;
    this.currentStep = stepIndex;
    this.syncMultiplierBadge();
    this.multiplierBadge.visible = stepIndex < ROUTE_STEPS - 1;
    this.positionCamera(stepIndex, true);
    if (stepIndex > 0) this.passStep(stepIndex - 1);
    this.hideCurrentStep(stepIndex);
    this.updateRouteHighlights(stepIndex + 1);

    await this.sendVehicle(stepIndex, () => {
      playSound('lose');
      if (this.spineChicken) this.setSpineAnimation('death', false);
      else {
        this.chicken.visible = false;
        this.spawnCrashParts();
      }
      this.multiplierBadge.visible = false;
    });
    if (this.spineChicken) {
      await sleep(650);
      return;
    }
    await this.animate(900, (progress) => {
      this.chickenParts.forEach((part, index) => {
        part.x += (index - 3) * 1.8;
        part.y += -6 + progress * 12 + index * 0.35;
        part.rotation += (index % 2 ? 1 : -1) * 0.09;
        part.alpha = 1 - Math.max(0, progress - 0.64) * 2.7;
      });
    });
    await sleep(450);
  }

  async crashWithExistingVehicle(stepIndex: number) {
    const vehicle = this.findCrushImpactVehicle(stepIndex);
    if (!vehicle) return false;
    this.pendingCrashVehicle = undefined;
    this.removeBarrier(stepIndex);
    this.multiplierBadge.visible = false;
    await new Promise<void>((resolve) => {
      const tick = () => {
        if (vehicle.sprite.destroyed || vehicle.sprite.y >= CHICKEN_Y) resolve();
        else requestAnimationFrame(tick);
      };
      tick();
    });
    if (vehicle.sprite.destroyed) return false;
    vehicle.sprite.y = Math.max(vehicle.sprite.y, CHICKEN_Y);
    vehicle.stopped = true;
    playSound('lose');
    if (this.spineChicken) {
      this.setSpineAnimation('death', false);
      await sleep(650);
      return true;
    }
    this.chicken.visible = false;
    this.spawnCrashParts();
    await this.animate(900, (progress) => {
      this.chickenParts.forEach((part, index) => {
        part.x += (index - 3) * 1.8;
        part.y += -6 + progress * 12 + index * 0.35;
        part.rotation += (index % 2 ? 1 : -1) * 0.09;
        part.alpha = 1 - Math.max(0, progress - 0.64) * 2.7;
      });
    });
    await sleep(450);
    return true;
  }

  async finish() {
    const fromX = this.chicken.x;
    const finishX = fromX + (this.viewWidth / this.worldScale) * FINAL_STOP_SCREEN_TRAVEL;
    const lockedChickenScreenX = this.chicken.x * this.worldScale + this.world.x;
    const finishDistancePx = (finishX - fromX) * this.worldScale;
    const finishDuration = Math.min(
      FINAL_STOP_MAX_MS,
      Math.max(FINAL_STOP_MIN_MS, (finishDistancePx / FINAL_STOP_SPEED_PX_PER_SECOND) * 1000),
    );
    this.setSpineAnimation('win', true);
    this.multiplierBadge.visible = false;
    this.chicken.y = CHICKEN_Y;
    this.chicken.rotation = 0;
    await this.animate(finishDuration, (progress) => {
      this.chicken.x = fromX + (finishX - fromX) * progress;
      this.chicken.y = CHICKEN_Y;
      this.syncMultiplierBadge();
      this.positionCameraAtWorldX(this.chicken.x, true, lockedChickenScreenX);
    });
    this.ambientPaused = true;
    playSound('win');
  }

  async showWinNotification(amount: number, playWinSound = false) {
    this.clearOverlay();
    this.multiplierBadge.visible = false;
    const isMobile = this.viewWidth < 1000;
    const texture = isMobile ? this.winNotificationMobileTexture : this.winNotificationTexture;
    const notification = new Container();
    const plate = new Sprite(texture);
    plate.anchor.set(0.5);
    const maxWidth = Math.min(this.viewWidth * (isMobile ? 0.84 : 0.58), texture.width);
    const plateScale = maxWidth / texture.width;
    plate.scale.set(plateScale);

    const title = label('YOU WON', isMobile ? 28 : 36, '#ffffff');
    title.anchor.set(0.5);
    title.position.set(0, isMobile ? -40 : -50);

    const amountText = label(`$${amount.toFixed(2)}`, isMobile ? 50 : 62, '#ffffff');
    amountText.anchor.set(0.5);
    amountText.position.set(0, isMobile ? 20 : 28);

    notification.addChild(plate, title, amountText);
    notification.position.set(this.viewWidth / 2, Math.min(this.viewHeight * 0.5, isMobile ? 270 : 330));
    notification.alpha = 0;
    notification.scale.set(0.84);
    this.overlay.addChild(notification);
    if (playWinSound) playSound('win');
    await this.animate(380, (progress) => {
      notification.alpha = progress;
      notification.scale.set(0.84 + progress * 0.16);
    });
    await sleep(1600);
    notification.destroy({ children: true });
    this.clearOverlay();
  }

  private drawRoad() {
    const bg = new Graphics();
    bg.rect(0, ROAD_TOP, WORLD_START + (ROUTE_STEPS + 3) * STEP_WIDTH, ROAD_HEIGHT).fill('#777370');
    for (let x = WORLD_START - STEP_WIDTH / 2; x < WORLD_START + (ROUTE_STEPS + 3) * STEP_WIDTH; x += STEP_WIDTH) {
      for (let y = -28; y < ROAD_HEIGHT; y += 128) {
        bg.rect(x, y, 12, 54).fill('#e7e4df');
      }
    }
    const start = new Sprite(this.startTexture);
    start.height = ROAD_HEIGHT;
    start.width = 370;
    const finish = new Sprite(this.finishTexture);
    finish.height = ROAD_HEIGHT;
    finish.width = 1160;
    finish.x = WORLD_START + ROUTE_STEPS * STEP_WIDTH;
    this.world.addChild(bg, start, finish);
  }

  private buildRoute(difficulty: Difficulty) {
    const ventTexture = crop(this.objectTexture, frames.vent);
    const medalTexture = crop(this.objectTexture, frames.medal);
    for (let index = 0; index < ROUTE_STEPS; index++) {
      const root = new Container();
      root.position.set(WORLD_START + index * STEP_WIDTH, MANHOLE_Y);
      const vent = new Sprite(ventTexture);
      vent.anchor.set(0.5);
      vent.scale.set(MANHOLE_SCALE);
      const medal = new Sprite(medalTexture);
      medal.anchor.set(0.5);
      medal.scale.set(MANHOLE_SCALE);
      medal.visible = false;
      const amount = label(`${multiplierFor(difficulty, index).toFixed(2)}x`, 43);
      amount.anchor.set(0.5);
      root.addChild(vent, medal, amount);
      this.route.addChild(root);
      this.steps.push({ root, medal, label: amount, vent, quality: 'muted', flipToken: 0 });
    }
  }

  private buildMultiplierBadge(difficulty: Difficulty) {
    const plate = new Sprite(crop(this.objectTexture, frames.multiplierBadge));
    plate.anchor.set(0.5);
    this.multiplierText = label(`${multiplierFor(difficulty, 0).toFixed(2)}x`, 98, '#ffffff');
    this.multiplierText.anchor.set(0.5);
    this.multiplierText.position.set(0, 24);
    this.multiplierBadge.scale.set(0.52);
    this.multiplierBadge.addChild(plate, this.multiplierText);
  }

  private updateCurrentMultiplier(difficulty: Difficulty, stepIndex: number) {
    if (!this.multiplierText) return;
    this.multiplierText.text = `${multiplierFor(difficulty, Math.max(0, stepIndex)).toFixed(2)}x`;
  }

  private syncMultiplierBadge() {
    this.multiplierBadge.position.set(this.chicken.x, MULTIPLIER_BADGE_Y);
  }

  private buildChicken() {
    try {
      const spine = Spine.from({
        skeleton: 'spineChickenData',
        atlas: 'spineChickenAtlas',
        scale: 1,
      });
      this.spineChicken = spine;
      this.setSpineAnimation('idle', true);
      spine.scale.set(1.22);
      spine.position.set(-6, 82);
      this.chicken.addChild(spine);
      this.chicken.scale.set(0.83);
      this.chicken.eventMode = 'static';
      this.chicken.cursor = 'pointer';
      this.chicken.hitArea = new Rectangle(-130, -150, 260, 260);
      this.chicken.on('pointertap', () => playSound('chick'));
      return;
    } catch {
      this.spineChicken = undefined;
    }
    const body = new Sprite(crop(this.chickenTexture, { x: 355, y: 90, w: 190, h: 175 }));
    body.anchor.set(0.5);
    body.scale.set(1.08);
    const head = new Sprite(crop(this.chickenTexture, { x: 1080, y: 140, w: 155, h: 125 }));
    head.anchor.set(0.5);
    head.position.set(38, -72);
    const wing = new Sprite(crop(this.chickenTexture, { x: 1110, y: 30, w: 135, h: 95 }));
    wing.anchor.set(0.5);
    wing.position.set(-74, 8);
    this.chicken.addChild(body, head, wing);
    this.chicken.scale.set(0.83);
    this.chicken.eventMode = 'static';
    this.chicken.cursor = 'pointer';
    this.chicken.hitArea = new Rectangle(-130, -150, 260, 260);
    this.chicken.on('pointertap', () => playSound('chick'));
  }

  private passStep(index: number) {
    this.setStepQuality(index, 'passed');
  }

  private hideCurrentStep(index: number) {
    this.setStepQuality(index, 'hidden', false);
  }

  private updateRouteHighlights(activeStep: number) {
    this.steps.forEach((step, index) => {
      if (step.quality === 'passed' || step.quality === 'hidden') return;
      this.setStepQuality(index, index === activeStep ? 'active' : 'muted', false);
    });
  }

  private setStepQuality(index: number, quality: StepQuality, animated = true) {
    const step = this.steps[index];
    if (!step || step.quality === quality) return;
    step.quality = quality;
    step.flipToken += 1;
    const token = step.flipToken;
    if (!animated) {
      step.root.scale.x = 1;
      this.applyStepQuality(step, quality);
      return;
    }

    let changed = false;
    void this.animate(HATCH_FLIP_MS, (progress) => {
      if (step.flipToken !== token) return;
      if (!changed && progress >= 0.5) {
        changed = true;
        this.applyStepQuality(step, quality);
      }
      const fold = progress < 0.5 ? 1 - progress * 2 : (progress - 0.5) * 2;
      step.root.scale.x = Math.max(0.08, fold);
    }).then(() => {
      if (step.flipToken !== token) return;
      if (!changed) this.applyStepQuality(step, quality);
      step.root.scale.x = 1;
    });
  }

  private applyStepQuality(step: StepView, quality: StepQuality) {
    const hatchVisible = quality === 'muted' || quality === 'active';
    const hatchTint = quality === 'active' ? 0xffffff : MUTED_TINT;
    step.vent.visible = hatchVisible;
    step.label.visible = hatchVisible;
    step.medal.visible = quality === 'passed';
    step.vent.tint = hatchTint;
    step.label.tint = hatchTint;
  }

  private addBarrier(index: number) {
    const barrier = new Sprite(crop(this.objectTexture, frames.barrier));
    barrier.label = 'barrier';
    barrier.anchor.set(0.5);
    barrier.scale.set(0.38);
    barrier.position.set(WORLD_START + index * STEP_WIDTH, 345);
    this.route.addChild(barrier);
  }

  private removeBarrier(index: number) {
    const x = WORLD_START + index * STEP_WIDTH;
    this.route.children
      .filter((child) => child.label === 'barrier' && Math.abs(child.x - x) < 1)
      .forEach((child) => child.destroy());
  }

  private async sendVehicle(stepIndex: number, onImpact?: () => void) {
    const carFrames = [frames.taxi, frames.police, frames.fireTruck, frames.greenTruck];
    const carFrame = carFrames[Math.floor(Math.random() * carFrames.length)];
    const car = new Sprite(crop(this.objectTexture, carFrame));
    const targetX = WORLD_START + stepIndex * STEP_WIDTH;
    car.anchor.set(0.5);
    car.scale.set(carFrame === frames.fireTruck ? 0.36 : 0.43);
    car.position.set(targetX, -260);
    this.vehicles.addChild(car);
    this.activeVehicleSteps.add(stepIndex);
    playSound('car');
    let impacted = false;
    try {
      await this.animate(720, (progress) => {
        car.y = -260 + progress * 1100;
        if (!impacted && car.y >= CHICKEN_Y) {
          impacted = true;
          onImpact?.();
        }
      });
      if (!impacted) onImpact?.();
    } finally {
      car.destroy();
      this.activeVehicleSteps.delete(stepIndex);
    }
  }

  private updateAmbientVehicles(deltaMS: number) {
    if (this.ambientPaused) return;
    this.ambientSpawnElapsed += deltaMS;
    if (this.ambientSpawnElapsed >= 2600) {
      this.ambientSpawnElapsed = 0;
      this.spawnAmbientVehicle();
    }
    this.ambientVehicles = this.ambientVehicles.filter((vehicle) => {
      if (vehicle.stopped) return true;
      if (vehicle.stepIndex <= this.currentStep && vehicle.stopY === undefined && vehicle.sprite.y < BARRIER_STOP_Y) {
        vehicle.stopY = BARRIER_STOP_Y;
      }

      const nextY = vehicle.sprite.y + vehicle.speed * deltaMS;
      if (vehicle.stopY !== undefined && nextY >= vehicle.stopY) {
        vehicle.sprite.y = vehicle.stopY;
        vehicle.stopped = true;
        return true;
      }

      vehicle.sprite.y = nextY;
      if (vehicle.sprite.y > ROAD_HEIGHT + 310 || vehicle.sprite.y < -310) {
        vehicle.sprite.destroy();
        return false;
      }
      return true;
    });
  }

  private spawnAmbientVehicle() {
    const visibleWorldLeft = -this.world.x / this.worldScale;
    const visibleWorldRight = visibleWorldLeft + this.viewWidth / this.worldScale;
    const firstVisibleStep = Math.max(0, Math.floor((visibleWorldLeft - WORLD_START) / STEP_WIDTH));
    const lastVisibleStep = Math.min(ROUTE_STEPS - 1, Math.ceil((visibleWorldRight - WORLD_START) / STEP_WIDTH));
    if (lastVisibleStep < firstVisibleStep) return;
    const availableSteps = Array.from(
      { length: lastVisibleStep - firstVisibleStep + 1 },
      (_, index) => firstVisibleStep + index,
    ).filter((stepIndex) => !this.hasVehicleOnStep(stepIndex));
    if (!availableSteps.length) return;
    const stepIndex = availableSteps[Math.floor(Math.random() * availableSteps.length)];
    const carFrame = [frames.taxi, frames.police, frames.iceTruck, frames.greenTruck][Math.floor(Math.random() * 4)];
    const sprite = new Sprite(crop(this.objectTexture, carFrame));
    const shouldStopAtBarrier = stepIndex <= this.currentStep;
    sprite.anchor.set(0.5);
    sprite.scale.set(carFrame === frames.iceTruck ? 0.3 : 0.37);
    sprite.position.set(WORLD_START + stepIndex * STEP_WIDTH, -260);
    this.vehicles.addChild(sprite);
    this.ambientVehicles.push({
      sprite,
      speed: 0.34,
      stepIndex,
      stopY: shouldStopAtBarrier ? BARRIER_STOP_Y : undefined,
    });
  }

  private hasBlockingTraffic(stepIndex: number) {
    return this.ambientVehicles.some((vehicle) => (
      vehicle.stepIndex === stepIndex
      && !vehicle.sprite.destroyed
      && this.vehicleOverlapsHatch(vehicle)
    ));
  }

  private findCrushCandidateVehicle(stepIndex: number) {
    return this.ambientVehicles.find((vehicle) => (
      vehicle.stepIndex === stepIndex
      && !vehicle.stopped
      && !vehicle.sprite.destroyed
      && this.vehicleCanCrushIfJumpedInFront(vehicle)
    ));
  }

  private findBarrierCandidateVehicle(stepIndex: number) {
    return this.ambientVehicles.find((vehicle) => (
      vehicle.stepIndex === stepIndex
      && !vehicle.stopped
      && !vehicle.sprite.destroyed
      && vehicle.sprite.y < BARRIER_STOP_Y
    ));
  }

  private findCrushImpactVehicle(stepIndex: number) {
    if (
      this.pendingCrashVehicle
      && this.pendingCrashVehicle.stepIndex === stepIndex
      && !this.pendingCrashVehicle.sprite.destroyed
    ) {
      return this.pendingCrashVehicle;
    }
    return this.ambientVehicles.find((vehicle) => (
      vehicle.stepIndex === stepIndex
      && !vehicle.stopped
      && !vehicle.sprite.destroyed
      && vehicle.stopY !== BARRIER_STOP_Y
      && this.vehicleCanStillHitChicken(vehicle)
    ));
  }

  private vehicleBounds(vehicle: AmbientVehicle) {
    const halfHeight = vehicle.sprite.height / 2;
    return {
      top: vehicle.sprite.y - halfHeight,
      bottom: vehicle.sprite.y + halfHeight,
    };
  }

  private vehicleOverlapsHatch(vehicle: AmbientVehicle) {
    const bounds = this.vehicleBounds(vehicle);
    return bounds.bottom >= HATCH_TOP_Y && bounds.top <= HATCH_BOTTOM_Y;
  }

  private vehicleCanCrushIfJumpedInFront(vehicle: AmbientVehicle) {
    return vehicle.sprite.y >= BARRIER_STOP_Y && vehicle.sprite.y < HATCH_TOP_Y;
  }

  private vehicleCanStillHitChicken(vehicle: AmbientVehicle) {
    const bounds = this.vehicleBounds(vehicle);
    return bounds.bottom >= BARRIER_STOP_Y && bounds.top <= HATCH_BOTTOM_Y;
  }

  private spawnCrashParts() {
    const pieces: Frame[] = [
      { x: 0, y: 45, w: 150, h: 220 },
      { x: 355, y: 90, w: 190, h: 175 },
      { x: 1080, y: 140, w: 155, h: 125 },
      { x: 1110, y: 30, w: 135, h: 95 },
      { x: 1300, y: 20, w: 80, h: 80 },
      { x: 1380, y: 100, w: 80, h: 80 },
      { x: 920, y: 45, w: 90, h: 90 },
    ];
    this.chickenParts = pieces.map((piece, index) => {
      const root = new Container();
      const sprite = new Sprite(crop(this.chickenTexture, piece));
      sprite.anchor.set(0.5);
      sprite.scale.set(0.65);
      root.addChild(sprite);
      root.position.set(this.chicken.x + (index - 3) * 12, CHICKEN_Y - 35);
      this.world.addChild(root);
      return root;
    });
  }

  private restoreChicken() {
    this.chickenParts.forEach((part) => part.destroy({ children: true }));
    this.chickenParts = [];
    this.chicken.visible = true;
    this.setSpineAnimation('idle', true);
  }

  private clearOverlay() {
    this.overlay.removeChildren().forEach((child) => child.destroy({ children: true }));
  }

  private setSpineAnimation(name: string, loop: boolean) {
    if (!this.spineChicken) return;
    const animation = this.spineChicken.skeleton.data.findAnimation(name);
    if (animation) this.spineChicken.state.setAnimation(0, animation.name, loop);
  }

  private positionCamera(stepIndex: number, immediate = false) {
    if (stepIndex < 1) return;
    const previousStepX = WORLD_START + Math.max(0, stepIndex - 1) * STEP_WIDTH;
    const leftMargin = Math.min(170, this.viewWidth * 0.17);
    const target = Math.min(0, leftMargin - previousStepX * this.worldScale);
    if (immediate) this.world.x = target;
    else this.world.x += (target - this.world.x) * 0.2;
  }

  private positionCameraAtWorldX(worldX: number, immediate = false, focusX = this.viewWidth * 0.58) {
    const worldRight = WORLD_START + ROUTE_STEPS * STEP_WIDTH + 1160;
    const minWorldX = Math.min(0, this.viewWidth - worldRight * this.worldScale);
    const target = Math.max(minWorldX, Math.min(0, focusX - worldX * this.worldScale));
    if (immediate) this.world.x = target;
    else this.world.x += (target - this.world.x) * 0.22;
  }

  private animate(duration: number, update: (progress: number) => void) {
    return new Promise<void>((resolve) => {
      const started = performance.now();
      const tick = () => {
        const progress = Math.min(1, (performance.now() - started) / duration);
        update(progress);
        if (progress < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
  }
}
