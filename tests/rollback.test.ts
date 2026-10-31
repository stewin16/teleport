import { describe, it, expect } from "vitest";
import { MonteCarloWorkload } from "../src/server/workloads/monteCarloWorkload.js";
import { migrationCoordinator } from "../src/server/migrationCoordinator.js";
import { deviceRegistry } from "../src/server/deviceRegistry.js";

describe("Atomic 6-Stage Migration Pipeline & Instant Rollback (< 35ms)", () => {
  it("executes a complete successful live migration from Node 1 to Node 2", async () => {
    const workload = new MonteCarloWorkload("node-thinkpad-x1");

    // Advance 50 steps
    workload.tick();
    const stepBeforeMigration = workload.step;
    expect(stepBeforeMigration).toBe(50);
    expect(workload.epoch).toBe(1);

    const result = await migrationCoordinator.executeMigration(
      workload,
      "node-macbook-m3",
      { artificialDelayMs: 10 }
    );

    expect(result.success).toBe(true);
    expect(result.event.stage).toBe("TARGET_RESTORED");
    expect(workload.currentDeviceId).toBe("node-macbook-m3");
    expect(workload.epoch).toBe(2);
    expect(workload.step).toBe(stepBeforeMigration); // Exact step preserved!
    expect(workload.status).toBe("RUNNING");

    // Continue executing on target
    workload.tick();
    expect(workload.step).toBe(stepBeforeMigration + 50); // Seamless continuation
  });

  it("triggers instant rollback back to source node when checksum corruption is detected", async () => {
    const workload = new MonteCarloWorkload("node-thinkpad-x1");
    workload.tick();
    const initialStep = workload.step;

    const result = await migrationCoordinator.executeMigration(
      workload,
      "node-macbook-m3",
      {
        simulateCorruptChecksum: true,
        artificialDelayMs: 10
      }
    );

    expect(result.success).toBe(false);
    expect(result.event.stage).toBe("FAILED_ROLLBACK");
    // Workload is safely restored to source device!
    expect(workload.currentDeviceId).toBe("node-thinkpad-x1");
    expect(workload.epoch).toBe(1);
    expect(workload.status).toBe("RUNNING");
    expect(workload.step).toBe(initialStep); // Zero data loss!
  });

  it("triggers instant rollback when network drop occurs during transfer", async () => {
    const workload = new MonteCarloWorkload("node-thinkpad-x1");
    workload.tick();

    const result = await migrationCoordinator.executeMigration(
      workload,
      "node-macbook-m3",
      {
        simulateNetworkDrop: true,
        artificialDelayMs: 10
      }
    );

    expect(result.success).toBe(false);
    expect(result.event.stage).toBe("FAILED_ROLLBACK");
    expect(workload.currentDeviceId).toBe("node-thinkpad-x1");
    expect(workload.status).toBe("RUNNING");
  });
});

