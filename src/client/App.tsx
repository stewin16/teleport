import React, { useState } from "react";
import { TopBar, NavTab } from "./components/TopBar";
import { DeviceFleetGrid } from "./components/DeviceFleetGrid";
import { WorkloadVisualizer } from "./components/WorkloadVisualizer";
import { YouTubeTabPlayer } from "./components/YouTubeTabPlayer";
import { MigrationStepper } from "./components/MigrationStepper";
import { FeasibilityMatrix } from "./components/FeasibilityMatrix";
import { RemoteViewport } from "./components/RemoteViewport";
import { ChaosLab } from "./components/ChaosLab";
import { BlueprintExplorer } from "./components/BlueprintExplorer";
import { PairDeviceModal } from "./components/PairDeviceModal";
import { useTeleportWebSocket } from "./hooks/useTeleportWebSocket";
import { useBatteryTelemetry } from "./hooks/useBatteryTelemetry";
import { AlertTriangle, Zap, ShieldCheck } from "lucide-react";

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>("console");
  const [selectedTargetId, setSelectedTargetId] = useState<string>("node-thinkpad-x1");
  const [isPairModalOpen, setIsPairModalOpen] = useState<boolean>(false);
  const [isMigrating, setIsMigrating] = useState<boolean>(false);

  const {
    devices,
    workload,
    epoch,
    activeWorkloadId,
    migrationEvent,
    isConnected,
    chaosAlert
  } = useTeleportWebSocket();

  // Local Web Battery API telemetry hook
  useBatteryTelemetry((localBattery) => {
    // If running in browser with battery support, can update local node telemetry
  });

  const sourceDevice = devices.find((d) => d.id === workload?.currentDeviceId);
  const isBatteryCritical = sourceDevice && !sourceDevice.isCharging && sourceDevice.batteryLevel <= 15;

  const handleWorkloadAction = (action: "PAUSE" | "RESUME" | "RESET" | "SEEK", payload?: any) => {
    fetch("/api/teleport/workloads/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workloadId: workload?.id, action, payload })
    });
  };

  const handleSelectWorkloadType = (workloadId: string) => {
    fetch("/api/teleport/workloads/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workloadId })
    });
  };

  const handleInitiateMigration = (options?: { corruptChecksum?: boolean; networkDrop?: boolean }) => {
    if (!selectedTargetId || !workload) return;

    setIsMigrating(true);
    fetch("/api/teleport/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetDeviceId: selectedTargetId,
        workloadId: workload.id,
        simulateCorruptChecksum: options?.corruptChecksum,
        simulateNetworkDrop: options?.networkDrop,
        artificialDelayMs: 140
      })
    })
      .then((res) => res.json())
      .finally(() => {
        setIsMigrating(false);
      });
  };

  const handleRegisterDevice = (newDevice: any) => {
    fetch("/api/teleport/devices/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newDevice)
    });
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans">
      {/* 3-ZONE HEADER */}
      <TopBar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        epoch={epoch}
        isConnected={isConnected}
        onlineCount={devices.filter((d) => d.status === "ONLINE").length}
        onOpenPairModal={() => setIsPairModalOpen(true)}
      />

      {/* CRITICAL BATTERY EVACUATION BANNER */}
      {isBatteryCritical && (
        <div className="w-full bg-rose-600/20 border-b border-rose-500/40 px-4 py-2 flex items-center justify-between text-xs text-rose-200">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
              <span className="font-bold">
                CRITICAL POWER COLLAPSE ALERT: {sourceDevice?.name} battery is at {sourceDevice?.batteryLevel}%.
              </span>
              <span className="hidden md:inline text-rose-300">
                Physics engine recommends immediate migration or remote access fallback before power depletion.
              </span>
            </div>
            <button
              onClick={() => handleInitiateMigration()}
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] uppercase tracking-wider transition-all"
            >
              Evacuate Workload Now
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* VIEW 1: LIVE CONSOLE */}
        {currentTab === "console" && (
          <div className="space-y-6">
            {/* 6-Stage Migration Stepper (when active) */}
            <MigrationStepper migrationEvent={migrationEvent} />

            {/* YouTube Media Tab Player (when YouTube workload selected) */}
            {workload?.type === "youtube_player" && (
              <YouTubeTabPlayer
                workload={workload}
                onWorkloadAction={handleWorkloadAction}
                onInitiateMigration={() => handleInitiateMigration()}
                isMigrating={isMigrating}
              />
            )}

            {/* Active Computation Visualizer */}
            <WorkloadVisualizer
              workload={workload}
              devices={devices}
              selectedTargetId={selectedTargetId}
              onSelectTarget={setSelectedTargetId}
              onWorkloadAction={handleWorkloadAction}
              onSelectWorkloadType={handleSelectWorkloadType}
              onInitiateMigration={() => handleInitiateMigration()}
              isMigrating={isMigrating}
            />

            {/* Multi-Device Fleet Grid */}
            <DeviceFleetGrid
              devices={devices}
              workload={workload}
              selectedTargetId={selectedTargetId}
              onSelectTarget={setSelectedTargetId}
            />
          </div>
        )}

        {/* VIEW 2: FEASIBILITY MATRIX & CHAOS LAB */}
        {currentTab === "feasibility" && (
          <div className="space-y-6">
            <FeasibilityMatrix
              devices={devices}
              workload={workload}
              selectedTargetId={selectedTargetId}
              onSelectTarget={setSelectedTargetId}
            />

            <ChaosLab
              devices={devices}
              workload={workload}
              onTriggerMigrateWithFault={(fault) => handleInitiateMigration(fault)}
              onRefreshDevices={() => {}}
            />
          </div>
        )}

        {/* VIEW 3: REMOTE ACCESS VIEWPORT */}
        {currentTab === "remote" && (
          <div>
            <RemoteViewport
              workload={workload}
              devices={devices}
            />
          </div>
        )}

        {/* VIEW 4: 18-SECTION BLUEPRINT EXPLORER */}
        {currentTab === "blueprint" && (
          <div>
            <BlueprintExplorer />
          </div>
        )}

      </main>

      {/* PAIR PHYSICAL DEVICE MODAL */}
      <PairDeviceModal
        isOpen={isPairModalOpen}
        onClose={() => setIsPairModalOpen(false)}
        onRegisterDevice={handleRegisterDevice}
      />

      {/* FOOTER */}
      <footer className="w-full border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>TELEPORT · Intelligent Cross-Device Workload Migration Platform · Bit N Build 2026 Finals</span>
          <span className="font-mono text-[11px] text-slate-400">
            Real Multi-Node Distributed Architecture
          </span>
        </div>
      </footer>
    </div>
  );
};
export default App;
