// src/scenes/GameScene.ts
import Phaser, { GameObjects } from "phaser";
import Player from "../objects/Player";
import Spawner from "../utilities/Spawner";
import { GameConstants } from "../consts";
import Item from "../objects/Item";

export default class GameScene extends Phaser.Scene {
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private itemGroups: { [key: string]: Phaser.Physics.Arcade.Group } = {};
  private hiddenItems: Item[] = [];

  //private _spawner!: Spawner;

  // Game metrics
  private conversionRate = GameConstants.INITIAL_CONVERSION_RATE;
  private pageVisitsPerSecond = GameConstants.INITIAL_PAGE_VISITS;
  private retentionRate = GameConstants.INITIAL_RETENTION_RATE;
  private totalPurchases = 0;
  private retainedUsers = 0;
  private timeLeft = 60; // Game duration in seconds

  constructor() {
    super({ key: "GameScene" });
  }

  create() {
    // Set up background, lanes, and metrics display
    // ...

    // Initialize player
    const startX = 100; // Adjust as needed
    const startY = 300; // Adjust as needed (middle lane)
    this.player = new Player(this, startX, startY);
    this.add.existing(this.player);

    // Set up game timer
    this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });

    // Set up per-second scoring
    this.time.addEvent({
      delay: 1000,
      callback: this.calculatePurchases,
      callbackScope: this,
      loop: true,
    });

    new Spawner(this, GameConstants.LANE_Y_POSITIONS);

    this.updateMetricsDisplay();
    this.drawLanes();

    // Start UIScene and bring it to the top
    this.scene.launch("UIScene");
    this.scene.bringToTop("UIScene");

    this.events.on("flashlightActivated", this.activateFlashlight, this);
    this.events.on("newItemGroup", this.handleNewItemGroup, this);
    this.events.on("hiddenItemCreated", this.handleHiddenItemCreated, this);
  }

  handleHiddenItemCreated(hiddenItem: Item) {
    this.physics.add.existing(hiddenItem);

    // Make sure the hidden item continues moving
    hiddenItem.body.setVelocityX(GameConstants.SPEED_AT_FIRST_STAGE);

    // Add physics overlap between player and hidden items
    this.physics.add.overlap(
      this.player,
      hiddenItem,
      this.handleItemCollection,
      undefined,
      this
    );

    this.hiddenItems.push(hiddenItem);
  }

  handleNewItemGroup(groupId: string, itemGroup: Phaser.Physics.Arcade.Group) {
    // Add physics overlap between player and items in the group
    this.physics.add.overlap(
      this.player,
      itemGroup,
      this.handleItemCollection,
      undefined,
      this
    );
    this.itemGroups[groupId] = itemGroup;
    itemGroup.setVelocityX(GameConstants.SPEED_AT_FIRST_STAGE);
  }

  drawLanes() {
    // Lane positions
    const graphics = this.add.graphics();

    graphics.lineStyle(4, 0x666666, 1); // Line width and color

    GameConstants.LANE_DRAWING_Y_POSITIONS.forEach((y) => {
      // Draw horizontal lines for lanes
      graphics.moveTo(0, y);
      graphics.lineTo(this.sys.canvas.width, y);
    });

    graphics.strokePath();
  }

  updateMetricsDisplay() {
    const metrics = {
      conversionRate: this.conversionRate,
      pageVisitsPerSecond: this.pageVisitsPerSecond,
      retentionRate: this.retentionRate,
      totalPurchases: this.totalPurchases,
      timeLeft: this.timeLeft,
    };
    this.events.emit("updateMetrics", metrics);
  }

  update() {
    this.player.update(this.cursors);
  }

  updateTimer() {
    this.timeLeft--;
    if (this.timeLeft <= 0) {
      // End the game
      this.scene.stop("GameScene");

      // Transition to post-game summary or main menu
    }

    this.updateMetricsDisplay();
  }

  calculatePurchases() {
    // Total users for this second = new users + retained users from the previous second
    const totalUsers = this.pageVisitsPerSecond + this.retainedUsers;

    const conversions = Math.floor(totalUsers * (this.conversionRate / 100));
    this.totalPurchases += conversions;

    this.retainedUsers = Math.floor(
      (totalUsers - conversions) * (this.retentionRate / 100)
    );

    this.updateMetricsDisplay();
  }

  // Method to update metrics when an item is collected
  updateMetrics(type: string, value: number) {
    switch (type) {
      case "shoppingCart":
        this.conversionRate = Math.min(
          this.conversionRate + value,
          GameConstants.MAX_CONVERSION_RATE
        );
        break;
      case "megaphone":
        this.pageVisitsPerSecond += value;
        break;
      case "stopwatch":
        this.retentionRate = Math.min(
          this.retentionRate + value,
          GameConstants.MAX_RETENTION_RATE
        );
        break;
    }

    this.updateMetricsDisplay();
  }

  handleItemCollection(
    playerGO:
      | Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Tilemaps.Tile,
    itemGO:
      | Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Tilemaps.Tile
  ) {
    // Type guard to check if objects are GameObjects
    if (
      playerGO instanceof Phaser.GameObjects.GameObject &&
      itemGO instanceof Phaser.GameObjects.GameObject
    ) {
      const item = itemGO as Item;

      this.updateMetrics(item.config.itemType, item.config.value);

      item.collect();

      if (item.config.groupId)
        this.deleteItemsInGroup(item.config.groupId, item);
    }
  }

  deleteItemsInGroup(groupId: string, collectedItem: Item) {
    const currentGroup = this.itemGroups[groupId];

    if (currentGroup) {
      // Fade out other items in the same group
      currentGroup.getChildren().forEach((groupItem) => {
        const currentItem = groupItem as Item;
        if (groupItem !== collectedItem && !currentItem.config.isHidden) {
          currentItem.fadeOut();
        }
      });

      // Remove the group from the dictionary after all items are handled
      delete this.itemGroups[groupId];
    }
  }

  activateFlashlight() {
    this.hiddenItems.forEach((item: Item) => {
      this.tweens.add({
        targets: item,
        alpha: 1,
        duration: 100,
        onComplete: () => {
          if (item && item.body) item.body.checkCollision.none = false;
        },
      });
      item.revealText();
    });

    Object.keys(this.itemGroups).forEach((groupId) => {
      // Highlight the best item in the group
      const bestItem = this.getBestItemInGroup(groupId);
      if (bestItem) {
        console.log(`Best item in group ${groupId}:`, bestItem.config.itemType);
        bestItem.setTexture(`${bestItem.config.itemType}Highlighted`);
        bestItem.setTint(0xffd700); // Highlight with golden tint
      }
    });
  }

  getBestItemInGroup(groupId: string): Item | null {
    const itemGroup = this.itemGroups[groupId];
    let bestItem: Item | null = null;
    let bestValue = -Infinity;

    itemGroup.getChildren().forEach((itemGO: GameObjects.GameObject) => {
      const item = itemGO as Item;
      if (item.config.value > bestValue) {
        bestItem = item;
        bestValue = item.config.value;
      }
    });

    return bestItem;
  }
}
