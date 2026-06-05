# Chicken Pilot Mechanics

This file describes how `chicken-pilot` plays, what screen blocks it contains,
and which game rules must be preserved when changing code or assets.

## Game Loop

- The player chooses a stake and difficulty, then presses `BET`.
- `BET` starts the round and moves the chicken to the first manhole.
- During an active round, `NEXT` moves the chicken to the next manhole.
- `Cash out` ends the round early and banks the current round value.
- Reaching the final route step triggers the win sequence.
- Being hit by a plane triggers the crash sequence and ends the round.
- Win and cashout both show the same top-of-scene payout banner: green glow,
  centered `Win` label, centered payout amount, and trumpet decorations.
- Win and cashout also show a short green `+amount` pill in the desktop header
  while the payout sequence is visible.

## Route And Values

- The route has `ROUTE_STEPS` manholes.
- Each manhole displays a multiplier from `multiplierFor(difficulty, step)`.
- Available stakes are `0.1`, `0.2`, `0.3`, and `0.4`.
- The default stake is `0.3`.
- The first step is safe from random plane collision.
- After each successful jump, the current round value is:

```text
stake * multiplierFor(difficulty, currentStep)
```

- The final win currently pays:

```text
currentRoundValue + stake * 5
```

## Header Blocks

- The logo is shown in the top bar.
- The total bank pill is shown in the top bar.
- On desktop, the difficulty selector sits in the main header row between the
  logo and the total bank/history/menu group.
- On mobile, the difficulty selector remains a compact second header row so the
  logo, history, and menu stay usable.
- The bottom control panel does not contain a duplicate difficulty selector.
- The total bank starts from `INITIAL_POOL` and is displayed as:

```text
100.00 USD
```

- The round history block is a collapsed running row of previous results.
- Clicking the round history row expands it into a larger `Round History` panel.
- Clicking outside the expanded history panel closes it.
- The menu button remains on the right side of the header.

## Total Bank Rules

- The total bank is shown in the header on desktop.
- The total bank is hidden on mobile to preserve header space.
- When the chicken is hit by a plane, subtract the stake for the current round
  from the total bank.
- When the player wins or cashes out, subtract the paid amount from the total
  bank through the payout banking flow.
- The total bank cannot go below zero.

## Round History Rules

- Round history stores previous round multipliers in local storage.
- New results are inserted at the beginning of the list.
- The list is capped so it does not grow forever.
- If the chicken is hit, record the multiplier of the manhole where it was hit,
  not `0.00x`.
- If the chicken wins, record the final payout multiplier.
- If the player cashes out, record the current cashout multiplier.

## Plane Traffic And Collision Rules

- Never allow two planes on the same lane at the same time.
- Decorative planes and crash planes share lane occupancy rules.
- If a decorative plane is already flying on the lane where the chicken jumps,
  that existing plane decides the outcome.
- Do not spawn a separate crash plane on a lane that already has a plane.
- The collision decision point is the end of the manhole cap.
- If, during the chicken jump, an existing plane is before that point, it hits
  the chicken regardless of random chance or difficulty.
- The collision decision uses the plane's front/leading edge, not its sprite
  center.
- If the existing plane has already passed the end of the manhole cap, it keeps
  flying away and does not hit the chicken.
- Only spawn a new crash plane when the target lane is empty and the normal
  collision calculation says the chicken should be hit.
- Reserve the target lane during jumps and crash sequences so a decorative plane
  cannot spawn into the same lane mid-action.
- Decorative planes spawn roughly every `1450ms` while the game scene is
  running, only on currently visible lanes that are not already occupied.

## Chicken Animation Mapping

- `Start`: chicken waits before the run starts.
- `Idle Active`: chicken waits during an active round.
- `Walk`: chicken moves between manholes.
- `Collision Ultimate Bloodless`: plane-hit sequence.
- `Happy Jump`: win and cashout sequence.

## Audio Mapping

- Plane movement uses the plane sound slice from the sound sprite.
- Chicken movement between manholes uses the jump/chicken movement sound.
- Plane collision uses the crash sound slice.
- Cashout and win have their own sound events.

## Layout Rules

- Header and bottom controls are normal HTML/CSS.
- The bottom control panel uses a dark two-column betting layout on desktop:
  stake controls on the left and the primary action area on the right.
- On desktop, the bottom controls are centered inside the full-width bottom
  bar and have a capped content width so action buttons do not stretch across
  the entire viewport.
- The bottom controls use a compact height so the game canvas keeps visual
  priority over the betting panel.
- The bottom controls shell keeps roughly `10px` padding around the centered
  content.
- In the ready state the primary action is a green `BET` button with the
  selected stake amount.
- In an active round the left stake controls are dimmed and the primary action
  area becomes orange `CASH OUT` plus green `NEXT`.
- Win and cashout payout feedback is rendered as a top overlay inside the Pixi
  scene, not as a separate centered modal.
- The game route, chicken, manholes, planes, collisions, win celebration, and
  camera movement are rendered in PixiJS.
- The Pixi canvas occupies the space between the header and the controls.
- Any visual, layout, canvas, interaction, or gameplay change must be checked on
  both desktop and narrow mobile viewport sizes.
