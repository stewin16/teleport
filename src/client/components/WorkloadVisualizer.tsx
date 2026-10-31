import React, { useRef, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  TrendingUp,
  Cpu,
  ShieldCheck,
  Radio,
  Boxes,
  Activity,
  ArrowRight
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

      // Bedrock background
      ctx.fillStyle = "#0B0F17";
      ctx.fillRect(0, 0, width, height);

      // Precision hairline grid
      ctx.strokeStyle = "rgba(34, 46, 66, 0.4)";
      ctx.lineWidth = 1;
      const gridSize = 28;
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
        // Monte Carlo Convergence & Geometric Brownian paths
        const history = workload.stateData?.history || [];
        if (history.length > 1) {
          ctx.strokeStyle = "#A3E635";
          ctx.lineWidth = 2;
          ctx.beginPath();

          const stepX = width / Math.max(20, history.length - 1);
          for (let i = 0; i < history.length; i++) {
            const val = history[i];
            const normY = height - (val / 10) * (height - 36) - 18;
            if (i === 0) ctx.moveTo(0, normY);
            else ctx.lineTo(i * stepX, normY);
          }
          ctx.stroke();

          // Subtle signal gradient area fill
          ctx.lineTo(width, height);
          ctx.lineTo(0, height);
          const grad = ctx.createLinearGradient(0, 0, 0, height);
          grad.addColorStop(0, "rgba(163, 230, 53, 0.15)");
          grad.addColorStop(1, "rgba(163, 230, 53, 0.0)");
          ctx.fillStyle = grad;
          ctx.fill();
        }

        // Ticker & statistics
        ctx.fillStyle = "#A3E635";
        ctx.font = "11px 'JetBrains Mono', monospace";
        ctx.fillText(`Simulated Path Iterations: ${workload.step.toLocaleString()}`, 16, 26);
        ctx.fillStyle = "#94A3B8";
        ctx.fillText(`Running VaR (99%): ${workload.metrics.currentValue}%`, 16, 42);

      } else if (workload.type === "neural_net") {
        // Neural Loss Curve & Micro-Batch Gradient Nodes
        const lossHistory = workload.stateData?.lossHistory || [];
        if (lossHistory.length > 1) {
          ctx.strokeStyle = "#38BDF8";
          ctx.lineWidth = 2;
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

        // Animated weight nodes
        const nodes = [
          { x: width - 80, y: 50 },
          { x: width - 80, y: 100 },
          { x: width - 40, y: 75 }
        ];
        ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
        for (const n of nodes) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, 5 + Math.sin(tickCount * 0.1) * 2, 0, Math.PI * 2);
          ctx.fillStyle = "#38BDF8";
          ctx.fill();
          ctx.stroke();
        }

        ctx.fillStyle = "#38BDF8";
        ctx.font = "11px 'JetBrains Mono', monospace";
        ctx.fillText(`Optimization Step: #${workload.step.toLocaleString()}`, 16, 26);
        ctx.fillStyle = "#94A3B8";
        ctx.fillText(`Categorical Loss: ${workload.metrics.currentValue}`, 16, 42);

      } else {
        // Linear Memory Matrix for Container / GPU
        const cols = 24;
        const rows = 5;
        const cellW = (width - 32) / cols;
        const cellH = (height - 48) / rows;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const active = (r * cols + c + tickCount) % 9 === 0;
            ctx.fillStyle = active ? "rgba(163, 230, 53, 0.7)" : "rgba(34, 46, 66, 0.5)";
            ctx.fillRect(16 + c * cellW, 36 + r * cellH, cellW - 2, cellH - 2);
          }
        }

        ctx.fillStyle = "#A3E635";
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
    <div className="vantage-panel p-5 space-y-4 ticks">
      {/* HEADER & SEGMENTED WORKLOAD SELECTOR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-rule pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-signal" />
            <h2 className="text-sm font-display font-medium text-ink">
              Active computational workload
            </h2>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                workload.status === "RUNNING"
                  ? "bg-signal-dim text-signal border-signal-border"
                  : workload.status === "FENCED_STOPPED"
                  ? "bg-danger-dim text-danger border-danger-border"
                  : workload.status === "REMOTE_FALLBACK"
                  ? "bg-warn-dim text-warn border-warn-border"
                  : "bg-surface-elevated text-ink-muted border-rule"
              }`}
            >
              {workload.status.toLowerCase()}
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Host: <span className="text-ink font-medium">{sourceDevice?.name || workload.currentDeviceId}</span>
            <span className="text-ink-faint mx-2">/</span>
            Lease: <span className="font-mono text-signal">epoch #{workload.epoch}</span>
          </p>
        </div>

        {/* WORKLOAD TYPE SELECTOR */}
        <div className="flex flex-wrap items-center gap-1 p-1 rounded bg-surface-elevated border border-rule text-xs">
          <button
            onClick={() => onSelectWorkloadType("workload-monte-carlo-var")}
            className={`px-2.5 py-1 rounded transition-colors ${
              workload.id === "workload-monte-carlo-var"
                ? "bg-bedrock text-signal font-medium border border-rule-strong shadow-sm"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Monte Carlo (Tier A)
          </button>
          <button
            onClick={() => onSelectWorkloadType("workload-neural-optimizer")}
            className={`px-2.5 py-1 rounded transition-colors ${
              workload.id === "workload-neural-optimizer"
                ? "bg-bedrock text-signal font-medium border border-rule-strong shadow-sm"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Neural Net (Tier A)
          </button>
          <button
            onClick={() => onSelectWorkloadType("workload-redis-criu")}
            className={`px-2.5 py-1 rounded transition-colors ${
              workload.id === "workload-redis-criu"
                ? "bg-bedrock text-signal font-medium border border-rule-strong shadow-sm"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Redis CRIU (Tier B)
          </button>
          <button
            onClick={() => onSelectWorkloadType("workload-gpu-raytracer")}
            className={`px-2.5 py-1 rounded transition-colors ${
              workload.id === "workload-gpu-raytracer"
                ? "bg-bedrock text-signal font-medium border border-rule-strong shadow-sm"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            GPU Raytracer (Tier C)
          </button>
        </div>
      </div>

      {/* VISUALIZER CANVAS & CONTROL DECK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* CANVAS MONITOR */}
        <div className="lg:col-span-2 relative rounded overflow-hidden border border-rule bg-bedrock">
          <canvas
            ref={canvasRef}
            width={640}
            height={200}
            className="w-full h-48 block"
          />
          {/* STEP COUNTER OVERLAY */}
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface/90 border border-rule text-xs font-mono backdrop-blur-sm">
            <span className="text-[10px] text-ink-faint">step:</span>
            <span className="text-signal font-semibold teleport-num">
              #{workload.step.toLocaleString()}
            </span>
          </div>
        </div>

        {/* METRICS & TELEPORT DISPATCH */}
        <div className="vantage-panel-elevated p-4 flex flex-col justify-between space-y-4">
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">workload tier:</span>
              <span className="font-mono text-ink font-medium">{workload.tier}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">memory footprint:</span>
              <span className="font-mono text-ink teleport-num">{workload.memoryFootprintMB} MB</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">cross-architecture:</span>
              <span className="font-mono text-signal">
                {workload.tier === "TIER_A_PORTABLE" ? "portable (wasm/state)" : "isa-locked"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">lease status:</span>
              <span className="font-mono text-signal">active (epoch #{workload.epoch})</span>
            </div>

            {/* CONTROLS */}
            <div className="pt-3 border-t border-rule flex items-center gap-2">
              {workload.status === "RUNNING" ? (
                <button
                  onClick={() => onWorkloadAction("PAUSE")}
                  className="flex-1 vantage-btn-secondary py-1.5 px-3 text-xs"
                >
                  <Pause className="w-3.5 h-3.5 text-warn" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  onClick={() => onWorkloadAction("RESUME")}
                  className="flex-1 vantage-btn-primary py-1.5 px-3 text-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume</span>
                </button>
              )}
              <button
                onClick={() => onWorkloadAction("RESET")}
                className="vantage-btn-secondary py-1.5 px-2 text-xs"
                title="Reset Iterations"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* TELEPORT ACTION BUTTON */}
          <div className="pt-3 border-t border-rule">
            <button
              onClick={onInitiateMigration}
              disabled={isMigrating || !selectedTargetId || selectedTargetId === workload.currentDeviceId}
              className="w-full vantage-btn-primary py-2.5 text-xs font-semibold"
            >
              <Zap className="w-4 h-4 text-signal-ink fill-signal-ink" />
              <span>
                {isMigrating
                  ? "Teleporting state..."
                  : targetDevice
                  ? `Teleport to ${targetDevice.name}`
                  : "Select target node"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
