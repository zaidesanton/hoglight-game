// src/ui/MetricDisplay.ts
import Phaser from "phaser";
import { defaultTextStyle } from "../consts";

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
  private config: MetricDisplayConfig;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    metricDisplayConfig: MetricDisplayConfig
  ) {
    super(scene, x, y, "", defaultTextStyle);
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
      this.setText(`${newValue}${this.config.suffix}`);
      this.value = newValue;

      // Animate if configured
      if (this.config.shouldAnimate) {
        this.scene.tweens.add({
          targets: this,
          scaleX: 1.2,
          scaleY: 1.2,
          yoyo: true,
          duration: 250,
        });
      }
    }
  }
}
