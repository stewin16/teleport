import React from "react";
import {
  Laptop,
  Smartphone,
  Server,
  Battery,
  BatteryCharging,
  BatteryWarning,
  Wifi,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRightCircle
} from "lucide-react";
import { Device, WorkloadState } from "../types/teleport";

interface DeviceFleetGridProps {
  devices: Device[];
  workload: WorkloadState | null;
  onSelectTarget: (targetDeviceId: string) => void;
  selectedTargetId?: string;
}

export const DeviceFleetGrid: React.FC<DeviceFleetGridProps> = ({
  devices,
  workload,
  onSelectTarget,
  selectedTargetId
}) => {
  const getDeviceIcon = (os: string) => {
    switch (os) {
      case "macos":
      case "windows":
      case "linux":
        return <Laptop className="w-5 h-5 text-indigo-400" />;
      case "ios":
      case "android":
        return <Smartphone className="w-5 h-5 text-cyan-400" />;
      default:
        return <Server className="w-5 h-5 text-slate-400" />;
    }
  };

  const getBatteryColor = (level: number, charging: boolean) => {
    if (charging) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (level <= 15) return "text-rose-400 border-rose-500/30 bg-rose-500/10 animate-pulse";
    if (level <= 35) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold tracking-tight text-white uppercase">
            Registered Multi-Device Fleet ({devices.length} Nodes)
          </h2>
        </div>
        <span className="text-xs text-slate-400">
          Click any target node to evaluate live migration
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {devices.map((device) => {
          const isSource = workload?.currentDeviceId === device.id;
          const isTarget = selectedTargetId === device.id;

          const memoryUsagePercent = Math.round(
            ((device.totalMemoryMB - device.freeMemoryMB) / device.totalMemoryMB) * 100
          );

          return (
            <div
              key={device.id}
              onClick={() => !isSource && onSelectTarget(device.id)}
              className={`relative rounded-xl p-4 transition-all cursor-pointer ${
                isSource
                  ? "bg-slate-900/90 border-2 border-indigo-500 shadow-lg shadow-indigo-500/10"
                  : isTarget
                  ? "bg-slate-900/90 border-2 border-cyan-400 shadow-lg shadow-cyan-400/10"
                  : "bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800 hover:border-slate-700"
              }`}
            >
              {/* STATUS RIBBON */}
              {isSource ? (
                <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-[10px] font-bold tracking-wider uppercase shadow-sm">
                  Active Host (Epoch #{workload?.epoch})
                </div>
              ) : isTarget ? (
                <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-bold tracking-wider uppercase shadow-sm">
                  Selected Target
                </div>
              ) : null}

              {/* CARD HEADER */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                    {getDeviceIcon(device.os)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-tight line-clamp-1">
                      {device.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 uppercase">
                        {device.os}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 font-bold uppercase">
                        {device.arch}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* METRICS GRID */}
              <div className="space-y-2.5 text-xs">
                {/* BATTERY TELEMETRY */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-400 flex items-center gap-1">
                      {device.isCharging ? (
                        <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                      ) : device.batteryLevel <= 15 ? (
                        <BatteryWarning className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <Battery className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      Battery
                    </span>
                    <span className="font-mono text-slate-200">
                      {device.batteryLevel}% {device.isCharging && "(Charging)"}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        device.batteryLevel <= 15
                          ? "bg-rose-500"
                          : device.batteryLevel <= 35
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${device.batteryLevel}%` }}
                    />
                  </div>
                  {!device.isCharging && device.dischargeRate > 0 && (
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      Drain: ~{device.dischargeRate}% / hr
                    </p>
                  )}
                </div>

                {/* MEMORY HEADROOM */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-slate-400" />
                      Memory Headroom
                    </span>
                    <span className="font-mono text-slate-200">
                      {device.freeMemoryMB} MB free
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-500"
                      style={{ width: `${100 - memoryUsagePercent}%` }}
                    />
                  </div>
                </div>

                {/* NETWORK LATENCY & CORES */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <Wifi className="w-3 h-3 text-cyan-400" />
                    <span className="font-mono text-slate-300">{device.rttMs}ms RTT</span>
                  </div>
                  <span className="font-mono text-slate-400">
                    {device.cores} vCPUs · {device.bandwidthMbps} Mbps
                  </span>
                </div>
              </div>

              {/* CARD FOOTER ACTION */}
              {!isSource && (
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-indigo-400 font-medium">
                    {isTarget ? "Ready for Teleport" : "Set as Target"}
                  </span>
                  <ArrowRightCircle className={`w-4 h-4 ${isTarget ? "text-cyan-400" : "text-slate-500"}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

