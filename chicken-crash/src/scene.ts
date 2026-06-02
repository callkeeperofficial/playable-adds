import { AnimatedSprite, Application, Assets, Container, Graphics, Rectangle, Sprite, Text, TextStyle, Texture } from 'pixi.js';
import { Spine } from '@esotericsoftware/spine-pixi-v8';
import { multiplierFor, ROAD_HEIGHT, ROUTE_STEPS, STEP_WIDTH, Difficulty } from './config';
import { playSound } from './audio';

type Frame = { x: number; y: number; w: number; h: number };
type StepView = { root: Container; medal: Sprite; label: Text; vent: Sprite };
type AmbientVehicle = { sprite: Sprite; speed: number; stepIndex: number; stopY?: number; stopped?: boolean };
type VideoIdleAtlas = {
  frameWidth: number;
  frameHeight: number;
  columns: number;
  frameCount: number;
  fps: number;
};

const WORLD_START = 500;
const ROAD_TOP = 0;
const MANHOLE_Y = 550;
const CHICKEN_Y = 580;
const MUTED_TINT = 0xe4e1dd;
const BARRIER_STOP_Y = 118;
const VEHICLE_BLOCK_TOP = MANHOLE_Y - 125;
const VEHICLE_BLOCK_BOTTOM = CHICKEN_Y + 115;
const USE_VIDEO_CHICKEN = new URLSearchParams(window.location.search).has('videoChicken');
const frames = {
  lamp: { x: 0, y: 0, w: 455, h: 770 },
  iceTruck: { x: 510, y: 0, w: 385, h: 735 },
  taxi: { x: 935, y: 0, w: 335, h: 590 },
  police: { x: 1295, y: 0, w: 390, h: 590 },
  barrier: { x: 19, y: 786, w: 511, h: 256 },
  fireTruck: { x: 0, y: 1120, w: 420, h: 820 },
  iceTruck2: { x: 430, y: 1070, w: 400, h: 780 },
  greenTruck: { x: 845, y: 1030, w: 380, h: 700 },
  vent: { x: 1386, y: 589, w: 433, h: 426 },
  medal: { x: 1386, y: 1025, w: 433, h: 433 },
} satisfies Record<string, Frame>;

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
  private route = new Container();
  private vehicles = new Container();
  private chicken = new Container();
  private chickenParts: Container[] = [];
  private steps: StepView[] = [];
  private objectTexture!: Texture;
  private chickenTexture!: Texture;
  private videoChickenTexture?: Texture;
  private videoChickenAtlas?: VideoIdleAtlas;
  private spineChicken?: Spine;
  private startTexture!: Texture;
  private finishTexture!: Texture;
  private viewWidth = 1200;
  private worldScale = 1;
  private currentStep = -1;
  private ambientVehicles: AmbientVehicle[] = [];
  private ambientSpawnElapsed = 0;

  async mount(host: HTMLElement, difficulty: Difficulty) {
    await this.app.init({ width: host.clientWidth, height: host.clientHeight, background: '#777370', antialias: true });
    host.appendChild(this.app.canvas);
    [this.objectTexture, this.chickenTexture, this.startTexture, this.finishTexture] = await Promise.all([
      Assets.load(`${import.meta.env.BASE_URL}assets/objects-sprite.png`),
      Assets.load(`${import.meta.env.BASE_URL}assets/chicken-sprite.png`),
      Assets.load(`${import.meta.env.BASE_URL}assets/start-bg.png`),
      Assets.load(`${import.meta.env.BASE_URL}assets/finish-bg.png`),
    ]);
    if (USE_VIDEO_CHICKEN) {
      [this.videoChickenTexture, this.videoChickenAtlas] = await Promise.all([
        Assets.load(`${import.meta.env.BASE_URL}assets/video-idle/chicken-idle-video-atlas.png`),
        fetch(`${import.meta.env.BASE_URL}assets/video-idle/chicken-idle-video-atlas.json`).then((response) => response.json()),
      ]);
    }
    if (!USE_VIDEO_CHICKEN) {
      Assets.add({ alias: 'spineChickenData', src: `${import.meta.env.BASE_URL}assets/spine/chiken/chiken.json` });
      Assets.add({ alias: 'spineChickenAtlas', src: `${import.meta.env.BASE_URL}assets/spine/chiken/chiken.atlas` });
      await Assets.load(['spineChickenData', 'spineChickenAtlas']);
    }
    this.app.stage.addChild(this.world);
    this.drawRoad();
    this.world.addChild(this.route, this.vehicles, this.chicken);
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
    this.route.children.filter((child) => child.label === 'barrier').forEach((child) => child.destroy());
    this.vehicles.removeChildren().forEach((child) => child.destroy());
    this.ambientVehicles = [];
    this.ambientSpawnElapsed = 0;
    this.restoreChicken();
    this.chicken.position.set(180, CHICKEN_Y);
  }

  async jumpTo(stepIndex: number, difficulty: Difficulty) {
    const fromX = this.chicken.x;
    const targetX = WORLD_START + stepIndex * STEP_WIDTH;
    await this.waitForStepTraffic(stepIndex);
    playSound('jump');
    this.setSpineAnimation('jump', false);
    await this.animate(560, (progress) => {
      this.chicken.x = fromX + (targetX - fromX) * ease(progress);
      this.chicken.y = CHICKEN_Y - Math.sin(progress * Math.PI) * 150;
      this.chicken.rotation = Math.sin(progress * Math.PI * 2) * 0.08;
      this.positionCamera(stepIndex, false);
    });
    this.chicken.y = CHICKEN_Y;
    this.chicken.rotation = 0;
    this.currentStep = stepIndex;
    this.setSpineAnimation('idle', true);
    this.positionCamera(stepIndex, true);
    if (stepIndex > 0) this.passStep(stepIndex - 1);
    this.hideCurrentStep(stepIndex);
    if (stepIndex < ROUTE_STEPS - 1) this.addBarrier(stepIndex);
    this.updateRouteHighlights(stepIndex + 1);
  }

  async crash(stepIndex: number) {
    const targetX = WORLD_START + stepIndex * STEP_WIDTH;
    const fromX = this.chicken.x;
    await this.waitForStepTraffic(stepIndex);
    playSound('jump');
    this.setSpineAnimation('jump', false);
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
      if (this.spineChicken) this.setSpineAnimation('death', false);
      else {
        this.chicken.visible = false;
        this.spawnCrashParts();
      }
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

  async finish(amount: number) {
    const fromX = this.chicken.x;
    const finishX = fromX + this.viewWidth / this.worldScale + 360;
    this.setSpineAnimation('win', true);
    this.chicken.y = CHICKEN_Y;
    this.chicken.rotation = 0;
    await this.animate(1300, (progress) => {
      this.chicken.x = fromX + (finishX - fromX) * ease(progress);
      this.chicken.y = CHICKEN_Y;
    });
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
      vent.scale.set(0.42);
      const medal = new Sprite(medalTexture);
      medal.anchor.set(0.5);
      medal.scale.set(0.42);
      medal.visible = false;
      const amount = label(`${multiplierFor(difficulty, index).toFixed(2)}x`, 43);
      amount.anchor.set(0.5);
      root.addChild(vent, medal, amount);
      this.route.addChild(root);
      this.steps.push({ root, medal, label: amount, vent });
    }
  }

  private buildChicken() {
    if (!USE_VIDEO_CHICKEN) {
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
    }
    if (this.videoChickenTexture && this.videoChickenAtlas) {
      const textures = Array.from({ length: this.videoChickenAtlas.frameCount }, (_, index) => {
        const column = index % this.videoChickenAtlas!.columns;
        const row = Math.floor(index / this.videoChickenAtlas!.columns);
        return crop(this.videoChickenTexture!, {
          x: column * this.videoChickenAtlas!.frameWidth,
          y: row * this.videoChickenAtlas!.frameHeight,
          w: this.videoChickenAtlas!.frameWidth,
          h: this.videoChickenAtlas!.frameHeight,
        });
      });
      const sprite = new AnimatedSprite(textures);
      sprite.anchor.set(0.5, 0.78);
      sprite.animationSpeed = this.videoChickenAtlas.fps / 60;
      sprite.play();
      this.chicken.addChild(sprite);
      this.chicken.scale.set(0.62);
      this.chicken.eventMode = 'static';
      this.chicken.cursor = 'pointer';
      this.chicken.hitArea = new Rectangle(-150, -230, 300, 270);
      this.chicken.on('pointertap', () => playSound('chick'));
      return;
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

  private addBarrier(index: number) {
    const barrier = new Sprite(crop(this.objectTexture, frames.barrier));
    barrier.label = 'barrier';
    barrier.anchor.set(0.5);
    barrier.scale.set(0.38);
    barrier.position.set(WORLD_START + index * STEP_WIDTH, 345);
    this.route.addChild(barrier);
  }

  private async sendVehicle(targetX: number, onImpact?: () => void) {
    const carFrames = [frames.taxi, frames.police, frames.fireTruck, frames.greenTruck];
    const carFrame = carFrames[Math.floor(Math.random() * carFrames.length)];
    const car = new Sprite(crop(this.objectTexture, carFrame));
    car.anchor.set(0.5);
    car.scale.set(carFrame === frames.fireTruck ? 0.36 : 0.43);
    car.position.set(targetX, -260);
    this.vehicles.addChild(car);
    playSound('car');
    let impacted = false;
    await this.animate(720, (progress) => {
      car.y = -260 + progress * 1100;
      if (!impacted && car.y >= CHICKEN_Y) {
        impacted = true;
        onImpact?.();
      }
    });
    if (!impacted) onImpact?.();
    car.destroy();
  }

  private updateAmbientVehicles(deltaMS: number) {
    this.ambientSpawnElapsed += deltaMS;
    if (this.ambientSpawnElapsed >= 1900) {
      this.ambientSpawnElapsed = 0;
      this.spawnAmbientVehicle();
    }
    this.ambientVehicles = this.ambientVehicles.filter((vehicle) => {
      if (vehicle.stopped) return true;
      if (vehicle.stepIndex <= this.currentStep && vehicle.stopY === undefined) {
        vehicle.stopY = BARRIER_STOP_Y;
        if (vehicle.sprite.y >= BARRIER_STOP_Y) {
          vehicle.sprite.y = BARRIER_STOP_Y;
          vehicle.stopped = true;
          return true;
        }
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
    ).filter((stepIndex) => !this.ambientVehicles.some((vehicle) => vehicle.stepIndex === stepIndex));
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
