// src/ui/MetricDisplay.ts
import Phaser from "phaser";

export type MetricDisplayConfig = {
  suffix?: string;
  shouldAnimate?: boolean;
  toFixed?: number;
};

const defaultConfig: MetricDisplayConfig = {
  suffix: "",
  shouldAnimate: false,
  toFixed: 0,
};

export default class MetricDisplay extends Phaser.GameObjects.Text {
  private value: number | string = -1;
  private label: string;
  private config: MetricDisplayConfig;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    metricDisplayConfig: MetricDisplayConfig
  ) {
    const textStyle = {
      fontSize: "24px",
      fontFamily: "Georgia, Arial, sans-serif", // A nice serif/sans-serif combination
      fontWeight: "bold", // Makes the font bold
      color: "#000000",
    };
    super(scene, x, y, "", textStyle);
    this.label = label;
    this.config = {
      ...defaultConfig,
      ...metricDisplayConfig,
    };
    this.updateValue(this.value);
    scene.add.existing(this);
  }

  updateValue(updatedValue: number | string) {
    const newValue =
      typeof updatedValue === "number"
        ? updatedValue.toFixed(this.config.toFixed)
        : updatedValue;

    // Check if the value has changed
    if (newValue !== String(this.value)) {
      this.setText(`${this.label}: ${newValue}${this.config.suffix}`);
      this.value = newValue;

      // Animate if configured
      if (this.config.shouldAnimate) {
        this.scene.tweens.add({
          targets: this,
          scaleX: 1.1,
          scaleY: 1.1,
          yoyo: true,
          duration: 200,
        });
      }
    }
  }
}
