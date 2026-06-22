# Asset Map: Big Win / Bonus Win Result Assets

## Files

Static background:

```text
source/win/bgBigWin.b5ddd5f5.jpg
```

Spine animated text:

```text
source/spine/bigwin_text/bigwin_text.png
source/spine/bigwin_text/bigwin_text.atlas
source/spine/bigwin_text/bigwin_text.json
```

Spine animated result decoration:

```text
source/spine/bigwin/bigwin.png
source/spine/bigwin/bigwin.atlas
source/spine/bigwin/bigwin.json
```

## Meaning

This is the result/win screen asset pack.

It is used after a successful high-value result, especially after Bonus Mode.

Likely screens:

```text
BIG WIN
BONUS WIN
EPIC WIN
```

Based on the uploaded files, it contains:

- dark blurred stadium background;
- gold `BIG WIN` animated text;
- gold football;
- glow around the ball;
- green cloth / podium / table;
- decorative light flashes;
- stadium/pedestal elements;
- entrance/idle/end animations.

## Static Background: bgBigWin

`bgBigWin.b5ddd5f5.jpg` is a static dark stadium background.

Use it as a dimmed result screen background behind the Spine win objects.

It should cover the whole mobile viewport using cover/crop behavior.

## Spine Asset: bigwin_text

### Type

Animated Spine title text.

It spells:

```text
BIG WIN
```

### Metadata

```text
Spine: 4.2.43
bounds: x=-424.1, y=553.12, width=849, height=300
bones: 16
slots: 25
skins: default
animations: 3
```

### Animations

```text
- bigwin_end
- bigwin_idle
- bigwin_start
```

### Purpose

Use for animated text on result screens:

```text
bigwin_start → bigwin_idle loop → bigwin_end
```

The animation includes:
- separate letters B / I / G / W / I / N;
- scaling pop-in;
- shine sweep;
- small additive glints;
- exit animation.

## Spine Asset: bigwin

### Type

Animated result decoration / stage.

### Metadata

```text
Spine: 4.2.43
bounds: x=-381.4, y=-746.71, width=762, height=1143.31
bones: 9
slots: 7
skins: default
animations: 4
transform constraints: 1
```

### Animations

```text
- big-epic_win_transition
- bigwin_end
- bigwin_idle
- bigwin_start
```

### Purpose

Use for the animated golden ball / pedestal / stadium win decoration.

Suggested flow:

```text
bigwin_start → bigwin_idle loop → bigwin_end
```

There is also:

```text
big-epic_win_transition
```

This likely transitions from Big Win to Epic Win or throws the gold ball away during escalation.

## Runtime Rule

Do not slice these PNG atlases manually.

Use Spine runtime for:

```text
bigwin_text.png + bigwin_text.atlas + bigwin_text.json
bigwin.png + bigwin.atlas + bigwin.json
```

The assets contain:
- timed animation;
- additive glints;
- separate letter bones;
- clipping masks for shine;
- transforms;
- animated ball and pedestal elements.

Manual slicing would lose the intended result animation.

## Suggested Result Screen Flow

When bonus mode ends or a big payout happens:

```ts
showResultOverlay(amount, resultType)
```

Flow:

```text
1. Fade in bgBigWin.
2. Play bigwin_text: bigwin_start.
3. Play bigwin: bigwin_start.
4. Show win amount text below/over the gold ball.
5. Loop:
   - bigwin_text: bigwin_idle
   - bigwin: bigwin_idle
6. On tap / timeout:
   - play bigwin_text: bigwin_end
   - play bigwin: bigwin_end
   - fade out overlay
   - return to gameplay
```

## Recommended Mobile Layout

```text
top: BIG WIN / BONUS WIN text
middle: gold ball + pedestal / table
below middle: amount text, e.g. $7.93k
bottom: continue / auto-close
```

Use responsive positioning:

```ts
bigWinText.x = W / 2;
bigWinText.y = H * 0.22;

bigWinStage.x = W / 2;
bigWinStage.y = H * 0.55;

amountText.x = W / 2;
amountText.y = H * 0.68;
```

## How It Connects to Existing Game

Use after:

```text
bonus_result
```

Also possible after a very large normal Claim.

Recommended trigger:

```ts
if (bonusMode.finished) {
  showBigWinOverlay(accumulatedWin, "BONUS WIN");
}
```

If the text asset only says `BIG WIN`, use it as-is visually. Overlay UI text can say `BONUS WIN` separately if needed.

## Implementation Priority

1. Copy files into public/assets/spine/bigwin and public/assets/spine/bigwin_text.
2. Load with Spine runtime.
3. Build `BigWinOverlay` component.
4. Play start/idle/end.
5. Show amount text.
6. Return to main game after tap or timeout.


## Relation to Mega Win

There is a parallel higher-tier result pack:

```text
docs/asset-map-megawin-result.md
source/win/bgMegaWin.9fd1952f.jpg
source/spine/megawin_text/
source/spine/megawin/
```

Recommended implementation: use one generic `WinOverlay` component with tier config instead of separate unrelated implementations.


## Confetti Overlay

A shared Spine confetti effect is available:

```text
docs/asset-map-confetti-spine.md
source/spine/confetti/
```

Use it as an optional top overlay for win/result screens.
