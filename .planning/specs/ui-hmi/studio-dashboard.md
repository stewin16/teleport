# UI/HMI Specification: Teleport Studio & Chaos Lab

---

## 1. Visual Hierarchy & Design System

The Teleport Studio user interface conforms to the Mission-Critical Infrastructure Aesthetic (inspired by Cloudflare Radar, Fly.io Machines, and Linear).

### 1.1 Color Palette (60-30-10 Rule)
- **60% Dominant Base**:
  - Light Mode: `#F8FAFC` (Slate 50)
  - Dark Mode: `#0B0F19` (Deep Carbon Slate)
- **30% Structural Panels**:
  - Light Mode: `#FFFFFF` (Pure White) with hairline border `#E2E8F0`
  - Dark Mode: `#111827` (Charcoal Slate) with hairline border `#1E293B`
- **10% Semantic Accents**:
  - **Indigo** (`#4F46E5` / `#6366F1`): Primary brand actions, Teleport button, device pairing.
  - **Emerald** (`#16A34A` / `#22C55E`): Active execution, healthy battery, feasible migration score.
  - **Amber** (`#D97706` / `#F59E0B`): Remote Access Fallback active, degraded network, high load warning.
  - **Crimson** (`#DC2626` / `#EF4444`): Fenced source node, critical battery (< 10%), rollback alert, security rejection.

### 1.2 Typography
- **Display Headings**: `Plus Jakarta Sans` (Bold, 600–700 weight).
- **Interface & Prose**: `DM Sans` (Clean, legible SaaS typography).
- **Telemetry & Hashes**: `JetBrains Mono` with `tabular-nums` (CPU %, RAM MB, Step counters, SHA-256 digests, Epoch tokens).

---

## 2. Top Bar Navigation Contract
The top bar implements a strict 3-zone layout:
1. **Left Zone**: Brand Mark & Live Heartbeat indicator (`TELEPORT` · `Distributed Continuity Engine`).
2. **Center Zone**: View switcher tabs:
   - `Live Teleport Console`
   - `Feasibility & Chaos Lab`
   - `Remote Access Viewport`
   - `18-Section Blueprint`
3. **Right Zone**: `+ Pair Physical Device` modal launcher, Theme Toggle (Light/Dark), and System Epoch Badge.

---

## 3. Four Core Interface Views

### View 1: Live Teleport Console
- **Device Fleet Grid**: Cards for each connected device showing real-time OS badge, ISA architecture (`x86_64` / `arm64`), CPU meter, Memory headroom bar, Battery discharge curve, and RTT ping.
- **Active Workload Card**:
  - Displays running workload selection (Monte Carlo, Neural Optimizer, Redis Container, Raytracer).
  - Real-time animated canvas/chart rendering calculation progress.
  - Live Step Counter (`#k`), Execution Epoch (`#E`), and Execution State (`ACTIVE`, `FENCED_STOPPED`, `RESTORED`).
- **One-Click Teleport Action Bar**: Select destination node and click `Initiate Teleport`.
- **6-Stage Live Migration Stepper**:
  1. `Checkpoint Created`
  2. `AES-256 Encrypted`
  3. `Source Fenced (Epoch Revoked)`
  4. `Encrypted Transfer`
  5. `SHA-256 Verified`
  6. `Target Restored (Epoch Issued)`

### View 2: Feasibility & Chaos Lab
- **Real-Time Feasibility Matrix**: Dynamic table evaluating Source $\to$ Target compatibility across:
  - ISA Compatibility Gate ($G_{\text{ISA}}$)
  - Runtime Engine Gate ($G_{\text{runtime}}$)
  - Memory Headroom Gate ($G_{\text{RAM}}$)
  - Time-to-Exhaustion vs Time-to-Migrate Safety Margin ($\eta_{\text{safety}}$)
  - Continuous Feasibility Score ($0–100$)
- **Chaos & Fault Injection Suite**:
  - `⚡ Drain Source Battery to 8%`: Triggers automatic battery evacuation.
  - `🔥 Spike CPU Load to 96%`: Tests resource pressure migration triggers.
  - `🌐 Throttle Network to 500 Kbps`: Demonstrates safety margin degradation.
  - `💥 Corrupt SHA-256 Checksum`: Triggers cryptographic rejection and instant rollback.
  - `🔌 Inject Network Partition Mid-Transfer`: Demonstrates source unfencing and continuity preservation.

### View 3: Remote Access Viewport
- Dedicated viewport interface rendered when live migration is rejected (e.g. `x86_64` container targeting an `arm64` phone).
- Streams live canvas frames from the source device at 20–30 FPS.
- Interactive control panel to forward clicks, parameters, pause/resume, and configuration changes to the source node in real time.

### View 4: 18-Section Technical Blueprint Explorer
- Searchable in-app documentation explorer presenting the complete Bit N Build engineering blueprint:
  - Sections 1–5: Problem Statement Analysis & Academic Literature Citations.
  - Sections 6–9: Feasibility Math, Epoch Fencing FSM, and Remote Fallback Protocol.
  - Sections 10–15: System Architecture, Database/API Schemas, and Security Matrix.
  - Sections 16–18: 36-Hour Hackathon Roadmap, Team Assignments, and Judge Defense Cheat Sheet.

