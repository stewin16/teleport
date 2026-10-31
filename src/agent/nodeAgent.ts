import os from "os";
import { WebSocket } from "ws";
import { getSystemTelemetry } from "../shared/telemetry.js";
import { generateDeviceToken, decryptStatePayload, EncryptedEnvelope } from "../server/crypto.js";
import { BaseWorkload } from "../shared/workloads/baseWorkload.js";
import { MonteCarloWorkload } from "../shared/workloads/monteCarloWorkload.js";
import { YouTubeWorkload } from "../shared/workloads/youtubeWorkload.js";
import { WorkloadType, WorkloadState } from "../shared/types.js";

export interface NodeAgentConfig {
  coordinatorUrl: string;
  name?: string;
  deviceId?: string;
}

export class NodeAgent {
  public deviceId: string;
  public name: string;
  public token: string;
  public coordinatorUrl: string;
  public isConnected: boolean = false;
  public isExecuting: boolean = false;
  public currentEpoch: number = 1;
  public activeWorkloadId: string | null = null;

  private ws: WebSocket | null = null;
  private currentWorkload: BaseWorkload | null = null;
  private tickInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(config: NodeAgentConfig) {
    this.coordinatorUrl = config.coordinatorUrl;
    const cleanHostname = os.hostname().toLowerCase().replace(/[^a-z0-9]/g, "-");
    this.deviceId = config.deviceId || `node-${cleanHostname || "laptop-peer"}`;
    this.name = config.name || `Windows Laptop (${os.hostname()})`;
    this.token = generateDeviceToken(this.deviceId);
  }

  public handleLeaseGranted(
    workloadId: string,
    workloadType: WorkloadType,
    stateData: Record<string, any>,
    newEpoch: number
  ): BaseWorkload {
    this.stopExecutionLoop();

    let workload: BaseWorkload;
    if (workloadType === "youtube_player") {
      workload = new YouTubeWorkload(this.deviceId);
    } else {
      workload = new MonteCarloWorkload(this.deviceId);
    }

    workload.restoreState(stateData, newEpoch, this.deviceId);
    this.currentWorkload = workload;
    this.activeWorkloadId = workloadId;
    this.currentEpoch = newEpoch;
    this.isExecuting = true;

    this.startExecutionLoop();
    return workload;
  }

  public handleLeaseRevoked(revokedEpoch: number): Record<string, any> {
    if (!this.currentWorkload) {
      this.isExecuting = false;
      return {};
    }

    this.stopExecutionLoop();
    const snapshot = this.currentWorkload.fence(revokedEpoch);
    this.isExecuting = false;
    return snapshot;
  }

  public startExecutionLoop() {
    this.stopExecutionLoop();
    this.tickInterval = setInterval(() => {
      if (this.currentWorkload && this.currentWorkload.status === "RUNNING") {
        this.currentWorkload.tick();
        this.send("AGENT_WORKLOAD_TICK", {
          deviceId: this.deviceId,
          workload: this.currentWorkload.getStateSummary(),
          epoch: this.currentEpoch
        });
      }
    }, 150);
  }

  public stopExecutionLoop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  public async connect(): Promise<void> {
    const wsUrl = this.coordinatorUrl.replace(/^http/, "ws");
    console.log(`[NODE AGENT] Connecting to coordinator at ${wsUrl}...`);

    this.ws = new WebSocket(wsUrl);

    this.ws.on("open", async () => {
      this.isConnected = true;
      console.log(`[NODE AGENT] Connected. Handshaking as physical node ${this.deviceId} (${this.name})...`);

      const telemetry = await getSystemTelemetry();
      this.send("PHYSICAL_AGENT_REGISTER", {
        deviceId: this.deviceId,
        name: this.name,
        token: this.token,
        telemetry: {
          ...telemetry,
          isPhysical: true,
          isVirtual: false
        }
      });

      this.startHeartbeatLoop();
    });

    this.ws.on("message", (data: any) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleCoordinatorMessage(message);
      } catch (err: any) {
        console.error(`[NODE AGENT] Failed to parse message: ${err.message}`);
      }
    });

    this.ws.on("close", () => {
      this.isConnected = false;
      this.stopHeartbeatLoop();
      console.warn(`[NODE AGENT] Disconnected from coordinator. Reconnecting in 3s...`);
      setTimeout(() => this.connect(), 3000);
    });

    this.ws.on("error", (err) => {
      console.error(`[NODE AGENT] WebSocket error: ${err.message}`);
    });
  }

  private startHeartbeatLoop() {
    this.stopHeartbeatLoop();
    this.heartbeatInterval = setInterval(async () => {
      if (!this.isConnected) return;
      const telemetry = await getSystemTelemetry();
      this.send("PHYSICAL_AGENT_HEARTBEAT", {
        deviceId: this.deviceId,
        telemetry,
        timestamp: Date.now()
      });
    }, 1000);
  }

  private stopHeartbeatLoop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handleCoordinatorMessage(msg: { type: string; data: any }) {
    const { type, data } = msg;

    if (type === "TARGET_RESTORE_REQUEST") {
      // Incoming live migration
      const { envelope, newEpoch, workloadId, workloadType } = data;
      try {
        console.log(`[NODE AGENT] Decrypting incoming state snapshot for epoch #${newEpoch}...`);
        const stateData = decryptStatePayload(envelope as EncryptedEnvelope);
        this.handleLeaseGranted(workloadId, workloadType, stateData, newEpoch);

        this.send("TARGET_RESTORE_ACK", {
          success: true,
          workloadId,
          deviceId: this.deviceId,
          epoch: newEpoch
        });
        console.log(`[NODE AGENT] Successfully restored and executing workload at step ${stateData.step || stateData.currentTime}!`);
      } catch (err: any) {
        console.error(`[NODE AGENT] Target restore rejected: ${err.message}`);
        this.send("TARGET_RESTORE_ACK", {
          success: false,
          workloadId,
          deviceId: this.deviceId,
          error: err.message
        });
      }
    } else if (type === "REVOKE_LEASE_COMMAND") {
      const { epoch, workloadId } = data;
      console.log(`[NODE AGENT] Lease revoked for workload ${workloadId} (epoch ${epoch}). Freezing state...`);
      const snapshot = this.handleLeaseRevoked(epoch);
      this.send("FENCED_ACK", {
        workloadId,
        deviceId: this.deviceId,
        epoch,
        snapshot
      });
    } else if (type === "REMOTE_COMMAND" && this.currentWorkload) {
      const { action, payload } = data;
      if (action === "PAUSE") this.currentWorkload.pause();
      else if (action === "RESUME") this.currentWorkload.resume();
      else if (action === "SEEK" && this.currentWorkload instanceof YouTubeWorkload && payload?.seconds !== undefined) {
        this.currentWorkload.seekTo(payload.seconds);
      }
    }
  }

  public send(type: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data, timestamp: Date.now() }));
    }
  }
}

// CLI runner when executed directly
if (process.argv[1]?.endsWith("nodeAgent.ts") || process.argv[1]?.endsWith("nodeAgent.js")) {
  let coordinatorArg = "http://localhost:3000/ws";
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--coordinator=")) {
      coordinatorArg = arg.split("=")[1];
    }
  }

  // Ensure ws path
  if (!coordinatorArg.endsWith("/ws")) {
    coordinatorArg = coordinatorArg.replace(/\/+$/, "") + "/ws";
  }

  const agent = new NodeAgent({ coordinatorUrl: coordinatorArg });
  agent.connect();
}

