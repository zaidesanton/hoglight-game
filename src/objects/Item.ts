// src/objects/Item.ts
import Phaser from "phaser";

export type ItemConfig = {
  itemType: string;
  value: number;
  groupId?: string;
  isHidden?: boolean;
};

export default class Item extends Phaser.Physics.Arcade.Sprite {
  public config: ItemConfig;
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
  }
}
