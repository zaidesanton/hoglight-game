// src/ui/TutorialManager.ts
import { GameObjects, Scene } from "phaser";
import { GameObjectWithLocation } from "../scenes/UIScene";
import { animateText } from "./TextAnimator";
import { GameConstants, defaultTextStyle } from "../consts";

export type TutorialStepData = {
  text: string;
  // Passing a function do dynmically return the game objects, after they are created
  highlightedObjects: () => GameObjectWithLocation[];
  onTutorialFinished: () => void;
  onTutorialLoaded: (callback: () => void) => void;
};

// All are optional, as a tutorial can be skipped at any moment
export type TutorialStepObjects = {
  tutorialText?: GameObjects.Text;
  overlay?: GameObjects.Graphics;
  lights?: GameObjects.PointLight[];
  data?: TutorialStepData;
  skipText?: GameObjects.Text;
};

export default class TutorialManager {
  private currentScene: Scene;
  private currentTutorialStep: TutorialStepObjects = {};
  private skipTutorialsCallback: () => void;
  public shouldSkipTutorials: Boolean = false;

  constructor(scene: Scene, skipTutorialsCallback: () => void) {
    this.currentScene = scene;
    this.skipTutorialsCallback = skipTutorialsCallback;
  }

  // Sorry, this function is a mess
  createTutorialStep(tutorialStepData: TutorialStepData) {
    const overlay = this.currentScene.add.graphics();
    this.currentTutorialStep.overlay = overlay;
    this.currentTutorialStep.data = tutorialStepData;

    const roundedRectX = 10;
    const roundedRectY = GameConstants.LANE_DRAWING_Y_POSITIONS[0] - 10; // Adjust for your lane positions
    const roundedRectWidth = this.currentScene.sys.canvas.width - 20;
    const roundedRectHeight =
      GameConstants.LANE_DRAWING_Y_POSITIONS[
        GameConstants.LANE_DRAWING_Y_POSITIONS.length - 1
      ] -
      roundedRectY +
      10;

    overlay.fillStyle(0x000000, 0.8); // Black color, 70% opacity for the dimming effect
    overlay.fillRoundedRect(
      roundedRectX,
      roundedRectY,
      roundedRectWidth,
      roundedRectHeight,
      20
    ); // Rounded corners
    overlay.setDepth(100);
    overlay.setAlpha(0);

    let spotlights: GameObjects.PointLight[] = [];
    let tutorialText: GameObjects.Text;

    const skipText = this.createSkipText();
    this.currentTutorialStep.skipText = skipText;

    // Create the fade-in animation for the overlay (200ms)
    this.currentScene.tweens.add({
      targets: overlay,
      alpha: 0.8, // Fade in to 80% opacity
      duration: 400,
      ease: "Power2",
      onComplete: () => {
        tutorialText = this.currentScene.add.text(
          100,
          GameConstants.LANE_Y_POSITIONS[0],
          tutorialStepData.text,
          {
            ...defaultTextStyle,
            lineSpacing: 5,
            color: "#ffffff",
            align: "left",
            wordWrap: { width: 850 },
          }
        );
        tutorialText.setDepth(102);
        this.currentTutorialStep.tutorialText = tutorialText;

        // Create a text typing animation
        animateText(tutorialText, 2).then(() => {
          // Load all the relevant Game Objects
          tutorialStepData.onTutorialLoaded(() => {
            tutorialStepData
              .highlightedObjects()
              .forEach((highlightedObject) => {
                const { x, y } = highlightedObject;
                const spotlight = this.currentScene.add.pointlight(
                  x + 20,
                  y,
                  0xffffff,
                  200,
                  0.1,
                  0.1
                );
                spotlight.setDepth(-1);
                spotlight.setAlpha(0);
                spotlights.push(spotlight); // Store the spotlight for later use
              });

            this.currentTutorialStep.lights = spotlights;

            // After finishing with the animations, allow to skip and pause the time
            this.currentScene.tweens.add({
              targets: spotlights,
              alpha: 1, // Fade in spotlights
              duration: 200,
              ease: "Power2",
              onComplete: () => {
                skipText.setVisible(true);
                this.currentScene.scene.get("GameScene").time.paused = true;
              },
            });
          });
        });
      },
    });
  }

  // Close the current tutorial step
  closeTutorialStep() {
    if (this.currentTutorialStep.overlay)
      this.currentTutorialStep.overlay.destroy();
    if (this.currentTutorialStep.tutorialText)
      this.currentTutorialStep.tutorialText.setVisible(false);
    if (this.currentTutorialStep.skipText)
      this.currentTutorialStep.skipText.destroy();
    if (this.currentTutorialStep.lights)
      this.currentTutorialStep.lights.forEach((light) => light.destroy());

    this.currentTutorialStep = {};
  }

  createSkipText() {
    // Create skip text at the bottom center of the overlay
    const skipTextX = this.currentScene.sys.canvas.width / 2;
    const skipTextY = 500;
    const skipText = this.currentScene.add.text(
      skipTextX,
      skipTextY,
      "Press here to skip tutorials",
      {
        ...defaultTextStyle,
        align: "center",
        fontSize: "20px",
        color: "#ffffff",
      }
    );
    skipText.setOrigin(0.5, 0.5); // Center the text horizontally
    skipText.setAlpha(0.7);
    skipText.setDepth(103); // Set above the overlay and spotlights

    skipText.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
      this.skipTutorialPressed();
    });
    skipText.setVisible(false);
    return skipText;
  }

  handleTutorialStepCompletion() {
    if (this.currentTutorialStep.data)
      this.currentTutorialStep.data.onTutorialFinished();
  }

  skipTutorialPressed() {
    this.shouldSkipTutorials = true;
    this.closeTutorialStep();
    this.skipTutorialsCallback();
  }
}
