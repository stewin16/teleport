import { BaseWorkload } from "./baseWorkload.js";
import { WorkloadState } from "../types.js";

export class NeuralWorkload extends BaseWorkload {
  private loss: number;
  private accuracy: number;
  private lossHistory: number[];
  private targetTotalSteps: number = 50000;

  constructor(initialDeviceId: string = "node-macbook-m3") {
    super(
      "workload-neural-optimizer",
      "Live Neural Micro-Batch Gradient Optimizer",
      "neural_net",
      "TIER_A_PORTABLE",
      initialDeviceId,
      280 // 280 MB footprint
    );
    this.loss = 1.842;
    this.accuracy = 42.5;
    this.lossHistory = [1.842];
  }

  public tick(): void {
    if (this.status !== "RUNNING") return;

    const batchIncrement = 25;
    this.step += batchIncrement;

    // Simulate stochastic gradient descent optimization step
    const decay = 0.9992;
    const noise = (Math.random() - 0.5) * 0.015;
    this.loss = +(Math.max(0.08, this.loss * decay + noise).toFixed(4));
    this.accuracy = +(Math.min(99.4, this.accuracy + 0.05 + (Math.random() * 0.04)).toFixed(1));

    this.lossHistory.push(this.loss);
    if (this.lossHistory.length > 40) {
      this.lossHistory.shift();
    }

    if (this.step >= this.targetTotalSteps) {
      this.status = "COMPLETED";
    }

    this.lastTickTime = Date.now();
  }

  public serializeState(): Record<string, any> {
    return {
      step: this.step,
      loss: this.loss,
      accuracy: this.accuracy,
      lossHistory: [...this.lossHistory],
      timestamp: Date.now()
    };
  }

  public restoreState(stateData: Record<string, any>, newEpoch: number, targetDeviceId: string): void {
    this.step = stateData.step;
    this.loss = stateData.loss;
    this.accuracy = stateData.accuracy;
    this.lossHistory = [...(stateData.lossHistory || [])];
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
        currentValue: this.loss,
        loss: this.loss,
        variance: this.accuracy,
        progressPercent: Math.min(100, Math.round((this.step / this.targetTotalSteps) * 100)),
        lastTickTime: this.lastTickTime
      },
      stateData: {
        lossHistory: this.lossHistory,
        accuracy: this.accuracy
      }
    };
  }
}

