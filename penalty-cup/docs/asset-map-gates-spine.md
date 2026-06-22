# Asset Map: gates Spine Asset

## Files

```text
source/spine/gates/gates.png
source/spine/gates/gates.atlas
source/spine/gates/gates.json
```

## Asset Type

This is a Spine asset for the football goal / net.

It is not a regular static PNG for manual slicing.

## Spine Version

```text
4.2.43
```

## Skeleton Bounds

```text
x: -687.5
y: 20.58
width: 1375
height: 636
```

## Structure

```text
bones: 17
slots: 1
animations: 15
```

## Atlas Regions

Observed atlas regions:

```text
- gates2
```

## Animation Names

```text
- 1
- 2
- 3
- 4
- 5
- 6
- 7
- 8
- 9
- 10
- 11
- 12
- 13
- 14
- 15
```

## Meaning

This asset represents the goal frame and net.

The visible PNG shows:

- front goal frame;
- left and right side net perspective;
- back net/grid;
- top net;
- dark transparent interior;
- slight 3D/perspective deformation.

In `gates.json` the main slot is:

```text
gates → attachment gates2
```

The attachment is a mesh, which means the goal/net perspective is driven by Spine mesh geometry.

## Role in the Game

Use this as the goal layer in the penalty scene.

Recommended scene order:

```text
Background Spine
  ↓
Gates Spine
  ↓
Goalkeeper Spine / Sprite
  ↓
Target zones
  ↓
Ball Spine
  ↓
HUD / UI
```

Alternative order when ball should appear inside/behind the goal:

```text
Background Spine
  ↓
Gates back/net
  ↓
Goalkeeper
  ↓
Ball
  ↓
Gates front frame
```

But if the Spine asset is a single mesh, use it as one layer and tune visually.

## Hard Rule

Do not slice `gates.png`.

Use Spine runtime.

Reason:

- the goal is stored as a Spine mesh;
- the perspective net is defined through mesh vertices;
- manual slicing would lose the mesh deformation and correct proportions.

## Runtime Usage

Use the same PixiJS Spine runtime as the ball/background assets.

Preferred for PixiJS v8:

```text
@esotericsoftware/spine-pixi-v8
```

Pseudo-flow:

```ts
const gates = Spine.from({
  skeleton: "gates.json",
  atlas: "gates.atlas",
});

gates.x = screenWidth / 2;
gates.y = goalY;
gates.scale.set(goalScale);
```

If there are no named animations, simply render it as a static Spine object.

## Mobile Layout Notes

On mobile, the gates should occupy the central gameplay area.

Recommended placement:

```text
x: center
y: around 34–45% of screen height
width: 88–96% of screen width
```

The visual goal should not be stretched vertically. Scale uniformly and crop/position if needed.

## Target Zones

Target zones should be positioned relative to this gates asset.

Suggested logical zones:

```text
top-left
top-center
top-right
middle-left
middle-center
middle-right
bottom-left
bottom-center
bottom-right
```

The target circles should be rendered over the goal net but under the final flying ball effect if needed.

## Implementation Priority

1. Load gates Spine successfully.
2. Place it above background.
3. Align goalkeeper inside it.
4. Position target zones relative to its bounds.
5. Play ball Spine shot animations toward the target zones.
