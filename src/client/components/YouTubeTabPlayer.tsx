import React from "react";
import { Play, Pause, RotateCcw, FastForward, Film, CheckCircle2, Radio } from "lucide-react";
import { WorkloadState } from "../types/teleport";

interface YouTubeTabPlayerProps {
  workload: WorkloadState | null;
  onWorkloadAction: (action: "PAUSE" | "RESUME" | "RESET" | "SEEK", payload?: any) => void;
  onInitiateMigration: () => void;
  isMigrating: boolean;
}

export const YouTubeTabPlayer: React.FC<YouTubeTabPlayerProps> = ({
  workload,
  onWorkloadAction,
  onInitiateMigration,
  isMigrating
}) => {
  const isYoutube = workload?.type === "youtube_player";
  if (!isYoutube || !workload) return null;

  const stateData = workload.stateData || {};
  const currentTime = stateData.currentTime || workload.metrics.currentTime || 0;
  const duration = stateData.duration || 600;
  const isPlaying = stateData.isPlaying ?? (workload.status === "RUNNING");
  const videoId = stateData.videoId || "dQw4w9WgXcQ";
  const title = stateData.title || "Distributed Workload Migration Keynote";

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}.${ms}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSeconds = parseFloat(e.target.value);
    onWorkloadAction("SEEK", { seconds: newSeconds });
  };

  return (
    <div className="teleport-panel p-6 space-y-5 border-cyan-500/30 bg-slate-900/90 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Interactive Browser Tab & Media Player
            </h3>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              Stateful Media Workload
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Live video/tab session executing on Host <span className="font-mono text-cyan-300">{workload.currentDeviceId}</span> under Epoch #{workload.epoch}. Migrates exact playback timestamp across laptops.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 font-mono text-xs text-indigo-300">
            Playback: <strong className="text-white">{formatTime(currentTime)}</strong> / {formatTime(duration)}
          </div>
        </div>
      </div>

      {/* EMBEDDED VIDEO VIEWPORT & STATE DISPLAY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex flex-col justify-between p-4 group">
          {/* Simulated Web Video / Canvas Display */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

          {/* Video Placeholder Backdrop with dynamic motion */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2 select-none">
              <Film className={`w-16 h-16 mx-auto text-cyan-400/40 ${isPlaying ? "animate-pulse" : ""}`} />
              <div className="font-bold text-white tracking-wide text-sm">{title}</div>
              <div className="text-xs font-mono text-cyan-300">Stream ID: {videoId}</div>
            </div>
          </div>

          {/* Top Bar inside Viewport */}
          <div className="relative z-10 flex items-center justify-between text-xs font-mono text-slate-300">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md border border-slate-700/60">
              <span className={`w-2 h-2 rounded-full ${isPlaying ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
              <span>{isPlaying ? "PLAYING" : "PAUSED"}</span>
            </div>
            <div className="px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md border border-slate-700/60">
              Timestamp: {formatTime(currentTime)}
            </div>
          </div>

          {/* Bottom Bar Controls inside Viewport */}
          <div className="relative z-10 space-y-2">
            <input
              type="range"
              min={0}
              max={duration}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onWorkloadAction(isPlaying ? "PAUSE" : "RESUME")}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
                </button>
                <span className="font-mono text-slate-200">{formatTime(currentTime)}</span>
              </div>
              <span className="font-mono text-[11px] text-slate-400">1080p 60fps WebRTC Track</span>
            </div>
          </div>
        </div>

        {/* WORKLOAD TELEMETRY & MIGRATION CONTROLS */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Preserved State Frame
            </h4>
            <div className="text-xs font-mono space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Video ID:</span>
                <span className="text-white truncate max-w-[150px]">{videoId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Exact Timestamp:</span>
                <span className="text-cyan-400 font-bold">{formatTime(currentTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Playback State:</span>
                <span className={isPlaying ? "text-emerald-400" : "text-amber-400"}>
                  {isPlaying ? "Active (Playing)" : "Paused"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Active Host Node:</span>
                <span className="text-indigo-400 truncate max-w-[150px]">{workload.currentDeviceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Epoch Lease:</span>
                <span className="text-emerald-400">#{workload.epoch}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onInitiateMigration}
            disabled={isMigrating}
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 ${
              isMigrating
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-cyan-500/20"
            }`}
          >
            <FastForward className="w-4 h-4" />
            {isMigrating ? "Migrating Media Session..." : "Migrate Browser Tab to Target Laptop"}
          </button>
        </div>
      </div>
    </div>
  );
};
