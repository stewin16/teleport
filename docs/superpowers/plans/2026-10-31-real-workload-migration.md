# Real Distributed Workload Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform TELEPORT into a 100% authentic, production-grade distributed workload migration and remote access platform testable between two real Windows laptops over Wi-Fi/LAN.

**Architecture:** A central coordinator runs on Laptop A hosting the Studio Dashboard and fleet registry; a dedicated Node.js agent runs on Laptop B (`npm run agent`). Workloads (Monte Carlo risk engine and interactive YouTube media tab) physically execute on the active laptop's CPU process. State frames are encrypted with AES-256-GCM and signed with SHA-256 before network transfer. Single active instance is enforced via server-authoritative monotonic epoch leases ($E \to E+1$). Fallback activates a real-time Neko canvas frame stream and bidirectional command proxy.

**Tech Stack:** TypeScript, Node.js 20+, Express 4, `ws` (WebSockets), Node `crypto` (AES-256-GCM, SHA-256, HMAC), React 18, Vite, Tailwind CSS, Lucide icons, Vitest.

**Spec:** [docs/superpowers/specs/2026-10-31-teleport-real-workload-migration-design.md](file:///D:/Karatsuba_Final-Round/docs/superpowers/specs/2026-10-31-teleport-real-workload-migration-design.md)

## Global Constraints

- Must run natively on Windows 10/11 without requiring WSL2, Linux kernel modules, or Docker dependencies.
- Zero fake metrics: CPU, memory, hostnames, and rollback timestamps must reflect genuine operations.
- Shared types must be consolidated into `src/shared/types.ts` to eliminate duplicate definitions.
- All code must pass `npm test` and build with `npm run build`.

## Review Focus

1. **Network Partition Mid-Transfer**: Coordinator must safely unfence the source laptop within < 35ms if the target agent disconnects mid-flight.
2. **SHA-256 Tamper Rejection**: Altering any single byte of the encrypted envelope must abort target restore and trigger automatic source unfence.
3. **Split-Brain Immunity**: Source laptop must acknowledge `FENCED_STOPPED` before target laptop is granted Epoch $E+1$ execution.
4. **Media Timestamp Continuity**: YouTube tab workload must resume on Laptop B within $\pm 200\text{ms}$ of the paused position on Laptop A.
5. **WebSocket Stream Decoupling**: High-frequency canvas frame relay must use a dedicated `/ws/stream` channel to prevent saturating critical heartbeat and migration control messages.

---

### Task 1: Environment Setup & Shared Types Deduplication

**Files:**
- Create: `src/shared/types.ts`
- Modify: `package.json:7-14`
- Modify: `src/server/types.ts`
- Modify: `src/client/types/teleport.ts`
- Test: `tests/typesSanity.test.ts`

**Interfaces:**
- Produces: `Device`, `WorkloadState`, `FeasibilityGates`, `FeasibilityResult`, `MigrationEvent`, `SnapshotPayload`, `YouTubeWorkloadState`, `RemoteControlCommand` in `src/shared/types.ts`.

- [ ] **Step 1: Install workspace dependencies**

Run `npm install` to install `vitest`, `tsx`, `ws`, `express`, `react`, etc.

- [ ] **Step 2: Write failing types sanity test**

```typescript
// tests/typesSanity.test.ts
import { describe, it, expect } from "vitest";
import { WorkloadState, Device } from "../src/shared/types.js";

describe("Shared Types Centralization", () => {
  it("imports unified Device and WorkloadState interfaces", () => {
    const d: Partial<Device> = { id: "node-test", name: "Laptop Test", os: "windows" };
    expect(d.id).toBe("node-test");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/typesSanity.test.ts`  
Expected: FAIL (cannot find module `src/shared/types.js`).

- [ ] **Step 4: Create `src/shared/types.ts` and re-export from server and client**

Extract all shared interfaces into `src/shared/types.ts`. Update `src/server/types.ts` and `src/client/types/teleport.ts` to re-export from `src/shared/types.ts`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/typesSanity.test.ts`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/shared/types.ts src/server/types.ts src/client/types/teleport.ts tests/typesSanity.test.ts
git commit -m "refactor: consolidate duplicate client and server types into src/shared/types"
```

---

### Task 2: Real Windows Hardware Telemetry Subsystem

**Files:**
- Create: `src/shared/telemetry.ts`
- Modify: `src/server/deviceRegistry.ts`
- Test: `tests/telemetry.test.ts`

**Interfaces:**
- Consumes: `Device` from `src/shared/types.ts`.
- Produces: `getSystemTelemetry(): Promise<SystemTelemetry>` returning real CPU load, RAM in MB, Windows hostname, and battery info.

- [ ] **Step 1: Write the failing telemetry test**

```typescript
// tests/telemetry.test.ts
import { describe, it, expect } from "vitest";
import { getSystemTelemetry } from "../src/shared/telemetry.js";

describe("Real Windows Telemetry Subsystem", () => {
  it("queries real host OS metrics without crashing", async () => {
    const telemetry = await getSystemTelemetry();
    expect(telemetry.hostname).toBeDefined();
    expect(telemetry.totalMemoryMB).toBeGreaterThan(1024);
    expect(telemetry.freeMemoryMB).toBeGreaterThan(0);
    expect(telemetry.cpuUsagePercent).toBeGreaterThanOrEqual(0);
    expect(telemetry.cpuUsagePercent).toBeLessThanOrEqual(100);
    expect(telemetry.arch).toMatch(/x86_64|arm64/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/telemetry.test.ts`  
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/shared/telemetry.ts`**

Implement real CPU tick sampling using `os.cpus()`, real memory using `os.totalmem()` / `os.freemem()`, hostname via `os.hostname()`, and battery status via PowerShell query with graceful AC fallback.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/telemetry.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/telemetry.ts tests/telemetry.test.ts
git commit -m "feat: implement real Windows hardware telemetry sampler"
```

---

### Task 3: Verifiable Workloads (Monte Carlo & YouTube Browser Tab)

**Files:**
- Create: `src/shared/workloads/baseWorkload.ts`
- Create: `src/shared/workloads/monteCarloWorkload.ts`
- Create: `src/shared/workloads/youtubeWorkload.ts`
- Test: `tests/mediaMigration.test.ts`

**Interfaces:**
- Consumes: `WorkloadState`, `SnapshotPayload` from `src/shared/types.ts`.
- Produces: `BaseWorkload`, `MonteCarloWorkload`, `YouTubeWorkload`.

- [ ] **Step 1: Write failing YouTube media migration test**

```typescript
// tests/mediaMigration.test.ts
import { describe, it, expect } from "vitest";
import { YouTubeWorkload } from "../src/shared/workloads/youtubeWorkload.js";

describe("YouTube Tab Stateful Workload Migration", () => {
  it("checkpoints exact video playback timestamp and restores on target node", () => {
    const sourceWorkload = new YouTubeWorkload("node-laptop-a", "dQw4w9WgXcQ");
    sourceWorkload.seekTo(145.2);
    sourceWorkload.play();

    // Advance 5 seconds
    sourceWorkload.tick();
    const frozenState = sourceWorkload.serializeState();

    expect(frozenState.currentTime).toBeGreaterThanOrEqual(145.2);
    expect(frozenState.isPlaying).toBe(true);
    expect(frozenState.videoId).toBe("dQw4w9WgXcQ");

    // Restore on Target Laptop B
    const targetWorkload = new YouTubeWorkload("node-laptop-b", "placeholder");
    targetWorkload.restoreState(frozenState, 2, "node-laptop-b");

    expect(targetWorkload.currentDeviceId).toBe("node-laptop-b");
    expect(targetWorkload.epoch).toBe(2);
    expect(targetWorkload.currentTime).toBe(frozenState.currentTime);
    expect(targetWorkload.isPlaying).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/mediaMigration.test.ts`  
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `YouTubeWorkload` and move `MonteCarloWorkload` to `src/shared/workloads/`**

Implement `YouTubeWorkload` managing `videoId`, `currentTime`, `isPlaying`, `title`, and playback history.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/mediaMigration.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/workloads/ tests/mediaMigration.test.ts
git commit -m "feat: implement stateful YouTube browser tab workload for live migration"
```

---

### Task 4: Standalone Dedicated Physical Node Agent

**Files:**
- Create: `src/agent/nodeAgent.ts`
- Modify: `package.json` (add `"agent": "tsx src/agent/nodeAgent.ts"`)
- Test: `tests/agentProtocol.test.ts`

**Interfaces:**
- Consumes: `getSystemTelemetry()` from `src/shared/telemetry.ts`, `crypto` from `src/server/crypto.ts`.
- Produces: CLI script that connects to Coordinator over WebSocket, registers as a physical node, reports real telemetry, handles `REVOKE_LEASE`, receives encrypted snapshot, and runs computation locally.

- [ ] **Step 1: Write failing agent protocol unit test**

```typescript
// tests/agentProtocol.test.ts
import { describe, it, expect } from "vitest";
import { NodeAgent } from "../src/agent/nodeAgent.js";

describe("Physical Node Agent Lifecycle", () => {
  it("initializes agent with unique device ID and valid HMAC handshake token", () => {
    const agent = new NodeAgent({ coordinatorUrl: "ws://localhost:3000/ws", name: "Test Laptop B" });
    expect(agent.deviceId).toMatch(/^node-[a-z0-9-]+$/);
    expect(agent.token).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/agentProtocol.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement `src/agent/nodeAgent.ts`**

Implement connection to coordinator, regular 1s telemetry broadcasts, active workload execution loop when lease granted, and immediate pause/fence when lease revoked.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/agentProtocol.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/agent/nodeAgent.ts package.json tests/agentProtocol.test.ts
git commit -m "feat: implement dedicated physical node agent for Laptop B"
```

---

### Task 5: Coordinator Physical Node Support & Distributed Migration Pipeline

**Files:**
- Modify: `src/server/deviceRegistry.ts`
- Modify: `src/server/migrationCoordinator.ts`
- Modify: `src/server/server.ts`
- Test: `tests/distributedMigration.test.ts`

**Interfaces:**
- Consumes: `NodeAgent` protocol, `epochLeaseManager`, `encryptStatePayload`, `decryptStatePayload`.
- Produces: Coordinator endpoints for physical node registration and remote agent snapshot handoff.

- [ ] **Step 1: Write failing distributed migration integration test**

```typescript
// tests/distributedMigration.test.ts
import { describe, it, expect } from "vitest";
import { migrationCoordinator } from "../src/server/migrationCoordinator.js";
import { deviceRegistry } from "../src/server/deviceRegistry.js";
import { YouTubeWorkload } from "../src/shared/workloads/youtubeWorkload.js";

describe("Distributed Network Migration Pipeline", () => {
  it("executes atomic migration between registered physical nodes", async () => {
    const nodeA = deviceRegistry.register({ id: "phys-laptop-a", name: "Laptop A", os: "windows", arch: "x86_64", isVirtual: false });
    const nodeB = deviceRegistry.register({ id: "phys-laptop-b", name: "Laptop B", os: "windows", arch: "x86_64", isVirtual: false });
    const workload = new YouTubeWorkload(nodeA.id, "rickroll");
    workload.seekTo(60);

    const result = await migrationCoordinator.executeMigration(workload, nodeB.id, { artificialDelayMs: 10 });
    expect(result.success).toBe(true);
    expect(workload.currentDeviceId).toBe(nodeB.id);
    expect(workload.epoch).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/distributedMigration.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Update `deviceRegistry.ts` and `migrationCoordinator.ts`**

Support `isVirtual: false` for physical laptops, forward remote snapshots via WebSocket to the connected physical agent, and handle instant rollback on timeout or rejection.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/distributedMigration.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/deviceRegistry.ts src/server/migrationCoordinator.ts src/server/server.ts tests/distributedMigration.test.ts
git commit -m "feat: enable coordinator distributed migration across physical agents"
```

---

### Task 6: Real Neko Canvas Streamer & Input Forwarding Channel

**Files:**
- Create: `src/server/streamRelay.ts`
- Modify: `src/server/server.ts`
- Modify: `src/client/components/RemoteViewport.tsx`
- Test: `tests/streamRelay.test.ts`

**Interfaces:**
- Consumes: WebSocket frames, `RemoteControlCommand`.
- Produces: Dedicated `/ws/stream` endpoint for 15–20 FPS visual canvas broadcast and command forwarding.

- [ ] **Step 1: Write failing stream relay test**

```typescript
// tests/streamRelay.test.ts
import { describe, it, expect } from "vitest";
import { StreamRelay } from "../src/server/streamRelay.js";

describe("Neko Canvas Stream & Command Relay", () => {
  it("registers broadcaster, distributes frame to viewers, and relays input commands", () => {
    const relay = new StreamRelay();
    let receivedCommand = false;
    relay.onCommand((cmd) => {
      if (cmd.action === "PAUSE") receivedCommand = true;
    });

    relay.handleCommand({ workloadId: "w1", sourceDeviceId: "d1", targetDeviceId: "d2", action: "PAUSE", timestamp: Date.now() });
    expect(receivedCommand).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/streamRelay.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement `src/server/streamRelay.ts` and attach to Express server**

Build the frame broadcaster and bidirectional input command router.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/streamRelay.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/streamRelay.ts src/server/server.ts tests/streamRelay.test.ts
git commit -m "feat: implement Neko-style real-time canvas frame streamer and input proxy"
```

---

### Task 7: UI Dashboard Enhancement & Verification

**Files:**
- Create: `src/client/components/YouTubeTabPlayer.tsx`
- Modify: `src/client/components/DeviceFleetGrid.tsx`
- Modify: `src/client/components/RemoteViewport.tsx`
- Modify: `src/client/components/WorkloadVisualizer.tsx`
- Modify: `src/client/App.tsx`
- Test: All Vitest test suites (`npm test`)

**Interfaces:**
- Consumes: `YouTubeWorkloadState`, `StreamRelay` frame events, `Device` fleet status.
- Produces: Interactive Studio Dashboard showing real physical laptop hostnames, live video playback with migration, and active canvas streaming.

- [ ] **Step 1: Create `YouTubeTabPlayer.tsx` component**

Embed stateful video player that reads `currentTime`, `isPlaying`, and synchronizes seek/pause state across migrations.

- [ ] **Step 2: Update `DeviceFleetGrid.tsx` with Physical Node Badges**

Prominently display `[PHYSICAL NODE - LIVE]` with actual Windows hostname, CPU %, RAM, and ping, separate from virtual scenario nodes.

- [ ] **Step 3: Update `RemoteViewport.tsx` to display real streamed frames**

Render incoming image frames from `/ws/stream` on an HTML5 Canvas and send click/pause events back through the relay.

- [ ] **Step 4: Run entire test suite and verify build**

Run: `npm test && npm run build`  
Expected: All 18+ tests PASS and Vite build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/client/ tests/
git commit -m "feat: complete interactive UI dashboard with YouTube tab player and live Neko stream"
```

