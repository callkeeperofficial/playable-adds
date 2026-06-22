# Asset Map: Epic Win Result Assets

## Files

Static background:

```text
source/win/bgEpicWin.9d8cce80.jpg
```

Spine animated text:

```text
source/spine/epicwin_text/epicwin_text.png
source/spine/epicwin_text/epicwin_text.atlas
source/spine/epicwin_text/epicwin_text.json
```

Spine animated result decoration:

```text
source/spine/epicwin/epicwin.png
source/spine/epicwin/epicwin.atlas
source/spine/epicwin/epicwin.json
```

## Meaning

This is the third-tier result/win screen pack: `EPIC WIN`.

It belongs to the same win/result family:

```text
BIG WIN → MEGA WIN → EPIC WIN
```

Visual contents:

- cool blue stadium background;
- animated gold `EPIC WIN` text;
- golden boot;
- golden ball;
- green cloth / pedestal;
- glints and shine effects;
- transition animations between win tiers.

## Static Background: bgEpicWin

`bgEpicWin.9d8cce80.jpg` is a static cool stadium result background.

Use it as full-screen result background for Epic Win.

Use cover/crop behavior on mobile.

## Spine Asset: epicwin_text

### Type

Animated Spine title text spelling:

```text
EPIC WIN
```

### Metadata

```text
Spine: 4.2.43
bounds: x=-469.1, y=516.01, width=940.13, height=349.44
bones: 18
slots: 29
skins: default
animations: 4
```

### Animations

```text
- epicwin_end
- epicwin_idle
- epicwin_start
- epicwin_start_fast
```

## Spine Asset: epicwin

### Type

Animated golden boot / ball / pedestal decoration.

### Metadata

```text
Spine: 4.2.43
bounds: x=-381.4, y=-746.71, width=778.8, height=1161.92
bones: 11
slots: 9
skins: default
animations: 5
transform constraints: 1
```

### Animations

```text
- big-epic_win_transition
- epic-mega_win_transition
- epicwin_end
- epicwin_idle
- epicwin_start
```

## Runtime Rule

Do not slice these PNG atlases manually.

Use Spine runtime for:

```text
epicwin_text.png + epicwin_text.atlas + epicwin_text.json
epicwin.png + epicwin.atlas + epicwin.json
```

These assets contain:
- separate animated letters;
- additive glints;
- clipping masks;
- golden boot mesh;
- ball mesh;
- pedestal/tribune transforms;
- tier transition animations.

Manual slicing is not acceptable.

## Win Tier Ladder

Use a tier selector:

```ts
type WinTier = "big" | "mega" | "epic";
```

Example playable threshold logic:

```ts
function getWinTier(winAmount: number, bet: number): WinTier {
  const multiplier = winAmount / bet;

  if (multiplier >= 150) return "epic";
  if (multiplier >= 50) return "mega";
  return "big";
}
```

## Generic WinOverlay Config

Recommended:

```ts
const WIN_TIER_CONFIG = {
  big: {
    background: "bgBigWin.b5ddd5f5.jpg",
    textSpine: "bigwin_text",
    stageSpine: "bigwin",
    start: "bigwin_start",
    idle: "bigwin_idle",
    end: "bigwin_end",
  },
  mega: {
    background: "bgMegaWin.9fd1952f.jpg",
    textSpine: "megawin_text",
    stageSpine: "megawin",
    start: "megawin_start",
    idle: "megawin_idle",
    end: "megawin_end",
    transition: "megawin_transition",
  },
  epic: {
    background: "bgEpicWin.9d8cce80.jpg",
    textSpine: "epicwin_text",
    stageSpine: "epicwin",
    start: "epicwin_start",
    idle: "epicwin_idle",
    end: "epicwin_end",
    transition: "epicwin_transition",
  },
};
```

Note: exact transition animation availability should be checked from the loaded skeleton at runtime. Do not play transition animation unless it exists.

## Suggested Epic Win Flow

```text
1. Fade in bgEpicWin.
2. Play epicwin_text: epicwin_start.
3. Play epicwin: epicwin_start.
4. Show win amount, e.g. $120.50k.
5. Loop:
   - epicwin_text: epicwin_idle
   - epicwin: epicwin_idle
6. On tap / timeout:
   - play epicwin_text: epicwin_end
   - play epicwin: epicwin_end
   - fade out
   - return to gameplay
```

## Relation to Other Result Tiers

Existing win tier files:

```text
docs/asset-map-bigwin-result.md
docs/asset-map-megawin-result.md
docs/asset-map-epicwin-result.md
```

Use one generic `WinOverlay` component for all three result tiers.

## Mobile Layout

Same layout family as Big Win and Mega Win.

Recommended:

```text
top: EPIC WIN text
middle: golden boot + golden ball
below middle: win amount
bottom: tap to continue / auto-close
```

Suggested coordinates:

```ts
epicWinText.x = W / 2;
epicWinText.y = H * 0.20;

epicWinStage.x = W / 2;
epicWinStage.y = H * 0.57;

amountText.x = W / 2;
amountText.y = H * 0.70;
```

## Implementation Priority

1. Add files to public assets.
2. Load `epicwin_text` and `epicwin` through Spine runtime.
3. Extend `WinOverlay` to support tier `"epic"`.
4. Add win tier selection.
5. Show Epic Win for the largest bonus/claim results.


## Relation to Legendary Win

There is a parallel highest-tier result pack:

```text
docs/asset-map-legendarywin-result.md
source/win/bgLegendaryWin.6c24bab1.jpg
source/spine/legendarywin_text/
source/spine/legendarywin/
```

Recommended implementation: use one generic `WinOverlay` with tier config:

```text
big → mega → epic → legendary
```


## Confetti Overlay

A shared Spine confetti effect is available:

```text
docs/asset-map-confetti-spine.md
source/spine/confetti/
```

Use it as an optional top overlay for win/result screens.
