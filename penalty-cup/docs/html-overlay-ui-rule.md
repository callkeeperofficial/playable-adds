# HTML Overlay UI Rule

## Core Rule

Use a hybrid rendering architecture:

```text
PixiJS canvas:
- gameplay scene
- Spine assets
- background
- gates
- goalkeeper
- ball
- target cursor markers
- roulette wheel if convenient
- win animations
- confetti

HTML/CSS overlay:
- menu
- header UI if not using an image asset
- balance pill
- hamburger menu
- modal panels without dedicated image assets
- buttons without dedicated image assets
- text-heavy UI
- settings/help screens
- Buy Bonus text labels
- Bet selector
- Difficulty selector
- Claim button
- Last Win
- toast/errors
- How to play
```

If there is no atlas, Spine asset, or dedicated image for a UI element, do not draw it manually in PixiJS unless it is gameplay-critical.

Draw it with normal HTML/CSS above the canvas.

## Why

HTML/CSS is better for:
- crisp text;
- buttons;
- menus;
- responsive mobile layout;
- flex/column positioning;
- tap areas;
- modals;
- accessibility;
- quick iteration.

PixiJS is better for:
- game scene;
- Spine runtime;
- animations;
- particles/effects;
- interactive target markers if tied to game coordinates.

## Page Structure

Recommended DOM:

```html
<body>
  <div id="app">
    <canvas id="game-canvas"></canvas>

    <div id="ui-overlay">
      <header id="mobile-header"></header>
      <div id="hud"></div>
      <div id="bottom-panel"></div>
      <div id="modal-root"></div>
      <div id="toast-root"></div>
    </div>
  </div>
</body>
```

CSS:

```css
html,
body,
#app {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#app {
  position: relative;
  background: #000;
}

#game-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

#ui-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
}

#ui-overlay button,
#ui-overlay [data-clickable="true"] {
  pointer-events: auto;
}
```

## Pointer Events

Default overlay should not block gameplay:

```css
#ui-overlay {
  pointer-events: none;
}
```

Only real UI controls should receive input:

```css
button,
.modal,
.clickable,
[data-clickable="true"] {
  pointer-events: auto;
}
```

When a modal is open, the modal backdrop should block gameplay clicks:

```css
.modal-backdrop {
  pointer-events: auto;
}
```

## Communication Between HTML and PixiJS

Use a small event/state bridge.

Example:

```ts
ui.on("difficultyChanged", (difficulty) => game.setDifficulty(difficulty));
ui.on("betChanged", (bet) => game.setBet(bet));
ui.on("claimClicked", () => game.claim());
ui.on("buyBonusClicked", () => game.openBuyBonus());

game.events.on("balanceChanged", (balance) => ui.setBalance(balance));
game.events.on("shotsChanged", (shotsLeft) => ui.setShots(shotsLeft));
game.events.on("stateChanged", (state) => ui.renderForState(state));
```

Do not tightly couple DOM components directly to Pixi internals.

## Mobile Header

If using image asset:

```text
source/ui/mobile/logoMobile.8dd41027.png
```

Render logo in HTML:

```html
<img src="/assets/ui/mobile/logoMobile.8dd41027.png" class="logo" />
```

Balance and menu should be HTML:

```html
<div class="balance-pill">$1 000 000</div>
<button class="menu-button">☰</button>
```

## Bottom Panel

Use HTML/CSS for bottom panel.

Recommended structure:

```html
<div class="bottom-panel">
  <div class="top-row">
    <button class="difficulty-control">EASY</button>
    <button class="bet-control">$200</button>
  </div>

  <div class="bottom-row">
    <div class="last-win">$0</div>
    <button class="claim-button">CLAIM</button>
  </div>
</div>
```

In bonus mode:

```html
<button class="bet-control">
  <span>15 SHOTS</span>
  <span>$200</span>
</button>
```

## Buy Bonus Overlay

Use HTML/CSS overlay for structure and dynamic labels.

Card backgrounds are PNG:

```text
source/ui/bonus_buy_cards/bonusbuyBronzeMobile.b369f44a.png
source/ui/bonus_buy_cards/bonusbuySilverMobile.3ace4b37.png
source/ui/bonus_buy_cards/bonusbuyGoldMobile.fc35bf64.png
```

HTML should place dynamic text above the card background:

```html
<button class="bonus-card easy">
  <img src="/assets/ui/bonus_buy_cards/bonusbuyBronzeMobile.b369f44a.png" />
  <div class="bonus-card-label">EASY</div>
  <div class="bonus-card-max-win">MAX WIN 100.64x</div>
  <div class="bonus-card-price">$6 000</div>
</button>
```

## Roulette Overlay

Roulette can be Pixi or HTML.

Recommended:
- wheel/arrow in PixiJS if rotation is easier there;
- title, close button, selected shots text can be HTML.

Alternative:
- use CSS transform rotate on an `<img>` wheel if Codex prefers HTML.

Either is acceptable as long as:
- wheel rotates;
- arrow stays fixed;
- selected shots result is passed back to game state.

## WinOverlay

Win animations remain PixiJS/Spine.

HTML can be used for:
- amount text;
- tap to continue;
- close/tap overlay;
- debug/test controls.

Layer:

```text
PixiJS:
  bg jpg / win Spine / confetti Spine

HTML:
  amount text
  tap to continue
```

## What Not To Do

Do not draw every button and text label with PixiJS `Text`/`Graphics` unless it is attached to game world coordinates.

Do not hardcode UI positions only in canvas coordinates if the UI is basically menu/HUD.

Do not rebuild HTML-like layouts inside Pixi when CSS flex/absolute layout is simpler.

## Required Codex Behavior

Codex must implement the game as:

```text
PixiGame.ts       — canvas/game/spine scenes
HtmlUI.ts         — DOM UI layer
GameState.ts      — shared state / events
```

or an equivalent separation.

The important rule:

```text
Assets and animations in PixiJS.
Menus and missing UI in HTML/CSS overlay.
```
