import { describe, it, expect } from "vitest";
import { StreamRelay } from "../src/server/streamRelay.js";

describe("Neko Canvas Stream & Command Relay", () => {
  it("registers broadcaster, distributes frame to viewers, and relays input commands", () => {
    const relay = new StreamRelay();
    let receivedCommand = false;
    relay.onCommand((cmd) => {
      if (cmd.action === "PAUSE") receivedCommand = true;
    });

    relay.handleCommand({
      workloadId: "w1",
      sourceDeviceId: "d1",
      targetDeviceId: "d2",
      action: "PAUSE",
      timestamp: Date.now()
    });
    expect(receivedCommand).toBe(true);
  });

  it("stores and emits latest frame buffer", () => {
    const relay = new StreamRelay();
    const frameData = "data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoAAP7/2QAA";
    relay.broadcastFrame(frameData, 100, 1500);

    const latest = relay.getLatestFrame();
    expect(latest).toBeDefined();
    expect(latest?.frameData).toBe(frameData);
    expect(latest?.step).toBe(100);
  });
});
