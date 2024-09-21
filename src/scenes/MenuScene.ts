import { Scene, GameObjects } from "phaser";

export class MenuScene extends Scene {
  background: GameObjects.Rectangle;
  logo: GameObjects.Image;
  title: GameObjects.Text;
  playButton: GameObjects.Graphics;
  leaderboardButton: GameObjects.Graphics;

  constructor() {
    super("MenuScene");
  }

  create() {}
}
