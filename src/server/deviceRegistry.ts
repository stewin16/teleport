import { Device, DeviceOS, CPUArch } from "./types.js";

export class DeviceRegistry {
  private devices: Map<string, Device> = new Map();

  constructor() {
    this.seedDefaultFleet();
  }

  private seedDefaultFleet() {
    const defaultNodes: Device[] = [
      {
        id: "node-macbook-m3",
        name: "MacBook Pro (Apple Silicon M3)",
        os: "macos",
        arch: "arm64",
        cores: 12,
        totalMemoryMB: 18432,
        freeMemoryMB: 10240,
        batteryLevel: 84,
        isCharging: false,
        dischargeRate: 12, // % / hr
        rttMs: 14,
        bandwidthMbps: 180,
        lastHeartbeat: Date.now(),
        status: "ONLINE",
        isVirtual: false
      },
      {
        id: "node-thinkpad-x1",
        name: "Lenovo ThinkPad X1 (Intel i7)",
        os: "windows",
        arch: "x86_64",
        cores: 16,
        totalMemoryMB: 32768,
        freeMemoryMB: 19450,
        batteryLevel: 38,
        isCharging: false,
        dischargeRate: 24, // % / hr -> drains fast under load
        rttMs: 19,
        bandwidthMbps: 140,
        lastHeartbeat: Date.now(),
        status: "ONLINE",
        isVirtual: false
      },
      {
        id: "node-pixel-mobile",
        name: "Google Pixel 9 Pro (Edge Mobile)",
        os: "android",
        arch: "arm64",
        cores: 8,
        totalMemoryMB: 16384,
        freeMemoryMB: 4800,
        batteryLevel: 19, // low battery demo candidate
        isCharging: false,
        dischargeRate: 18,
        rttMs: 38,
        bandwidthMbps: 45,
        lastHeartbeat: Date.now(),
        status: "ONLINE",
        isVirtual: false
      },
      {
        id: "node-ubuntu-server",
        name: "Ubuntu Cloud Worker (Linux x86_64)",
        os: "linux",
        arch: "x86_64",
        cores: 8,
        totalMemoryMB: 16384,
        freeMemoryMB: 12800,
        batteryLevel: 100,
        isCharging: true,
        dischargeRate: 0,
        rttMs: 22,
        bandwidthMbps: 350,
        lastHeartbeat: Date.now(),
        status: "ONLINE",
        isVirtual: true
      }
    ];

    for (const node of defaultNodes) {
      this.devices.set(node.id, node);
    }
  }

  public getAll(): Device[] {
    return Array.from(this.devices.values());
  }

  public get(id: string): Device | undefined {
    return this.devices.get(id);
  }

  public register(deviceData: Partial<Device> & { id: string; name: string }): Device {
    const existing = this.devices.get(deviceData.id);
    const updated: Device = {
      id: deviceData.id,
      name: deviceData.name,
      os: deviceData.os || "windows",
      arch: deviceData.arch || "x86_64",
      cores: deviceData.cores || 8,
      totalMemoryMB: deviceData.totalMemoryMB || 16384,
      freeMemoryMB: deviceData.freeMemoryMB || 8192,
      batteryLevel: deviceData.batteryLevel !== undefined ? deviceData.batteryLevel : 90,
      isCharging: deviceData.isCharging !== undefined ? deviceData.isCharging : true,
      dischargeRate: deviceData.dischargeRate || 0,
      rttMs: deviceData.rttMs || 15,
      bandwidthMbps: deviceData.bandwidthMbps || 100,
      lastHeartbeat: Date.now(),
      status: "ONLINE",
      isVirtual: deviceData.isVirtual || false
    };

    this.devices.set(updated.id, updated);
    return updated;
  }

  public updateHeartbeat(id: string, telemetry?: Partial<Device>): Device | undefined {
    const device = this.devices.get(id);
    if (!device) return undefined;

    device.lastHeartbeat = Date.now();
    device.status = "ONLINE";

    if (telemetry) {
      if (telemetry.batteryLevel !== undefined) device.batteryLevel = telemetry.batteryLevel;
      if (telemetry.isCharging !== undefined) device.isCharging = telemetry.isCharging;
      if (telemetry.dischargeRate !== undefined) device.dischargeRate = telemetry.dischargeRate;
      if (telemetry.freeMemoryMB !== undefined) device.freeMemoryMB = telemetry.freeMemoryMB;
      if (telemetry.rttMs !== undefined) device.rttMs = telemetry.rttMs;
      if (telemetry.bandwidthMbps !== undefined) device.bandwidthMbps = telemetry.bandwidthMbps;
    }

    return device;
  }

  public setStatus(id: string, status: Device["status"]): void {
    const device = this.devices.get(id);
    if (device) {
      device.status = status;
    }
  }

  /**
   * Chaos injection: adjust a device's telemetry on demand to test feasibility rules
   */
  public applyChaos(id: string, chaos: {
    batteryLevel?: number;
    dischargeRate?: number;
    isCharging?: boolean;
    freeMemoryMB?: number;
    rttMs?: number;
    bandwidthMbps?: number;
  }): Device | undefined {
    const device = this.devices.get(id);
    if (!device) return undefined;

    if (chaos.batteryLevel !== undefined) device.batteryLevel = chaos.batteryLevel;
    if (chaos.dischargeRate !== undefined) device.dischargeRate = chaos.dischargeRate;
    if (chaos.isCharging !== undefined) device.isCharging = chaos.isCharging;
    if (chaos.freeMemoryMB !== undefined) device.freeMemoryMB = chaos.freeMemoryMB;
    if (chaos.rttMs !== undefined) device.rttMs = chaos.rttMs;
    if (chaos.bandwidthMbps !== undefined) device.bandwidthMbps = chaos.bandwidthMbps;

    return device;
  }
}

export const deviceRegistry = new DeviceRegistry();

