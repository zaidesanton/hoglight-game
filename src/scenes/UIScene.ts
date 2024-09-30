// src/scenes/UIScene.ts
import Phaser, { GameObjects } from "phaser";
import MetricDisplay from "../ui/MetricDisplay";
import { GameConstants, defaultTextStyle, TutorialsConsts } from "../consts";
import TutorialManager, { TutorialLocation } from "../ui/TutorialManager"; // Import TutorialManager

export type Metrics = {
  conversionRate?: number;
  pageVisitsPerSecond?: number;
  retentionRate?: number;
  totalPurchases?: number;
  timeLeft?: number;
  currentConversions?: number;
};

export type GameObjectWithLocation =
  | GameObjects.Text
  | GameObjects.Sprite
  | GameObjects.Image;

// const TutorialSteps: { [key: string]: TutorialStepData } = [{}];
export default class UIScene extends Phaser.Scene {
  private tutorialManager: TutorialManager;
  private conversionRateText?: MetricDisplay;
  private pageVisitsText?: MetricDisplay;
  private retentionRateText?: MetricDisplay;
  private totalPurchasesText?: MetricDisplay;
  private timeLeftText?: MetricDisplay;
  private basicInstructionText: GameObjects.Text;
  private tutorialObjectsToDeleteAfterFinish: GameObjects.GameObject[];
  private wereFunnelFiguresCreate: boolean;
  private actionButton: GameObjects.Graphics;
  private actionButtonText: GameObjects.Text;
  private actionCooldownTimer: Phaser.Time.TimerEvent;
  private isActionButtonDisabled: boolean;
  private wasActionButtonPressed: boolean;

  constructor() {
    super({ key: "UIScene" });
  }

  reset() {
    if (this.totalPurchasesText) this.totalPurchasesText = undefined;
    if (this.conversionRateText) this.conversionRateText = undefined;
    if (this.pageVisitsText) this.pageVisitsText = undefined;
    if (this.retentionRateText) this.retentionRateText = undefined;
    if (this.timeLeftText) this.timeLeftText = undefined;

    this.wasActionButtonPressed = false;
    this.isActionButtonDisabled = false;
    this.wereFunnelFiguresCreate = false;
    this.tutorialObjectsToDeleteAfterFinish = [];
  }

  create() {
    // In case the scene runs for the second time
    this.reset();
    this.tutorialManager = new TutorialManager(this, () =>
      this.finishGameStartTutorial()
    );

    const gameScene = this.scene.get("GameScene");
    gameScene.events.on(
      "updateMetricsDisplay",
      this.updateMetricsDisplay,
      this
    );
    gameScene.events.on(
      "playerMovementHappened",
      this.removeBasicInstructionsText,
      this
    );
    gameScene.events.on(
      "screenPressed",
      () => this.tutorialManager.handleTutorialStepCompletion(),
      this
    );

    gameScene.events.on(
      "actionButtonPressed",
      () => this.triggerActionButtonTutorial(),
      this
    );
    this.createActionButton();
    this.updateMetricsDisplay({
      pageVisitsPerSecond: GameConstants.INITIAL_PAGE_VISITS,
      retentionRate: GameConstants.INITIAL_RETENTION_RATE,
      totalPurchases: 0,
      timeLeft: 60,
    });

    // Initialize TutorialManager
    if (this.tutorialManager.shouldSkipTutorials)
      this.finishGameStartTutorial();
    else this.createFunnelTutorialStep();
  }

  createActionButtonTutorialStep() {
    const gameScene = this.scene.get("GameScene");
    gameScene.time.paused = true;
    gameScene.physics.world.pause();

    this.tutorialManager.createTutorialStep({
      highlightedObjects: () => [],
      text: "Nice move!\n\nThe hoglight button will reveal hidden items to collect, AND show you the best option among each trio. \n\nThere is a cooldown, so use it carefully!",
      onTutorialFinished: () => {
        //const gameScene = this.scene.get("GameScene");
        this.tutorialManager.closeTutorialStep();
        this.actionCooldownTimer.paused = false;
        gameScene.time.paused = false;
        gameScene.physics.world.resume();
      },
      onTutorialLoaded: (callback: () => void) => {
        this.actionButtonPressed();
        this.actionCooldownTimer.paused = true;
        callback();
      },
      tutorialLocation: TutorialLocation.Middle,
    });
  }

  createFunnelTutorialStep() {
    this.tutorialManager.createTutorialStep({
      highlightedObjects: () => [this.pageVisitsText!],
      text: "Welcome to Hoglight Blitz!\n\nYou have 60 seconds to get the maximum purchases for your SaaS.\n\nHere you can see the number of users who visit your site each second!",
      onTutorialFinished: () => {
        this.tutorialManager.closeTutorialStep();
        this.createConversionTutorialStep();
      },
      onTutorialLoaded: (callback: () => void) =>
        this.loadFunnelTutorialStepObjects(callback),
      tutorialLocation: TutorialLocation.Middle,
    });
  }

  createConversionTutorialStep() {
    this.tutorialManager.createTutorialStep({
      highlightedObjects: () => [this.conversionRateText!],
      text: "Each second, some of the users who visit your site will purchase a subscription.\n\nThis is your conversion rate. Keep an eye on it!",
      onTutorialFinished: () => {
        this.tutorialManager.closeTutorialStep();
        this.createRetentionTutorialStep();
      },
      onTutorialLoaded: (callback: () => void) =>
        this.loadConversionTutorialStepObjects(callback),
      tutorialLocation: TutorialLocation.Middle,
    });
  }

  createRetentionTutorialStep() {
    this.tutorialManager.createTutorialStep({
      highlightedObjects: () => [this.retentionRateText!],
      text: "Most of the non-converted users will leave you. That's life.\n\nSome of them, will give you another chance! Well, after you increase your retention rate - right now you are at a sad 0.",
      onTutorialFinished: () => {
        this.tutorialManager.closeTutorialStep();
        this.finishGameStartTutorial();
      },
      onTutorialLoaded: (callback: () => void) =>
        this.loadRetentionTutorialStepObjects(callback),
      tutorialLocation: TutorialLocation.Middle,
    });
  }

  removeBasicInstructionsText() {
    if (this.basicInstructionText) {
      this.basicInstructionText.destroy();
    }
  }

  updateMetricsDisplay(metrics: Metrics) {
    if (metrics.conversionRate !== undefined && this.conversionRateText)
      this.animateMetricChange(this.conversionRateText, metrics.conversionRate);
    if (metrics.pageVisitsPerSecond !== undefined && this.pageVisitsText)
      this.animateMetricChange(
        this.pageVisitsText,
        metrics.pageVisitsPerSecond
      );
    if (metrics.retentionRate !== undefined && this.retentionRateText)
      this.animateMetricChange(this.retentionRateText, metrics.retentionRate);
    if (metrics.totalPurchases !== undefined && this.totalPurchasesText)
      this.animatePurchasesChange(
        metrics.totalPurchases,
        metrics.currentConversions
      );
    if (metrics.timeLeft !== undefined && this.timeLeftText)
      this.animateMetricChange(this.timeLeftText, metrics.timeLeft);
  }

  animateMetricChange(textObject: MetricDisplay, newValue: number | string) {
    textObject.updateValue(newValue);
  }

  animatePurchasesChange(totalPurchases: number, newConversions?: number) {
    if (!newConversions) {
      this.animateMetricChange(this.totalPurchasesText!, totalPurchases);
    } else {
      const purchaseText = this.add.text(420, 160, `+${newConversions}`, {
        fontSize: "28px",
        color: "#000",
      });

      if (newConversions) {
        this.tweens.add({
          targets: purchaseText,
          x: 580,
          y: 200,
          alpha: 0.5,
          duration: 700,
          ease: "easeOut",
          onComplete: () => {
            purchaseText.destroy();

            // Once the purchaseText animation finishes, update the total purchases metric to 5
            this.animateMetricChange(this.totalPurchasesText!, totalPurchases);
          },
        });
      }
    }
  }

  createActionButton() {
    const radius = 20;
    const button = this.add.graphics();
    const buttonWidth = 200;
    const buttonHeight = 50;
    const color = 0xffcc00;
    const xLocation = 20 + buttonWidth / 2;
    const yLocation = 600;
    const text = "Hoglight";

    // Draw rounded rectangle
    button.fillStyle(color, 1);
    button.fillRoundedRect(
      -buttonWidth / 2,
      -buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      radius
    );
    button.setPosition(xLocation, yLocation);

    // Add button text
    const buttonText = this.add
      .text(0, 0, text, {
        fontFamily: "Arial Black",
        fontSize: 24,
        color: "#000000",
        align: "center",
        wordWrap: { width: buttonWidth - 20 },
      })
      .setOrigin(0.5, 0.5);

    buttonText.setPosition(xLocation, yLocation);

    // Make button interactive if not disabled
    button.setInteractive(
      new Phaser.Geom.Rectangle(
        -buttonWidth / 2,
        -buttonHeight / 2,
        buttonWidth,
        buttonHeight
      ),
      Phaser.Geom.Rectangle.Contains
    );

    button.on("pointerover", () => {
      this.enterButtonHoverState(button, buttonText);
    });

    button.on("pointerout", () => {
      this.enterButtonRestState(button, buttonText);
    });

    // Handle button click (flashlight activation)
    button.on("pointerdown", () => this.triggerActionButtonTutorial());

    this.actionButton = button;
    this.actionButtonText = buttonText;
  }

  triggerActionButtonTutorial() {
    if (
      !this.wasActionButtonPressed &&
      !this.tutorialManager.shouldSkipTutorials
    ) {
      this.createActionButtonTutorialStep();
      this.wasActionButtonPressed = true;
    } else {
      this.actionButtonPressed();
    }
  }

  actionButtonPressed() {
    if (!this.isActionButtonDisabled) {
      this.scene.get("GameScene").events.emit("flashlightActivated");
      this.input.setDefaultCursor("default");

      // Start cooldown logic
      this.startButtonCooldown(
        this.actionButton,
        this.actionButtonText,
        GameConstants.ACTION_BUTTON_COOLDOWN
      );
    }
  }

  startButtonCooldown(
    button: Phaser.GameObjects.Graphics,
    buttonText: Phaser.GameObjects.Text,
    cooldownTime: number
  ) {
    let remainingTime = cooldownTime;

    button.disableInteractive();
    buttonText.setText(`${cooldownTime}s`);
    button.setAlpha(0.3); // Reduce alpha to gray out
    this.isActionButtonDisabled = true;

    if (this.actionCooldownTimer) {
      this.actionCooldownTimer.destroy();
    }
    // Update the button text to show the cooldown timer
    this.actionCooldownTimer = this.time.addEvent({
      delay: 1000, // 1 second delay for the countdown
      callback: () => {
        remainingTime--;
        buttonText.setText(`${remainingTime}s`); // Update button text with remaining seconds
        buttonText.setOrigin(0.5, 0.5); // Center the text in the button

        // When the cooldown finishes, reset the button
        if (remainingTime <= 0) {
          this.actionCooldownTimer.remove(false); // Stop the countdown
          button.setInteractive(); // Re-enable the button
          buttonText.setText("Hoglight"); // Reset the button text
          button.setAlpha(1);
          this.isActionButtonDisabled = false;
        }
      },
      loop: true,
    });
  }

  // Hover effect: enlarge button slightly
  enterButtonHoverState(
    button: GameObjects.Graphics,
    buttonText: GameObjects.Text
  ) {
    this.tweens.add({
      targets: [button, buttonText],
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 200,
      ease: "Power2",
    });
  }

  // Rest state: return to original size
  enterButtonRestState(
    button: GameObjects.Graphics,
    buttonText: GameObjects.Text
  ) {
    this.tweens.add({
      targets: [button, buttonText],
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: "Power2",
    });
  }

  loadFunnelTutorialStepObjects(callback: () => void) {
    const rollDelay = 200;
    let completedAnimations = 0; // Track how many animations have completed
    this.createFunnelTexts();

    this.updateMetricsDisplay({
      pageVisitsPerSecond: GameConstants.INITIAL_PAGE_VISITS,
    });

    // Unpause the game to allow animations to play. Dirty but works.
    this.scene.get("GameScene").time.paused = false;

    for (let i = 0; i < TutorialsConsts.STICK_FIGURES_IN_FUNNEL_NUMBER; i++) {
      const stickFigure = this.add
        .sprite(
          TutorialsConsts.GAME_START_TUTORIAL_X +
            i * TutorialsConsts.STICK_FIGURES_SPACING,
          TutorialsConsts.GAME_START_TUTORIAL_Y,
          "neutral"
        )
        .setScale(GameConstants.STICK_FIGURE_SCALE)
        .setAlpha(0);

      // Delay each figure by the rolling delay
      this.time.delayedCall(rollDelay * i, () => {
        this.tweens.add({
          targets: stickFigure,
          alpha: 1, // Make visible
          duration: TutorialsConsts.STICK_FIGURES_ANIMATION_DURATION,
          onComplete: () => {
            completedAnimations++;

            if (
              completedAnimations ===
              TutorialsConsts.STICK_FIGURES_IN_FUNNEL_NUMBER
            ) {
              // Pause the game after all animations are done
              this.scene.get("GameScene").time.paused = true;
              this.wereFunnelFiguresCreate = true;
              callback();
            }
          },
        });
      });
    }
  }

  loadConversionTutorialStepObjects(callback: () => void) {
    this.createConversionTexts();
    this.updateMetricsDisplay({
      conversionRate: GameConstants.INITIAL_CONVERSION_RATE,
    });

    // Delay the appearance of the total purchases text and metric
    this.time.delayedCall(300, () => {
      this.createPurchasesObjects();

      // Update the total purchases metric to 0
      this.updateMetricsDisplay({
        totalPurchases: 0,
      });

      // After another 300ms, show the temporary purchaseText and animate it
      this.time.delayedCall(300, () => {
        this.animatePurchasesChange(5, 5);
        callback();
      });
    });
  }

  loadRetentionTutorialStepObjects(callback: () => void) {
    const rollDelay = 200;
    let completedAnimations = 0; // Track how many animations have completed
    const totalAnimations = 3; // Number of stick figures (or animations)

    // Unpause the game to allow animations to play. Dirty but works.
    this.scene.get("GameScene").time.paused = false;

    this.createRetentionTexts();
    this.updateMetricsDisplay({
      retentionRate: GameConstants.INITIAL_RETENTION_RATE,
    });

    for (let i = 0; i < totalAnimations; i++) {
      const stickFigure = this.add
        .sprite(
          TutorialsConsts.LEAVING_STICK_FIGURES_X +
            i * TutorialsConsts.LEAVING_STICK_FIGURES_X_SPACING,
          TutorialsConsts.LEAVING_STICK_FIGURES_Y -
            i * TutorialsConsts.LEAVING_STICK_FIGURES_Y_SPACING,
          "sad"
        )
        .setScale(GameConstants.STICK_FIGURE_SCALE)
        .setAlpha(0);
      stickFigure.flipX = true;
      this.tutorialObjectsToDeleteAfterFinish.push(stickFigure);

      // Delay each figure by the rolling delay
      this.time.delayedCall(rollDelay * i, () => {
        this.tweens.add({
          targets: stickFigure,
          alpha: 1, // Make visible
          duration: TutorialsConsts.STICK_FIGURES_ANIMATION_DURATION,
          onComplete: () => {
            completedAnimations++;

            if (completedAnimations === totalAnimations) {
              const arrowImage = this.add
                .image(115, 115, "arrow")
                .setScale(0.7);
              this.tutorialObjectsToDeleteAfterFinish.push(arrowImage);

              const retainedFigure = this.add
                .sprite(270, 70, "happy")
                .setAlpha(0)
                .setScale(GameConstants.STICK_FIGURE_SCALE);
              retainedFigure.flipX = true;
              this.tutorialObjectsToDeleteAfterFinish.push(retainedFigure);

              this.tweens.add({
                targets: retainedFigure,
                alpha: 1,
                duration: TutorialsConsts.STICK_FIGURES_ANIMATION_DURATION,
                onComplete: () => {
                  // Pause the game after all animations are done
                  this.scene.get("GameScene").time.paused = true;
                  callback();
                },
              });
            }
          },
        });
      });
    }
  }

  createPurchasesObjects() {
    if (!this.totalPurchasesText) {
      this.totalPurchasesText = new MetricDisplay(this, 620, 200, {});
      this.add.text(550, 230, "Total purchases", defaultTextStyle);
      this.add.image(625, 165, "purchases").setScale(0.15);
    }
  }

  createRetentionTexts() {
    if (!this.retentionRateText) {
      // Title text, and then actual number text
      this.add.text(50, 10, "Retention Rate", defaultTextStyle);
      this.retentionRateText = new MetricDisplay(this, 120, 40, {
        shouldAnimate: true,
        toFixed: 1,
        suffix: "%",
      });
    }
  }

  createConversionTexts() {
    if (!this.conversionRateText) {
      this.conversionRateText = new MetricDisplay(this, 350, 200, {
        suffix: "%",
        shouldAnimate: true,
        toFixed: 1,
      });
      this.add.text(300, 230, "Conversion Rate", defaultTextStyle);
      this.add.image(385, 160, "gate").setScale(0.7);
    }
  }

  createFunnelTexts() {
    if (!this.pageVisitsText) {
      // Number text, and then title text
      this.pageVisitsText = new MetricDisplay(this, 120, 200, {
        shouldAnimate: true,
      });
      this.add.text(50, 230, "Visits / second", defaultTextStyle);
    }
  }

  createFunnelFigures() {
    if (!this.wereFunnelFiguresCreate) {
      for (let i = 0; i < TutorialsConsts.STICK_FIGURES_IN_FUNNEL_NUMBER; i++) {
        this.add
          .sprite(
            TutorialsConsts.GAME_START_TUTORIAL_X +
              i * TutorialsConsts.STICK_FIGURES_SPACING,
            TutorialsConsts.GAME_START_TUTORIAL_Y,
            "neutral"
          )
          .setScale(GameConstants.STICK_FIGURE_SCALE);
      }
      this.wereFunnelFiguresCreate = true;
    }
  }

  finishGameStartTutorial() {
    console.log("Finish game tutorial called");
    this.tutorialObjectsToDeleteAfterFinish.forEach((object) =>
      object.destroy()
    );

    // In case tutorial was Skipped, create the objects that were not created during the tutorial.
    this.createConversionTexts();
    this.createFunnelTexts();
    this.createRetentionTexts();
    this.createFunnelFigures();

    this.createPurchasesObjects();

    // Update the total purchases metric to 0 - in the tutorial flow, this happens using an animation
    this.updateMetricsDisplay({
      totalPurchases: 0,
    });

    // Number text, and then title text
    this.basicInstructionText = this.add
      .text(350, 580, "Arrows ↑↓ or tap screen to move, \nSpace for Hoglight", {
        align: "center",
        ...defaultTextStyle,
      })
      .setAlpha(0.5);

    this.timeLeftText = new MetricDisplay(this, 920, 582, {
      suffix: "s",
    });
    this.add.text(780, 580, "Time left: ", {
      ...defaultTextStyle,
      fontSize: 24,
    });

    this.events.emit("finishedTutorial");
  }
}
