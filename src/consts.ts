// src/constants/GameConstants.ts
export const GameConstants = {
  INITIAL_CONVERSION_RATE: 5,
  INITIAL_PAGE_VISITS: 100,
  INITIAL_RETENTION_RATE: 0,
  MAX_CONVERSION_RATE: 100,
  MAX_RETENTION_RATE: 100,
  ITEM_TYPES: ["shoppingCart", "megaphone", "stopwatch"],
  LANE_Y_POSITIONS: [300, 400, 500],
  LANE_DRAWING_Y_POSITIONS: [250, 350, 450, 550],
  TEXT_COLOR: "#F55001",
  SPEED_AT_FIRST_STAGE: -200,
  // Other constants...
};

export const itemSettings: {
  [key: string]: {
    isPercentage: boolean;
    isFloatRange: boolean;
    min: number;
    max: number;
  };
} = {
  shoppingCart: { isPercentage: true, isFloatRange: true, min: 0.1, max: 0.5 },
  megaphone: { isPercentage: false, isFloatRange: false, min: 5, max: 20 },
  stopwatch: { isPercentage: true, isFloatRange: false, min: 1, max: 5 },
};
