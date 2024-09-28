// src/main.ts
import Phaser from "phaser";
import BootScene from "./scenes/BootScene";
import { Preloader } from "./scenes/Preloader";
import { Leaderboard } from "./scenes/LeaderboardScene";
import GameScene from "./scenes/GameScene";
import { MenuScene } from "./scenes/MenuScene";
import UIScene from "./scenes/UIScene";
import { GameConstants } from "./consts";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GameConstants.GAME_WIDTH,
  height: GameConstants.GAME_HEIGHT,
  backgroundColor: "#EEEFE9",
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  parent: "game-container",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, Preloader, MenuScene, GameScene, Leaderboard, UIScene],
};

window.addEventListener("load", () => {
  new Phaser.Game(config);
});
