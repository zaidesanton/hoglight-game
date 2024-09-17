// Parameters for stand count distribution
const averageStand: number = 31;
const stdDev: number = 5; // Base standard deviation for the normal distribution
const maxStand: number = 35;

// Helper function to generate normal distribution
function randomNormal(mean: number, stdDev: number): number {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random(); // Convert [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return (
    Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * stdDev + mean
  );
}

export function generateSingleStandcountValue(): number {
  const newStandcount = randomNormal(averageStand, stdDev);
  const clampedStandount = Math.min(Math.max(newStandcount, 0), maxStand);
  return Math.round(clampedStandount);
}

/**
 * Function to generate a grid of stand counts with realistic variability,
 * including patches of low values and increased variability for below-average values.
 */
export function generateStandCounts(
  gridRows: number,
  gridCols: number
): number[][] {
  // Generate initial grid of stand counts using a normal distribution
  let standCounts: number[][] = [];
  for (let row = 0; row < gridRows; row++) {
    standCounts[row] = [];
    for (let col = 0; col < gridCols; col++) {
      standCounts[row][col] = randomNormal(averageStand, stdDev);
    }
  }

  // Introduce more variability and lower the values
  const extraStdDev = 2;
  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      standCounts[row][col] += randomNormal(-2, extraStdDev);
    }
  }

  // Clamp values between 0 and maxStand
  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      standCounts[row][col] = Math.min(
        Math.max(standCounts[row][col], 0),
        maxStand
      );
    }
  }

  // Apply Gaussian smoothing
  standCounts = applyGaussianFilter(standCounts, 0.5);

  // Introduce random anomalies (e.g., low stand count tiles)
  const anomalyProbability = 0.02; // 2% chance of a tile having a low value
  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      if (Math.random() < anomalyProbability) {
        standCounts[row][col] = Math.floor(Math.random() * 10); // Random low values
      }
    }
  }

  // Introduce low-value patches (e.g., randomly reduce values in clusters)
  for (let i = 0; i < 2; i++) {
    // Let's create 2 patches
    const startRow = Math.floor(Math.random() * (gridRows - 2)); // Random starting point
    const startCol = Math.floor(Math.random() * (gridCols - 2));
    for (let rowOffset = 0; rowOffset < 2; rowOffset++) {
      for (let colOffset = 0; colOffset < 2; colOffset++) {
        standCounts[startRow + rowOffset][startCol + colOffset] *= 0.9; // Reduce by 10%
      }
    }
  }

  // Round the final stand counts
  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      standCounts[row][col] = Math.round(standCounts[row][col]);
    }
  }

  return standCounts;
}

export function generateStandcountTileImage(
  scene: Phaser.Scene,
  standCount: number,
  x: number,
  y: number,
  width: number,
  height: number
): Phaser.GameObjects.Container {
  let color: number;
  let iconKey: string;

  // Determine the background color and icon based on the stand count
  if (standCount < 24) {
    color = 0xff0000; // Red for "bad"
    iconKey = "bad-emergence-icon";
  } else if (standCount >= 24 && standCount <= 29) {
    color = 0xffa500; // Orange for "average"
    iconKey = "average-emergence-icon";
  } else {
    color = 0x00ff00; // Green for "good"
    iconKey = "good-emergence-icon";
  }

  // Check if the icon texture exists in the cache
  if (!scene.textures.exists(iconKey)) {
    console.error(`Texture for ${iconKey} is not loaded in the cache`);
  }

  // Create the background rectangle with the corresponding color
  const background = new Phaser.GameObjects.Rectangle(
    scene,
    0,
    0,
    width,
    height,
    color
  ).setOrigin(0.5, 0.5);

  // Create the icon in the center of the tile
  const icon = new Phaser.GameObjects.Image(scene, 0, 0, iconKey)
    .setDisplaySize(width * 0.9, height * 0.9)
    .setOrigin(0.5, 0.5);

  // Force the texture to load
  icon.setTexture(iconKey);

  // Create the white text for the stand count at the bottom quarter
  const text = new Phaser.GameObjects.Text(
    scene,
    0,
    height / 4,
    standCount.toString() + "k",
    {
      fontFamily: "Arial",
      fontSize: "24px",
      color: "#ffffff", // White text
      align: "center",
    }
  ).setOrigin(0.5, 0.5);

  // Create a container and add the background, icon, and text to it
  const container = new Phaser.GameObjects.Container(scene, x, y, [
    background,
    icon,
    text,
  ]);

  return container;
}

function applyGaussianFilter(grid: number[][], sigma: number): number[][] {
  const kernelSize = 3; // You can also use 5 for a bigger kernel
  const kernel = generateGaussianKernel(kernelSize, sigma);
  const filteredGrid: number[][] = [];

  const numRows = grid.length;
  const numCols = grid[0].length;

  for (let row = 0; row < numRows; row++) {
    filteredGrid[row] = [];
    for (let col = 0; col < numCols; col++) {
      let weightedSum = 0;
      let weightTotal = 0;

      // Apply the Gaussian kernel to the grid
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const neighborRow = row + i;
          const neighborCol = col + j;

          // Check bounds
          if (
            neighborRow >= 0 &&
            neighborRow < numRows &&
            neighborCol >= 0 &&
            neighborCol < numCols
          ) {
            const weight = kernel[i + 1][j + 1];
            weightedSum += grid[neighborRow][neighborCol] * weight;
            weightTotal += weight;
          }
        }
      }
      filteredGrid[row][col] = weightedSum / weightTotal;
    }
  }

  return filteredGrid;
}

// Function to generate a simple Gaussian kernel
function generateGaussianKernel(size: number, sigma: number): number[][] {
  const kernel: number[][] = [];
  const mean = Math.floor(size / 2);
  let sum = 0.0; // For normalization

  for (let x = 0; x < size; x++) {
    kernel[x] = [];
    for (let y = 0; y < size; y++) {
      const value =
        (1 / (2 * Math.PI * sigma ** 2)) *
        Math.exp(-((x - mean) ** 2 + (y - mean) ** 2) / (2 * sigma ** 2));
      kernel[x][y] = value;
      sum += value;
    }
  }

  // Normalize the kernel
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      kernel[x][y] /= sum;
    }
  }

  return kernel;
}

export function calculateYield(standCount: number) {
  const averageYield = 175; // Average bushels per acre
  const averageStandCountInThousands = 31; // Average stand count per acre
  return averageYield * (standCount / averageStandCountInThousands);
}

export function calculateEconomicBenefit(
  areaAcres: number,
  standCountBefore: number,
  standCountAfter: number,
  pricePerBushel = 4
) {
  const yieldBefore = calculateYield(standCountBefore);
  const yieldAfter = calculateYield(standCountAfter);

  const yieldIncrease = yieldAfter - yieldBefore; // Bushels gained from replanting
  return yieldIncrease * pricePerBushel * areaAcres; // Economic benefit in dollars
}

export function calculateReplantCost(acresToReplant: number) {
  const costPerAcre = 125;

  // Calculate the total cost for replanting the given number of tiles
  return acresToReplant * costPerAcre;
}

export const calculateAverageNumberIn2DArray = (array: number[][]): number =>
  array.flat().reduce((sum, value) => sum + value, 0) / array.flat().length;

export const createReplantMessage = (
  costOfReplant: number,
  estimatedYieldBefore: number,
  estimatedYieldAfter: number,
  estimatedPrice: number,
  economicalBenefit: number
): string => {
  // Check the difference in yield
  const yieldDifference = estimatedYieldAfter - estimatedYieldBefore;
  const netBenefit = economicalBenefit - costOfReplant;

  // Start building the message
  let message = `The replant cost you $${costOfReplant.toFixed(0)}. \n\n`;

  // Handle different yield cases
  if (yieldDifference > 0) {
    message += `It increased your average yield from ${estimatedYieldBefore.toFixed(
      0
    )} bushels/acre to ${estimatedYieldAfter.toFixed(0)} bushels/acre.\n\n`;
  } else if (yieldDifference < 0) {
    message += `However, it decreased your average yield from ${estimatedYieldBefore.toFixed(
      0
    )} bushels/acre to ${estimatedYieldAfter.toFixed(0)} bushels/acre.\n\n`;
  } else {
    message += `Your yield remained unchanged at ${estimatedYieldBefore.toFixed(
      0
    )} bushels/acre.\n\n`;
  }

  // Handle different benefit cases
  if (netBenefit > 0) {
    message += `With the current price of $${estimatedPrice} per bushel, you potentially gained $${netBenefit.toFixed(
      0
    )} from this decision.\n`;
  } else if (netBenefit < 0) {
    message += `Based on the current price of $${estimatedPrice} per bushel, you potentially lost $${Math.abs(
      netBenefit
    ).toFixed(0)} from this decision.\n`;
  } else {
    message += `With the current price of $${estimatedPrice} per bushel, you probably broke even on this decision.\n\n`;
  }

  return message;
};

export function calculateSmartThreshold(
  standcountGrid: number[][],
  expectedStandcountAfterReplant: number,
  pricePerBushel: number
): number {
  const replantPricePerAcre = calculateReplantCost(1);
  // Flatten the 2D array of stand counts into a 1D array
  const flattenedStandcount = standcountGrid.flat();

  // Sort the stand counts to iterate over possible thresholds
  const sortedStandcounts = [...flattenedStandcount].sort((a, b) => a - b);
  let calculatedThreshold = -1;
  let maxBenefit = 0;

  // Iterate over possible stand count thresholds
  for (let threshold of sortedStandcounts) {
    // Calculate the number of acres below the current threshold
    const acresToReplant = flattenedStandcount.filter(
      (sc) => sc < threshold
    ).length;

    // A hard coded logic to skip the threshold if the number of acres to replant is less than 10 so it'll be realistic
    if (acresToReplant < 10) continue;

    // Calculate the cost of replanting those acres
    const replantCost = acresToReplant * replantPricePerAcre;

    // Calculate the average stand count before replanting (only below the threshold)
    const averageStandCountBefore =
      flattenedStandcount
        .filter((sc) => sc < threshold)
        .reduce((sum, sc) => sum + sc, 0) / acresToReplant || 0;

    // Calculate the economic benefit of replanting
    const yieldBenefit = calculateEconomicBenefit(
      acresToReplant,
      averageStandCountBefore,
      expectedStandcountAfterReplant,
      pricePerBushel
    );

    const finalBenefit = yieldBenefit - replantCost;
    // If the economic benefit is greater than or equal to the replant cost, return this threshold
    if (finalBenefit > 0 && finalBenefit > maxBenefit && replantCost != 0) {
      calculatedThreshold = threshold;
      maxBenefit = finalBenefit;
    }
  }

  return calculatedThreshold;
}
