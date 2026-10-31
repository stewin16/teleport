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
import { MonteCarloWorkload } from "./workloads/monteCarloWorkload.js";
import { NeuralWorkload } from "./workloads/neuralWorkload.js";
import { ContainerWorkload } from "./workloads/containerWorkload.js";
import { GpuWorkload } from "./workloads/gpuWorkload.js";
import { RemoteControlCommand } from "./types.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

// Active Workloads Collection
const workloads: Map<string, BaseWorkload> = new Map();
const monteCarlo = new MonteCarloWorkload("node-thinkpad-x1");
const neural = new NeuralWorkload("node-macbook-m3");
const container = new ContainerWorkload("node-ubuntu-server");
const gpu = new GpuWorkload("node-thinkpad-x1");

workloads.set(monteCarlo.id, monteCarlo);
workloads.set(neural.id, neural);
workloads.set(container.id, container);
workloads.set(gpu.id, gpu);

// Initialize Epoch 1 leases
epochLeaseManager.initializeLease(monteCarlo.id, monteCarlo.currentDeviceId);
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

// Real-Time Execution Tick Loop (approx 7Hz / 150ms for smooth UI rendering)
setInterval(() => {
  for (const workload of workloads.values()) {
    if (workload.status === "RUNNING") {
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
    // If not charging and has a discharge rate, gradually simulate realistic battery drain
    if (!d.isCharging && d.dischargeRate > 0 && d.batteryLevel > 0) {
      // Small fractional decrement
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
    connectedClients: wss.clients.size
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
  const { workloadId, action } = req.body;
  const w = workloads.get(workloadId || activeWorkloadId);
  if (!w) return res.status(404).json({ error: "Workload not found" });

  if (action === "PAUSE") w.pause();
  else if (action === "RESUME") w.resume();
  else if (action === "RESET") {
    w.step = 0;
    w.status = "RUNNING";
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

  // Forward command to workload
  if (command.action === "PAUSE") workload.pause();
  else if (command.action === "RESUME") workload.resume();
  else if (command.action === "SET_PARAM" && command.payload) {
    // E.g. Adjust parameters
  }

  broadcast("REMOTE_COMMAND_EXECUTED", command);
  res.json({ success: true, command });
});

// WebSocket Connection Management
wss.on("connection", (ws) => {
  // Send initial cluster state upon connect
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
      if (parsed.type === "CLIENT_HEARTBEAT" && parsed.deviceId) {
        deviceRegistry.updateHeartbeat(parsed.deviceId, parsed.telemetry);
      }
    } catch (e) {
      // ignore malformed ws messages
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
});
