/**
 * Random Number Generation Utilities
 */

export class RandomUtils {
  /**
   * Generates a random integer between min and max (inclusive)
   */
  static int(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generates a random float between min and max
   */
  static float(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  /**
   * Generates a number from a normal distribution using Box-Muller transform
   * @param mean Mean value
   * @param stdDev Standard deviation
   */
  static normal(mean: number, stdDev: number): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return num * stdDev + mean;
  }

  /**
   * Generates a number from a normal distribution, clamped to a range
   */
  static clampedNormal(mean: number, stdDev: number, min: number, max: number): number {
    let val = this.normal(mean, stdDev);
    return Math.min(Math.max(val, min), max);
  }

  /**
   * Selects an item from an array based on weights
   * @param items Items to choose from
   * @param weights Weights corresponding to items (must sum to > 0)
   */
  static weightedChoice<T>(items: T[], weights: number[]): T {
    if (items.length !== weights.length) {
      throw new Error("Items and weights must have the same length");
    }

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }
    return items[items.length - 1];
  }

  /**
   * Returns true with a given probability (0-1)
   */
  static chance(probability: number): boolean {
    return Math.random() < probability;
  }
}
