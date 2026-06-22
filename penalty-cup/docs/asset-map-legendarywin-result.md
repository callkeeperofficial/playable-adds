# Asset Map: Legendary Win Result Assets

## Files

Static background:

```text
source/win/bgLegendaryWin.6c24bab1.jpg
```

Spine animated text:

```text
source/spine/legendarywin_text/legendarywin_text.png
source/spine/legendarywin_text/legendarywin_text.atlas
source/spine/legendarywin_text/legendarywin_text.json
```

Spine animated result decoration:

```text
source/spine/legendarywin/legendarywin.png
source/spine/legendarywin/legendarywin.atlas
source/spine/legendarywin/legendarywin.json
```

## Meaning

This is the fourth-tier result/win screen pack: `LEGENDARY WIN`.

It belongs to the result ladder:

```text
BIG WIN → MEGA WIN → EPIC WIN → LEGENDARY WIN
```

Visual contents:

- dark warm stadium background;
- large gold `LEGENDARY WIN` text;
- gold boot;
- gold glove;
- gold ball;
- gold player statue;
- gold cup;
- large green podium/table;
- multiple glints and big glow effects.

## Static Background: bgLegendaryWin

`bgLegendaryWin.6c24bab1.jpg` is a static stadium result background.

Use it as full-screen result background for Legendary Win.

Use cover/crop behavior on mobile.

## Spine Asset: legendarywin_text

### Type

Animated Spine title text spelling:

```text
LEGENDARY WIN
```

### Metadata

```text
Spine: 4.2.43
bounds: x=-539.25, y=313.76, width=1115.96, height=582.84
bones: 29
slots: 50
skins: default
animations: 3
```

### Animations

```text
- legendary_end
- legendary_idle
- legendary_start
```

## Spine Asset: legendarywin

### Type

Animated high-tier trophy stage.

### Metadata

```text
Spine: 4.2.43
bounds: x=-521.51, y=-1051.01, width=1106.61, height=1504.52
bones: 13
slots: 13
skins: default
animations: 3
transform constraints: 0
```

### Animations

```text
- legendary_end
- legendary_idle
- legendary_start
```

## Runtime Rule

Do not slice these PNG atlases manually.

Use Spine runtime for:

```text
legendarywin_text.png + legendarywin_text.atlas + legendarywin_text.json
legendarywin.png + legendarywin.atlas + legendarywin.json
```

These assets contain:
- multi-line animated text;
- separate letters;
- additive glints;
- clipping masks;
- sequence attachments;
- multiple prize objects;
- big podium mesh;
- stage transforms;
- start/idle/end timing.

Manual slicing is not acceptable.

## Win Tier Ladder

Use a tier selector:

```ts
type WinTier = "big" | "mega" | "epic" | "legendary";
```

Example playable threshold logic:

```ts
function getWinTier(winAmount: number, bet: number): WinTier {
  const multiplier = winAmount / bet;

  if (multiplier >= 300) return "legendary";
  if (multiplier >= 150) return "epic";
  if (multiplier >= 50) return "mega";
  return "big";
}
```

Thresholds are arbitrary for playable and can be tuned.

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
  },
  legendary: {
    background: "bgLegendaryWin.6c24bab1.jpg",
    textSpine: "legendarywin_text",
    stageSpine: "legendarywin",
    start: "legendary_start",
    idle: "legendary_idle",
    end: "legendary_end",
  },
};
```

Note: exact animation names must be validated from the loaded skeleton before playback. If `legendary_start` is not available, Codex must inspect the actual animation names and use the available one.

## Suggested Legendary Win Flow

```text
1. Fade in bgLegendaryWin.
2. Play legendarywin_text start animation.
3. Play legendarywin stage start animation.
4. Show win amount, e.g. $500k.
5. Loop legendary idle animations.
6. On tap / timeout:
   - play legendary end animations;
   - fade out;
   - return to gameplay.
```

## Relation to Other Result Tiers

Existing win tier files:

```text
docs/asset-map-bigwin-result.md
docs/asset-map-megawin-result.md
docs/asset-map-epicwin-result.md
docs/asset-map-legendarywin-result.md
```

Use one generic `WinOverlay` component for all result tiers.

## Mobile Layout

Legendary Win is visually heavier than other tiers.

Recommended layout:

```text
top: LEGENDARY WIN text
middle: gold prize objects on green podium
below middle: win amount
bottom: tap to continue / auto-close
```

Suggested coordinates:

```ts
legendaryWinText.x = W / 2;
legendaryWinText.y = H * 0.18;

legendaryWinStage.x = W / 2;
legendaryWinStage.y = H * 0.58;

amountText.x = W / 2;
amountText.y = H * 0.72;
```

## Implementation Priority

1. Add files to public assets.
2. Load `legendarywin_text` and `legendarywin` through Spine runtime.
3. Extend `WinOverlay` to support tier `"legendary"`.
4. Add win tier selection.
5. Show Legendary Win for the largest bonus/claim results.


## Confetti Overlay

A shared Spine confetti effect is available:

```text
docs/asset-map-confetti-spine.md
source/spine/confetti/
```

Use it as an optional top overlay for win/result screens.
