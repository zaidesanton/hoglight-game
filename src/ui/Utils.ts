import { GameObjects, Scene } from "phaser";

export function createRoundedButton(
  scene: Scene,
  button: GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  callback: Function,
  color: number = 0x2e4c33
) {
  const radius = 20;

  // Draw rounded rectangle
  button.fillStyle(color, 1);
  button.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
  button.setPosition(x, y);

  // Add button text
  const buttonText = scene.add
    .text(0, 0, text, {
      fontFamily: "Arial Black",
      fontSize: 24,
      color: "#ffffff",
      align: "center",
      wordWrap: { width: width - 20 },
    })
    .setOrigin(0.5, 0.5);

  buttonText.setPosition(x, y);

  // Make button interactive if not disabled
  button.setInteractive(
    new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
    Phaser.Geom.Rectangle.Contains
  );

  button.setInteractive({ useHandCursor: true });
  button.on("pointerdown", callback);

  button.on("pointerover", () => {
    enterButtonHoverState(scene, button, buttonText);
  });

  button.on("pointerout", () => {
    enterButtonRestState(scene, button, buttonText);
  });

  return { button: button, buttonText: buttonText };
}

// Hover effect: enlarge button slightly
const enterButtonHoverState = (
  scene: Scene,
  button: GameObjects.Graphics,
  buttonText: GameObjects.Text
) => {
  scene.tweens.add({
    targets: [button, buttonText],
    scaleX: 1.1,
    scaleY: 1.1,
    duration: 200,
    ease: "Power2",
  });
};

// Rest state: return to original size
const enterButtonRestState = (
  scene: Scene,
  button: GameObjects.Graphics,
  buttonText: GameObjects.Text
) => {
  scene.tweens.add({
    targets: [button, buttonText],
    scaleX: 1,
    scaleY: 1,
    duration: 200,
    ease: "Power2",
  });
};
