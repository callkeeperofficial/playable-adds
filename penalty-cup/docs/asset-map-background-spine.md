# Asset Map: background Spine Animation

## Files

```text
source/spine/background/background.png
source/spine/background/background.atlas
source/spine/background/background.json
```

## Asset Type

This is a Spine background scene asset.

It is not a normal static background image and should not be manually sliced.

## Spine Version

```text
4.2.43
```

## Skeleton Bounds

```text
x: -2511.07
y: -1407.52
width: 5212.24
height: 3323.17
```

## Structure

```text
bones: 755
slots: 751
animations: 3
```

## Atlas Regions

Observed atlas regions:

```text
- CUP
- banners
- bottle
- clouds_01
- clouds_02
- clouds_03
- clouds_04
- grass
- lights
- sky
- smoke1
- smoke2
- smoke3
- smoke4
- stadium2
- video camera
```

## Animation Names

```text
- background
- background_bonus
- background_fire
```

## Meaning

This asset appears to provide the animated football stadium background and environment layers:

- sky;
- clouds;
- stadium;
- grass field;
- stadium lights;
- smoke/fog effects;
- banners/flags;
- camera/light equipment;
- cup/win visual layer;
- bonus/fire background variant.

## Role in the Game

Use this Spine asset as the animated background layer behind gameplay.

Recommended scene layering:

```text
Background Spine
  ↓
Goal / goalkeeper
  ↓
Ball Spine
  ↓
Target zones
  ↓
HUD / UI
  ↓
Overlays: Country Select / Buy Bonus / Roulette / Bonus Win
```

## Hard Rule

Do not slice `background.png` manually.

Use Spine runtime.

Same rule as for `ball`:

```text
background.png + background.atlas + background.json
=
runtime-driven Spine asset
```

Manual slicing would lose:
- clouds positioning;
- smoke particle layout;
- additive lights;
- background animation states;
- bonus/fire variants;
- scene composition from the skeleton.

## Runtime Usage

Use the same PixiJS Spine runtime as for the ball asset.

Preferred for PixiJS v8:

```text
@esotericsoftware/spine-pixi-v8
```

Pseudo-flow:

```ts
const bg = Spine.from({
  skeleton: "background.json",
  atlas: "background.atlas",
});

bg.state.setAnimation(0, "background", true);
```

For bonus mode:

```ts
bg.state.setAnimation(0, "background_bonus", true);
```

For win/fire/emphasis state:

```ts
bg.state.setAnimation(0, "background_fire", false);
```

Exact runtime API may differ depending on installed Spine runtime version.

## Mobile Layout Note

This background is very wide compared to the mobile viewport.

Do not squash the whole skeleton into the phone screen.

Use cover/crop behavior:

```text
scale to cover viewport height/width
center important stadium/goal area
crop overflow horizontally
```

For mobile:

```ts
background.scale.set(coverScale);
background.x = screenWidth / 2;
background.y = backgroundY;
```

Codex should tune the transform visually using the mobile reference video.

## Implementation Priority

1. Load background Spine successfully.
2. Play `background` animation.
3. Place gameplay objects over it.
4. Add switching to `background_bonus` during Buy Bonus / Bonus mode.
5. Add `background_fire` only if needed for win/result emphasis.
