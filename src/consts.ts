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
  SPEED_AT_FIRST_STAGE: -200,
  SPEED_AT_SECOND_STAGE: -300,
  SPEED_AT_THIRD_STAGE: -350,
  SECOND_STAGE_SWITCH_TIME: 40,
  THIRD_STAGE_SWITCH_TIME: 20,
  FLASHLIGHT_ACTIVE_TIME: 3000,
  GAME_WIDTH: 1024,
  GAME_HEIGHT: 768,
  STICK_FIGURE_SCALE: 0.6,
  HOGLIGHT_COOLDOWN: 9,
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
    min: 0.5,
    max: 1.4,
  },
  funnel: { isPercentage: false, isFloatRange: false, min: 8, max: 15 },
  retention: { isPercentage: true, isFloatRange: false, min: 5, max: 10 },
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
