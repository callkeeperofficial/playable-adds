# Chicken Crash Public API

Chicken Crash exposes a small browser API for host pages that embed the
playable. The API is available on `window.ChickenCrash` after the game script
has loaded.

```ts
type ChickenCrashPublicApi = {
  observeInstallButton(callback: (event: MouseEvent) => void): () => void;
  observePlayMarketButton(callback: (event: MouseEvent) => void): () => void;
  showGame(): void;
  hideGame(): void;
};
```

## CTA Observers

Use observers to react when the player taps the final win-screen buttons. The
game does not navigate, open stores, or install anything by itself. The host
page owns those actions.

```js
const unsubscribeInstall = window.ChickenCrash.observeInstallButton((event) => {
  event.preventDefault();
  openInstallFlow();
});

const unsubscribePlayMarket = window.ChickenCrash.observePlayMarketButton(() => {
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
resumes the scene ticker.

```js
window.ChickenCrash.showGame();
```

`hideGame()` stops autoplay, resets the playable, pauses the scene ticker, and
hides the root game element.

```js
window.ChickenCrash.hideGame();
```

Use `hideGame()` when the host needs to fully remove the playable from view,
for example after routing away from the ad placement or replacing it with a
native install flow.

## Public Files

The production playable is published at:

```text
https://callkeeperofficial.github.io/playable-adds/chicken-crash/
```

Vite uses a relative `base`, so runtime files are loaded relative to that page.
The hashed JavaScript and CSS files are generated during `vite build` and are
referenced from `index.html`; do not hard-code those hashed names in host-page
integrations.

### Page

| File | Public URL |
| --- | --- |
| Game page | `https://callkeeperofficial.github.io/playable-adds/chicken-crash/` |

### Required Runtime Assets

| File | Public URL |
| --- | --- |
| `assets/logo.png` | `https://callkeeperofficial.github.io/playable-adds/chicken-crash/assets/logo.png` |
| `assets/objects-sprite.png` | `https://callkeeperofficial.github.io/playable-adds/chicken-crash/assets/objects-sprite.png` |
| `assets/chicken-sprite.png` | `https://callkeeperofficial.github.io/playable-adds/chicken-crash/assets/chicken-sprite.png` |
| `assets/start-bg.png` | `https://callkeeperofficial.github.io/playable-adds/chicken-crash/assets/start-bg.png` |
| `assets/finish-bg.png` | `https://callkeeperofficial.github.io/playable-adds/chicken-crash/assets/finish-bg.png` |
| `assets/win-notification.png` | `https://callkeeperofficial.github.io/playable-adds/chicken-crash/assets/win-notification.png` |
| `assets/win-notification-mobile.png` | `https://callkeeperofficial.github.io/playable-adds/chicken-crash/assets/win-notification-mobile.png` |
| `assets/spine/chiken/chiken.json` | `https://callkeeperofficial.github.io/playable-adds/chicken-crash/assets/spine/chiken/chiken.json` |
| `assets/spine/chiken/chiken.atlas` | `https://callkeeperofficial.github.io/playable-adds/chicken-crash/assets/spine/chiken/chiken.atlas` |
| `assets/spine/chiken/chiken.png` | `https://callkeeperofficial.github.io/playable-adds/chicken-crash/assets/spine/chiken/chiken.png` |

### Audio Assets

Audio files are loaded lazily when their sounds are first played.

| File | Public URL |
| --- | --- |
| `assets/audio/car.webm` | `https://callkeeperofficial.github.io/playable-adds/chicken-crash/assets/audio/car.webm` |
| `assets/audio/cashout.webm` | `https://callkeeperofficial.github.io/playable-adds/chicken-crash/assets/audio/cashout.webm` |
| `assets/audio/chick.webm` | `https://callkeeperofficial.github.io/playable-adds/chicken-crash/assets/audio/chick.webm` |
| `assets/audio/jump.webm` | `https://callkeeperofficial.github.io/playable-adds/chicken-crash/assets/audio/jump.webm` |
| `assets/audio/lose.webm` | `https://callkeeperofficial.github.io/playable-adds/chicken-crash/assets/audio/lose.webm` |
| `assets/audio/win.webm` | `https://callkeeperofficial.github.io/playable-adds/chicken-crash/assets/audio/win.webm` |

## Example Integration

```js
const api = window.ChickenCrash;

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
- The playable root element is `#chicken-crash-playable`.
- The playable does not style or mutate the host page `body`; all game styles
  are scoped under `#chicken-crash-playable`.
- The final CTA buttons are regular DOM buttons rendered above the PixiJS game
  canvas.
- Observer callbacks receive the original `MouseEvent`.
- If a callback throws, the game rethrows that error asynchronously so other
  registered callbacks can still run.
