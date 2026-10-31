import { describe, it, expect } from "vitest";
import { migrationCoordinator } from "../src/server/migrationCoordinator.js";
import { deviceRegistry } from "../src/server/deviceRegistry.js";
import { YouTubeWorkload } from "../src/shared/workloads/youtubeWorkload.js";

describe("Distributed Network Migration Pipeline", () => {
  it("executes atomic migration between registered physical nodes", async () => {
    const nodeA = deviceRegistry.register({
      id: "phys-laptop-a",
      name: "Laptop A (Host)",
      os: "windows",
      arch: "x86_64",
      cores: 8,
      totalMemoryMB: 16384,
      freeMemoryMB: 9500,
      batteryLevel: 88,
      isCharging: true,
      dischargeRate: 0,
      rttMs: 12,
      bandwidthMbps: 180,
      isVirtual: false,
      isPhysical: true,
      hostname: "LAPTOP-HOST-A"
    });

    const nodeB = deviceRegistry.register({
      id: "phys-laptop-b",
      name: "Laptop B (Target)",
      os: "windows",
      arch: "x86_64",
      cores: 8,
      totalMemoryMB: 16384,
      freeMemoryMB: 10200,
      batteryLevel: 94,
      isCharging: true,
      dischargeRate: 0,
      rttMs: 14,
      bandwidthMbps: 160,
      isVirtual: false,
      isPhysical: true,
      hostname: "LAPTOP-PEER-B"
    });

    const workload = new YouTubeWorkload(nodeA.id, "dQw4w9WgXcQ");
    workload.seekTo(120.4);

    const result = await migrationCoordinator.executeMigration(workload, nodeB.id, {
      artificialDelayMs: 10
    });

    expect(result.success).toBe(true);
    expect(workload.currentDeviceId).toBe(nodeB.id);
    expect(workload.epoch).toBe(2);
    expect(workload.currentTime).toBe(120.4);
    expect(workload.status).toBe("RUNNING");
  });
});

