import React, { useRef, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  TrendingUp,
  Cpu,
  ShieldAlert,
  Radio,
  Boxes,
  Activity
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

  // Animated HTML5 Canvas Rendering Loop
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

      // Clear Canvas
      ctx.fillStyle = "#0A0E1A";
      ctx.fillRect(0, 0, width, height);

      // Subtle Grid Background
      ctx.strokeStyle = "rgba(30, 41, 59, 0.4)";
      ctx.lineWidth = 1;
      const gridSize = 24;
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
        // Render Monte Carlo Convergence & Geometric Brownian paths
        const history = workload.stateData?.history || [];
        if (history.length > 1) {
          ctx.strokeStyle = "#6366F1";
          ctx.lineWidth = 2.5;
          ctx.beginPath();

          const stepX = width / Math.max(20, history.length - 1);
          for (let i = 0; i < history.length; i++) {
            const val = history[i];
            const normY = height - (val / 10) * (height - 30) - 15;
            if (i === 0) ctx.moveTo(0, normY);
            else ctx.lineTo(i * stepX, normY);
          }
          ctx.stroke();

          // Gradient area fill
          ctx.lineTo(width, height);
          ctx.lineTo(0, height);
          const grad = ctx.createLinearGradient(0, 0, 0, height);
          grad.addColorStop(0, "rgba(99, 102, 241, 0.25)");
          grad.addColorStop(1, "rgba(99, 102, 241, 0.0)");
          ctx.fillStyle = grad;
          ctx.fill();
        }

        // Animated Bell Curve / Horizon Ticker
        ctx.fillStyle = "#22C55E";
        ctx.font = "11px 'JetBrains Mono', monospace";
        ctx.fillText(`Simulated Path Iterations: ${workload.step.toLocaleString()}`, 16, 24);
        ctx.fillText(`Running VaR (99%): ${workload.metrics.currentValue}%`, 16, 40);

      } else if (workload.type === "neural_net") {
        // Render Neural Loss Curve & Micro-Batch Gradient Nodes
        const lossHistory = workload.stateData?.lossHistory || [];
        if (lossHistory.length > 1) {
          ctx.strokeStyle = "#EC4899";
          ctx.lineWidth = 2.5;
          ctx.beginPath();

          const stepX = width / Math.max(20, lossHistory.length - 1);
          for (let i = 0; i < lossHistory.length; i++) {
            const l = lossHistory[i];
            const normY = height - (1 - Math.min(1, l / 2.5)) * (height - 40) - 20;
            if (i === 0) ctx.moveTo(0, normY);
            else ctx.lineTo(i * stepX, normY);
          }
          ctx.stroke();
        }

        // Pulsing Neural Nodes
        const nodes = [
          { x: width - 80, y: 50 },
          { x: width - 80, y: 100 },
          { x: width - 40, y: 75 }
        ];
        ctx.strokeStyle = "rgba(236, 72, 153, 0.4)";
        for (const n of nodes) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, 6 + Math.sin(tickCount * 0.1) * 2, 0, Math.PI * 2);
          ctx.fillStyle = "#EC4899";
          ctx.fill();
          ctx.stroke();
        }

        ctx.fillStyle = "#EC4899";
        ctx.font = "11px 'JetBrains Mono', monospace";
        ctx.fillText(`Optimization Step: #${workload.step.toLocaleString()}`, 16, 24);
        ctx.fillText(`Categorical Loss: ${workload.metrics.currentValue}`, 16, 40);

      } else {
        // Generic Memory / Heatmap Grid for Container / GPU
        const cols = 20;
        const rows = 6;
        const cellW = (width - 32) / cols;
        const cellH = (height - 48) / rows;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const active = (r * cols + c + tickCount) % 7 === 0;
            ctx.fillStyle = active ? "rgba(6, 182, 212, 0.6)" : "rgba(30, 41, 59, 0.5)";
            ctx.fillRect(16 + c * cellW, 36 + r * cellH, cellW - 2, cellH - 2);
          }
        }

        ctx.fillStyle = "#06B6D4";
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

  const sourceDevice = devices.find((d) => d.id === workload.currentDeviceId);
  const targetDevice = devices.find((d) => d.id === selectedTargetId);

  return (
    <div className="teleport-panel p-5 space-y-4">
      {/* WORKLOAD SELECTOR TABS & EXECUTION STATUS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white tracking-tight uppercase">
              Active Computational Workload
            </h2>
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                workload.status === "RUNNING"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : workload.status === "FENCED_STOPPED"
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                  : workload.status === "REMOTE_FALLBACK"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  : "bg-slate-800 text-slate-300 border-slate-700"
              }`}
            >
              {workload.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Running on <span className="text-white font-medium">{sourceDevice?.name || workload.currentDeviceId}</span> under{" "}
            <span className="font-mono text-emerald-400 font-semibold">Epoch #{workload.epoch}</span>
          </p>
        </div>

        {/* WORKLOAD TYPE SWITCHER BUTTONS */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <button
            onClick={() => onSelectWorkloadType("workload-monte-carlo-var")}
            className={`px-3 py-1 rounded-lg transition-all ${
              workload.id === "workload-monte-carlo-var"
                ? "bg-indigo-600 text-white font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Monte Carlo (Tier A)
          </button>
          <button
            onClick={() => onSelectWorkloadType("workload-neural-optimizer")}
            className={`px-3 py-1 rounded-lg transition-all ${
              workload.id === "workload-neural-optimizer"
                ? "bg-indigo-600 text-white font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Neural Net (Tier A)
          </button>
          <button
            onClick={() => onSelectWorkloadType("workload-redis-criu")}
            className={`px-3 py-1 rounded-lg transition-all ${
              workload.id === "workload-redis-criu"
                ? "bg-indigo-600 text-white font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Redis Container (Tier B)
          </button>
          <button
            onClick={() => onSelectWorkloadType("workload-gpu-raytracer")}
            className={`px-3 py-1 rounded-lg transition-all ${
              workload.id === "workload-gpu-raytracer"
                ? "bg-indigo-600 text-white font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            GPU Raytracer (Tier C)
          </button>
        </div>
      </div>

      {/* WORKLOAD CANVAS & TELEMETRY ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* CANVAS MONITOR */}
        <div className="lg:col-span-2 relative rounded-xl overflow-hidden border border-slate-800 bg-[#0A0E1A]">
          <canvas
            ref={canvasRef}
            width={640}
            height={200}
            className="w-full h-48 block"
          />
          {/* STEP COUNTER OVERLAY */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80 backdrop-blur-md">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Instruction Step:</span>
            <span className="font-mono text-xs font-bold text-cyan-400">
              #{workload.step.toLocaleString()}
            </span>
          </div>
        </div>

        {/* METRICS & WORKLOAD SPECS */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Workload Tier:</span>
              <span className="font-mono text-indigo-300 font-semibold">{workload.tier}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Memory Footprint:</span>
              <span className="font-mono text-slate-200">{workload.memoryFootprintMB} MB</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Cross-ISA Capable:</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {workload.tier === "TIER_A_PORTABLE" ? "YES (Wasm/State)" : "NO (ISA-Tied)"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Fencing Lease Status:</span>
              <span className="font-mono text-emerald-400">Active (Epoch #{workload.epoch})</span>
            </div>

            {/* CONTROLS */}
            <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
              {workload.status === "RUNNING" ? (
                <button
                  onClick={() => onWorkloadAction("PAUSE")}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all"
                >
                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  onClick={() => onWorkloadAction("RESUME")}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume</span>
                </button>
              )}
              <button
                onClick={() => onWorkloadAction("RESET")}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-all"
                title="Reset Iteration Counter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* TELEPORT ACTION BUTTON */}
          <div className="pt-4 border-t border-slate-800/80">
            <button
              onClick={onInitiateMigration}
              disabled={isMigrating || !selectedTargetId || selectedTargetId === workload.currentDeviceId}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider transition-all shadow-lg ${
                isMigrating
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : !selectedTargetId || selectedTargetId === workload.currentDeviceId
                  ? "bg-slate-800/80 text-slate-400 border border-slate-700 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-indigo-500/25 active:scale-98"
              }`}
            >
              <Zap className="w-4 h-4 text-cyan-300" />
              <span>
                {isMigrating
                  ? "Teleporting Workload..."
                  : targetDevice
                  ? `Teleport to ${targetDevice.name}`
                  : "Select a Target Device Below"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

