import { Application, Container, Graphics, Text, TextStyle, Ticker } from 'pixi.js';

type GameState = 'playing' | 'roasted' | 'won';
type FontWeight = 'normal' | 'bold' | '400' | '500' | '600' | '700' | '800' | '900';

const DESIGN_WIDTH = 1776;
const DESIGN_HEIGHT = 888;
const MULTIPLIERS = ['1.03x', '1.07x', '1.12x', '1.17x', '1.23x', '1.29x', '1.36x', '1.45x', '1.55x', '1.68x'];
const GRILL_START_X = 386;
const GRILL_SPACING = 142;
const GRILL_Y = 600;
const FLOOR_Y = 706;

type GrillView = {
  x: number;
  flame: Container;
  label: Text;
  glow: Graphics;
};

function makeText(
  value: string,
  fontSize: number,
  fill: string | number,
  stroke = 0x0b1027,
  strokeWidth = 0,
  weight: FontWeight = '900',
): Text {
  return new Text({
    text: value,
    style: new TextStyle({
      fontFamily: 'Arial Black, Impact, Helvetica, sans-serif',
      fontSize,
      fontWeight: weight,
      fill,
      stroke: strokeWidth > 0 ? { color: stroke, width: strokeWidth } : undefined,
    }),
  });
}

function addText(
  parent: Container,
  value: string,
  x: number,
  y: number,
  fontSize: number,
  fill: string | number,
  anchorX = 0,
  anchorY = 0,
  stroke = 0x0b1027,
  strokeWidth = 0,
): Text {
  const text = makeText(value, fontSize, fill, stroke, strokeWidth);
  text.anchor.set(anchorX, anchorY);
  text.position.set(x, y);
  parent.addChild(text);
  return text;
}

function addPanel(parent: Container, x: number, y: number, width: number, height: number, radius: number, fill: number, stroke = 0x313653): Graphics {
  const panel = new Graphics();
  panel.roundRect(0, 0, width, height, radius).fill(fill).stroke({ width: 3, color: stroke });
  panel.position.set(x, y);
  parent.addChild(panel);
  return panel;
}

function addGlow(parent: Container, x: number, y: number, width: number, height: number, color: number, alpha: number): Graphics {
  const glow = new Graphics();
  glow.ellipse(0, 0, width, height).fill(color);
  glow.alpha = alpha;
  glow.position.set(x, y);
  parent.addChild(glow);
  return glow;
}

function drawBackground(parent: Container): Graphics {
  const bg = new Graphics();
  bg.rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT).fill(0x101936);
  parent.addChild(bg);

  const bricks = new Graphics();
  for (let row = 0; row < 13; row++) {
    const y = 18 + row * 54;
    const offset = row % 2 === 0 ? 0 : -58;
    for (let col = 0; col < 18; col++) {
      const x = offset + col * 116;
      const shade = (row * 7 + col * 5) % 5;
      const colors = [0x172349, 0x1a2853, 0x142043, 0x1d2b58, 0x111b39];
      bricks.roundRect(x, y, 92 + shade * 4, 32, 5).fill(colors[shade]).stroke({ width: 2, color: 0x263461 });
    }
  }
  parent.addChild(bricks);

  const vignette = new Graphics();
  vignette.rect(0, 0, DESIGN_WIDTH, 120).fill(0x071027);
  vignette.rect(0, DESIGN_HEIGHT - 190, DESIGN_WIDTH, 190).fill(0x070916);
  vignette.alpha = 0.72;
  parent.addChild(vignette);

  const pipes = new Graphics();
  pipes.roundRect(448, 34, 138, 24, 10).fill(0x18264b).stroke({ width: 5, color: 0x293866 });
  pipes.roundRect(558, 59, 142, 18, 9).fill(0x101c3b).stroke({ width: 4, color: 0x263766 });
  pipes.roundRect(679, 32, 18, 94, 8).fill(0x111b38).stroke({ width: 4, color: 0x263766 });
  pipes.roundRect(1324, 146, 106, 76, 8).fill(0x172341).stroke({ width: 5, color: 0x2b3b6b });
  for (let i = 0; i < 5; i++) {
    pipes.rect(1340 + i * 15, 160, 8, 48).fill(0x0a1028);
  }
  pipes.roundRect(1718, 170, 96, 30, 14).fill(0x15254d).stroke({ width: 5, color: 0x2b3d72 });
  pipes.roundRect(1760, 198, 24, 136, 12).fill(0x101d3d).stroke({ width: 5, color: 0x2a3b6d });
  parent.addChild(pipes);

  addGlow(parent, 78, 287, 88, 134, 0xff8c17, 0.22);
  addGlow(parent, 920, 332, 84, 186, 0xff3f0c, 0.13);
  addGlow(parent, 1352, 375, 84, 160, 0xff3f0c, 0.13);

  const door = new Graphics();
  door.roundRect(28, 188, 92, 260, 42).fill(0x152141).stroke({ width: 9, color: 0x2b3a67 });
  door.roundRect(45, 224, 58, 207, 30).fill(0xff9a16);
  door.roundRect(58, 239, 34, 186, 22).fill(0xffc444);
  door.alpha = 0.98;
  parent.addChild(door);

  const floor = new Graphics();
  floor.rect(0, FLOOR_Y, DESIGN_WIDTH, 82).fill(0x1a2442).stroke({ width: 4, color: 0x3e527a });
  for (let i = 0; i < 28; i++) {
    floor.rect(i * 68, FLOOR_Y, 63, 22).fill(i % 2 ? 0x273653 : 0x22304d);
    floor.rect(i * 68, FLOOR_Y + 28, 63, 32).fill(i % 2 ? 0x202c48 : 0x1b2843);
  }
  floor.rect(0, FLOOR_Y + 76, DESIGN_WIDTH, 50).fill(0x080b17);
  parent.addChild(floor);

  return bg;
}

function drawLogo(parent: Container): void {
  const logo = new Container();
  logo.position.set(56, 18);
  parent.addChild(logo);

  const leftWing = new Graphics();
  leftWing.ellipse(0, 52, 35, 16).fill(0xf5f5ff).stroke({ width: 4, color: 0xc5c8dd });
  leftWing.ellipse(22, 73, 30, 12).fill(0xf5f5ff).stroke({ width: 4, color: 0xc5c8dd });
  leftWing.rotation = -0.45;
  logo.addChild(leftWing);

  const rightWing = new Graphics();
  rightWing.ellipse(198, 52, 35, 16).fill(0xf5f5ff).stroke({ width: 4, color: 0xc5c8dd });
  rightWing.ellipse(176, 73, 30, 12).fill(0xf5f5ff).stroke({ width: 4, color: 0xc5c8dd });
  rightWing.rotation = 0.45;
  logo.addChild(rightWing);

  addText(logo, 'CHICKEN', 100, 32, 43, 0xf7f8ff, 0.5, 0.5, 0x1b2342, 8);
  addText(logo, 'ROAD', 103, 88, 57, 0xff9816, 0.5, 0.5, 0x681b0e, 10);
}

function drawTopHud(parent: Container): void {
  addPanel(parent, 28, 116, 224, 39, 18, 0x141a32, 0x222944);
  const onlineDot = new Graphics();
  onlineDot.circle(0, 0, 8).fill(0x2de64b);
  onlineDot.position.set(72, 135);
  parent.addChild(onlineDot);
  addText(parent, 'Online:', 91, 135, 17, 0xd5d9e9, 0, 0.5, 0x000000, 0);
  addText(parent, '2 907', 164, 135, 18, 0xd9dded, 0, 0.5, 0x000000, 0);

  addPanel(parent, 1248, 14, 310, 68, 18, 0x252640, 0x454667);
  const coin = new Graphics();
  coin.circle(0, 0, 22).fill(0xffb51a).stroke({ width: 5, color: 0xf07810 });
  coin.circle(0, 0, 11).fill(0xffd94f);
  coin.position.set(1294, 48);
  parent.addChild(coin);
  addText(parent, '1 000 000', 1336, 48, 28, 0xffffff, 0, 0.5, 0x16172b, 3);

  const plus = new Graphics();
  plus.circle(0, 0, 24).fill(0x27bb3d).stroke({ width: 4, color: 0x136a23 });
  plus.rect(-5, -15, 10, 30).fill(0xffffff);
  plus.rect(-15, -5, 30, 10).fill(0xffffff);
  plus.position.set(1508, 48);
  parent.addChild(plus);

  for (const [x, label] of [[1623, '?'], [1710, '⚙']] as const) {
    const button = new Graphics();
    button.circle(0, 0, 38).fill(0x30304e).stroke({ width: 5, color: 0x50506f });
    button.position.set(x, 48);
    parent.addChild(button);
    addText(parent, label, x, 48, label === '?' ? 48 : 38, 0xe8e9f8, 0.5, 0.5, 0x111225, 4);
  }
}

function drawTapHint(parent: Container): Container {
  const hint = new Container();
  hint.position.set(300, 160);
  parent.addChild(hint);

  addText(hint, 'TAP TO', 46, 0, 33, 0xd7efff, 0.5, 0.5, 0x102756, 7);
  addText(hint, 'MOVE', 58, 39, 42, 0xffffff, 0.5, 0.5, 0x102756, 8);

  const hand = new Graphics();
  hand.roundRect(0, 48, 28, 66, 12).fill(0xffffff).stroke({ width: 5, color: 0x2b7cff });
  hand.roundRect(-18, 78, 24, 44, 12).fill(0xffffff).stroke({ width: 5, color: 0x2b7cff });
  hand.roundRect(21, 72, 18, 44, 9).fill(0xffffff).stroke({ width: 5, color: 0x2b7cff });
  hand.roundRect(38, 80, 17, 36, 8).fill(0xffffff).stroke({ width: 5, color: 0x2b7cff });
  hand.roundRect(52, 89, 15, 27, 7).fill(0xffffff).stroke({ width: 5, color: 0x2b7cff });
  hand.rotation = -0.42;
  hand.position.set(-28, 74);
  hint.addChild(hand);

  const arrow = new Graphics();
  arrow.moveTo(84, 89).quadraticCurveTo(160, 42, 244, 79).stroke({ width: 7, color: 0x62a7ff });
  arrow.moveTo(238, 61).lineTo(276, 88).lineTo(230, 104).stroke({ width: 7, color: 0x62a7ff });
  hint.addChild(arrow);

  return hint;
}

function makeFlame(scale = 1): Container {
  const flame = new Container();
  flame.scale.set(scale);

  const outer = new Graphics();
  outer.moveTo(0, 0).lineTo(-26, -19).lineTo(-13, -52).lineTo(-4, -39).lineTo(9, -84).lineTo(20, -44).lineTo(34, -18).lineTo(0, 0).fill(0xff4b10);
  outer.moveTo(3, -4).lineTo(-13, -18).lineTo(-4, -38).lineTo(4, -28).lineTo(12, -62).lineTo(20, -28).lineTo(27, -12).lineTo(3, -4).fill(0xffb018);
  outer.moveTo(5, -5).lineTo(-3, -19).lineTo(8, -40).lineTo(16, -17).lineTo(5, -5).fill(0xfff25a);
  flame.addChild(outer);

  return flame;
}

function drawGrill(parent: Container, x: number, y: number, label: string, hot: boolean): GrillView {
  const grill = new Container();
  grill.position.set(x, y);
  parent.addChild(grill);

  const glow = new Graphics();
  glow.ellipse(58, 58, 70, 24).fill(0xff3b0b);
  glow.alpha = hot ? 0.45 : 0.24;
  grill.addChild(glow);

  const body = new Graphics();
  body.roundRect(0, 24, 116, 54, 10).fill(0x2a2540).stroke({ width: 5, color: 0x4a4367 });
  body.roundRect(8, 2, 100, 37, 7).fill(0x561318).stroke({ width: 4, color: 0x8a3242 });
  body.roundRect(15, 9, 86, 22, 5).fill(0xff5a13);
  for (let i = 0; i < 5; i++) {
    body.rect(18 + i * 17, 8, 8, 25).fill(0x2b1a23);
  }
  for (let i = 0; i < 3; i++) {
    body.rect(13, 13 + i * 7, 91, 4).fill(0x2b1a23);
  }
  body.rect(10, 70, 21, 22).fill(0x171424);
  body.rect(85, 70, 21, 22).fill(0x171424);
  grill.addChild(body);

  if (hot) {
    const flame = makeFlame(0.78);
    flame.position.set(56, 4);
    grill.addChild(flame);
  }

  const smallFlame = makeFlame(hot ? 0.44 : 0.25);
  smallFlame.position.set(76, 15);
  smallFlame.alpha = hot ? 1 : 0.45;
  grill.addChild(smallFlame);

  const text = addText(parent, label, x + 58, y - 18, 27, 0xdce7ff, 0.5, 0.5, 0x334fb2, 4);

  return { x, flame: smallFlame, label: text, glow };
}

function makeChicken(roasted = false): Container {
  const chicken = new Container();
  const body = new Graphics();
  const bodyColor = roasted ? 0x5b3525 : 0xf7efd0;
  const wingColor = roasted ? 0x3d241b : 0xffe3a4;

  body.ellipse(0, 0, 52, 38).fill(bodyColor).stroke({ width: 5, color: roasted ? 0x2b1711 : 0xc88635 });
  body.ellipse(-39, -2, 24, 26).fill(bodyColor).stroke({ width: 4, color: roasted ? 0x2b1711 : 0xc88635 });
  body.ellipse(34, -48, 28, 30).fill(bodyColor).stroke({ width: 5, color: roasted ? 0x2b1711 : 0xc88635 });
  body.ellipse(-12, 8, 24, 16).fill(wingColor).stroke({ width: 3, color: roasted ? 0x2b1711 : 0xd7a353 });
  body.moveTo(55, -45).lineTo(88, -33).lineTo(55, -22).lineTo(55, -45).fill(0xffaa22).stroke({ width: 3, color: 0xa35113 });
  body.circle(25, -55, 7).fill(0xffffff);
  body.circle(42, -55, 7).fill(0xffffff);
  if (roasted) {
    body.moveTo(22, -58).lineTo(30, -50).moveTo(30, -58).lineTo(22, -50).stroke({ width: 4, color: 0x20100d });
    body.moveTo(39, -58).lineTo(47, -50).moveTo(47, -58).lineTo(39, -50).stroke({ width: 4, color: 0x20100d });
    body.circle(-8, -6, 7).fill(0x1d100d);
    body.circle(10, 15, 8).fill(0x1d100d);
  } else {
    body.circle(25, -55, 3).fill(0x181818);
    body.circle(42, -55, 3).fill(0x181818);
  }
  body.moveTo(10, -82).lineTo(26, -102).lineTo(42, -82).lineTo(54, -101).lineTo(63, -76).lineTo(10, -82).fill(0xe5392d).stroke({ width: 3, color: 0x9c1d1d });
  body.rect(-22, 35, 6, 31).fill(0xffb42a);
  body.rect(10, 34, 6, 33).fill(0xffb42a);
  body.moveTo(-28, 66).lineTo(-11, 66).moveTo(4, 67).lineTo(23, 67).stroke({ width: 5, color: 0xffb42a });
  chicken.addChild(body);
  return chicken;
}

function drawControls(parent: Container): Graphics[] {
  const bar = new Graphics();
  bar.roundRect(0, 776, DESIGN_WIDTH, 92, 26).fill(0x090b14);
  bar.alpha = 0.92;
  parent.addChild(bar);

  addPanel(parent, 28, 792, 510, 58, 22, 0x14141f, 0x181826);
  addText(parent, 'Difficulty', 65, 821, 24, 0xe6e9f3, 0, 0.5, 0x000000, 0);
  const levels = [
    ['Easy', 190, 0x25ad36],
    ['Medium', 305, 0x28283d],
    ['Hard', 431, 0x28283d],
  ] as const;
  for (const [label, x, color] of levels) {
    addPanel(parent, x, 797, 108, 46, 18, color, color === 0x25ad36 ? 0x135d20 : 0x37374f);
    addText(parent, label, x + 54, 820, 19, 0xffffff, 0.5, 0.5, 0x000000, 0);
  }

  addText(parent, '◄  TAP TO MOVE  ►', 888, 822, 31, 0xb9bbca, 0.5, 0.5, 0x111325, 2);

  addPanel(parent, 1264, 792, 470, 58, 22, 0x151720, 0x1d2131);
  addText(parent, 'Chance of collision', 1274, 821, 18, 0xb7bed3, 0, 0.5, 0x000000, 0);
  const segments: Graphics[] = [];
  const colors = [0x23c842, 0x2bd446, 0xffbf22, 0xff9922, 0xff2f25, 0xd9152a];
  for (let i = 0; i < colors.length; i++) {
    const seg = new Graphics();
    seg.roundRect(0, 0, 36, 20, 6).fill(colors[i]).stroke({ width: 2, color: 0x11131d });
    seg.position.set(1444 + i * 39, 811);
    parent.addChild(seg);
    segments.push(seg);
  }
  return segments;
}

function setChanceMeter(segments: Graphics[], index: number): void {
  const active = Math.min(segments.length, Math.max(1, Math.ceil((index + 2) / 2)));
  segments.forEach((segment, i) => {
    segment.alpha = i < active ? 1 : 0.28;
  });
}

async function boot() {
  const app = new Application();
  await app.init({ resizeTo: window, background: '#050815', antialias: true, resolution: Math.min(window.devicePixelRatio, 2) });
  document.body.appendChild(app.canvas);

  const root = new Container();
  app.stage.addChild(root);

  const background = drawBackground(root);
  drawLogo(root);
  drawTopHud(root);
  const tapHint = drawTapHint(root);

  const grills: GrillView[] = [];
  for (let i = 0; i < MULTIPLIERS.length; i++) {
    const hot = i === 4 || i === 7;
    grills.push(drawGrill(root, GRILL_START_X + i * GRILL_SPACING, GRILL_Y, MULTIPLIERS[i], hot));
  }

  const chicken = makeChicken(false);
  chicken.position.set(182, FLOOR_Y - 24);
  chicken.scale.set(1.02);
  root.addChild(chicken);

  const roastedChicken = makeChicken(true);
  roastedChicken.visible = false;
  roastedChicken.position.set(182, FLOOR_Y - 24);
  roastedChicken.scale.set(1.02);
  root.addChild(roastedChicken);

  const chanceSegments = drawControls(root);

  const outcome = new Container();
  outcome.visible = false;
  root.addChild(outcome);
  const redWash = new Graphics();
  redWash.rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT).fill(0x220811);
  redWash.alpha = 0.74;
  outcome.addChild(redWash);
  addGlow(outcome, DESIGN_WIDTH / 2, 520, 420, 210, 0xff3b0b, 0.2);
  const outcomeTitle = addText(outcome, 'ROASTED!', DESIGN_WIDTH / 2, 228, 76, 0xff9b18, 0.5, 0.5, 0x5e130b, 12);
  outcomeTitle.rotation = -0.03;
  const skull = addText(outcome, '☠', DESIGN_WIDTH / 2 - 210, 228, 64, 0xffecd4, 0.5, 0.5, 0x5e130b, 8);
  skull.rotation = -0.12;
  addPanel(outcome, 1418, 206, 328, 86, 18, 0x15942a, 0x0a5a17);
  addText(outcome, '↻  Играть снова', 1582, 249, 32, 0xffffff, 0.5, 0.5, 0x0a4a17, 2);
  addPanel(outcome, 29, 796, 275, 48, 16, 0x25111b, 0x6a1d1d);
  addText(outcome, '🏆  Your best:', 58, 820, 22, 0xe8e3df, 0, 0.5, 0x000000, 0);
  const bestText = addText(outcome, '1.00x', 244, 820, 24, 0xffb32b, 0, 0.5, 0x000000, 0);
  addText(outcome, '💡  Risk increases the further you go!', DESIGN_WIDTH / 2, 824, 24, 0xf2edf0, 0.5, 0.5, 0x000000, 0);

  let grillIndex = -1;
  let state: GameState = 'playing';
  let moving = false;
  let targetX = chicken.x;
  let jumpProgress = 0;
  let bestMultiplier = 1;

  function layout() {
    const scale = Math.min(app.renderer.width / DESIGN_WIDTH, app.renderer.height / DESIGN_HEIGHT);
    root.scale.set(scale);
    root.position.set((app.renderer.width - DESIGN_WIDTH * scale) / 2, (app.renderer.height - DESIGN_HEIGHT * scale) / 2);
  }

  function nextRoastChance(nextIdx: number): number {
    return Math.min(0.04 + nextIdx * 0.065, 0.62);
  }

  function updateResultVisibility() {
    const finished = state !== 'playing';
    outcome.visible = finished;
    tapHint.visible = !finished;
    roastedChicken.visible = state === 'roasted';
    chicken.visible = state !== 'roasted';
  }

  function reset() {
    grillIndex = -1;
    state = 'playing';
    moving = false;
    jumpProgress = 0;
    targetX = 182;
    chicken.position.set(182, FLOOR_Y - 24);
    roastedChicken.position.copyFrom(chicken.position);
    setChanceMeter(chanceSegments, grillIndex);
    updateResultVisibility();
  }

  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;
  app.stage.on('pointertap', () => {
    if (state !== 'playing') {
      reset();
      return;
    }

    if (moving || grillIndex >= grills.length - 1) return;
    const next = grillIndex + 1;
    moving = true;
    jumpProgress = 0;
    targetX = grills[next].x + 58;
    tapHint.visible = false;
  });

  Ticker.shared.add((ticker) => {
    const elapsed = ticker.deltaTime;
    const time = performance.now() / 1000;
    background.tint = state === 'roasted' ? 0x8b3340 : state === 'won' ? 0x345a8f : 0xffffff;

    grills.forEach((grill, i) => {
      const pulse = 0.75 + Math.sin(time * 5 + i * 0.72) * 0.25;
      grill.flame.scale.set((i === 4 || i === 7 ? 0.48 : 0.27) * pulse);
      grill.flame.alpha = i === 4 || i === 7 ? 0.95 : 0.36 + pulse * 0.18;
      grill.glow.alpha = (i === 4 || i === 7 ? 0.44 : 0.22) + pulse * 0.07;
      grill.label.y = GRILL_Y - 18 + Math.sin(time * 3 + i) * 1.8;
    });

    if (state === 'playing' && !moving) {
      chicken.y = FLOOR_Y - 24 + Math.sin(time * 4) * 3;
      chicken.rotation = Math.sin(time * 3) * 0.025;
    }

    if (moving) {
      jumpProgress = Math.min(1, jumpProgress + elapsed * 0.055);
      const startX = grillIndex < 0 ? 182 : grills[grillIndex].x + 58;
      const eased = 1 - Math.pow(1 - jumpProgress, 3);
      chicken.x = startX + (targetX - startX) * eased;
      chicken.y = FLOOR_Y - 24 - Math.sin(jumpProgress * Math.PI) * 96;
      chicken.rotation = Math.sin(jumpProgress * Math.PI) * -0.12;

      if (jumpProgress >= 1) {
        moving = false;
        chicken.position.set(targetX, FLOOR_Y - 24);
        chicken.rotation = 0;
        grillIndex += 1;
        bestMultiplier = Math.max(bestMultiplier, Number.parseFloat(MULTIPLIERS[grillIndex]));
        bestText.text = `${bestMultiplier.toFixed(2)}x`;
        setChanceMeter(chanceSegments, grillIndex);

        const roasted = Math.random() < nextRoastChance(grillIndex) && grillIndex < grills.length - 1;
        if (roasted) {
          state = 'roasted';
          roastedChicken.position.copyFrom(chicken.position);
        } else if (grillIndex === grills.length - 1) {
          state = 'won';
          outcomeTitle.text = 'PRIZE FOUND!';
          outcomeTitle.style.fill = 0xffd45a;
        } else {
          tapHint.visible = true;
        }
        updateResultVisibility();
      }
    }
  });

  window.addEventListener('resize', layout);
  layout();
  setChanceMeter(chanceSegments, grillIndex);
}

boot();
