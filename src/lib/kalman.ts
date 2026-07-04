/**
 * Scalar (1-D) Kalman filter for smoothing noisy telemetry streams.
 *
 * Classic predict/update cycle with a random-walk process model:
 *   predict:  x̂ₖ⁻ = x̂ₖ₋₁,        Pₖ⁻ = Pₖ₋₁ + Q
 *   update:   K = Pₖ⁻ / (Pₖ⁻ + R), x̂ₖ = x̂ₖ⁻ + K(z − x̂ₖ⁻), Pₖ = (1−K)Pₖ⁻
 *
 * Q (process noise) controls how fast the estimate can move;
 * R (measurement noise) controls how much each reading is trusted.
 */
export class Kalman1D {
  private q: number;
  private r: number;
  private x: number | null = null;
  private p = 1;

  constructor(processNoise = 0.05, measurementNoise = 1) {
    this.q = processNoise;
    this.r = measurementNoise;
  }

  /** Feed a measurement, get the filtered estimate. */
  filter(measurement: number): number {
    if (this.x === null) {
      this.x = measurement;
      return measurement;
    }
    // predict
    this.p += this.q;
    // update
    const k = this.p / (this.p + this.r);
    this.x += k * (measurement - this.x);
    this.p *= 1 - k;
    return this.x;
  }

  reset(): void {
    this.x = null;
    this.p = 1;
  }
}
