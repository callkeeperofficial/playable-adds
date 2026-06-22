# Asset Map: Roulette UI Assets

## Files

```text
source/ui/roulette/rouletteWheel.c208d970.png
source/ui/roulette/rouletteWheelArrow.946f3d05.png
source/ui/roulette/rouletteWheelSectorPart.6067044f.png
source/ui/roulette/sliderball.png
source/ui/roulette/sprite.4de80bac.svg
```

## Asset Type

These are not Spine assets.

These are regular UI/static image assets for the bonus roulette flow and small gameplay UI markers.

Use them as normal PixiJS textures / sprites.

## Metadata

```json
{
  "rouletteWheel.c208d970.png": {
    "type": "PNG",
    "width": 1827,
    "height": 1827,
    "mode": "P"
  },
  "rouletteWheelArrow.946f3d05.png": {
    "type": "PNG",
    "width": 849,
    "height": 849,
    "mode": "P"
  },
  "rouletteWheelSectorPart.6067044f.png": {
    "type": "PNG",
    "width": 618,
    "height": 642,
    "mode": "P"
  },
  "sliderball.png": {
    "type": "PNG",
    "width": 103,
    "height": 101,
    "mode": "P"
  },
  "sprite.4de80bac.svg": {
    "type": "SVG",
    "width_attr": "18",
    "height_attr": "18",
    "viewBox": "0 0 20 20",
    "chars": 299873,
    "preview": "<svg fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">   <g id=\"USD\">     <path fill-rule=\"evenodd\" clip-rule=\"evenodd\"       d=\"M9 18C13.9706 18 18 13.9706 18 9C18 4.02944 13.9706 0 9 0C4.02944 0 0 4.02944 0 9C0 13.9706 4.02944 18 9 18ZM11.356 12.0851"
  }
}
```

## Meaning

### rouletteWheel.c208d970.png

Large circular colored wheel.

Purpose:

```text
Bonus roulette wheel background
```

Use in the `bonus_roulette` state after player buys a bonus.

The actual values can be placed as PixiJS text over sectors:

```text
12
13
14
15
```

or repeated values if the wheel has more sectors.

### rouletteWheelArrow.946f3d05.png

Golden pointer/arrow with ball in the middle.

Purpose:

```text
Fixed roulette pointer
```

Place above the wheel, usually at top-center.

Recommended behavior:

```text
wheel rotates
arrow stays fixed
selected sector is the one under the arrow
```

Do not rotate the arrow together with the wheel.

### rouletteWheelSectorPart.6067044f.png

White sector/wedge shape.

Purpose:

```text
sector mask / sector highlight / temporary white overlay
```

Likely used to:
- create sector highlight;
- flash the winning sector;
- mask/tint a wheel segment;
- build dynamic wheel sectors.

For playable, simplest usage:

```text
Use it as optional selected-sector glow/highlight.
```

If not needed, the roulette can work without it.

### sliderball.png

Small football icon.

Purpose is probably one of:

```text
1. marker on multiplier track;
2. current progress ball on top ladder;
3. small icon in roulette / UI.
```

Most likely use:

```text
MultiplierTrack current-position marker
```

This matches the mobile reference where a small ball marker moves along the multiplier line.

### sprite.4de80bac.svg

Generic SVG UI sprite.

Purpose depends on internal SVG content. Treat as an external SVG asset and inspect symbols/paths during implementation.

Likely usage:
- icon sprite;
- button/icon source;
- UI vector graphics.

Codex should inspect the SVG contents and map symbols if it contains `<symbol>` or multiple path groups.

## How It Connects to Bonus Mode

Existing bonus flow:

```text
Buy Bonus → select Easy/Medium/Hard → roulette 12–15 shots → bonus shot loop
```

This asset pack belongs to:

```text
bonus_roulette
```

Recommended implementation:

```ts
class RouletteOverlay {
  wheel: Sprite;      // rouletteWheel
  arrow: Sprite;      // rouletteWheelArrow
  labels: Text[];     // 12 / 13 / 14 / 15
  selectedSectorGlow?: Sprite; // rouletteWheelSectorPart
}
```

## Roulette Logic

For playable:

```ts
const SHOT_OPTIONS = [12, 13, 14, 15];

function spinRoulette(): number {
  return randomFrom(SHOT_OPTIONS);
}
```

Animation:

```text
1. Show overlay.
2. Place wheel at center.
3. Place arrow fixed at top.
4. Rotate wheel for 1.5–2.5 seconds.
5. Ease out.
6. Stop with selected sector under arrow.
7. Show selected shots count.
8. Start bonus mode.
```

## Mobile Layout

Recommended:

```text
top: ROULETTE title
center: wheel
top-center over wheel: arrow
bottom: selected shots / continue transition
```

Suggested coordinates:

```ts
wheel.x = W / 2;
wheel.y = H * 0.48;
wheel.scale = fitToWidth(0.78 * W);

arrow.x = W / 2;
arrow.y = wheel.y - wheelRadius - arrowOffset;
```

## Implementation Notes

The wheel image is already colored. Do not rebuild the wheel from the sector wedge unless necessary.

Use the wedge only as optional highlight.

The wheel should spin; the arrow should stay fixed.

## Not Spine

Unlike these assets:

```text
ball
background
gates
goalkeeper
bigwin / megawin / epicwin / legendarywin
```

Roulette assets are normal image assets.

No Spine runtime needed for this pack.
