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
        setCommandFeedback(`Command "${action}" forwarded to source host.`);
        setTimeout(() => setCommandFeedback(null), 3000);
      });
  };

  return (
    <div className="vantage-panel p-6 space-y-6 ticks">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule pb-4">
        <div>
          <div className="flex items-center gap-2">
            <MonitorPlay className="w-4 h-4 text-warn" />
            <h2 className="text-sm font-display font-medium text-ink">
              Interactive remote access viewport (Neko architecture)
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-warn-dim text-warn border border-warn-border">
              fallback relay
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            When hardware migration is infeasible, Teleport preserves uninterrupted execution on the source and streams display with bidirectional input forwarding
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-ink-muted">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-signal animate-signal-pulse" />
            <span className="teleport-num">30 FPS canvas relay</span>
          </div>
          <span className="text-rule-strong">/</span>
          <div className="flex items-center gap-1">
            <Wifi className="w-3.5 h-3.5 text-signal" />
            <span className="teleport-num">18ms latency</span>
          </div>
        </div>
      </div>

      {/* REMOTE STREAM DISPLAY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative rounded overflow-hidden border border-rule bg-bedrock shadow-xl flex flex-col justify-between aspect-video p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-surface/90 border border-rule text-xs font-mono text-ink-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-warn" />
              <span>Streaming from: {sourceDevice?.name || "Source Host"}</span>
            </div>
            <span className="text-xs font-mono text-ink-faint teleport-num">
              1920x1080 / 1.4 Mbps
            </span>
          </div>

          {/* SIMULATED WORKLOAD STREAM WINDOW */}
          <div className="text-center space-y-3 my-auto">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-surface-elevated border border-rule text-warn">
              <MonitorPlay className="w-6 h-6" />
            </div>
            <h3 className="text-base font-display font-medium text-ink">
              {workload?.name}
            </h3>
            <p className="text-xs text-ink-muted max-w-md mx-auto leading-relaxed">
              Workload is actively computing on source device. Interactive inputs below are routed via WebSocket directly into the remote execution loop.
            </p>
            <div className="flex items-center justify-center gap-3 text-xs font-mono text-signal">
              <span>step: #{workload?.step.toLocaleString()}</span>
              <span className="text-rule-strong">/</span>
              <span>metric: {workload?.metrics.currentValue}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-ink-faint border-t border-rule pt-2 font-mono">
            <span className="flex items-center gap-1">
              <MousePointer2 className="w-3 h-3 text-signal" />
              <span>Direct pointer forwarding active</span>
            </span>
            <span>WebRTC datachannel emulation</span>
          </div>
        </div>

        {/* INTERACTIVE REMOTE CONTROL PANEL */}
        <div className="vantage-panel-elevated p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-rule pb-3">
              <Sliders className="w-4 h-4 text-warn" />
              <h4 className="text-xs font-display font-medium text-ink">
                Remote command dispatcher
              </h4>
            </div>

            {/* PARAMETER SLIDER */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-muted">Execution velocity:</span>
                <span className="font-mono text-signal font-semibold teleport-num">{interactiveParam}%</span>
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
                className="w-full h-1.5 bg-bedrock rounded appearance-none cursor-pointer accent-[#A3E635] border border-rule"
              />
            </div>

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => handleCommand("PAUSE")}
                className="vantage-btn-secondary py-1.5 px-3 text-xs"
              >
                <Pause className="w-3.5 h-3.5 text-warn" />
                <span>Pause</span>
              </button>
              <button
                onClick={() => handleCommand("RESUME")}
                className="vantage-btn-primary py-1.5 px-3 text-xs"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Resume</span>
              </button>
            </div>

            {/* FORWARD INPUT MOCK */}
            <button
              onClick={() => handleCommand("INJECT_INPUT", { key: "SIGCONT", payload: "user_keystroke" })}
              className="w-full vantage-btn-secondary py-2 px-3 text-xs flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5 text-signal" />
              <span>Forward keystroke buffer</span>
            </button>
          </div>

          {commandFeedback && (
            <div className="p-2 rounded bg-signal-dim border border-signal-border text-xs text-signal font-mono">
              {commandFeedback}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
