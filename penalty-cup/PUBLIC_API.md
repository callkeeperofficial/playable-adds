# Penalty Cup Public API

Repository-wide rules for building this API live in
[`../PUBLIC_API.md`](../PUBLIC_API.md).

Penalty Cup exposes a small browser API for host pages that embed the
playable. The API is available on `window.PenaltyCup` after the game script
has loaded.

```ts
type PenaltyCupPublicApi = {
  observeInstallButton(callback: (event: MouseEvent) => void): () => void;
  observePlayMarketButton(callback: (event: MouseEvent) => void): () => void;
  showGame(): void;
  hideGame(): void;
  showFinalWinScreen(prize?: number, screen?: number): void;
  hideFinalWinScreen(): void;
};
```

Win screens:

| Screen | Tier |
| --- | --- |
| `1` | Big Win |
| `2` | Mega Win |
| `3` | Epic Win |
| `4` | Legendary Win (default) |

During normal gameplay, the win screen is chosen from player actions:

| Screen | Trigger |
| --- | --- |
| `1` | 3rd `Claim` in the session |
| `2` | 6 goals in a row on **Easy**, or bonus series finished on **Easy** |
| `3` | 6 goals in a row on **Medium**, or bonus series finished on **Medium** |
| `4` | 6 goals in a row on **Hard**, or bonus series finished on **Hard** |

Use the optional `screen` argument in preview mode to inspect every tier.

## CTA Observers

Use observers to react when the player taps the final win-screen buttons. The
game does not navigate, open stores, or install anything by itself. The host
page owns those actions.

```js
const unsubscribeInstall = window.PenaltyCup.observeInstallButton((event) => {
  event.preventDefault();
  openInstallFlow();
});

const unsubscribePlayMarket = window.PenaltyCup.observePlayMarketButton(() => {
  window.location.href = 'https://play.google.com/store/apps/details?id=example';
});
```

Both observer methods return an unsubscribe function:

```js
unsubscribeInstall();
unsubscribePlayMarket();
```

Multiple callbacks may be registered for the same button. Each callback is
called when that button is clicked.

## Visibility Controls

`showGame()` makes the playable visible, resets it to the starting state, and
resumes the PixiJS ticker.

```js
window.PenaltyCup.showGame();
```

`hideGame()` resets the playable, pauses the PixiJS ticker, and hides the root
game element.

```js
window.PenaltyCup.hideGame();
```

Use `hideGame()` when the host needs to fully remove the playable from view,
for example after routing away from the ad placement or replacing it with a
native install flow.

## Final Win Screen Preview

`showFinalWinScreen(prize?, screen?)` opens a win screen with the matching PixiJS
Spine animation and the `Install` / `Download from Play Market` buttons. The
optional `prize` argument sets the dollar amount shown in the amount badge. It
defaults to `42.12`. The optional `screen` argument selects the win tier (`1`–
`4`). It defaults to `4` (Legendary Win).

```js
window.PenaltyCup.showFinalWinScreen(128.5, 1); // Big Win
window.PenaltyCup.showFinalWinScreen(128.5, 2); // Mega Win
window.PenaltyCup.showFinalWinScreen(128.5, 3); // Epic Win
window.PenaltyCup.showFinalWinScreen(128.5, 4); // Legendary Win
window.PenaltyCup.showFinalWinScreen(128.5);    // Legendary Win
```

`hideFinalWinScreen()` closes that preview overlay and returns the playable to
the idle state (or the country-select screen if the player has not confirmed a
country yet).

```js
window.PenaltyCup.hideFinalWinScreen();
```

Use these methods for host-page QA or design review without completing a full
bonus round.

## Example Integration

```js
const api = window.PenaltyCup;

const stopInstallObserver = api.observeInstallButton(() => {
  api.hideGame();
  showInstallModal();
});

const stopMarketObserver = api.observePlayMarketButton(() => {
  api.hideGame();
  window.location.assign('https://play.google.com/store/apps/details?id=example');
});

api.showGame();

// Later, when the host tears down this placement:
stopInstallObserver();
stopMarketObserver();
api.hideGame();
```

## Notes

- The API is intentionally local to this playable and does not affect other
  games in the repository.
- The playable root element is `#penalty-cup`.
- The playable does not style or mutate the host page `body`; all game styles
  are scoped under `#penalty-cup`.
- The final CTA buttons are regular DOM buttons rendered above the PixiJS game
  canvas.
- Observer callbacks receive the original `MouseEvent`.
- If a callback throws, the game rethrows that error asynchronously so other
  registered callbacks can still run.
- During normal bonus completion, the same final win overlay appears with a
  continue hint. `hideFinalWinScreen()` only closes preview overlays opened
  through `showFinalWinScreen()`, not the in-game bonus result screen.
