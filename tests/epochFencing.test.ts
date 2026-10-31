import { describe, it, expect } from "vitest";
import { EpochLeaseManager } from "../src/server/epochFencing.js";

describe("Monotonic Epoch Lease Fencing & Split-Brain Prevention", () => {
  it("initializes a workload with Epoch 1 and verifies authorization", () => {
    const manager = new EpochLeaseManager();
    const epoch = manager.initializeLease("workload-1", "device-A");

    expect(epoch).toBe(1);
    expect(manager.isAuthorized("workload-1", "device-A", 1)).toBe(true);
    expect(manager.isAuthorized("workload-1", "device-B", 1)).toBe(false);
  });

  it("fences the source device and increments the reserved epoch", () => {
    const manager = new EpochLeaseManager();
    manager.initializeLease("workload-1", "device-A");

    const nextEpoch = manager.fenceSource("workload-1", "device-A");
    expect(nextEpoch).toBe(2);

    // Source device is now fenced and unauthorized
    expect(manager.isAuthorized("workload-1", "device-A", 1)).toBe(false);
    expect(manager.isAuthorized("workload-1", "device-A", 2)).toBe(false);
  });

  it("commits target activation under Epoch 2 and denies source execution", () => {
    const manager = new EpochLeaseManager();
    manager.initializeLease("workload-1", "device-A");
    const nextEpoch = manager.fenceSource("workload-1", "device-A");

    manager.commitTargetActivation("workload-1", "device-B", nextEpoch);

    expect(manager.getCurrentEpoch("workload-1")).toBe(2);
    expect(manager.isAuthorized("workload-1", "device-B", 2)).toBe(true);
    expect(manager.isAuthorized("workload-1", "device-A", 1)).toBe(false);
    expect(manager.isAuthorized("workload-1", "device-A", 2)).toBe(false);
  });

  it("executes instant rollback back to source device upon target failure", () => {
    const manager = new EpochLeaseManager();
    manager.initializeLease("workload-1", "device-A");
    manager.fenceSource("workload-1", "device-A");

    // Simulate failure before commit -> rollback to source
    const restoredEpoch = manager.rollbackToSource("workload-1", "device-A");
    expect(restoredEpoch).toBe(1);
    expect(manager.isAuthorized("workload-1", "device-A", 1)).toBe(true);
    expect(manager.isAuthorized("workload-1", "device-B", 2)).toBe(false);
  });
});

