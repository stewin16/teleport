export type DeviceOS = "macos" | "windows" | "linux" | "ios" | "android";
export type CPUArch = "x86_64" | "arm64";
export type DeviceStatus = "ONLINE" | "OFFLINE" | "FENCED" | "BUSY";

export interface Device {
  id: string;
  name: string;
  os: DeviceOS;
  arch: CPUArch;
  cores: number;
  totalMemoryMB: number;
  freeMemoryMB: number;
  batteryLevel: number;
  isCharging: boolean;
  dischargeRate: number;
  rttMs: number;
  bandwidthMbps: number;
  lastHeartbeat: number;
  status: DeviceStatus;
  isVirtual?: boolean;
}

export type WorkloadTier = "TIER_A_PORTABLE" | "TIER_B_CONTAINER" | "TIER_C_HARDWARE_LOCKED";

export type WorkloadType =
  | "monte_carlo"
  | "neural_net"
  | "container_criu"
  | "gpu_raytracer"
  | "youtube_player";

export type ExecutionStatus =
  | "RUNNING"
  | "PAUSED"
  | "MIGRATING"
  | "FENCED_STOPPED"
  | "REMOTE_FALLBACK"
  | "COMPLETED";

export interface WorkloadState {
  id: string;
  name: string;
  type: WorkloadType;
  tier: WorkloadTier;
  currentDeviceId: string;
  epoch: number;
  status: ExecutionStatus;
  memoryFootprintMB: number;
  step: number;
  metrics: {
    iteration: number;
    currentValue: number;
    variance?: number;
    loss?: number;
    fps?: number;
    progressPercent: number;
    lastTickTime: number;
  };
  stateData: Record<string, any>;
}

export interface FeasibilityGates {
  workloadTypeGate: boolean;
  isaCompatGate: boolean;
  runtimeCompatGate: boolean;
  ramHeadroomGate: boolean;
  networkAliveGate: boolean;
  allPassed: boolean;
}

export interface FeasibilityResult {
  sourceDeviceId: string;
  targetDeviceId: string;
  workloadId: string;
  decision: "MIGRATE" | "REMOTE_FALLBACK" | "KEEP_LOCAL";
  score: number;
  safetyMarginRatio: number;
  tteSeconds: number;
  ttmSeconds: number;
  estimatedInterruptionMs: number;
  gates: FeasibilityGates;
  reasons: string[];
  breakdown: {
    resourcesScore: number;
    safetyMarginScore: number;
    networkScore: number;
    downtimeScore: number;
  };
}

export type MigrationStage =
  | "IDLE"
  | "CHECKPOINT_CREATED"
  | "AES_ENCRYPTED"
  | "SOURCE_FENCED"
  | "TRANSFERRING"
  | "INTEGRITY_VERIFIED"
  | "TARGET_RESTORED"
  | "FAILED_ROLLBACK";

export interface MigrationEvent {
  migrationId: string;
  workloadId: string;
  sourceDeviceId: string;
  targetDeviceId: string;
  fromEpoch: number;
  toEpoch: number;
  stage: MigrationStage;
  progressPercent: number;
  interruptionMs: number;
  error?: string;
  timestamp: number;
}

