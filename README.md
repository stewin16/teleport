# Karatsuba - Bit N Build 2026 Finals (Problem Statement 1.2: TELEPORT)

This repo is private. Only your team and the organizers can see it.

### Rules
- Push all your work here. Don't rewrite history (no force-push, no deleting branches). It gets checked.
- Don't commit secrets or .env files. Commit a .env.example instead.
- Don't change the repo visibility and don't add anyone outside your team.
- Anything unclear, ask the council.

---

# TELEPORT: Intelligent Cross-Device Workload Migration Platform

**Teleport** is a distributed control plane and runtime orchestration engine that keeps stateful computational workloads accessible across heterogeneous laptops, desktops, and mobile devices. When a device runs low on battery, experiences severe resource contention, or when directed by a user command, Teleport evaluates hardware/runtime compatibility and network physics to either:
1. **Live-migrate the workload with preserved state and monotonic epoch fencing**, or
2. **Gracefully fall back to interactive low-latency remote access (Neko-style viewport)** with bidirectional command forwarding.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v20+ (`node -v`)
- **npm**: v10+ (`npm -v`)

### 2. Installation
```bash
npm install
```

### 3. Run Automated Verification Tests
```bash
npm test
```
*Executes all 14 unit and integration tests covering Feasibility Gates, Monotonic Epoch Fencing, AES-256-GCM / SHA-256 Tamper Rejection, and < 35ms Instant Rollback.*

### 4. Start the Application
To run the unified server (port 3000) and Vite client (port 5173):
```bash
npm run dev
```
- Open **`http://localhost:5173/`** for live Vite development with instant hot reloading.
- Or open **`http://localhost:3000/`** for the unified production server.

---

## 🌟 Key Features

1. **Multi-Device Fleet Registry**:
   - Live connected node discovery displaying CPU load, memory headroom, battery level/charging status, and RTT ping.
   - Pairs real physical devices over Wi-Fi via QR code or direct URL (`/`).
   - Uses the browser's native **Web Battery API** (`navigator.getBattery()`) for real-time hardware telemetry.
2. **Deterministic Feasibility Engine ($G_{\text{total}} \times S_{\text{feasibility}}$)**:
   - Evaluates 5 hard compatibility gates: Workload Checkability, CPU ISA Match ($x86\_64 \leftrightarrow arm64$), Runtime Engine, RAM Headroom (125% rule), and Network Latency.
   - Computes continuous physics safety score based on **Time-to-Exhaustion vs Time-to-Migrate ($\eta_{\text{safety}} = \text{TTE} / \text{TTM}$)**.
3. **Dual-Tier Stateful Workloads**:
   - **Tier A (Cross-Architecture Portable)**: Monte Carlo VaR Quantitative Risk Engine and Neural Micro-Batch Optimizer. Seamlessly migrates between macOS Apple Silicon and Windows/Linux/Mobile at exact instruction step `#k`.
   - **Tier B (Native Linux Containers - CRIU)**: Models Podman/CRIU container checkpoints. Automatically engages Remote Fallback if target has mismatched ISA/OS.
   - **Tier C (Hardware-Locked GPU Workloads)**: Automatically preserves local execution and serves interactive remote stream.
4. **Monotonic Epoch Lease Fencing ($E \to E+1$)**:
   - Server-authoritative atomic leases prevent split-brain dual active execution.
5. **Continuity & Instant Rollback (< 35ms)**:
   - If a corrupted snapshot or network drop occurs mid-flight, Teleport immediately re-unfences the source node with zero lost computations.
6. **Remote Access Fallback (Neko Viewport)**:
   - Streams 30 FPS canvas frames and forwards mouse, keyboard, and parameter inputs back to the source host over WebSockets.
7. **Chaos Engineering & Fault Injection Lab**:
   - Interactive buttons to simulate Critical Battery Drain (8%), Memory Starvation, Severed Bandwidth (250 Kbps), Corrupted SHA-256 Checksums, and Mid-Transfer Network Drops.
8. **In-App 18-Section Technical Specification**:
   - Complete technical documentation, academic citations, competitor comparisons, and judge defense cheat sheets built directly into the UI.
