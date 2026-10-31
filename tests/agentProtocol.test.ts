import { describe, it, expect } from "vitest";
import { NodeAgent } from "../src/agent/nodeAgent.js";

describe("Physical Node Agent Lifecycle", () => {
  it("initializes agent with unique device ID and valid HMAC handshake token", () => {
    const agent = new NodeAgent({
      coordinatorUrl: "ws://localhost:3000/ws",
      name: "Test Laptop B"
    });
    expect(agent.deviceId).toMatch(/^node-[a-z0-9-]+$/);
    expect(agent.token).toBeDefined();
    expect(agent.token.length).toBe(64); // 32-byte sha256 hex
    expect(agent.name).toBe("Test Laptop B");
    expect(agent.isExecuting).toBe(false);
  });

  it("handles incoming lease acquisition and starts local computation", () => {
    const agent = new NodeAgent({
      coordinatorUrl: "ws://localhost:3000/ws",
      name: "Test Laptop B"
    });

    const mockState = {
      step: 500,
      currentTime: 120.5,
      isPlaying: true,
      videoId: "dQw4w9WgXcQ"
    };

    agent.handleLeaseGranted("workload-youtube-tab", "youtube_player", mockState, 2);
    expect(agent.isExecuting).toBe(true);
    expect(agent.currentEpoch).toBe(2);
    expect(agent.activeWorkloadId).toBe("workload-youtube-tab");

    // Revoke lease
    const snapshot = agent.handleLeaseRevoked(2);
    expect(agent.isExecuting).toBe(false);
    expect(snapshot.currentTime).toBeGreaterThanOrEqual(120.5);
  });
});
