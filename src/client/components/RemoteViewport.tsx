import React, { useState } from "react";
import {
  MonitorPlay,
  Radio,
  Sliders,
  Send,
  Pause,
  Play,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Wifi,
  MousePointer2
} from "lucide-react";
import { WorkloadState, Device } from "../types/teleport";

interface RemoteViewportProps {
  workload: WorkloadState | null;
  devices: Device[];
  onSendCommand?: (action: string, payload?: any) => void;
}

export const RemoteViewport: React.FC<RemoteViewportProps> = ({
  workload,
  devices,
  onSendCommand
}) => {
  const [interactiveParam, setInteractiveParam] = useState<number>(50);
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);

  const sourceDevice = devices.find((d) => d.id === workload?.currentDeviceId);

  const handleCommand = (action: string, payload?: any) => {
    fetch("/api/teleport/remote-command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workloadId: workload?.id,
        sourceDeviceId: workload?.currentDeviceId,
        targetDeviceId: "remote-client",
        action,
        payload,
        timestamp: Date.now()
      })
    })
      .then((res) => res.json())
      .then(() => {
        setCommandFeedback(`Command "${action}" forwarded to source host successfully.`);
        setTimeout(() => setCommandFeedback(null), 3000);
      });
  };

  return (
    <div className="teleport-panel p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <MonitorPlay className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Interactive Remote Access Viewport (Neko Architecture)
            </h2>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Low-Latency Fallback
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            When state migration is impossible, Teleport preserves uninterrupted computation on the source and streams display with bidirectional input forwarding.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>30 FPS Canvas Relay</span>
          </div>
          <span>|</span>
          <div className="flex items-center gap-1">
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
            <span>18ms Relay Ping</span>
          </div>
        </div>
      </div>

      {/* REMOTE STREAM DISPLAY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden border-2 border-slate-800 bg-slate-950 shadow-2xl flex flex-col justify-between aspect-video p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-live-pulse" />
              <span>Streaming from: {sourceDevice?.name || "Source Host"}</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Res: 1920x1080 · 1.4 Mbps
            </span>
          </div>

          {/* SIMULATED WORKLOAD STREAM WINDOW */}
          <div className="text-center space-y-3 my-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <MonitorPlay className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              {workload?.name}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Workload is actively computing on source device. Interactive inputs below are routed via WebSocket directly into the remote execution loop.
            </p>
            <div className="flex items-center justify-center gap-4 text-xs font-mono text-cyan-300">
              <span>Instruction Step: #{workload?.step.toLocaleString()}</span>
              <span>·</span>
              <span>Metric: {workload?.metrics.currentValue}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-2">
            <span className="flex items-center gap-1">
              <MousePointer2 className="w-3.5 h-3.5" />
              Direct Pointer Forwarding Active
            </span>
            <span>WebRTC Datachannel Emulation</span>
          </div>
        </div>

        {/* INTERACTIVE REMOTE CONTROL PANEL */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Remote Control Dispatcher
              </h4>
            </div>

            {/* PARAMETER SLIDER */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Execution Velocity / Throttle:</span>
                <span className="font-mono text-cyan-400 font-bold">{interactiveParam}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={interactiveParam}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setInteractiveParam(val);
                  handleCommand("SET_PARAM", { velocityPercent: val });
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => handleCommand("PAUSE")}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all"
              >
                <Pause className="w-3.5 h-3.5 text-amber-400" />
                <span>Remote Pause</span>
              </button>
              <button
                onClick={() => handleCommand("RESUME")}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/30 text-xs font-medium transition-all"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>Remote Resume</span>
              </button>
            </div>

            {/* FORWARD INPUT MOCK */}
            <button
              onClick={() => handleCommand("INJECT_INPUT", { key: "SIGCONT", payload: "user_keystroke" })}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all"
            >
              <Send className="w-3.5 h-3.5 text-cyan-400" />
              <span>Forward Keystroke Buffer</span>
            </button>
          </div>

          {commandFeedback && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 font-mono">
              {commandFeedback}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

