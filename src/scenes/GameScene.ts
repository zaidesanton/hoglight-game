// src/scenes/GameScene.ts
import Phaser, { GameObjects } from "phaser";
import Player from "../objects/Player";
import Spawner from "../utilities/Spawner";
import { GameConstants } from "../consts";
import Item from "../objects/Item";
import { Metrics } from "./UIScene";

export default class GameScene extends Phaser.Scene {
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private itemGroups: { [key: string]: Phaser.Physics.Arcade.Group };
  private hiddenItems: Item[] = [];
  private gameTimer: Phaser.Time.TimerEvent;
  private purchasesTimer: Phaser.Time.TimerEvent;
  private itemsSpawner: Spawner;

  // Game metrics
  private conversionRate: number;
  private pageVisitsPerSecond: number;
  private retentionRate: number;
  private totalPurchases: number;
  private retainedUsers: number;
  private timeLeft: number;
  private isFlashLightActive: boolean;

  constructor() {
    super({ key: "GameScene" });
  }

  reset() {
    this.conversionRate = GameConstants.INITIAL_CONVERSION_RATE;
    this.pageVisitsPerSecond = GameConstants.INITIAL_PAGE_VISITS;
    this.retentionRate = GameConstants.INITIAL_RETENTION_RATE;
    this.totalPurchases = 0;
    this.retainedUsers = 0;
    this.timeLeft = 60;
    this.isFlashLightActive = false;
    this.itemGroups = {};
  }

  create() {
    this.cleanup();
    this.reset();

    // Initialize player
    const playerStartX = 50;
    const playerStartY = GameConstants.LANE_Y_POSITIONS[1] - 5;

    this.add.image(0, 0, "backgroundGame").setOrigin(0, 0).setDepth(-2);

    this.player = new Player(this, playerStartX, playerStartY);
    this.add.existing(this.player);

    this.updateMetricsDisplay();
    this.drawLanes();

    // Start UIScene and bring it to the top
    this.scene.launch("UIScene");
    this.scene.bringToTop("UIScene");

    this.events.on("flashlightActivated", this.activateFlashlight, this);
    this.events.on("newItemGroup", this.handleNewItemGroup, this);
    this.events.on("hiddenItemCreated", this.handleHiddenItemCreated, this);

    const UIScene = this.scene.get("UIScene");
    UIScene.events.on("finishedTutorial", this.startGame, this);
  }

  cleanup() {
    this.events.off("updateMetricsDisplay");
    this.events.off("newItemGroup");
    const UIScene = this.scene.get("UIScene");
    UIScene.events.off("finishedTutorial");
  }

  startGame() {
    if (this.gameTimer) this.gameTimer.remove();
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });

    if (this.purchasesTimer) this.purchasesTimer.remove();
    // Set up per-second scoring
    this.purchasesTimer = this.time.addEvent({
      delay: 1000,
      callback: this.updatePurchases,
      callbackScope: this,
      loop: true,
    });

    if (this.itemsSpawner) {
      this.itemsSpawner.cleanup();
    }

    console.log("Starting game called");
    this.itemsSpawner = new Spawner(this, GameConstants.LANE_Y_POSITIONS);
    this.time.paused = false;
  }

  calculateCurrentSpeed() {
    let speed = GameConstants.SPEED_AT_FIRST_STAGE;
    if (this.timeLeft <= 60 - GameConstants.START_THIRD_STAGE_MS / 1000) {
      speed = GameConstants.SPEED_AT_THIRD_STAGE;
    } else if (
      this.timeLeft <=
      60 - GameConstants.START_SECOND_STAGE_MS / 1000
    ) {
      speed = GameConstants.SPEED_AT_SECOND_STAGE;
    }

    return speed;
  }
  handleHiddenItemCreated(hiddenItem: Item) {
    this.physics.add.existing(hiddenItem);

    // Make sure the hidden item continues moving
    hiddenItem.body.setVelocityX(this.calculateCurrentSpeed());

    // Add physics overlap between player and hidden items
    this.physics.add.overlap(
      this.player,
      hiddenItem,
      this.handleItemCollection,
      undefined,
      this
    );

    this.hiddenItems.push(hiddenItem);
    if (this.isFlashLightActive) {
      this.revealHiddenItem(hiddenItem);
    }
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
    itemGroup.setVelocityX(this.calculateCurrentSpeed());
    if (this.isFlashLightActive) {
      this.markBestItemInGroup(groupId);
    }
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

  updateMetricsDisplay(currentConversions?: number) {
    const metrics: Metrics = {
      conversionRate: this.conversionRate,
      pageVisitsPerSecond: this.pageVisitsPerSecond,
      retentionRate: this.retentionRate,
      timeLeft: this.timeLeft,
      totalPurchases: this.totalPurchases,
      currentConversions: currentConversions,
    };
    this.events.emit("updateMetricsDisplay", metrics);
  }

  update() {
    this.player.update(this.cursors);
  }

  handleGameEnd() {
    const highestPlayerScore = this.registry.get("playerScore") ?? 0;
    if (this.totalPurchases > highestPlayerScore)
      window.dispatchEvent(
        new CustomEvent("scoreUpdate", {
          detail: { score: this.totalPurchases },
        })
      );
    this.registry.set("playerScore", this.totalPurchases);
    this.cleanup();
    this.scene.stop("UIScene");
    this.scene.start("Leaderboard");
  }

  updateTimer() {
    this.timeLeft--;
    if (this.timeLeft <= 0) {
      this.handleGameEnd();
    } else {
      this.updateMetricsDisplay();
    }
  }

  calculatePurchases(
    pageVisits: number,
    retainedUsers: number,
    conversionRate: number,
    retentionRate: number
  ) {
    // Total users for this second = new users + retained users from the previous second
    const totalUsers = pageVisits + retainedUsers;
    const conversions = Math.floor(totalUsers * (conversionRate / 100));

    const nextRetainedUsers = Math.floor(
      (totalUsers - conversions) * (retentionRate / 100)
    );

    return {
      conversions,
      retainedUsers: nextRetainedUsers,
      totalPurchases: this.totalPurchases + conversions,
    };
  }

  updatePurchases() {
    if (this.timeLeft > 0) {
      const { conversions, retainedUsers, totalPurchases } =
        this.calculatePurchases(
          this.pageVisitsPerSecond,
          this.retainedUsers,
          this.conversionRate,
          this.retentionRate
        );
      this.totalPurchases = totalPurchases;
      this.retainedUsers = retainedUsers;

      this.updateMetricsDisplay(conversions);
    }
  }

  // Method to update metrics when an item is collected
  getUpdatedMetrics(type: string, value: number) {
    let conversionRate = this.conversionRate;
    let pageVisitsPerSecond = this.pageVisitsPerSecond;
    let retentionRate = this.retentionRate;

    switch (type) {
      case "conversion":
        conversionRate = Math.min(
          conversionRate + value,
          GameConstants.MAX_CONVERSION_RATE
        );
        break;
      case "funnel":
        pageVisitsPerSecond += value;
        break;
      case "retention":
        retentionRate = Math.min(
          retentionRate + value,
          GameConstants.MAX_RETENTION_RATE
        );
        break;
    }

    return { conversionRate, retentionRate, pageVisitsPerSecond };
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

      const { conversionRate, retentionRate, pageVisitsPerSecond } =
        this.getUpdatedMetrics(item.config.itemType, item.config.value);
      this.conversionRate = conversionRate;
      this.retentionRate = retentionRate;
      this.pageVisitsPerSecond = pageVisitsPerSecond;
      this.updateMetricsDisplay();

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

  revealHiddenItem(item: Item) {
    this.tweens.add({
      targets: item,
      alpha: 1,
      duration: 100,
      onComplete: () => {
        if (item && item.body) item.body.checkCollision.none = false;
      },
    });
    item.revealText();
  }

  markBestItemInGroup(groupId: string) {
    const bestItem = this.getBestItemInGroup(groupId);
    if (bestItem) {
      bestItem.setTexture(`${bestItem.config.itemType}Highlighted`);
    }
  }

  activateFlashlight() {
    this.hiddenItems.forEach((item: Item) => {
      this.revealHiddenItem(item);
    });

    Object.keys(this.itemGroups).forEach((groupId) => {
      this.markBestItemInGroup(groupId);
    });

    this.player.activateFlashlightTexture();
    this.isFlashLightActive = true;

    // Continue to affect newly spawned items for FLASHLIGHT_ACTIVE_TIME ms
    this.time.addEvent({
      delay: GameConstants.FLASHLIGHT_ACTIVE_TIME,
      callback: () => {
        this.isFlashLightActive = false;
      },
    });
  }

  getBestItemInGroup(groupId: string): Item | null {
    const itemGroup = this.itemGroups[groupId];
    let bestItem: Item | null = null;
    let bestNextSecondConversionRate = -Infinity;

    itemGroup.getChildren().forEach((itemGO: GameObjects.GameObject) => {
      const item = itemGO as Item;
      const { conversionRate, retentionRate, pageVisitsPerSecond } =
        this.getUpdatedMetrics(item.config.itemType, item.config.value);

      const { retainedUsers: firstRetainedUsers } = this.calculatePurchases(
        pageVisitsPerSecond,
        this.retainedUsers,
        conversionRate,
        retentionRate
      );

      // We considering the best item based on the conversion one second AFTER the immediate second,
      // to take into account the increase in retention. This will not be accurate in the latest
      // second of the game.
      const { conversions } = this.calculatePurchases(
        pageVisitsPerSecond,
        firstRetainedUsers,
        conversionRate,
        retentionRate
      );

      item.config.itemType;
      if (
        conversions > bestNextSecondConversionRate ||
        // Because the conversions are rounded, in case it's the same result
        // we want to take the higher value item for the long term affect
        (conversions == bestNextSecondConversionRate &&
          item.config.itemType == bestItem?.config.itemType &&
          item.config.value > bestItem.config.value)
      ) {
        bestItem = item;
        bestNextSecondConversionRate = conversions;
      }

      console.log(
        `Conversions for item type ${item.config.itemType} with value ${item.config.value} is ${conversions}`
      );
    });

    return bestItem;
  }
}
