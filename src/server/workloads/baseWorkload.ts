import { WorkloadState, WorkloadType, WorkloadTier, ExecutionStatus } from "../types.js";

export abstract class BaseWorkload {
  public id: string;
  public name: string;
  public type: WorkloadType;
  public tier: WorkloadTier;
  public currentDeviceId: string;
  public epoch: number;
  public status: ExecutionStatus;
  public memoryFootprintMB: number;
  public step: number;
  protected lastTickTime: number;

  constructor(
    id: string,
    name: string,
    type: WorkloadType,
    tier: WorkloadTier,
    initialDeviceId: string,
    memoryFootprintMB: number
  ) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.tier = tier;
    this.currentDeviceId = initialDeviceId;
    this.epoch = 1;
    this.status = "RUNNING";
    this.memoryFootprintMB = memoryFootprintMB;
    this.step = 0;
    this.lastTickTime = Date.now();
  }

  /**
   * Advances the computational state by 1 tick if running under valid epoch.
   */
  public abstract tick(): void;

  /**
   * Serializes the workload's memory buffers, PRNG seed, and execution frame.
   */
  public abstract serializeState(): Record<string, any>;

  /**
   * Restores the workload from an incoming state snapshot at exact step k.
   */
  public abstract restoreState(stateData: Record<string, any>, newEpoch: number, targetDeviceId: string): void;

  /**
   * Fences the workload, revoking the epoch lease and preventing further ticks.
   */
  public fence(revokedEpoch: number): Record<string, any> {
    if (this.epoch !== revokedEpoch) {
      throw new Error(`Epoch mismatch: Expected ${this.epoch}, got ${revokedEpoch}`);
    }
    this.status = "FENCED_STOPPED";
    return this.serializeState();
  }

  /**
   * Unfences the workload upon rollback, restoring execution lease.
   */
  public unfence(regrantedEpoch: number): void {
    this.epoch = regrantedEpoch;
    this.status = "RUNNING";
  }

  public pause(): void {
    if (this.status === "RUNNING") {
      this.status = "PAUSED";
    }
  }

  public resume(): void {
    if (this.status === "PAUSED") {
      this.status = "RUNNING";
    }
  }

  public abstract getStateSummary(): WorkloadState;
}

