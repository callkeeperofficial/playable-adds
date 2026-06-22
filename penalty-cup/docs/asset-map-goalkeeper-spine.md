# Asset Map: goalkeeper Spine Character

## Files

```text
source/spine/goalkeeper/goalkeeper.png
source/spine/goalkeeper/goalkeeper.atlas
source/spine/goalkeeper/goalkeeper.json
```

## Asset Type

This is a Spine character rig for the goalkeeper.

It is not a normal spritesheet and must not be manually sliced.

## Spine Version

```text
4.2.43
```

## Skeleton Bounds

```text
x: -178.12
y: -25.21
width: 350.77
height: 451.86
```

## Structure

```text
bones: 73
slots: 13
skins: 4
ik constraints: 4
transform constraints: 9
animations: 16
```

## Skins

Observed skins:

```text
- default
- easy
- hard
- medium
```

Important meaning:

```text
easy   — goalkeeper visual/pose for Easy difficulty
medium — goalkeeper visual/pose for Medium difficulty
hard   — goalkeeper visual/pose for Hard difficulty
```

The texture atlas visibly contains different kit/body parts:
- red kit;
- yellow kit;
- blue kit;
- gloves;
- boots;
- head/hair parts;
- legs/arms/torso parts;
- shadow.

## Character Rig

The skeleton contains a full humanoid rig:

```text
body
legs
arms
hands
fingers
neck
head
eyes
brows
nose
mouth
hair
feet
shadow
```

There are IK constraints for knees and target bones, plus transform constraints for hands/head variants per skin.

This means the goalkeeper is intended to be animated via Spine, not assembled manually.

## Animation Names

All observed animation names:

```text
- idle
- jump_1
- jump_2
- jump_3
- jump_4
- jump_5
- jump_6
- jump_7
- jump_8
- jump_9
- jump_10
- jump_11
- jump_12
- jump_13
- jump_14
- jump_15
```

## Rough Animation Groups

Idle-like:

```text
- idle
```

Difficulty-related:

```text
Easy:
- none observed

Medium:
- none observed

Hard:
- none observed
```

Left/right naming hints:

```text
Left-like:
- none observed

Right-like:
- none observed
```

## Role in the Game

This asset controls the goalkeeper in the penalty scene.

Use it for:

- idle goalkeeper stance;
- difficulty-dependent appearance/skin;
- save animations;
- dives left/right/up/down;
- failed save / missed dive;
- possible reaction after goal/save.

## Hard Rule

Do not slice `goalkeeper.png`.

Use Spine runtime.

Reason:

- the goalkeeper is a rigged Spine character;
- body parts are controlled by bones;
- fingers/arms/legs/head are animated;
- IK constraints control the pose;
- skins switch visual variants by difficulty;
- mesh attachments and constraints would be lost if manually sliced.

## Runtime Usage

Use the same PixiJS Spine runtime as other Spine assets.

Preferred for PixiJS v8:

```text
@esotericsoftware/spine-pixi-v8
```

Pseudo-flow:

```ts
const goalkeeper = Spine.from({
  skeleton: "goalkeeper.json",
  atlas: "goalkeeper.atlas",
});

// Set visual difficulty
goalkeeper.skeleton.setSkinByName("easy"); // or "medium" / "hard"
goalkeeper.skeleton.setSlotsToSetupPose();

// Start idle
goalkeeper.state.setAnimation(0, "idle", true);
```

Exact animation names must be taken from `goalkeeper.json`.

## Difficulty Mapping

When player changes difficulty:

```ts
function setDifficulty(difficulty: Difficulty) {
  goalkeeper.skeleton.setSkinByName(difficulty);
  goalkeeper.skeleton.setSlotsToSetupPose();
}
```

If a skin name differs, map it explicitly.

## Save Logic Integration

Game logic should choose goalkeeper result zone independently from animation.

Example:

```ts
const goalkeeperZone = decideGoalkeeperZone(targetZone, result, difficulty);

const animationName = GOALKEEPER_ANIMATION_BY_ZONE[goalkeeperZone];
goalkeeper.state.setAnimation(0, animationName, false);
goalkeeper.state.addAnimation(0, "idle", true, 0);
```

## Layering

Recommended scene order:

```text
Background Spine
Gates Spine
Goalkeeper Spine
Target zones
Ball Spine
HUD
```

If the goalkeeper must visually stand inside the net, place it after gates but tune z-index with target zones.

## Mobile Layout

On mobile:

```text
goalkeeper.x = center of gates
goalkeeper.y = bottom area of gates
goalkeeper scale should make him fit inside goal
```

The goalkeeper should be large enough to be readable, but not cover the whole goal.

Suggested:

```text
height: 22–30% of screen height
centered horizontally
feet around lower net line
```

## Implementation Priority

1. Load goalkeeper Spine successfully.
2. Set skin based on selected difficulty.
3. Play idle animation.
4. Play left/right/center save animations when ball is kicked.
5. Return to idle/new round.
6. Tune z-index with gates and ball.
