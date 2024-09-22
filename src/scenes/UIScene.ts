// src/scenes/UIScene.ts
import Phaser, { GameObjects } from "phaser";
import MetricDisplay from "../ui/MetricDisplay";
import { GameConstants } from "../consts";

export default class UIScene extends Phaser.Scene {
  private conversionRateText!: MetricDisplay;
  private pageVisitsText!: MetricDisplay;
  private retentionRateText!: MetricDisplay;
  private totalPurchasesText!: MetricDisplay;
  private timeLeftText!: MetricDisplay;

  constructor() {
    super({ key: "UIScene" });
  }

  create() {
    this.conversionRateText = new MetricDisplay(
      this,
      20,
      20,
      "Conversion Rate",
      { suffix: "%", shouldAnimate: true, toFixed: 1 }
    );
    this.pageVisitsText = new MetricDisplay(this, 20, 50, "Page Visits/sec", {
      shouldAnimate: true,
    });
    this.retentionRateText = new MetricDisplay(this, 20, 80, "Retention Rate", {
      shouldAnimate: true,
      toFixed: 1,
    });
    this.totalPurchasesText = new MetricDisplay(
      this,
      20,
      110,
      "Total Purchases",
      {}
    );
    this.timeLeftText = new MetricDisplay(this, 700, 20, "Time Left", {
      suffix: "s",
    });

    // Listen for events to update the UI
    const gameScene = this.scene.get("GameScene");
    gameScene.events.on("updateMetrics", this.updateMetricsDisplay, this);

    this.createRoundedButton();
    this.updateMetricsDisplay({
      conversionRate: GameConstants.INITIAL_CONVERSION_RATE,
      pageVisitsPerSecond: GameConstants.INITIAL_PAGE_VISITS,
      retentionRate: GameConstants.INITIAL_RETENTION_RATE,
      totalPurchases: 0,
      timeLeft: 60,
    });
  }

  updateMetricsDisplay(metrics: any) {
    this.animateMetricChange(this.conversionRateText, metrics.conversionRate);
    this.animateMetricChange(this.pageVisitsText, metrics.pageVisitsPerSecond);
    this.animateMetricChange(this.retentionRateText, metrics.retentionRate);
    this.animateMetricChange(this.totalPurchasesText, metrics.totalPurchases);
    this.animateMetricChange(this.timeLeftText, metrics.timeLeft);
  }

  animateMetricChange(textObject: MetricDisplay, newValue: number | string) {
    textObject.updateValue(newValue);
  }

  createRoundedButton() {
    const radius = 20;
    const button = this.add.graphics();
    const buttonWidth = 200;
    const buttonHeight = 50;
    const color = 0xffcc00;
    const xLocation = 20 + buttonWidth / 2;
    const yLocation = this.sys.canvas.height - 100 + buttonHeight / 2;
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
    button.on("pointerdown", () => {
      this.scene.get("GameScene").events.emit("flashlightActivated");
      this.input.setDefaultCursor("default");

      // Start cooldown logic
      this.startButtonCooldown(button, buttonText, 7); // Cooldown for 7 seconds
    });
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

    // Update the button text to show the cooldown timer
    const countdownInterval = this.time.addEvent({
      delay: 1000, // 1 second delay for the countdown
      callback: () => {
        remainingTime--;
        buttonText.setText(`${remainingTime}s`); // Update button text with remaining seconds
        buttonText.setOrigin(0.5, 0.5); // Center the text in the button

        // When the cooldown finishes, reset the button
        if (remainingTime <= 0) {
          countdownInterval.remove(false); // Stop the countdown
          button.setInteractive(); // Re-enable the button
          buttonText.setText("Hoglight"); // Reset the button text
          button.setAlpha(1);
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
}
