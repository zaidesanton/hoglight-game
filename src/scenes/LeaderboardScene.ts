import Phaser from "phaser";

export class Leaderboard extends Phaser.Scene {
  playerScore: number; // Will hold the player's score from registry
  scores: { name: string; score: number }[] = []; // Array to hold all the leaderboard scores

  constructor() {
    super("Leaderboard");
  }

  create() {
    // Retrieve the player's score from the registry
    this.playerScore = this.registry.get("playerScore") || 0;

    this.scores = [
      { name: "Amir", score: 145009 },
      { name: "Josh", score: 142389 },
      { name: "Ido", score: 141684 },
      { name: "Anton", score: 140263 },
      { name: "Katie", score: 144416 },
      { name: "Opher", score: 143703 },
      { name: "Pablo", score: 143030 },
      { name: "Jason", score: 144777 },
      { name: "Raz", score: 142202 },
      { name: "You!", score: this.playerScore }, // Player score retrieved from registry
    ];

    // Sort scores in descending order (highest score at the top)
    this.scores.sort((a, b) => b.score - a.score);

    // Modern and engaging design - Adding the leaderboard
    const startY = 150; // Starting y position for the leaderboard
    const startX = 300; // Starting x position for the leaderboard

    this.add
      .text(512, 50, "Leaderboard", {
        fontFamily: "Arial Black",
        fontSize: 48,
        color: "#00ff00",
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
        color: player.name === "You!" ? "#ffcc00" : "#ffffff", // Highlight "You!" in gold
      });

      this.add.text(
        startX + 300,
        startY + i * 50,
        player.score.toLocaleString(),
        {
          fontFamily: "Arial",
          fontSize: fontSize,
          color: player.name === "You!" ? "#ffcc00" : "#ffffff", // Highlight "You!" in gold
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
      .setOrigin(0.5);

    this.input.once("pointerdown", () => {
      this.scene.start("MainMenu");
    });
  }
}
