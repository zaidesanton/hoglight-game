import { Scene } from "phaser";
import { GameConstants } from "../consts";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init() {
    //  We loaded this image in our Boot Scene, so we can display it here
    this.add.image(0, 0, "backgroundMenu").setOrigin(0, 0);

    //  A simple progress bar. This is the outline of the bar.
    this.add
      .rectangle(GameConstants.GAME_WIDTH, GameConstants.GAME_HEIGHT, 468, 32)
      .setStrokeStyle(1, 0xffffff);

    //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
    const bar = this.add.rectangle(
      GameConstants.GAME_WIDTH - 460,
      GameConstants.GAME_HEIGHT,
      4,
      28,
      0xffffff
    );

    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on("progress", (progress: number) => {
      //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
      bar.width = 4 + 460 * progress;
    });
  }

  preload() {
    //  Load the assets for the game - Replace with your own assets
    this.load.setPath("assets");
    this.load.image("backgroundGame", "backgroundGame.png");
    this.load.image("playerDefault", "playerDefault.png");
    this.load.image("playerFlashlight", "playerFlashlight.png");
    this.load.image("conversion", "conversionItem.png");
    this.load.image("funnel", "funnelItem.png");
    this.load.image("retention", "retentionItem.png");
    this.load.image("happy", "happy.png");
    this.load.image("sad", "sad.png");
    this.load.image("neutral", "neutral.png");
    this.load.image("gate", "gate.png");
    this.load.image("arrow", "arrow.png");
    this.load.image("purchases", "purchases.png");
    this.load.image("conversionHighlighted", "conversionItemHighlighted.png");
    this.load.image("retentionHighlighted", "retentionItemHighlighted.png");
    this.load.image("funnelHighlighted", "funnelItemHighlighted.png");
  }

  create() {
    //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
    this.scene.start("MenuScene");
  }
}
