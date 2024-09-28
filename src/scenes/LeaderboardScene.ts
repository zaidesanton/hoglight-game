import Phaser from "phaser";

export class Leaderboard extends Phaser.Scene {
  playerScore: number; // Will hold the player's score from registry
  scores: { name: string; score: number }[] = []; // Array to hold all the leaderboard scores

  constructor() {
    super("Leaderboard");
  }

  create() {
    this.add.image(0, 0, "backgroundMenu").setOrigin(0, 0);
    // Add the rectangle behind the text
    const rectWidth = 700;
    const rectHeight = 730;
    const rectX = 150; // Center the rectangle horizontally
    const rectY = 20; // Slightly above the "Leaderboard" title

    // Rectangle for the title
    const bgRectangle = this.add.graphics();
    bgRectangle.fillStyle(0x1d4bff, 0.8); // Set color and alpha
    bgRectangle.fillRoundedRect(rectX, rectY, rectWidth, rectHeight, 20); // Add rounded rectangle

    // Retrieve the player's score from the registry
    this.playerScore = this.registry.get("playerScore") || 0;

    this.scores = [
      { name: "Max 'Hedgie' AI", score: 12445 },
      { name: "James 'Pogačar' Hawkins", score: 867 },
      { name: "Tim 'Coding Kid' Glaser", score: 835 },
      { name: "Marius 'Kissing Dinosaurs' Andra", score: 757 },
      { name: "Eric 'Tailor' Duong", score: 935 },
      { name: "James 'Almost Pilot' Greenhill", score: 853 },
      { name: "Lottie 'Graphics Genius' Coxon", score: 973 },
      { name: "Michael 'Lego Master' Matolka", score: 835 },
      { name: "Charles 'Sandwich King' Cook", score: 1024 },
      { name: "You!", score: this.playerScore }, // Player score retrieved from registry
    ];

    // Sort scores in descending order (highest score at the top)
    this.scores.sort((a, b) => b.score - a.score);

    // Modern and engaging design - Adding the leaderboard
    const startY = 150; // Starting y position for the leaderboard
    const startX = 200; // Starting x position for the leaderboard

    this.add
      .text(512, 80, "Leaderboard", {
        fontFamily: "Arial Black",
        fontSize: 48,
        color: "#FFD700",
        align: "center",
      })
      .setOrigin(0.5);

    // Display each player in the leaderboard
    for (let i = 0; i < this.scores.length; i++) {
      const player = this.scores[i];
      const fontSize = player.name === "You!" ? "36px" : "28px"; // Highlight the player with a bigger font

      this.add.text(startX, startY + i * 50, `${i + 1}. ${player.name}`, {
        fontFamily: "Arial",
        fontSize: fontSize,
        color: player.name === "You!" ? "#FFD700" : "#ffffff",
      });

      this.add.text(
        startX + 500,
        startY + i * 50,
        player.score.toLocaleString(),
        {
          fontFamily: "Arial",
          fontSize: fontSize,
          color: player.name === "You!" ? "#FFD700" : "#ffffff",
        }
      );
    }

    this.add
      .text(512, 700, "Press anywhere to go back to the main menu", {
        fontFamily: "Arial",
        fontSize: 24,
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5)
      .setAlpha(0.7);

    this.input.once("pointerdown", () => {
      this.scene.start("MenuScene");
    });
  }
}
