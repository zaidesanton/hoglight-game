// src/objects/Player.ts
import Phaser from "phaser";
import { GameConstants } from "../consts";

export default class Player extends Phaser.Physics.Arcade.Sprite {
  private lanes: number[] = GameConstants.LANE_Y_POSITIONS;
  private currentLaneIndex: number;
  private flashlightLight!: Phaser.GameObjects.PointLight;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "playerDefault");
    scene.physics.add.existing(this);
    scene.add.existing(this);

    this.setCollideWorldBounds(true);
    // Set the display size
    const playerWidth = 115; // Desired width in pixels
    const playerHeight = 115; // Desired height in pixels
    this.setDisplaySize(playerWidth, playerHeight);

    // Adjust the physics body size to match the new display size
    this.body!.setSize(playerWidth + 60, playerHeight);
    this.currentLaneIndex = 1; // Start in the middle lane

    this.setOrigin(0, 0.5);
    this.setPosition(x, y);
    this.setDepth(2);
    this.setScale(0.15);

    // Initialize the flashlight light
    this.initFlashlightLight();

    const keyboard = this.scene.input.keyboard;
    if (keyboard) {
      keyboard.on("keydown-UP", () => {
        this.moveUp();
      });

      keyboard.on("keydown-DOWN", () => {
        this.moveDown();
      });

      // Activate flashlight when the SPACE key is pressed
      keyboard.on("keydown-SPACE", () => {
        this.scene.events.emit("hoglightButtonPressed");
      });
    }

    // Pointer input (click/tap)
    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.handlePointerInput(pointer);
    });
  }

  initFlashlightLight() {
    // Create the pointlight (flashlight)
    this.flashlightLight = this.scene.add.pointlight(
      this.x + 140,
      this.y + 20,
      0xffffff,
      300,
      130,
      0.07
    );
    this.flashlightLight.setDepth(-1);
    this.flashlightLight.setVisible(false); // Initially hidden
  }

  showFlashlight() {
    this.flashlightLight.setVisible(true);
  }

  hideFlashlight() {
    this.flashlightLight.setVisible(false);
  }

  setLight(light: Phaser.GameObjects.PointLight) {
    this.flashlightLight = light;
  }

  // Update the position of the light to follow the player
  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);

    if (this.flashlightLight) {
      this.flashlightLight.setPosition(this.x + 140, this.y + 20); // Light follows the flashlight
    }
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

    this.scene.events.emit("screenPressed");
  }

  moveUp() {
    if (this.currentLaneIndex > 0) {
      this.currentLaneIndex--;
      this.setY(this.lanes[this.currentLaneIndex]);
      this.scene.events.emit("playerMovementHappened");
    }
  }

  moveDown() {
    if (this.currentLaneIndex < this.lanes.length - 1) {
      this.currentLaneIndex++;
      this.setY(this.lanes[this.currentLaneIndex]);
      this.scene.events.emit("playerMovementHappened");
    }
  }

  activateFlashlightTexture() {
    // Change texture to "player-flashlight"
    this.setTexture("playerFlashlight");
    this.setOrigin(0, 0.5);
    this.showFlashlight();

    // Set timer to revert back to default after 2 seconds
    this.scene.time.delayedCall(GameConstants.FLASHLIGHT_ACTIVE_TIME, () => {
      this.setTexture("playerDefault");
      this.setOrigin(0, 0.5);
      this.hideFlashlight();
    });
  }
}
