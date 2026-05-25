import { Application, Assets, Container, Graphics, Sprite } from 'pixi.js';

const DESIGN_WIDTH = 1777;
const DESIGN_HEIGHT = 885;
const REFERENCE_IMAGE = 'assets/chicken-road-reference.png';

const grillCenters = [
  { x: 411, y: 332 },
  { x: 552, y: 332 },
  { x: 692, y: 332 },
  { x: 834, y: 332 },
  { x: 974, y: 332 },
  { x: 1117, y: 332 },
  { x: 1259, y: 332 },
  { x: 1399, y: 332 },
  { x: 1540, y: 332 },
  { x: 1680, y: 332 },
];

async function boot() {
  const app = new Application();
  await app.init({
    resizeTo: window,
    background: '#050714',
    antialias: true,
    resolution: Math.min(window.devicePixelRatio, 2),
  });
  document.body.appendChild(app.canvas);

  const root = new Container();
  app.stage.addChild(root);

  const texture = await Assets.load(REFERENCE_IMAGE);
  const reference = new Sprite(texture);
  reference.width = DESIGN_WIDTH;
  reference.height = DESIGN_HEIGHT;
  root.addChild(reference);

  const interactionLayer = new Container();
  root.addChild(interactionLayer);

  const tapFlash = new Graphics();
  tapFlash.visible = false;
  interactionLayer.addChild(tapFlash);

  const darken = new Graphics();
  darken.rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT).fill(0x000000);
  darken.alpha = 0;
  interactionLayer.addChild(darken);

  let step = -1;
  let flashTime = 0;

  function layout() {
    const scale = Math.min(app.renderer.width / DESIGN_WIDTH, app.renderer.height / DESIGN_HEIGHT);
    root.scale.set(scale);
    root.position.set(
      Math.round((app.renderer.width - DESIGN_WIDTH * scale) / 2),
      Math.round((app.renderer.height - DESIGN_HEIGHT * scale) / 2),
    );
  }

  function drawFlash(x: number, y: number, progress: number) {
    const radius = 52 + progress * 56;
    const alpha = 0.5 * (1 - progress);
    tapFlash.clear();
    tapFlash.circle(x, y, radius).fill({ color: 0x62a7ff, alpha: alpha * 0.18 });
    tapFlash.circle(x, y, radius).stroke({ width: 8, color: 0x76b5ff, alpha });
    tapFlash.roundRect(x - 68, y - 33, 136, 66, 12).stroke({ width: 5, color: 0xffffff, alpha: alpha * 0.9 });
    tapFlash.visible = true;
  }

  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;
  app.stage.on('pointertap', (event) => {
    const local = root.toLocal(event.global);
    const isReplay = local.x > 1420 && local.x < 1750 && local.y > 520 && local.y < 610;

    if (isReplay) {
      step = -1;
      darken.alpha = 0;
    } else {
      step = Math.min(step + 1, grillCenters.length - 1);
    }

    flashTime = 0.001;
    const target = grillCenters[Math.max(0, step)];
    drawFlash(target.x, target.y, 0);
  });

  app.ticker.add((ticker) => {
    if (flashTime > 0) {
      flashTime += ticker.deltaTime / 42;
      const target = grillCenters[Math.max(0, step)];
      drawFlash(target.x, target.y, Math.min(flashTime, 1));
      if (flashTime >= 1) {
        tapFlash.visible = false;
        flashTime = 0;
      }
    }
  });

  window.addEventListener('resize', layout);
  layout();
}

boot();
