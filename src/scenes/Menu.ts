import { Scene, GameObjects } from "phaser";
import { createRoundedButton } from "../utils/Graphics";

export class Menu {
  private scene: Scene;
  private container: GameObjects.Container;
  private background: GameObjects.Rectangle;
  private text: GameObjects.Text;
  private menuElements: GameObjects.GameObject[];
  private blocker: GameObjects.Rectangle;

  constructor(scene: Scene) {
    this.scene = scene;
    this.container = this.scene.add.container();
    this.menuElements = [];

    this.createBackground();
  }

  private createBackground() {
    // Full-screen semi-transparent overlay with gradient
    const screenWidth = this.scene.cameras.main.width;
    const screenHeight = this.scene.cameras.main.height;

    // Transparent blocker to prevent clicks on other elements
    this.blocker = this.scene.add
      .rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0)
      .setOrigin(0)
      .setInteractive(); // Make it interactive to block clicks

    this.background = this.scene.add
      .rectangle(0, 0, screenWidth, screenHeight, 0x2e7c33, 0.9)
      .setOrigin(0)
      .setAlpha(0); // Start with full transparency for fade-in effect

    this.container.add(this.blocker);
    this.container.add(this.background);

    this.text = this.scene.add
      .text(screenWidth / 2, screenHeight / 3, "", {
        fontFamily: "Roboto",
        fontSize: "32px",
        color: "#ffffff",
        align: "center",
        padding: { left: 100, right: 100, top: 40, bottom: 40 },
        wordWrap: { width: screenWidth - 100 },
      })
      .setOrigin(0.5, 0.5);

    this.container.add(this.text);
    this.container.setVisible(false); // Hide the menu initially
    this.container.setDepth(3); // Ensure it stays on top of other elements
  }

  public show(
    text: string,
    actions: {
      label: string;
      callback: (threshold?: number) => void;
      type?: string;
      isDisabled?: boolean;
    }[]
  ) {
    this.text.setText(text);

    // Remove existing buttons and create new ones
    this.menuElements.forEach((button) => button.destroy());
    this.menuElements = [];

    const screenWidth = this.scene.cameras.main.width;
    const screenHeight = this.scene.cameras.main.height;

    const buttonSpacing = 220; // Adjust this as needed

    actions.forEach((action, index) => {
      const buttonX =
        screenWidth / 2 -
        ((actions.length - 1) * buttonSpacing) / 2 +
        index * buttonSpacing; // Horizontal alignment
      const buttonY = (screenHeight / 4) * 3; // Same Y for all buttons

      if (action.type === "threshold") {
        this.createThresholdButton(
          buttonX,
          buttonY,
          action.label,
          action.callback,
          action.isDisabled
        );
      } else {
        // Regular button
        this.createRegularButton(
          buttonX,
          buttonY,
          action.label,
          action.callback
        );
      }
    });

    this.container.setPosition(0, 0);
    this.container.setVisible(true);

    // Fade-in effect for the background
    this.scene.tweens.add({
      targets: this.background,
      alpha: 0.95,
      duration: 700,
      ease: "linear",
    });
  }

  private createRegularButton(
    x: number,
    y: number,
    label: string,
    callback: () => void
  ) {
    // Create a Graphics object for the rounded button
    const buttonGraphics = this.scene.add.graphics();

    const { button, buttonText } = createRoundedButton(
      this.scene,
      buttonGraphics,
      x,
      y,
      200,
      80,
      label,
      callback,
      0x3e4c33,
      this.container
    );
    this.menuElements.push(button, buttonText);
  }

  private createThresholdButton(
    x: number,
    y: number,
    label: string,
    callback: (selectedOption: number) => void,
    isDisabled: boolean = false
  ) {
    // Create a Graphics object for the rounded button
    const buttonGraphics = this.scene.add.graphics();

    const toolTipText = isDisabled
      ? "For smart replant, you must scout the whole field before the decision time."
      : "We'll replant all the acres with a standcount below the threshold";
    const { button, buttonText } = createRoundedButton(
      this.scene,
      buttonGraphics,
      x,
      y,
      200,
      80,
      label,
      callback,
      isDisabled ? 0xaaaaaa : 0x3e4c33,
      this.container,
      isDisabled,
      toolTipText
    );

    this.menuElements.push(button, buttonText);
  }

  public hide() {
    this.container.setVisible(false);
  }

  public destroy() {
    this.menuElements.forEach((element) => element.destroy());
  }

  public collapse() {
    this.scene.tweens.add({
      targets: this.container,
      x: this.scene.cameras.main.width - 20,
      ease: "Power1",
      duration: 300,
    });
  }
}
