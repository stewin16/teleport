# Four-Voice Council Debate: Cross-Device Workload Migration Engine (Teleport)

**Topic**: Architecture, Migration Tiers, Fencing Protocol, and Remote Access Fallback  
**Date**: October 31, 2026  
**Status**: RESOLVED & SYNTHESIZED  

---

## 1. Competing Technical Positions

### Position A: Pure OS/Container-Level Live Migration (CRIU + Podman/Docker)
- **Advocate**: Systems Purist
- **Core Proposal**: Freeze native Linux processes using kernel `ptrace` and dump `/proc/$pid/*` memory pages, file descriptors, and registers via CRIU. Transfer container image deltas and restore on the target machine.
- **Critical Flaw**: Strictly homogeneous. Fails completely across mismatched CPU architectures (`x86_64` $\to$ `arm64`), mismatched kernels, or non-Linux host operating systems (macOS Apple Silicon, Windows, iOS, Android). In a hackathon demo with judges holding mixed laptops and smartphones, a pure CRIU approach crashes or refuses to run.

### Position B: Pure WebAssembly (Wasm) Micro-Runtime Virtualization (Wharf / Nomad)
- **Advocate**: Virtualization Theorist
- **Core Proposal**: Compile all workloads to Wasm. Virtualize WASI host file descriptors and call stacks using Continuation-Passing Style (CPS) to achieve sub-2ms cross-architecture live migration across any OS/ISA.
- **Critical Flaw**: Real-world legacy container workloads, native GUI apps, and existing Python data science pipelines cannot easily be recompiled to custom Wasm vessels in a 36-hour sprint without heavy tooling friction.

### Position C: Dual-Tier Architecture + Stateful Execution Frame + Low-Latency Canvas/WebSockets Remote Streamer (Synthesized Consensus)
- **Advocate**: The Council Synthesis
- **Core Proposal**:
  1. **Tier A (Cross-Architecture Portable Workloads)**: Portable Wasm & Deterministic Execution Frames (Monte Carlo Risk Simulation, Neural Gradient Step Optimizer, State Machine Document Indexer). Serializes linear memory, step counter `#k`, PRNG seeds, and active arrays into AES-256-GCM encrypted, SHA-256 signed checkpoints. Migrates seamlessly across *any* OS (`x86_64` $\leftrightarrow$ `arm64` Windows/Mac/Linux/Phone) in under 120ms.
  2. **Tier B (Native Linux Container Workloads - Modeled & Integrated)**: CRIU / Podman container checkpoints. Allowed only between homogeneous Linux nodes (`x86_64` $\to$ `x86_64`). If target is `arm64` or non-Linux, the Feasibility Engine deterministically blocks migration and automatically routes to Remote Access Fallback.
  3. **Tier C (Hardware-Locked / GPU Workloads)**: Raytracing renderers, pinned CUDA devices, or raw sockets. Live migration is flagged as unsafe; source execution is preserved and low-latency interactive remote streaming is engaged.
  4. **Remote Access Fallback**: WebRTC / Canvas streaming + bidirectional input forwarding inspired by Neko, keeping the workload running on the source while granting full control to the target device.
  5. **Epoch-Fenced Single Active Instance**: Central coordinator assigns monotonic integer leases ($E \to E+1$). Target cannot start until source acknowledges fencing (`FENCED_STOPPED`), with instant automatic rollback (< 35ms) on checksum mismatch or network drop.

---

## 2. Four-Voice Adversarial Sparring

### The Architect (System Cohesion & Abstraction)
> *"We must not build a toy simulation with hardcoded mock timeouts. The architecture must have clean boundaries: a real Server-Authoritative Coordination Engine, a strictly typed State Machine, and an exact mathematical Feasibility Engine ($G_{\text{total}} \times S_{\text{feasibility}}$). The abstraction must cleanly isolate the Execution Engine from the Transport Layer, allowing any real laptop or phone to register as an active node."*

### The Skeptic (Failure Modes, Race Conditions & Split-Brain)
> *"What happens during network partitions? If device A thinks it is still the master while device B receives an unverified checkpoint and begins executing, we get split-brain state corruption. Furthermore, battery curves are non-linear; if a laptop's battery drops from 12% to 0% in 30 seconds under heavy load while transferring a 50 MB snapshot over a jittery Wi-Fi network, the source will die mid-transfer."*
> **Resolution**: Monotonic epoch leasing. The coordinator revokes Epoch $E$ from Device A before issuing Epoch $E+1$ to Device B. If Device B fails integrity validation (SHA-256) or times out, the coordinator instantly re-unfences Device A at Epoch $E$. For battery drain, the Time-to-Exhaustion vs Time-to-Migrate (TTE/TTM) physics engine continuously evaluates $\eta_{\text{safety}} = \text{TTE} / \text{TTM}$; if $\eta_{\text{safety}} < 1.5$, proactive migration or remote fallback is forced immediately.

### The Pragmatist (Execution Velocity & Hackathon Demo Reliability)
> *"We have 36 hours. If we require judges to install custom Linux kernel modules or CRIU dependencies on their personal MacBooks or Windows machines, our demo will fail on stage. We must build a unified TypeScript/Node.js + React/Vite stack with real WebSocket orchestration. Every laptop or phone that scans the QR code / opens the URL becomes an active physical node with real hardware telemetry (Battery Status API, RAM, core count, WebSocket RTT)."*

### The Critic (Judge UX, Visual Polish & Explainability)
> *"Judges do not just want to see a terminal log saying 'migrated'. They need to see the live telemetry meters, the step counter visibly halting on Device A and resuming at step $k+1$ on Device B without losing a calculation, the exact mathematical breakdown of why migration was chosen over remote access, and an interactive Chaos Lab where they can press 'Drain Battery to 8%' or 'Corrupt SHA-256 Checksum' to see the safety engine react in real time."*

---

## 3. Strongest Argument Against the Favored Path
The primary risk of the Dual-Tier model is that skeptics might ask: *"Is Tier A running real Wasm/JS computation or just moving a JSON state dictionary?"*  
**Defense**: Tier A runs real, high-iteration computational loops (e.g., Monte Carlo Value-at-Risk computation with 100,000 continuous simulations, and a real Multi-Layer Perceptron neural training loop). The snapshot does not merely serialize configuration; it serializes the active linear memory buffers, matrix weights, momentum buffers, PRNG seed state, and instruction step pointer. When restored, the computation verifies mathematical continuity from the exact microsecond it paused.

---

## 4. Falsification Criteria & Decisive Runtime Tests
1. **Split-Brain Test**: Inject a network partition command mid-transfer. Assert that Device A and Device B NEVER execute concurrently under the same epoch token.
2. **Integrity Rejection Test**: Flip 1 bit in the serialized snapshot payload. Assert that SHA-256 verification fails, target restore is rejected with HTTP 422 / WS Error, and source is un-fenced in $< 35\text{ms}$.
3. **Cross-Architecture Migration Test**: Register Node 1 as `x86_64` (Windows/Linux) and Node 2 as `arm64` (macOS/iOS/Android). Run Tier-A Monte Carlo loop on Node 1; trigger migration; assert successful resume on Node 2 at exact step $k+1$.
4. **ISA Incompatibility Fallback Test**: Run Tier-B Container workload on Node 1 (`x86_64`); attempt migration to Node 2 (`arm64`); assert Feasibility Engine sets $G_{\text{ISA}} = 0$, halts migration, and automatically opens the Remote Access Viewport with low-latency stream and input forwarding.

