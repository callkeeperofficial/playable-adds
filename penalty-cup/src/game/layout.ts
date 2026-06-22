export const GOAL_LAYOUT = {
  gates: {
    x: 195,
    y: 489,
    scale: 0.25,
  },
  goalkeeper: {
    x: 195,
    y: 487,
    scale: 0.255,
  },
  targetGrid: {
    x: 24,
    y: 327,
    width: 342,
    height: 153,
    columns: 5,
    rows: 3,
  },
  ball: {
    idle: {
      x: 195,
      y: 639,
      scale: 0.45,
    },
    shot: {
      x: 195,
      y: 489,
      scale: 0.25,
    },
    transitionMs: 333,
  },
} as const;
