import { Application, Assets, Container, Graphics, MeshSimple, Rectangle, Sprite, Text, TextStyle, Texture } from 'pixi.js';
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
type SpineBone = {
  name: string;
  parent?: string;
  x?: number;
  y?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
};
type SpineSlot = {
  name: string;
  bone: string;
  attachment?: string;
};
type SpineAttachment = {
  type?: string;
  path?: string;
  uvs?: number[];
  triangles?: number[];
  vertices?: number[];
  x?: number;
  y?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  width?: number;
  height?: number;
};
type SpineKeyframe = {
  time?: number;
  value?: number;
  x?: number;
  y?: number;
  color?: string;
  name?: string | null;
  curve?: string | number[];
};
type SpineBoneTimeline = {
  rotate?: SpineKeyframe[];
  translate?: SpineKeyframe[];
  scale?: SpineKeyframe[];
};
type SpineSlotTimeline = {
  rgba?: SpineKeyframe[];
  attachment?: SpineKeyframe[];
};
type SpineAnimation = {
  bones?: Record<string, SpineBoneTimeline>;
  slots?: Record<string, SpineSlotTimeline>;
};
type SpineSkin = {
  name: string;
  attachments: Record<string, Record<string, SpineAttachment>>;
};
type SpineSkeleton = {
  bones: SpineBone[];
  slots: SpineSlot[];
  skins: SpineSkin[];
  animations: Record<string, SpineAnimation>;
};
type SpineTransform = {
  a: number;
  b: number;
  c: number;
  d: number;
  tx: number;
  ty: number;
};
type ChickenSlotPart = {
  slotName: string;
  boneName: string;
  attachment: SpineAttachment;
  display: Sprite | MeshSimple;
  isMesh: boolean;
  isMeshSpriteFallback: boolean;
  isTextureRotated: boolean;
  vertexCount: number;
  baseVisible: boolean;
};
type ChickenAnimationState = {
  name: string;
  elapsed: number;
  duration: number;
  loop: boolean;
};
export type PlaneCollisionPlan = 'none' | 'existing' | 'spawn';

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
const CHICKEN_ASSET_SCALE = 0.5;
const AMBIENT_PLANE_SPAWN_INTERVAL_MS = 1450;
const CHICKEN_TEXTURE_URL = `${import.meta.env.BASE_URL}assets/pilot-chicken-new.png`;
const CHICKEN_JSON_URL = `${import.meta.env.BASE_URL}assets/pilot-chicken-new.json`;
const NORMAL_CHICKEN_SLOTS = new Set([
  'ArmLYellow2',
  'LegLYellow',
  'CombYellow',
  'BodyYellow',
  'LegRYellow',
  'JacketYellow',
  'ArmLRellow2',
  'JacketTopL',
  'JacketTopR',
  'SunglassesYellow',
  'WattleYellow',
  'BeakInsideYellow',
  'BeakBottomYellow',
  'BeakTopYellow',
  'ShoutingMouthTongueYellow',
]);
const EXTRA_ANIMATED_CHICKEN_SLOTS = new Set([
  'Bam',
  'Feather',
  'Feather2',
  'Crack',
  'Crack Shade',
  'EyeBaseL',
  'EyeBaseR',
  'EyeLStroke',
  'EyeRStroke',
  'PupilL',
  'PupilR',
  'StunnedEyeL',
  'StunnedEyeR',
]);
const SPRITE_FALLBACK_CHICKEN_SLOTS = new Set(['LegLYellow', 'LegRYellow']);
const FLIPPED_X_CHICKEN_SLOTS = new Set(['LegRYellow']);
const ATTACHMENT_BY_SLOT: Record<string, string> = {
  BeakInsideYellow: 'BeakInsideYellow',
  ShoutingMouthTongueYellow: 'ShoutingMouthTongueYellow',
};
const QUAD_VERTICES = new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5]);
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

function composeTransform(parent: SpineTransform, local: SpineTransform): SpineTransform {
  return {
    a: parent.a * local.a + parent.b * local.c,
    b: parent.a * local.b + parent.b * local.d,
    c: parent.c * local.a + parent.d * local.c,
    d: parent.c * local.b + parent.d * local.d,
    tx: parent.a * local.tx + parent.b * local.ty + parent.tx,
    ty: parent.c * local.tx + parent.d * local.ty + parent.ty,
  };
}

function localTransform(x = 0, y = 0, rotation = 0, scaleX = 1, scaleY = 1): SpineTransform {
  const radians = rotation * Math.PI / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    a: cos * scaleX,
    b: -sin * scaleY,
    c: sin * scaleX,
    d: cos * scaleY,
    tx: x,
    ty: y,
  };
}

function transformPoint(transform: SpineTransform, x: number, y: number): [number, number] {
  return [
    transform.a * x + transform.b * y + transform.tx,
    transform.c * x + transform.d * y + transform.ty,
  ];
}

function buildSpineTransforms(bones: SpineBone[]) {
  const byName: Record<string, SpineTransform> = {};
  const byIndex: SpineTransform[] = [];

  bones.forEach((bone, index) => {
    const scaleX = bone.name === 'root' ? 1 : (bone.scaleX ?? 1);
    const scaleY = bone.name === 'root' ? 1 : (bone.scaleY ?? 1);
    const local = localTransform(bone.x ?? 0, bone.y ?? 0, bone.rotation ?? 0, scaleX, scaleY);
    const world = bone.parent ? composeTransform(byName[bone.parent], local) : local;
    byName[bone.name] = world;
    byIndex[index] = world;
  });

  return { byName, byIndex };
}

function keyTime(key: SpineKeyframe) {
  return key.time ?? 0;
}

function keyValue(key: SpineKeyframe, field: 'value' | 'x' | 'y', fallback: number) {
  return key[field] ?? fallback;
}

function sampleTimeline(track: SpineKeyframe[] | undefined, time: number, defaults: { value?: number; x?: number; y?: number }) {
  if (!track?.length) return defaults;
  const first = track[0];
  const firstTime = keyTime(first);
  if (time < firstTime) return defaults;
  let previous = first;
  let next = track[track.length - 1];

  for (let index = 1; index < track.length; index++) {
    next = track[index];
    if (time < keyTime(next)) break;
    previous = next;
  }

  const previousTime = keyTime(previous);
  const nextTime = keyTime(next);
  const previousValue = {
    value: keyValue(previous, 'value', defaults.value ?? 0),
    x: keyValue(previous, 'x', defaults.x ?? 0),
    y: keyValue(previous, 'y', defaults.y ?? 0),
  };

  if (previous === next || previous.curve === 'stepped' || nextTime <= previousTime) return previousValue;

  const progress = Math.min(1, Math.max(0, (time - previousTime) / (nextTime - previousTime)));
  const nextValue = {
    value: keyValue(next, 'value', defaults.value ?? 0),
    x: keyValue(next, 'x', defaults.x ?? 0),
    y: keyValue(next, 'y', defaults.y ?? 0),
  };

  return {
    value: previousValue.value + (nextValue.value - previousValue.value) * progress,
    x: previousValue.x + (nextValue.x - previousValue.x) * progress,
    y: previousValue.y + (nextValue.y - previousValue.y) * progress,
  };
}

function sampleAttachment(track: SpineKeyframe[] | undefined, time: number) {
  if (!track?.length || time < keyTime(track[0])) return undefined;
  let attachmentName = track[0].name ?? null;
  for (const key of track) {
    if (keyTime(key) > time) break;
    attachmentName = key.name ?? null;
  }
  return attachmentName;
}

function colorAlpha(color?: string) {
  if (!color || color.length < 8) return 1;
  return Number.parseInt(color.slice(6, 8), 16) / 255;
}

function sampleAlpha(track: SpineKeyframe[] | undefined, time: number) {
  if (!track?.length) return undefined;
  if (time < keyTime(track[0])) return undefined;
  let previous = track[0];
  let next = track[track.length - 1];

  for (let index = 1; index < track.length; index++) {
    next = track[index];
    if (time < keyTime(next)) break;
    previous = next;
  }

  const previousTime = keyTime(previous);
  const nextTime = keyTime(next);
  const previousAlpha = colorAlpha(previous.color);
  if (previous === next || previous.curve === 'stepped' || nextTime <= previousTime) return previousAlpha;
  const progress = Math.min(1, Math.max(0, (time - previousTime) / (nextTime - previousTime)));
  return previousAlpha + (colorAlpha(next.color) - previousAlpha) * progress;
}

function animationDuration(animation?: SpineAnimation) {
  const times: number[] = [];
  const walk = (value: unknown) => {
    if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') {
      const key = value as SpineKeyframe;
      if (typeof key.time === 'number') times.push(key.time);
      Object.values(value).forEach(walk);
    }
  };
  walk(animation);
  return Math.max(0, ...times);
}

function firstAttachmentName(attachments: Record<string, SpineAttachment>): string | undefined {
  return Object.keys(attachments)[0];
}

function meshVerticesFromAttachment(
  attachment: SpineAttachment,
  slotTransform: SpineTransform,
  boneTransforms: SpineTransform[],
  vertexCount: number,
): Float32Array {
  const source = attachment.vertices;
  if (!source?.length) {
    const width = attachment.width ?? 10;
    const height = attachment.height ?? 10;
    const local = localTransform(attachment.x ?? 0, attachment.y ?? 0, attachment.rotation ?? 0, attachment.scaleX ?? 1, attachment.scaleY ?? 1);
    const transform = composeTransform(slotTransform, local);
    const vertices = new Float32Array(QUAD_VERTICES.length);
    for (let index = 0; index < QUAD_VERTICES.length; index += 2) {
      const [x, y] = transformPoint(transform, QUAD_VERTICES[index] * width, QUAD_VERTICES[index + 1] * height);
      vertices[index] = x;
      vertices[index + 1] = -y;
    }
    return vertices;
  }

  const vertices = new Float32Array(vertexCount * 2);
  if (source.length === vertexCount * 2) {
    for (let index = 0; index < source.length; index += 2) {
      const [x, y] = transformPoint(slotTransform, source[index], source[index + 1]);
      vertices[index] = x;
      vertices[index + 1] = -y;
    }
    return vertices;
  }

  let sourceIndex = 0;
  for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
    const influenceCount = source[sourceIndex++];
    let worldX = 0;
    let worldY = 0;

    for (let influence = 0; influence < influenceCount; influence++) {
      const boneIndex = source[sourceIndex++];
      const localX = source[sourceIndex++];
      const localY = source[sourceIndex++];
      const weight = source[sourceIndex++];
      const transform = boneTransforms[boneIndex];
      const [x, y] = transformPoint(transform, localX, localY);
      worldX += x * weight;
      worldY += y * weight;
    }

    vertices[vertexIndex * 2] = worldX;
    vertices[vertexIndex * 2 + 1] = -worldY;
  }

  return vertices;
}

function boundsFromVertices(vertices: Float32Array) {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let index = 0; index < vertices.length; index += 2) {
    const x = vertices[index];
    const y = vertices[index + 1];
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
    width: maxX - minX,
    height: maxY - minY,
  };
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
  private chickenSkeleton!: SpineSkeleton;
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
  private viewHeight = 700;
  private worldScale = 1;
  private currentStep = -1;
  private ambientVehicles: AmbientVehicle[] = [];
  private reservedPlaneSteps = new Set<number>();
  private ambientSpawnElapsed = 0;
  private chickenSlotParts: ChickenSlotPart[] = [];
  private chickenAnimation?: ChickenAnimationState;
  private chickenAnimationDurations = new Map<string, number>();

  async mount(host: HTMLElement, difficulty: Difficulty) {
    await this.app.init({
      width: host.clientWidth,
      height: host.clientHeight,
      background: '#777370',
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 3),
    });
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
      Assets.load(CHICKEN_TEXTURE_URL),
      Assets.load(`${import.meta.env.BASE_URL}assets/cap-normal@2x.png`),
      Assets.load(`${import.meta.env.BASE_URL}assets/cap-golden@2x.png`),
      Assets.load(`${import.meta.env.BASE_URL}assets/confetti@2x.png`),
      Assets.load(`${import.meta.env.BASE_URL}assets/notification-bg@2x.png`),
      Assets.load(`${import.meta.env.BASE_URL}assets/trumpet@2x.png`),
      Assets.load(`${import.meta.env.BASE_URL}assets/start-bg.png`),
      Assets.load(`${import.meta.env.BASE_URL}assets/finish-bg.png`),
      Assets.load(`${import.meta.env.BASE_URL}assets/road-lane.png`),
    ]);
    [this.chickenAtlas, this.chickenSkeleton, this.planeTextures] = await Promise.all([
      fetch(`${import.meta.env.BASE_URL}assets/pilot-chicken-new.atlas`).then((response) => response.text()).then(parseAtlas),
      fetch(CHICKEN_JSON_URL).then((response) => response.json() as Promise<SpineSkeleton>),
      Promise.all(PLANE_ASSETS.map((asset) => Assets.load(`${import.meta.env.BASE_URL}assets/${asset}`))),
    ]);
    this.app.stage.addChild(this.world, this.overlay);
    this.drawRoad();
    this.world.addChild(this.route, this.vehicles, this.chicken);
    this.buildRoute(difficulty);
    this.buildChicken();
    Object.entries(this.chickenSkeleton.animations).forEach(([name, animation]) => {
      this.chickenAnimationDurations.set(name, animationDuration(animation));
    });
    this.reset();
    this.resize(host);
    this.app.ticker.add((ticker) => {
      this.updateAmbientVehicles(ticker.deltaMS);
      this.updateChickenAnimation(ticker.deltaMS);
    });
  }

  resize(host: HTMLElement) {
    this.app.renderer.resize(host.clientWidth, host.clientHeight);
    this.worldScale = host.clientHeight / ROAD_HEIGHT;
    this.world.scale.set(this.worldScale);
    this.viewWidth = host.clientWidth;
    this.viewHeight = host.clientHeight;
    this.positionCamera(this.currentStep, true);
  }

  hasVehicleOnStep(stepIndex: number) {
    return this.reservedPlaneSteps.has(stepIndex) || Boolean(this.findAmbientVehicleOnStep(stepIndex));
  }

  resolvePlaneCollision(stepIndex: number, randomCollision: boolean): PlaneCollisionPlan {
    const existingVehicle = this.findAmbientVehicleOnStep(stepIndex);
    if (existingVehicle) return this.isBeforeCollisionDecisionPoint(existingVehicle) ? 'existing' : 'none';
    return randomCollision ? 'spawn' : 'none';
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
    this.reservedPlaneSteps.clear();
    this.ambientSpawnElapsed = 0;
    this.restoreChicken();
    this.chicken.position.set(CHICKEN_START_X, CHICKEN_Y);
    this.chicken.rotation = 0;
    this.playChickenAnimation('Start', true);
  }

  async jumpTo(stepIndex: number, difficulty: Difficulty) {
    await this.animateChickenJumpTo(stepIndex);
    this.playChickenAnimation('Idle Active', true);
  }

  async crash(stepIndex: number, lostAmount: number, plan: PlaneCollisionPlan = 'spawn') {
    const targetX = WORLD_START + stepIndex * STEP_WIDTH;
    const existingVehicle = plan === 'existing' ? this.findAmbientVehicleOnStep(stepIndex) : undefined;
    const reserveCrashLane = plan === 'spawn';
    let crashed = false;
    if (reserveCrashLane) this.reservedPlaneSteps.add(stepIndex);

    try {
      await this.animateChickenJumpTo(stepIndex);

      const impact = () => {
        playSound('lose');
        this.showLossNotification(lostAmount);
        this.playChickenAnimation('Collision Ultimate Bloodless', false);
      };

      if (plan === 'existing') {
        crashed = existingVehicle && !existingVehicle.sprite.destroyed
          ? await this.waitForExistingVehicleImpact(existingVehicle, impact)
          : false;
      } else {
        crashed = await this.sendVehicle(targetX, impact);
      }
    } finally {
      if (reserveCrashLane) this.reservedPlaneSteps.delete(stepIndex);
    }
    if (!crashed) {
      this.playChickenAnimation('Idle Active', true);
      return false;
    }
    await sleep(1300);
    return true;
  }

  async finish(amount: number) {
    const fromX = this.chicken.x;
    const fromY = this.chicken.y;
    this.chicken.rotation = 0;
    this.currentStep = ROUTE_STEPS;
    this.playChickenAnimation('Happy Jump', false);
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
    this.showPayoutCelebration(amount);
    playSound('win');
    await sleep(1600);
    this.clearOverlay();
  }

  async cashout(amount: number) {
    this.playChickenAnimation('Happy Jump', false);
    this.showPayoutCelebration(amount);
    await sleep(Math.max(1300, (this.chickenAnimationDurations.get('Happy Jump') ?? 0.9) * 1000));
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
    const defaultSkin = this.chickenSkeleton.skins.find((skin) => skin.name === 'default') ?? this.chickenSkeleton.skins[0];
    this.chickenSlotParts = [];

    this.chickenSkeleton.slots.forEach((slot) => {
      if (!NORMAL_CHICKEN_SLOTS.has(slot.name) && !EXTRA_ANIMATED_CHICKEN_SLOTS.has(slot.name)) return;
      const slotAttachments = defaultSkin.attachments[slot.name];
      if (!slotAttachments) return;
      const attachmentName = slot.attachment ?? ATTACHMENT_BY_SLOT[slot.name] ?? firstAttachmentName(slotAttachments);
      if (!attachmentName) return;
      const attachment = slotAttachments[attachmentName];
      if (!attachment) return;

      const textureName = attachment.path ?? attachmentName;
      const vertexCount = (attachment.uvs?.length ?? QUAD_VERTICES.length) / 2;
      const texture = textureFromAtlas(this.chickenTexture, this.chickenAtlas, textureName);
      const isTextureRotated = Boolean(this.chickenAtlas[textureName]?.rotate);
      const useSpriteFallback = SPRITE_FALLBACK_CHICKEN_SLOTS.has(slot.name);
      const part = attachment.type === 'mesh' && attachment.uvs?.length && attachment.triangles?.length && !useSpriteFallback
        ? new MeshSimple({
          texture,
          vertices: new Float32Array(vertexCount * 2),
          uvs: new Float32Array(attachment.uvs),
          indices: new Uint32Array(attachment.triangles),
        })
        : atlasSprite(this.chickenTexture, this.chickenAtlas, textureName);

      if (part instanceof Sprite) part.anchor.set(0.5);
      part.visible = NORMAL_CHICKEN_SLOTS.has(slot.name);

      this.chicken.addChild(part);
      this.chickenSlotParts.push({
        slotName: slot.name,
        boneName: slot.bone,
        attachment,
        display: part,
        isMesh: part instanceof MeshSimple,
        isMeshSpriteFallback: useSpriteFallback,
        isTextureRotated,
        vertexCount,
        baseVisible: NORMAL_CHICKEN_SLOTS.has(slot.name),
      });
    });

    this.chicken.eventMode = 'static';
    this.chicken.cursor = 'pointer';
    this.chicken.hitArea = new Rectangle(-110, -335, 235, 375);
    this.chicken.scale.set(CHICKEN_ASSET_SCALE);
    this.chicken.on('pointertap', () => playSound('chick'));
    this.applyChickenAnimation('Start', 0);
  }

  private playChickenAnimation(name: string, loop: boolean) {
    const duration = this.chickenAnimationDurations.get(name) ?? animationDuration(this.chickenSkeleton.animations[name]);
    this.chickenAnimation = { name, elapsed: 0, duration, loop };
    this.applyChickenAnimation(name, 0);
  }

  private updateChickenAnimation(deltaMS: number) {
    if (!this.chicken.visible) return;
    if (!this.chickenAnimation) {
      this.playChickenAnimation('Start', true);
      return;
    }
    const animation = this.chickenAnimation;
    animation.elapsed += deltaMS / 1000;
    const duration = Math.max(animation.duration, 0.001);
    const time = animation.loop ? animation.elapsed % duration : Math.min(animation.elapsed, duration);
    this.applyChickenAnimation(animation.name, time);
  }

  private applyChickenAnimation(name: string, time: number) {
    const animation = this.chickenSkeleton.animations[name];
    if (!animation) return;
    const posedBones = this.chickenSkeleton.bones.map((bone) => ({ ...bone }));
    const posedByName = Object.fromEntries(posedBones.map((bone) => [bone.name, bone]));

    Object.entries(animation.bones ?? {}).forEach(([boneName, timeline]) => {
      const setupBone = this.chickenSkeleton.bones.find((bone) => bone.name === boneName);
      const bone = posedByName[boneName];
      if (!setupBone || !bone) return;
      const rotate = sampleTimeline(timeline.rotate, time, { value: 0 }).value ?? 0;
      const translate = sampleTimeline(timeline.translate, time, { x: 0, y: 0 });
      const scale = sampleTimeline(timeline.scale, time, { x: 1, y: 1 });
      bone.rotation = (setupBone.rotation ?? 0) + rotate;
      bone.x = (setupBone.x ?? 0) + (translate.x ?? 0);
      bone.y = (setupBone.y ?? 0) + (translate.y ?? 0);
      bone.scaleX = (setupBone.scaleX ?? 1) * (scale.x ?? 1);
      bone.scaleY = (setupBone.scaleY ?? 1) * (scale.y ?? 1);
    });

    const transforms = buildSpineTransforms(posedBones);

    this.chickenSlotParts.forEach((part) => {
      const slotAnimation = animation.slots?.[part.slotName];
      const attachmentName = sampleAttachment(slotAnimation?.attachment, time);
      const alpha = sampleAlpha(slotAnimation?.rgba, time) ?? 1;
      const visible = attachmentName === undefined ? part.baseVisible : attachmentName !== null;
      this.applyChickenPartPose(part, transforms, visible, alpha);
    });
  }

  private applyChickenPartPose(
    part: ChickenSlotPart,
    transforms: ReturnType<typeof buildSpineTransforms>,
    visible: boolean,
    alpha: number,
  ) {
    const slotTransform = transforms.byName[part.boneName];
    if (!slotTransform) return;
    const display = part.display;
    display.visible = visible && alpha > 0.01;
    display.alpha = alpha;

    if (part.isMesh) {
      (display as MeshSimple).vertices = meshVerticesFromAttachment(part.attachment, slotTransform, transforms.byIndex, part.vertexCount);
      display.position.set(0, 0);
      display.rotation = 0;
      display.scale.set(1);
      return;
    }

    if (part.isMeshSpriteFallback) {
      const vertices = meshVerticesFromAttachment(part.attachment, slotTransform, transforms.byIndex, part.vertexCount);
      const bounds = boundsFromVertices(vertices);
      const flipX = FLIPPED_X_CHICKEN_SLOTS.has(part.slotName);
      display.position.set(bounds.x, bounds.y);
      display.rotation = 0;
      display.scale.set(flipX && !part.isTextureRotated ? -1 : 1, flipX && part.isTextureRotated ? -1 : 1);
      return;
    }

    const local = localTransform(
      part.attachment.x ?? 0,
      part.attachment.y ?? 0,
      part.attachment.rotation ?? 0,
      part.attachment.scaleX ?? 1,
      part.attachment.scaleY ?? 1,
    );
    const transform = composeTransform(slotTransform, local);
    const scaleX = Math.hypot(transform.a, transform.c);
    const scaleY = Math.hypot(transform.b, transform.d) * (transform.a * transform.d - transform.b * transform.c < 0 ? -1 : 1);

    display.position.set(transform.tx, -transform.ty);
    display.rotation = Math.atan2(-transform.c, transform.a);
    display.scale.set(scaleX, scaleY);
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

  private async animateChickenJumpTo(stepIndex: number) {
    const fromX = this.chicken.x;
    const targetX = WORLD_START + stepIndex * STEP_WIDTH;
    const reserveLaneForJump = !this.hasVehicleOnStep(stepIndex);
    if (reserveLaneForJump) this.reservedPlaneSteps.add(stepIndex);
    this.playChickenAnimation('Walk', true);
    playSound('jump');
    try {
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
    } finally {
      if (reserveLaneForJump) this.reservedPlaneSteps.delete(stepIndex);
    }
  }

  private findAmbientVehicleOnStep(stepIndex: number) {
    return this.ambientVehicles.find((vehicle) => vehicle.stepIndex === stepIndex && !vehicle.sprite.destroyed);
  }

  private collisionDecisionY() {
    return MANHOLE_Y + this.capNormalTexture.height / 2;
  }

  private planeFrontY(vehicle: Container) {
    return vehicle.y + vehicle.height / 2;
  }

  private isBeforeCollisionDecisionPoint(vehicle: AmbientVehicle) {
    return this.planeFrontY(vehicle.sprite) <= this.collisionDecisionY();
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
    try {
      await this.animate(720, (progress) => {
        plane.y = -260 + progress * 1100;
        if (!impacted && this.planeFrontY(plane) >= CHICKEN_Y) {
          impacted = true;
          onImpact?.();
        }
      });
      if (!impacted) {
        impacted = true;
        onImpact?.();
      }
    } finally {
      plane.destroy();
    }
    return impacted;
  }

  private waitForExistingVehicleImpact(vehicle: AmbientVehicle, onImpact: () => void) {
    return new Promise<boolean>((resolve) => {
      let impacted = false;
      const tick = () => {
        if (vehicle.sprite.destroyed) {
          resolve(false);
          return;
        }
        if (!this.isBeforeCollisionDecisionPoint(vehicle)) {
          resolve(false);
          return;
        }
        if (!impacted && this.planeFrontY(vehicle.sprite) >= CHICKEN_Y) {
          impacted = true;
          onImpact();
          resolve(true);
          return;
        }
        requestAnimationFrame(tick);
      };
      tick();
    });
  }

  private updateAmbientVehicles(deltaMS: number) {
    this.ambientSpawnElapsed += deltaMS;
    if (this.ambientSpawnElapsed >= AMBIENT_PLANE_SPAWN_INTERVAL_MS) {
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
    ).filter((stepIndex) => !this.hasVehicleOnStep(stepIndex));
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

  private spawnCrashParts() {
    const pieces = ['BodyYellow', 'JacketYellow', 'SunglassesYellow', 'CombYellow', 'BeakBottomYellow', 'Feather', 'Bam'];
    this.chickenParts = pieces.map((piece, index) => {
      const root = new Container();
      const sprite = atlasSprite(this.chickenTexture, this.chickenAtlas, piece);
      sprite.anchor.set(0.5);
      root.addChild(sprite);
      root.scale.set(CHICKEN_ASSET_SCALE);
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

  private showPayoutCelebration(amount: number) {
    this.clearOverlay();
    const root = new Container();
    const bandHeight = Math.min(190, Math.max(124, this.viewHeight * 0.2));
    const centerX = this.viewWidth / 2;
    const centerY = Math.max(54, bandHeight * 0.42);
    const titleSize = Math.round(Math.min(26, Math.max(18, this.viewWidth * 0.013)));
    const amountSize = Math.round(Math.min(34, Math.max(24, this.viewWidth * 0.017)));

    const glow = new Graphics();
    for (let index = 0; index < 14; index += 1) {
      const progress = index / 13;
      const alpha = 0.25 * (1 - progress) ** 1.35;
      glow
        .rect(0, progress * bandHeight, this.viewWidth, bandHeight / 13 + 1)
        .fill({ color: 0x6cdc2d, alpha });
    }
    glow
      .ellipse(centerX, centerY - 8, Math.min(620, this.viewWidth * 0.4), bandHeight * 0.42)
      .fill({ color: 0x86f03a, alpha: 0.14 });

    const title = new Text({
      text: 'Win',
      style: new TextStyle({
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: titleSize,
        fontWeight: '900',
        fill: '#ffffff',
        stroke: { color: '#295023', width: 2 },
      }),
    });
    title.anchor.set(0.5);
    title.position.set(centerX, centerY - amountSize * 0.48);

    const value = new Text({
      text: `${amount.toFixed(2)} USD`,
      style: new TextStyle({
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: amountSize,
        fontWeight: '900',
        fill: '#ffffff',
        stroke: { color: '#295023', width: 3 },
      }),
    });
    value.anchor.set(0.5);
    value.position.set(centerX, centerY + amountSize * 0.36);

    const trumpetDistance = Math.min(600, this.viewWidth * 0.32);
    const trumpetScale = Math.min(0.7, Math.max(0.42, this.viewWidth / 2600));

    const leftTrumpet = new Sprite(this.trumpetTexture);
    leftTrumpet.anchor.set(0.5);
    leftTrumpet.scale.set(trumpetScale);
    leftTrumpet.position.set(Math.max(70, centerX - trumpetDistance), centerY);
    leftTrumpet.rotation = -0.13;

    const rightTrumpet = new Sprite(this.trumpetTexture);
    rightTrumpet.anchor.set(0.5);
    rightTrumpet.scale.set(-trumpetScale, trumpetScale);
    rightTrumpet.position.set(Math.min(this.viewWidth - 70, centerX + trumpetDistance), centerY);
    rightTrumpet.rotation = 0.13;

    root.addChild(glow, leftTrumpet, rightTrumpet, title, value);
    root.alpha = 0;
    root.y = -12;
    this.overlay.addChild(root);

    void this.animate(420, (progress) => {
      root.alpha = progress;
      root.y = -12 + progress * 12;
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
