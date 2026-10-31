import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Gauge,
  Clock,
  ShieldCheck,
  Cpu,
  Wifi,
  HardDrive
} from "lucide-react";
import { Device, WorkloadState, FeasibilityResult } from "../types/teleport";

interface FeasibilityMatrixProps {
  devices: Device[];
  workload: WorkloadState | null;
  selectedTargetId?: string;
  onSelectTarget: (id: string) => void;
}

export const FeasibilityMatrix: React.FC<FeasibilityMatrixProps> = ({
  devices,
  workload,
  selectedTargetId,
  onSelectTarget
}) => {
  const [evaluation, setEvaluation] = useState<FeasibilityResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [aiAudit, setAiAudit] = useState<{ explanation: string; modelUsed: string } | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);

  const sourceDevice = devices.find((d) => d.id === workload?.currentDeviceId);
  const targetDevice = devices.find((d) => d.id === selectedTargetId);

  // Evaluate feasibility whenever source, target, or workload changes
  useEffect(() => {
    if (!sourceDevice || !targetDevice || !workload) {
      setEvaluation(null);
      setAiAudit(null);
      return;
    }

    setIsLoading(true);
    fetch("/api/teleport/evaluate-feasibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceDeviceId: sourceDevice.id,
        targetDeviceId: targetDevice.id,
        workloadId: workload.id
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.result) {
          setEvaluation(data.result);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [sourceDevice?.id, targetDevice?.id, workload?.id, sourceDevice?.batteryLevel, targetDevice?.freeMemoryMB]);

  const handleRequestAiAudit = () => {
    if (!sourceDevice || !targetDevice || !workload) return;
    setIsAuditing(true);
    fetch("/api/teleport/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceDeviceId: sourceDevice.id,
        targetDeviceId: targetDevice.id,
        workloadId: workload.id
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.audit) {
          setAiAudit(data.audit);
        }
      })
      .catch(() => {})
      .finally(() => setIsAuditing(false));
  };

  return (
    <div className="vantage-panel p-6 space-y-6 ticks">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule pb-4">
        <div>
          <h2 className="text-sm font-display font-medium text-ink flex items-center gap-2">
            <Gauge className="w-4 h-4 text-signal" />
            <span>Deterministic feasibility engine & physics model</span>
          </h2>
          <p className="text-xs text-ink-muted mt-1">
            Evaluates hard hardware gates (G_total) and continuous safety margin (S_feasibility) with Time-to-Exhaustion physics
          </p>
        </div>

        {/* TARGET SELECTOR DROPDOWN */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-ink-muted">target node:</label>
          <select
            value={selectedTargetId || ""}
            onChange={(e) => onSelectTarget(e.target.value)}
            className="bg-surface-elevated border border-rule text-ink text-xs rounded px-3 py-1.5 focus:outline-none focus:border-signal font-mono"
          >
            <option value="" disabled>Select target device</option>
            {devices
              .filter((d) => d.id !== workload?.currentDeviceId)
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.os.toLowerCase()} / {d.arch})
                </option>
              ))}
          </select>
        </div>
      </div>

      {!evaluation ? (
        <div className="py-12 text-center text-ink-muted text-xs">
          Select a target device above to evaluate mathematical migration feasibility.
        </div>
      ) : (
        <div className="space-y-6">
          {/* TOP SUMMARY ROW: DECISION BANNER & SCORE */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
            <div
              className={`md:col-span-2 rounded p-4 border flex items-center gap-3.5 ${
                evaluation.decision === "MIGRATE"
                  ? "bg-signal-dim border-signal text-ink"
                  : evaluation.decision === "REMOTE_FALLBACK"
                  ? "bg-warn-dim border-warn-border text-ink"
                  : "bg-surface-elevated border-rule text-ink"
              }`}
            >
              {evaluation.decision === "MIGRATE" ? (
                <CheckCircle2 className="w-7 h-7 text-signal shrink-0" />
              ) : (
                <AlertTriangle className="w-7 h-7 text-warn shrink-0" />
              )}
              <div>
                <span className="text-[10px] text-ink-muted font-mono block">
                  engine recommendation
                </span>
                <h3 className="text-base font-display font-medium text-ink">
                  {evaluation.decision === "MIGRATE"
                    ? "Safe for live migration"
                    : evaluation.decision === "REMOTE_FALLBACK"
                    ? "Remote access fallback engaged"
                    : "Preserve local execution"}
                </h3>
                <p className="text-xs text-ink-muted mt-0.5 line-clamp-1">
                  {evaluation.reasons[0]}
                </p>
              </div>
            </div>

            {/* FEASIBILITY SCORE GAUGE */}
            <div className="rounded p-4 bg-surface border border-rule flex flex-col justify-between">
              <span className="text-xs text-ink-muted">Continuous score</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-mono font-bold text-signal teleport-num">
                  {evaluation.score}
                </span>
                <span className="text-xs text-ink-faint">/ 100</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-bedrock overflow-hidden border border-rule mt-2">
                <div
                  className={`h-full ${
                    evaluation.score >= 60 ? "bg-signal" : "bg-warn"
                  }`}
                  style={{ width: `${evaluation.score}%` }}
                />
              </div>
            </div>

            {/* SAFETY MARGIN (TTE / TTM) */}
            <div className="rounded p-4 bg-surface border border-rule flex flex-col justify-between">
              <span className="text-xs text-ink-muted">Physics safety ratio</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-mono font-bold text-signal teleport-num">
                  {evaluation.safetyMarginRatio}x
                </span>
                <span className="text-[10px] text-ink-muted font-mono">
                  (tte {evaluation.tteSeconds}s / ttm {evaluation.ttmSeconds}s)
                </span>
              </div>
              <span className="text-[10px] text-ink-faint">
                est. downtime: ~{evaluation.estimatedInterruptionMs}ms
              </span>
            </div>
          </div>

          {/* 5 HARD COMPATIBILITY GATES */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-display font-medium text-ink">
              Stage 1: Hard compatibility gates (G_total)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
              {[
                {
                  label: "1. Workload type",
                  sub: "Checkpointable state",
                  pass: evaluation.gates.workloadTypeGate,
                  icon: <Cpu className="w-4 h-4" />
                },
                {
                  label: "2. ISA match",
                  sub: "x86_64 vs ARM64",
                  pass: evaluation.gates.isaCompatGate,
                  icon: <ShieldCheck className="w-4 h-4" />
                },
                {
                  label: "3. Runtime engine",
                  sub: "Wasm / container",
                  pass: evaluation.gates.runtimeCompatGate,
                  icon: <CheckCircle2 className="w-4 h-4" />
                },
                {
                  label: "4. RAM headroom",
                  sub: "125% footprint",
                  pass: evaluation.gates.ramHeadroomGate,
                  icon: <HardDrive className="w-4 h-4" />
                },
                {
                  label: "5. Network latency",
                  sub: "RTT < 800ms",
                  pass: evaluation.gates.networkAliveGate,
                  icon: <Wifi className="w-4 h-4" />
                }
              ].map((gate, i) => (
                <div
                  key={i}
                  className={`p-3 rounded border flex items-center justify-between ${
                    gate.pass
                      ? "bg-surface border-signal-border text-ink"
                      : "bg-danger-dim border-danger-border text-danger"
                  }`}
                >
                  <div>
                    <h5 className="text-xs font-medium text-ink">{gate.label}</h5>
                    <p className="text-[10px] text-ink-muted mt-0.5">{gate.sub}</p>
                  </div>
                  {gate.pass ? (
                    <CheckCircle2 className="w-4 h-4 text-signal shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-danger shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* AI EXPLAINABILITY AUDIT PANEL */}
          <div className="rounded border border-rule-strong bg-surface-elevated p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-signal" />
                <h4 className="text-xs font-display font-medium text-ink">
                  AI causal audit & explainability engine
                </h4>
                {aiAudit && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-rule text-signal">
                    {aiAudit.modelUsed}
                  </span>
                )}
              </div>
              <button
                onClick={handleRequestAiAudit}
                disabled={isAuditing}
                className="vantage-btn-primary py-1 px-3 text-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAuditing ? "Auditing..." : "Generate causal audit"}</span>
              </button>
            </div>

            <p className="text-xs text-ink-muted leading-relaxed font-sans">
              {aiAudit
                ? aiAudit.explanation
                : "Click 'Generate causal audit' to produce an exact analysis breaking down the physical constraints, architectural incompatibilities, and safety equations behind this decision."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
