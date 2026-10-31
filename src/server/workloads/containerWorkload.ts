import { BaseWorkload } from "./baseWorkload.js";
import { WorkloadState } from "../types.js";

/**
 * Tier B: Modeled Native Linux Container Workload (CRIU / Podman Engine).
 * Strictly requires homogeneous Linux x86_64 -> Linux x86_64 hosts.
 * Fails cross-architecture migration to Apple Silicon (arm64) or Windows.
 */
export class ContainerWorkload extends BaseWorkload {
  private indexedKeys: number = 0;
  private opsPerSec: number = 14500;

  constructor(initialDeviceId: string = "node-ubuntu-server") {
    super(
      "workload-redis-criu",
      "Redis Native In-Memory Cache (CRIU Container)",
      "container_criu",
      "TIER_B_CONTAINER",
      initialDeviceId,
      850 // 850 MB memory footprint
    );
  }

  public tick(): void {
    if (this.status !== "RUNNING") return;

    this.step += 100;
    this.indexedKeys += 100;
    this.opsPerSec = 14000 + Math.floor(Math.random() * 2000);
    this.lastTickTime = Date.now();
  }

  public serializeState(): Record<string, any> {
    return {
      step: this.step,
      indexedKeys: this.indexedKeys,
      opsPerSec: this.opsPerSec,
      criuTarballPath: "/tmp/criu-checkpoint-dump.tar.gz",
      timestamp: Date.now()
    };
  }

  public restoreState(stateData: Record<string, any>, newEpoch: number, targetDeviceId: string): void {
    this.step = stateData.step;
    this.indexedKeys = stateData.indexedKeys;
    this.opsPerSec = stateData.opsPerSec;
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
        currentValue: this.opsPerSec,
        progressPercent: Math.min(100, Math.round((this.step / 100000) * 100)),
        lastTickTime: this.lastTickTime
      },
      stateData: {
        indexedKeys: this.indexedKeys,
        opsPerSec: this.opsPerSec,
        requiresHomogeneousLinux: true
      }
    };
  }
}

