# Asset Map: ball Spine Animation

## Files

```text
source/spine/ball/ball.png
source/spine/ball/ball.atlas
source/spine/ball/ball.json
```

## Asset Type

This is a Spine animation asset, not a regular spritesheet for manual slicing.

`ball.json` contains a Spine skeleton, bones, slots, skins, attachments, meshes and named animations.

The skeleton version visible in the file is:

```text
Spine 4.2.33
```

## Hard Rule

Do not slice `ball.png` manually.

Do not convert this asset into separate PNG frames unless there is no other technical option.

Use a Spine runtime.

Manual slicing breaks the intended animation because the atlas contains:
- ball render variants;
- motion blur / stretch meshes;
- impact rings;
- target indicators;
- green/yellow/red hit zones;
- IN / OUT elements;
- mesh deformations;
- timed slot visibility;
- bone transforms;
- multi-step shot animations.

These pieces are meant to be driven by `ball.json`, not by static sprite coordinates.

## Implementation Requirement

Use PixiJS with official Spine runtime.

Recommended for PixiJS v8:

```text
@esotericsoftware/spine-pixi-v8
```

Codex should check the current package documentation and install a compatible PixiJS + Spine runtime pair.

## Role in the Game

This asset is responsible for penalty ball mechanics:

- idle ball;
- target indicators;
- ball flight;
- ball scaling during flight;
- ball rotation;
- motion blur;
- hit/save/miss/out visual result;
- target-zone feedback;
- IN / OUT result indicators.

## Observed Animation Names

The file contains many named animations. Important patterns:

```text
ball_1
ball_1_1
ball_1_2
ball_2
ball_2_1
ball_2_2
...
```

Likely meaning:

```text
ball_N      — primary shot animation to target zone N
ball_N_1    — continuation/result variation
ball_N_2    — alternative result variation, likely miss/save/out
```

Also observed names/patterns include:

```text
ball_start
ball_rotate
light
target_balls
target_green
```

Exact names must be read from `ball.json` at implementation time.

## Suggested Mapping

Use target zones as logical IDs and map them to Spine animation names.

Example:

```ts
const SHOT_ANIMATION_BY_TARGET = {
  "zone_1": "ball_1",
  "zone_2": "ball_2",
  "zone_3": "ball_3",
  "zone_4": "ball_4",
  "zone_5": "ball_5",
};
```

Do not assume only 5 zones. The asset appears to support more, likely up to 15.

## Runtime Usage Flow

Pseudo-flow:

```ts
const ball = Spine.from({
  skeleton: "ball.json",
  atlas: "ball.atlas",
});

ball.state.setAnimation(0, "ball_start", true);

function playShot(targetZone: string, result: "goal" | "save" | "out") {
  const baseAnim = SHOT_ANIMATION_BY_TARGET[targetZone];

  ball.state.setAnimation(0, baseAnim, false);

  if (result === "goal") {
    ball.state.addAnimation(0, `${baseAnim}_1`, false, 0);
  } else {
    ball.state.addAnimation(0, `${baseAnim}_2`, false, 0);
  }
}
```

The exact API may differ depending on the installed Spine runtime version. Codex must follow the selected runtime documentation.

## Fallback

If Spine runtime integration fails, do not slice the atlas as a first fallback.

Fallback order:

1. Fix Spine runtime integration.
2. Verify file paths and loader setup.
3. Verify Spine version compatibility.
4. Use a very temporary placeholder ball only to unblock gameplay logic.
5. Keep Spine integration as a required TODO.

Manual atlas slicing is not an accepted final implementation.
