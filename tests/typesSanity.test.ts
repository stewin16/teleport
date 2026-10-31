import { describe, it, expect } from "vitest";
import {
  WorkloadState,
  Device,
  WorkloadType,
  TELEPORT_CONSTANTS,
  YouTubeWorkloadStateData
} from "../src/shared/types.js";

describe("Shared Types Centralization", () => {
  it("imports unified Device and WorkloadState interfaces and runtime constants", () => {
    expect(TELEPORT_CONSTANTS.SNAPSHOT_VERSION).toBe("1.0.0");
    expect(TELEPORT_CONSTANTS.DEFAULT_PORT).toBe(3000);

    const d: Device = {
      id: "node-test",
      name: "Laptop Test",
      os: "windows",
      arch: "x86_64",
      cores: 8,
      totalMemoryMB: 16384,
      freeMemoryMB: 8192,
      batteryLevel: 95,
      isCharging: true,
      dischargeRate: 0,
      rttMs: 12,
      bandwidthMbps: 150,
      lastHeartbeat: Date.now(),
      status: "ONLINE",
      isPhysical: true,
      hostname: "LAPTOP-TEST"
    };
    expect(d.id).toBe("node-test");
    expect(d.isPhysical).toBe(true);

    const ytData: YouTubeWorkloadStateData = {
      videoId: "dQw4w9WgXcQ",
      title: "Sample Video",
      currentTime: 142.5,
      duration: 300,
      isPlaying: true,
      playbackRate: 1.0,
      quality: "hd1080"
    };
    expect(ytData.currentTime).toBe(142.5);
  });
});
