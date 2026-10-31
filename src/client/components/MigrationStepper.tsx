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

const STAGES: { id: MigrationStage; label: string; description: string }[] = [
  { id: "CHECKPOINT_CREATED", label: "1. State Serialized", description: "Registers & memory frozen" },
  { id: "AES_ENCRYPTED", label: "2. AES-256 Encrypted", description: "SHA-256 integrity digest signed" },
  { id: "SOURCE_FENCED", label: "3. Source Fenced", description: "Epoch lease revoked" },
  { id: "TRANSFERRING", label: "4. Network Transfer", description: "Transmitting payload" },
  { id: "INTEGRITY_VERIFIED", label: "5. Verified & Decrypted", description: "Checksum & tag match" },
  { id: "TARGET_RESTORED", label: "6. Target Active", description: "Epoch granted at step k+1" }
];

export const MigrationStepper: React.FC<MigrationStepperProps> = ({ migrationEvent }) => {
  if (!migrationEvent || migrationEvent.stage === "IDLE") return null;

  const isFailed = migrationEvent.stage === "FAILED_ROLLBACK";
  const currentIndex = STAGES.findIndex((s) => s.id === migrationEvent.stage);

  return (
    <div className="teleport-panel p-5 space-y-4 border-indigo-500/40 bg-slate-900/90 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          {isFailed ? (
            <AlertOctagon className="w-5 h-5 text-rose-400 animate-bounce" />
          ) : (
            <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
          )}
          <h3 className="text-sm font-bold text-white tracking-tight">
            {isFailed
              ? "Migration Fault Detected · Instant Rollback Executed"
              : "6-Stage Live Workload Migration Pipeline"}
          </h3>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Freeze Downtime: {migrationEvent.interruptionMs}ms</span>
          </div>
          <span className="text-slate-400">|</span>
          <span className="text-indigo-400">
            Epoch #{migrationEvent.fromEpoch} → #{migrationEvent.toEpoch}
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
              className={`p-3 rounded-xl border transition-all ${
                isCurrent
                  ? "bg-indigo-600/20 border-indigo-400 shadow-md shadow-indigo-500/20"
                  : isPassed
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-slate-900/40 border-slate-800/80 text-slate-500"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase font-bold">
                  {idx + 1} / 6
                </span>
                {isPassed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : isCurrent ? (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                )}
              </div>
              <h4 className="text-xs font-bold text-white truncate">{stage.label}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{stage.description}</p>
            </div>
          );
        })}
      </div>

      {/* PROGRESS BAR */}
      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            isFailed
              ? "bg-rose-500"
              : migrationEvent.stage === "TARGET_RESTORED"
              ? "bg-emerald-400"
              : "bg-gradient-to-r from-indigo-500 to-cyan-400"
          }`}
          style={{ width: `${migrationEvent.progressPercent}%` }}
        />
      </div>

      {/* ROLLBACK ALERT BANNER */}
      {isFailed && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
          <RotateCcw className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-rose-300">
              Continuity Preserved: Instant Rollback to Source Completed
            </p>
            <p className="text-slate-300 mt-0.5 font-mono text-[11px]">
              {migrationEvent.error || "Integrity verification failure. Source re-authorized under original epoch."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

