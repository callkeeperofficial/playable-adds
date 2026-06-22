# Playable Public API

Every playable in this repository exposes a small browser API for host pages
that embed the ad. The host page owns navigation, store links, and install
flows. The playable only renders the game and forwards CTA button clicks.

Read this file before adding or changing a playable API. Game-specific method
details and preview quirks live in `<game>/PUBLIC_API.md`.

## Goals

- One predictable integration surface across all playables.
- Host pages can show, hide, and tear down a placement without reloading.
- Final win-screen CTAs (`Install`, `Play Market`) are observable from outside.
- Preview helpers let QA open the win screen without playing a full session.
- Each playable keeps its API local to `window.<GameName>` and does not affect
  other games on the same page.

## Standard Surface

All playables implement this core contract:

```ts
type PlayablePublicApi = {
  observeInstallButton(callback: (event: MouseEvent) => void): () => void;
  observePlayMarketButton(callback: (event: MouseEvent) => void): () => void;
  showGame(): void;
  hideGame(): void;
  showFinalWinScreen(prize?: number, ...gameSpecificArgs): void;
  hideFinalWinScreen(): void;
};
```

| Method | Purpose |
| --- | --- |
| `observeInstallButton` | Subscribe to the final win-screen **Install** CTA. Returns unsubscribe. |
| `observePlayMarketButton` | Subscribe to the final win-screen **Play Market** CTA. Returns unsubscribe. |
| `showGame` | Show the root host, reset to start state, resume rendering/ticker. |
| `hideGame` | Reset, pause rendering/ticker, hide the root host. |
| `showFinalWinScreen` | Open the win overlay for host-page QA / design review. |
| `hideFinalWinScreen` | Close a preview win overlay opened through the API. |

Games may extend `showFinalWinScreen` with extra preview arguments. Document
those extensions only in that game's `PUBLIC_API.md`.

## Naming

| Item | Rule | Examples |
| --- | --- | --- |
| Global object | `window.<PascalCaseGameName>` | `window.ChickenCrash`, `window.PenaltyCup` |
| TypeScript type | `<PascalCaseGameName>PublicApi` | `ChickenCrashPublicApi` |
| Root host element | `#<kebab-case-game-slug>` | `#chicken-crash-playable`, `#penalty-cup` |
| Per-game docs | `<game>/PUBLIC_API.md` | `chicken-crash/PUBLIC_API.md` |

Do not reuse another playable's global name. Do not put shared API code in the
repository root — copy the pattern into each playable's `src/main.ts`.

## How To Implement

Implement the API in the playable's `src/main.ts` after assets load and the
game mounts.

### 1. Observer registry in `main.ts`

```ts
type ButtonObserver = (event: MouseEvent) => void;
type Unsubscribe = () => void;

const installObservers = new Set<ButtonObserver>();
const playMarketObservers = new Set<ButtonObserver>();

function subscribe(observers: Set<ButtonObserver>, callback: ButtonObserver): Unsubscribe {
  observers.add(callback);
  return () => {
    observers.delete(callback);
  };
}

function notifyObservers(observers: Set<ButtonObserver>, event: MouseEvent): void {
  Array.from(observers).forEach((observer) => {
    try {
      observer(event);
    } catch (error) {
      // Rethrow async so one failing host callback does not block the rest.
      window.setTimeout(() => {
        throw error;
      });
    }
  });
}
```

### 2. Wire UI / game callbacks

Pass `notifyObservers` into the UI layer or game class when final win CTAs are
rendered:

```ts
game.bindPublicApiCallbacks(
  (event) => notifyObservers(installObservers, event),
  (event) => notifyObservers(playMarketObservers, event),
);
```

In the win-screen HTML/DOM, call those callbacks from the CTA button click
handlers. Use `event.stopPropagation()` on the buttons so backdrop-dismiss
handlers do not fire at the same time.

### 3. Export on `window`

```ts
declare global {
  interface Window {
    PenaltyCup: PenaltyCupPublicApi;
  }
}

window.PenaltyCup = {
  observeInstallButton: (callback) => subscribe(installObservers, callback),
  observePlayMarketButton: (callback) => subscribe(playMarketObservers, callback),
  showGame: () => game.showGame(),
  hideGame: () => game.hideGame(),
  showFinalWinScreen: (prize, screen) => game.showFinalWinScreen(prize, screen),
  hideFinalWinScreen: () => game.hideFinalWinScreen(),
};
```

### 4. Game responsibilities

The game class (or main module) should own runtime behavior:

**`showGame()`**

- Set `host.hidden = false`.
- Reset playable state to the normal start flow.
- Resume Pixi ticker / scene updates.
- Run layout resize if needed.

**`hideGame()`**

- Stop autoplay and in-flight preview overlays.
- Reset internal state.
- Pause Pixi ticker / scene updates.
- Set `host.hidden = true`.

**`showFinalWinScreen(prize?, …)`**

- If hidden, call `showGame()` first.
- Mark the session as preview mode when opened through the API.
- Render the same final win overlay used in real gameplay.
- Default `prize` to `42.12` when omitted.

**`hideFinalWinScreen()`**

- Close only preview overlays opened via `showFinalWinScreen()`.
- Return to idle / start state.
- During normal in-game wins, the player dismisses through in-game UI; host
  `hideFinalWinScreen()` must not break that flow. Document any exception in
  the per-game file.

### 5. Scope and styling rules

- Scope all styles under the playable root (`#penalty-cup`, etc.). Do not style
  or mutate the host page `body`.
- Final CTA buttons are regular DOM elements above the canvas.
- Observer callbacks receive the original `MouseEvent`.
- Multiple observers may register for the same button; all are notified.

## Embedding In pwa-page

pwa-page embeds playables through `pwaData.playable` and `bootPlayable` in
`public/index.html`. Every playable shares **one asset slot** on the host:

```
/source/playable/assets/index.js
/source/playable/assets/index.css
/source/playable/assets/chicken-idle.png
/source/playable/assets/audio/…
```

Only one playable build is deployed into that slot at a time. The host copies
`dist/assets/*` from the selected game and renames the hashed entry files to
`index.js` / `index.css`.

### Asset URLs (`publicPath.ts`)

The bundle and static files live in the **same directory** on the host. Do not
build asset URLs with bare `import.meta.env.BASE_URL` + `assets/…` — the browser
resolves that relative to `index.js` and you get a double path:

```
/source/playable/assets/assets/foo.png   ❌
/source/playable/assets/foo.png          ✓
```

Before loading the playable script, the host sets:

```js
window.__PLAYABLE_PUBLIC_PATH__ = '/source/playable/';
```

Each playable **must** ship `src/publicPath.ts` and use it for every png,
webm, json, atlas, etc.

**Pattern A — base prefix** (chicken-crash):

```ts
export const publicPath =
  (window as Window & { __PLAYABLE_PUBLIC_PATH__?: string }).__PLAYABLE_PUBLIC_PATH__
  ?? import.meta.env.BASE_URL;

// usage: `${publicPath}assets/logo.png`
// embed  → /source/playable/assets/logo.png
// standalone dist → ./assets/logo.png (or ./logo.png depending on layout)
```

**Pattern B — helper** (chicken-road):

```ts
export function assetUrl(name: string): string {
  const hostPath = (window as Window & { __PLAYABLE_PUBLIC_PATH__?: string }).__PLAYABLE_PUBLIC_PATH__;
  if (hostPath) {
    const normalized = hostPath.endsWith('/') ? hostPath : `${hostPath}/`;
    return `${normalized}assets/${name}`;
  }
  const base = import.meta.env.BASE_URL;
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${name}`;
}

// usage: assetUrl('chicken-idle.png')
// embed  → /source/playable/assets/chicken-idle.png
// standalone → ./chicken-idle.png (bundle sits next to files in dist/assets/)
```

Pick one pattern per game and use it everywhere — Pixi `Assets.load`, `<img>`,
CSS `url()`, audio fetches.

### Root host styling

The playable root must cover the viewport when embedded. Scope styles under
the game selector and include:

```css
#<game-slug> {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
@supports (height: 100dvh) {
  #<game-slug> { height: 100dvh; }
}
```

pwa-page also applies `[data-playable-root] { position: fixed; inset: 0; … }`
when it creates the mount node.

### Host loader table (`PLAYABLE_LOADERS`)

Register each playable in `public/index.html` with the same shape:

| Field | Purpose |
| --- | --- |
| `rootId` | Must match the playable's `#host` selector (`#chicken-road`, `#penalty-cup`, …) |
| `publicPath` | Usually `'/source/playable/'` — copied to `__PLAYABLE_PUBLIC_PATH__` |
| `entry.js` / `entry.css` | `/source/playable/assets/index.js` and `index.css` |
| `waitForApi` | e.g. `() => window.ChickenRoad` |
| `show` | e.g. `(api) => api.showGame()` |

All playables use the same React bridge (`src/playables/registry.ts` →
`usePlayableBridge`):

| CTA | Host behaviour |
| --- | --- |
| **Install** | Keep the game visible. Call `prompt()` or `window.open(offer)` **synchronously** on click — do not `await` analytics first or the browser blocks popups. |
| **Play Market** | Open the offer / store URL synchronously, then `hideGame()` and mark the placement dismissed. |

The playable only notifies the host through observers; it never opens stores or
install flows itself.

Reference host files:

- `pwa-page/public/index.html` — bootstrap, `PLAYABLE_LOADERS`, `__PLAYABLE_PUBLIC_PATH__`
- `pwa-page/src/playables/registry.ts` — CTA wiring
- `pwa-page/src/hooks/usePlayableBridge.ts` — attach observers after API load
- `pwa-page/README.md` — short operational notes for deploy / copy dist

## Host Integration Example

```js
const api = window.PenaltyCup; // or window.ChickenCrash, etc.

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

## Checklist For A New Playable

1. Add `#<game-slug>` host element in `index.html`.
2. Add `src/publicPath.ts` and route **all** static asset URLs through it.
3. Style the root host with `position: fixed; inset: 0` (see **Embedding In pwa-page**).
4. Copy the observer helpers into `src/main.ts`.
5. Define `<GameName>PublicApi` and `declare global`.
6. Wire CTA buttons in the win overlay to `onInstallClick` / `onPlayMarketClick`.
7. Implement `showGame`, `hideGame`, `showFinalWinScreen`, `hideFinalWinScreen`
   on the game class.
8. Assign `window.<GameName>` after mount / asset load.
9. Register the playable in pwa-page `PLAYABLE_LOADERS` (`rootId`, `publicPath`, entry files, `waitForApi`, `show`).
10. Copy `dist/assets/*` into `pwa-page/public/source/playable/assets/`; rename hashed entries to `index.js` / `index.css`.
11. Create `<game>/PUBLIC_API.md` with:
   - exact global name and host selector;
   - published GitHub Pages URL;
   - game-specific `showFinalWinScreen` arguments and in-game win triggers;
   - any preview vs gameplay differences.
12. Mention the API in `<game>/AGENTS.md` if that game has local agent rules.

## Current Implementations

| Playable | Global | Host | Per-game docs |
| --- | --- | --- | --- |
| Chicken Crash | `window.ChickenCrash` | `#chicken-crash-playable` | `chicken-crash/PUBLIC_API.md` |
| Chicken Road | `window.ChickenRoad` | `#chicken-road` | `chicken-road/PUBLIC_API.md` |
| Penalty Cup | `window.PenaltyCup` | `#penalty-cup` | `penalty-cup/PUBLIC_API.md` |

Embed readiness:

| Playable | `publicPath.ts` | Fixed root CSS | pwa-page `rootId` |
| --- | --- | --- | --- |
| Chicken Crash | yes | yes | `#chicken-crash-playable` |
| Chicken Road | yes | yes | `#chicken-road` |
| Penalty Cup | **todo** | verify | **todo** (`app` → `#penalty-cup`) |

Reference implementations:

- `chicken-crash/src/main.ts`
- `chicken-road/src/main.ts`
- `penalty-cup/src/main.ts`

## What Does Not Belong In The API

- Hard-coded store URLs or install redirects inside the playable.
- Mutating host DOM outside the playable root.
- Shared mutable state between playables on the same page.
- Replacing in-game win flow with host-only shortcuts during normal gameplay.
