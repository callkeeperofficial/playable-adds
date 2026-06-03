# Chicken Pilot Implementation Guide

This file is the working specification for the `chicken-pilot` playable game.
Read it before implementing or changing this game.

## Project Goal

Build a browser playable using the same structure and interaction model as
Chicken Crash, but with plane-themed hazards instead of road cars.

The implementation must use Vite, TypeScript, and PixiJS. Keep the controls and
page chrome in normal HTML/CSS, and keep the central game scene in PixiJS.

Repository-wide conventions, local port reservations, GitHub Pages URLs, and
the shared deployment pipeline are defined in `../AGENTS.md`.

## Local Development

Run this game's Vite development server on its reserved port:

```sh
npm run dev -- --host 0.0.0.0 --port 5176
```

Use this URL for local browser verification:

```text
http://localhost:5176/
```

## Current Scaffold

This project is intentionally scaffolded from `chicken-crash` so the layout,
controls, canvas placement, and controller flow match the existing playable.

Dedicated plane-themed visuals are not present yet. Until they are supplied,
the scaffold keeps placeholder Chicken Crash assets and exposes separate
Chicken Pilot source/runtime asset locations so replacements can be dropped in
without touching other games.

## Architecture Boundary

Use normal semantic HTML elements for:

- Header and logo.
- Balance or marketing pool.
- `How to play?`, fullscreen, and menu buttons.
- Live-wins block.
- Bottom control panel.
- Stake, difficulty, autoplay, `Play`, `Go`, and `Cash out` controls.

Use PixiJS for:

- The playable route and background.
- Chicken animation.
- Step markers and payout labels.
- Plane hazards.
- Collision and win animation.
- Camera movement and scene effects.

The Pixi canvas must occupy the area between the header and controls, matching
the Chicken Crash layout approach.

## Source Material

Keep source assets in `assets/source/` and runtime assets in `public/assets/`.
When plane-themed assets arrive, replace or add them inside this project only.
Do not borrow from another playable at runtime unless it is intentionally copied
into `chicken-pilot`.
