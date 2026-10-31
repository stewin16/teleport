import React, { useState } from "react";
import {
  Flame,
  BatteryLow,
  Cpu,
  WifiOff,
  ShieldAlert,
  RotateCcw,
  Zap,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { Device, WorkloadState } from "../types/teleport";

interface ChaosLabProps {
  devices: Device[];
  workload: WorkloadState | null;
  onTriggerMigrateWithFault: (fault: { corruptChecksum?: boolean; networkDrop?: boolean }) => void;
  onRefreshDevices: () => void;
}

export const ChaosLab: React.FC<ChaosLabProps> = ({
  devices,
  workload,
  onTriggerMigrateWithFault,
  onRefreshDevices
}) => {
  const [feedback, setFeedback] = useState<string | null>(null);

  const sourceDevice = devices.find((d) => d.id === workload?.currentDeviceId);

  const applyDeviceChaos = (deviceId: string, chaos: any, message: string) => {
    fetch("/api/teleport/devices/chaos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, ...chaos })
    })
      .then((res) => res.json())
      .then(() => {
        setFeedback(message);
        onRefreshDevices();
        setTimeout(() => setFeedback(null), 4000);
      });
  };

  return (
    <div className="teleport-panel p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Chaos Engineering & Fault Injection Lab
            </h2>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
              Live Stress Testing
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate extreme physical battery depletion, CPU throttling, network severance, and cryptographic corruption to observe real-time Feasibility Engine responses.
          </p>
        </div>

        {sourceDevice && (
          <div className="text-xs font-mono text-slate-400">
            Current Target Source: <span className="text-indigo-400 font-bold">{sourceDevice.name}</span>
          </div>
        )}
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300 font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* CHAOS ACTION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* FAULT 1: BATTERY DRAIN */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <BatteryLow className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Critical Battery Drain</h4>
              <p className="text-[10px] text-slate-400">Set source battery to 8% @ 35%/hr drain</p>
            </div>
          </div>
          <p className="text-xs text-slate-300">
            Forces Time-to-Exhaustion (TTE) into critical danger zone (Safety Margin &lt; 1.0x), triggering immediate evacuation.
          </p>
          <button
            onClick={() =>
              sourceDevice &&
              applyDeviceChaos(
                sourceDevice.id,
                { batteryLevel: 8, dischargeRate: 35, isCharging: false },
                `Injected Critical Battery (8%) on ${sourceDevice.name}`
              )
            }
            className="w-full py-1.5 px-3 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 text-xs font-medium transition-all"
          >
            ⚡ Drain Battery to 8%
          </button>
        </div>

        {/* FAULT 2: CPU SPIKE */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Resource Pressure Spike</h4>
              <p className="text-[10px] text-slate-400">Starve free memory to 45 MB</p>
            </div>
          </div>
          <p className="text-xs text-slate-300">
            Violates RAM Headroom Gate 4, forcing the Feasibility Engine to reject live migration and switch to Remote Fallback.
          </p>
          <button
            onClick={() =>
              sourceDevice &&
              applyDeviceChaos(
                sourceDevice.id,
                { freeMemoryMB: 45 },
                `Starved free RAM (45 MB) on ${sourceDevice.name}`
              )
            }
            className="w-full py-1.5 px-3 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 text-xs font-medium transition-all"
          >
            🔥 Starve RAM Headroom
          </button>
        </div>

        {/* FAULT 3: NETWORK THROTTLE */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <WifiOff className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Severed Bandwidth & Jitter</h4>
              <p className="text-[10px] text-slate-400">Throttle to 250 Kbps · 450ms RTT</p>
            </div>
          </div>
          <p className="text-xs text-slate-300">
            Elevates Time-to-Migrate (TTM) transfer duration, causing safety margin collapse.
          </p>
          <button
            onClick={() =>
              sourceDevice &&
              applyDeviceChaos(
                sourceDevice.id,
                { bandwidthMbps: 0.25, rttMs: 450 },
                `Severed bandwidth (250 Kbps, 450ms ping) on ${sourceDevice.name}`
              )
            }
            className="w-full py-1.5 px-3 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 text-xs font-medium transition-all"
          >
            🌐 Throttle Network (250 Kbps)
          </button>
        </div>

        {/* FAULT 4: CORRUPTED SHA-256 CHECKSUM ROLLBACK */}
        <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/30 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Corrupt SHA-256 Digest</h4>
              <p className="text-[10px] text-slate-400">Simulate bit-flip in transit</p>
            </div>
          </div>
          <p className="text-xs text-slate-300">
            Triggers security rejection on target node and verifies instantaneous (&lt; 35ms) unfence rollback on source node.
          </p>
          <button
            onClick={() => onTriggerMigrateWithFault({ corruptChecksum: true })}
            className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all"
          >
            💥 Corrupt Digest & Test Rollback
          </button>
        </div>

        {/* FAULT 5: MID-TRANSFER NETWORK DROP */}
        <div className="p-4 rounded-xl bg-slate-900 border border-rose-500/30 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Mid-Transfer Network Drop</h4>
              <p className="text-[10px] text-slate-400">Simulate link failure at stage 4</p>
            </div>
          </div>
          <p className="text-xs text-slate-300">
            Verifies the Continuity Manager aborts target restore and resumes execution on source with zero data loss.
          </p>
          <button
            onClick={() => onTriggerMigrateWithFault({ networkDrop: true })}
            className="w-full py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-all"
          >
            🔌 Sever Link Mid-Transfer
          </button>
        </div>

        {/* FAULT 6: FLEET RESTORE */}
        <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Reset Fleet to Nominal</h4>
              <p className="text-[10px] text-slate-400">Restore all nodes to baseline</p>
            </div>
          </div>
          <p className="text-xs text-slate-300">
            Re-sets all device batteries, RAM headroom, and network parameters to nominal healthy state.
          </p>
          <button
            onClick={() => {
              for (const d of devices) {
                applyDeviceChaos(
                  d.id,
                  {
                    batteryLevel: 90,
                    dischargeRate: 10,
                    isCharging: true,
                    freeMemoryMB: 8192,
                    bandwidthMbps: 150,
                    rttMs: 14
                  },
                  "Reset fleet to nominal operating metrics."
                );
              }
            }}
            className="w-full py-1.5 px-3 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/30 text-xs font-medium transition-all"
          >
            🔄 Reset Fleet to Nominal
          </button>
        </div>

      </div>
    </div>
  );
};
