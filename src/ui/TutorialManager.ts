// src/ui/TutorialManager.ts
import { GameObjects, Scene } from "phaser";
import { GameObjectWithLocation } from "../scenes/UIScene";
import { animateText } from "./TextAnimator";
import { GameConstants, defaultTextStyle } from "../consts";

export enum TutorialLocation {
  Middle,
  Upper,
}

export type TutorialStepData = {
  text: string;
  // Passing a function do dynmically return the game objects, after they are created
  highlightedObjects: () => GameObjectWithLocation[];
  onTutorialFinished: () => void;
  onTutorialLoaded: (callback: () => void) => void;
  tutorialLocation: TutorialLocation;
};

// All are optional, as a tutorial can be skipped at any moment
export type TutorialStepState = {
  tutorialText?: GameObjects.Text;
  overlay?: GameObjects.Graphics;
  lights?: GameObjects.PointLight[];
  data?: TutorialStepData;
  skipText?: GameObjects.Text;
  nextText?: GameObjects.Text;
  didStepFinishLoading: Boolean;
};

export default class TutorialManager {
  private currentScene: Scene;
  private currentTutorialStep: TutorialStepState = {
    didStepFinishLoading: false,
  };
  private skipTutorialsCallback: () => void;
  public shouldSkipTutorials: Boolean;

  constructor(scene: Scene, skipTutorialsCallback: () => void) {
    this.currentScene = scene;
    this.shouldSkipTutorials =
      this.currentScene.registry.get("shouldSkipTutorials") || false;
    this.skipTutorialsCallback = skipTutorialsCallback;
  }

  // Sorry, this function is a mess
  createTutorialStep(tutorialStepData: TutorialStepData) {
    const overlay = this.currentScene.add.graphics();
    this.currentTutorialStep.overlay = overlay;
    this.currentTutorialStep.data = tutorialStepData;

    const tutorialRectX = 10;
    const firstLanePosition = GameConstants.LANE_DRAWING_Y_POSITIONS[0];
    const lastLanePosition =
      GameConstants.LANE_DRAWING_Y_POSITIONS[
        GameConstants.LANE_DRAWING_Y_POSITIONS.length - 1
      ];

    let tutorialRectY = firstLanePosition - 10; // Adjust for your lane positions
    if (tutorialStepData.tutorialLocation == TutorialLocation.Upper)
      tutorialRectY = 10;

    const roundedRectWidth = this.currentScene.sys.canvas.width - 20;
    const roundedRectHeight = lastLanePosition - firstLanePosition + 20;

    overlay.fillStyle(0x000000, 0.8); // Black color, 70% opacity for the dimming effect
    overlay.fillRoundedRect(
      tutorialRectX,
      tutorialRectY,
      roundedRectWidth,
      roundedRectHeight,
      20
    ); // Rounded corners
    overlay.setDepth(100);
    overlay.setAlpha(0);

    let spotlights: GameObjects.PointLight[] = [];
    let tutorialText: GameObjects.Text;

    this.currentTutorialStep.skipText = this.createSkipAllText(
      tutorialRectY,
      roundedRectHeight
    );
    this.currentTutorialStep.nextText = this.createNextTutorialText(
      tutorialRectY,
      roundedRectHeight
    );

    // Create the fade-in animation for the overlay (200ms)
    this.currentScene.tweens.add({
      targets: overlay,
      alpha: 0.8, // Fade in to 80% opacity
      duration: 400,
      ease: "Power2",
      onComplete: () => {
        tutorialText = this.currentScene.add.text(
          50,
          tutorialRectY + 30,
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

            if (spotlights.length == 0) {
              this.currentTutorialStep.skipText?.setVisible(true);
              this.currentTutorialStep.nextText?.setVisible(true);
              this.currentTutorialStep.didStepFinishLoading = true;
              this.currentScene.scene.get("GameScene").time.paused = true;
            } else {
              // After finishing with the animations, allow to skip and pause the time
              this.currentScene.tweens.add({
                targets: spotlights,
                alpha: 1, // Fade in spotlights
                duration: 200,
                ease: "Power2",
                onComplete: () => {
                  this.currentTutorialStep.skipText?.setVisible(true);
                  this.currentTutorialStep.nextText?.setVisible(true);
                  this.currentTutorialStep.didStepFinishLoading = true;
                  this.currentScene.scene.get("GameScene").time.paused = true;
                },
              });
            }
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
    if (this.currentTutorialStep.nextText)
      this.currentTutorialStep.nextText.destroy();
    if (this.currentTutorialStep.lights)
      this.currentTutorialStep.lights.forEach((light) => light.destroy());

    this.currentTutorialStep = { didStepFinishLoading: false };
  }

  createNextTutorialText(tutorialRectY: number, tutorialHeight: number) {
    const nextTextX = this.currentScene.sys.canvas.width / 2;
    const nextTextY = tutorialRectY + tutorialHeight - 25;

    const nextText = this.currentScene.add.text(
      nextTextX,
      nextTextY,
      "Click anywhere",
      {
        ...defaultTextStyle,
        align: "center",
        fontSize: "20px",
        color: "#ffffff",
      }
    );
    nextText.setOrigin(0.5, 0.5); // Center the text horizontally
    nextText.setDepth(103);
    nextText.setVisible(false);
    return nextText;
  }

  createSkipAllText(tutorialRectY: number, tutorialHeight: number) {
    // Create skip text at the bottom center of the overlay
    const skipTextX = this.currentScene.sys.canvas.width * 0.85;
    const skipTextY = tutorialRectY + tutorialHeight - 25;
    const skipText = this.currentScene.add.text(
      skipTextX,
      skipTextY,
      "Click to skip tutorials",
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
    if (
      this.currentTutorialStep.data &&
      this.currentTutorialStep.didStepFinishLoading
    )
      this.currentTutorialStep.data.onTutorialFinished();
  }

  skipTutorialPressed() {
    this.currentScene.registry.set("shouldSkipTutorials", true);
    this.shouldSkipTutorials = true;
    this.closeTutorialStep();
    this.skipTutorialsCallback();
  }
}
