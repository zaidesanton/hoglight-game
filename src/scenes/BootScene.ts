// src/scenes/BootScene.ts
import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    // Load assets
    this.load.image("background", "assets/background.webp");
    // Load other necessary assets (backgrounds, etc.)
  }

  create() {
    // Start the Game Scene
    this.scene.start("Preloader");
  }
}
