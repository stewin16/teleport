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
  AlertTriangle
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
        return <Laptop className="w-4 h-4 text-ink-muted" />;
      case "ios":
      case "android":
        return <Smartphone className="w-4 h-4 text-ink-muted" />;
      default:
        return <Server className="w-4 h-4 text-ink-muted" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-signal" />
          <h2 className="text-sm font-display font-medium text-ink">
            Registered fleet ({devices.length} nodes)
          </h2>
        </div>
        <span className="text-xs text-ink-muted">
          Select target node to compute physics feasibility
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
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
              className={`relative rounded p-4 transition-colors ${
                isSource
                  ? "bg-surface border border-signal-border ticks shadow-lg"
                  : isTarget
                  ? "bg-surface border border-signal cursor-pointer shadow-md"
                  : "bg-surface/80 hover:bg-surface border border-rule hover:border-rule-strong cursor-pointer"
              }`}
            >
              {/* STATUS INDICATOR */}
              {isSource ? (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded bg-signal-dim border border-signal-border text-signal text-[10px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal animate-signal-pulse" />
                  <span>active host</span>
                </div>
              ) : isTarget ? (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-elevated border border-rule-strong text-ink text-[10px] font-mono">
                  <span>selected target</span>
                </div>
              ) : null}

              {/* CARD HEADER */}
              <div className="flex items-start gap-2.5 mb-3">
                <div className="p-2 rounded bg-surface-elevated border border-rule">
                  {getDeviceIcon(device.os)}
                </div>
                <div>
                  <h3 className="text-xs font-display font-medium text-ink line-clamp-1 pr-16">
                    {device.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-elevated border border-rule text-ink-muted">
                      {device.os}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-elevated border border-rule text-signal font-semibold">
                      {device.arch}
                    </span>
                  </div>
                </div>
              </div>

              {/* TELEMETRY METRICS */}
              <div className="space-y-2 text-xs">
                {/* BATTERY TELEMETRY */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-ink-muted flex items-center gap-1">
                      {device.isCharging ? (
                        <BatteryCharging className="w-3.5 h-3.5 text-signal" />
                      ) : device.batteryLevel <= 15 ? (
                        <BatteryWarning className="w-3.5 h-3.5 text-danger animate-pulse" />
                      ) : (
                        <Battery className="w-3.5 h-3.5 text-ink-muted" />
                      )}
                      <span>battery</span>
                    </span>
                    <span className="font-mono text-ink teleport-num">
                      {device.batteryLevel}% {device.isCharging && "(charging)"}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-bedrock overflow-hidden border border-rule">
                    <div
                      className={`h-full transition-all duration-300 ${
                        device.isCharging
                          ? "bg-signal"
                          : device.batteryLevel <= 15
                          ? "bg-danger"
                          : device.batteryLevel <= 35
                          ? "bg-warn"
                          : "bg-signal"
                      }`}
                      style={{ width: `${device.batteryLevel}%` }}
                    />
                  </div>
                </div>

                {/* MEMORY HEADROOM */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-ink-muted flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-ink-muted" />
                      <span>memory</span>
                    </span>
                    <span className="font-mono text-ink teleport-num">
                      {device.freeMemoryMB} MB free
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-bedrock overflow-hidden border border-rule">
                    <div
                      className="h-full bg-telemetry transition-all duration-300"
                      style={{ width: `${memoryUsagePercent}%` }}
                    />
                  </div>
                </div>

                {/* PING & STATUS */}
                <div className="flex items-center justify-between pt-2 border-t border-rule text-[11px]">
                  <span className="text-ink-faint flex items-center gap-1 font-mono">
                    <Wifi className="w-3 h-3 text-signal" />
                    <span>{device.pingMs}ms rtt</span>
                  </span>
                  <span className="font-mono text-ink-muted">
                    {device.status.toLowerCase()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
