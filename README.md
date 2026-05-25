# Chicken Road Playable Ad

PixiJS + Vite + TypeScript playable prototype based on provided notes.

## Features
- Reference-style Chicken Road scene with dark brick dungeon, glowing grills, logo, counters, controls, and roasted result state.
- 10 visible grills, only forward movement.
- Click/tap to jump to next grill.
- Animated fire and glow effects on grills.
- Roast chance increases with progress.
- Hidden final prize after the final grill.
- Win/lose state with Play Again.
- Generated assets (placeholder quality) in `public/assets`.
- HTML prototypes:
  - `chicken_playable.html`
  - `chicken_playable_v2.html`
  - `chicken_square_playable.html`
  - `chicken_scroll_fire.html`
  - `chicken_prize_panel.html`
  - `chicken_prize_panel_v2.html`

## Run
```bash
npm install
npm run dev
```

## Deploy (GitHub Pages)
Push to `main` branch and enable Pages from GitHub Actions.
