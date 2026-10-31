import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { RemoteControlCommand } from "./types.js";

export interface StreamFrame {
  frameData: string; // Base64 image/webp data URL
  step: number;
  timestamp: number;
  width?: number;
  height?: number;
}

export class StreamRelay {
  private wss: WebSocketServer | null = null;
  private viewers: Set<WebSocket> = new Set();
  private broadcaster: WebSocket | null = null;
  private latestFrame: StreamFrame | null = null;
  private commandListeners: ((cmd: RemoteControlCommand) => void)[] = [];

  public attach(server: http.Server) {
    this.wss = new WebSocketServer({ noServer: true });

    server.on("upgrade", (request, socket, head) => {
      const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;

      if (pathname === "/ws/stream") {
        this.wss?.handleUpgrade(request, socket, head, (ws) => {
          this.wss?.emit("connection", ws, request);
        });
      }
    });

    this.wss.on("connection", (ws) => {
      this.viewers.add(ws);

      // Immediately send latest frame if available
      if (this.latestFrame) {
        ws.send(JSON.stringify({ type: "STREAM_FRAME", data: this.latestFrame }));
      }

      ws.on("message", (msg) => {
        try {
          const parsed = JSON.parse(msg.toString());
          if (parsed.type === "BROADCAST_FRAME") {
            this.broadcaster = ws;
            this.broadcastFrame(parsed.frameData, parsed.step, parsed.timestamp, parsed.width, parsed.height);
          } else if (parsed.type === "REMOTE_INPUT_COMMAND") {
            this.handleCommand(parsed.command);
          }
        } catch (e) {
          // ignore malformed frame data
        }
      });

      ws.on("close", () => {
        this.viewers.delete(ws);
        if (this.broadcaster === ws) {
          this.broadcaster = null;
        }
      });
    });
  }

  public broadcastFrame(frameData: string, step: number, timestamp: number, width?: number, height?: number) {
    this.latestFrame = { frameData, step, timestamp, width, height };
    const payload = JSON.stringify({
      type: "STREAM_FRAME",
      data: this.latestFrame
    });

    for (const client of this.viewers) {
      if (client !== this.broadcaster && client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  public handleCommand(cmd: RemoteControlCommand) {
    for (const listener of this.commandListeners) {
      listener(cmd);
    }

    // Forward command to broadcaster if active
    if (this.broadcaster && this.broadcaster.readyState === WebSocket.OPEN) {
      this.broadcaster.send(JSON.stringify({ type: "FORWARDED_REMOTE_COMMAND", command: cmd }));
    }
  }

  public onCommand(cb: (cmd: RemoteControlCommand) => void) {
    this.commandListeners.push(cb);
  }

  public getLatestFrame(): StreamFrame | null {
    return this.latestFrame;
  }
}

export const streamRelay = new StreamRelay();
