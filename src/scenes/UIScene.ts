// src/scenes/UIScene.ts
import Phaser from "phaser";
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

    this.createFlashingButton();
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

  createFlashingButton() {
    const hoglightButton = this.add.graphics();
    hoglightButton.fillStyle(0xffcc00, 1); // Button color
    hoglightButton.fillRoundedRect(
      20,
      this.sys.canvas.height - 60,
      200,
      50,
      20
    ); // Rounded rectangle
    hoglightButton.setInteractive(
      new Phaser.Geom.Rectangle(20, this.sys.canvas.height - 60, 150, 50),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(40, this.sys.canvas.height - 50, "Hoglight", {
      fontSize: "32px",
      color: "#000000",
      fontStyle: "bold",
    });

    hoglightButton.on("pointerdown", () => {
      this.scene.get("GameScene").events.emit("flashlightActivated");
    });
  }
}
