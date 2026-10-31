# Core Specification: Checkpointable Execution Engines & State Bundles

---

## 1. Workload Execution Tiers

Teleport categorizes workloads into three architectural tiers:

```
┌────────────────────────────────────────────────────────────────────────┐
│ WORKLOAD EXECUTION TIERS                                               │
├────────────────────────────────────────────────────────────────────────┤
│ Tier A: Cross-Architecture Portable (Wasm / Deterministic JS-Python)   │
│   • Runs across: Any OS (Windows, Linux, macOS, iOS, Android)          │
│   • Runs across: Any CPU ISA (x86_64 <-> arm64)                        │
│   • State Payload: 25 KB - 1.5 MB                                      │
│   • Interruption Downtime: 40ms - 150ms                                │
│   • Migration Feasibility: 100% Compatible                             │
├────────────────────────────────────────────────────────────────────────┤
│ Tier B: Homogeneous Container Workload (Linux Docker / Podman + CRIU)  │
│   • Runs across: Linux x86_64 <-> Linux x86_64 (or arm64 <-> arm64)   │
│   • State Payload: 50 MB - 350 MB (Memory pages, FDs, process tree)    │
│   • Interruption Downtime: 1.5s - 6s                                   │
│   • Migration Feasibility: Conditional (Fails if Target is Mac/Win/ISA)│
├────────────────────────────────────────────────────────────────────────┤
│ Tier C: Hardware-Locked / GPU Workload (CUDA Raytracing, Raw Hardware) │
│   • Runs across: Source Node only (tied to physical GPU hardware context)│
│   • Migration Feasibility: NEVER FEASIBLE (G_type = 0)                 │
│   • Action: Preserves local run + Engages Remote Access Fallback       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Checkpoint Serialization Format (TypeScript Schema)

```typescript
export interface WorkloadSnapshotPayload {
  version: "1.0.0";
  workloadId: string;
  tier: "TIER_A_PORTABLE" | "TIER_B_CONTAINER" | "TIER_C_HARDWARE_LOCKED";
  sourceDeviceId: string;
  targetDeviceId: string;
  sourceEpoch: number;
  targetEpoch: number;
  timestamp: number;
  
  // Execution Context & Instruction Continuity
  executionFrame: {
    step: number;                      // Exact iteration pointer (e.g., 42,891)
    status: "PAUSED_FOR_MIGRATION" | "COMPLETED";
    prngState: {
      seed: number;
      calls: number;
    };
    convergenceMetrics: {
      currentValue: number;
      lossHistory: number[];
      runningVariance: number;
    };
  };

  // State Payload (Encrypted Buffer or Compressed Linear Memory)
  stateData: {
    encoding: "json_state" | "wasm_linear_memory" | "criu_tar_gz";
    sizeBytes: number;
    // Base64 encoded AES-256-GCM ciphertext of internal buffers
    encryptedPayload: string;
    ivHex: string;
    authTagHex: string;
  };

  // Integrity & Security Verification
  integrity: {
    sha256Digest: string;              // SHA-256 hash of plaintext payload
    hmacSignature: string;             // Coordinator HMAC verification token
  };
}
```

---

## 3. Real Stateful Demonstration Workloads

### Workload 1: Monte Carlo Quantitative Risk & VaR Engine (Tier A)
- **Mathematical Task**: Calculates Value-at-Risk (VaR 99%) over 100,000 simulated Brownian market paths.
- **State Vector**:
  - `step`: Current simulation path index (1 to 100,000).
  - `currentVaR`: Running 99th percentile loss value.
  - `pathReturns`: Float64Array buffer of calculated price paths.
  - `prngSeed`: Exact seed state ensuring deterministic continuation without duplicate random numbers.
- **Visual Evidence in Demo**: When migrating from Laptop A to Laptop B at step #34,510, Laptop A freezes at #34,510, and Laptop B immediately begins calculating #34,511, dynamically continuing the live convergence graph.

### Workload 2: Live Neural Micro-Batch Optimizer (Tier A)
- **Mathematical Task**: Trains a 3-layer neural network on synthetic non-linear classification data.
- **State Vector**:
  - `step`: Current training epoch / step.
  - `weights`: Layer 1, Layer 2, Layer 3 weight matrices.
  - `bias`: Bias vectors.
  - `momentum`: Adam optimizer first and second moment vectors ($m_t, v_t$).
  - `lossHistory`: Historical loss trajectory array.
- **Visual Evidence in Demo**: Preserves weight convergence and loss curve without needing to re-initialize training.

### Workload 3: Redis / Native Linux Memory Indexer (Tier B)
- **Modeled Native Container**: Demonstrates CRIU checkpointing mechanics between homogeneous Linux hosts.
- **Demonstration Purpose**: Illustrates the Feasibility Engine blocking migration when targeting an Apple Silicon Mac or Mobile phone, proving why Remote Access Fallback is essential.

### Workload 4: Real-Time Raytracing Engine (Tier C)
- **Hardware Bound**: Bound to local GPU frame buffers and physical display contexts.
- **Demonstration Purpose**: Demonstrates zero-crash behavior when hardware locks prevent state migration, gracefully maintaining execution on the source and serving the viewport remotely.

