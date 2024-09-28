// src/utilities/Spawner.ts
import Phaser from "phaser";
import Item from "../objects/Item";
import { GameConstants, itemSettings } from "../consts";

export default class Spawner {
  private scene: Phaser.Scene;
  private lanes: number[];
  private regularItemSpawnEvent!: Phaser.Time.TimerEvent;
  private hiddenItemSpawnEvent!: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, lanes: number[]) {
    this.scene = scene;
    this.lanes = lanes;
    this.startSpawning();
  }

  startSpawning() {
    this.spawnRegularItems();

    this.scheduleRegularItemSpawning(5000);
    this.scheduleHiddenItemSpawning(6000, 10000);
    this.adjustSpawnRates();
  }

  // Function to schedule regular item spawning
  scheduleRegularItemSpawning(delay: number) {
    // If a timer already exists, remove it before scheduling a new one
    if (this.regularItemSpawnEvent) {
      this.regularItemSpawnEvent.remove();
    }

    // Schedule new regular item timer
    this.regularItemSpawnEvent = this.scene.time.addEvent({
      delay: delay,
      callback: this.spawnRegularItems,
      callbackScope: this,
      loop: true,
    });
  }

  // Function to schedule hidden item spawning with random delay between min and max for each spawn
  scheduleHiddenItemSpawning(minDelay: number, maxDelay: number) {
    if (this.hiddenItemSpawnEvent) {
      this.hiddenItemSpawnEvent.remove();
    }

    // Function to spawn hidden items with random delay
    const spawnHiddenWithRandomDelay = () => {
      this.spawnHiddenItems();

      // Random delay for the next spawn
      const nextDelay = Phaser.Math.Between(minDelay, maxDelay);

      // Schedule the next event with a new random delay
      this.hiddenItemSpawnEvent = this.scene.time.delayedCall(nextDelay, () => {
        spawnHiddenWithRandomDelay(); // Recursively schedule the next spawn
      });
    };

    // Start the first spawn with a random delay
    const initialDelay = Phaser.Math.Between(minDelay, maxDelay);
    this.scene.time.delayedCall(initialDelay, spawnHiddenWithRandomDelay);
  }

  adjustSpawnRates() {
    this.scene.time.delayedCall(20000, () => {
      this.scheduleRegularItemSpawning(3500);
    });

    this.scene.time.delayedCall(40000, () => {
      this.scheduleRegularItemSpawning(2000);
    });
  }

  spawnRegularItems() {
    const groupId = Phaser.Utils.String.UUID();

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

    this.scene.events.emit("newItemGroup", groupId, currentItemsGroup);
  }

  spawnHiddenItems() {
    const hiddenItemType = Phaser.Utils.Array.GetRandom(
      GameConstants.ITEM_TYPES
    );
    const hiddenItemValue = this.getRandomValueForItem(hiddenItemType);
    const hiddenItemTexture = hiddenItemType;

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

  getRandomValueForItem(itemType: string): number {
    const settings = itemSettings[itemType];

    if (!settings) {
      return 0;
    }

    return settings.isFloatRange
      ? Phaser.Math.FloatBetween(settings.min, settings.max)
      : Phaser.Math.Between(settings.min, settings.max);
  }
}
