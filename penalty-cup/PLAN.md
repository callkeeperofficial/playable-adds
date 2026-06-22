# Penalty Cup: Remaining Work

## P0 - Finish And Prove The Core Loop

- Stabilize repeated target taps in bonus mode so every accepted shot decrements `shotsLeft` exactly once.
- Add a small transition lock with one authoritative shot-complete callback instead of relying only on timeouts.
- Run deterministic scenarios for normal save, normal goal, Claim, insufficient balance, and bonus save.
- Complete a deterministic 12-15 shot bonus run and verify the final `BONUS WIN` overlay.
- Verify Collect and timeout both credit the win once and return to normal penalty mode.

## P1 - Match The Recordings

- Review all three files in `video-references/` and make a timestamped screen/flow checklist.
- Tune mobile proportions for header, multiplier track, goal, goalkeeper, target grid, ball, team bar, and bottom panel.
- Match Buy Bonus card spacing, roulette timing, shot intro, result timing, and UI copy.
- Tune Spine scales and origins per animation so ball, goalkeeper, gates, background, and win effects stay aligned.

## P1 - Runtime And Responsive QA

- Verify 390x844 and another narrow phone viewport, including safe-area insets.
- Verify desktop/landscape framing without stretching the 390x844 game composition.
- Recheck browser console and network requests through the complete normal and bonus loops.
- Confirm every static runtime asset is requested once and no Spine PNG is sliced or repacked.
- Run `npm run build` after the final fixes.

## P2 - Polish

- Add concise sound feedback if suitable source audio is available.
- Improve disabled/pressed states, result flashes, roulette easing, and overlay transitions.
- Add a lightweight restart/debug path for repeatable playable QA.
- Remove unused source/reference material from the production package while retaining authoring inputs locally.

## Repository Integration

- Decide whether the 609 MB of `.mov` references should be Git-ignored or stored externally before committing.
- Register `penalty-cup` in the root Pages index and deployment workflow only when the playable is ready to publish.
- Build every playable and verify all published URLs before deployment, per the repository guide.

