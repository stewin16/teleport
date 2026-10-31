import React from "react";
import {
  Laptop,
  Smartphone,
  Server,
  Battery,
  BatteryCharging,
  Wifi,
  Cpu,
  Layers,
  ShieldCheck,
  Radio
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
  const physicalNodes = devices.filter((d) => d.isPhysical);
  const virtualNodes = devices.filter((d) => !d.isPhysical);

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

  const renderCard = (device: Device) => {
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
            ? "bg-slate-900/90 border-2 border-indigo-500 shadow-lg shadow-indigo-500/20"
            : isTarget
            ? "bg-slate-900/90 border-2 border-cyan-400 shadow-lg shadow-cyan-400/20"
            : "bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800 hover:border-slate-700"
        }`}
      >
        {/* STATUS BADGES */}
        <div className="absolute -top-2.5 right-3 flex items-center gap-1.5">
          {device.isPhysical && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold tracking-wider uppercase shadow-sm">
              Physical Live
            </span>
          )}
          {isSource ? (
            <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-bold tracking-wider uppercase shadow-sm">
              Active Host
            </span>
          ) : isTarget ? (
            <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[9px] font-bold tracking-wider uppercase shadow-sm">
              Target
            </span>
          ) : null}
        </div>

        {/* CARD HEADER */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60">
              {getDeviceIcon(device.os)}
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-tight leading-tight line-clamp-1">
                {device.name}
              </h4>
              <p className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">
                {device.os} · {device.arch} {device.hostname ? `· ${device.hostname}` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1 text-[10px]">
                <Cpu className="w-3 h-3 text-indigo-400" /> RAM
              </span>
              <span>{memoryUsagePercent}%</span>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  memoryUsagePercent > 80 ? "bg-rose-500" : "bg-indigo-500"
                }`}
                style={{ width: `${memoryUsagePercent}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500 text-right">
              {device.freeMemoryMB.toLocaleString()} MB free
            </div>
          </div>

          <div
            className={`p-2 rounded-lg border space-y-1 ${getBatteryColor(
              device.batteryLevel,
              device.isCharging
            )}`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-[10px]">
                {device.isCharging ? (
                  <BatteryCharging className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Battery className="w-3 h-3" />
                )}
                Power
              </span>
              <span className="font-bold">{device.batteryLevel}%</span>
            </div>
            <div className="w-full h-1 bg-black/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-current"
                style={{ width: `${device.batteryLevel}%` }}
              />
            </div>
            <div className="text-[10px] opacity-80 text-right">
              {device.isCharging ? "AC Charging" : `-${device.dischargeRate}%/hr`}
            </div>
          </div>
        </div>

        {/* FOOTER STATS */}
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-1">
            <Wifi className="w-3 h-3 text-cyan-400" />
            <span>RTT: {device.rttMs}ms</span>
          </div>
          <div>
            <span>BW: {device.bandwidthMbps} Mbps</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: PHYSICAL NODES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h2 className="text-xs font-bold tracking-tight text-white uppercase">
              Live Connected Physical Laptops ({physicalNodes.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            Real hardware telemetry sampled from Windows OS
          </span>
        </div>

        {physicalNodes.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-2">
            <Laptop className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-xs text-slate-300 font-bold">No Secondary Laptop Connected Yet</div>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Run <code className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">npm run agent -- --coordinator=http://&lt;laptop-a-ip&gt;:3000</code> in a terminal on Laptop B to join this fleet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {physicalNodes.map(renderCard)}
          </div>
        )}
      </div>

      {/* SECTION 2: SCENARIO / SIMULATED NODES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold tracking-tight text-slate-400 uppercase">
              Hardware Scenario Simulation Nodes ({virtualNodes.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Used to test cross-architecture and edge-case feasibility gates
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {virtualNodes.map(renderCard)}
        </div>
      </div>
    </div>
  );
};
