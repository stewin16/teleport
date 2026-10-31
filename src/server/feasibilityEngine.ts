import { Device, WorkloadState, FeasibilityResult, FeasibilityGates } from "./types.js";

export class FeasibilityEngine {
  /**
   * Evaluates migration feasibility from a source device to a candidate target device
   * using hard compatibility gates and a physics-based continuous utility score.
   */
  public evaluate(
    source: Device,
    target: Device,
    workload: WorkloadState
  ): FeasibilityResult {
    const reasons: string[] = [];

    // --- STAGE 1: HARD COMPATIBILITY GATES ---
    // 1. Workload Type Gate (Checkability)
    const workloadTypeGate = workload.tier !== "TIER_C_HARDWARE_LOCKED";
    if (!workloadTypeGate) {
      reasons.push(
        "Gate 1 Failed (Workload Bound): Workload is pinned to local GPU/Hardware context and cannot be checkpointed."
      );
    }

    // 2. ISA & OS Compatibility Gate
    let isaCompatGate = true;
    if (workload.tier === "TIER_A_PORTABLE") {
      // Wasm and deterministic execution frames run cross-architecture
      isaCompatGate = true;
    } else if (workload.tier === "TIER_B_CONTAINER") {
      // Native Linux CRIU containers require homogeneous ISA & OS
      if (source.arch !== target.arch || target.os !== "linux") {
        isaCompatGate = false;
        reasons.push(
          `Gate 2 Failed (ISA/OS Mismatch): Native Linux container (${source.arch}) cannot be restored on ${target.os} (${target.arch}) without binary emulation.`
        );
      }
    } else {
      isaCompatGate = false;
    }

    // 3. Runtime Compatibility Gate
    const runtimeCompatGate = target.status !== "FENCED";
    if (!runtimeCompatGate) {
      reasons.push("Gate 3 Failed (Target Fenced): Target node is currently in fenced state.");
    }

    // 4. Memory Headroom Gate (Requires 125% of workload footprint)
    const requiredMemoryMB = workload.memoryFootprintMB * 1.25;
    const ramHeadroomGate = target.freeMemoryMB >= requiredMemoryMB;
    if (!ramHeadroomGate) {
      reasons.push(
        `Gate 4 Failed (RAM Exhaustion): Target has ${target.freeMemoryMB} MB free RAM, but workload requires ${requiredMemoryMB.toFixed(0)} MB (including 25% safety buffer).`
      );
    }

    // 5. Network Viability Gate
    const isTargetAlive =
      target.status === "ONLINE" &&
      target.rttMs < 800 &&
      Date.now() - target.lastHeartbeat < 15000;
    const networkAliveGate = isTargetAlive;
    if (!networkAliveGate) {
      reasons.push(
        `Gate 5 Failed (Network Unreachable): Target node heartbeat missing or latency (${target.rttMs}ms) exceeds 800ms threshold.`
      );
    }

    const allPassed =
      workloadTypeGate &&
      isaCompatGate &&
      runtimeCompatGate &&
      ramHeadroomGate &&
      networkAliveGate;

    const gates: FeasibilityGates = {
      workloadTypeGate,
      isaCompatGate,
      runtimeCompatGate,
      ramHeadroomGate,
      networkAliveGate,
      allPassed
    };

    // --- STAGE 2: PHYSICS-BASED TTE / TTM SAFETY CALCULATION ---
    // Time-To-Exhaustion (TTE) of source device in seconds
    let tteSeconds: number;
    if (source.isCharging || source.dischargeRate <= 0) {
      tteSeconds = 86400; // 24 hours (effectively infinite power)
    } else {
      tteSeconds = (source.batteryLevel / source.dischargeRate) * 3600;
    }

    // Time-To-Migrate (TTM) in seconds
    // Snapshot size: Tier A ~ 0.5 MB, Tier B ~ 120 MB
    const snapshotSizeMB = workload.tier === "TIER_A_PORTABLE" ? 0.45 : 120.0;
    const effectiveBwMbps = Math.max(1.0, Math.min(source.bandwidthMbps, target.bandwidthMbps));
    const transferSeconds = (snapshotSizeMB * 8) / effectiveBwMbps;
    const freezeSeconds = workload.tier === "TIER_A_PORTABLE" ? 0.08 : 2.5;
    const restoreSeconds = workload.tier === "TIER_A_PORTABLE" ? 0.05 : 1.8;
    const rttSeconds = (target.rttMs * 2) / 1000;

    const ttmSeconds = freezeSeconds + transferSeconds + rttSeconds + restoreSeconds;
    const estimatedInterruptionMs = Math.round((freezeSeconds + transferSeconds + restoreSeconds) * 1000);

    // Safety Margin Ratio: eta = TTE / TTM
    const safetyMarginRatio = +(tteSeconds / Math.max(0.1, ttmSeconds)).toFixed(2);

    if (safetyMarginRatio < 1.3 && allPassed) {
      reasons.push(
        `Warning (Safety Margin Low): Source battery dies in ${Math.round(tteSeconds)}s while transfer requires ${ttmSeconds.toFixed(1)}s (Safety ratio: ${safetyMarginRatio}x).`
      );
    }

    // --- STAGE 3: CONTINUOUS UTILITY SCORE (0 - 100) ---
    // Target Resource Headroom Score
    const targetCpuLoad = 25; // default estimated baseline
    const cpuScore = Math.max(0, 100 - targetCpuLoad) * 0.5;
    const ramScore = Math.min(50, (target.freeMemoryMB / (workload.memoryFootprintMB * 2)) * 50);
    const resourcesScore = +(cpuScore + ramScore).toFixed(1);

    // Safety Margin Score
    let safetyMarginScore = 0;
    if (safetyMarginRatio >= 2.5) {
      safetyMarginScore = 100;
    } else if (safetyMarginRatio >= 1.0) {
      safetyMarginScore = Math.round((safetyMarginRatio - 1.0) * 66.6);
    } else {
      safetyMarginScore = 0;
    }

    // Network Latency Score
    const networkScore = +Math.max(0, 100 - target.rttMs / 3).toFixed(1);

    // Downtime Score
    const downtimeScore = +Math.max(0, 100 - estimatedInterruptionMs / 10).toFixed(1);

    // Weighted Continuous Feasibility Score
    let score = Math.round(
      0.30 * resourcesScore +
      0.25 * safetyMarginScore +
      0.25 * networkScore +
      0.20 * downtimeScore
    );

    if (!allPassed) {
      score = Math.min(score, 35); // Capped if any gate failed
    }

    // --- DECISION LOGIC ---
    let decision: "MIGRATE" | "REMOTE_FALLBACK" | "KEEP_LOCAL";
    if (!allPassed) {
      decision = "REMOTE_FALLBACK";
    } else if (score >= 60) {
      decision = "MIGRATE";
      reasons.push(
        `Feasibility Confirmed (${score}/100): All 5 gates passed, safety margin is ${safetyMarginRatio}x, estimated downtime is ${estimatedInterruptionMs}ms.`
      );
    } else if (source.batteryLevel < 15 || source.dischargeRate > 30) {
      decision = "REMOTE_FALLBACK";
      reasons.push("Battery Evacuation: Source power critical; migration score low, engaging Remote Fallback.");
    } else {
      decision = "KEEP_LOCAL";
      reasons.push(`Score (${score}/100) below migration threshold (60); source device is healthy.`);
    }

    return {
      sourceDeviceId: source.id,
      targetDeviceId: target.id,
      workloadId: workload.id,
      decision,
      score,
      safetyMarginRatio,
      tteSeconds: Math.round(tteSeconds),
      ttmSeconds: +ttmSeconds.toFixed(2),
      estimatedInterruptionMs,
      gates,
      reasons,
      breakdown: {
        resourcesScore,
        safetyMarginScore,
        networkScore,
        downtimeScore
      }
    };
  }
}

export const feasibilityEngine = new FeasibilityEngine();

