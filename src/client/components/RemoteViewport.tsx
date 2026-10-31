import React, { useState, useEffect, useRef } from "react";
import {
  MonitorPlay,
  Sliders,
  Pause,
  Play,
  RotateCcw,
  CheckCircle,
  Wifi,
  MousePointer2,
  Radio
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
  const [lastFrameTime, setLastFrameTime] = useState<number>(Date.now());
  const [fps, setFps] = useState<number>(20);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamSocketRef = useRef<WebSocket | null>(null);

  const sourceDevice = devices.find((d) => d.id === workload?.currentDeviceId);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname === "localhost" ? "localhost:3000" : window.location.host;
    const streamUrl = `${protocol}//${host}/ws/stream`;

    const ws = new WebSocket(streamUrl);
    streamSocketRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === "STREAM_FRAME" && parsed.data?.frameData) {
          const img = new Image();
          img.onload = () => {
            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                setLastFrameTime(Date.now());
              }
            }
          };
          img.src = parsed.data.frameData;
        }
      } catch (e) {
        // ignore
      }
    };

    return () => {
      ws.close();
    };
  }, []);

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
        setCommandFeedback(`Command "${action}" relayed to host successfully.`);
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
              Active LAN Fallback
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            When state migration is infeasible or locked to source host, Teleport streams live visual frames and proxies user input over WebSockets.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Stream: 20 FPS WebP</span>
          </div>
          <span>|</span>
          <div className="flex items-center gap-1">
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
            <span>LAN RTT: {sourceDevice?.rttMs || 12}ms</span>
          </div>
        </div>
      </div>

      {/* REMOTE STREAM DISPLAY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden border-2 border-slate-800 bg-black shadow-2xl flex flex-col justify-between aspect-video p-4">
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Host: {sourceDevice?.name || "Laptop A (Host)"}</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Epoch #{workload?.epoch} · Step #{workload?.step.toLocaleString()}
            </span>
          </div>

          {/* REAL CANVAS VIDEO STREAM */}
          <canvas
            ref={canvasRef}
            width={640}
            height={360}
            className="w-full h-full object-contain rounded-lg border border-slate-800/80 my-auto"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-2 z-10 font-mono">
            <span className="flex items-center gap-1 text-cyan-400">
              <MousePointer2 className="w-3.5 h-3.5" />
              Bidirectional Command Forwarding Active
            </span>
            <span>Channel: /ws/stream</span>
          </div>
        </div>

        {/* INTERACTIVE REMOTE CONTROL PANEL */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sliders className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Remote Command Dispatcher
              </h4>
            </div>

            {/* STATUS DISPLAY */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Active Workload:</span>
                <span className="text-white font-bold">{workload?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Execution Status:</span>
                <span className={workload?.status === "RUNNING" ? "text-emerald-400" : "text-amber-400"}>
                  {workload?.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Progress:</span>
                <span className="text-cyan-400">{workload?.metrics.progressPercent}%</span>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleCommand(workload?.status === "RUNNING" ? "PAUSE" : "RESUME")}
                className="py-2.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                {workload?.status === "RUNNING" ? (
                  <>
                    <Pause className="w-3.5 h-3.5" /> Pause Host
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-400" /> Resume Host
                  </>
                )}
              </button>

              <button
                onClick={() => handleCommand("RESET")}
                className="py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Step
              </button>
            </div>

            {commandFeedback && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-300 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{commandFeedback}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
