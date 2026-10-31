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
    <div className="teleport-panel p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Gauge className="w-5 h-5 text-indigo-400" />
            Deterministic Feasibility Engine & Physics Model
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Evaluates hard hardware gates (G_total) and continuous utility (S_feasibility) with Time-to-Exhaustion physics
          </p>
        </div>

        {/* TARGET SELECTOR DROPDOWN */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Target Node:</label>
          <select
            value={selectedTargetId || ""}
            onChange={(e) => onSelectTarget(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 font-mono"
          >
            <option value="" disabled>Select Target Device</option>
            {devices
              .filter((d) => d.id !== workload?.currentDeviceId)
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.os.toUpperCase()} · {d.arch})
                </option>
              ))}
          </select>
        </div>
      </div>

      {!evaluation ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          Please select a target device to evaluate mathematical migration feasibility.
        </div>
      ) : (
        <div className="space-y-6">
          {/* TOP SUMMARY ROW: DECISION BANNER & SCORE */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div
              className={`md:col-span-2 rounded-xl p-4 border flex items-center gap-4 ${
                evaluation.decision === "MIGRATE"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : evaluation.decision === "REMOTE_FALLBACK"
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  : "bg-slate-800/60 border-slate-700 text-slate-300"
              }`}
            >
              {evaluation.decision === "MIGRATE" ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-amber-400 shrink-0" />
              )}
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                  Engine Recommendation
                </span>
                <h3 className="text-lg font-bold tracking-tight text-white">
                  {evaluation.decision === "MIGRATE"
                    ? "Safe for Live Migration"
                    : evaluation.decision === "REMOTE_FALLBACK"
                    ? "Remote Access Fallback Engaged"
                    : "Keep Local on Source"}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
                  {evaluation.reasons[0]}
                </p>
              </div>
            </div>

            {/* FEASIBILITY SCORE GAUGE */}
            <div className="rounded-xl p-4 bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <span className="text-xs text-slate-400">Continuous Feasibility</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-cyan-400">
                  {evaluation.score}
                </span>
                <span className="text-xs text-slate-400">/ 100</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mt-2">
                <div
                  className={`h-full ${
                    evaluation.score >= 60 ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                  style={{ width: `${evaluation.score}%` }}
                />
              </div>
            </div>

            {/* SAFETY MARGIN (TTE / TTM) */}
            <div className="rounded-xl p-4 bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <span className="text-xs text-slate-400">Physics Safety Ratio</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-indigo-400">
                  {evaluation.safetyMarginRatio}x
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  (TTE {evaluation.tteSeconds}s / TTM {evaluation.ttmSeconds}s)
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                Est. Downtime: ~{evaluation.estimatedInterruptionMs}ms
              </span>
            </div>
          </div>

          {/* 5 HARD COMPATIBILITY GATES */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Stage 1: Hard Compatibility Gates (G_total)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {[
                {
                  label: "1. Workload Type",
                  sub: "Is Checkpointable",
                  pass: evaluation.gates.workloadTypeGate,
                  icon: <Cpu className="w-4 h-4" />
                },
                {
                  label: "2. ISA Compatibility",
                  sub: "x86_64 vs ARM64",
                  pass: evaluation.gates.isaCompatGate,
                  icon: <ShieldCheck className="w-4 h-4" />
                },
                {
                  label: "3. Runtime Engine",
                  sub: "Wasm / Node / Container",
                  pass: evaluation.gates.runtimeCompatGate,
                  icon: <CheckCircle2 className="w-4 h-4" />
                },
                {
                  label: "4. RAM Headroom",
                  sub: "125% of Footprint",
                  pass: evaluation.gates.ramHeadroomGate,
                  icon: <HardDrive className="w-4 h-4" />
                },
                {
                  label: "5. Network Latency",
                  sub: "RTT < 800ms",
                  pass: evaluation.gates.networkAliveGate,
                  icon: <Wifi className="w-4 h-4" />
                }
              ].map((gate, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    gate.pass
                      ? "bg-slate-900/60 border-emerald-500/30 text-emerald-300"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  }`}
                >
                  <div>
                    <h5 className="text-xs font-bold text-white">{gate.label}</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">{gate.sub}</p>
                  </div>
                  {gate.pass ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* AI EXPLAINABILITY AUDIT PANEL */}
          <div className="rounded-xl border border-indigo-500/30 bg-slate-900/80 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white tracking-tight uppercase">
                  AI Causal Audit & Explainability Engine
                </h4>
                {aiAudit && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {aiAudit.modelUsed}
                  </span>
                )}
              </div>
              <button
                onClick={handleRequestAiAudit}
                disabled={isAuditing}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAuditing ? "Auditing..." : "Generate AI Causal Audit"}</span>
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {aiAudit
                ? aiAudit.explanation
                : "Click 'Generate AI Causal Audit' to produce a natural-language report breaking down the physical constraints, architectural incompatibilities, and safety equations behind this decision."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
