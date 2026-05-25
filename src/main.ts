import { Application, Container, Graphics, Sprite, Text, TextStyle, Texture, Ticker } from 'pixi.js';

type GameState = 'playing' | 'roasted' | 'won';

const GRILLS = 20;
const SPACING = 210;
const START_X = 140;
const FLOOR_Y = 390;

async function boot() {
  const app = new Application();
  await app.init({ resizeTo: window, background: '#101a33', antialias: true });
  document.body.appendChild(app.canvas);

  const world = new Container();
  app.stage.addChild(world);

  const bg = Sprite.from('assets/bg-forge.svg');
  bg.width = 5000;
  bg.height = app.renderer.height;
  world.addChild(bg);

  const grills: Graphics[] = [];
  for (let i = 0; i < GRILLS; i++) {
    const g = new Graphics();
    g.roundRect(0, 0, 140, 70, 12).fill(0x2e2e38).stroke({ width: 4, color: 0x55556a });
    g.x = START_X + i * SPACING;
    g.y = FLOOR_Y;
    world.addChild(g);
    grills.push(g);

    const mult = new Text({ text: `${(1 + (i + 1) * 0.11).toFixed(2)}x`, style: new TextStyle({ fill: '#d4e2ff', fontSize: 32, fontWeight: '700' }) });
    mult.anchor.set(0.5);
    mult.x = g.x + 70;
    mult.y = g.y - 38;
    world.addChild(mult);
  }

  const chicken = Sprite.from('assets/chicken-idle.svg');
  chicken.anchor.set(0.5, 1);
  chicken.scale.set(0.6);
  chicken.x = START_X - 60;
  chicken.y = FLOOR_Y;
  world.addChild(chicken);

  const hud = new Container();
  app.stage.addChild(hud);
  const title = new Text({ text: 'CHICKEN ROAD', style: new TextStyle({ fill: '#fff', fontSize: 44, fontWeight: '900' }) });
  title.x = 28; title.y = 20; hud.addChild(title);
  const hint = new Text({ text: 'Click next grill to move', style: new TextStyle({ fill: '#9dd0ff', fontSize: 26 }) });
  hint.x = 28; hint.y = 74; hud.addChild(hint);
  const status = new Text({ text: '', style: new TextStyle({ fill: '#ffd76b', fontSize: 50, fontWeight: '900' }) });
  status.anchor.set(0.5); status.x = app.renderer.width / 2; status.y = 110; hud.addChild(status);

  const playAgain = new Graphics().roundRect(0, 0, 250, 70, 16).fill(0x1fa53a);
  const playAgainText = new Text({ text: 'PLAY AGAIN', style: new TextStyle({ fill: '#fff', fontSize: 30, fontWeight: '900' }) });
  playAgainText.anchor.set(0.5); playAgainText.x = 125; playAgainText.y = 35; playAgain.addChild(playAgainText);
  playAgain.x = app.renderer.width / 2 - 125; playAgain.y = 160;
  playAgain.eventMode = 'static'; playAgain.cursor = 'pointer'; playAgain.visible = false;
  hud.addChild(playAgain);

  let grillIndex = -1;
  let state: GameState = 'playing';
  let moving = false;
  let targetX = chicken.x;

  function roastChance(nextIdx: number): number { return Math.min(0.08 + nextIdx * 0.04, 0.9); }
  function reset() {
    grillIndex = -1; state = 'playing'; moving = false; chicken.texture = Texture.from('assets/chicken-idle.svg');
    chicken.x = START_X - 60; chicken.y = FLOOR_Y; status.text = ''; playAgain.visible = false;
  }

  playAgain.on('pointertap', reset);

  app.stage.eventMode = 'static';
  app.stage.on('pointertap', () => {
    if (state !== 'playing' || moving || grillIndex >= GRILLS - 1) return;
    const next = grillIndex + 1;
    moving = true;
    chicken.texture = Texture.from('assets/chicken-jump.svg');
    targetX = grills[next].x + 70;
  });

  Ticker.shared.add(() => {
    grills.forEach((g, i) => {
      const pulse = 0.6 + Math.sin((performance.now() / 260) + i * 0.8) * 0.3;
      g.tint = (Math.floor(120 + pulse * 80) << 16) | (Math.floor(45 + pulse * 40) << 8) | 20;
    });

    if (moving) {
      const dx = targetX - chicken.x;
      chicken.x += Math.sign(dx) * Math.min(Math.abs(dx), 13);
      chicken.y = FLOOR_Y - Math.sin((Math.abs(dx) / SPACING) * Math.PI) * 90;
      if (Math.abs(dx) <= 0.01) {
        moving = false;
        chicken.y = FLOOR_Y;
        grillIndex += 1;
        const fail = Math.random() < roastChance(grillIndex);
        if (fail && grillIndex < GRILLS - 1) {
          state = 'roasted';
          chicken.texture = Texture.from('assets/chicken-roasted.svg');
          status.text = 'ROASTED!';
          playAgain.visible = true;
        } else {
          chicken.texture = Texture.from('assets/chicken-idle.svg');
        }
        if (grillIndex === GRILLS - 1 && state === 'playing') {
          state = 'won';
          status.text = 'YOU FOUND THE PRIZE!';
          playAgain.visible = true;
        }
      }
    }

    const camX = Math.max(0, chicken.x - app.renderer.width * 0.3);
    world.x = -camX;
  });
}

boot();
