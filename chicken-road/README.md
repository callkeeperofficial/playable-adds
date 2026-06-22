# Chicken Road Canvas

PixiJS + Vite canvas prototype that recreates the Chicken Road UI with
vector-drawn game elements.

## Run

```bash
npm install
npm run dev
```

Local dev server: http://localhost:5173/

## Public API

Host integration is documented in [`PUBLIC_API.md`](PUBLIC_API.md). The global
entry point is `window.ChickenRoad` on the `#chicken-road` root element.

## Settings

Change `GAME_SETTINGS.padCount` in `src/main.ts` to adjust the number of pads. The multipliers, prize index, level width, and camera bounds are recalculated automatically.
