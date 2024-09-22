import { Scene } from "phaser";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init() {
    //  We loaded this image in our Boot Scene, so we can display it here
    this.add.image(512, 384, "background");

    //  A simple progress bar. This is the outline of the bar.
    this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

    //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
    const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on("progress", (progress: number) => {
      //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
      bar.width = 4 + 460 * progress;
    });
  }

  preload() {
    //  Load the assets for the game - Replace with your own assets
    this.load.setPath("assets");

    this.load.image("player-default", "playerDefault.png");
    this.load.image("player-flashlight", "playerFlashlight.png");
    this.load.image("shoppingCart", "shoppingCart.png");
    this.load.image("megaphone", "megaphone.png");
    this.load.image("stopwatch", "stopwatch.png");
    this.load.image("shoppingCartHighlighted", "shoppingCartHighlighted.png");
    this.load.image("megaphoneHighlighted", "megaphoneHighlighted.png");
    this.load.image("stopwatchHighlighted", "stopwatchHighlighted.png");
  }

  create() {
    //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
    this.scene.start("GameScene");
  }
}
