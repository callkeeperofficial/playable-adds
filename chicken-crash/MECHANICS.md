# Chicken Crash Mechanics

This file is the gameplay specification for `chicken-crash`. Keep it in sync
with `src/main.ts`, `src/scene.ts`, and `src/config.ts`.

## Core Loop

The player moves a chicken across a horizontal road one manhole at a time.
Every successful step increases the current payout. The player can either cash
out the current value or press Go to risk one more step.

The round ends in one of three ways:

- Cash Out: player banks the current round value.
- Finish: player reaches the final step and receives the round value plus the
  finish bonus.
- Crash: chicken is hit by traffic and loses only the current unbanked round
  value.

## State

The controller tracks:

- `phase`: `ready`, `jumping`, `active`, `crashed`, `finishing`, or `won`.
- `stake`: one of `2`, `3`, `8`, or `20`.
- `difficulty`: `easy`, `medium`, `hard`, or `hardcore`.
- `stepIndex`: current route position, starting at `-1`.
- `roundValue`: payout currently at risk.
- `bankedTotal`: persisted total already won by the player.
- `marketingPool`: decorative pool shown in the header.
- `autoplay`: whether automatic stepping is enabled before a round.
- `goBlocked`: whether the next step is blocked by traffic.

## Route

- The route has `20` manholes.
- The chicken starts in the start location at `stepIndex = -1`.
- Pressing Play starts a fresh round and immediately jumps to the first
  manhole.
- Each Go attempts exactly one additional step.
- The final manhole ends the route and triggers the finish sequence.

## Stakes and Multipliers

- Stake is selected before the round starts.
- Difficulty is selected before the round starts.
- Stake and difficulty are locked once the round begins.
- The current step payout is:

```text
roundValue = stake * multiplierFor(difficulty, stepIndex)
```

- Multipliers and collision chances are generated from `src/config.ts`.
- Multipliers use a compound curve: `base * stepFactor ^ step`. Early manholes
  grow slowly, later manholes accelerate so cash-out tension rises sharply.
- Higher difficulties have larger base multipliers, faster step factors, and
  higher collision risk.
- The default `easy` curve is tuned so a full route win is plausible around
  every couple of attempts, while higher difficulties remain progressively
  riskier.

## Phase Behavior

### Ready

- Chicken is reset to the start.
- Route visuals are reset.
- Multiplier badge is hidden.
- Stake, difficulty, autoplay, and Play are available.
- Go and Cash Out are not shown.

### Jumping

- The chicken is moving to the next manhole.
- Controls that could create overlapping transitions are disabled.
- Jump sound plays at the start of the movement.

### Active

- Chicken is standing on a manhole.
- Cash Out and Go are shown.
- Cash Out displays the current round value.
- Stake and difficulty remain visible but disabled.
- Autoplay button is hidden after the round begins.

### Crashed

- Round value is set to `0`.
- Autoplay switches off.
- Loss sound plays.
- The scene plays the collision or death animation.
- Banked winnings are not reduced.
- The round resets after the crash sequence.

### Finishing

- Used for Cash Out and final route completion.
- Autoplay switches off.
- Win notification appears.
- Awarded value is added to `bankedTotal`.
- Awarded value is subtracted from `marketingPool`.
- The route resets after the notification.

## Cash Out

Cash Out is allowed only during `active`.

When pressed:

- Play `cashout.webm`.
- Show the win notification with the current round value.
- Add the current round value to `bankedTotal`.
- Subtract the current round value from `marketingPool`.
- Persist `bankedTotal`.
- Reset the round.

## Finish

When the chicken reaches the last route step:

- Autoplay switches off.
- The chicken performs a short, readable final celebration movement and then
  stops before the final win notification appears.
  The camera locks to the chicken's current screen position through this
  movement so it remains visible without a final jump.
- Show the final win notification as a DOM overlay with the awarded prize
  amount (`roundValue + stake * 5`).
- Show two vertically stacked CTA buttons: `Install` and
  `Download from play market`.
- Play `win.webm`.
- Award:

```text
prize = roundValue + stake * 5
```

- Add `prize` to `bankedTotal`.
- Subtract `prize` from `marketingPool`.
- Persist `bankedTotal`.
- Stop on the final win notification. The round must not reset and the user
  must remain on this end screen.

## Current Multiplier Badge

- The badge is hidden in `ready`.
- The badge appears after the chicken lands on the first manhole.
- It follows the chicken horizontally.
- It displays the current coefficient for the chicken's current step.
- It is hidden on crash, Cash Out, finish, and reset.
- It is hidden when the chicken reaches the final manhole.

## Manholes

Each manhole has a quality state:

- `muted`: future manhole, gray treatment.
- `active`: next available manhole, normal treatment.
- `passed`: completed manhole, replaced with the gold marker.
- `hidden`: current manhole under the chicken, not visible.

Only the manhole the chicken has already passed should visually flip. The flip
happens when that previous manhole changes to `passed`. Future and next-active
manholes may change tint or visibility, but they must not rotate just because
the chicken jumped.

The implementation simulates the flip by folding and unfolding the Pixi
container on `scale.x`.

The current manhole under the chicken is hidden immediately. The previous
manhole becomes gold only after the chicken advances away from it.

## Cars

Cars are road hazards and decorative traffic.

- Cars always enter from the top and travel downward.
- Cars never travel upward.
- More than one car may exist on the screen if they are in different lanes.
- A single lane should not spawn duplicate active cars at the same time.
- Ambient traffic is paced to leave readable gaps between hazards.
- Cars are rendered above the chicken so an impact reads as the chicken being
  under the car.
- Car movement sound plays when a relevant car movement is presented.

## Barrier and Collision Rules

There are three important vertical regions for a lane:

- Barrier placement point.
- Upper edge of the target manhole.
- Lower edge of the target manhole.

The next action depends on the car's position in the target lane:

- If a car overlaps the manhole region, Go is disabled. The chicken must not
  jump directly onto a car.
- If a car is between the barrier placement point and the upper edge of the
  manhole, the chicken may jump, but that same car must hit the chicken. Do not
  place a barrier in this case.
- If a car is above the barrier placement point, the chicken may jump and a
  barrier may be placed. The car stops at the barrier.
- If a car has already passed beyond the lower edge of the manhole, it must
  continue driving downward and leave. Do not teleport it backward to a
  barrier.

When the game has already decided that an existing car will hit the chicken,
do not also drop a barrier for that step.

## Random Collision

If no existing car is responsible for the next step:

- A random collision may be selected based on difficulty and step.
- Collision cannot be selected for the first step.
- Collision should not spawn if there is already an active vehicle in the
  target lane.
- The spawned crash vehicle drives downward and hits the chicken.

## Barriers

- Barriers appear after successful progress to show protected completed lanes.
- A car that is still above the barrier point stops before the barrier.
- A car must never visually pass through a barrier.
- A car that is already too far down the lane should continue off-screen rather
  than snapping to the barrier.

## Go Blocking

The controller polls the scene for traffic while the round is ready or active.

Go becomes disabled when the next lane contains a car overlapping the target
manhole region. Once that overlap clears, Go can become available again.

This prevents the chicken from jumping directly onto a car.

## Autoplay

- Autoplay can be toggled only before the first jump.
- If enabled while ready, it starts the round.
- After each successful landing, autoplay waits briefly and requests the next
  step.
- Autoplay never cashes out automatically.
- Autoplay stops on crash or finish.
- Autoplay must not submit overlapping Go requests while animations are still
  running.

Current delay:

```text
180 ms
```

## Live Wins and Online Count

Live wins are decorative UI:

- They do not affect the player's round.
- A mock win row appears periodically.
- The mock amount is subtracted from `marketingPool`.
- The change is not persisted.
- Online count is decorative and may drift slightly.

## Persistence

Only `bankedTotal` persists in localStorage.

Reset on reload:

- Current round.
- Route position.
- Camera position.
- Autoplay.
- Marketing pool.
- Live-win state.
- Online count.

## Public API

The playable exposes a small browser API at `window.ChickenCrash`:

- `observeInstallButton(callback)`: register a callback for the final
  `Install` button. Returns an unsubscribe function.
- `observePlayMarketButton(callback)`: register a callback for the final
  `Download from play market` button. Returns an unsubscribe function.
- `showGame()`: show the playable, reset it to the starting state, and resume
  the scene ticker.
- `hideGame()`: stop autoplay, reset the playable, pause the scene ticker, and
  hide the root game element.

Full integration notes live in `PUBLIC_API.md`.

The root element is `#chicken-crash-playable`. The playable must not style or
mutate the host page `body`; page-level behavior stays scoped to the root.

## Audio Triggers

- `jump.webm`: chicken starts a jump.
- `car.webm`: relevant car movement appears.
- `lose.webm`: collision/loss.
- `cashout.webm`: Cash Out button.
- `win.webm`: final route finish.
- `chick.webm`: chicken click only.

Clicking the chicken should only play `chick.webm`; it must not advance the
route or change payout.

## Win Notification

Cash Out and final route completion use different notification behavior:

- Cash Out shows the PixiJS win notification with the awarded amount, then
  clears before the next round starts.
- Final route completion shows a persistent DOM overlay with the awarded prize
  amount. It contains the `Install` and `Download from play market` CTA buttons
  and does not reset the round.

Use desktop and mobile notification assets as appropriate for the viewport.
