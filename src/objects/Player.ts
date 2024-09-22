// src/objects/Player.ts
import Phaser from "phaser";
import { GameConstants } from "../consts";

export default class Player extends Phaser.Physics.Arcade.Sprite {
  private lanes: number[] = GameConstants.LANE_Y_POSITIONS;
  private currentLaneIndex: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "player-default");
    scene.physics.add.existing(this);
    scene.add.existing(this);

    this.setCollideWorldBounds(true);
    // Set the display size
    const playerWidth = 115; // Desired width in pixels
    const playerHeight = 115; // Desired height in pixels
    this.setDisplaySize(playerWidth, playerHeight);

    // Adjust the physics body size to match the new display size
    this.body!.setSize(playerWidth + 60, playerHeight);
    // Define lanes (Y positions)
    this.currentLaneIndex = 1; // Start in the middle lane

    this.setPosition(x, this.lanes[this.currentLaneIndex]);

    const keyboard = this.scene.input.keyboard;
    if (keyboard) {
      keyboard.on("keydown-UP", () => {
        this.moveUp();
      });

      keyboard.on("keydown-DOWN", () => {
        this.moveDown();
      });
    }

    // Pointer input (click/tap)
    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.handlePointerInput(pointer);
    });
  }

  // Handle pointer input (click/tap)
  handlePointerInput(pointer: Phaser.Input.Pointer) {
    // Check if the pointer is in the upper or lower part of the screen
    const topThreshold = GameConstants.LANE_DRAWING_Y_POSITIONS[0]; // The Y position of the first lane
    const bottomThreshold =
      GameConstants.LANE_DRAWING_Y_POSITIONS[this.lanes.length - 1]; // The Y position of the last lane

    if (pointer.y < topThreshold) {
      this.moveUp();
    } else if (pointer.y > bottomThreshold) {
      this.moveDown();
    }
  }

  moveUp() {
    if (this.currentLaneIndex > 0) {
      this.currentLaneIndex--;
      this.setY(this.lanes[this.currentLaneIndex]);
    }
  }

  moveDown() {
    if (this.currentLaneIndex < this.lanes.length - 1) {
      this.currentLaneIndex++;
      this.setY(this.lanes[this.currentLaneIndex]);
    }
  }
}
