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
  AlertTriangle,
  Radio,
  FileWarning
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
    <div className="vantage-panel p-6 space-y-6 ticks">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-danger" />
            <h2 className="text-sm font-display font-medium text-ink">
              Chaos engineering & fault injection laboratory
            </h2>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Simulate extreme physical battery depletion, CPU throttling, network severance, and cryptographic corruption to evaluate resilience
          </p>
        </div>

        {sourceDevice && (
          <div className="text-xs font-mono text-ink-muted">
            Target Source: <span className="text-signal font-semibold">{sourceDevice.name}</span>
          </div>
        )}
      </div>

      {feedback && (
        <div className="p-3 rounded bg-signal-dim border border-signal-border text-xs text-ink font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-signal shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* CHAOS ACTION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        
        {/* FAULT 1: BATTERY DRAIN */}
        <div className="p-4 rounded bg-surface border border-rule space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-surface-elevated text-danger border border-rule">
              <BatteryLow className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-medium text-ink">Critical battery collapse</h4>
              <p className="text-[10px] text-ink-muted">Deplete source node to 8% at 35%/hr</p>
            </div>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            Forces Time-to-Exhaustion (TTE) into critical danger zone (Safety Margin &lt; 1.0x), triggering immediate evacuation protocol.
          </p>
          <button
            onClick={() =>
              sourceDevice &&
              applyDeviceChaos(
                sourceDevice.id,
                { batteryLevel: 8, dischargeRate: 35, isCharging: false },
                `Injected critical battery (8%) on ${sourceDevice.name}`
              )
            }
            className="w-full vantage-btn-secondary py-1.5 px-3 text-xs text-danger hover:border-danger"
          >
            <BatteryLow className="w-3.5 h-3.5" />
            <span>Drain battery to 8%</span>
          </button>
        </div>

        {/* FAULT 2: CPU SPIKE */}
        <div className="p-4 rounded bg-surface border border-rule space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-surface-elevated text-warn border border-rule">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-medium text-ink">Resource contention spike</h4>
              <p className="text-[10px] text-ink-muted">Starve free memory to 45 MB</p>
            </div>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            Violates RAM Headroom Gate 4 (125% rule), forcing the Feasibility Engine to reject live migration and switch to Remote Fallback.
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
            className="w-full vantage-btn-secondary py-1.5 px-3 text-xs text-warn hover:border-warn"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Starve RAM headroom</span>
          </button>
        </div>

        {/* FAULT 3: NETWORK THROTTLE */}
        <div className="p-4 rounded bg-surface border border-rule space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-surface-elevated text-telemetry border border-rule">
              <WifiOff className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-medium text-ink">Severed bandwidth & jitter</h4>
              <p className="text-[10px] text-ink-muted">Throttle to 250 Kbps, 450ms RTT</p>
            </div>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            Elevates Time-to-Migrate (TTM) transfer duration, causing safety margin collapse and physics rejection.
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
            className="w-full vantage-btn-secondary py-1.5 px-3 text-xs text-telemetry hover:border-telemetry"
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span>Throttle link (250 Kbps)</span>
          </button>
        </div>

        {/* FAULT 4: CORRUPTED SHA-256 CHECKSUM ROLLBACK */}
        <div className="p-4 rounded bg-surface border border-rule space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-surface-elevated text-signal border border-rule">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-medium text-ink">Digest corruption injection</h4>
              <p className="text-[10px] text-ink-muted">Simulate in-transit bit-flip</p>
            </div>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            Triggers cryptographic MAC rejection on target node and verifies instantaneous (&lt; 35ms) lease restoration on source.
          </p>
          <button
            onClick={() => onTriggerMigrateWithFault({ corruptChecksum: true })}
            className="w-full vantage-btn-secondary py-1.5 px-3 text-xs hover:border-signal"
          >
            <FileWarning className="w-3.5 h-3.5" />
            <span>Corrupt digest & test rollback</span>
          </button>
        </div>

        {/* FAULT 5: MID-TRANSFER NETWORK DROP */}
        <div className="p-4 rounded bg-surface border border-rule space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-surface-elevated text-danger border border-rule">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-medium text-ink">Mid-flight network severance</h4>
              <p className="text-[10px] text-ink-muted">Drop TCP connection at stage 4</p>
            </div>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            Verifies the Continuity Manager safely aborts target restoration and seamlessly resumes execution on source.
          </p>
          <button
            onClick={() => onTriggerMigrateWithFault({ networkDrop: true })}
            className="w-full vantage-btn-secondary py-1.5 px-3 text-xs text-danger hover:border-danger"
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span>Sever link mid-transfer</span>
          </button>
        </div>

        {/* FAULT 6: FLEET RESTORE */}
        <div className="p-4 rounded bg-surface border border-rule space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-surface-elevated text-signal border border-rule">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-medium text-ink">Reset fleet parameters</h4>
              <p className="text-[10px] text-ink-muted">Restore all nodes to baseline</p>
            </div>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            Resets all device batteries, RAM headroom, and network parameters to nominal healthy operational metrics.
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
            className="w-full vantage-btn-primary py-1.5 px-3 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset fleet to nominal</span>
          </button>
        </div>

      </div>
    </div>
  );
};
