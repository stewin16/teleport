import { describe, it, expect } from "vitest";
import { FeasibilityEngine } from "../src/server/feasibilityEngine.js";
import { Device, WorkloadState } from "../src/server/types.js";

describe("FeasibilityEngine Mathematical Gates & Utility Scores", () => {
  const engine = new FeasibilityEngine();

  const sourceDevice: Device = {
    id: "source-mac",
    name: "MacBook Pro M3",
    os: "macos",
    arch: "arm64",
    cores: 12,
    totalMemoryMB: 18432,
    freeMemoryMB: 10240,
    batteryLevel: 80,
    isCharging: false,
    dischargeRate: 15,
    rttMs: 12,
    bandwidthMbps: 150,
    lastHeartbeat: Date.now(),
    status: "ONLINE"
  };

  const targetDevice: Device = {
    id: "target-win",
    name: "ThinkPad Windows",
    os: "windows",
    arch: "x86_64",
    cores: 16,
    totalMemoryMB: 32768,
    freeMemoryMB: 16000,
    batteryLevel: 95,
    isCharging: true,
    dischargeRate: 0,
    rttMs: 18,
    bandwidthMbps: 120,
    lastHeartbeat: Date.now(),
    status: "ONLINE"
  };

  it("permits cross-architecture migration for Tier A Portable Workloads", () => {
    const portableWorkload: WorkloadState = {
      id: "w-monte-carlo",
      name: "Monte Carlo Risk Engine",
      type: "monte_carlo",
      tier: "TIER_A_PORTABLE",
      currentDeviceId: "source-mac",
      epoch: 1,
      status: "RUNNING",
      memoryFootprintMB: 150,
      step: 1000,
      metrics: {
        iteration: 1000,
        currentValue: 4.5,
        progressPercent: 10,
        lastTickTime: Date.now()
      },
      stateData: {}
    };

    const result = engine.evaluate(sourceDevice, targetDevice, portableWorkload);
    expect(result.gates.allPassed).toBe(true);
    expect(result.gates.isaCompatGate).toBe(true);
    expect(result.decision).toBe("MIGRATE");
    expect(result.score).toBeGreaterThanOrEqual(60);
  });

  it("rejects migration and engages Remote Fallback for Tier B Containers when targeting cross-ISA", () => {
    const containerWorkload: WorkloadState = {
      id: "w-container",
      name: "Redis Container",
      type: "container_criu",
      tier: "TIER_B_CONTAINER",
      currentDeviceId: "source-mac",
      epoch: 1,
      status: "RUNNING",
      memoryFootprintMB: 400,
      step: 500,
      metrics: {
        iteration: 500,
        currentValue: 12000,
        progressPercent: 5,
        lastTickTime: Date.now()
      },
      stateData: {}
    };

    const result = engine.evaluate(sourceDevice, targetDevice, containerWorkload);
    expect(result.gates.isaCompatGate).toBe(false);
    expect(result.gates.allPassed).toBe(false);
    expect(result.decision).toBe("REMOTE_FALLBACK");
  });

  it("rejects migration for Tier C Hardware-Locked GPU Workloads", () => {
    const gpuWorkload: WorkloadState = {
      id: "w-gpu",
      name: "GPU Raytracer",
      type: "gpu_raytracer",
      tier: "TIER_C_HARDWARE_LOCKED",
      currentDeviceId: "source-mac",
      epoch: 1,
      status: "RUNNING",
      memoryFootprintMB: 800,
      step: 200,
      metrics: {
        iteration: 200,
        currentValue: 60,
        progressPercent: 2,
        lastTickTime: Date.now()
      },
      stateData: {}
    };

    const result = engine.evaluate(sourceDevice, targetDevice, gpuWorkload);
    expect(result.gates.workloadTypeGate).toBe(false);
    expect(result.decision).toBe("REMOTE_FALLBACK");
  });

  it("rejects migration when target device lacks memory headroom (125% rule)", () => {
    const starvedTarget: Device = {
      ...targetDevice,
      freeMemoryMB: 100 // only 100 MB free
    };

    const heavyWorkload: WorkloadState = {
      id: "w-heavy",
      name: "Heavy Workload",
      type: "monte_carlo",
      tier: "TIER_A_PORTABLE",
      currentDeviceId: "source-mac",
      epoch: 1,
      status: "RUNNING",
      memoryFootprintMB: 500, // requires 625 MB free
      step: 10,
      metrics: {
        iteration: 10,
        currentValue: 1.0,
        progressPercent: 1,
        lastTickTime: Date.now()
      },
      stateData: {}
    };

    const result = engine.evaluate(sourceDevice, starvedTarget, heavyWorkload);
    expect(result.gates.ramHeadroomGate).toBe(false);
    expect(result.decision).toBe("REMOTE_FALLBACK");
  });
});

