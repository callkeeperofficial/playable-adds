import { Application, Assets, Container, Graphics, Rectangle, Sprite, Text, TextStyle, Texture } from 'pixi.js';

type PadState = 'idle' | 'active' | 'passed' | 'burned' | 'dead' | 'prize';
type GameState = 'ready' | 'running' | 'burned' | 'won';
type FontWeight = 'normal' | 'bold' | '400' | '500' | '600' | '700' | '800' | '900';
type LayoutInfo = {
  scale: number;
  viewWidth: number;
  worldViewWidth: number;
  worldScale: number;
  screenWidth: number;
  screenHeight: number;
  groundLiftY: number;
};
type ButtonHandler = () => void;
type FrameRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};
type ChickenAnimationState = 'idle' | 'go' | 'jump' | 'dead';
type ChickenMoveState = 'go' | 'jump';
type Difficulty = 'easy' | 'medium' | 'hard' | 'hardcore';
type StakeAmount = 2 | 3 | 8 | 20;
type SoundKey = 'click' | 'lose' | 'step' | 'win';
type ChickenFrames = {
  idle: Texture[];
  go: Texture[];
  jump: Texture[];
  dead: Texture[];
};
type ObjectSpriteKey = 'padBack' | 'padIdle' | 'padActive' | 'padPassed' | 'padBurned' | 'padPrize';
type ObjectSprites = Record<ObjectSpriteKey, Texture>;
type DecorSpriteKey = 'vent' | 'pedestal' | 'pad';
type DecorSprites = Record<DecorSpriteKey, Texture>;
type FireSprites = {
  mini: Texture[];
  burn: Texture[];
};
type ChickenActor = Container & {
  frames?: ChickenFrames;
  sprite?: Sprite;
};
type FireView = {
  sprite: Sprite;
  frames: Texture[];
  fps: number;
  phase: number;
  startTime: number;
  loop: boolean;
  baseY: number;
  targetHeight: number;
  scaleBasis: number;
  pulse: number;
  locked: boolean;
};
type LiveWin = {
  name: string;
  amount: number;
  avatar: number;
};
type MiniFireSlot = {
  height: number;
  xOffset: number;
  phase: number;
};
type RoundMessage = {
  title: string;
  total: number;
};

const DESIGN_WIDTH = 2048;
const DESIGN_HEIGHT = 1024;
const TOP_H = 48;
const SIDE_W = 282;
const STAGE_H = 724;
const FLOOR_Y = TOP_H + STAGE_H - 52;
const BOTTOM_Y = TOP_H + STAGE_H;

const GAME_SETTINGS = {
  padCount: 11,
  firstMultiplier: 1.03,
  multiplierGrowth: 0.045,
};

const PAD_STEP = 282;
const FIRST_PAD_X = SIDE_W + 142;
const PAD_Y = TOP_H + 317;
const CHICKEN_GROUND_Y = FLOOR_Y + 6;
const START_CHICKEN_X = 144;
const START_CHICKEN_Y = CHICKEN_GROUND_Y - 12;
const RUN_CHICKEN_Y = CHICKEN_GROUND_Y - 18;
const PRIZE_CHICKEN_Y = FLOOR_Y - 86;
const GLOBAL_POOL_AMOUNT = 1000000;
const STAKE_VALUES = [2, 3, 8, 20] as const;
const DEFAULT_STAKE_AMOUNT: StakeAmount = 3;
const MOVE_SPEED = 0.018;
const MOVE_ANIMATION_FPS = 4;
const AUTO_ADVANCE_DELAY_MS = 520;
const REVIVE_DELAY_MS = 1200;
const ROUND_MESSAGE_DELAY_MS = 1800;
const BANK_STORAGE_KEY = 'chicken-road-banked-winnings';
const CHICKEN_ASSET_URLS: Record<ChickenAnimationState, string> = {
  idle: `${import.meta.env.BASE_URL}assets/chicken-idle.png`,
  go: `${import.meta.env.BASE_URL}assets/chicken-go.png`,
  jump: `${import.meta.env.BASE_URL}assets/chicken-jump.png`,
  dead: `${import.meta.env.BASE_URL}assets/chicken-dead.png`,
};
const AUDIO_URLS: Record<SoundKey, string> = {
  click: `${import.meta.env.BASE_URL}assets/audio/button-click.webm`,
  lose: `${import.meta.env.BASE_URL}assets/audio/lose.webm`,
  step: `${import.meta.env.BASE_URL}assets/audio/step.webm`,
  win: `${import.meta.env.BASE_URL}assets/audio/win.webm`,
};
const OBJECTS_SPRITE_URL = `${import.meta.env.BASE_URL}assets/objects.png`;
const DECORS_SPRITE_URL = `${import.meta.env.BASE_URL}assets/decors.png`;
const MINI_FIRE_SPRITE_URL = `${import.meta.env.BASE_URL}assets/mini-fire.png`;
const BURN_FIRE_FRAME_URLS = Array.from({ length: 6 }, (_, index) => `${import.meta.env.BASE_URL}assets/fire-burn-${index + 1}.png`);
const CHICKEN_SPRITE_SCALE = 0.72;
const CHICKEN_DEAD_SCALE = 0.5;
const CHICKEN_CELL = 302;
const CHICKEN_IDLE_FRAMES: FrameRect[] = gridFrames(5, 5, CHICKEN_CELL, CHICKEN_CELL, 24);
const CHICKEN_GO_FRAMES: FrameRect[] = gridFrames(4, 4, CHICKEN_CELL, CHICKEN_CELL);
const CHICKEN_JUMP_FRAMES: FrameRect[] = gridFrames(4, 3, CHICKEN_CELL, 362, 10);
const CHICKEN_DEAD_FRAMES: FrameRect[] = [{
  x: 0,
  y: 0,
  w: 482,
  h: 424,
}];
const OBJECT_SPRITE_FRAMES: Record<ObjectSpriteKey, FrameRect> = {
  padPrize: { x: 0, y: 0, w: 620, h: 742 },
  padPassed: { x: 1240, y: 0, w: 420, h: 420 },
  padActive: { x: 1478, y: 418, w: 402, h: 410 },
  padIdle: { x: 620, y: 750, w: 408, h: 420 },
  padBack: { x: 1018, y: 742, w: 438, h: 480 },
  padBurned: { x: 1470, y: 822, w: 410, h: 430 },
};
const DECOR_SPRITE_FRAMES: Record<DecorSpriteKey, FrameRect> = {
  vent: { x: 198, y: 1012, w: 370, h: 392 },
  pedestal: { x: 568, y: 1012, w: 282, h: 158 },
  pad: { x: 853, y: 1012, w: 433, h: 68 },
};
const MINI_FIRE_FRAMES: FrameRect[] = [
  { x: 701, y: 23, w: 82, h: 93 },
  { x: 536, y: 341, w: 88, h: 88 },
  { x: 937, y: 334, w: 85, h: 95 },
  { x: 552, y: 724, w: 72, h: 126 },
  { x: 983, y: 514, w: 121, h: 145 },
  { x: 662, y: 599, w: 122, h: 160 },
  { x: 977, y: 121, w: 124, h: 165 },
  { x: 312, y: 268, w: 179, h: 161 },
  { x: 312, y: 611, w: 165, h: 190 },
  { x: 0, y: 653, w: 185, h: 194 },
  { x: 312, y: 268, w: 179, h: 161 },
  { x: 662, y: 599, w: 122, h: 160 },
  { x: 983, y: 514, w: 121, h: 145 },
  { x: 552, y: 724, w: 72, h: 126 },
  { x: 937, y: 334, w: 85, h: 95 },
  { x: 536, y: 341, w: 88, h: 88 },
];
const MINI_FIRE_CHANCE = 0.32;
const LIVE_WIN_INTERVAL_MS = 3200;
const LIVE_WIN_VISIBLE_MS = 2200;
const MAX_RENDER_RESOLUTION = 3;
const COMPACT_CONTROLS_BREAKPOINT = 1000;
const COMPACT_CONTROLS_GAP = 20;
const COMPACT_CONTROLS_H = 340;
const COMPACT_CONTROLS_MIN_H = 280;
const COMPACT_GROUND_LIFT_Y = 0;
const COMPACT_WORLD_SCALE = 0.8;
const LIVE_WIN_MOCKS: LiveWin[] = [
  { name: 'Moccasin He...', amount: 1108.08, avatar: 0xff6f5d },
  { name: 'Blue Ideologi...', amount: 244.50, avatar: 0x6fa9ff },
  { name: 'Plum Balance...', amount: 220.50, avatar: 0xba78ff },
  { name: 'Tan Superior ...', amount: 420.00, avatar: 0xffc064 },
  { name: 'Aqua Alleged...', amount: 306.00, avatar: 0x62dbe9 },
  { name: 'Salmon Delig...', amount: 244.50, avatar: 0xff8b77 },
];
const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  hardcore: 'Hardcore',
};
const DIFFICULTY_CHANCES: Record<Difficulty, { base: number; step: number; max: number }> = {
  easy: { base: 0.015, step: 0.004, max: 0.06 },
  medium: { base: 0.04, step: 0.012, max: 0.16 },
  hard: { base: 0.08, step: 0.024, max: 0.34 },
  hardcore: { base: 0.14, step: 0.042, max: 0.58 },
};
const DIFFICULTY_MULTIPLIERS: Record<Difficulty, { first: number; growth: number; curve: number }> = {
  easy: {
    first: GAME_SETTINGS.firstMultiplier,
    growth: GAME_SETTINGS.multiplierGrowth,
    curve: 0.003,
  },
  medium: { first: 1.08, growth: 0.09, curve: 0.008 },
  hard: { first: 1.18, growth: 0.18, curve: 0.02 },
  hardcore: { first: 1.35, growth: 0.36, curve: 0.06 },
};
const PRIZE_INDEX = GAME_SETTINGS.padCount - 1;
const LEVEL_WIDTH = FIRST_PAD_X + PRIZE_INDEX * PAD_STEP + 360;

type PadView = {
  root: Container;
  state: PadState;
};

function gridFrames(columns: number, rows: number, width: number, height: number, count = columns * rows): FrameRect[] {
  const frames: FrameRect[] = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      if (frames.length >= count) return frames;
      frames.push({
        x: column * width,
        y: row * height,
        w: width,
        h: height,
      });
    }
  }
  return frames;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function text(value: string, size: number, fill: number | string, weight: FontWeight = '800', stroke = 0x22273d, strokeWidth = 0): Text {
  return new Text({
    text: value,
    style: new TextStyle({
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: size,
      fontWeight: weight,
      fill,
      stroke: strokeWidth ? { color: stroke, width: strokeWidth } : undefined,
    }),
  });
}

function addText(parent: Container, value: string, x: number, y: number, size: number, fill: number | string, anchorX = 0, anchorY = 0.5, weight: FontWeight = '800', stroke = 0x22273d, strokeWidth = 0): Text {
  const item = text(value, size, fill, weight, stroke, strokeWidth);
  item.anchor.set(anchorX, anchorY);
  item.position.set(x, y);
  parent.addChild(item);
  return item;
}

function addFittedText(parent: Container, value: string, x: number, y: number, size: number, fill: number | string, maxWidth: number, maxHeight: number, anchorX = 0.5, anchorY = 0.5, weight: FontWeight = '800', stroke = 0x22273d, strokeWidth = 0): Text {
  const item = addText(parent, value, x, y, size, fill, anchorX, anchorY, weight, stroke, strokeWidth);
  const scale = Math.min(1, maxWidth / Math.max(1, item.width), maxHeight / Math.max(1, item.height));
  item.scale.set(scale);
  return item;
}

function formatBalance(value: number): string {
  const fixed = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2);
  const [whole, decimal] = fixed.split('.');
  const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return decimal ? `${formattedWhole}.${decimal}` : formattedWhole;
}

function formatUsd(value: number): string {
  return value.toFixed(2);
}

function multiplierValueForIndex(index: number, difficulty: Difficulty): number {
  const safeIndex = Math.max(0, Math.min(index, PRIZE_INDEX));
  const config = DIFFICULTY_MULTIPLIERS[difficulty];
  return config.first + safeIndex * config.growth + safeIndex * safeIndex * config.curve;
}

function multiplierLabelForIndex(index: number, difficulty: Difficulty): string {
  return `${multiplierValueForIndex(index, difficulty).toFixed(2)}x`;
}

function payoutForIndex(index: number, base: number, difficulty: Difficulty): number {
  return base * multiplierValueForIndex(index, difficulty);
}

function loadBankedWinnings(): number {
  try {
    const raw = window.localStorage?.getItem(BANK_STORAGE_KEY);
    const value = raw ? Number(raw) : 0;
    return Number.isFinite(value) && value >= 0 ? value : 0;
  } catch {
    return 0;
  }
}

function saveBankedWinnings(value: number): void {
  try {
    window.localStorage?.setItem(BANK_STORAGE_KEY, formatUsd(value));
  } catch {
    // Some embedded browsers can disable storage; the game should still run.
  }
}

function createAudioController() {
  const sounds = Object.fromEntries(
    Object.entries(AUDIO_URLS).map(([key, url]) => {
      const audio = new Audio(url);
      audio.preload = 'auto';
      audio.volume = 0.72;
      return [key, audio];
    }),
  ) as Record<SoundKey, HTMLAudioElement>;

  function play(key: SoundKey): void {
    const audio = sounds[key];
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }

  return { play };
}

function panel(parent: Container, x: number, y: number, w: number, h: number, r: number, color: number, stroke = 0x000000, alpha = 1): Graphics {
  const shadow = new Graphics();
  shadow.roundRect(x, y + 8, w, h, r).fill({ color: 0x070914, alpha: 0.32 });
  parent.addChild(shadow);

  const g = new Graphics();
  g.roundRect(x, y, w, h, r).fill({ color, alpha });
  if (stroke) g.stroke({ width: 2, color: stroke, alpha: 0.65 });
  parent.addChild(g);
  return g;
}

function drawTopBar(root: Container, viewWidth: number, balance: string): void {
  const bar = new Graphics();
  bar.rect(0, 0, viewWidth, TOP_H).fill(0x3a3e50);
  root.addChild(bar);

  addText(root, 'CHICKEN R', 28, 24, 40, 0xffffff, 0, 0.5, '900');
  const coin = new Graphics();
  coin.circle(270, 23, 17).fill(0xffd549).stroke({ width: 4, color: 0xf0b31d });
  coin.ellipse(264, 15, 8, 12).fill({ color: 0xffff9a, alpha: 0.75 });
  root.addChild(coin);
  addText(root, 'AD', 286, 24, 40, 0xffffff, 0, 0.5, '900');

  const menuX = viewWidth - 29;
  const expandX = viewWidth - 78;
  const balanceW = Math.min(192, Math.max(138, viewWidth * 0.15));
  const balanceX = expandX - balanceW - 18;
  const helpW = 160;
  const helpX = balanceX - helpW - 18;
  const showHelp = viewWidth >= 980;
  const showBalance = viewWidth >= 660;

  if (showHelp) panel(root, helpX, 5, helpW, 35, 6, 0x555a70, 0x555a70, 0.88);
  const info = new Graphics();
  if (showHelp) {
    info.circle(helpX + 24, 22, 7).stroke({ width: 2, color: 0xffffff });
    info.circle(helpX + 24, 18, 1.8).fill(0xffffff);
    info.rect(helpX + 23.2, 21, 1.6, 7).fill(0xffffff);
    root.addChild(info);
    addText(root, 'How to play?', helpX + 42, 22, 16, 0xffffff, 0, 0.5, '800');
  }

  if (showBalance) {
    panel(root, balanceX, 5, balanceW, 35, 6, 0x555a70, 0x555a70, 0.88);
    addText(root, balance, balanceX + balanceW / 2 - 10, 22, 18, 0xffffff, 0.5, 0.5, '900');
    const smallCoin = new Graphics();
    smallCoin.circle(balanceX + balanceW - 30, 22, 10).fill(0xf7f8ff);
    root.addChild(smallCoin);
    addText(root, '$', balanceX + balanceW - 30, 22, 14, 0x535a6d, 0.5, 0.5, '900');
  }

  panel(root, expandX - 17, 5, 34, 35, 6, 0x555a70, 0x555a70, 0.88);
  const expand = new Graphics();
  expand.moveTo(expandX - 10, 18).lineTo(expandX - 10, 13).lineTo(expandX - 5, 13).moveTo(expandX + 11, 13).lineTo(expandX + 16, 13).lineTo(expandX + 16, 18);
  expand.moveTo(expandX - 10, 27).lineTo(expandX - 10, 32).lineTo(expandX - 5, 32).moveTo(expandX + 11, 32).lineTo(expandX + 16, 32).lineTo(expandX + 16, 27);
  expand.stroke({ width: 2, color: 0xffffff });
  root.addChild(expand);

  const menu = new Graphics();
  for (let i = 0; i < 3; i++) menu.roundRect(menuX - 9, 15 + i * 7, 18, 2.5, 1.2).fill(0xffffff);
  root.addChild(menu);
}

function drawLivePanel(root: Container): void {
  const side = new Graphics();
  side.rect(0, TOP_H, SIDE_W, STAGE_H).fill(0x2f354f);
  root.addChild(side);

  const door = new Graphics();
  door.roundRect(57, 288, 166, 488, 86).fill(0x121522).stroke({ width: 14, color: 0x222947 });
  door.roundRect(68, 298, 144, 466, 76).stroke({ width: 7, color: 0x343c65 });
  root.addChild(door);
}

function drawLiveWinsOverlay(root: Container, liveWin: LiveWin, onlineCount: number): void {
  const backing = new Graphics();
  backing.rect(0, TOP_H, SIDE_W, 86).fill({ color: 0x2f354f, alpha: 0.97 });
  root.addChild(backing);

  addText(root, 'Live wins:', 12, 64, 13, 0xbfc6e4, 0, 0.5, '800');
  const dot = new Graphics();
  dot.circle(97, 64, 3.5).fill(0x35e34c);
  root.addChild(dot);
  addText(root, 'Online:', 114, 64, 13, 0xbfc6e4, 0, 0.5, '800');
  addText(root, String(onlineCount), 169, 64, 13, 0xbfc6e4, 0, 0.5, '800');

  const row = new Graphics();
  row.roundRect(10, 84, 210, 30, 6).fill({ color: 0x3c466c, alpha: 0.58 });
  row.circle(22, 99, 9).fill(liveWin.avatar);
  row.circle(22, 105, 4).fill(0x3457d1);
  root.addChild(row);
  addText(root, liveWin.name, 39, 99, 13, 0xffffff, 0, 0.5, '800');
  addText(root, `+$${formatUsd(liveWin.amount)}`, 145, 99, 13, 0x35ff72, 0, 0.5, '900');
}

function drawStage(root: Container): void {
  const stage = new Graphics();
  stage.rect(SIDE_W, TOP_H, LEVEL_WIDTH - SIDE_W, STAGE_H).fill(0x444c6d);
  root.addChild(stage);

  const blocks = new Graphics();
  const blockData = [
    [145, 157], [322, 104], [603, 154], [711, 202], [994, 104], [1168, 523], [1455, 202],
    [1559, 103], [1735, 523], [1842, 154], [2027, 523], [37, 314], [321, 523], [887, 521],
  ];
  for (let offset = 0; offset < LEVEL_WIDTH; offset += 1420) {
    for (const [x, y] of blockData) {
      const blockX = x + offset;
      if (blockX < LEVEL_WIDTH) blocks.roundRect(blockX, TOP_H + y, 90, 55, 14).fill({ color: 0x303752, alpha: 0.68 });
    }
  }
  root.addChild(blocks);

  const lines = new Graphics();
  for (let x = SIDE_W + PAD_STEP; x < LEVEL_WIDTH; x += PAD_STEP) {
    for (let y = TOP_H + 18; y < FLOOR_Y - 16; y += 64) {
      lines.roundRect(x - 4, y, 8, 32, 2).fill(0xa6afd5);
    }
  }
  root.addChild(lines);
}

function drawFloor(root: Container, liftY = 0): void {
  const floorY = FLOOR_Y - liftY;
  const floor = new Graphics();
  floor.rect(0, floorY, LEVEL_WIDTH, 50).fill(0x34394d);
  floor.rect(0, floorY, LEVEL_WIDTH, 7).fill(0x1e2439);
  for (let x = 0; x < LEVEL_WIDTH; x += 282) {
    floor.rect(x, floorY + 8, 282, 42).fill((x / 282) % 2 ? 0x3a3e52 : 0x303548);
    floor.rect(x + 281, floorY + 8, 1, 42).fill(0x242a3d);
  }
  floor.rect(0, floorY + 50, LEVEL_WIDTH, 9).fill(0x111523);
  root.addChild(floor);
}

function drawVent(parent: Container, x: number, y: number, decors?: DecorSprites, padPressed = false, liftY = 0): void {
  const floorY = FLOOR_Y - liftY;
  const ventY = y - liftY;
  if (decors) {
    const sprite = new Sprite(decors.vent);
    sprite.anchor.set(0.5, 1);
    sprite.position.set(x, floorY - 5);
    sprite.scale.set(168 / sprite.texture.height);
    parent.addChild(sprite);

    const pad = new Sprite(decors.pad);
    pad.anchor.set(0.5, 1);
    pad.position.set(x, padPressed ? floorY + 31 : floorY + 4);
    pad.scale.set(164 / pad.texture.width);
    parent.addChild(pad);
    return;
  }

  const vent = new Graphics();
  vent.roundRect(x - 84, ventY - 84, 168, 118, 84).fill(0x222945).stroke({ width: 7, color: 0x30385c });
  vent.roundRect(x - 78, ventY - 76, 156, 110, 78).stroke({ width: 7, color: 0x1b2138 });
  for (let i = -3; i <= 3; i++) {
    const barH = 48 + (4 - Math.abs(i)) * 9;
    vent.roundRect(x + i * 18 - 7, ventY + 20 - barH, 14, barH, 7).fill(0x151a2f);
  }
  vent.roundRect(x - 96, padPressed ? floorY + 15 : ventY + 32, 192, 17, 7).fill(0x697397);
  parent.addChild(vent);
}

function addMarkerSprite(parent: Container, texture: Texture, targetSize: number, y = 0): Sprite {
  const sprite = new Sprite(texture);
  sprite.anchor.set(0.5);
  sprite.position.set(0, y);
  sprite.scale.set(targetSize / Math.max(texture.width, texture.height));
  parent.addChild(sprite);
  return sprite;
}

function drawPrizeDisplay(parent: Container, label: string, objectSprites: ObjectSprites, decors?: DecorSprites): void {
  const chamber = new Graphics();
  chamber.roundRect(-122, -190, 244, 546, 118).fill({ color: 0x161a28, alpha: 0.76 });
  chamber.roundRect(-116, -184, 232, 538, 110).stroke({ width: 8, color: 0x526098, alpha: 0.82 });
  chamber.circle(0, -10, 124).fill({ color: 0xffdf44, alpha: 0.12 });
  chamber.rect(-91, 104, 182, 212).fill({ color: 0x0b0e17, alpha: 0.22 });
  parent.addChild(chamber);

  const egg = addMarkerSprite(parent, objectSprites.padPrize, 210, -10);
  egg.scale.set(210 / egg.texture.height);
  addText(parent, label, 0, -10, 43, 0xffffff, 0.5, 0.5, '900', 0x7f5c09, 5);

  if (decors) {
    const pedestal = new Sprite(decors.pedestal);
    pedestal.anchor.set(0.5, 1);
    pedestal.position.set(0, 350);
    pedestal.scale.set(104 / pedestal.texture.height);
    parent.addChild(pedestal);
  } else {
    const pedestal = new Graphics();
    pedestal.moveTo(-62, 280).lineTo(62, 280).quadraticCurveTo(45, 332, 26, 348).lineTo(-26, 348).quadraticCurveTo(-45, 332, -62, 280).fill(0xd8d9d2);
    pedestal.roundRect(-68, 274, 136, 12, 6).fill(0xf0f1eb);
    parent.addChild(pedestal);
  }
}

function drawSpritePad(parent: Container, label: string, state: PadState, sprites: ObjectSprites, decors?: DecorSprites): boolean {
  addMarkerSprite(parent, sprites.padBack, 224, 12);

  if (state === 'prize') {
    parent.removeChildren();
    drawPrizeDisplay(parent, label, sprites, decors);
    return true;
  }

  if (state === 'dead' || state === 'passed') {
    addMarkerSprite(parent, sprites.padPassed, 190, 0);
    return true;
  }

  if (state === 'burned') {
    addMarkerSprite(parent, sprites.padBurned, 192, 0);
    return true;
  }

  const marker = state === 'active' ? sprites.padActive : sprites.padIdle;
  addMarkerSprite(parent, marker, 192, 0);
  addText(parent, label, 0, 6, 47, 0xe9edff, 0.5, 0.5, '900', 0x2a3259, 5);
  return true;
}

function drawPad(parent: Container, label: string, state: PadState, sprites?: ObjectSprites, decors?: DecorSprites): void {
  parent.removeChildren();
  if (sprites && drawSpritePad(parent, label, state, sprites, decors)) return;

  const color = state === 'active' || state === 'passed' ? 0x25b94a : state === 'dead' || state === 'prize' ? 0xf3c62d : state === 'burned' ? 0xd12f68 : 0x596596;
  const ring = state === 'active' || state === 'passed' ? 0x38ef55 : state === 'dead' || state === 'prize' ? 0xffdf44 : state === 'burned' ? 0xff386f : 0x7480c4;

  const g = new Graphics();
  g.circle(0, 11, 98).fill({ color: 0x1d243e, alpha: 0.45 });
  g.circle(0, 0, 91).fill(0x2d3454);
  g.circle(0, 0, 80).fill(color).stroke({ width: 10, color: ring });
  g.circle(0, 0, 63).stroke({ width: 7, color: state === 'dead' ? 0xa47816 : 0x25304e, alpha: 0.48 });
  g.moveTo(-62, -44).lineTo(70, -44).lineTo(-12, 62).lineTo(-84, 20).fill({ color: 0xffffff, alpha: 0.1 });
  parent.addChild(g);

  if (state === 'dead') {
    const skull = new Graphics();
    skull.circle(-8, -12, 34).fill(0xd29f22).stroke({ width: 4, color: 0x946b15 });
    skull.circle(-28, -18, 16).fill(0xb9811a);
    skull.circle(14, -18, 16).fill(0xb9811a);
    skull.moveTo(12, 10).lineTo(21, 19).moveTo(21, 10).lineTo(12, 19).stroke({ width: 4, color: 0x8b661d });
    parent.addChild(skull);
    return;
  }

  if (state === 'prize') {
    const egg = new Graphics();
    egg.ellipse(0, -8, 35, 47).fill(0xfff5c5).stroke({ width: 5, color: 0xf2b82c });
    egg.ellipse(-10, -25, 11, 17).fill({ color: 0xffffff, alpha: 0.72 });
    egg.circle(16, 12, 8).fill({ color: 0xffd85c, alpha: 0.8 });
    egg.circle(-18, 6, 7).fill({ color: 0xffd85c, alpha: 0.65 });
    parent.addChild(egg);
    return;
  }

  addText(parent, label, 0, 6, 47, 0xe9edff, 0.5, 0.5, '900', 0x2a3259, 5);
}

function makePad(label: string, x: number, state: PadState, sprites?: ObjectSprites, decors?: DecorSprites): PadView {
  const root = new Container();
  root.position.set(x, PAD_Y);
  drawPad(root, label, state, sprites, decors);
  return { root, state };
}

function makeSpriteFrames(sheet: Texture, frames: FrameRect[]): Texture[] {
  return frames.map((frame) => new Texture({
    source: sheet.source,
    frame: new Rectangle(frame.x, frame.y, frame.w, frame.h),
  }));
}

async function loadObjectSprites(): Promise<ObjectSprites | undefined> {
  try {
    const sheet = await Assets.load<Texture>(OBJECTS_SPRITE_URL);
    return Object.fromEntries(
      Object.entries(OBJECT_SPRITE_FRAMES).map(([key, frame]) => [
        key,
        new Texture({
          source: sheet.source,
          frame: new Rectangle(frame.x, frame.y, frame.w, frame.h),
        }),
      ]),
    ) as ObjectSprites;
  } catch {
    return undefined;
  }
}

async function loadDecorSprites(): Promise<DecorSprites | undefined> {
  try {
    const sheet = await Assets.load<Texture>(DECORS_SPRITE_URL);
    return Object.fromEntries(
      Object.entries(DECOR_SPRITE_FRAMES).map(([key, frame]) => [
        key,
        new Texture({
          source: sheet.source,
          frame: new Rectangle(frame.x, frame.y, frame.w, frame.h),
        }),
      ]),
    ) as DecorSprites;
  } catch {
    return undefined;
  }
}

async function loadFireSprites(): Promise<FireSprites | undefined> {
  try {
    const [miniSheet, ...burnFrames] = await Promise.all([
      Assets.load<Texture>(MINI_FIRE_SPRITE_URL),
      ...BURN_FIRE_FRAME_URLS.map((url) => Assets.load<Texture>(url)),
    ]);

    return {
      mini: makeSpriteFrames(miniSheet, MINI_FIRE_FRAMES),
      burn: burnFrames,
    };
  } catch {
    return undefined;
  }
}

async function loadChickenFrames(): Promise<ChickenFrames | undefined> {
  try {
    const [idleSheet, goSheet, jumpSheet, deadSheet] = await Promise.all([
      Assets.load<Texture>(CHICKEN_ASSET_URLS.idle),
      Assets.load<Texture>(CHICKEN_ASSET_URLS.go),
      Assets.load<Texture>(CHICKEN_ASSET_URLS.jump),
      Assets.load<Texture>(CHICKEN_ASSET_URLS.dead),
    ]);

    return {
      idle: makeSpriteFrames(idleSheet, CHICKEN_IDLE_FRAMES),
      go: makeSpriteFrames(goSheet, CHICKEN_GO_FRAMES),
      jump: makeSpriteFrames(jumpSheet, CHICKEN_JUMP_FRAMES),
      dead: makeSpriteFrames(deadSheet, CHICKEN_DEAD_FRAMES),
    };
  } catch {
    return undefined;
  }
}

function makeChicken(frames?: ChickenFrames): ChickenActor {
  const c = new Container() as ChickenActor;

  if (frames) {
    const sprite = new Sprite(frames.idle[0]);
    sprite.anchor.set(0.5, 0.86);
    sprite.scale.set(CHICKEN_SPRITE_SCALE);
    c.frames = frames;
    c.sprite = sprite;
    c.addChild(sprite);
    return c;
  }

  c.pivot.set(0, 96);
  const body = new Graphics();
  body.ellipse(0, 0, 76, 50).fill(0xf4fbff).stroke({ width: 5, color: 0xdde8ec });
  body.ellipse(-58, -8, 42, 37).fill(0xf8fdff).stroke({ width: 5, color: 0xdde8ec });
  body.ellipse(54, -78, 40, 45).fill(0xf6fbff).stroke({ width: 5, color: 0xdde8ec });
  body.ellipse(-26, 4, 38, 25).fill(0xe9f3f6);
  body.moveTo(76, -85).lineTo(118, -65).lineTo(76, -42).fill(0xffca27).stroke({ width: 5, color: 0xd99b12 });
  body.circle(36, -88, 28).fill(0xfff2a1).stroke({ width: 5, color: 0x303044 });
  body.circle(80, -88, 28).fill(0xfff2a1).stroke({ width: 5, color: 0x303044 });
  body.circle(45, -89, 8).fill(0x1c2032);
  body.circle(87, -89, 8).fill(0x1c2032);
  body.moveTo(18, -126).quadraticCurveTo(52, -162, 72, -111).quadraticCurveTo(38, -123, 10, -105).fill(0xef292e);
  body.ellipse(66, -41, 12, 20).fill(0xff5a47);
  body.rect(-42, 43, 12, 55).fill(0xe9a21a);
  body.rect(16, 43, 12, 55).fill(0xe9a21a);
  body.moveTo(-50, 96).lineTo(-13, 96).moveTo(6, 96).lineTo(45, 96).stroke({ width: 9, color: 0xe9a21a });
  c.addChild(body);
  return c;
}

function updateChickenFrame(chicken: ChickenActor, state: ChickenAnimationState, time: number): void {
  if (!chicken.sprite || !chicken.frames) return;

  const frames = chicken.frames[state];
  const fps = state === 'idle' ? 12 : state === 'dead' ? 1 : MOVE_ANIMATION_FPS;
  const frameIndex = state === 'dead' ? 0 : Math.floor(time * fps) % frames.length;
  const scale = state === 'dead' ? CHICKEN_DEAD_SCALE : CHICKEN_SPRITE_SCALE;

  chicken.sprite.texture = frames[frameIndex];
  chicken.sprite.anchor.set(0.5, state === 'dead' ? 0.9 : 0.86);
  chicken.sprite.scale.set(scale);
  chicken.sprite.y = 0;
}

function drawFireAnimation(parent: Container, frames: Texture[], x: number, y: number, targetHeight: number, fps: number, phase = Math.random() * 10, pulse = 0.04, loop = true, startTime = 0, locked = false): FireView {
  const sprite = new Sprite(frames[0]);
  const scaleBasis = Math.max(...frames.map((frame) => frame.height));
  sprite.anchor.set(0.5, 1);
  sprite.position.set(x, y);
  sprite.scale.set(targetHeight / scaleBasis);
  parent.addChild(sprite);

  return {
    sprite,
    frames,
    fps,
    phase,
    startTime,
    loop,
    baseY: y,
    targetHeight,
    scaleBasis,
    pulse,
    locked,
  };
}

function updateFireAnimation(view: FireView, time: number): void {
  const animationTime = view.loop ? time + view.phase : Math.max(0, time - view.startTime);
  const frameIndex = view.loop
    ? Math.floor(animationTime * view.fps) % view.frames.length
    : Math.min(view.frames.length - 1, Math.floor(animationTime * view.fps));
  const texture = view.frames[frameIndex];
  const pulseTime = time + view.phase;
  const pulse = view.locked ? 1 : 1 + Math.sin(pulseTime * 7) * view.pulse;
  view.sprite.texture = texture;
  view.sprite.scale.set((view.targetHeight / view.scaleBasis) * pulse);
  view.sprite.y = view.locked ? view.baseY : view.baseY + Math.sin(pulseTime * 5) * view.targetHeight * 0.025;
}

function createMiniFireSlots(): (MiniFireSlot | undefined)[] {
  return Array.from({ length: PRIZE_INDEX }, () => {
    if (Math.random() >= MINI_FIRE_CHANCE) return undefined;
    return {
      height: 78 + Math.random() * 34,
      xOffset: -12 + Math.random() * 24,
      phase: Math.random() * 10,
    };
  });
}

function drawMiniFire(parent: Container, frames: Texture[], x: number, y: number, slot: MiniFireSlot): FireView {
  return drawFireAnimation(parent, frames, x + slot.xOffset, y, slot.height, 7, slot.phase, 0, true, 0, true);
}

function drawFallbackFlame(parent: Container, x: number, y: number, scale: number): Container {
  const flame = new Container();
  flame.position.set(x, y);
  flame.scale.set(scale);
  const glow = new Graphics();
  glow.circle(0, 0, 136).fill({ color: 0xff2637, alpha: 0.2 });
  glow.moveTo(0, 230).bezierCurveTo(-84, 120, -46, 18, -1, -72).bezierCurveTo(48, 22, 88, 104, 39, 230).fill(0xff2d12);
  glow.moveTo(6, 210).bezierCurveTo(-54, 114, -16, 42, 40, -95).bezierCurveTo(81, 13, 109, 92, 38, 210).fill(0xff7a08);
  glow.moveTo(4, 190).bezierCurveTo(-23, 102, 10, 39, 67, -67).bezierCurveTo(83, 29, 88, 102, 32, 190).fill(0xfff36a);
  flame.addChild(glow);
  parent.addChild(flame);
  return flame;
}

function drawWagerSelector(parent: Container, x: number, y: number, w: number, h: number, stake: StakeAmount, enabled: boolean, onMin: ButtonHandler, onMax: ButtonHandler): void {
  const baseColor = enabled ? 0x4d5269 : 0x3f4357;
  const buttonColor = enabled ? 0x62687e : 0x4c5064;
  const textColor = enabled ? 0xffffff : 0x8d91a1;
  const mutedTextColor = enabled ? 0xd7dae5 : 0x838798;
  panel(parent, x, y, w, h, 15, baseColor, 0x3b4057);

  const insetX = Math.max(22, Math.min(30, w * 0.07));
  const buttonW = Math.max(74, Math.min(112, w * 0.2));
  const verticalInset = h < 58 ? 6 : 14;
  const buttonH = Math.max(30, h - verticalInset * 2);
  const buttonY = y + verticalInset;
  const fontSize = Math.max(22, Math.min(35, buttonH * 0.58));

  const minButton = panel(parent, x + insetX, buttonY, buttonW, buttonH, 8, buttonColor, buttonColor);
  if (enabled) bindButton(minButton, x + insetX, buttonY, buttonW, buttonH, onMin);
  addText(parent, 'MIN', x + insetX + buttonW / 2, y + h / 2, fontSize, mutedTextColor, 0.5, 0.5, '900');

  addText(parent, String(stake), x + w / 2, y + h / 2, Math.max(30, Math.min(44, h * 0.52)), textColor, 0.5, 0.5, '900');

  const maxX = x + w - insetX - buttonW;
  const maxButton = panel(parent, maxX, buttonY, buttonW, buttonH, 8, buttonColor, buttonColor);
  if (enabled) bindButton(maxButton, maxX, buttonY, buttonW, buttonH, onMax);
  addText(parent, 'MAX', maxX + buttonW / 2, y + h / 2, fontSize, mutedTextColor, 0.5, 0.5, '900');
}

function drawStakeButton(parent: Container, amount: StakeAmount, isActive: boolean, enabled: boolean, x: number, y: number, w: number, h: number, onStake: (stake: StakeAmount) => void): void {
  const color = enabled ? (isActive ? 0x60667c : 0x50566d) : 0x42465a;
  const stroke = enabled && isActive ? 0x7a829d : 0x3b4057;
  const button = panel(parent, x, y, w, h, 13, color, stroke);
  if (enabled) bindButton(button, x, y, w, h, () => onStake(amount));

  const coinR = Math.max(8, Math.min(13, h * 0.22));
  const fontSize = Math.max(23, Math.min(38, h * 0.54));
  const amountOffset = String(amount).length > 1 ? coinR + 14 : coinR + 11;
  const textColor = enabled ? 0xffffff : 0x9296a7;
  const coinColor = enabled ? 0xf3f4fb : 0x9fa3b2;
  addText(parent, String(amount), x + w / 2 - amountOffset / 2, y + h / 2, fontSize, textColor, 0.5, 0.5, '900');

  const coin = new Graphics();
  coin.circle(x + w / 2 + amountOffset / 2, y + h / 2, coinR).fill(coinColor);
  parent.addChild(coin);
  addText(parent, '$', x + w / 2 + amountOffset / 2, y + h / 2, Math.max(14, fontSize - 11), 0x52576e, 0.5, 0.5, '900');
}

function drawStakeRow(parent: Container, x: number, y: number, w: number, h: number, selectedStake: StakeAmount, enabled: boolean, onStake: (stake: StakeAmount) => void): void {
  const gap = Math.max(20, Math.min(38, w * 0.05));
  const buttonW = (w - gap * 3) / 4;
  for (let i = 0; i < STAKE_VALUES.length; i++) {
    const stake = STAKE_VALUES[i];
    drawStakeButton(parent, stake, stake === selectedStake, enabled, x + i * (buttonW + gap), y, buttonW, h, onStake);
  }
}

function bindButton(button: Graphics, x: number, y: number, w: number, h: number, onClick: ButtonHandler): void {
  button.eventMode = 'static';
  button.cursor = 'pointer';
  button.hitArea = new Rectangle(x, y, w, h);
  button.on('pointertap', onClick);
}

function drawGoButton(parent: Container, label: string, x: number, y: number, w: number, h: number, onGo: ButtonHandler): void {
  const button = panel(parent, x, y, w, h, 18, 0x39c85a, 0x39c85a);
  bindButton(button, x, y, w, h, onGo);
  addFittedText(parent, label, x + w / 2, y + h / 2, Math.min(46, Math.max(30, h * 0.54)), 0xffffff, w - 28, h - 18, 0.5, 0.5, '900');
}

function drawArcLine(g: Graphics, cx: number, cy: number, r: number, start: number, end: number): void {
  const steps = 18;
  for (let i = 0; i <= steps; i++) {
    const t = start + (end - start) * (i / steps);
    const px = cx + Math.cos(t) * r;
    const py = cy + Math.sin(t) * r;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
}

function drawAutoRunButton(parent: Container, x: number, y: number, w: number, h: number, onAutoRun: ButtonHandler): void {
  const button = panel(parent, x, y, w, h, 18, 0x555b70, 0x555b70);
  bindButton(button, x, y, w, h, onAutoRun);

  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = Math.min(w, h) * 0.2;
  const arrow = Math.max(8, r * 0.34);
  const icon = new Graphics();

  drawArcLine(icon, cx, cy, r, Math.PI * 1.16, Math.PI * 1.86);
  drawArcLine(icon, cx, cy, r, Math.PI * 0.16, Math.PI * 0.86);
  icon.stroke({ width: Math.max(4, r * 0.13), color: 0xffffff, alpha: 0.96 });

  icon.moveTo(cx - r - arrow * 0.55, cy + arrow * 0.12)
    .lineTo(cx - r + arrow * 0.9, cy - arrow * 0.9)
    .lineTo(cx - r + arrow * 0.9, cy + arrow * 0.88)
    .fill(0xffffff);
  icon.moveTo(cx + r + arrow * 0.55, cy - arrow * 0.12)
    .lineTo(cx + r - arrow * 0.9, cy + arrow * 0.9)
    .lineTo(cx + r - arrow * 0.9, cy - arrow * 0.88)
    .fill(0xffffff);
  icon.moveTo(cx - r * 0.16, cy - r * 0.38)
    .lineTo(cx - r * 0.16, cy + r * 0.38)
    .lineTo(cx + r * 0.48, cy)
    .fill(0xffffff);

  parent.addChild(icon);
}

function drawActions(parent: Container, state: GameState, cashout: string, x: number, y: number, w: number, h: number, gap: number, showCashout: boolean, onGo: ButtonHandler, onAutoRun: ButtonHandler, onCashOut: ButtonHandler): void {
  const goColor = state === 'burned' ? 0x3b9657 : 0x39c85a;
  const readyLabel = state === 'ready' ? 'Play' : 'GO';

  if (!showCashout) {
    if (state === 'ready') {
      const autoW = Math.min(h, Math.max(64, Math.min(132, w * 0.24)));
      const actionGap = Math.max(16, Math.min(gap, w * 0.08));
      const playW = Math.max(92, w - autoW - actionGap);
      drawAutoRunButton(parent, x, y, autoW, h, onAutoRun);
      drawGoButton(parent, readyLabel, x + autoW + actionGap, y, playW, h, onGo);
      return;
    }

    drawGoButton(parent, readyLabel, x, y, w, h, onGo);
    return;
  }

  const actionW = (w - gap) / 2;
  const cashButton = panel(parent, x, y, actionW, h, 18, 0xffc21b, 0xffc21b);
  if (state === 'running') bindButton(cashButton, x, y, actionW, h, onCashOut);
  const cashTitleFont = Math.min(34, Math.max(18, Math.min(actionW * 0.15, h * 0.3)));
  const cashValueFont = Math.min(32, Math.max(17, Math.min(actionW * 0.13, h * 0.26)));
  addFittedText(parent, 'CASH OUT', x + actionW / 2, y + h * 0.38, cashTitleFont, 0x111829, actionW - 24, h * 0.34, 0.5, 0.5, '900');
  addFittedText(parent, `${cashout} USD`, x + actionW / 2, y + h * 0.66, cashValueFont, 0x111829, actionW - 24, h * 0.3, 0.5, 0.5, '900');

  const goX = x + actionW + gap;
  const goButton = panel(parent, goX, y, actionW, h, 18, goColor, goColor);
  bindButton(goButton, goX, y, actionW, h, onGo);
  addFittedText(parent, 'GO', goX + actionW / 2, y + h / 2, Math.min(46, Math.max(30, h * 0.54)), 0xffffff, actionW - 24, h - 18, 0.5, 0.5, '900');
}

function drawDifficultyStrip(parent: Container, difficulty: Difficulty, enabled: boolean, x: number, y: number, w: number, onDifficulty: (difficulty: Difficulty) => void): void {
  addText(parent, 'Difficulty', x, y, 25, enabled ? 0xffffff : 0x9ca0ae, 0, 0.5, '700');
  panel(parent, x, y + 58, w, 56, 9, enabled ? 0x4d5268 : 0x414559, 0x383d54);

  const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'hardcore'];
  const segmentW = w / difficulties.length;
  for (let i = 0; i < difficulties.length; i++) {
    const item = difficulties[i];
    const isActive = item === difficulty;
    const segmentX = x + segmentW * i;
    if (enabled) {
      const hit = new Graphics();
      hit.rect(segmentX, y + 58, segmentW, 56).fill({ color: 0xffffff, alpha: 0.001 });
      bindButton(hit, segmentX, y + 58, segmentW, 56, () => onDifficulty(item));
      parent.addChild(hit);
    }
    if (isActive) panel(parent, segmentX + 7, y + 65, segmentW - 14, 42, 9, enabled ? 0x6b7085 : 0x55596d, enabled ? 0x6b7085 : 0x55596d);
    addText(parent, DIFFICULTY_LABELS[item], segmentX + segmentW / 2, y + 86, 22, enabled ? (isActive ? 0xffffff : 0xa8abb8) : 0x858998, 0.5, 0.5, '800');
  }
}

function drawCompactDifficulty(parent: Container, difficulty: Difficulty, enabled: boolean, x: number, y: number, w: number, h: number, onDifficulty: (difficulty: Difficulty) => void): void {
  const color = enabled ? 0x555b70 : 0x42465a;
  const textColor = enabled ? 0xffffff : 0x8d91a1;
  const button = panel(parent, x, y, w, h, 13, color, 0x3b4057);
  if (enabled) {
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'hardcore'];
    const currentIndex = difficulties.indexOf(difficulty);
    const nextDifficulty = difficulties[(currentIndex + 1) % difficulties.length];
    bindButton(button, x, y, w, h, () => onDifficulty(nextDifficulty));
  }

  addFittedText(parent, DIFFICULTY_LABELS[difficulty], x + 38, y + h / 2, Math.min(31, Math.max(22, h * 0.43)), textColor, w - 104, h - 14, 0, 0.5, '900');

  const arrow = new Graphics();
  const cx = x + w - 42;
  const cy = y + h / 2 + 1;
  const size = Math.max(10, Math.min(18, h * 0.22));
  arrow.moveTo(cx - size, cy - size * 0.45)
    .lineTo(cx, cy + size * 0.55)
    .lineTo(cx + size, cy - size * 0.45)
    .stroke({ width: Math.max(4, size * 0.28), color: textColor, alpha: enabled ? 1 : 0.65 });
  parent.addChild(arrow);
}

function drawCompactControls(root: Container, state: GameState, cashout: string, difficulty: Difficulty, stake: StakeAmount, x: number, y: number, w: number, h: number, onGo: ButtonHandler, onAutoRun: ButtonHandler, onCashOut: ButtonHandler, onDifficulty: (difficulty: Difficulty) => void, onStake: (stake: StakeAmount) => void): void {
  const density = clamp((h - COMPACT_CONTROLS_MIN_H) / (COMPACT_CONTROLS_H - COMPACT_CONTROLS_MIN_H), 0, 1);
  const padX = Math.max(18, Math.min(32, w * 0.04));
  const contentX = x + padX;
  const contentW = w - padX * 2;
  const topPad = lerp(10, 20, density);
  const bottomPad = lerp(10, 20, density);
  const selectorH = lerp(42, 54, density);
  const stakeGap = lerp(8, 18, density);
  const stakeH = lerp(42, 56, density);
  const difficultyGap = lerp(10, 20, density);
  const difficultyH = lerp(48, 62, density);
  const actionGap = lerp(12, 24, density);
  const selectorY = y + topPad;
  const stakeY = selectorY + selectorH + stakeGap;
  const difficultyY = stakeY + stakeH + difficultyGap;
  const actionY = difficultyY + difficultyH + actionGap;
  const actionH = Math.max(54, y + h - actionY - bottomPad);
  const stakeEnabled = state === 'ready';

  drawWagerSelector(root, contentX, selectorY, contentW, selectorH, stake, stakeEnabled, () => onStake(STAKE_VALUES[0]), () => onStake(STAKE_VALUES[STAKE_VALUES.length - 1]));
  drawStakeRow(root, contentX, stakeY, contentW, stakeH, stake, stakeEnabled, onStake);
  drawCompactDifficulty(root, difficulty, stakeEnabled, contentX, difficultyY, contentW, difficultyH, onDifficulty);
  drawActions(root, state, cashout, contentX, actionY, contentW, actionH, Math.max(14, Math.min(28, contentW * 0.04)), state !== 'ready', onGo, onAutoRun, onCashOut);
}

function compactControlsLayout(viewWidth: number, screenWidth: number, screenHeight: number) {
  const tightWidth = clamp((620 - viewWidth) / 160, 0, 1);
  const tightHeight = clamp((760 - screenHeight) / 160, 0, 1);
  const pressure = Math.max(tightWidth, tightHeight);
  const cardHeight = Math.round(lerp(COMPACT_CONTROLS_H, COMPACT_CONTROLS_MIN_H, pressure));
  const gap = Math.round(lerp(COMPACT_CONTROLS_GAP, 12, pressure));
  const cardY = DESIGN_HEIGHT - cardHeight - gap;
  const bottomY = Math.min(BOTTOM_Y, cardY - gap);
  const margin = Math.max(18, Math.min(64, viewWidth * lerp(0.085, 0.055, pressure)));

  return {
    bottomY,
    cardX: margin,
    cardY,
    cardWidth: Math.max(0, viewWidth - margin * 2),
    cardHeight,
  };
}

function drawWideControls(root: Container, state: GameState, cashout: string, difficulty: Difficulty, stake: StakeAmount, x: number, y: number, w: number, onGo: ButtonHandler, onAutoRun: ButtonHandler, onCashOut: ButtonHandler, onDifficulty: (difficulty: Difficulty) => void, onStake: (stake: StakeAmount) => void): void {
  const contentX = x + 28;
  const contentY = y + 22;
  const contentW = w - 56;
  const actionsW = Math.max(470, Math.min(560, contentW * 0.32));
  const actionsGap = 32;
  const actionsX = contentX + contentW - actionsW;
  const betW = 348;
  const midX = contentX + betW + 40;
  const midW = actionsX - midX - 34;
  const stakeEnabled = state === 'ready';
  const difficultyEnabled = state === 'ready';

  drawWagerSelector(root, contentX, contentY, betW, 68, stake, stakeEnabled, () => onStake(STAKE_VALUES[0]), () => onStake(STAKE_VALUES[STAKE_VALUES.length - 1]));
  drawStakeRow(root, contentX, contentY + 100, betW, 54, stake, stakeEnabled, onStake);

  if (midW >= 480) {
    drawDifficultyStrip(root, difficulty, difficultyEnabled, midX, contentY + 10, midW, onDifficulty);
    addText(root, 'Chance of collision', Math.min(actionsX - 34, midX + midW * 0.74), contentY + 24, 25, difficultyEnabled ? 0xc3c6d1 : 0x858998, 0.5, 0.5, '500');
  }

  drawActions(root, state, cashout, actionsX, contentY + 8, actionsW, 142, actionsGap, state !== 'ready', onGo, onAutoRun, onCashOut);
}

function drawControls(root: Container, state: GameState, cashout: string, difficulty: Difficulty, stake: StakeAmount, viewWidth: number, screenWidth: number, screenHeight: number, onGo: ButtonHandler, onAutoRun: ButtonHandler, onCashOut: ButtonHandler, onDifficulty: (difficulty: Difficulty) => void, onStake: (stake: StakeAmount) => void): void {
  const isCompact = screenWidth < COMPACT_CONTROLS_BREAKPOINT;
  const compactLayout = isCompact ? compactControlsLayout(viewWidth, screenWidth, screenHeight) : undefined;
  const bottomY = compactLayout?.bottomY ?? BOTTOM_Y;
  const bottom = new Graphics();
  bottom.rect(0, bottomY, viewWidth, DESIGN_HEIGHT - bottomY).fill(0x121522);
  root.addChild(bottom);

  const margin = Math.max(24, Math.min(58, viewWidth * 0.028));
  const cardX = compactLayout?.cardX ?? margin;
  const cardWidth = compactLayout?.cardWidth ?? Math.max(0, viewWidth - margin * 2);
  const cardY = compactLayout?.cardY ?? 814;
  const cardHeight = compactLayout?.cardHeight ?? 198;

  panel(root, cardX, cardY, cardWidth, cardHeight, 26, 0x43485d, 0x61735f, 0.96);

  if (isCompact) {
    drawCompactControls(root, state, cashout, difficulty, stake, cardX, cardY, cardWidth, cardHeight, onGo, onAutoRun, onCashOut, onDifficulty, onStake);
    return;
  }

  drawWideControls(root, state, cashout, difficulty, stake, cardX, cardY, cardWidth, onGo, onAutoRun, onCashOut, onDifficulty, onStake);
}

function drawRoundMessage(root: Container, viewWidth: number, message: RoundMessage): void {
  const x = viewWidth / 2;
  panel(root, x - 250, 170, 500, 140, 22, 0xffc21b, 0x9f7412, 0.98);
  addText(root, message.title, x, 224, 48, 0x111829, 0.5, 0.5, '900');
  addText(root, `${formatUsd(message.total)} USD`, x, 272, 34, 0x111829, 0.5, 0.5, '900');
}

async function boot() {
  const app = new Application();
  await app.init({
    resizeTo: window,
    background: '#111421',
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, MAX_RENDER_RESOLUTION),
    autoDensity: true,
  });
  document.body.appendChild(app.canvas);

  const worldLayer = new Container();
  const uiLayer = new Container();
  app.stage.addChild(worldLayer, uiLayer);

  const audio = createAudioController();
  let gameState: GameState = 'ready';
  let activeIndex = -1;
  let bankedWinnings = loadBankedWinnings();
  let stakeAmount: StakeAmount = DEFAULT_STAKE_AMOUNT;
  let cashout = formatUsd(stakeAmount);
  let balance = formatBalance(Math.max(0, GLOBAL_POOL_AMOUNT - bankedWinnings));
  let difficulty: Difficulty = 'easy';
  let chickenX = START_CHICKEN_X;
  let chickenY = START_CHICKEN_Y;
  let moveStartX = chickenX;
  let moveStartY = chickenY;
  let targetX = chickenX;
  let targetY = chickenY;
  let moveProgress = 1;
  let burnedAt = 0;
  let autoRun = false;
  let autoAdvanceAt = 0;
  let roundMessageAt = 0;
  let roundMessage: RoundMessage | undefined;
  let landingResolved = true;
  let movementSprite: ChickenMoveState = 'go';
  let burnFlame: FireView | undefined;
  let fallbackFlame: Container | undefined;
  let miniFires: FireView[] = [];
  let miniFireSlots = createMiniFireSlots();
  let liveWinIndex = 0;
  let liveWin = LIVE_WIN_MOCKS[liveWinIndex];
  let liveOnlineCount = 3171;
  const initialNow = performance.now();
  let liveWinVisible = true;
  let liveWinVisibleUntil = initialNow + LIVE_WIN_VISIBLE_MS;
  let nextLiveWinAt = initialNow + LIVE_WIN_INTERVAL_MS;
  let pads: PadView[] = [];
  let layoutInfo: LayoutInfo = { scale: 1, viewWidth: DESIGN_WIDTH, worldViewWidth: DESIGN_WIDTH, worldScale: 1, screenWidth: DESIGN_WIDTH, screenHeight: DESIGN_HEIGHT, groundLiftY: 0 };
  let cameraX = 0;
  let targetCameraX = 0;
  const [chickenFrames, objectSprites, decorSprites, fireSprites] = await Promise.all([
    loadChickenFrames(),
    loadObjectSprites(),
    loadDecorSprites(),
    loadFireSprites(),
  ]);
  const chicken = makeChicken(chickenFrames);

  function clampCamera(value: number) {
    return Math.max(0, Math.min(value, Math.max(0, LEVEL_WIDTH - layoutInfo.worldViewWidth)));
  }

  function updateCameraTarget() {
    if (gameState === 'ready') {
      targetCameraX = 0;
      return;
    }

    targetCameraX = clampCamera(chickenX - layoutInfo.worldViewWidth * 0.36);
  }

  function applyCamera() {
    worldLayer.x = -cameraX * layoutInfo.scale * layoutInfo.worldScale;
  }

  function currentChickenState(): ChickenAnimationState {
    if (gameState === 'burned') return 'dead';
    if (moveProgress < 1) return movementSprite;
    return 'idle';
  }

  function displayGroundY(y: number): number {
    return y - layoutInfo.groundLiftY;
  }

  function updateBalanceFromBank() {
    const currentChickenWin = gameState === 'running' ? roundCashoutValue() : bankedWinnings;
    balance = formatBalance(Math.max(0, GLOBAL_POOL_AMOUNT - currentChickenWin));
  }

  function currentRoundBase(): number {
    return bankedWinnings > 0 ? bankedWinnings : stakeAmount;
  }

  function roundPayout(): number {
    return activeIndex >= 0 ? payoutForIndex(activeIndex, currentRoundBase(), difficulty) : currentRoundBase();
  }

  function roundCashoutValue(): number {
    return roundPayout();
  }

  function updateCashout() {
    cashout = formatUsd(roundCashoutValue());
    updateBalanceFromBank();
  }

  function rotateLiveWin(now = performance.now()) {
    liveWinIndex = (liveWinIndex + 1) % LIVE_WIN_MOCKS.length;
    liveWin = LIVE_WIN_MOCKS[liveWinIndex];
    liveOnlineCount = 2960 + Math.floor(Math.random() * 360);
    liveWinVisible = true;
    liveWinVisibleUntil = now + LIVE_WIN_VISIBLE_MS;
    nextLiveWinAt = now + LIVE_WIN_INTERVAL_MS + Math.random() * 1200;
  }

  function viewportSize() {
    const viewport = window.visualViewport;
    return {
      width: Math.max(1, Math.round(viewport?.width ?? window.innerWidth)),
      height: Math.max(1, Math.round(viewport?.height ?? window.innerHeight)),
    };
  }

  function resizeRendererToViewport() {
    const { width, height } = viewportSize();
    app.canvas.style.width = `${width}px`;
    app.canvas.style.height = `${height}px`;
    if (app.screen.width !== width || app.screen.height !== height) {
      app.renderer.resize(width, height);
    }
  }

  function layout() {
    const scale = app.screen.height / DESIGN_HEIGHT;
    const isCompact = app.screen.width < COMPACT_CONTROLS_BREAKPOINT;
    const worldScale = isCompact ? COMPACT_WORLD_SCALE : 1;
    layoutInfo = {
      scale,
      viewWidth: app.screen.width / scale,
      worldViewWidth: app.screen.width / (scale * worldScale),
      worldScale,
      screenWidth: app.screen.width,
      screenHeight: app.screen.height,
      groundLiftY: isCompact ? COMPACT_GROUND_LIFT_Y : 0,
    };
    worldLayer.scale.set(scale * worldScale);
    worldLayer.y = TOP_H * scale * (1 - worldScale);
    uiLayer.scale.set(scale);
    uiLayer.position.set(0, 0);
    cameraX = clampCamera(cameraX);
    targetCameraX = clampCamera(targetCameraX);
    applyCamera();
    app.stage.hitArea = app.screen;
  }

  function render() {
    worldLayer.removeChildren();
    uiLayer.removeChildren();
    pads = [];
    miniFires = [];
    burnFlame = undefined;
    fallbackFlame = undefined;
    updateBalanceFromBank();

    drawTopBar(uiLayer, layoutInfo.viewWidth, balance);
    drawLivePanel(worldLayer);
    if (liveWinVisible) drawLiveWinsOverlay(uiLayer, liveWin, liveOnlineCount);
    drawStage(worldLayer);

    for (let i = 0; i < GAME_SETTINGS.padCount; i++) {
      const padWorldX = FIRST_PAD_X + i * PAD_STEP;
      let state: PadState = 'idle';
      if (i === PRIZE_INDEX && gameState !== 'burned') state = 'prize';
      else if (gameState === 'burned' && i === activeIndex) state = 'burned';
      else if (i < activeIndex) state = 'passed';
      else if (i === activeIndex) state = 'active';
      if (gameState === 'burned' && i === 0) state = 'dead';

      const pad = makePad(multiplierLabelForIndex(i, difficulty), padWorldX, state, objectSprites, decorSprites);
      pad.root.y -= layoutInfo.groundLiftY;
      pads.push(pad);
      worldLayer.addChild(pad.root);
    }

    for (let i = 0; i < PRIZE_INDEX; i++) {
      const padWorldX = FIRST_PAD_X + i * PAD_STEP;
      const padPressed = gameState !== 'ready' && (i < activeIndex || (i === activeIndex && moveProgress >= 1));
      drawVent(worldLayer, padWorldX, FLOOR_Y - 27, decorSprites, padPressed, layoutInfo.groundLiftY);
      const miniFireSlot = miniFireSlots[i];
      if (fireSprites && miniFireSlot && i > activeIndex) {
        miniFires.push(drawMiniFire(
          worldLayer,
          fireSprites.mini,
          padWorldX,
          displayGroundY(FLOOR_Y - 24),
          miniFireSlot,
        ));
      }
    }
    drawFloor(worldLayer, layoutInfo.groundLiftY);

    chicken.position.set(chickenX, displayGroundY(chickenY));
    chicken.scale.set(0.95);
    updateChickenFrame(chicken, currentChickenState(), performance.now() / 1000);
    worldLayer.addChild(chicken);

    if (gameState === 'burned') {
      const x = FIRST_PAD_X + activeIndex * PAD_STEP;
      if (fireSprites) {
        burnFlame = drawFireAnimation(worldLayer, fireSprites.burn, x, displayGroundY(FLOOR_Y - 34), 430, 7, 0, 0.035, false, burnedAt / 1000);
      } else {
        fallbackFlame = drawFallbackFlame(worldLayer, x, displayGroundY(FLOOR_Y - 121), 1.65);
      }
    }

    drawControls(uiLayer, roundMessage ? 'won' : gameState, cashout, difficulty, stakeAmount, layoutInfo.viewWidth, layoutInfo.screenWidth, layoutInfo.screenHeight, advance, startAutoRun, cashOut, setDifficulty, setStake);
    if (roundMessage) drawRoundMessage(uiLayer, layoutInfo.viewWidth, roundMessage);
    updateCameraTarget();
    applyCamera();
  }

  function resetAtStart() {
    gameState = 'ready';
    activeIndex = -1;
    roundMessage = undefined;
    roundMessageAt = 0;
    updateBalanceFromBank();
    updateCashout();
    chickenX = START_CHICKEN_X;
    chickenY = START_CHICKEN_Y;
    targetX = chickenX;
    targetY = chickenY;
    moveStartX = chickenX;
    moveStartY = chickenY;
    moveProgress = 1;
    burnedAt = 0;
    autoRun = false;
    autoAdvanceAt = 0;
    miniFireSlots = createMiniFireSlots();
    landingResolved = true;
    movementSprite = 'go';
    chicken.rotation = 0;
    targetCameraX = 0;
    render();
  }

  function roastChance(index: number) {
    const config = DIFFICULTY_CHANCES[difficulty];
    return Math.min(config.base + Math.max(0, index - 1) * config.step, config.max);
  }

  function settleRound(title: string, nextBankValue: number) {
    autoRun = false;
    autoAdvanceAt = 0;
    bankedWinnings = nextBankValue;
    saveBankedWinnings(bankedWinnings);
    updateBalanceFromBank();
    cashout = formatUsd(bankedWinnings);
    roundMessage = {
      title,
      total: bankedWinnings,
    };
    roundMessageAt = performance.now();
    gameState = 'won';
    audio.play('win');
    render();
  }

  function resolveLanding() {
    if (landingResolved || gameState !== 'running') return;
    landingResolved = true;

    if (activeIndex >= PRIZE_INDEX) {
      settleRound('WIN!', roundCashoutValue());
      return;
    }

    if (activeIndex > 0 && Math.random() < roastChance(activeIndex)) {
      gameState = 'burned';
      burnedAt = performance.now();
      autoRun = false;
      autoAdvanceAt = 0;
      audio.play('lose');
      render();
      return;
    }

    render();
    if (autoRun) autoAdvanceAt = performance.now() + AUTO_ADVANCE_DELAY_MS;
  }

  function startRun(isAutoRun = false) {
    if (roundMessage) return;
    gameState = 'running';
    autoRun = isAutoRun;
    autoAdvanceAt = 0;
    activeIndex = 0;
    moveStartX = chickenX;
    moveStartY = chickenY;
    chickenY = RUN_CHICKEN_Y;
    targetX = FIRST_PAD_X;
    targetY = RUN_CHICKEN_Y;
    moveProgress = 0;
    burnedAt = 0;
    roundMessageAt = 0;
    landingResolved = false;
    movementSprite = 'go';
    audio.play('step');
    updateCashout();
    updateCameraTarget();
    render();
  }

  function startAutoRun() {
    if (gameState !== 'ready') return;
    startRun(true);
  }

  function cashOut() {
    if (gameState !== 'running' || moveProgress < 1 || activeIndex < 0 || roundMessage) return;
    autoRun = false;
    autoAdvanceAt = 0;
    settleRound('WIN!', roundCashoutValue());
  }

  function advance() {
    if (roundMessage) return;
    if (gameState === 'ready') {
      startRun();
      return;
    }

    if (gameState === 'burned' || gameState === 'won' || moveProgress < 1) return;
    if (activeIndex >= PRIZE_INDEX) return;

    autoAdvanceAt = 0;
    audio.play('step');
    activeIndex += 1;
    updateCashout();
    moveStartX = chickenX;
    moveStartY = chickenY;
    targetX = FIRST_PAD_X + activeIndex * PAD_STEP;
    targetY = activeIndex >= PRIZE_INDEX ? PRIZE_CHICKEN_Y : RUN_CHICKEN_Y;
    movementSprite = activeIndex >= PRIZE_INDEX ? 'jump' : 'go';
    moveProgress = 0;
    landingResolved = false;
    render();
  }

  function setDifficulty(nextDifficulty: Difficulty) {
    if (difficulty === nextDifficulty || gameState !== 'ready') return;
    difficulty = nextDifficulty;
    audio.play('click');
    updateCashout();
    render();
  }

  function setStake(nextStake: StakeAmount) {
    if (stakeAmount === nextStake || gameState !== 'ready') return;
    stakeAmount = nextStake;
    bankedWinnings = 0;
    saveBankedWinnings(bankedWinnings);
    updateCashout();
    render();
  }

  app.stage.hitArea = app.screen;

  window.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowRight' && event.code !== 'ArrowRight') return;
    if (event.repeat) return;
    event.preventDefault();
    advance();
  });

  app.ticker.add((ticker) => {
    const now = performance.now();
    const t = now / 1000;

    if (now >= nextLiveWinAt) {
      rotateLiveWin(now);
      render();
    } else if (liveWinVisible && now >= liveWinVisibleUntil) {
      liveWinVisible = false;
      render();
    }

    if (autoRun && autoAdvanceAt > 0 && now >= autoAdvanceAt) {
      autoAdvanceAt = 0;
      advance();
    }

    if (moveProgress < 1) {
      moveProgress = Math.min(1, moveProgress + ticker.deltaTime * MOVE_SPEED);
      const eased = 1 - Math.pow(1 - moveProgress, 3);
      chickenX = moveStartX + (targetX - moveStartX) * eased;
      const baseY = moveStartY + (targetY - moveStartY) * eased;
      if (movementSprite === 'jump') {
        chickenY = baseY - Math.sin(moveProgress * Math.PI) * 88;
        chicken.rotation = Math.sin(moveProgress * Math.PI) * -0.07;
      } else {
        chickenY = baseY + Math.sin(t * 9) * 2;
        chicken.rotation = Math.sin(t * 8) * 0.015;
      }
      chicken.position.set(chickenX, displayGroundY(chickenY));
      updateChickenFrame(chicken, movementSprite, t);
      if (moveProgress === 1) {
        chickenY = targetY;
        chicken.position.set(chickenX, displayGroundY(chickenY));
        chicken.rotation = 0;
        resolveLanding();
      }
    } else if (gameState === 'burned') {
      chicken.y = displayGroundY(chickenY);
      updateChickenFrame(chicken, 'dead', t);
    } else {
      chicken.y = displayGroundY(chickenY);
      updateChickenFrame(chicken, 'idle', t);
    }

    updateCameraTarget();
    cameraX += (targetCameraX - cameraX) * Math.min(1, ticker.deltaTime * 0.12);
    applyCamera();

    for (const pad of pads) {
      if (pad.state === 'active' || pad.state === 'burned') pad.root.scale.set(1 + Math.sin(t * 4) * 0.015);
      else pad.root.scale.set(1);
    }

    for (const miniFire of miniFires) {
      updateFireAnimation(miniFire, t);
    }

    if (burnFlame) {
      updateFireAnimation(burnFlame, t);
    }

    if (fallbackFlame) {
      fallbackFlame.y = displayGroundY(FLOOR_Y - 121) + Math.sin(t * 7) * 7;
      fallbackFlame.scale.set(1.65 + Math.sin(t * 8) * 0.06);
    }

    if (gameState === 'burned' && burnedAt > 0 && performance.now() - burnedAt >= REVIVE_DELAY_MS) {
      resetAtStart();
    }

    if (roundMessageAt > 0 && performance.now() - roundMessageAt >= ROUND_MESSAGE_DELAY_MS) {
      resetAtStart();
    }
  });

  let resizeFrame = 0;
  function relayout() {
    resizeRendererToViewport();
    layout();
    render();
  }

  function scheduleResize() {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      relayout();
    });
  }

  const resizeObserver = new ResizeObserver(scheduleResize);
  resizeObserver.observe(document.documentElement);
  resizeObserver.observe(document.body);

  window.addEventListener('resize', scheduleResize);
  window.addEventListener('orientationchange', scheduleResize);
  window.visualViewport?.addEventListener('resize', scheduleResize);
  updateCashout();
  relayout();
}

boot();
