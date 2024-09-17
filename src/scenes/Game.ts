import { Scene, GameObjects } from "phaser";
import { Menu } from "./Menu";
import {
  calculateAverageNumberIn2DArray,
  calculateEconomicBenefit,
  calculateReplantCost,
  calculateSmartThreshold,
  calculateYield,
  createReplantMessage,
  generateSingleStandcountValue,
  generateStandCounts,
  generateStandcountTileImage,
} from "../utils/Standcount";
import { DroneControls } from "../utils/DroneControls";

interface GlowTile extends Phaser.GameObjects.Image {
  glowTween?: Phaser.Tweens.Tween; // Optional property for tracking the glow tween
  contentContainer?: Phaser.GameObjects.Container; // Add a reference for the container
}

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  tiles: GlowTile[][];
  estimatedYieldText: GameObjects.Text;
  timerText: GameObjects.Text;
  timeline: GameObjects.Graphics;
  progressGraphics: GameObjects.Graphics;
  menu: Menu;
  playerIcon: GameObjects.Image;
  playerPosition: { row: number; col: number }; // Store player's position
  openedTiles: boolean[][]; // Store whether a tile is opened
  moneyInTheBankText: GameObjects.Text;

  totalGameTime: number; // Total time in seconds
  gamePhase: number; // Track the current game phase
  moneyInTheBank: number;
  estimatedYield: number;
  decisionTimeLeft: number;
  gridRows = 7;
  gridCols = 10;

  timelineWidth = 640; // Match the width of the field (10 tiles * 64px per tile)
  timelineHeight = 5;
  timelineX: number;
  timelineY: number;

  // grids
  standcountGrid: number[][];

  droneControls: DroneControls;

  constructor() {
    super("Game");
  }

  resetGame() {
    this.moneyInTheBank = 100000;
    this.estimatedYield = 175;
    this.decisionTimeLeft = 30;
    this.totalGameTime = 120;
    this.gamePhase = 0;

    this.openedTiles = Array.from({ length: this.gridRows }, () =>
      Array(this.gridCols).fill(false)
    );

    // Field Grid
    this.setupFieldGrid();
    this.standcountGrid = generateStandCounts(this.gridRows, this.gridCols);
    this.time.paused = false;
  }

  create() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x2e4c33);

    this.resetGame();

    // Top-left corner: Estimated Yield and Timer
    this.setupTopLeftInfo();

    this.timelineX = this.camera.width / 2 - this.timelineWidth / 2;
    this.timelineY = this.camera.height / 2 + 320;

    // Top-center: Timeline with moving progress indicator
    this.setupTimeline();

    // Add the player icon initially off-screen
    this.playerIcon = this.add
      .image(-100, -100, "player-icon")
      .setDisplaySize(64, 64)
      .setAlpha(1)
      .setDepth(2)
      .setVisible(false);

    // Set the initial player position and hide the icon
    this.playerIcon.setScale(0.1); // Adjust the scale as necessary

    this.droneControls = new DroneControls(
      this,
      this.tiles,
      this.gridCols,
      this.gridRows,
      this.moneyInTheBank,
      this.flipTile.bind(this), // Pass flipTile as a callback
      this.updateMoneyInTheBank.bind(this) // Pass money deduction as a callback
    );

    // Initialize the menu
    this.menu = new Menu(this);

    // Display the initial instructions menu
    this.menu.show(
      "Welcome to The Smart Scout! \n\n \
      Your goal is to make as much money as you can by the end of the season. You start with $100,000, and You'll have 30 seconds to scout your field before each decision. \n\n Clicking on the field tiles will reveal the information you need to make each decision! \n\n Click 'Start' to begin.",
      [{ label: "Start", callback: this.startGame.bind(this) }]
    );
  }

  startGame() {
    this.menu.hide();
    this.startGameTimer();
  }

  setupTopLeftInfo() {
    // Money in the Bank
    this.moneyInTheBankText = this.add.text(
      20,
      20,
      `Money in the Bank: $${this.moneyInTheBank}`,
      {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#ffffff",
      }
    );

    // Estimated Yield
    this.estimatedYieldText = this.add.text(
      20,
      60,
      `Estimated Yield: ${this.estimatedYield} bushels/acre`,
      {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#ffffff",
      }
    );

    // Estimated Yield
    this.timerText = this.add.text(
      20,
      100,
      `Decision in: ${this.decisionTimeLeft} seconds`,
      {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#ffffff",
      }
    );
  }

  setupTimeline() {
    // Draw the fixed timeline (white line and white circles)
    this.timeline = this.add.graphics();
    this.timeline.fillStyle(0xffffff, 1);
    this.timeline.fillRect(
      this.timelineX,
      this.timelineY,
      this.timelineWidth,
      this.timelineHeight
    );

    // Draw the timeline stages (as you already have)
    const stages = [
      "Planting",
      "Replanting",
      "Weed Spraying",
      "Final Spraying",
      "Harvest",
    ];
    const stageSpacing = this.timelineWidth / (stages.length - 1);

    stages.forEach((stage, index) => {
      const circleX = this.timelineX + index * stageSpacing;
      this.timeline.fillCircle(
        circleX,
        this.timelineY + this.timelineHeight / 2,
        10
      );
      this.add
        .text(circleX, this.timelineY + 20, stage, {
          fontFamily: "Arial",
          fontSize: "14px",
          color: "#ffffff",
          align: "center",
        })
        .setOrigin(0.5, 0);
    });

    // Progress bar and moving circle
    this.progressGraphics = this.add.graphics();
    this.progressGraphics.fillStyle(0x00ff00, 1);
  }

  setupFieldGrid() {
    const tileWidth = 64;
    const tileHeight = 64;

    const gridWidth = this.gridCols * tileWidth;
    const gridHeight = this.gridRows * tileHeight;

    const offsetX = (this.camera.width - gridWidth) / 2;
    const offsetY = (this.camera.height - gridHeight) / 2 + 60;

    this.tiles = [];

    for (let row = 0; row < this.gridRows; row++) {
      this.tiles[row] = [];
      for (let col = 0; col < this.gridCols; col++) {
        const x = offsetX + col * tileWidth + tileWidth / 2;
        const y = offsetY + row * tileHeight + tileHeight / 2;

        const tile = this.add
          .image(x, y, "corn-tile")
          .setDisplaySize(tileWidth, tileHeight)
          .setOrigin(0.5, 0.5)
          .setInteractive();

        tile.on("pointerdown", () => {
          this.handleTileSelection(row, col);
        });

        if (row === this.gridRows - 1) {
          // Only bottom row is initially interactive
          tile.setInteractive();
          this.glowTile(tile); // Add pulsating glow effect
        } else {
          tile.setAlpha(0.5); // Dim non-interactive tiles initially
          tile.disableInteractive();
        }

        this.tiles[row][col] = tile;
      }
    }
  }

  glowTile(tile: GlowTile) {
    // If the tile already has a glowTween, don't add another one
    if (tile.glowTween) {
      return;
    }

    // Add the tween and store the reference in the tile object
    tile.glowTween = this.tweens.add({
      targets: tile,
      alpha: { from: 1, to: 0.5 }, // Pulsating alpha effect
      yoyo: true,
      repeat: -1, // Infinite loop
      duration: 700,
      ease: "Power2",
    });
  }

  stopGlow(tile: GlowTile) {
    // If the tile has a glow tween, stop it and clear the reference
    if (tile.glowTween) {
      tile.glowTween.stop(); // Stop the glow effect
      tile.glowTween = undefined; // Remove reference to avoid memory leaks
    }
    tile.setAlpha(1); // Reset the tile's opacity
  }

  handleTileSelection(row: number, col: number) {
    const tile: GlowTile = this.tiles[row][col];
    if (!tile) return;

    // If the tile is already opened, just return
    if (this.openedTiles[row][col]) {
      return;
    }

    if (!this.playerIcon.visible) {
      // First time: Show player icon under the clicked tile
      this.playerIcon.setPosition(tile.x, tile.y + 64); // Below the tile
      this.playerIcon.setVisible(true); // Make the player visible

      // Move the player to the center of the tile
      this.movePlayerToTile(tile, row, col);
    } else {
      // Move the player from its current position to the new tile
      this.movePlayerToTile(tile, row, col);
    }
  }

  movePlayerToTile(tile: Phaser.GameObjects.Image, row: number, col: number) {
    const targetX = tile.x;
    const targetY = tile.y - 32;

    // Tween to move the player to the center of the clicked tile
    this.tweens.add({
      targets: this.playerIcon,
      x: targetX,
      y: targetY,
      duration: 320,
      ease: "Power2",
      onComplete: () => {
        // After the player reaches the tile, flip it
        this.flipTile(row, col);

        // Update player's position in the game state
        this.playerPosition = { row, col };

        // Enable adjacent tiles for clicking after the flip
        this.enableAdjacentTiles(row, col);
      },
    });
  }

  enableAdjacentTiles(row: number, col: number) {
    // Deactivate all tiles
    this.tiles.forEach((row) => {
      row.forEach((tile) => {
        // Maybe the tile was already flipped
        if (tile && tile !== undefined) {
          tile.disableInteractive(); // Disable interaction on all tiles
          this.stopGlow(tile); // Stop any pulsating glow
          tile.setAlpha(0.5); // Dim the tile to show it's inactive
        }
      });
    });

    // Get adjacent positions (up, down, left, right)
    const adjacentPositions = [
      { row: row - 1, col: col }, // Up
      { row: row + 1, col: col }, // Down
      { row: row, col: col - 1 }, // Left
      { row: row, col: col + 1 }, // Right
    ];

    // Re-enable interaction for adjacent tiles
    adjacentPositions.forEach(({ row, col }) => {
      if (
        row >= 0 &&
        row < this.tiles.length &&
        col >= 0 &&
        col < this.tiles[0].length
      ) {
        const tile = this.tiles[row][col];
        tile.setInteractive();
        tile.setAlpha(1); // Restore normal appearance
        this.glowTile(tile); // Apply pulsating glow to adjacent active tiles
      }
    });
  }

  startGameTimer() {
    this.time.addEvent({
      delay: 1000,
      callback: this.updateGameTimer,
      callbackScope: this,
      loop: true,
    });
  }

  updateGameTimer() {
    this.totalGameTime--;
    this.decisionTimeLeft--;
    this.timerText.setText(`Decision in: ${this.decisionTimeLeft} seconds`);

    if (this.decisionTimeLeft <= 0) {
      this.pauseGameForReplantDecision();
      this.decisionTimeLeft = 30; // Reset countdown after each decision
    }

    // Pause 2 seconds after resuming, for temp display of info
    if (this.totalGameTime <= 88) {
      this.pauseGameForTempEnding();
    }

    // Calculate the progress of the moving circle
    const progress = 1 - this.totalGameTime / 120;
    const timelineProgressX = this.timelineX + this.timelineWidth * progress;

    // Clear the progress graphics and redraw the progress
    this.progressGraphics.clear();
    this.progressGraphics.fillStyle(0x00ff00, 1);
    this.progressGraphics.fillRect(
      this.timelineX,
      this.timelineY,
      timelineProgressX - this.timelineX,
      5
    );

    // Define the positions of the stage circles
    const circleRadius = 10;

    // Draw the moving circle in green
    this.progressGraphics.fillCircle(
      timelineProgressX,
      this.timelineY + this.timelineHeight / 2,
      circleRadius
    );

    const stages = [
      "Planting",
      "Replanting",
      "Weed Spraying",
      "Final Spraying",
      "Harvest",
    ];
    const stageSpacing = this.timelineWidth / (stages.length - 1);

    stages.forEach((_, index) => {
      const stageX = index * stageSpacing;
      if (timelineProgressX >= this.timelineX + stageX) {
        this.progressGraphics.fillCircle(
          this.timelineX + stageX,
          this.timelineY + this.timelineHeight / 2,
          circleRadius
        );
        this.progressGraphics.fillStyle(0x00ff00, 1);
      }
    });

    if (this.totalGameTime <= 0) {
      this.endGame();
    }
  }

  updateEstimatedYield(newExpectedYield: number) {
    const changeInYield = Math.round(newExpectedYield - this.estimatedYield);

    if (changeInYield === 0) return;

    // Create the text for the money change (+ or -)
    const changeText = this.add.text(
      390, // Position near the current money display
      70,
      `${changeInYield > 0 ? "+" : ""}${changeInYield}`, // Show + if positive, - if negative
      {
        fontFamily: "Arial",
        fontSize: "28px",
        color: changeInYield > 0 ? "#00ff00" : "#ff0000", // Green for positive, Red for negative
      }
    );

    // Add the fade out and move up animation
    this.tweens.add({
      targets: changeText,
      y: "-=80", // Move up by 50 pixels
      alpha: 0.1, // Fade out
      duration: 500, // Animation duration 500 ms
      ease: "linear",
      onComplete: () => {
        this.updateYieldDisplay(newExpectedYield);
        changeText.destroy();
      },
    });
  }
  updateMoneyInTheBank(amount: number) {
    // Update the money in the bank
    this.moneyInTheBank += amount;

    // Create the text for the money change (+ or -)
    const changeText = this.add.text(
      330, // Position near the current money display
      20,
      `${amount > 0 ? "+" : ""}${amount}`, // Show + if positive, - if negative
      {
        fontFamily: "Arial",
        fontSize: "28px",
        color: amount > 0 ? "#00ff00" : "#ff0000", // Green for positive, Red for negative
      }
    );

    // Add the fade out and move up animation
    this.tweens.add({
      targets: changeText,
      y: "-=50", // Move up by 50 pixels
      alpha: 0.2, // Fade out
      duration: 500, // Animation duration 500 ms
      ease: "linear",
      onComplete: () => {
        // Destroy the text after the animation is complete
        // Update the displayed value
        this.updateMoneyInBankDisplay();
        changeText.destroy();
      },
    });
  }

  updateMoneyInBankDisplay() {
    // Assuming you have the text object for "Money in the Bank"
    this.moneyInTheBankText.setText(
      `Money in the Bank: $${this.moneyInTheBank}`
    );
  }

  updateYieldDisplay(newExpectedYield: number) {
    this.estimatedYield = newExpectedYield;
    // Assuming you have the text object for "Estimated Yield"
    this.estimatedYieldText.setText(
      `Estimated Yield: ${this.estimatedYield.toFixed(0)} bushels/acre`
    );
  }
  endGame() {
    this.menu.show(`Game Over! Your final yield is X bushels.`, [
      {
        label: "Play Again",
        callback: () => {
          this.resetGame();
        },
      },
    ]);
  }

  calculateNewEstimatedYieldValue() {
    // Get only the stand counts for the opened (flipped) tiles
    // Get only the stand counts for the opened (flipped) tiles
    const openedStandCounts = this.openedTiles.flatMap(
      (row, rowIndex) =>
        row
          .map(
            (isOpened, colIndex) =>
              isOpened ? this.standcountGrid?.[rowIndex]?.[colIndex] : null // Safely access grid value
          )
          .filter(
            (value): value is number => value !== null && value !== undefined
          ) // Filter non-number values
    );

    // Ensure we have valid stand counts before calculating the average
    if (openedStandCounts.length > 0) {
      // Calculate the average stand count for only the opened tiles
      const averageStandCount =
        openedStandCounts.reduce((sum, value) => sum + value, 0) /
        openedStandCounts.length;

      // Calculate the new expected yield and update it
      const newExpectedYield = calculateYield(averageStandCount);
      this.updateEstimatedYield(newExpectedYield);
    }

    if (openedStandCounts.length === this.gridRows * this.gridCols) {
      this.displayFinishedOpenTilesMenu();
    }
  }

  displayFinishedOpenTilesMenu() {
    this.time.paused = true;
    this.menu.show(
      "Nice, you've scouted the whole field! Grab a beer and wait for your plants to grow.",
      [
        {
          label: "Grabbed the beer!",
          callback: () => {
            this.time.paused = false;
            this.menu.hide();
          },
        },
      ]
    );
  }

  flipTile(row: number, col: number): Promise<void> {
    return new Promise((resolve) => {
      if (this.openedTiles[row][col])
        resolve(); // Resolve immediately if the tile is already opened
      else {
        const tile = this.tiles[row][col];
        const originalWidth = tile.displayWidth;
        const originalHeight = tile.displayHeight;

        this.tweens.killTweensOf(tile);
        // If there is already a container attached to the tile, destroy it
        if (tile.contentContainer) {
          tile.contentContainer.removeAll(true);
          tile.contentContainer.destroy();
          tile.contentContainer = undefined; // Clear the reference
        }

        // First tween to scaleX: 0 (flip to mid-point)
        this.tweens.add({
          targets: tile,
          scaleX: 0, // Shrink X-axis to simulate the flip
          ease: "Linear",
          duration: 200,
          onComplete: () => {
            // At the mid-flip point, hide the original tile (or you can remove it)
            tile.setVisible(false);

            // Generate the new container (background, icon, text, etc.)
            const tileContainer = generateStandcountTileImage(
              this,
              this.standcountGrid[row][col], // New tile content
              tile.x, // Keep the same position
              tile.y,
              originalWidth,
              originalHeight
            );

            // Set initial scaleX to 0 to make it invisible (so we can flip it in)
            tileContainer.scaleX = 0;

            // Add the new container to the scene
            this.add.existing(tileContainer);
            tile.contentContainer = tileContainer;

            // Second tween to scaleX: 1 (flip back to normal)
            this.tweens.add({
              targets: tileContainer,
              scaleX: 1, // Expand X-axis back to normal size
              ease: "Linear",
              duration: 200, // Complete the flip
              onComplete: () => {
                this.openedTiles[row][col] = true;
                this.calculateNewEstimatedYieldValue();
                resolve();
              },
            });
          },
        });
      }
    });
  }

  flipReplantedTile(
    row: number,
    col: number,
    newStandCountValue: number
  ): Promise<void> {
    return new Promise((resolve) => {
      const tile = this.tiles[row][col];
      const originalWidth = tile.displayWidth;
      const originalHeight = tile.displayHeight;

      this.tweens.killTweensOf(tile);
      tile.removeAllListeners();
      // If there is already a container attached to the tile, destroy it
      if (tile.contentContainer) {
        tile.contentContainer.removeAll(true);
        tile.contentContainer.destroy();
        tile.contentContainer = undefined;
      }

      // Add the plant icon that will slowly grow
      const plantIcon = this.add.image(tile.x, tile.y, "bad-emergence-icon");
      plantIcon.setScale(0.2); // Start small

      // Tween to grow the plant icon over 1.5 seconds
      this.tweens.add({
        targets: plantIcon,
        scale: 0.7, // Grow to 50% size
        alpha: 1,
        duration: 1000, // 1.5 seconds
        ease: "Linear",
        onComplete: () => {
          // Once the plant icon finishes growing, destroy it and replace with the new tile image
          plantIcon.destroy();

          // Generate the new container (background, icon, text, etc.)
          const tileContainer = generateStandcountTileImage(
            this,
            newStandCountValue, // Use the new stand count value
            tile.x, // Keep the same position
            tile.y,
            originalWidth,
            originalHeight
          );

          // Set initial scaleX to 0 to make it invisible (so we can flip it in)
          tileContainer.scaleX = 0;

          // Add the new container to the scene
          this.add.existing(tileContainer);
          tile.contentContainer = tileContainer;

          // Second tween to scaleX: 1 (flip back to normal)
          this.tweens.add({
            targets: tileContainer,
            scaleX: 1, // Expand X-axis back to normal size
            ease: "Linear",
            duration: 500, // Slower flip for emphasis
            onComplete: () => {
              resolve(); // Resolve the promise once the flip animation completes
            },
          });
        },
      });
    });
  }

  pauseGameForTempEnding() {
    this.time.paused = true;
    const averageStandcount = Math.round(
      calculateAverageNumberIn2DArray(this.standcountGrid)
    );
    const averageYield = Math.round(calculateYield(averageStandcount));
    const totalSellPrice = averageYield * 70 * 4;
    const currentScore = this.moneyInTheBank + totalSellPrice;

    const highestPlayerScore = this.registry.get("playerScore") ?? 0;
    if (currentScore > highestPlayerScore)
      this.registry.set("playerScore", currentScore);

    this.menu.show(
      `Nice work! We hoped you enjoyed the game.\n\n You average standcount was ${averageStandcount}k, resulting in a yield of ${averageYield} bushels/acre. You sold it for $4/bushel, which got you $${totalSellPrice}.\n\n You final score is ${currentScore}!\n\n (this is a temp message, to show you some idea of how the game can play out.)`,
      [
        {
          label: "Play Again",
          callback: () => {
            this.scene.restart();
            this.totalGameTime = 120;
            this.time.paused = false;
          },
        },
        {
          label: "Leaderboard",
          callback: () => {
            this.scene.start("Leaderboard");
          },
        },
      ]
    );
  }

  pauseGameForReplantDecision() {
    this.time.paused = true;
    let threshold = calculateSmartThreshold(this.standcountGrid, 28.5, 4);
    if (threshold == -1) threshold = 25;
    const areSomeTilesStillClosed =
      this.openedTiles.flat().filter((value) => !value).length > 0;
    const averageStandcount = Math.round(
      calculateAverageNumberIn2DArray(this.standcountGrid)
    );
    this.menu.show(
      `It's time to make the replant decision!\n\n The average stand count of the areas you scouted is ${averageStandcount}k.`,
      [
        {
          label: "Don't Replant",
          callback: () => this.handleReplantDecision(false, null), // No replant
        },
        {
          label: "Full Replant",
          callback: () => this.handleReplantDecision(true, null), // Full replant
        },
        {
          label: `Smart Replant (stand count < ${threshold}k)`,
          type: "threshold",
          callback: () => this.handleReplantDecision(true, threshold),
          isDisabled: areSomeTilesStillClosed,
        },
      ]
    );

    this.droneControls.resetButton();
  }

  changeStandCountValues(threshold: number | null): Promise<number> {
    return new Promise((resolve) => {
      let totalTiles = 0;

      const tilePromises: Promise<void>[] = []; // Array to store all promises for flipping tiles

      for (let row = 0; row < this.tiles.length; row++) {
        for (let col = 0; col < this.tiles[row].length; col++) {
          // Check if the tile needs replanting - no threshold means a full field replant
          if (!threshold || this.standcountGrid[row][col] < threshold) {
            totalTiles++; // Count the tiles being replanted

            // Recalculate the stand count using the existing function
            const newStandCountValue = generateSingleStandcountValue();

            // Update the stand count grid with the new value
            this.standcountGrid[row][col] = newStandCountValue;

            // Add the promise from flipReplantedTile to the array
            tilePromises.push(
              this.flipReplantedTile(row, col, newStandCountValue)
            );
          }
        }
      }

      // Wait for all flipReplantedTile promises to resolve before resolving the main promise
      Promise.all(tilePromises).then(() => {
        resolve(totalTiles); // Resolve after all tile flips are completed
      });

      // If no tiles need replanting, resolve immediately
      if (totalTiles === 0) {
        resolve(totalTiles);
      }
    });
  }

  handleReplantDecision(replant: boolean, threshold: number | null) {
    this.menu.hide();
    const averageStandCountBefore = calculateAverageNumberIn2DArray(
      this.standcountGrid
    );

    this.flipAllTiles()
      .then(() => {
        if (replant) {
          // If replanting is true, change the stand count values after flipping
          return this.changeStandCountValues(threshold);
        } else {
          // If no replanting, return a resolved promise to continue the chain
          return Promise.resolve(0);
        }
      })
      .then((replantedAcres: number) => {
        const estimatedPrice = 4;
        const averageStandCountAfter = calculateAverageNumberIn2DArray(
          this.standcountGrid
        );
        const costOfReplant = calculateReplantCost(replantedAcres);
        const estimatedYieldBeforeReplant = calculateYield(
          averageStandCountBefore
        );
        const estimatedYieldAfterReplant = calculateYield(
          averageStandCountAfter
        );
        const economicalBenefit = calculateEconomicBenefit(
          70,
          averageStandCountBefore,
          averageStandCountAfter
        );

        const afterReplantMessage = createReplantMessage(
          costOfReplant,
          estimatedYieldBeforeReplant,
          estimatedYieldAfterReplant,
          estimatedPrice,
          economicalBenefit
        );
        this.menu.show(afterReplantMessage, [
          {
            label: "Ok!",
            callback: () => this.handleReplantFinished(costOfReplant),
          },
        ]);
      })
      .catch((error) => {
        console.error("An error occurred during the replant sequence:", error);
      });

    // Resume the game after handling the replant decision
    //this.time.paused = false;
  }

  handleReplantFinished(costOfReplant: number | undefined) {
    if (costOfReplant) this.updateMoneyInTheBank(-costOfReplant);
    this.hideMenuAndResumeGame();
  }

  hideMenuAndResumeGame() {
    this.menu.hide(); // Hide the menu
    this.time.paused = false; // Resume the game
  }

  flipAllTiles(): Promise<void> {
    return new Promise((resolve) => {
      this.time.paused = false;
      const tilePromises: Promise<void>[] = []; // Array to store promises for each tile flip
      const delayPromises: Promise<void>[] = []; // Array to store promises for each delay

      const flipDelay = 100; // Delay between each row flip
      let delay = 0;

      for (let col = this.tiles[0].length - 1; col >= 0; col--) {
        // Push a new promise for each delay into the array
        delayPromises.push(
          new Promise((delayResolve) => {
            this.time.addEvent({
              delay: delay,
              callback: () => {
                for (let row = 0; row < this.tiles.length; row++) {
                  if (!this.openedTiles[row][col]) {
                    // Collect the promise returned from flipTile
                    tilePromises.push(this.flipTile(row, col));
                  }
                }
                // Resolve this delay promise once all tiles in the column are processed
                delayResolve();
              },
            });
          })
        );

        delay += flipDelay;
      }

      // Wait for all delay promises to complete before starting Promise.all for the flips
      Promise.all(delayPromises).then(() => {
        // Wait for all tile flips to complete
        Promise.all(tilePromises).then(() => {
          this.time.paused = true;
          resolve(); // Resolve when all tiles are done flipping
        });
      });
    });
  }
}
