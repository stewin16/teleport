import React from "react";
import {
  Zap,
  Radio,
  Server,
  Activity,
  MonitorPlay,
  FileCode2,
  PlusCircle,
  ShieldCheck,
  Flame
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
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#090D16]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* ZONE 1: BRAND WORDMARK & MONOTONIC LEASE BADGE */}
        <div className="flex items-center gap-3 min-w-max">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-[#0F172A] rounded-[11px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white font-sans">
                TELEPORT
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                v1.2
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-tight hidden sm:block">
              Cross-Device Workload Continuity
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-800">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-live-pulse" />
              <span>EPOCH #{epoch}</span>
            </div>
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono border ${
                isConnected
                  ? "bg-slate-900/60 text-slate-300 border-slate-700/60"
                  : "bg-red-500/10 text-red-400 border-red-500/30"
              }`}
            >
              <Radio className={`w-3 h-3 ${isConnected ? "text-emerald-400 animate-pulse" : "text-red-400"}`} />
              <span className="capitalize">{isConnected ? "Live 10Hz" : "Disconnected"}</span>
            </div>
          </div>
        </div>

        {/* ZONE 2: 4 PRIMARY VIEW NAVIGATION TABS */}
        <nav className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 border border-slate-800/80 max-w-fit overflow-x-auto">
          <button
            onClick={() => onTabChange("console")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTab === "console"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Live Console</span>
          </button>

          <button
            onClick={() => onTabChange("feasibility")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTab === "feasibility"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Feasibility & Chaos</span>
          </button>

          <button
            onClick={() => onTabChange("remote")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTab === "remote"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/30 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <MonitorPlay className="w-3.5 h-3.5" />
            <span>Remote Viewport</span>
          </button>

          <button
            onClick={() => onTabChange("blueprint")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTab === "blueprint"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>18-Sec Spec</span>
          </button>
        </nav>

        {/* ZONE 3: ACTIONS & PAIRING LAUNCHER */}
        <div className="flex items-center gap-2 min-w-max">
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>{onlineCount} Nodes Active</span>
          </div>

          <button
            onClick={onOpenPairModal}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-medium transition-all shadow-sm active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Pair Device</span>
          </button>
        </div>

      </div>
    </header>
  );
};

