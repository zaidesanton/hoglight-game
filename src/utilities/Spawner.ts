// src/utilities/Spawner.ts
import Phaser from "phaser";
import Item from "../objects/Item";
import { GameConstants } from "../consts";

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
      delay: 1000, // Adjust spawn rate as needed
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
      950,
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
        950, // Start at the right edge of the screen
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

    // Adjust the speed of the group together
    currentItemsGroup.setVelocityX(GameConstants.SPEED_AT_FIRST_STAGE); // Adjust speed as needed

    // Save this item group to later handle flashlight activation
    this.scene.events.emit("newItemGroup", groupId, currentItemsGroup);
  }

  getRandomValueForItem(itemType: string): number {
    switch (itemType) {
      case "shoppingCart":
        return Phaser.Math.FloatBetween(0.1, 0.5);
      case "megaphone":
        return Phaser.Math.Between(5, 20);
      case "stopwatch":
        return Phaser.Math.Between(1, 5);
      default:
        return 0;
    }
  }
}
