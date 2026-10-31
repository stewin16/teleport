import { useEffect, useState, useRef, useCallback } from "react";
import { Device, WorkloadState, MigrationEvent } from "../types/teleport";

export function useTeleportWebSocket() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [workload, setWorkload] = useState<WorkloadState | null>(null);
  const [epoch, setEpoch] = useState<number>(1);
  const [activeWorkloadId, setActiveWorkloadId] = useState<string>("workload-monte-carlo-var");
  const [migrationEvent, setMigrationEvent] = useState<MigrationEvent | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [chaosAlert, setChaosAlert] = useState<any>(null);

  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname === "localhost" ? "localhost:3000" : window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    let reconnectTimer: NodeJS.Timeout;

    function connect() {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          const { type, data } = parsed;

          if (type === "INIT_STATE") {
            if (data.devices) setDevices(data.devices);
            if (data.activeWorkloadId) setActiveWorkloadId(data.activeWorkloadId);
            if (data.epoch) setEpoch(data.epoch);
            if (data.workloads && data.workloads.length > 0) {
              const current = data.workloads.find((w: any) => w.id === data.activeWorkloadId) || data.workloads[0];
              setWorkload(current);
            }
          } else if (type === "WORKLOAD_TICK") {
            if (data.workload) setWorkload(data.workload);
            if (data.epoch) setEpoch(data.epoch);
          } else if (type === "DEVICES_UPDATE") {
            setDevices(data);
          } else if (type === "MIGRATION_STAGE") {
            setMigrationEvent(data);
          } else if (type === "CHAOS_ALERT") {
            setChaosAlert(data);
          }
        } catch (e) {
          // ignore
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimer = setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (socketRef.current) {
        const ws = socketRef.current;
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        } else if (ws.readyState === WebSocket.CONNECTING) {
          ws.onopen = () => {
            ws.close();
          };
        }
      }
    };
  }, []);

  const sendCommand = useCallback((type: string, data: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, data }));
    }
  }, []);

  return {
    devices,
    workload,
    epoch,
    activeWorkloadId,
    migrationEvent,
    isConnected,
    chaosAlert,
    sendCommand
  };
}

