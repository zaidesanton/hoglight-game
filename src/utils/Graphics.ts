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
  color: number = 0x2e4c33,
  container?: GameObjects.Container,
  disabled: boolean = false,
  tooltipText?: string
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
      fontSize: 20,
      color: "#ffffff",
      align: "center",
      wordWrap: { width: width - 20 },
    })
    .setOrigin(0.5, 0.5);

  buttonText.setPosition(x, y);

  // Tooltip for disabled state
  let tooltip: GameObjects.Text | undefined;
  if (tooltipText) {
    tooltip = scene.add
      .text(x, y - height / 2 - 40, tooltipText, {
        fontFamily: "Arial",
        fontSize: 16,
        color: "#ffffff", // Tooltip text color
        align: "center",
        padding: { left: 5, right: 5, top: 2, bottom: 2 },
        wordWrap: { width: 200 },
      })
      .setOrigin(0.5, 1)
      .setVisible(false); // Initially hidden
  }

  // Make button interactive if not disabled
  button.setInteractive(
    new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
    Phaser.Geom.Rectangle.Contains
  );

  if (!disabled) {
    button.on("pointerdown", callback);
  }

  button.on("pointerover", () => {
    if (tooltip) tooltip.setVisible(true);
    else enterButtonHoverState(scene, button, buttonText);
  });

  button.on("pointerout", () => {
    if (tooltip) tooltip.setVisible(false);
    else enterButtonRestState(scene, button, buttonText);
  });

  if (container) {
    container.add(button);
    container.add(buttonText);
    if (tooltip) container.add(tooltip);
  }

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
