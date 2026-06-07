# Chicken Crash Project Guide

This file describes the `chicken-crash` playable and the boundaries for future
changes. Read it before editing this game. Repository-wide rules, port
reservations, deployment, and isolation requirements live in `../AGENTS.md`.

Detailed gameplay rules are intentionally kept in `MECHANICS.md`. Update both
files when a product decision changes both implementation boundaries and game
behavior.

## Project Summary

Chicken Crash is a standalone browser playable built with Vite, TypeScript, and
PixiJS. The player moves a chicken across a horizontal road one manhole at a
time. Each successful step increases the current payout multiplier. The player
can cash out or continue and risk being hit by traffic.

The game is self-contained: there are no backend APIs, authentication, network
gameplay calls, or real-money mechanics.

## Local Development

Use the reserved development URL for this playable:

```sh
npm run dev -- --host 0.0.0.0 --port 5174
```

```text
http://localhost:5174/
```

Run the production build before treating code changes as complete:

```sh
npm run build
```

## Main Files

- `src/main.ts`: game controller, phase transitions, payouts, autoplay,
  persistence, and decorative live-win updates.
- `src/scene.ts`: PixiJS scene, chicken actor, route, manholes, cars, barriers,
  current-multiplier badge, win notification, and camera.
- `src/ui.ts`: DOM header and controls panel.
- `src/styles.css`: desktop and mobile layout.
- `src/config.ts`: stakes, route size, multipliers, collision chances, mock
  live wins, and constants.
- `src/audio.ts`: pooled HTML audio playback.
- `src/storage.ts`: localStorage persistence for banked winnings.
- `MECHANICS.md`: detailed game rules and edge cases.

## Rendering Boundary

The project has two rendering layers. Keep this separation intact.

### DOM Layer

Use HTML and CSS for page chrome and controls:

- Header, logo, balance/pool, fullscreen/menu buttons.
- Live wins and online count overlay.
- Bottom controls panel.
- Stake, difficulty, autoplay, Play, Go, and Cash Out controls.
- Disabled, active, hover, focus, and responsive states.

Do not render gameplay controls inside PixiJS.

### PixiJS Layer

Use PixiJS for the central game scene:

- Start and finish locations.
- Road, sidewalk, manholes, lane markings, and camera movement.
- Chicken and its animations.
- Multiplier badge under the chicken.
- Manhole quality changes and flip animation.
- Cars, barriers, collisions, and finish/win notification visuals.

Do not render the DOM header or bottom controls inside PixiJS.

## Source Assets

Do not modify or overwrite source assets. Runtime copies live in
`public/assets/`; source material lives in `assets/source/`.

Current source assets include:

- `assets/source/chicken-sprite.png`
- `assets/source/objects-sprite.png`
- `assets/source/start-bg.png`
- `assets/source/finish-bg.png`
- `assets/source/logo.png`
- `assets/source/win-notification.png`
- `assets/source/win-notification-mobile.png`
- `assets/source/audio/*.webm`
- `assets/source/spine/chiken/*`

Use original asset proportions unless the user explicitly asks for scaling.
When scaling is required, keep it uniform and document the reason in the code or
asset notes if it is not obvious.

## Reference Material

Visual references are in `references/`:

- `layout-desktop.png`
- `layout-mobile.png`
- `controls-desktop.png`
- `controls-mobile.png`
- `header-mobile.png`
- `round-active-desktop.png`
- `finish-area.png`
- `chicken-crashed.png`
- `gameplay-reference.mov`

Before changing visuals, compare against the relevant reference at both desktop
and mobile widths.

## Responsive Layout

There are two primary layouts:

- Mobile: viewport width `< 1000px`.
- Desktop: viewport width `>= 1000px`.

These names describe CSS breakpoints, not device detection.

Mobile must remain usable on iPhone-sized screens, including:

- `375x667` iPhone SE class.
- `390x844` iPhone 12/13/14 class.
- `393x852` iPhone 14 Pro class.
- `430x932` iPhone Pro Max class.

The page uses `100dvh` where supported and safe-area insets for the mobile
header, canvas, and bottom controls. Keep horizontal and vertical overflow at
zero on the sizes above.

## Current UI Shape

Desktop:

- Compact top header.
- Large central canvas between header and controls.
- Bottom controls arranged horizontally.
- Difficulty appears as segmented tabs.
- Autoplay is a separate button near the primary action before a round starts.

Mobile:

- Compact top header with logo, pool, and menu.
- Canvas above the bottom controls.
- Bottom controls are a compact stacked card.
- Difficulty uses a native select-style control with a custom arrow.
- Autoplay sits next to Play before the round starts.
- During an active round, Cash Out and Go replace Play/autoplay.

## Gameplay Ownership

`src/main.ts` owns rules and state transitions. `src/scene.ts` owns visuals and
animation. `src/ui.ts` owns DOM rendering and events.

Keep rule decisions out of CSS and keep DOM layout concerns out of PixiJS scene
objects. When behavior changes, prefer updating `src/main.ts` and then exposing
small scene methods for visual support.

## Audio

Audio assets are HTML audio files in `public/assets/audio/`:

- `car.webm`
- `cashout.webm`
- `chick.webm`
- `jump.webm`
- `lose.webm`
- `win.webm`

Browser autoplay policies apply. Sounds are best triggered after a user
interaction. Do not invent new sounds unless matching assets are supplied.

## Persistence

Only the player's banked total is persisted in localStorage under the key from
`src/config.ts`.

Do not persist:

- Current round value.
- Current route step.
- Camera position.
- Autoplay state.
- Marketing pool.
- Live-win state.
- Online count.

## Verification Checklist

Before finishing code changes:

- `npm run build` passes.
- The app still runs on `http://localhost:5174/`.
- Desktop layout works at and above `1000px`.
- Mobile layout works below `1000px`, including iPhone SE size.
- No page overflow appears on mobile.
- Controls remain real HTML elements.
- Canvas contains only the game scene.
- Play, Go, Cash Out, autoplay, and disabled states behave as described in
  `MECHANICS.md`.
- Cars, barriers, collisions, and manhole state changes match `MECHANICS.md`.
- Win notification appears for both route finish and Cash Out.

## Non-Goals

Do not add backend services, authentication, real multiplayer, analytics,
external network calls, real-money accounting, or unrelated shared repository
changes for this playable.
