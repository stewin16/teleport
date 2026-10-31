import { FeasibilityResult, Device, WorkloadState } from "./types.js";

export class GeminiExplainer {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
  }

  /**
   * Generates a natural-language causal audit report explaining the Feasibility Engine's decision.
   */
  public async explainDecision(
    result: FeasibilityResult,
    source: Device,
    target: Device,
    workload: WorkloadState
  ): Promise<{ explanation: string; modelUsed: string }> {
    // If Gemini API Key is available, invoke Gemini 3.8 Flash
    if (this.apiKey) {
      try {
        const prompt = `
You are the Teleport Distributed Systems Explainability Auditor.
Analyze the following workload migration feasibility evaluation and generate a concise 3-4 sentence causal audit explanation:
- Workload: "${workload.name}" (Tier: ${workload.tier}, Footprint: ${workload.memoryFootprintMB} MB)
- Source Node: "${source.name}" (OS: ${source.os}, Arch: ${source.arch}, Battery: ${source.batteryLevel}%, Charging: ${source.isCharging}, Discharge: ${source.dischargeRate}%/hr)
- Target Node: "${target.name}" (OS: ${target.os}, Arch: ${target.arch}, Free RAM: ${target.freeMemoryMB} MB, RTT: ${target.rttMs}ms)
- Feasibility Decision: ${result.decision} (Score: ${result.score}/100)
- Safety Margin Ratio (TTE/TTM): ${result.safetyMarginRatio}x (TTE: ${result.tteSeconds}s, TTM: ${result.ttmSeconds}s)
- Gates Summary: ${JSON.stringify(result.gates)}
- Stated Reasons: ${result.reasons.join("; ")}

Explain clearly WHY this decision was made, highlighting the physical and architectural constraints.
`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          }
        );

        if (response.ok) {
          const data: any = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return { explanation: text.trim(), modelUsed: "gemini-3.8-flash" };
          }
        }
      } catch (e) {
        // Fall back to internal deterministic explainer
      }
    }

    // Deterministic Rule-Based Fallback Explainer
    return {
      explanation: this.generateLocalExplanation(result, source, target, workload),
      modelUsed: "teleport-deterministic-causal-engine"
    };
  }

  private generateLocalExplanation(
    result: FeasibilityResult,
    source: Device,
    target: Device,
    workload: WorkloadState
  ): string {
    if (result.decision === "MIGRATE") {
      return (
        `Decision: MIGRATE (${result.score}/100 Feasibility Score). ` +
        `All 5 hardware and runtime compatibility gates passed. ` +
        `Target device (${target.name}) possesses sufficient memory headroom (${target.freeMemoryMB} MB free vs ${workload.memoryFootprintMB * 1.25} MB required) and low network latency (${target.rttMs}ms). ` +
        `The physical safety margin is ${result.safetyMarginRatio}x (Time-to-Exhaustion ${result.tteSeconds}s vs Time-to-Migrate ${result.ttmSeconds}s), safely completing state transfer with an estimated interruption downtime of only ${result.estimatedInterruptionMs}ms.`
      );
    }

    if (result.decision === "REMOTE_FALLBACK") {
      const failedGates = [];
      if (!result.gates.workloadTypeGate) failedGates.push("hardware-bound GPU execution context");
      if (!result.gates.isaCompatGate) failedGates.push(`cross-ISA incompatibility (${source.arch} -> ${target.arch}) for native container`);
      if (!result.gates.ramHeadroomGate) failedGates.push(`insufficient target RAM (${target.freeMemoryMB} MB free)`);
      if (!result.gates.networkAliveGate) failedGates.push(`target network latency (${target.rttMs}ms) exceeds safety ceiling`);

      const reasonStr = failedGates.length > 0 ? failedGates.join(", ") : "operational safety score below 60/100";
      return (
        `Decision: REMOTE ACCESS FALLBACK (${result.score}/100). ` +
        `Live state migration was rejected due to ${reasonStr}. ` +
        `Rather than aborting computation, Teleport preserves uninterrupted execution on ${source.name} and activates an interactive low-latency Remote Viewport on ${target.name}, forwarding display frames and control inputs over WebSockets.`
      );
    }

    return (
      `Decision: KEEP LOCAL (${result.score}/100). ` +
      `Source device (${source.name}) has healthy battery (${source.batteryLevel}%) and optimal compute conditions. ` +
      `Migration to ${target.name} would introduce unnecessary network overhead with minimal operational gain.`
    );
  }
}

export const geminiExplainer = new GeminiExplainer();

