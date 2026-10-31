import { describe, it, expect } from "vitest";
import { verifyDeviceToken } from "../src/server/crypto.js";
import { YouTubeWorkload } from "../src/shared/workloads/youtubeWorkload.js";
import { migrationCoordinator } from "../src/server/migrationCoordinator.js";
import { deviceRegistry } from "../src/server/deviceRegistry.js";

describe("Review Fixes Verification (CRIT-1, CRIT-2, MIN-2)", () => {
  it("MIN-2: verifyDeviceToken returns false on mismatched token lengths without throwing RangeError", () => {
    expect(verifyDeviceToken("node-1", "short")).toBe(false);
    expect(verifyDeviceToken("node-1", "")).toBe(false);
    expect(verifyDeviceToken("node-1", "1234567890abcdef")).toBe(false);
  });

  it("CRIT-2: Workload continues to tick and advance state when in REMOTE_FALLBACK status", () => {
    const workload = new YouTubeWorkload("node-1", "dQw4w9WgXcQ");
    workload.status = "REMOTE_FALLBACK";
    workload.seekTo(50);
    const timeBefore = workload.currentTime;

    workload.tick();
    expect(workload.currentTime).toBeGreaterThanOrEqual(timeBefore);
  });

  it("CRIT-1: migrationCoordinator dispatches remote handoff handler when registered", async () => {
    deviceRegistry.register({
      id: "node-1",
      name: "Source Node 1",
      os: "windows",
      arch: "x86_64",
      cores: 8,
      totalMemoryMB: 16384,
      freeMemoryMB: 8192,
      batteryLevel: 100,
      isCharging: true,
      dischargeRate: 0,
      rttMs: 10,
      bandwidthMbps: 150,
      isVirtual: false,
      isPhysical: true
    });

    deviceRegistry.register({
      id: "remote-phys-target",
      name: "Remote Physical Target",
      os: "windows",
      arch: "x86_64",
      cores: 8,
      totalMemoryMB: 16384,
      freeMemoryMB: 8192,
      batteryLevel: 100,
      isCharging: true,
      dischargeRate: 0,
      rttMs: 12,
      bandwidthMbps: 150,
      isVirtual: false,
      isPhysical: true
    });

    const workload = new YouTubeWorkload("node-1", "video-123");
    let remoteHandoffCalled = false;

    migrationCoordinator.setRemoteHandoffHandler(async (targetId, w, envelope, nextEpoch) => {
      if (targetId === "remote-phys-target") {
        remoteHandoffCalled = true;
        return true;
      }
      return false;
    });

    const result = await migrationCoordinator.executeMigration(workload, "remote-phys-target", {
      artificialDelayMs: 5
    });

    expect(remoteHandoffCalled).toBe(true);
    expect(result.success).toBe(true);
  });
});
