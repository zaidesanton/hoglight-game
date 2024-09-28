import { GameObjects } from "phaser";

/**
 * Create typewriter animation for text
 * @param {Phaser.GameObjects.Text} target
 * @param {number} [speedInMs=25]
 * @returns {Promise<void>}
 */
export function animateText(
  target: GameObjects.Text,
  speedInMs = 25
): Promise<void> {
  // store original text
  const message = target.text;
  const invisibleMessage = message.replace(/[^ ]/g, " ");

  // clear text on screen
  target.text = "";

  // mutable state for visible text
  let visibleText = "";

  // use a Promise to wait for the animation to complete
  return new Promise((resolve) => {
    const timer = target.scene.time.addEvent({
      delay: speedInMs,
      loop: true,
      callback: () => {
        if (target) {
          // if all characters are visible, stop the timer
          if (target.text === message) {
            timer.destroy();
            return resolve();
          }

          // add next character to visible text
          visibleText += message[visibleText.length];

          // right pad with invisibleText
          const invisibleText = invisibleMessage.substring(visibleText.length);

          // update text on screen
          target.text = visibleText + invisibleText;
        }
      },
    });
  });
}
