import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';

type PadState = 'idle' | 'active' | 'passed' | 'burned' | 'dead';
type GameState = 'ready' | 'running' | 'burned';
type FontWeight = 'normal' | 'bold' | '400' | '500' | '600' | '700' | '800' | '900';

const DESIGN_WIDTH = 2048;
const DESIGN_HEIGHT = 1024;
const TOP_H = 48;
const SIDE_W = 282;
const STAGE_H = 724;
const FLOOR_Y = TOP_H + STAGE_H - 52;
const BOTTOM_Y = TOP_H + STAGE_H;
const MULTIPLIERS = ['1.03x', '1.07x', '1.12x', '1.17x', '1.23x', '1.29x', '1.36x', '1.44x', '1.53x', '1.63x', '1.75x'];
const PAD_STEP = 282;
const FIRST_PAD_X = SIDE_W + 142;
const PAD_Y = TOP_H + 317;
const CHICKEN_GROUND_Y = FLOOR_Y - 5;
const START_CHICKEN_X = 144;
const START_CHICKEN_Y = CHICKEN_GROUND_Y - 12;
const RUN_CHICKEN_Y = CHICKEN_GROUND_Y - 18;
const REVIVE_DELAY_MS = 1200;

type PadView = {
  root: Container;
  state: PadState;
};

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

function drawTopBar(root: Container): void {
  const bar = new Graphics();
  bar.rect(0, 0, DESIGN_WIDTH, TOP_H).fill(0x3a3e50);
  root.addChild(bar);

  addText(root, 'CHICKEN R', 28, 24, 40, 0xffffff, 0, 0.5, '900');
  const coin = new Graphics();
  coin.circle(270, 23, 17).fill(0xffd549).stroke({ width: 4, color: 0xf0b31d });
  coin.ellipse(264, 15, 8, 12).fill({ color: 0xffff9a, alpha: 0.75 });
  root.addChild(coin);
  addText(root, 'AD', 286, 24, 40, 0xffffff, 0, 0.5, '900');

  panel(root, 1562, 5, 160, 35, 6, 0x555a70, 0x555a70, 0.88);
  const info = new Graphics();
  info.circle(1586, 22, 7).stroke({ width: 2, color: 0xffffff });
  info.circle(1586, 18, 1.8).fill(0xffffff);
  info.rect(1585.2, 21, 1.6, 7).fill(0xffffff);
  root.addChild(info);
  addText(root, 'How to play?', 1604, 22, 16, 0xffffff, 0, 0.5, '800');

  panel(root, 1740, 5, 192, 35, 6, 0x555a70, 0x555a70, 0.88);
  addText(root, '1 000 000', 1818, 22, 18, 0xffffff, 0.5, 0.5, '900');
  const smallCoin = new Graphics();
  smallCoin.circle(1883, 22, 10).fill(0xf7f8ff);
  root.addChild(smallCoin);
  addText(root, '$', 1883, 22, 14, 0x535a6d, 0.5, 0.5, '900');

  panel(root, 1950, 5, 34, 35, 6, 0x555a70, 0x555a70, 0.88);
  const expand = new Graphics();
  expand.moveTo(1959, 18).lineTo(1959, 13).lineTo(1964, 13).moveTo(1975, 13).lineTo(1980, 13).lineTo(1980, 18);
  expand.moveTo(1959, 27).lineTo(1959, 32).lineTo(1964, 32).moveTo(1975, 32).lineTo(1980, 32).lineTo(1980, 27);
  expand.stroke({ width: 2, color: 0xffffff });
  root.addChild(expand);

  const menu = new Graphics();
  for (let i = 0; i < 3; i++) menu.roundRect(2019, 15 + i * 7, 18, 2.5, 1.2).fill(0xffffff);
  root.addChild(menu);
}

function drawLivePanel(root: Container): void {
  const side = new Graphics();
  side.rect(0, TOP_H, SIDE_W, STAGE_H).fill(0x2f354f);
  root.addChild(side);

  addText(root, 'Live wins:', 12, 64, 13, 0xbfc6e4, 0, 0.5, '800');
  const dot = new Graphics();
  dot.circle(97, 64, 3.5).fill(0x35e34c);
  root.addChild(dot);
  addText(root, 'Online:', 114, 64, 13, 0xbfc6e4, 0, 0.5, '800');
  addText(root, '3171', 169, 64, 13, 0xbfc6e4, 0, 0.5, '800');

  const row = new Graphics();
  row.roundRect(10, 84, 210, 30, 6).fill({ color: 0x3c466c, alpha: 0.58 });
  row.circle(22, 99, 9).fill(0xff6f5d);
  row.circle(22, 105, 4).fill(0x3457d1);
  root.addChild(row);
  addText(root, 'Moccasin He...', 39, 99, 13, 0xffffff, 0, 0.5, '800');
  addText(root, '+$1108.08', 145, 99, 13, 0x35ff72, 0, 0.5, '900');

  const door = new Graphics();
  door.roundRect(57, 288, 166, 488, 86).fill(0x121522).stroke({ width: 14, color: 0x222947 });
  door.roundRect(68, 298, 144, 466, 76).stroke({ width: 7, color: 0x343c65 });
  root.addChild(door);
}

function drawStage(root: Container): void {
  const stage = new Graphics();
  stage.rect(SIDE_W, TOP_H, DESIGN_WIDTH - SIDE_W, STAGE_H).fill(0x444c6d);
  root.addChild(stage);

  const blocks = new Graphics();
  const blockData = [
    [145, 157], [322, 104], [603, 154], [711, 202], [994, 104], [1168, 523], [1455, 202],
    [1559, 103], [1735, 523], [1842, 154], [2027, 523], [37, 314], [321, 523], [887, 521],
  ];
  for (const [x, y] of blockData) {
    blocks.roundRect(x, TOP_H + y, 90, 55, 14).fill({ color: 0x303752, alpha: 0.68 });
  }
  root.addChild(blocks);

  const lines = new Graphics();
  for (let x = SIDE_W + PAD_STEP; x < DESIGN_WIDTH; x += PAD_STEP) {
    for (let y = TOP_H + 18; y < FLOOR_Y - 16; y += 64) {
      lines.roundRect(x - 4, y, 8, 32, 2).fill(0xa6afd5);
    }
  }
  root.addChild(lines);

  const floor = new Graphics();
  floor.rect(0, FLOOR_Y, DESIGN_WIDTH, 50).fill(0x34394d);
  floor.rect(0, FLOOR_Y, DESIGN_WIDTH, 7).fill(0x1e2439);
  for (let x = 0; x < DESIGN_WIDTH; x += 282) {
    floor.rect(x, FLOOR_Y + 8, 282, 42).fill((x / 282) % 2 ? 0x3a3e52 : 0x303548);
    floor.rect(x + 281, FLOOR_Y + 8, 1, 42).fill(0x242a3d);
  }
  floor.rect(0, FLOOR_Y + 50, DESIGN_WIDTH, 9).fill(0x111523);
  root.addChild(floor);
}

function drawVent(parent: Container, x: number, y: number): void {
  const vent = new Graphics();
  vent.roundRect(x - 84, y - 84, 168, 118, 84).fill(0x222945).stroke({ width: 7, color: 0x30385c });
  vent.roundRect(x - 78, y - 76, 156, 110, 78).stroke({ width: 7, color: 0x1b2138 });
  for (let i = -3; i <= 3; i++) {
    const barH = 48 + (4 - Math.abs(i)) * 9;
    vent.roundRect(x + i * 18 - 7, y + 20 - barH, 14, barH, 7).fill(0x151a2f);
  }
  vent.roundRect(x - 96, y + 32, 192, 17, 7).fill(0x697397);
  parent.addChild(vent);
}

function drawPad(parent: Container, label: string, state: PadState): void {
  parent.removeChildren();
  const color = state === 'active' || state === 'passed' ? 0x25b94a : state === 'dead' ? 0xf3c62d : state === 'burned' ? 0xd12f68 : 0x596596;
  const ring = state === 'active' || state === 'passed' ? 0x38ef55 : state === 'dead' ? 0xffdf44 : state === 'burned' ? 0xff386f : 0x7480c4;

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

  addText(parent, label, 0, 6, 47, 0xe9edff, 0.5, 0.5, '900', 0x2a3259, 5);
}

function makePad(label: string, x: number, state: PadState): PadView {
  const root = new Container();
  root.position.set(x, PAD_Y);
  drawPad(root, label, state);
  return { root, state };
}

function makeChicken(): Container {
  const c = new Container();
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

function drawFlame(parent: Container, x: number, y: number, scale: number): Container {
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

function drawControls(root: Container, state: GameState, balance: string, cashout: string): void {
  const bottom = new Graphics();
  bottom.rect(0, BOTTOM_Y, DESIGN_WIDTH, DESIGN_HEIGHT - BOTTOM_Y).fill(0x121522);
  root.addChild(bottom);

  panel(root, 42, 838, 1964, 215, 25, 0x43485d, 0x61735f, 0.96);
  panel(root, 71, 865, 398, 76, 7, 0x4d5269, 0x3b4057);
  panel(root, 86, 881, 68, 47, 5, 0x62687e, 0x62687e);
  addText(root, 'MIN', 120, 905, 23, 0xffffff, 0.5, 0.5, '900');
  addText(root, '3', 267, 905, 24, 0xffffff, 0.5, 0.5, '900');
  panel(root, 377, 881, 79, 47, 5, 0x62687e, 0x62687e);
  addText(root, 'MAX', 416, 905, 23, 0xffffff, 0.5, 0.5, '900');

  const stakes = ['2 $', '3 $', '8 $', '20 $'];
  for (let i = 0; i < stakes.length; i++) {
    panel(root, 71 + i * 101, 962, 82, 64, 8, 0x52576e, 0x3b4057);
    addText(root, stakes[i], 112 + i * 101, 994, 24, 0xffffff, 0.5, 0.5, '900');
  }

  addText(root, 'Difficulty', 503, 883, 26, 0xffffff, 0, 0.5, '700');
  panel(root, 504, 960, 918, 61, 9, 0x4d5268, 0x383d54);
  const labels = ['Easy', 'Medium', 'Hard', 'Hardcore'];
  for (let i = 0; i < labels.length; i++) {
    if (i === 0) panel(root, 511, 967, 215, 48, 9, 0x6b7085, 0x6b7085);
    addText(root, labels[i], 618 + i * 225, 991, 24, i === 0 ? 0xffffff : 0xa8abb8, 0.5, 0.5, '800');
  }

  addText(root, 'Chance of collision', 1188, 882, 27, 0xc3c6d1, 0, 0.5, '500');

  if (state === 'ready') {
    panel(root, 1452, 865, 157, 157, 13, 0x53586f, 0x3d4257);
    const arrows = new Graphics();
    arrows.arc(1530, 945, 30, -0.7, 2.4).stroke({ width: 6, color: 0xffffff });
    arrows.arc(1530, 945, 30, 2.45, 5.5).stroke({ width: 6, color: 0xffffff });
    arrows.moveTo(1503, 934).lineTo(1495, 955).lineTo(1516, 951).fill(0xffffff);
    arrows.moveTo(1557, 956).lineTo(1566, 934).lineTo(1544, 938).fill(0xffffff);
    root.addChild(arrows);
    panel(root, 1642, 865, 335, 157, 15, 0x39c85a, 0x39c85a);
    addText(root, 'Play', 1810, 943, 49, 0xffffff, 0.5, 0.5, '900');
  } else {
    panel(root, 1452, 867, 247, 158, 14, 0xffc21b, 0xffc21b);
    addText(root, 'CASH OUT', 1576, 930, 35, 0x111829, 0.5, 0.5, '900');
    addText(root, `${cashout} USD`, 1576, 968, 34, 0x111829, 0.5, 0.5, '900');
    panel(root, 1731, 867, 247, 158, 14, state === 'burned' ? 0x3b9657 : 0x39c85a, 0x39c85a);
    addText(root, 'GO', 1855, 946, 43, 0xffffff, 0.5, 0.5, '900');
  }

  addText(root, balance, 1818, 22, 18, 0xffffff, 0.5, 0.5, '900');
}

async function boot() {
  const app = new Application();
  await app.init({
    resizeTo: window,
    background: '#111421',
    antialias: true,
    resolution: Math.min(window.devicePixelRatio, 2),
    autoDensity: true,
  });
  document.body.appendChild(app.canvas);

  const root = new Container();
  app.stage.addChild(root);

  let gameState: GameState = 'ready';
  let activeIndex = -1;
  let balance = '1 000 000';
  let cashout = '0';
  let chickenX = START_CHICKEN_X;
  let chickenY = START_CHICKEN_Y;
  let targetX = chickenX;
  let moveProgress = 1;
  let burnedAt = 0;
  let flame: Container | undefined;
  let pads: PadView[] = [];
  const chicken = makeChicken();

  function layout() {
    root.scale.set(app.renderer.width / DESIGN_WIDTH, app.renderer.height / DESIGN_HEIGHT);
    root.position.set(0, 0);
  }

  function render() {
    root.removeChildren();
    pads = [];
    flame = undefined;

    drawTopBar(root);
    drawLivePanel(root);
    drawStage(root);

    for (let i = 0; i < MULTIPLIERS.length; i++) {
      let state: PadState = 'idle';
      if (gameState === 'burned' && i === activeIndex) state = 'burned';
      else if (i < activeIndex) state = 'passed';
      else if (i === activeIndex) state = 'active';
      if (gameState === 'burned' && i === 0) state = 'dead';

      const pad = makePad(MULTIPLIERS[i], FIRST_PAD_X + i * PAD_STEP, state);
      pads.push(pad);
      root.addChild(pad.root);
    }

    for (let i = 0; i < MULTIPLIERS.length; i++) drawVent(root, FIRST_PAD_X + i * PAD_STEP, FLOOR_Y - 27);

    chicken.position.set(chickenX, chickenY);
    chicken.scale.set(0.95);
    root.addChild(chicken);

    if (gameState === 'burned') {
      const x = FIRST_PAD_X + activeIndex * PAD_STEP;
      flame = drawFlame(root, x, FLOOR_Y - 85, 1.65);
    }

    drawControls(root, gameState, balance, cashout);
  }

  function reviveAtStart() {
    gameState = 'ready';
    activeIndex = -1;
    cashout = '0';
    chickenX = START_CHICKEN_X;
    chickenY = START_CHICKEN_Y;
    targetX = chickenX;
    moveProgress = 1;
    burnedAt = 0;
    chicken.rotation = 0;
    render();
  }

  function startRun() {
    gameState = 'running';
    activeIndex = 0;
    balance = '999 997';
    cashout = '3.09';
    chickenX = FIRST_PAD_X;
    chickenY = RUN_CHICKEN_Y;
    targetX = chickenX;
    moveProgress = 1;
    burnedAt = 0;
    render();
  }

  function advance() {
    if (gameState === 'ready') {
      startRun();
      return;
    }

    if (gameState === 'burned') return;

    activeIndex += 1;
    cashout = activeIndex > 1 ? '3.51' : '3.09';
    targetX = FIRST_PAD_X + activeIndex * PAD_STEP;
    moveProgress = 0;
    if (activeIndex >= 2) {
      gameState = 'burned';
      burnedAt = performance.now();
    }
    render();
  }

  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;
  app.stage.on('pointertap', advance);

  app.ticker.add((ticker) => {
    const t = performance.now() / 1000;

    if (moveProgress < 1) {
      moveProgress = Math.min(1, moveProgress + ticker.deltaTime * 0.055);
      const start = chickenX;
      const eased = 1 - Math.pow(1 - moveProgress, 3);
      chickenX = start + (targetX - start) * eased;
      chickenY = RUN_CHICKEN_Y - Math.sin(moveProgress * Math.PI) * 72;
      chicken.rotation = Math.sin(moveProgress * Math.PI) * -0.08;
      chicken.position.set(chickenX, chickenY);
      if (moveProgress === 1) chicken.rotation = 0;
    } else if (gameState !== 'burned') {
      chicken.y = chickenY + Math.sin(t * 4) * 3;
    }

    for (const pad of pads) {
      if (pad.state === 'active' || pad.state === 'burned') pad.root.scale.set(1 + Math.sin(t * 4) * 0.015);
      else pad.root.scale.set(1);
    }

    if (flame) {
      flame.y = FLOOR_Y - 85 + Math.sin(t * 7) * 7;
      flame.scale.set(1.65 + Math.sin(t * 8) * 0.06);
    }

    if (gameState === 'burned' && burnedAt > 0 && performance.now() - burnedAt >= REVIVE_DELAY_MS) {
      reviveAtStart();
    }
  });

  window.addEventListener('resize', layout);
  render();
  layout();
}

boot();
