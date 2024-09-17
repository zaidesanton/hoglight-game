import { Scene, GameObjects } from "phaser";
import { createRoundedButton } from "./Graphics";

export class DroneControls {
  private scene: Scene;
  private button: GameObjects.Graphics;
  private buttonText: GameObjects.Text;
  private droneIcon: GameObjects.Image;
  private gridCols: number;
  private gridRows: number;
  private tiles: GameObjects.Image[][];
  private moneyInTheBank: number;
  private onTileFlip: (row: number, col: number) => void; // Callback for flipping tiles
  private deductMoney: (amount: number) => void; // Callback to deduct money

  constructor(
    scene: Scene,
    tiles: GameObjects.Image[][],
    gridCols: number,
    gridRows: number,
    moneyInTheBank: number,
    onTileFlip: (row: number, col: number) => void, // Callback for flipping tiles
    deductMoney: (amount: number) => void // Callback to deduct money
  ) {
    this.scene = scene;
    this.tiles = tiles;
    this.gridCols = gridCols;
    this.gridRows = gridRows;
    this.moneyInTheBank = moneyInTheBank;
    this.onTileFlip = onTileFlip;
    this.deductMoney = deductMoney;

    // Create the drone icon (initially hidden)
    this.droneIcon = this.scene.add
      .image(0, 0, "drone-icon")
      .setDisplaySize(64, 64)
      .setVisible(false)
      .setDepth(10);

    // Create the button for Taranis Flight
    this.createButton();
  }

  createButton() {
    const buttonDisplayText = "Taranis mission ($160)";
    this.button = this.scene.add.graphics();

    const { buttonText: buttonTextObject } = createRoundedButton(
      this.scene,
      this.button,
      930,
      450,
      180,
      80,
      buttonDisplayText,
      () => {
        // Check money and start flight
        if (this.moneyInTheBank >= 160) {
          this.deductMoney(-160); // Deduct money via the callback
          this.startDroneFlight();
        }
      },
      0x2ebc33
    );

    this.buttonText = buttonTextObject;
  }

  startDroneFlight() {
    this.droneIcon.setVisible(true);
    this.button.destroy(); //setVisible(false);
    this.buttonText.destroy(); //setVisible(false);

    const flyAcrossGrid = async () => {
      for (let col = this.gridCols - 1; col >= -1; col--) {
        await this.flyToColumn(col);
        this.flipColumnTiles(col);
      }
      this.droneIcon.setVisible(false);
    };

    flyAcrossGrid();
  }

  flyToColumn(col: number): Promise<void> {
    // If it's the first column we are flying to, start from the right
    let startX = 950;
    if (col != this.gridCols - 1) {
      startX = this.tiles[0][col + 1].x;
    }
    const Y_OFFSET = 200;

    let startY: number, endX: number, endY: number;

    if (col == -1) {
      startY = this.tiles[0][0].y + Y_OFFSET;
      endX = -50;
      endY = this.tiles[0][0].y + Y_OFFSET;
    } else {
      const firstTile = this.tiles[0][col];
      const Y_OFFSET = 200;

      startY = firstTile.y + Y_OFFSET;
      endX = firstTile.x;
      endY = firstTile.y + Y_OFFSET;
    }

    return new Promise((resolve) => {
      this.droneIcon.setPosition(startX, startY);
      this.scene.tweens.add({
        targets: this.droneIcon,
        x: endX,
        y: endY,
        duration: 300,
        ease: "Linear",
        onComplete: () => {
          resolve(); // Resolve the promise when the tween is complete
        },
      });
    });
  }

  flipColumnTiles(col: number) {
    if (col != -1) {
      for (let row = 0; row < this.gridRows; row++) {
        this.onTileFlip(row, col);
      }
    }
  }

  resetButton() {
    this.button.setVisible(true);
  }
}
