export const DESIGN_CENTER_X = 195;

export const SCENE_LAYOUT = {
  background: {
    x: DESIGN_CENTER_X,
    y: 528,
    scale: 0.255,
  },
} as const;

export const GOAL_LAYOUT = {
  gates: {
    x: DESIGN_CENTER_X,
    y: 530,
    scale: 0.25,
  },
  goalkeeper: {
    x: DESIGN_CENTER_X,
    y: 528,
    scale: 0.255,
  },
  targetGrid: {
    x: 24,
    y: 368,
    width: 342,
    height: 153,
    columns: 5,
    rows: 3,
  },
  ball: {
    idle: {
      x: DESIGN_CENTER_X,
      y: 639,
      scale: 0.45,
    },
    shot: {
      x: DESIGN_CENTER_X,
      y: 530,
      scale: 0.25,
    },
    transitionMs: 333,
  },
} as const;
