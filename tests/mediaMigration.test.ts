import { describe, it, expect } from "vitest";
import { YouTubeWorkload } from "../src/shared/workloads/youtubeWorkload.js";

describe("YouTube Tab Stateful Workload Migration", () => {
  it("checkpoints exact video playback timestamp and restores on target node", () => {
    const sourceWorkload = new YouTubeWorkload("node-laptop-a", "dQw4w9WgXcQ");
    sourceWorkload.seekTo(145.2);
    sourceWorkload.play();

    // Advance 1 tick
    sourceWorkload.tick();
    const frozenState = sourceWorkload.serializeState();

    expect(frozenState.currentTime).toBeGreaterThanOrEqual(145.2);
    expect(frozenState.isPlaying).toBe(true);
    expect(frozenState.videoId).toBe("dQw4w9WgXcQ");

    // Restore on Target Laptop B
    const targetWorkload = new YouTubeWorkload("node-laptop-b", "placeholder");
    targetWorkload.restoreState(frozenState, 2, "node-laptop-b");

    expect(targetWorkload.currentDeviceId).toBe("node-laptop-b");
    expect(targetWorkload.epoch).toBe(2);
    expect(targetWorkload.currentTime).toBe(frozenState.currentTime);
    expect(targetWorkload.isPlaying).toBe(true);
    expect(targetWorkload.status).toBe("RUNNING");
  });

  it("freezes and pauses playback on source upon fencing", () => {
    const workload = new YouTubeWorkload("node-laptop-a", "video-123");
    workload.play();
    expect(workload.isPlaying).toBe(true);

    const snapshot = workload.fence(1);
    expect(workload.status).toBe("FENCED_STOPPED");
    expect(workload.isPlaying).toBe(false);
    expect(snapshot.videoId).toBe("video-123");
  });

  it("supports remote seeking and playback commands", () => {
    const workload = new YouTubeWorkload("node-laptop-a", "video-456");
    workload.seekTo(89.5);
    expect(workload.currentTime).toBe(89.5);

    workload.pause();
    expect(workload.isPlaying).toBe(false);

    workload.play();
    expect(workload.isPlaying).toBe(true);
  });
});
