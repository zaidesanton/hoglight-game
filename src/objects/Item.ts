// src/objects/Item.ts
import Phaser from "phaser";
import { itemSettings } from "../consts";

export type ItemConfig = {
  itemType: string;
  value: number;
  groupId?: string;
  isHidden?: boolean;
};

export default class Item extends Phaser.Physics.Arcade.Sprite {
  public config: ItemConfig;
  public valueText!: Phaser.GameObjects.Text;

  // Declare body as Arcade Body
  declare body: Phaser.Physics.Arcade.Body;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    itemConfig: ItemConfig
  ) {
    super(scene, x, y, texture);
    this.config = {
      isHidden: false,
      ...itemConfig,
    };

    // Set the display size
    const itemWidth = 64; // Desired width in pixels
    const itemHeight = 64; // Desired height in pixels
    this.setDisplaySize(itemWidth, itemHeight);

    // Add the item to the scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Adjust the physics body size to match the new display size
    this.body.setSize(itemWidth, itemHeight);
    this.body.setImmovable(false);
    this.body.setAllowGravity(false);

    this.createValueText();
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);

    if (this.valueText) {
      if (this.valueText) {
        const smoothingFactor = 0.5; // Adjust this value for more or less smoothing

        // Smooth transition for X and Y
        const newX = Phaser.Math.Interpolation.Linear(
          [this.valueText.x, this.x + 30],
          smoothingFactor
        );
        const newY = Phaser.Math.Interpolation.Linear(
          [this.valueText.y, this.y - 10],
          smoothingFactor
        );

        // Apply the new positions
        this.valueText.setPosition(newX, newY);
      }
    }

    // Update the position of the text to stay aligned with the item
    //this.valueText.setX(this.x + 30);
    //this.valueText.setY(this.y - 10);
  }

  createValueText() {
    const itemValue = Number.isInteger(this.config.value)
      ? this.config.value
      : this.config.value.toFixed(1);

    // Create text positioned to the right of the item
    this.valueText = this.scene.add.text(
      this.x + 30,
      this.y - 10,
      `+${itemValue}${
        itemSettings[this.config.itemType].isPercentage ? "%" : ""
      }`,
      {
        fontSize: "26px",
        color: "#000000",
        fontStyle: "bold",
        stroke: "#ffffff",
        strokeThickness: 2,
      }
    );

    if (this.config.isHidden) {
      this.valueText.alpha = 0;
    }
  }

  collect() {
    // Fade out and move the text upwards
    this.scene.tweens.add({
      targets: [this.valueText],
      y: this.valueText.y - 30,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.valueText.destroy();
      },
    });

    // Destroy the item itself
    this.destroy();
  }

  fadeOut() {
    this.body.checkCollision.none = true;
    this.scene.tweens.add({
      targets: [this, this.valueText],
      alpha: 0,
      duration: 100,
      onComplete: () => {
        this.destroy();
        this.valueText.destroy();
      },
    });
  }

  revealText() {
    if (this.valueText && this.scene) {
      this.scene.tweens.add({
        targets: this.valueText,
        alpha: 1, // Fade in the text
        duration: 200, // Adjust the duration of the fade-in
      });
    }
  }
}
