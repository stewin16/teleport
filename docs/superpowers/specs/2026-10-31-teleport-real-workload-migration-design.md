# Design Document: TELEPORT Real-World Distributed Workload Migration Platform

**Date**: 2026-10-31  
**Status**: APPROVED ARCHITECTURE  
**Target Platform**: Windows (Dual Physical Laptops over LAN / Wi-Fi)  
**Execution Model**: Option A (Dedicated Node.js Agent on Laptop B + Central Coordinator on Laptop A)

---

## 1. Intent & Problem Context

This system implements **TELEPORT**, a production-grade distributed workload migration and remote access platform tested live across two physical Windows laptops connected on the same local Wi-Fi / LAN.

When a laptop running a heavy computational or interactive browser workload experiences battery exhaustion, resource pressure, or upon operator command:
1. It deterministically assesses migration feasibility against connected nodes in the fleet.
2. If feasible, it executes **Live Migration**: cleanly freezing the execution loop or pausing media playback on Laptop A, encrypting and transferring the state frame over the network, and resuming on Laptop B at exact step $k+1$ or exact timestamp $t$ under server-authoritative monotonic epoch leases ($E \to E+1$) with split-brain prevention and instant rollback.
3. If infeasible (or hardware-locked), it activates **Remote Access Fallback (Neko Architecture)**: continuing execution on Laptop A while streaming real-time visual canvas frames and relaying bidirectional keyboard, mouse, and parameter control inputs back to Laptop A.

---

## 2. Goals, Non-Goals & Anti-Goals

### 2.1 Goals
- **Real Multi-Device Fleet Registry**:
  - Laptop A runs the Central Coordinator and Web Dashboard (`npm run dev`).
  - Laptop B runs the Node.js Agent (`npm run agent -- --coordinator=http://<laptop-a-ip>:3000`).
  - Both laptops report genuine Windows OS hardware telemetry:
    - Real CPU utilization via `os.cpus()` delta sampling.
    - Real total and free RAM via `os.totalmem()` and `os.freemem()`.
    - Real Windows hostname via `os.hostname()`.
    - Battery/power status via Windows battery telemetry / client API.
    - Real-time round-trip latency (RTT ping) measured continuously via WebSocket heartbeats.
- **Deterministic Feasibility Engine**:
  - Evaluates 5 mathematical gates ($G_{\text{total}} = G_{\text{workload}} \times G_{\text{ISA}} \times G_{\text{runtime}} \times G_{\text{RAM}} \times G_{\text{network}}$).
  - Calculates continuous physics safety margin ($\eta_{\text{safety}} = \text{TTE} / \text{TTM}$) to select `MIGRATE`, `REMOTE_FALLBACK`, or `KEEP_LOCAL`.
- **Physically Distributed Workload Execution**:
  - **Workload 1: Quantitative Monte Carlo Risk Loop**: Computation physically executes on the active laptop's CPU process. While on Laptop A: Laptop A's Node process runs the compute loop and emits tick metrics. Upon migration: Laptop A halts, snapshot is transferred, and Laptop B's Node process resumes computing from step $k+1$.
  - **Workload 2: Interactive Browser Tab & Media Player (`youtube_player`)**: A live video/media stream running on Laptop A. Upon migration, Laptop A freezes playback at exact timestamp $t$ (e.g. 02:45.3). State snapshot `{ videoId, timestampSeconds, isPlaying, playbackRate }` transfers to Laptop B, which immediately resumes playback at timestamp $t$ while Laptop A is fenced.
- **Strict Single Active Instance (Monotonic Epoch Fencing)**:
  - Central lease manager ($E \to E+1$) guarantees Laptop A is fenced before Laptop B begins execution.
  - Dual active execution is physically impossible.
- **Continuity & Instant Rollback**:
  - If a network drop or SHA-256 checksum mismatch occurs mid-transfer, Laptop A is immediately unfenced and safely resumes execution without lost data.
- **Real Interactive Remote Access Fallback (Neko Architecture)**:
  - Laptop A streams real-time visual canvas frames (15–20 FPS) over a dedicated stream channel to Laptop B.
  - Laptop B displays the live canvas viewport and sends interactive control commands (Pause, Resume, parameter sliders, seek) back to Laptop A in real time.
- **Security & Integrity**:
  - HMAC device authentication tokens for cluster handshake.
  - AES-256-GCM envelope encryption and pre-flight SHA-256 checksum validation.

### 2.2 Non-Goals
- Linux kernel CRIU (not supported natively on bare-metal Windows).
- Heavy external database dependencies (the orchestrator maintains an in-memory authoritative state ledger with atomic file backups).

### 2.3 Anti-Goals (Zero Deceptions)
- No fake counters pretending to be CUDA or Vulkan.
- No dummy in-memory collections pretending to be separate physical laptops.
- No static text pretending to be a video stream.
- No simulated rollback times.

---

## 3. System Architecture & Topology

```
                   +---------------------------------------------------+
                   |         LAPTOP A (Coordinator & Node 1)           |
                   |                                                   |
                   |  - Central Coordinator & Web Studio Dashboard     |
                   |  - Device Fleet Registry (Live RTT & Heartbeats)  |
                   |  - Monotonic Epoch Lease Manager (E -> E+1)       |
                   |  - Feasibility Engine (G_total * S_feasibility)   |
                   |  - Local Compute Worker (Active in Epoch 1)       |
                   |  - Canvas Stream Broadcaster (/ws/stream)         |
                   +-------------------------+-------------------------+
                                             |
                                  Wi-Fi / LAN Network
                          (HTTP REST + WebSockets on port 3000)
                                             |
                   +-------------------------+-------------------------+
                   |             LAPTOP B (Node 2 Agent)               |
                   |                                                   |
                   |  - Dedicated Node Agent (src/agent/nodeAgent.ts)  |
                   |  - Real Windows OS Telemetry (CPU, RAM, Hostname) |
                   |  - Standby Compute Worker                         |
                   |  - Dynamic State Restore (Takes over in Epoch 2)  |
                   |  - Remote Viewport Client (Renders Canvas Stream) |
                   |  - Bidirectional Input Forwarder (Sends commands) |
                   +---------------------------------------------------+
```

---

## 4. Subsystem Specifications

### 4.1 Telemetry Service (`src/server/telemetry.ts` & `src/agent/telemetry.ts`)
- **CPU**: Sample delta between CPU ticks `(1 - idleDelta / totalDelta) * 100` over a 1-second interval.
- **Memory**: Report `os.totalmem() / (1024 * 1024)` and `os.freemem() / (1024 * 1024)`.
- **Hostname**: Report `os.hostname()`, OS type (`windows`), and architecture (`x86_64` or `arm64`).
- **Battery**: Query native battery percentage and charging state via PowerShell CIM or browser client sync.

### 4.2 Workload Runtime & State Serialization (`src/shared/workloads/`)
- **Workload A: Quantitative Risk Engine**:
  - `step`: Integer instruction/iteration count.
  - `prngSeed`: Exact linear congruential generator seed.
  - `currentValue` & `runningVariance`: Running mathematical accumulators.
  - `history`: Floating-point history window buffer.
- **Workload B: Interactive Browser Tab & Media Player (`youtube_player`)**:
  - `videoId`: Active video identifier.
  - `currentTime`: Floating-point playback position in seconds (exact to 100ms).
  - `isPlaying`: Boolean playback state.
  - `title`: Video title.
  - `historyTimeline`: Checkpointed playback bookmark events.
- **Cryptographic Envelope**:
  - AES-256-GCM encrypted ciphertext, 12-byte IV, 16-byte auth tag, SHA-256 digest.

### 4.3 Fencing & Migration Protocol
1. **Trigger**: Operator clicks "Migrate" or battery exhaustion event fires on Laptop A.
2. **Pre-flight Feasibility**: Orchestrator verifies compatibility gates and safety ratio against Laptop B.
3. **Fence Source**: Orchestrator sends `REVOKE_LEASE` to Laptop A. Laptop A halts its computation loop or pauses media, serializes state, and responds with `FENCED_ACK` and state snapshot.
4. **Encrypt & Transmit**: Orchestrator wraps state in AES-256-GCM envelope, signs SHA-256 digest, and transmits to Laptop B over WebSocket.
5. **Verify & Restore**: Laptop B decrypts payload, verifies SHA-256, imports state variables, and assumes Epoch $E+1$.
6. **Activate Target**: Laptop B starts its local compute loop or resumes video playback from timestamp $t$. Orchestrator records `activeDeviceId = LaptopB` and `epoch = E+1`.
7. **Rollback Recovery**: If Laptop B fails to respond within timeout (5000ms) or SHA-256 digest fails, Orchestrator sends `ROLLBACK_UNFENCE` to Laptop A. Laptop A resumes computing/playing with zero lost progress.

### 4.4 Remote Access Fallback (Neko Architecture)
- When Feasibility Engine returns `REMOTE_FALLBACK`:
  - Workload continues running on Laptop A.
  - Laptop A's canvas visualizer captures real-time frame buffers as compressed JPEG/WebP frames and broadcasts them over `/ws/stream` at 15–20 FPS.
  - Laptop B connects to `/ws/stream` and renders live frames in the Remote Viewport card.
  - When the user clicks "Pause", "Resume", or drags parameter sliders on Laptop B, the commands are forwarded via WebSocket to Laptop A, which modifies the running compute loop or playback in real time.

---

## 5. Directory Structure & Key Files

```
Karatsuba_Final-Round/
├── src/
│   ├── shared/
│   │   ├── types.ts                   # Unified types (eliminates code duplication)
│   │   ├── crypto.ts                  # AES-256-GCM + SHA-256 envelope utilities
│   │   └── workloads/
│   │       ├── baseWorkload.ts
│   │       ├── monteCarloWorkload.ts  # Stateful Monte Carlo risk model
│   │       └── youtubeWorkload.ts     # Stateful browser tab / media player
│   ├── server/
│   │   ├── server.ts                  # Central Coordinator (port 3000)
│   │   ├── deviceRegistry.ts          # Physical & virtual fleet management
│   │   ├── feasibilityEngine.ts       # Mathematical gates & physics model
│   │   ├── epochFencing.ts            # Monotonic epoch lease manager
│   │   ├── migrationCoordinator.ts    # 6-stage live migration pipeline
│   │   ├── geminiExplainer.ts         # Explainability causal audit
│   │   └── streamRelay.ts             # Neko canvas frame & command relay
│   ├── agent/
│   │   ├── nodeAgent.ts               # Laptop B dedicated physical node daemon
│   │   └── systemTelemetry.ts         # Native Windows CPU/RAM/Battery sampler
│   └── client/
│       ├── App.tsx                    # Main Studio Dashboard
│       └── components/
│           ├── DeviceFleetGrid.tsx    # Live nodes with real Windows hostnames
│           ├── WorkloadVisualizer.tsx # Live computation canvas & stream source
│           ├── YouTubeTabPlayer.tsx   # Interactive stateful browser media tab
│           ├── RemoteViewport.tsx     # Live Neko remote stream renderer
│           ├── FeasibilityMatrix.tsx  # Mathematical gates & physics gauges
│           ├── MigrationStepper.tsx   # Real 6-stage progress tracker
│           └── ChaosLab.tsx           # Live fault injection triggers
└── tests/
    ├── cryptoSnapshot.test.ts         # AES-256-GCM + SHA-256 tests
    ├── epochFencing.test.ts           # Monotonic lease fencing tests
    ├── feasibility.test.ts            # Mathematical compatibility gates
    ├── mediaMigration.test.ts         # YouTube state migration & timestamp restore
    └── rollback.test.ts               # Instant rollback tests
```

---

## 6. Verification & Acceptance Criteria

1. **Physical Fleet Registration**:
   - Laptop A runs `npm run dev`. Laptop B runs `npm run agent -- --coordinator=http://<laptop-a-ip>:3000`.
   - Both laptops appear in the UI under **Physical Nodes** displaying their actual Windows hostnames, real CPU %, real free RAM, and RTT ping.
2. **Authentic Live Migration**:
   - Workload starts on Laptop A (step counter or video playback advancing).
   - Trigger migration to Laptop B.
   - Laptop A's compute loop/video physically halts.
   - Snapshot is encrypted and transferred over Wi-Fi.
   - Laptop B verifies SHA-256, resumes compute loop/video playback from the exact paused step or millisecond timestamp.
3. **Instant Rollback on Fault Injection**:
   - Trigger migration with simulated SHA-256 corruption.
   - Laptop B rejects the snapshot.
   - Laptop A is unfenced within < 35ms and continues execution with zero lost state.
4. **Authentic Remote Access Fallback**:
   - Trigger Remote Fallback.
   - Laptop A streams real-time visual canvas frames across the network.
   - Laptop B displays the live stream and can pause/resume/seek Laptop A's workload using bidirectional input forwarding.
5. **Clean Codebase**:
   - Shared types consolidated into `src/shared/types.ts`.
   - All tests passing with `npm test`.
