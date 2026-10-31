# Council Debate Synthesis & Architectural Tradeoffs

**Context**: Synthesis of the Four-Voice Council Adversarial Sparring session recorded in `.ecca/debates/teleport-workload-migration.md`.

---

## 1. Trade-Off Resolutions

| Architectural Dimension | Competing Options Considered | Resolved Architecture | Decisive Rationale |
| :--- | :--- | :--- | :--- |
| **Workload Portability Model** | 1. Native CRIU container-only<br>2. Pure Wasm compiler<br>3. Dual-Tier Multi-Runtime | **Dual-Tier Multi-Runtime** | Allows genuine live migration across mixed laptops/phones (Tier A: Wasm/JS/Python) while realistically integrating and evaluating native Linux containers (Tier B: CRIU/Podman) and hardware-locked workloads (Tier C: GPU). |
| **Consistency & Fencing Protocol** | 1. Peer-to-Peer gossip<br>2. Distributed Raft cluster<br>3. Server-Authoritative Epoch Leases | **Server-Authoritative Monotonic Epoch Leases** | Lightweight, sub-millisecond execution fencing ($E \to E+1$). Prevents split-brain duplicate execution without the overhead of maintaining a full Raft quorum across flaky edge laptops. |
| **Remote Access Fallback Strategy** | 1. Heavy VNC/RDP server installation<br>2. Full WebRTC audio/video encoding pipeline<br>3. Optimized Canvas/DOM streaming + command proxy | **Optimized Canvas/DOM Stream + Bidirectional Command Proxy** (inspired by Neko) | Runs natively in any web browser on iOS, Android, macOS, and Windows with zero native driver installation, maintaining < 50ms interaction latency. |
| **Feasibility Decision Engine** | 1. Pure LLM prompt decision<br>2. Hardcoded heuristic thresholds<br>3. Deterministic Gate + Physics Model + LLM Explainability | **Deterministic Hardware Gate + Physics Utility Model ($G_{\text{total}} \times S_{\text{feasibility}}$) + Gemini 3.8 Flash Causal Audit** | Sub-2ms deterministic mathematical evaluation guarantees safety and reproducibility, while Gemini provides deep human-readable post-decision audit reports. |

---

## 2. Anti-Fragile Safeguards
1. **Network Partition Resilience**: If WebSocket disconnects during migration phase, the coordinator maintains the fenced lock on the source for a configurable grace period (5000ms), and then triggers an automatic rollback unfencing the source node.
2. **Snapshot Corrupt Payload Shield**: Every state snapshot is validated with a SHA-256 digest before decryption or state injection. Any bit rot or malicious modification immediately aborts restore and preserves source execution.
3. **Hardware Telemetry Smoothing**: Raw CPU and battery metrics use Exponential Weighted Moving Averages (EWMA with $\alpha = 0.3$) to prevent migration ping-pong caused by brief 1-second CPU spikes.

