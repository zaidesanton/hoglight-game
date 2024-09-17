import { Scene, GameObjects } from "phaser";
import { createRoundedButton } from "../utils/Graphics";

export class MainMenu extends Scene {
  background: GameObjects.Rectangle;
  logo: GameObjects.Image;
  title: GameObjects.Text;
  playButton: GameObjects.Graphics;
  leaderboardButton: GameObjects.Graphics;

  constructor() {
    super("MainMenu");
  }

  create() {
    // Create a full-screen green background
    this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x2eac33)
      .setOrigin(0, 0)
      .setScrollFactor(0);

    // Set background color to Taranis's primary color, filling the entire screen
    this.cameras.main.setBackgroundColor(0x2efc33);

    // Placeholder for the logo image
    this.logo = this.add
      .image(this.scale.width / 2, 200, "logo")
      .setOrigin(0.5, 0.5);

    // Add the game title
    this.title = this.add
      .text(this.scale.width / 2, 300, "The Smart Scout", {
        fontFamily: "Arial Black",
        fontSize: 48,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
        align: "center",
      })
      .setOrigin(0.5);

    // Create the "Play Now" button with rounded corners
    this.playButton = this.add.graphics();
    createRoundedButton(
      this,
      this.playButton,
      this.scale.width / 2,
      450,
      300,
      80,
      "Play Now",
      () => {
        this.scene.start("Game");
      }
    );

    // Create the "Leaderboard" button with rounded corners
    this.leaderboardButton = this.add.graphics();
    createRoundedButton(
      this,
      this.leaderboardButton,
      this.scale.width / 2,
      550,
      300,
      80,
      "Leaderboard",
      () => {
        this.scene.start("Leaderboard");
      }
    );
  }
}
