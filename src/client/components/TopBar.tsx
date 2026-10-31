import React from "react";
import {
  Zap,
  Radio,
  Server,
  Activity,
  MonitorPlay,
  FileCode2,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export type NavTab = "console" | "feasibility" | "remote" | "blueprint";

interface TopBarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  epoch: number;
  isConnected: boolean;
  onlineCount: number;
  onOpenPairModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onTabChange,
  epoch,
  isConnected,
  onlineCount,
  onOpenPairModal
}) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-rule bg-bedrock/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* BRAND & LEASE BADGE */}
        <div className="flex items-center gap-3.5 min-w-max">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-surface-elevated border border-rule-strong shadow-sm">
            <Zap className="w-4 h-4 text-signal" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-sm tracking-tight text-ink">
                TELEPORT
              </span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-surface border border-rule text-ink-muted">
                v1.2
              </span>
            </div>
            <p className="text-[11px] text-ink-faint hidden sm:block">
              Cross-Device Workload Continuity Engine
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-rule">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-signal-dim border border-signal-border text-signal text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-signal animate-signal-pulse" />
              <span>epoch #{epoch}</span>
            </div>
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono border ${
                isConnected
                  ? "bg-surface text-ink-muted border-rule"
                  : "bg-danger-dim text-danger border-danger-border"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-signal" : "bg-danger"}`} />
              <span>{isConnected ? "10Hz live" : "disconnected"}</span>
            </div>
          </div>
        </div>

        {/* 4 VIEW NAVIGATION TABS */}
        <nav className="flex items-center gap-1 p-1 rounded-lg bg-surface border border-rule max-w-fit overflow-x-auto">
          <button
            onClick={() => onTabChange("console")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              currentTab === "console"
                ? "bg-surface-elevated text-signal font-semibold border border-rule-strong shadow-sm"
                : "text-ink-muted hover:text-ink hover:bg-surface-hover"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Console</span>
          </button>

          <button
            onClick={() => onTabChange("feasibility")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              currentTab === "feasibility"
                ? "bg-surface-elevated text-signal font-semibold border border-rule-strong shadow-sm"
                : "text-ink-muted hover:text-ink hover:bg-surface-hover"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Feasibility & Chaos</span>
          </button>

          <button
            onClick={() => onTabChange("remote")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              currentTab === "remote"
                ? "bg-surface-elevated text-warn font-semibold border border-rule-strong shadow-sm"
                : "text-ink-muted hover:text-ink hover:bg-surface-hover"
            }`}
          >
            <MonitorPlay className="w-3.5 h-3.5" />
            <span>Remote Viewport</span>
          </button>

          <button
            onClick={() => onTabChange("blueprint")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              currentTab === "blueprint"
                ? "bg-surface-elevated text-signal font-semibold border border-rule-strong shadow-sm"
                : "text-ink-muted hover:text-ink hover:bg-surface-hover"
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>18-Section Spec</span>
          </button>
        </nav>

        {/* ACTIONS & PAIRING LAUNCHER */}
        <div className="flex items-center gap-2.5 min-w-max">
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-ink-muted px-2.5 py-1 rounded bg-surface border border-rule">
            <span className="w-2 h-2 rounded-full bg-signal" />
            <span className="teleport-num">{onlineCount}</span>
            <span>nodes active</span>
          </div>

          <button
            onClick={onOpenPairModal}
            className="vantage-btn-primary py-1.5 px-3 text-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Pair Node</span>
          </button>
        </div>

      </div>
    </header>
  );
};
