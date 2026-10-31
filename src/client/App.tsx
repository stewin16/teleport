import React, { useState } from "react";
import { TopBar, NavTab } from "./components/TopBar";
import { DeviceFleetGrid } from "./components/DeviceFleetGrid";
import { WorkloadVisualizer } from "./components/WorkloadVisualizer";
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
  const [selectedTargetId, setSelectedTargetId] = useState<string>("node-macbook-m3");
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
    // Real browser battery telemetry
  });

  const sourceDevice = devices.find((d) => d.id === workload?.currentDeviceId);
  const isBatteryCritical = sourceDevice && !sourceDevice.isCharging && sourceDevice.batteryLevel <= 15;

  const handleWorkloadAction = (action: "PAUSE" | "RESUME" | "RESET") => {
    fetch("/api/teleport/workloads/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workloadId: workload?.id, action })
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
    <div className="min-h-screen bg-bedrock text-ink flex flex-col font-sans">
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
        <div className="w-full bg-danger-dim border-b border-danger-border px-4 py-2 text-xs text-danger">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-danger animate-pulse shrink-0" />
              <span className="font-medium text-ink">
                Critical power collapse alert: {sourceDevice?.name} battery is at {sourceDevice?.batteryLevel}%.
              </span>
              <span className="hidden md:inline text-ink-muted">
                Physics engine advises immediate workload evacuation before power depletion.
              </span>
            </div>
            <button
              onClick={() => handleInitiateMigration()}
              className="vantage-btn-primary py-1 px-3 text-xs bg-danger text-white hover:bg-danger-hover"
            >
              Evacuate workload
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

      {/* RESTRAINED FOOTER */}
      <footer className="w-full border-t border-rule py-4 px-6 text-xs text-ink-muted bg-surface/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>TELEPORT · Intelligent Cross-Device Workload Migration Platform · Bit N Build 2026 Finals</span>
          <span className="font-mono text-[11px] text-ink-faint">
            Monotonic Epoch Leases · AES-256-GCM State Vault · Sub-35ms Rollback
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
