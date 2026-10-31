import { BaseWorkload } from "./baseWorkload.js";
import { WorkloadState } from "../types.js";

/**
 * Tier C: Hardware-Locked GPU Workload.
 * Pinned to physical GPU context and display buffer.
 * State migration is inherently impossible (G_type = 0).
 * Demonstrates automatic Remote Access Fallback (Neko-style viewport).
 */
export class GpuWorkload extends BaseWorkload {
  private rayBounces: number = 0;
  private fps: number = 60;

  constructor(initialDeviceId: string = "node-thinkpad-x1") {
    super(
      "workload-gpu-raytracer",
      "Real-Time Hardware Raytracing Pipeline (CUDA/Vulkan)",
      "gpu_raytracer",
      "TIER_C_HARDWARE_LOCKED",
      initialDeviceId,
      1200 // 1200 MB VRAM/RAM
    );
  }

  public tick(): void {
    if (this.status !== "RUNNING" && this.status !== "REMOTE_FALLBACK") return;

    this.step += 1;
    this.rayBounces += 10000;
    this.fps = 58 + Math.floor(Math.random() * 5);
    this.lastTickTime = Date.now();
  }

  public serializeState(): Record<string, any> {
    throw new Error(
      "Hardware-Locked Exception: Tier C GPU workloads cannot be serialized across physical devices."
    );
  }

  public restoreState(): void {
    throw new Error("Cannot restore hardware-locked GPU context on remote node.");
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
        currentValue: this.fps,
        fps: this.fps,
        progressPercent: Math.min(100, (this.step % 1000) / 10),
        lastTickTime: this.lastTickTime
      },
      stateData: {
        hardwareLocked: true,
        rayBounces: this.rayBounces,
        gpuVendor: "NVIDIA RTX / Metal Core"
      }
    };
  }
}

