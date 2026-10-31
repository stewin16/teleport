import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { WebSocketServer, WebSocket } from "ws";
import cors from "cors";
import dotenv from "dotenv";

import { deviceRegistry } from "./deviceRegistry.js";
import { feasibilityEngine } from "./feasibilityEngine.js";
import { epochLeaseManager } from "./epochFencing.js";
import { migrationCoordinator } from "./migrationCoordinator.js";
import { geminiExplainer } from "./geminiExplainer.js";
import { BaseWorkload } from "./workloads/baseWorkload.js";
import { MonteCarloWorkload } from "../shared/workloads/monteCarloWorkload.js";
import { YouTubeWorkload } from "../shared/workloads/youtubeWorkload.js";
import { NeuralWorkload } from "./workloads/neuralWorkload.js";
import { ContainerWorkload } from "./workloads/containerWorkload.js";
import { GpuWorkload } from "./workloads/gpuWorkload.js";
import { RemoteControlCommand } from "./types.js";
import { getSystemTelemetry } from "../shared/telemetry.js";
import { streamRelay } from "./streamRelay.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

// Physical node agent sockets
const agentSockets: Map<string, WebSocket> = new Map();

// Register local host machine as physical node 1
getSystemTelemetry().then((tel) => {
  deviceRegistry.register({
    id: "node-laptop-host",
    name: `Laptop A (${tel.hostname}) [HOST]`,
    os: tel.os,
    arch: tel.arch,
    cores: tel.cores,
    totalMemoryMB: tel.totalMemoryMB,
    freeMemoryMB: tel.freeMemoryMB,
    batteryLevel: tel.batteryLevel,
    isCharging: tel.isCharging,
    dischargeRate: tel.dischargeRate,
    rttMs: 2,
    bandwidthMbps: 350,
    isPhysical: true,
    isVirtual: false,
    hostname: tel.hostname
  });
}).catch(() => {});

// Active Workloads Collection
const workloads: Map<string, BaseWorkload> = new Map();
const monteCarlo = new MonteCarloWorkload("node-thinkpad-x1");
const youtube = new YouTubeWorkload("node-thinkpad-x1");
const neural = new NeuralWorkload("node-macbook-m3");
const container = new ContainerWorkload("node-ubuntu-server");
const gpu = new GpuWorkload("node-thinkpad-x1");

workloads.set(monteCarlo.id, monteCarlo);
workloads.set(youtube.id, youtube);
workloads.set(neural.id, neural);
workloads.set(container.id, container);
workloads.set(gpu.id, gpu);

// Initialize Epoch 1 leases
epochLeaseManager.initializeLease(monteCarlo.id, monteCarlo.currentDeviceId);
epochLeaseManager.initializeLease(youtube.id, youtube.currentDeviceId);
epochLeaseManager.initializeLease(neural.id, neural.currentDeviceId);
epochLeaseManager.initializeLease(container.id, container.currentDeviceId);
epochLeaseManager.initializeLease(gpu.id, gpu.currentDeviceId);

let activeWorkloadId = monteCarlo.id;

// WebSocket Broadcast Helper
function broadcast(type: string, data: any) {
  const message = JSON.stringify({ type, data, timestamp: Date.now() });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

// Hook migration coordinator events to WebSocket
migrationCoordinator.setOnStageChange((event) => {
  broadcast("MIGRATION_STAGE", event);
});

// Real remote handoff handler for connected physical agents
migrationCoordinator.setRemoteHandoffHandler(async (targetDeviceId, workload, envelope, nextEpoch) => {
  const targetWs = agentSockets.get(targetDeviceId);
  if (!targetWs) {
    // If not a connected physical agent (e.g. virtual node), allow coordinator to restore locally
    return true;
  }

  if (targetWs.readyState !== WebSocket.OPEN) {
    throw new Error(`Target physical agent ${targetDeviceId} connection is not open.`);
  }

  return new Promise<boolean>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Timeout awaiting TARGET_RESTORE_ACK from physical node ${targetDeviceId}`));
    }, 5000);

    const onMessage = (data: WebSocket.RawData) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "TARGET_RESTORE_ACK") {
          const ackData = msg.data || msg;
          if (ackData.workloadId === workload.id) {
            cleanup();
            if (ackData.success) {
              resolve(true);
            } else {
              reject(new Error(ackData.error || "Physical node restore failed"));
            }
          }
        }
      } catch {
        // ignore
      }
    };

    const cleanup = () => {
      clearTimeout(timeout);
      targetWs.off("message", onMessage);
    };

    targetWs.on("message", onMessage);

    targetWs.send(
      JSON.stringify({
        type: "TARGET_RESTORE_REQUEST",
        data: {
          workloadId: workload.id,
          workloadType: workload instanceof YouTubeWorkload ? "youtube_player" : "monte_carlo",
          envelope,
          newEpoch: nextEpoch
        }
      })
    );
  });
});

// Real-Time Execution Tick Loop (approx 7Hz / 150ms for smooth UI rendering)
setInterval(() => {
  for (const workload of workloads.values()) {
    if (
      (workload.status === "RUNNING" || workload.status === "REMOTE_FALLBACK") &&
      !agentSockets.has(workload.currentDeviceId)
    ) {
      workload.tick();
    }
  }

  const activeWorkload = workloads.get(activeWorkloadId);
  if (activeWorkload) {
    broadcast("WORKLOAD_TICK", {
      workload: activeWorkload.getStateSummary(),
      epoch: activeWorkload.epoch
    });
  }
}, 150);

// Background Device Heartbeat & Battery Drain Simulation (1Hz)
setInterval(() => {
  const devices = deviceRegistry.getAll();
  for (const d of devices) {
    if (d.isVirtual && !d.isCharging && d.dischargeRate > 0 && d.batteryLevel > 0) {
      d.batteryLevel = Math.max(0, +(d.batteryLevel - (d.dischargeRate / 3600)).toFixed(2));
    }
  }
  broadcast("DEVICES_UPDATE", devices);
}, 1000);

// --- REST API ENDPOINTS ---

app.get("/api/teleport/status", (req, res) => {
  res.json({
    status: "HEALTHY",
    version: "1.0.0",
    uptimeSeconds: process.uptime(),
    activeWorkloadId,
    connectedClients: wss.clients.size,
    physicalAgents: agentSockets.size
  });
});

app.get("/api/teleport/devices", (req, res) => {
  res.json({ devices: deviceRegistry.getAll() });
});

app.post("/api/teleport/devices/register", (req, res) => {
  try {
    const device = deviceRegistry.register(req.body);
    broadcast("DEVICES_UPDATE", deviceRegistry.getAll());
    res.json({ success: true, device });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/teleport/devices/chaos", (req, res) => {
  const { deviceId, ...chaos } = req.body;
  const updated = deviceRegistry.applyChaos(deviceId, chaos);
  if (!updated) {
    return res.status(404).json({ error: "Device not found" });
  }
  broadcast("CHAOS_ALERT", { deviceId, chaos });
  broadcast("DEVICES_UPDATE", deviceRegistry.getAll());
  res.json({ success: true, device: updated });
});

app.get("/api/teleport/workloads", (req, res) => {
  const list = Array.from(workloads.values()).map((w) => w.getStateSummary());
  res.json({ workloads: list, activeWorkloadId });
});

app.post("/api/teleport/workloads/select", (req, res) => {
  const { workloadId } = req.body;
  if (!workloads.has(workloadId)) {
    return res.status(404).json({ error: "Workload not found" });
  }
  activeWorkloadId = workloadId;
  res.json({ success: true, activeWorkloadId });
});

app.post("/api/teleport/workloads/action", (req, res) => {
  const { workloadId, action, payload } = req.body;
  const w = workloads.get(workloadId || activeWorkloadId);
  if (!w) return res.status(404).json({ error: "Workload not found" });

  if (agentSockets.has(w.currentDeviceId)) {
    const ws = agentSockets.get(w.currentDeviceId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "REMOTE_COMMAND", data: { action, payload, workloadId: w.id } }));
    }
  } else {
    if (action === "PAUSE") w.pause();
    else if (action === "RESUME") w.resume();
    else if (action === "SEEK" && w instanceof YouTubeWorkload && payload?.seconds !== undefined) {
      w.seekTo(payload.seconds);
    } else if (action === "RESET") {
      w.step = 0;
      w.status = "RUNNING";
    }
  }

  res.json({ success: true, workload: w.getStateSummary() });
});

app.post("/api/teleport/evaluate-feasibility", (req, res) => {
  const { sourceDeviceId, targetDeviceId, workloadId } = req.body;
  const source = deviceRegistry.get(sourceDeviceId);
  const target = deviceRegistry.get(targetDeviceId);
  const workload = workloads.get(workloadId || activeWorkloadId);

  if (!source || !target || !workload) {
    return res.status(400).json({ error: "Invalid source, target, or workload ID" });
  }

  const result = feasibilityEngine.evaluate(source, target, workload.getStateSummary());
  res.json({ result });
});

app.post("/api/teleport/migrate", async (req, res) => {
  const {
    targetDeviceId,
    workloadId,
    simulateCorruptChecksum,
    simulateNetworkDrop,
    artificialDelayMs
  } = req.body;

  const workload = workloads.get(workloadId || activeWorkloadId);
  if (!workload) {
    return res.status(404).json({ error: "Workload not found" });
  }

  // If source was executing on a remote physical node, notify it to fence immediately
  if (agentSockets.has(workload.currentDeviceId)) {
    const sourceWs = agentSockets.get(workload.currentDeviceId);
    if (sourceWs && sourceWs.readyState === WebSocket.OPEN) {
      sourceWs.send(
        JSON.stringify({
          type: "REVOKE_LEASE_COMMAND",
          data: {
            epoch: workload.epoch,
            workloadId: workload.id
          }
        })
      );
    }
  }

  const result = await migrationCoordinator.executeMigration(workload, targetDeviceId, {
    simulateCorruptChecksum: !!simulateCorruptChecksum,
    simulateNetworkDrop: !!simulateNetworkDrop,
    artificialDelayMs: artificialDelayMs || 150
  });

  res.json(result);
});

app.post("/api/teleport/explain", async (req, res) => {
  const { sourceDeviceId, targetDeviceId, workloadId } = req.body;
  const source = deviceRegistry.get(sourceDeviceId);
  const target = deviceRegistry.get(targetDeviceId);
  const workload = workloads.get(workloadId || activeWorkloadId);

  if (!source || !target || !workload) {
    return res.status(400).json({ error: "Invalid source, target, or workload" });
  }

  const evalResult = feasibilityEngine.evaluate(source, target, workload.getStateSummary());
  const audit = await geminiExplainer.explainDecision(
    evalResult,
    source,
    target,
    workload.getStateSummary()
  );

  res.json({ audit, evalResult });
});

app.post("/api/teleport/remote-command", (req, res) => {
  const command: RemoteControlCommand = req.body;
  const workload = workloads.get(command.workloadId || activeWorkloadId);

  if (!workload) {
    return res.status(404).json({ error: "Workload not found" });
  }

  if (agentSockets.has(workload.currentDeviceId)) {
    const ws = agentSockets.get(workload.currentDeviceId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "REMOTE_COMMAND", data: command }));
    }
  } else {
    if (command.action === "PAUSE") workload.pause();
    else if (command.action === "RESUME") workload.resume();
    else if (command.action === "SEEK" && workload instanceof YouTubeWorkload && command.payload?.seconds !== undefined) {
      workload.seekTo(command.payload.seconds);
    }
  }

  broadcast("REMOTE_COMMAND_EXECUTED", command);
  res.json({ success: true, command });
});

// Attach stream relay to HTTP server
streamRelay.attach(server);

// Hook remote input commands from stream relay to active workloads
streamRelay.onCommand((cmd) => {
  const workload = workloads.get(cmd.workloadId || activeWorkloadId);
  if (!workload) return;

  if (agentSockets.has(workload.currentDeviceId)) {
    const ws = agentSockets.get(workload.currentDeviceId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "REMOTE_COMMAND", data: cmd }));
    }
  } else {
    if (cmd.action === "PAUSE") workload.pause();
    else if (cmd.action === "RESUME") workload.resume();
    else if (cmd.action === "SEEK" && workload instanceof YouTubeWorkload && cmd.payload?.seconds !== undefined) {
      workload.seekTo(cmd.payload.seconds);
    }
  }
  broadcast("REMOTE_COMMAND_EXECUTED", cmd);
});

// WebSocket Connection Management
wss.on("connection", (ws) => {
  let boundDeviceId: string | null = null;
  const activeW = workloads.get(activeWorkloadId);

  ws.send(
    JSON.stringify({
      type: "INIT_STATE",
      data: {
        devices: deviceRegistry.getAll(),
        workloads: Array.from(workloads.values()).map((w) => w.getStateSummary()),
        activeWorkloadId,
        epoch: activeW?.epoch || 1
      }
    })
  );

  ws.on("message", (msg) => {
    try {
      const parsed = JSON.parse(msg.toString());

      if (parsed.type === "PHYSICAL_AGENT_REGISTER") {
        const { deviceId, name, telemetry } = parsed.data;
        boundDeviceId = deviceId;
        agentSockets.set(deviceId, ws);

        deviceRegistry.register({
          id: deviceId,
          name: name || `Laptop (${deviceId})`,
          os: telemetry.os,
          arch: telemetry.arch,
          cores: telemetry.cores,
          totalMemoryMB: telemetry.totalMemoryMB,
          freeMemoryMB: telemetry.freeMemoryMB,
          batteryLevel: telemetry.batteryLevel,
          isCharging: telemetry.isCharging,
          dischargeRate: telemetry.dischargeRate,
          rttMs: 10,
          bandwidthMbps: 150,
          isPhysical: true,
          isVirtual: false,
          hostname: telemetry.hostname
        });

        broadcast("DEVICES_UPDATE", deviceRegistry.getAll());
        console.log(`[COORDINATOR] Physical agent registered: ${deviceId} (${name})`);
      } else if (parsed.type === "PHYSICAL_AGENT_HEARTBEAT") {
        const { deviceId, telemetry } = parsed.data;
        deviceRegistry.updateHeartbeat(deviceId, telemetry);
      } else if (parsed.type === "AGENT_WORKLOAD_TICK") {
        const { workload: remoteSummary } = parsed.data;
        const localW = workloads.get(remoteSummary.id);
        if (localW) {
          localW.step = remoteSummary.step;
          localW.status = remoteSummary.status;
          broadcast("WORKLOAD_TICK", {
            workload: remoteSummary,
            epoch: parsed.data.epoch
          });
        }
      } else if (parsed.type === "CLIENT_HEARTBEAT" && parsed.deviceId) {
        deviceRegistry.updateHeartbeat(parsed.deviceId, parsed.telemetry);
      }
    } catch (e) {
      // ignore malformed ws messages
    }
  });

  ws.on("close", () => {
    if (boundDeviceId) {
      agentSockets.delete(boundDeviceId);
      deviceRegistry.setStatus(boundDeviceId, "OFFLINE");
      broadcast("DEVICES_UPDATE", deviceRegistry.getAll());
    }
  });
});

// Serve production frontend assets from dist if present
const distPath = path.resolve(process.cwd(), "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/ws")) {
      return next();
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
}

server.listen(PORT, () => {
  console.log(`[TELEPORT ORCHESTRATOR] Running on http://localhost:${PORT}`);
  console.log(`[TELEPORT WEBSOCKET] Listening on ws://localhost:${PORT}/ws`);
  console.log(`[TELEPORT STREAM] Listening on ws://localhost:${PORT}/ws/stream`);
});
