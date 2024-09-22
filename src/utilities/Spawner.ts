// src/utilities/Spawner.ts
import Phaser from "phaser";
import Item from "../objects/Item";
import { GameConstants, itemSettings } from "../consts";

export default class Spawner {
  private scene: Phaser.Scene;
  private lanes: number[];
  //private spawnTimer!: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, lanes: number[]) {
    this.scene = scene;
    this.lanes = lanes;
    this.startSpawningRegularItems();
    this.startSpawningHiddenItems();
  }

  startSpawningRegularItems() {
    this.scene.time.addEvent({
      delay: 2000, // Adjust spawn rate as needed
      callback: this.spawnRegularItems,
      callbackScope: this,
      loop: true,
    });
  }

  startSpawningHiddenItems() {
    this.scene.time.addEvent({
      delay: 1050, // Adjust spawn rate as needed
      callback: this.spawnHiddenItems,
      callbackScope: this,
      loop: true,
    });
  }

  spawnHiddenItems() {
    const hiddenItemType = Phaser.Utils.Array.GetRandom(
      GameConstants.ITEM_TYPES
    );
    const hiddenItemValue = this.getRandomValueForItem(hiddenItemType);
    const hiddenItemTexture = hiddenItemType;

    // Hidden item in a random lane
    const randomLane = Phaser.Utils.Array.GetRandom(this.lanes);
    const hiddenItem = new Item(
      this.scene,
      1000,
      randomLane,
      hiddenItemTexture,
      {
        itemType: hiddenItemType,
        value: hiddenItemValue,
        isHidden: true,
      }
    );
    hiddenItem.setAlpha(0.1);
    hiddenItem.body.checkCollision.none = true;

    this.scene.events.emit("hiddenItemCreated", hiddenItem);
  }

  spawnRegularItems() {
    const groupId = Phaser.Utils.String.UUID();

    // Group to hold all items
    const currentItemsGroup = this.scene.physics.add.group({
      runChildUpdate: true,
      active: true,
      visible: true,
      immovable: false,
    });

    this.lanes.forEach((laneY) => {
      const itemType = Phaser.Utils.Array.GetRandom(GameConstants.ITEM_TYPES);
      const value = this.getRandomValueForItem(itemType);
      const texture = itemType;

      const item = new Item(
        this.scene,
        1050, // Start at the right edge of the screen
        laneY,
        texture,
        {
          itemType,
          value,
          groupId,
        }
      );
      currentItemsGroup.add(item);
    });

    // Save this item group to later handle flashlight activation
    this.scene.events.emit("newItemGroup", groupId, currentItemsGroup);
  }

  getRandomValueForItem(itemType: string): number {
    const settings = itemSettings[itemType];

    if (!settings) {
      // Return 0 if the item type doesn't exist in the dictionary
      return 0;
    }

    // If it's a percentage, return a float value between min and max, otherwise return an integer
    return settings.isFloatRange
      ? Phaser.Math.FloatBetween(settings.min, settings.max)
      : Phaser.Math.Between(settings.min, settings.max);
  }
}
