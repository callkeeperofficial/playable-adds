# Chicken Crash Implementation Guide

This file is the working specification for the `chicken-crash` playable game.
Read it before implementing or changing the game. Keep it updated when product
behavior is clarified.

## Project Goal

Build a browser playable inspired by the supplied Chicken Road references. The
player advances a chicken across a road one manhole at a time. Each successful
step increases the current round payout. The player can cash out or risk another
step. A vehicle collision loses only the payout from the current round.

The implementation must use Vite, TypeScript, and PixiJS.

Repository-wide conventions, local port reservations, GitHub Pages URLs, and
the shared deployment pipeline are defined in `../AGENTS.md`. Read that file
before changing this game or the repository workflow.

## Local Development

During development, run this game's Vite development server on its reserved
port:

```sh
npm run dev -- --host 0.0.0.0 --port 5174
```

Use this URL for local browser verification:

```text
http://localhost:5174/
```

- Keep port `5174` stable so visual checks and browser automation target the
  same URL throughout development.
- Use the local Vite server for iterative desktop and mobile checks.
- Verify both sides of the responsive breakpoint, including widths just below
  and at `1000px`.
- Use a production build before publishing.

## Source Material

Do not modify or overwrite the source assets. They are stored in:

- `assets/source/chicken-sprite.png`
- `assets/source/objects-sprite.png`
- `assets/source/start-bg.png`
- `assets/source/finish-bg.png`
- `assets/source/logo.png`
- `assets/source/win-notification.png`
- `assets/source/audio/car.webm`
- `assets/source/audio/cashout.webm`
- `assets/source/audio/chick.webm`
- `assets/source/audio/jump.webm`
- `assets/source/audio/lose.webm`
- `assets/source/audio/win.webm`

Visual references are stored in `references/`:

- `layout-desktop.png`
- `layout-mobile.png`
- `controls-desktop.png`
- `controls-mobile.png`
- `header-mobile.png`
- `round-active-desktop.png`
- `finish-area.png`
- `chicken-crashed.png`
- `gameplay-reference.mov`

Use the original sprite sheets by cropping PixiJS textures. Do not redraw
sprite-sheet objects with CSS or substitute generic artwork unless a required
element is genuinely missing.

## Hard Architecture Boundary

The page has two rendering layers. Keep their responsibilities separate.

### HTML, CSS, and DOM JavaScript

Use normal semantic HTML elements for all controls and page chrome:

- Top header.
- Logo.
- Balance or marketing pool.
- `How to play?`, fullscreen, and menu buttons.
- `Live wins` block and online count.
- Bottom controls panel.
- `MIN` and `MAX` buttons.
- Stake buttons.
- Difficulty control.
- `Play`, `Go`, `Cash out`, and autoplay controls.
- Disabled, active, hover, and focus states.

Do not render these controls inside PixiJS. The controls must remain standard
web elements so they can be styled responsively and remain easy to interact
with.

### PixiJS Canvas

Use PixiJS only for the central game scene:

- Road, sidewalks, start area, and finish area.
- Chicken and its animation parts.
- Manholes and their multiplier labels.
- Passed-step medal markers.
- Barriers.
- Cars and collision animation.
- Camera movement.
- Finish walk-off sequence.
- Scene-level effects.

The Pixi canvas occupies the area between the header and controls. It should not
draw the page header or controls panel.

### Shared Controller

A TypeScript controller owns game state and coordinates both layers:

- DOM events request game actions.
- The Pixi scene performs visual sequences and reports outcomes.
- The controller updates controls, displayed values, audio, and storage.

Keep game rules out of DOM styling code and keep DOM concerns out of Pixi scene
objects.

## Responsive Layout

There are exactly two primary layouts:

- Mobile: viewport width `< 1000px`.
- Desktop: viewport width `>= 1000px`.

The names `mobile` and `desktop` refer to these width ranges, not device
detection.

### Desktop

- Header is a compact horizontal row.
- Logo is always visible at the top left.
- Controls panel spans the bottom of the page.
- Stake controls sit on the left.
- Difficulty appears as a horizontal segmented control.
- Primary action buttons sit on the right.
- The canvas uses the remaining central region.

### Mobile

- Logo remains at the top left.
- Header is simplified but remains normal HTML.
- Controls panel is a stacked card below the canvas.
- Stake buttons form a row.
- Difficulty uses a select-like dropdown.
- Primary actions are large touch targets.
- Canvas framing shows the start sidewalk and nearby road section.

Match the supplied reference screenshots before adding decorative refinements.

## Core Game Model

Recommended controller state:

```ts
type GamePhase =
  | 'ready'
  | 'jumping'
  | 'active'
  | 'crashed'
  | 'finishing'
  | 'won';

type Difficulty = 'easy' | 'medium' | 'hard' | 'hardcore';
type Stake = 2 | 3 | 8 | 20;
```

Track at least:

- `phase`: current game phase.
- `stake`: selected base stake.
- `difficulty`: selected difficulty.
- `stepIndex`: current position in the route.
- `roundValue`: unbanked payout currently at risk.
- `bankedTotal`: player payout saved between rounds.
- `marketingPool`: decorative available-winnings amount for the current page
  session.
- `autoplayEnabled`: whether autoplay is active.

Keep configurable values in one central config module:

- About `20` route steps.
- Multiplier tables for each difficulty.
- Collision chance table for each difficulty.
- Finish bonus.
- Camera timing.
- Jump timing.
- Delay between autoplay steps.
- Win message duration.
- Live-win frequency and duration.
- Initial marketing pool.

The exact balance values are not yet fixed. Do not scatter provisional numbers
through rendering code.

## Round Lifecycle

### Ready

- Chicken stands in the start area.
- Stake and difficulty controls are enabled.
- `Play` is visible.
- `Go` and `Cash out` are not active.
- The route is reset to its initial visual state.

### Start

- Pressing `Play` starts a new round and immediately performs the first jump.
- Stake and difficulty become locked until the round ends.
- During movement, action buttons must not trigger overlapping transitions.

### Successful Step

- Chicken lands on the next manhole.
- Current payout becomes `stake * multiplierForCurrentStep`.
- The passed manhole behind the chicken is replaced by the gold medal marker
  with the roasted-chicken symbol.
- A road barrier appears in the completed area in front of the passed region.
- Vehicles can no longer drive through the protected completed region.
- The camera follows the chicken and keeps no more than one previous manhole
  visible to the left.
- When movement ends, show or enable `Cash out` and `Go`.
- `Cash out` displays the current payout.

### Go

- Pressing `Go` attempts exactly one additional jump.
- While jumping, temporarily disable actions.
- Resolve either a successful landing, collision, or finish.

### Cash Out

- Pressing `Cash out` banks the current round payout.
- Add `roundValue` to `bankedTotal`.
- Subtract the same amount from `marketingPool`.
- Persist `bankedTotal`.
- Play `audio/cashout.webm`.
- Reset the scene and begin a fresh ready state.

### Collision

- If a vehicle hits the chicken, lose `roundValue` only.
- Do not reduce `bankedTotal`.
- Display `0 USD` on the disabled cash-out control during the loss sequence.
- Play `audio/lose.webm`.
- Run the multipart crushed-chicken animation.
- Reset the route and return to `ready` after a short delay.

### Finish

- After the final manhole, reveal or enter the finish area.
- Chicken leaves the road and walks onto the finish path.
- Show the supplied `win-notification.png` treatment with the payout amount.
- Play `audio/win.webm`.
- Add the earned payout and configured finish bonus to `bankedTotal`.
- Subtract the awarded amount from `marketingPool`.
- Persist `bankedTotal`.
- Reset the scene and return to `ready` after the win message.

## Route and Camera

- Build a horizontally progressing route of about `20` manholes.
- Each unpassed manhole displays its multiplier.
- Before a round starts, all manholes are muted gray. During a round, only the
  next manhole immediately ahead of the chicken is shown in its normal active
  treatment; later manholes remain muted gray until they become the next step.
- The chicken advances one manhole per action.
- While the chicken is standing on a manhole, hide that manhole and its
  multiplier beneath the chicken. Replace it with a gold medal only after the
  chicken advances again.
- Camera motion should be smooth and follow the chicken horizontally.
- After progression begins, retain at most one prior manhole to the left of the
  chicken in the visible scene.
- Do not move the DOM header or controls with the camera.
- Use barriers to communicate that completed lanes are closed to vehicles.
- Cars should remain a threat only in upcoming unprotected lanes.
- Cars also drive through upcoming unprotected lanes periodically for visual
  atmosphere, independently of collision outcomes.
- Cars always enter from the top of the road and drive downward. Do not add
  upward traffic.
- Decorative cars may also enter a completed lane, stop just before its
  barrier, wait briefly, and disappear. They cannot hit the chicken there.
- A car already driving in a lane when its barrier appears must also stop before
  the barrier. No vehicle may visually pass through a barrier.

## Chicken Composition and Interaction

Build the chicken as a PixiJS `Container` from cropped pieces in
`chicken-sprite.png`. Keep named child parts so they can be animated separately.

Required sequences:

- Idle pose.
- Jump forward.
- Successful landing.
- Finish walk-off.
- Collision breakup.

### Collision Breakup

The collision is not a static replacement image. Match
`references/chicken-crashed.png`:

- Hide the intact assembled chicken.
- Reuse sprite-sheet pieces for body, head, eyes, wings, legs, and feathers.
- Give pieces different trajectories, rotations, and deceleration.
- Keep the motion readable and brief.

### Chicken Click

The chicken itself is interactive inside the canvas:

- Use a forgiving hit area around the chicken container.
- Clicking the chicken plays `audio/chick.webm`.
- Clicking the chicken has no other effect.
- It must not advance the route, alter payout, or interrupt an animation.

## Cars and Barriers

- Crop vehicle sprites from `objects-sprite.png`.
- Use multiple available vehicle types for visual variety.
- Vehicles travel through active road lanes.
- A collision outcome should visually align a vehicle pass with the chicken
  breakup.
- Play `audio/car.webm` when the relevant vehicle movement is presented.
- Crop barriers from `objects-sprite.png`.
- Add barriers as completed route sections become protected.

## Controls Panel

Implement the controls panel entirely with HTML and CSS.

### Ready State

- `MIN` button.
- Current stake value.
- `MAX` button.
- Stake buttons: `2`, `3`, `8`, and `20` dollars.
- Difficulty chooser.
- Autoplay toggle button.
- Large green `Play` button.

### Active Round State

- Stake and difficulty controls remain visible but disabled.
- Replace the large ready action treatment with:
  - Green `Go` button.
  - Yellow `Cash out` button showing current USD value.
- Hide the autoplay toggle after the round begins. Autoplay can only be changed
  before the first jump.

### Stake

- Stake is the base amount multiplied by the manhole coefficient.
- Stake is editable only before a round begins.
- `MIN` selects the smallest available stake.
- `MAX` selects the largest available stake.

### Difficulty

- Difficulty is editable only before a round begins.
- Higher difficulty produces larger multipliers and higher collision chances.
- Desktop uses segmented options: `Easy`, `Medium`, `Hard`, `Hardcore`.
- Mobile uses a select-like dropdown.

### Autoplay

- Add a normal HTML autoplay toggle next to the primary action.
- The reference uses a circular-arrows and play icon.
- Autoplay starts or continues a round automatically.
- After each successful landing, wait briefly and request the next step.
- By default autoplay does not cash out automatically.
- Autoplay continues until collision or successful finish, then switches off.
- Avoid overlapping jump requests when animations are still running.

## Header

Implement the header entirely with HTML and CSS.

- Always show `assets/source/logo.png` at the top left.
- Show the marketing pool on the right in a rounded field with a dollar marker.
- Desktop also shows `How to play?`, fullscreen, and menu buttons.
- Mobile uses the simplified reference layout.
- Header controls may be decorative unless behavior is specifically requested,
  except fullscreen can use the normal browser fullscreen API when implemented.

## Live Wins and Online Count

Add an HTML overlay at the upper left of the playable scene:

- Show `Live wins:`.
- Show a green status indicator.
- Show `Online:` and a decorative count.
- Periodically show one mock winner row.
- Winner row includes an avatar treatment, truncated name, and positive USD
  amount.
- Animate the row in, keep it visible briefly, then animate it out.

Prepare a fixed local list of mock winners in config. The messages are
decorative and do not affect the player's round.

When a mock win message is shown:

- Subtract the mock amount from `marketingPool`.
- Do not persist the change.

The online count is decorative. It may vary gently within a configured range.

## Persistence

Use `localStorage` only for the player's banked winnings.

Persist:

- `bankedTotal`.

Do not persist:

- Current round value.
- Current step.
- Current camera position.
- Autoplay state.
- Marketing pool.
- Mock live-win history.
- Online count.

Refreshing the page starts a clean route with the saved banked total intact.
The marketing pool returns to its configured initial value.

## Audio Map

- `audio/car.webm`: car movement or car appearance.
- `audio/cashout.webm`: player presses `Cash out`.
- `audio/chick.webm`: player clicks the chicken only.
- `audio/jump.webm`: chicken jump starts.
- `audio/lose.webm`: collision and loss.
- `audio/win.webm`: successful route finish.

Browser autoplay policies apply. Initialize or unlock audio after the first
user interaction. Do not add invented sounds for other controls unless new
assets are supplied.

## Suggested Source Layout

Use a small, explicit module structure:

```text
chicken-crash/
  AGENTS.md
  index.html
  package.json
  public/
    assets/
  src/
    main.ts
    styles.css
    config.ts
    controller.ts
    storage.ts
    audio.ts
    ui/
      controls.ts
      header.ts
      liveWins.ts
    scene/
      GameScene.ts
      ChickenActor.ts
      RouteView.ts
      VehicleLayer.ts
      FinishView.ts
      textures.ts
```

Keep this structure proportional. Merge files when an abstraction would be
empty, but preserve the DOM/Pixi boundary.

## Implementation Order

1. Scaffold the isolated Vite, TypeScript, and PixiJS app in `chicken-crash`.
2. Copy source assets into a runtime `public/assets/` layout without modifying
   the originals.
3. Crop and document texture rectangles from both sprite sheets.
4. Build the responsive page shell and HTML header.
5. Build the HTML controls panel for desktop and mobile.
6. Create the Pixi scene with start area, road, manholes, and finish area.
7. Assemble the chicken container and implement idle and jump sequences.
8. Add the shared controller and state transitions.
9. Add camera tracking, passed-step medals, and barriers.
10. Add vehicles, collision resolution, and breakup animation.
11. Add finish walk-off and win notification.
12. Add persistence, marketing pool, live wins, and online count.
13. Add audio and chicken click interaction.
14. Add autoplay with transition locking.
15. Compare against every supplied screenshot at representative mobile and
    desktop widths.
16. Verify production build.
17. Follow the repository deployment requirements from `../AGENTS.md`.
18. Verify the deployed Chicken Crash game at its final subdirectory URL.

## Verification Checklist

Before considering implementation complete:

- Controls are real HTML elements, not Pixi sprites.
- Canvas contains only the game scene.
- Breakpoint behavior changes at `1000px`.
- Mobile and desktop panels resemble their references.
- Stake and difficulty lock during a round.
- `Play` performs the first jump.
- `Go` performs one jump only.
- Autoplay cannot overlap animations.
- `Cash out` banks winnings and starts a clean round.
- Collision loses only unbanked payout.
- Passed manholes become gold medal markers.
- Barriers appear behind progress.
- Camera leaves at most one previous manhole visible.
- Finish walk-off and notification work.
- Clicking the chicken only plays its sound.
- Mock live wins appear and disappear over time.
- Marketing pool decreases for mock wins and player payouts.
- Only `bankedTotal` persists after reload.
- Local development server runs on `http://localhost:5174/`.
- Production build succeeds.
- Repository-level deployment requirements from `../AGENTS.md` are satisfied.

## Current Non-Goals

Do not add backend APIs, authentication, real multiplayer, real monetary logic,
or network calls. This is a self-contained visual playable.

## Open Balance Parameters

Confirm or tune during implementation:

- Exact number of manholes, targeting about `20`.
- Multiplier sequence per difficulty.
- Collision chance per step and difficulty.
- Finish bonus amount or formula.
- Autoplay step delay.
- Live-win interval and mock dataset size.
- Initial marketing pool value.
- Decorative online-count range.
