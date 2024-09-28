import { Scene, GameObjects } from "phaser";
import { createRoundedButton } from "../ui/Utils";
import { GameConstants } from "../consts";

export class MenuScene extends Scene {
  background: GameObjects.Rectangle;
  logo: GameObjects.Image;
  title: GameObjects.Text;
  playButton: GameObjects.Graphics;
  leaderboardButton: GameObjects.Graphics;

  constructor() {
    super("MenuScene");
  }

  create() {
    this.add.image(0, 0, "backgroundMenu").setOrigin(0, 0);

    // Add the game title
    this.title = this.add
      .text(this.scale.width / 2, 150, "Hoglight Blitz", {
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
      350,
      300,
      80,
      "Play Now",
      () => {
        this.scene.start("GameScene");
      },
      GameConstants.TEXT_COLOR_NUMBER
    );

    // Create the "Leaderboard" button with rounded corners
    this.leaderboardButton = this.add.graphics();
    createRoundedButton(
      this,
      this.leaderboardButton,
      this.scale.width / 2,
      450,
      300,
      80,
      "Leaderboard",
      () => {
        this.scene.start("Leaderboard");
      },
      GameConstants.TEXT_COLOR_NUMBER
    );
  }
}
