import { BaseWorkload } from "./baseWorkload.js";
import { WorkloadState, YouTubeWorkloadStateData } from "../types.js";

export class YouTubeWorkload extends BaseWorkload {
  public videoId: string;
  public title: string;
  public currentTime: number; // in seconds
  public duration: number; // in seconds
  public isPlaying: boolean;
  public playbackRate: number;
  private timelineBookmarks: number[];

  constructor(
    initialDeviceId: string = "node-thinkpad-x1",
    videoId: string = "dQw4w9WgXcQ",
    title: string = "Distributed Systems Keynote Demo (Live Stream)"
  ) {
    super(
      "workload-youtube-tab",
      "Interactive Browser Tab & Media Player",
      "youtube_player",
      "TIER_A_PORTABLE",
      initialDeviceId,
      85 // 85 MB lightweight browser tab footprint
    );
    this.videoId = videoId;
    this.title = title;
    this.currentTime = 0;
    this.duration = 600; // 10 minutes default
    this.isPlaying = true;
    this.playbackRate = 1.0;
    this.timelineBookmarks = [0];
  }

  public play(): void {
    this.isPlaying = true;
    this.status = "RUNNING";
    this.lastTickTime = Date.now();
  }

  public override pause(): void {
    this.isPlaying = false;
    this.status = "PAUSED";
  }

  public seekTo(seconds: number): void {
    this.currentTime = Math.max(0, Math.min(this.duration, +seconds.toFixed(2)));
    this.step = Math.round(this.currentTime * 10);
    this.timelineBookmarks.push(this.currentTime);
    if (this.timelineBookmarks.length > 20) {
      this.timelineBookmarks.shift();
    }
  }

  public tick(): void {
    if (!this.isPlaying || (this.status !== "RUNNING" && this.status !== "REMOTE_FALLBACK")) return;

    const now = Date.now();
    const elapsedSeconds = Math.max(0.01, (now - this.lastTickTime) / 1000);
    this.currentTime = +(this.currentTime + elapsedSeconds * this.playbackRate).toFixed(2);
    this.step = Math.round(this.currentTime * 10);

    if (this.currentTime >= this.duration) {
      this.currentTime = this.duration;
      this.isPlaying = false;
      this.status = "COMPLETED";
    }

    this.lastTickTime = now;
  }

  public override fence(revokedEpoch: number): Record<string, any> {
    const snapshot = super.fence(revokedEpoch);
    this.isPlaying = false; // Freeze physical media playback on source immediately
    return snapshot;
  }

  public serializeState(): YouTubeWorkloadStateData & { step: number; timestamp: number } {
    return {
      videoId: this.videoId,
      title: this.title,
      currentTime: this.currentTime,
      duration: this.duration,
      isPlaying: this.isPlaying,
      playbackRate: this.playbackRate,
      quality: "hd1080",
      timelineBookmarks: [...this.timelineBookmarks],
      step: this.step,
      timestamp: Date.now()
    };
  }

  public restoreState(stateData: Record<string, any>, newEpoch: number, targetDeviceId: string): void {
    this.videoId = stateData.videoId || this.videoId;
    this.title = stateData.title || this.title;
    this.currentTime = stateData.currentTime !== undefined ? stateData.currentTime : 0;
    this.duration = stateData.duration || 600;
    this.isPlaying = stateData.isPlaying !== undefined ? stateData.isPlaying : true;
    this.playbackRate = stateData.playbackRate || 1.0;
    this.timelineBookmarks = stateData.timelineBookmarks || [this.currentTime];
    this.step = stateData.step !== undefined ? stateData.step : Math.round(this.currentTime * 10);

    this.epoch = newEpoch;
    this.currentDeviceId = targetDeviceId;
    this.status = "RUNNING";
    this.lastTickTime = Date.now();
  }

  public getStateSummary(): WorkloadState {
    const progressPercent = Math.min(100, Math.round((this.currentTime / this.duration) * 100));

    return {
      id: this.id,
      name: this.name,
      type: this.type,
      tier: this.tier,
      currentDeviceId: this.currentDeviceId,
      epoch: this.epoch,
      status: this.status,
      memoryFootprintMB: this.memoryFootprintMB,
      step: this.step,
      metrics: {
        iteration: this.step,
        currentValue: this.currentTime,
        currentTime: this.currentTime,
        progressPercent,
        lastTickTime: this.lastTickTime
      },
      stateData: {
        videoId: this.videoId,
        title: this.title,
        currentTime: this.currentTime,
        duration: this.duration,
        isPlaying: this.isPlaying,
        playbackRate: this.playbackRate,
        timelineBookmarks: this.timelineBookmarks
      }
    };
  }
}
