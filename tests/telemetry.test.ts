import { describe, it, expect } from "vitest";
import { getSystemTelemetry } from "../src/shared/telemetry.js";

describe("Real Windows Telemetry Subsystem", () => {
  it("queries real host OS metrics without crashing", async () => {
    const telemetry = await getSystemTelemetry();
    expect(telemetry.hostname).toBeDefined();
    expect(telemetry.hostname.length).toBeGreaterThan(0);
    expect(telemetry.totalMemoryMB).toBeGreaterThan(1024);
    expect(telemetry.freeMemoryMB).toBeGreaterThan(0);
    expect(telemetry.cores).toBeGreaterThan(0);
    expect(telemetry.cpuUsagePercent).toBeGreaterThanOrEqual(0);
    expect(telemetry.cpuUsagePercent).toBeLessThanOrEqual(100);
    expect(["x86_64", "arm64"]).toContain(telemetry.arch);
    expect(["windows", "macos", "linux"]).toContain(telemetry.os);
    expect(telemetry.batteryLevel).toBeGreaterThanOrEqual(0);
    expect(telemetry.batteryLevel).toBeLessThanOrEqual(100);
    expect(typeof telemetry.isCharging).toBe("boolean");
  });
});

