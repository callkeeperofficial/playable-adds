import { Application, Assets, Container, Graphics, Rectangle, Sprite, Text, TextStyle, Texture } from 'pixi.js';
import { multiplierFor, ROAD_HEIGHT, ROUTE_STEPS, STEP_WIDTH, Difficulty } from './config';
import { playSound } from './audio';

type Frame = {
  x: number;
  y: number;
  w: number;
  h: number;
  rotate?: boolean;
  offsets?: [number, number, number, number];
};
type StepView = { root: Container; medal: Sprite; label: Text; vent: Sprite };
type AmbientVehicle = { sprite: Container; speed: number; stepIndex: number; soundPlayed: boolean };
type ChickenIdlePart = {
  sprite: Sprite;
  x: number;
  y: number;
  rotation: number;
  bob?: number;
  sway?: number;
  turn?: number;
  phase?: number;
};

const LOCATION_SCALE = 0.55;
const START_LOCATION_WIDTH = 563 * LOCATION_SCALE;
const START_LOCATION_Y = -360;
const WORLD_START = START_LOCATION_WIDTH + STEP_WIDTH / 2;
const FINISH_LOCATION_X = WORLD_START + ROUTE_STEPS * STEP_WIDTH;
const FINISH_CHICKEN_X = FINISH_LOCATION_X + 150;
const FINISH_CHICKEN_Y = 655;
const ROAD_WORLD_WIDTH = WORLD_START + (ROUTE_STEPS + 3) * STEP_WIDTH;
const ROAD_TOP = 0;
const MANHOLE_Y = 550;
const CHICKEN_START_X = 240;
const CHICKEN_Y = 580;
const MUTED_TINT = 0xe4e1dd;
const CAP_LABEL_Y = 0;
const CAP_LABEL_SIZE = 28;
const VEHICLE_BLOCK_TOP = MANHOLE_Y - 125;
const VEHICLE_BLOCK_BOTTOM = CHICKEN_Y + 115;
const CHICKEN_ASSET_SCALE = 0.5;
const PLANE_ASSETS = [
  'plane-cargo@2x.png',
  'plane-double-engine@2x.png',
  'plane-drone@2x.png',
  'plane-fighter@2x.png',
  'plane-new-gen@2x.png',
  'plane-old@2x.png',
  'plane-stealth@2x.png',
] as const;
const LOSS_TAUNTS = [
  'Tiny wings, huge confidence.',
  'Runway denied. Ego cleared for landing.',
  'The sky saw you and filed a complaint.',
  'Bold move. Terrible altitude.',
  'Your pilot license is now decorative.',
  'That was less flight, more poultry paperwork.',
] as const;
const frames = {
  lamp: { x: 0, y: 0, w: 455, h: 770 },
  iceTruck: { x: 510, y: 0, w: 385, h: 735 },
  taxi: { x: 935, y: 0, w: 335, h: 590 },
  police: { x: 1295, y: 0, w: 390, h: 590 },
  fireTruck: { x: 0, y: 1120, w: 420, h: 820 },
  iceTruck2: { x: 430, y: 1070, w: 400, h: 780 },
  greenTruck: { x: 845, y: 1030, w: 380, h: 700 },
  vent: { x: 1386, y: 589, w: 433, h: 426 },
  medal: { x: 1386, y: 1025, w: 433, h: 433 },
} satisfies Record<string, Frame>;

const crop = (texture: Texture, frame: Frame) => new Texture({
  source: texture.source,
  frame: frame.rotate
    ? new Rectangle(frame.x, frame.y, frame.h, frame.w)
    : new Rectangle(frame.x, frame.y, frame.w, frame.h),
  orig: new Rectangle(0, 0, frame.offsets?.[2] ?? frame.w, frame.offsets?.[3] ?? frame.h),
  trim: frame.offsets
    ? new Rectangle(frame.offsets[0], frame.offsets[3] - frame.h - frame.offsets[1], frame.w, frame.h)
    : undefined,
  rotate: frame.rotate ? 2 : 0,
});
const textureFromAtlas = (texture: Texture, atlas: Record<string, Frame>, name: string) => crop(texture, atlas[name]);
const atlasSprite = (texture: Texture, atlas: Record<string, Frame>, name: string) => new Sprite(textureFromAtlas(texture, atlas, name));
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const ease = (value: number) => 1 - (1 - value) ** 3;

function parseAtlas(source: string) {
  const atlas: Record<string, Frame> = {};
  let currentName = '';

  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.endsWith('.png') || trimmed.startsWith('size:') || trimmed.startsWith('filter:')) continue;
    if (!trimmed.includes(':')) {
      currentName = trimmed;
      atlas[currentName] = { x: 0, y: 0, w: 0, h: 0 };
      continue;
    }
    if (!currentName) continue;
    const [key, rawValue] = trimmed.split(':');
    const values = rawValue.split(',').map((value) => Number(value.trim()));
    if (key === 'bounds') {
      const [x, y, w, h] = values;
      atlas[currentName] = { ...atlas[currentName], x, y, w, h };
    }
    if (key === 'rotate' && rawValue.trim() === '90') atlas[currentName].rotate = true;
    if (key === 'offsets') atlas[currentName].offsets = values as [number, number, number, number];
  }

  return atlas;
}

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
  private chicken = new Container();
  private chickenParts: Container[] = [];
  private steps: StepView[] = [];
  private objectTexture!: Texture;
  private chickenTexture!: Texture;
  private chickenAtlas!: Record<string, Frame>;
  private capNormalTexture!: Texture;
  private capGoldenTexture!: Texture;
  private confettiTexture!: Texture;
  private notificationBgTexture!: Texture;
  private trumpetTexture!: Texture;
  private startTexture!: Texture;
  private finishTexture!: Texture;
  private roadLaneTexture!: Texture;
  private planeTextures: Texture[] = [];
  private viewWidth = 1200;
  private worldScale = 1;
  private currentStep = -1;
  private ambientVehicles: AmbientVehicle[] = [];
  private ambientSpawnElapsed = 0;
  private idleElapsed = 0;
  private chickenIdleParts: ChickenIdlePart[] = [];

  async mount(host: HTMLElement, difficulty: Difficulty) {
    await this.app.init({ width: host.clientWidth, height: host.clientHeight, background: '#777370', antialias: true });
    host.appendChild(this.app.canvas);
    [
      this.objectTexture,
      this.chickenTexture,
      this.capNormalTexture,
      this.capGoldenTexture,
      this.confettiTexture,
      this.notificationBgTexture,
      this.trumpetTexture,
      this.startTexture,
      this.finishTexture,
      this.roadLaneTexture,
    ] = await Promise.all([
      Assets.load(`${import.meta.env.BASE_URL}assets/objects-sprite.png`),
      Assets.load(`${import.meta.env.BASE_URL}assets/pilot-chicken-new.png`),
      Assets.load(`${import.meta.env.BASE_URL}assets/cap-normal@2x.png`),
      Assets.load(`${import.meta.env.BASE_URL}assets/cap-golden@2x.png`),
      Assets.load(`${import.meta.env.BASE_URL}assets/confetti@2x.png`),
      Assets.load(`${import.meta.env.BASE_URL}assets/notification-bg@2x.png`),
      Assets.load(`${import.meta.env.BASE_URL}assets/trumpet@2x.png`),
      Assets.load(`${import.meta.env.BASE_URL}assets/start-bg.png`),
      Assets.load(`${import.meta.env.BASE_URL}assets/finish-bg.png`),
      Assets.load(`${import.meta.env.BASE_URL}assets/road-lane.png`),
    ]);
    [this.chickenAtlas, this.planeTextures] = await Promise.all([
      fetch(`${import.meta.env.BASE_URL}assets/pilot-chicken-new.atlas`).then((response) => response.text()).then(parseAtlas),
      Promise.all(PLANE_ASSETS.map((asset) => Assets.load(`${import.meta.env.BASE_URL}assets/${asset}`))),
    ]);
    this.app.stage.addChild(this.world, this.overlay);
    this.drawRoad();
    this.world.addChild(this.route, this.vehicles, this.chicken);
    this.buildRoute(difficulty);
    this.buildChicken();
    this.reset();
    this.resize(host);
    this.app.ticker.add((ticker) => {
      this.updateAmbientVehicles(ticker.deltaMS);
      this.updateChickenIdle(ticker.deltaMS);
    });
  }

  resize(host: HTMLElement) {
    this.app.renderer.resize(host.clientWidth, host.clientHeight);
    this.worldScale = host.clientHeight / ROAD_HEIGHT;
    this.world.scale.set(this.worldScale);
    this.viewWidth = host.clientWidth;
    this.positionCamera(this.currentStep, true);
  }

  hasVehicleOnStep(stepIndex: number) {
    return this.ambientVehicles.some((vehicle) => vehicle.stepIndex === stepIndex && !vehicle.sprite.destroyed);
  }

  reset(difficulty?: Difficulty) {
    this.currentStep = -1;
    this.world.x = 0;
    this.steps.forEach((step, index) => {
      step.medal.visible = false;
      step.vent.visible = true;
      step.label.visible = true;
      step.vent.tint = MUTED_TINT;
      step.label.tint = MUTED_TINT;
      if (difficulty) step.label.text = `${multiplierFor(difficulty, index).toFixed(2)}x`;
    });
    this.vehicles.removeChildren().forEach((child) => child.destroy());
    this.clearOverlay();
    this.ambientVehicles = [];
    this.ambientSpawnElapsed = 0;
    this.restoreChicken();
    this.chicken.position.set(CHICKEN_START_X, CHICKEN_Y);
  }

  async jumpTo(stepIndex: number, difficulty: Difficulty) {
    const fromX = this.chicken.x;
    const targetX = WORLD_START + stepIndex * STEP_WIDTH;
    await this.waitForStepTraffic(stepIndex);
    playSound('jump');
    await this.animate(560, (progress) => {
      this.chicken.x = fromX + (targetX - fromX) * ease(progress);
      this.chicken.y = CHICKEN_Y - Math.sin(progress * Math.PI) * 150;
      this.chicken.rotation = Math.sin(progress * Math.PI * 2) * 0.08;
      this.positionCamera(stepIndex, false);
    });
    this.chicken.y = CHICKEN_Y;
    this.chicken.rotation = 0;
    this.currentStep = stepIndex;
    this.positionCamera(stepIndex, true);
    if (stepIndex > 0) this.passStep(stepIndex - 1);
    this.hideCurrentStep(stepIndex);
    this.updateRouteHighlights(stepIndex + 1);
  }

  async crash(stepIndex: number, lostAmount: number) {
    const targetX = WORLD_START + stepIndex * STEP_WIDTH;
    const fromX = this.chicken.x;
    await this.waitForStepTraffic(stepIndex);
    playSound('jump');
    await this.animate(560, (progress) => {
      this.chicken.x = fromX + (targetX - fromX) * ease(progress);
      this.chicken.y = CHICKEN_Y - Math.sin(progress * Math.PI) * 150;
      this.chicken.rotation = Math.sin(progress * Math.PI * 2) * 0.08;
      this.positionCamera(stepIndex, false);
    });
    this.chicken.y = CHICKEN_Y;
    this.chicken.rotation = 0;
    this.currentStep = stepIndex;
    this.positionCamera(stepIndex, true);
    if (stepIndex > 0) this.passStep(stepIndex - 1);
    this.hideCurrentStep(stepIndex);
    this.updateRouteHighlights(stepIndex + 1);

    await this.sendVehicle(targetX, () => {
      playSound('lose');
      this.showLossNotification(lostAmount);
      this.chicken.visible = false;
      this.spawnCrashParts();
    });
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

  async finish(amount: number) {
    const fromX = this.chicken.x;
    const fromY = this.chicken.y;
    this.chicken.rotation = 0;
    this.currentStep = ROUTE_STEPS;
    await this.animate(980, (progress) => {
      const eased = ease(progress);
      this.chicken.x = fromX + (FINISH_CHICKEN_X - fromX) * eased;
      this.chicken.y = fromY + (FINISH_CHICKEN_Y - fromY) * eased;
      this.chicken.rotation = Math.sin(progress * Math.PI * 2) * 0.04;
      this.centerCameraOn(FINISH_CHICKEN_X, false);
    });
    this.chicken.position.set(FINISH_CHICKEN_X, FINISH_CHICKEN_Y);
    this.chicken.rotation = 0;
    this.centerCameraOn(FINISH_CHICKEN_X, true);
    this.showWinCelebration();
    const notification = new Container();
    const plate = Sprite.from(`${import.meta.env.BASE_URL}assets/win-notification.png`);
    plate.anchor.set(0.5);
    plate.scale.set(0.82);
    const title = label(`YOU WON $${amount.toFixed(2)}`, 42, '#ffffff');
    title.anchor.set(0.5);
    notification.addChild(plate, title);
    notification.position.set((-this.world.x + this.viewWidth / 2) / this.worldScale, 320);
    notification.alpha = 0;
    this.world.addChild(notification);
    playSound('win');
    await this.animate(380, (progress) => {
      notification.alpha = progress;
      notification.scale.set(0.8 + progress * 0.2);
    });
    await sleep(1600);
    notification.destroy({ children: true });
    this.clearOverlay();
  }

  private drawRoad() {
    const bg = new Graphics();
    bg.rect(0, ROAD_TOP, ROAD_WORLD_WIDTH, ROAD_HEIGHT).fill('#2c2a35');
    const start = new Sprite(this.startTexture);
    start.scale.set(LOCATION_SCALE);
    start.y = START_LOCATION_Y;
    const finish = new Sprite(this.finishTexture);
    finish.scale.set(LOCATION_SCALE);
    finish.x = FINISH_LOCATION_X;
    this.world.addChild(bg, start, finish);

    const laneScale = STEP_WIDTH / this.roadLaneTexture.width;
    const laneStepY = this.roadLaneTexture.height * laneScale;
    for (let x = WORLD_START; x < WORLD_START + ROUTE_STEPS * STEP_WIDTH; x += STEP_WIDTH) {
      for (let y = -laneStepY / 2; y < ROAD_HEIGHT + laneStepY; y += laneStepY) {
        const lane = new Sprite(this.roadLaneTexture);
        lane.anchor.set(0.5);
        lane.position.set(x, y);
        lane.scale.set(laneScale);
        this.world.addChild(lane);
      }
    }
  }

  private buildRoute(difficulty: Difficulty) {
    for (let index = 0; index < ROUTE_STEPS; index++) {
      const root = new Container();
      root.position.set(WORLD_START + index * STEP_WIDTH, MANHOLE_Y);
      const vent = new Sprite(this.capNormalTexture);
      vent.anchor.set(0.5);
      const medal = new Sprite(this.capGoldenTexture);
      medal.anchor.set(0.5);
      medal.visible = false;
      const amount = label(`${multiplierFor(difficulty, index).toFixed(2)}x`, CAP_LABEL_SIZE);
      amount.anchor.set(0.5);
      amount.position.set(0, CAP_LABEL_Y);
      root.addChild(vent, medal, amount);
      this.route.addChild(root);
      this.steps.push({ root, medal, label: amount, vent });
    }
  }

  private buildChicken() {
    const addPart = (
      name: string,
      x: number,
      y: number,
      rotation = 0,
      flipX = false,
      idle?: Omit<ChickenIdlePart, 'sprite' | 'x' | 'y' | 'rotation'>,
    ) => {
      const sprite = atlasSprite(this.chickenTexture, this.chickenAtlas, name);
      sprite.anchor.set(0.5);
      sprite.position.set(x, y);
      sprite.scale.x = flipX ? -1 : 1;
      sprite.rotation = rotation;
      this.chicken.addChild(sprite);
      this.chickenIdleParts.push({ sprite, x, y, rotation, ...idle });
      return sprite;
    };

    this.chickenIdleParts = [];
    addPart('LegLYellow', -42, -3, -0.04, false, { bob: 2, phase: 0.7 });
    addPart('LegRYellow', 43, -2, 0.04, false, { bob: 2, phase: 1.1 });

    addPart('ArmLYellow', -92, -54, Math.PI - 0.04, false, { bob: 3, turn: 0.04, phase: 0.3 });
    addPart('ArmRYellow', 91, -58, -0.08, false, { bob: 3, turn: -0.04, phase: 0.9 });

    const body = atlasSprite(this.chickenTexture, this.chickenAtlas, 'BodyYellow');
    body.anchor.set(0.5, 0.88);
    this.chicken.addChild(body);
    this.chickenIdleParts.push({ sprite: body, x: 0, y: 0, rotation: 0, bob: 4, sway: 1.6 });

    const jacket = atlasSprite(this.chickenTexture, this.chickenAtlas, 'JacketYellow');
    jacket.anchor.set(0.5, 0.5);
    jacket.position.set(4, -33);
    this.chicken.addChild(jacket);
    this.chickenIdleParts.push({ sprite: jacket, x: 4, y: -33, rotation: 0, bob: 4, sway: 1.6 });

    addPart('JacketTopL', -51, -76, -0.12, false, { bob: 4, sway: 1.6 });
    addPart('JacketTopR', 51, -76, 0.12, false, { bob: 4, sway: 1.6 });
    addPart('SunglassesYellow', 30, -153, 0.06, false, { bob: 5, sway: 2, turn: 0.018, phase: 0.2 });
    addPart('BeakInsideYellow', 77, -123, -0.03, false, { bob: 5, sway: 2, turn: 0.02, phase: 0.2 });
    addPart('ShoutingMouthTongueYellow', 74, -115, -0.04, false, { bob: 5, sway: 2, turn: 0.02, phase: 0.2 });
    addPart('BeakTopYellow', 78, -134, -0.04, false, { bob: 5, sway: 2, turn: 0.02, phase: 0.2 });
    addPart('BeakBottomYellow', 77, -113, -0.06, false, { bob: 5, sway: 2, turn: 0.02, phase: 0.2 });
    addPart('WattleYellow', 64, -94, 0.08, false, { bob: 5, sway: 2, turn: 0.035, phase: 0.4 });

    const comb = atlasSprite(this.chickenTexture, this.chickenAtlas, 'CombYellow');
    comb.anchor.set(0.5);
    comb.position.set(-16, -244);
    comb.rotation = -0.08;
    this.chicken.addChild(comb);
    this.chickenIdleParts.push({ sprite: comb, x: -16, y: -244, rotation: -0.08, bob: 6, sway: 2.4, turn: 0.035 });

    this.chicken.eventMode = 'static';
    this.chicken.cursor = 'pointer';
    this.chicken.hitArea = new Rectangle(-90, -290, 190, 290);
    this.chicken.scale.set(CHICKEN_ASSET_SCALE);
    this.chicken.on('pointertap', () => playSound('chick'));
  }

  private updateChickenIdle(deltaMS: number) {
    if (!this.chicken.visible) return;
    this.idleElapsed += deltaMS / 1000;
    const breath = Math.sin(this.idleElapsed * Math.PI * 1.65);
    const sway = Math.sin(this.idleElapsed * Math.PI * 0.82);
    this.chickenIdleParts.forEach((part) => {
      const phase = part.phase ?? 0;
      const localBreath = Math.sin(this.idleElapsed * Math.PI * 1.65 + phase);
      part.sprite.x = part.x + (part.sway ?? 0) * sway;
      part.sprite.y = part.y + (part.bob ?? 0) * localBreath;
      part.sprite.rotation = part.rotation + (part.turn ?? 0) * breath;
    });
  }

  private passStep(index: number) {
    const step = this.steps[index];
    step.vent.visible = false;
    step.label.visible = false;
    step.medal.visible = true;
  }

  private hideCurrentStep(index: number) {
    const step = this.steps[index];
    step.vent.visible = false;
    step.label.visible = false;
    step.medal.visible = false;
  }

  private updateRouteHighlights(activeStep: number) {
    this.steps.forEach((step, index) => {
      const active = index === activeStep;
      step.vent.tint = active ? 0xffffff : MUTED_TINT;
      step.label.tint = active ? 0xffffff : MUTED_TINT;
    });
  }

  private createPlaneSprite(index?: number) {
    const texture = this.planeTextures[index ?? Math.floor(Math.random() * this.planeTextures.length)];
    const plane = new Sprite(texture);
    plane.anchor.set(0.5);
    return plane;
  }

  private async sendVehicle(targetX: number, onImpact?: () => void) {
    const plane = this.createPlaneSprite(3);
    plane.position.set(targetX, -260);
    this.vehicles.addChild(plane);
    playSound('plane');
    let impacted = false;
    await this.animate(720, (progress) => {
      plane.y = -260 + progress * 1100;
      if (!impacted && plane.y >= CHICKEN_Y) {
        impacted = true;
        onImpact?.();
      }
    });
    if (!impacted) onImpact?.();
    plane.destroy();
  }

  private updateAmbientVehicles(deltaMS: number) {
    this.ambientSpawnElapsed += deltaMS;
    if (this.ambientSpawnElapsed >= 1900) {
      this.ambientSpawnElapsed = 0;
      this.spawnAmbientVehicle();
    }
    this.ambientVehicles = this.ambientVehicles.filter((vehicle) => {
      const nextY = vehicle.sprite.y + vehicle.speed * deltaMS;
      vehicle.sprite.y = nextY;
      if (!vehicle.soundPlayed && this.currentStep >= 0 && vehicle.sprite.y >= -20) {
        vehicle.soundPlayed = true;
        playSound('plane');
      }
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
    ).filter((stepIndex) => !this.ambientVehicles.some((vehicle) => vehicle.stepIndex === stepIndex));
    if (!availableSteps.length) return;
    const stepIndex = availableSteps[Math.floor(Math.random() * availableSteps.length)];
    const sprite = this.createPlaneSprite();
    sprite.position.set(WORLD_START + stepIndex * STEP_WIDTH, -260);
    this.vehicles.addChild(sprite);
    this.ambientVehicles.push({
      sprite,
      speed: 0.34,
      stepIndex,
      soundPlayed: this.currentStep < 0,
    });
  }

  private waitForStepTraffic(stepIndex: number) {
    return new Promise<void>((resolve) => {
      const tick = () => {
        if (!this.hasBlockingTraffic(stepIndex)) resolve();
        else requestAnimationFrame(tick);
      };
      tick();
    });
  }

  private hasBlockingTraffic(stepIndex: number) {
    return this.ambientVehicles.some((vehicle) => (
      vehicle.stepIndex === stepIndex
      && !vehicle.sprite.destroyed
      && vehicle.sprite.y >= VEHICLE_BLOCK_TOP
      && vehicle.sprite.y <= VEHICLE_BLOCK_BOTTOM
    ));
  }

  private spawnCrashParts() {
    const pieces = ['BodyYellow', 'JacketYellow', 'SunglassesYellow', 'CombYellow', 'BeakBottomYellow', 'Feather', 'Bam'];
    this.chickenParts = pieces.map((piece, index) => {
      const root = new Container();
      const sprite = atlasSprite(this.chickenTexture, this.chickenAtlas, piece);
      sprite.anchor.set(0.5);
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
  }

  private clearOverlay() {
    this.overlay.removeChildren().forEach((child) => child.destroy({ children: true }));
  }

  private showLossNotification(lostAmount: number) {
    this.clearOverlay();
    const taunt = LOSS_TAUNTS[Math.floor(Math.random() * LOSS_TAUNTS.length)];
    const root = new Container();
    const bg = new Sprite(this.notificationBgTexture);
    bg.anchor.set(0.5, 0);
    bg.width = Math.min(this.viewWidth * 0.78, 700);
    bg.height = bg.width * (this.notificationBgTexture.height / this.notificationBgTexture.width);

    const title = new Text({
      text: 'YOU GOT COOKED',
      style: new TextStyle({
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: 34,
        fontWeight: '900',
        fill: '#171b27',
      }),
    });
    title.anchor.set(0.5);

    const subtitle = new Text({
      text: taunt,
      style: new TextStyle({
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: 22,
        fontWeight: '900',
        fill: '#4a435b',
      }),
    });
    subtitle.anchor.set(0.5);

    const amount = new Text({
      text: `Lost: $${lostAmount.toFixed(2)}`,
      style: new TextStyle({
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: 26,
        fontWeight: '900',
        fill: '#c5462d',
      }),
    });
    amount.anchor.set(0.5);

    root.addChild(bg, title, subtitle, amount);
    root.position.set(this.viewWidth / 2, 0);
    title.position.set(0, 62);
    subtitle.position.set(0, 98);
    amount.position.set(0, 132);
    root.alpha = 0;
    root.scale.set(0.94);
    this.overlay.addChild(root);

    void this.animate(280, (progress) => {
      root.alpha = progress;
      root.scale.set(0.94 + progress * 0.06);
    });
  }

  private showWinCelebration() {
    this.clearOverlay();
    const root = new Container();

    const confetti = new Sprite(this.confettiTexture);
    confetti.anchor.set(0.5, 0);
    confetti.width = Math.min(this.viewWidth * 0.82, 700);
    confetti.height = confetti.width * (this.confettiTexture.height / this.confettiTexture.width);
    confetti.position.set(this.viewWidth / 2, 18);

    const leftTrumpet = new Sprite(this.trumpetTexture);
    leftTrumpet.anchor.set(0.5);
    leftTrumpet.scale.set(0.78);
    leftTrumpet.position.set(Math.max(100, this.viewWidth * 0.18), 96);

    const rightTrumpet = new Sprite(this.trumpetTexture);
    rightTrumpet.anchor.set(0.5);
    rightTrumpet.scale.set(-0.78, 0.78);
    rightTrumpet.position.set(Math.min(this.viewWidth - 100, this.viewWidth * 0.82), 96);

    root.addChild(confetti, leftTrumpet, rightTrumpet);
    root.alpha = 0;
    root.scale.set(0.92);
    this.overlay.addChild(root);

    void this.animate(420, (progress) => {
      root.alpha = progress;
      root.scale.set(0.92 + progress * 0.08);
      confetti.y = 18 + Math.sin(progress * Math.PI) * 14;
      leftTrumpet.rotation = -0.12 + Math.sin(progress * Math.PI * 2) * 0.04;
      rightTrumpet.rotation = 0.12 - Math.sin(progress * Math.PI * 2) * 0.04;
    });
  }

  private positionCamera(stepIndex: number, immediate = false) {
    if (stepIndex < 1) return;
    const previousStepX = WORLD_START + Math.max(0, stepIndex - 1) * STEP_WIDTH;
    const leftMargin = Math.min(170, this.viewWidth * 0.17);
    const target = this.clampCameraX(leftMargin - previousStepX * this.worldScale);
    if (immediate) this.world.x = target;
    else this.world.x += (target - this.world.x) * 0.2;
  }

  private centerCameraOn(worldX: number, immediate = false) {
    const target = this.clampCameraX(this.viewWidth / 2 - worldX * this.worldScale);
    if (immediate) this.world.x = target;
    else this.world.x += (target - this.world.x) * 0.2;
  }

  private clampCameraX(target: number) {
    const maxLeft = Math.min(0, this.viewWidth - ROAD_WORLD_WIDTH * this.worldScale);
    return Math.min(0, Math.max(maxLeft, target));
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
