import { BaseWorkload } from "./baseWorkload.js";
import { WorkloadState } from "../types.js";

export class MonteCarloWorkload extends BaseWorkload {
  private prngSeed: number;
  private currentVaR: number;
  private runningVariance: number;
  private history: number[];
  private targetTotalSteps: number = 100000;

  constructor(initialDeviceId: string = "node-thinkpad-x1") {
    super(
      "workload-monte-carlo-var",
      "Monte Carlo Quantitative Risk Engine (VaR 99%)",
      "monte_carlo",
      "TIER_A_PORTABLE",
      initialDeviceId,
      120 // 120 MB memory footprint
    );
    this.prngSeed = 133742;
    this.currentVaR = 4.82; // Initial VaR %
    this.runningVariance = 0.045;
    this.history = [];
  }

  // Deterministic PRNG for mathematical reproducibility
  private nextRandom(): number {
    this.prngSeed = (this.prngSeed * 1664525 + 1013904223) % 4294967296;
    return this.prngSeed / 4294967296;
  }

  public tick(): void {
    if (this.status !== "RUNNING") return;

    // Simulate batch of 50 Monte Carlo asset price paths
    const batchSize = 50;
    for (let i = 0; i < batchSize; i++) {
      const u1 = Math.max(1e-10, this.nextRandom());
      const u2 = this.nextRandom();
      // Box-Muller transform for normal distribution
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

      // Geometric Brownian motion increment: dS = mu*S*dt + sigma*S*dW
      const drift = 0.0002;
      const vol = 0.015;
      const shock = drift + vol * z0;

      // Update running VaR and variance
      this.currentVaR = +(Math.abs(shock * 2.33 * 100).toFixed(2));
      this.runningVariance = +(this.runningVariance * 0.995 + (shock * shock) * 0.005).toFixed(4);
    }

    this.step += batchSize;
    this.history.push(this.currentVaR);
    if (this.history.length > 40) {
      this.history.shift();
    }

    if (this.step >= this.targetTotalSteps) {
      this.status = "COMPLETED";
    }

    this.lastTickTime = Date.now();
  }

  public serializeState(): Record<string, any> {
    return {
      step: this.step,
      prngSeed: this.prngSeed,
      currentVaR: this.currentVaR,
      runningVariance: this.runningVariance,
      history: [...this.history],
      timestamp: Date.now()
    };
  }

  public restoreState(stateData: Record<string, any>, newEpoch: number, targetDeviceId: string): void {
    this.step = stateData.step;
    this.prngSeed = stateData.prngSeed;
    this.currentVaR = stateData.currentVaR;
    this.runningVariance = stateData.runningVariance;
    this.history = [...(stateData.history || [])];
    this.epoch = newEpoch;
    this.currentDeviceId = targetDeviceId;
    this.status = "RUNNING";
    this.lastTickTime = Date.now();
  }

  public getStateSummary(): WorkloadState {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      tier: this.tier,
      currentDeviceId: this.currentDeviceId,
      epoch: this.epoch,
      status: this.status,
      memoryFootprintMB: this.memoryFootprintMB,
      step: this.step,
      metrics: {
        iteration: this.step,
        currentValue: this.currentVaR,
        variance: this.runningVariance,
        progressPercent: Math.min(100, Math.round((this.step / this.targetTotalSteps) * 100)),
        lastTickTime: this.lastTickTime
      },
      stateData: {
        history: this.history,
        prngSeed: this.prngSeed
      }
    };
  }
}

