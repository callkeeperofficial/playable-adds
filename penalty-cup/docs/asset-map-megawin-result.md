# Asset Map: Mega Win Result Assets

## Files

Static background:

```text
source/win/bgMegaWin.9fd1952f.jpg
```

Spine animated text:

```text
source/spine/megawin_text/megawin_text.png
source/spine/megawin_text/megawin_text.atlas
source/spine/megawin_text/megawin_text.json
```

Spine animated result decoration:

```text
source/spine/megawin/megawin.png
source/spine/megawin/megawin.atlas
source/spine/megawin/megawin.json
```

## Meaning

This is the second-tier result/win screen pack: `MEGA WIN`.

It belongs to the same result-screen family as `BIG WIN`, but shows a larger win tier.

Visual contents:

- warm golden stadium background;
- animated gold `MEGA WIN` text;
- large trophy/cup;
- green cloth / pedestal;
- golden spotlight/glow;
- decorative trophy silhouettes;
- glints and shine effects.

## Static Background: bgMegaWin

`bgMegaWin.9fd1952f.jpg` is a static warm stadium result background.

Use it as full-screen result background for Mega Win.

Use cover/crop behavior on mobile.

## Spine Asset: megawin_text

### Type

Animated Spine title text spelling:

```text
MEGA WIN
```

### Metadata

```text
Spine: 4.2.43
bounds: x=-614.44, y=502.34, width=1155, height=404.19
bones: 18
slots: 29
skins: default
animations: 4
```

### Animations

```text
- megawin_end
- megawin_idle
- megawin_start
- megawin_transition
```

## Spine Asset: megawin

### Type

Animated trophy / pedestal / stage decoration.

### Metadata

```text
Spine: 4.2.43
bounds: x=-419.53, y=-746.71, width=849, height=1372.91
bones: 11
slots: 11
skins: default
animations: 4
transform constraints: 1
```

### Animations

```text
- megawin_end
- megawin_idle
- megawin_start
- megawin_transition
```

## Runtime Rule

Do not slice these PNG atlases manually.

Use Spine runtime for:

```text
megawin_text.png + megawin_text.atlas + megawin_text.json
megawin.png + megawin.atlas + megawin.json
```

These assets contain:
- separate animated letters;
- clipping masks for shine;
- additive glints;
- trophy mesh;
- pedestal/tribune transforms;
- start/idle/end timing.

Manual slicing is not acceptable.

## Suggested Result Tiers

Use a tier selector:

```ts
type WinTier = "big" | "mega";
```

Example threshold logic for playable:

```ts
function getWinTier(winAmount: number, bet: number): WinTier {
  const multiplier = winAmount / bet;

  if (multiplier >= 50) return "mega";
  return "big";
}
```

For bonus mode:

```text
bonus_result → choose tier → BigWinOverlay or MegaWinOverlay
```

## Suggested Mega Win Flow

```text
1. Fade in bgMegaWin.
2. Play megawin_text: megawin_start.
3. Play megawin: megawin_start.
4. Show win amount, e.g. $32.40k.
5. Loop:
   - megawin_text: megawin_idle
   - megawin: megawin_idle
6. On tap / timeout:
   - play megawin_text: megawin_end
   - play megawin: megawin_end
   - fade out
   - return to gameplay
```

## Relation to Big Win

Existing Big Win files:

```text
source/spine/bigwin_text/
source/spine/bigwin/
source/win/bgBigWin.b5ddd5f5.jpg
```

Mega Win files are a parallel higher-tier version:

```text
source/spine/megawin_text/
source/spine/megawin/
source/win/bgMegaWin.9fd1952f.jpg
```

Both should use the same generic component if possible:

```text
WinOverlay
```

Config:

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
  },
};
```

## Mobile Layout

Same layout as Big Win, but the trophy is larger.

Recommended:

```text
top: MEGA WIN text
middle: trophy / pedestal
below middle: win amount
bottom: tap to continue / auto-close
```

Suggested coordinates:

```ts
megaWinText.x = W / 2;
megaWinText.y = H * 0.20;

megaWinStage.x = W / 2;
megaWinStage.y = H * 0.57;

amountText.x = W / 2;
amountText.y = H * 0.70;
```

## Implementation Priority

1. Add files to public assets.
2. Load `megawin_text` and `megawin` through Spine runtime.
3. Extend existing `BigWinOverlay` into generic `WinOverlay`.
4. Add win tier selection.
5. Show Mega Win for larger bonus/claim results.


## Relation to Epic Win

There is a parallel higher-tier result pack:

```text
docs/asset-map-epicwin-result.md
source/win/bgEpicWin.9d8cce80.jpg
source/spine/epicwin_text/
source/spine/epicwin/
```

Recommended implementation: use one generic `WinOverlay` with tier config:

```text
big → mega → epic
```


## Confetti Overlay

A shared Spine confetti effect is available:

```text
docs/asset-map-confetti-spine.md
source/spine/confetti/
```

Use it as an optional top overlay for win/result screens.
