import React from "react";
import {
  CheckCircle2,
  Lock,
  Radio,
  FileCheck2,
  Zap,
  AlertOctagon,
  Clock,
  ShieldCheck,
  RotateCcw
} from "lucide-react";
import { MigrationEvent, MigrationStage } from "../types/teleport";

interface MigrationStepperProps {
  migrationEvent: MigrationEvent | null;
}

const STAGES: { id: MigrationStage; label: string; detail: string }[] = [
  { id: "CHECKPOINT_CREATED", label: "State serialized", detail: "Registers & memory frozen" },
  { id: "AES_ENCRYPTED", label: "AES-256 encrypted", detail: "SHA-256 digest signed" },
  { id: "SOURCE_FENCED", label: "Source fenced", detail: "Epoch lease revoked" },
  { id: "TRANSFERRING", label: "Network transfer", detail: "Transmitting delta payload" },
  { id: "INTEGRITY_VERIFIED", label: "Integrity verified", detail: "Checksum & tag match" },
  { id: "TARGET_RESTORED", label: "Target active", detail: "Epoch granted at step k+1" }
];

export const MigrationStepper: React.FC<MigrationStepperProps> = ({ migrationEvent }) => {
  if (!migrationEvent || migrationEvent.stage === "IDLE") return null;

  const isFailed = migrationEvent.stage === "FAILED_ROLLBACK";
  const currentIndex = STAGES.findIndex((s) => s.id === migrationEvent.stage);

  return (
    <div className="vantage-panel p-5 space-y-4 border-rule-strong bg-surface ticks shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rule pb-3">
        <div className="flex items-center gap-2.5">
          {isFailed ? (
            <AlertOctagon className="w-5 h-5 text-danger animate-bounce" />
          ) : (
            <Zap className="w-5 h-5 text-signal animate-signal-pulse" />
          )}
          <div>
            <h3 className="text-sm font-display font-medium text-ink">
              {isFailed
                ? "Migration fault detected — instant rollback executed"
                : "Six-stage live workload migration pipeline"}
            </h3>
            <p className="text-[11px] text-ink-muted">
              Atomic state handover with monotonic lease revocation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-ink-muted">
            <Clock className="w-3.5 h-3.5 text-signal" />
            <span>downtime:</span>
            <span className="text-ink font-semibold teleport-num">{migrationEvent.interruptionMs}ms</span>
          </div>
          <span className="text-rule-strong">/</span>
          <span className="text-signal font-mono">
            epoch #{migrationEvent.fromEpoch} → #{migrationEvent.toEpoch}
          </span>
        </div>
      </div>

      {/* 6-STAGE STEPPER ICONS & LABELS */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {STAGES.map((stage, idx) => {
          const isPassed = !isFailed && currentIndex >= idx;
          const isCurrent = !isFailed && migrationEvent.stage === stage.id;

          return (
            <div
              key={stage.id}
              className={`p-3 rounded border transition-colors ${
                isCurrent
                  ? "bg-signal-dim border-signal text-ink"
                  : isPassed
                  ? "bg-surface-elevated border-rule-strong text-ink"
                  : "bg-surface border-rule text-ink-faint"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono text-ink-faint">
                  0{idx + 1}
                </span>
                {isPassed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-signal" />
                ) : isCurrent ? (
                  <span className="w-2 h-2 rounded-full bg-signal animate-signal-pulse" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-rule-strong" />
                )}
              </div>
              <h4 className="text-xs font-medium text-ink truncate">{stage.label}</h4>
              <p className="text-[10px] text-ink-muted mt-0.5 line-clamp-1">{stage.detail}</p>
            </div>
          );
        })}
      </div>

      {/* PROGRESS TRACK */}
      <div className="w-full h-1.5 rounded-full bg-surface-elevated overflow-hidden border border-rule">
        <div
          className={`h-full transition-all duration-300 ${
            isFailed
              ? "bg-danger"
              : migrationEvent.stage === "TARGET_RESTORED"
              ? "bg-signal"
              : "bg-signal"
          }`}
          style={{ width: `${migrationEvent.progressPercent}%` }}
        />
      </div>

      {/* ROLLBACK ALERT BANNER */}
      {isFailed && (
        <div className="p-3 rounded bg-danger-dim border border-danger-border flex items-start gap-3">
          <RotateCcw className="w-4 h-4 text-danger shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-medium text-danger">
              Continuity preserved: instant rollback to source completed
            </p>
            <p className="text-ink-muted mt-0.5 font-mono text-[11px]">
              {migrationEvent.error || "Integrity verification failure. Source re-authorized under original epoch."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
