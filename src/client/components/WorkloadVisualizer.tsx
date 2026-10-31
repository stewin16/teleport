import React, { useRef, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  TrendingUp,
  Cpu,
  Radio,
  Boxes,
  Activity,
  ArrowRight,
  Film
} from "lucide-react";
import { WorkloadState, Device } from "../types/teleport";

interface WorkloadVisualizerProps {
  workload: WorkloadState | null;
  devices: Device[];
  selectedTargetId?: string;
  onSelectTarget: (id: string) => void;
  onWorkloadAction: (action: "PAUSE" | "RESUME" | "RESET") => void;
  onSelectWorkloadType: (workloadId: string) => void;
  onInitiateMigration: () => void;
  isMigrating: boolean;
}

export const WorkloadVisualizer: React.FC<WorkloadVisualizerProps> = ({
  workload,
  devices,
  selectedTargetId,
  onSelectTarget,
  onWorkloadAction,
  onSelectWorkloadType,
  onInitiateMigration,
  isMigrating
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Hook canvas frames to /ws/stream for real Neko Remote Fallback streaming
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname === "localhost" ? "localhost:3000" : window.location.host;
    const streamWs = new WebSocket(`${protocol}//${host}/ws/stream`);

    const interval = setInterval(() => {
      const canvas = canvasRef.current;
      if (
        canvas &&
        streamWs.readyState === WebSocket.OPEN &&
        workload &&
        (workload.status === "RUNNING" || workload.status === "REMOTE_FALLBACK")
      ) {
        try {
          const dataUrl = canvas.toDataURL("image/webp", 0.4);
          streamWs.send(
            JSON.stringify({
              type: "BROADCAST_FRAME",
              frameData: dataUrl,
              step: workload.step,
              timestamp: Date.now(),
              width: canvas.width,
              height: canvas.height
            })
          );
        } catch (e) {
          // ignore
        }
      }
    }, 100); // 10-15 FPS broadcast

    return () => {
      clearInterval(interval);
      streamWs.close();
    };
  }, [workload?.id, workload?.status]);

  // Animated High-Precision Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !workload) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let tickCount = 0;

    const render = () => {
      tickCount++;
      const width = canvas.width;
      const height = canvas.height;

      // Dark background
      ctx.fillStyle = "#0B0F17";
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = "rgba(34, 46, 66, 0.4)";
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (workload.type === "monte_carlo") {
        const history = workload.stateData?.history || [];
        if (history.length > 1) {
          ctx.strokeStyle = "#4F46E5";
          ctx.lineWidth = 2;
          ctx.beginPath();

          const stepX = width / Math.max(20, history.length - 1);
          for (let i = 0; i < history.length; i++) {
            const val = history[i];
            const normY = height - (val / 10) * (height - 30) - 15;
            if (i === 0) ctx.moveTo(0, normY);
            else ctx.lineTo(i * stepX, normY);
          }
          ctx.stroke();

          // Area Fill
          ctx.lineTo(width, height);
          ctx.lineTo(0, height);
          const grad = ctx.createLinearGradient(0, 0, 0, height);
          grad.addColorStop(0, "rgba(79, 70, 229, 0.25)");
          grad.addColorStop(1, "rgba(79, 70, 229, 0.0)");
          ctx.fillStyle = grad;
          ctx.fill();
        }

        ctx.fillStyle = "#6366F1";
        ctx.font = "11px 'JetBrains Mono', monospace";
        ctx.fillText(`VaR Monte Carlo Paths: ${workload.step.toLocaleString()}`, 16, 24);
        ctx.fillStyle = "#94A3B8";
        ctx.fillText(`Running VaR 99%: ${workload.metrics.currentValue}%`, 16, 40);

      } else if (workload.type === "youtube_player") {
        ctx.fillStyle = "#06B6D4";
        ctx.font = "12px 'JetBrains Mono', monospace";
        ctx.fillText(`[MEDIA STREAM] ${workload.name}`, 16, 26);
        ctx.fillStyle = "#E2E8F0";
        ctx.fillText(`Video ID: ${workload.stateData?.videoId || "dQw4w9WgXcQ"}`, 16, 46);
        ctx.fillStyle = "#10B981";
        ctx.fillText(`Current Timestamp: ${workload.metrics.currentTime?.toFixed(1) || 0}s`, 16, 66);

        // Progress bar on canvas
        const progress = (workload.metrics.currentTime || 0) / (workload.stateData?.duration || 600);
        ctx.fillStyle = "rgba(30, 41, 59, 0.8)";
        ctx.fillRect(16, height - 30, width - 32, 10);
        ctx.fillStyle = "#06B6D4";
        ctx.fillRect(16, height - 30, (width - 32) * Math.min(1, progress), 10);

      } else {
        const cols = 24;
        const rows = 5;
        const cellW = (width - 32) / cols;
        const cellH = (height - 48) / rows;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const active = (r * cols + c + tickCount) % 9 === 0;
            ctx.fillStyle = active ? "rgba(16, 185, 129, 0.7)" : "rgba(34, 46, 66, 0.5)";
            ctx.fillRect(16 + c * cellW, 36 + r * cellH, cellW - 2, cellH - 2);
          }
        }

        ctx.fillStyle = "#10B981";
        ctx.font = "11px 'JetBrains Mono', monospace";
        ctx.fillText(`Active Execution Ticks: ${workload.step.toLocaleString()}`, 16, 24);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [workload]);

  if (!workload) return null;

  return (
    <div className="teleport-panel p-6 space-y-4">
      {/* WORKLOAD TYPE SELECTOR BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white tracking-tight uppercase">
            Active Workload Engine
          </h3>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono overflow-x-auto">
          <button
            onClick={() => onSelectWorkloadType("workload-monte-carlo-var")}
            className={`px-3 py-1 rounded-lg transition-all ${
              workload.id === "workload-monte-carlo-var"
                ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Monte Carlo VaR
          </button>
          <button
            onClick={() => onSelectWorkloadType("workload-youtube-tab")}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
              workload.id === "workload-youtube-tab"
                ? "bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>YouTube Tab</span>
          </button>
          <button
            onClick={() => onSelectWorkloadType("workload-neural-optimizer")}
            className={`px-3 py-1 rounded-lg transition-all ${
              workload.id === "workload-neural-optimizer"
                ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Neural Net
          </button>
          <button
            onClick={() => onSelectWorkloadType("workload-redis-criu")}
            className={`px-3 py-1 rounded-lg transition-all ${
              workload.id === "workload-redis-criu"
                ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Redis CRIU
          </button>
          <button
            onClick={() => onSelectWorkloadType("workload-gpu-raytracer")}
            className={`px-3 py-1 rounded-lg transition-all ${
              workload.id === "workload-gpu-raytracer"
                ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            GPU Raytracer
          </button>
        </div>
      </div>

      {/* VISUALIZER CANVAS & CONTROL DECK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* CANVAS MONITOR */}
        <div className="lg:col-span-2 relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
          <canvas
            ref={canvasRef}
            width={640}
            height={200}
            className="w-full h-48 block"
          />
          {/* STEP COUNTER OVERLAY */}
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-xs font-mono text-cyan-400 backdrop-blur-sm">
            <span className="text-[10px] text-slate-400">Step:</span>
            <span className="font-bold">#{workload.step.toLocaleString()}</span>
          </div>
        </div>

        {/* METRICS & DISPATCH */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Tier:</span>
              <span className="text-white font-bold">{workload.tier}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Memory:</span>
              <span className="text-white">{workload.memoryFootprintMB} MB</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Host:</span>
              <span className="text-indigo-400 truncate max-w-[140px]">{workload.currentDeviceId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Lease:</span>
              <span className="text-emerald-400">Epoch #{workload.epoch}</span>
            </div>

            {/* CONTROLS */}
            <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
              {workload.status === "RUNNING" ? (
                <button
                  onClick={() => onWorkloadAction("PAUSE")}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center justify-center gap-1"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  onClick={() => onWorkloadAction("RESUME")}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Resume</span>
                </button>
              )}
              <button
                onClick={() => onWorkloadAction("RESET")}
                className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* TELEPORT TO TARGET BUTTON */}
          <button
            onClick={onInitiateMigration}
            disabled={isMigrating}
            className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all ${
              isMigrating
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
            }`}
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>{isMigrating ? "Migrating..." : "Teleport to Target Laptop"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
