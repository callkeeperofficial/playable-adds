# Asset Map: Mobile UI Assets

## Files

```text
source/ui/mobile/cursor.6000941b.png
source/ui/mobile/logoMobile.8dd41027.png
```

## Asset Type

These are regular PNG UI assets.

They are not Spine assets.

Use them as normal PixiJS textures / sprites.

## Metadata

```json
{
  "cursor.6000941b.png": {
    "format": "PNG",
    "width": 221,
    "height": 221,
    "mode": "P"
  },
  "logoMobile.8dd41027.png": {
    "format": "PNG",
    "width": 300,
    "height": 84,
    "mode": "P"
  }
}
```

## cursor.6000941b.png

### Meaning

This is a target/cursor marker.

It looks like a circular aiming reticle:

- white central circle;
- segmented outer ring;
- four cardinal direction ticks;
- dark shadow/glow.

### Likely Role

Use for penalty target zones inside the goal.

Instead of drawing plain circles with PixiJS graphics, use this image as the clickable target marker.

Recommended use:

```text
show_targets state
target selection inside gates
tap/click target zone
```

### Behavior

Suggested states:

```text
normal: alpha 0.7–0.85
hover/active: scale up slightly
selected: brief flash / scale pulse
disabled: alpha 0.3
```

### Placement

Use for 9 or 15 target zones, depending on final mapping.

Known animation mapping:

```text
ball_1 ... ball_15
goalkeeper jump_1 ... jump_15
```

So target zones should be logical IDs:

```ts
type TargetZone = 1 | 2 | ... | 15;
```

Each zone can render this same cursor texture at different positions inside the gates.

## logoMobile.8dd41027.png

### Meaning

Mobile logo for the game:

```text
PENALTY NATIONS CUP
```

with football graphic.

### Role

Use in mobile top header.

Recommended header composition:

```text
left: logoMobile
right: balance pill
far right: hamburger/menu
```

### Placement

Mobile layout:

```ts
logo.x = 12;
logo.y = safeTop + headerHeight / 2;
logo.anchor.set(0, 0.5);
logo.scale = fitHeight(headerHeight * 0.65);
```

Do not stretch the logo non-uniformly.

## Integration with Existing Docs

These assets connect to:

```text
docs/mobile-layout-from-third-video.md
docs/asset-map-ball-spine.md
docs/asset-map-gates-spine.md
```

`cursor` belongs to target-zone selection.

`logoMobile` belongs to the top mobile header.

## Implementation Recommendation

Create reusable UI components:

```text
TargetCursor.ts
MobileHeader.ts
```

### TargetCursor

```ts
class TargetCursor extends Container {
  zoneId: TargetZone;
  sprite: Sprite;
}
```

It should emit/select:

```ts
onTargetSelected(zoneId)
```

### MobileHeader

```ts
class MobileHeader extends Container {
  logo: Sprite;
  balanceText: Text;
  menuButton: Container;
}
```

## Not Spine

Do not load these through Spine runtime.

Use `Assets.load()` / `Texture.from()` and regular `Sprite`.
