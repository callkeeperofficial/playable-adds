# Chicken Road Public API

Repository-wide rules for building this API live in
[`../PUBLIC_API.md`](../PUBLIC_API.md).

Chicken Road exposes a small browser API for host pages that embed the
playable. The API is available on `window.ChickenRoad` after the game script
has loaded.

```ts
type ChickenRoadPublicApi = {
  observeInstallButton(callback: (event: MouseEvent) => void): () => void;
  observePlayMarketButton(callback: (event: MouseEvent) => void): () => void;
  showGame(): void;
  hideGame(): void;
  showFinalWinScreen(prize?: number): void;
  hideFinalWinScreen(): void;
};
```

## Host Element

Mount the playable inside:

```html
<div id="chicken-road"></div>
```

Scope any host-page styling outside this root. The playable styles live under
`#chicken-road` in `src/style.css`.

## CTA Observers

Use observers to react when the player taps the final win-screen buttons. The
game does not navigate, open stores, or install anything by itself. The host
page owns those actions.

```js
const unsubscribeInstall = window.ChickenRoad.observeInstallButton((event) => {
  event.preventDefault();
  openInstallFlow();
});

const unsubscribePlayMarket = window.ChickenRoad.observePlayMarketButton(() => {
  window.location.href = 'https://play.google.com/store/apps/details?id=example';
});
```

Both observer methods return an unsubscribe function:

```js
unsubscribeInstall();
unsubscribePlayMarket();
```

## Visibility Controls

`showGame()` makes the playable visible, resets it to the starting state, and
resumes the Pixi ticker.

```js
window.ChickenRoad.showGame();
```

`hideGame()` stops autoplay, resets the playable, pauses the Pixi ticker, and
hides the root game element.

```js
window.ChickenRoad.hideGame();
```

## Final Win Screen Preview

`showFinalWinScreen(prize?)` opens the final win overlay with the `Install` and
`Download from Play Market` buttons. The optional `prize` argument sets the
amount shown in the panel. It defaults to `42.12`.

```js
window.ChickenRoad.showFinalWinScreen(128.5);
```

`hideFinalWinScreen()` closes only preview overlays opened through the API.

```js
window.ChickenRoad.hideFinalWinScreen();
```

During normal gameplay wins, the overlay blocks the game. The player can only
use **Install** or **Download from Play Market**. Host `hideFinalWinScreen()`
does not close those in-game wins.

## In-Game Win Triggers

The final win overlay also opens when the player:

- reaches the prize pad at the end of the route;
- taps **Cash Out** during a run.

## Published URL

https://callkeeperofficial.github.io/playable-adds/chicken-road/

## Asset URLs

When embedding from GitHub Pages, static assets resolve from:

```text
https://callkeeperofficial.github.io/playable-adds/chicken-road/assets/
```

## Host Integration Example

```js
const api = window.ChickenRoad;

const stopInstallObserver = api.observeInstallButton(() => {
  api.hideGame();
  openInstallFlow();
});

const stopMarketObserver = api.observePlayMarketButton(() => {
  api.hideGame();
  window.location.assign('https://play.google.com/store/apps/details?id=example');
});

api.showGame();

// When the host tears down the placement:
stopInstallObserver();
stopMarketObserver();
api.hideGame();
```
