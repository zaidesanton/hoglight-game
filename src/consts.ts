// src/constants/GameConstants.ts
export const GameConstants = {
  INITIAL_CONVERSION_RATE: 5,
  INITIAL_PAGE_VISITS: 100,
  INITIAL_RETENTION_RATE: 0,
  MAX_CONVERSION_RATE: 100,
  MAX_RETENTION_RATE: 100,
  ITEM_TYPES: ["conversion", "funnel", "retention"],
  LANE_Y_POSITIONS: [320, 400, 480],
  LANE_DRAWING_Y_POSITIONS: [280, 360, 440, 520],
  TEXT_COLOR: "#F55001",
  TEXT_COLOR_NUMBER: 0xf55001,
  SPAWNING_RATE_AT_FIRST_STAGE: 4000,
  SPAWNING_RATE_AT_SECOND_STAGE: 3000,
  SPAWNING_RATE_AT_THIRD_STAGE: 2000,
  SPEED_AT_FIRST_STAGE: -150,
  SPEED_AT_SECOND_STAGE: -270,
  SPEED_AT_THIRD_STAGE: -350,
  START_SECOND_STAGE_MS: 20000,
  START_THIRD_STAGE_MS: 40000,
  FLASHLIGHT_ACTIVE_TIME: 3000,
  GAME_WIDTH: 1024,
  GAME_HEIGHT: 768,
  STICK_FIGURE_SCALE: 0.6,
  ACTION_BUTTON_COOLDOWN: 9,
};

export const itemSettings: {
  [key: string]: {
    isPercentage: boolean;
    isFloatRange: boolean;
    min: number;
    max: number;
  };
} = {
  conversion: {
    isPercentage: true,
    isFloatRange: true,
    min: 0.4,
    max: 1.2,
  },
  funnel: { isPercentage: false, isFloatRange: false, min: 7, max: 13 },
  retention: { isPercentage: true, isFloatRange: false, min: 4, max: 11 },
};

export const defaultTextStyle = {
  fontSize: "22px",
  fontFamily: "Consolas", // A nice serif/sans-serif combination
  fontWeight: "bold", // Makes the font bold
  color: "#000000",
};

export const TutorialsConsts = {
  GAME_START_TUTORIAL_X: 50,
  GAME_START_TUTORIAL_Y: 155,
  STICK_FIGURES_SPACING: 45,
  STICK_FIGURES_ANIMATION_DURATION: 600,
  STICK_FIGURES_IN_FUNNEL_NUMBER: 5,
  LEAVING_STICK_FIGURES_X: 320,
  LEAVING_STICK_FIGURES_Y: 150,
  LEAVING_STICK_FIGURES_Y_SPACING: 50,
  LEAVING_STICK_FIGURES_X_SPACING: 30,
};
