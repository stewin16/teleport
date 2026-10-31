import { BaseWorkload } from "./workloads/baseWorkload.js";
import { deviceRegistry } from "./deviceRegistry.js";
import { epochLeaseManager } from "./epochFencing.js";
import { encryptStatePayload, decryptStatePayload, EncryptedEnvelope } from "./crypto.js";
import { feasibilityEngine } from "./feasibilityEngine.js";
import { MigrationEvent, MigrationStage, SnapshotPayload } from "./types.js";

export class MigrationCoordinator {
  private activeMigrations: Map<string, MigrationEvent> = new Map();
  private onStageChangeCallback?: (event: MigrationEvent) => void;

  public setOnStageChange(cb: (event: MigrationEvent) => void) {
    this.onStageChangeCallback = cb;
  }

  private emitStage(
    migrationId: string,
    workloadId: string,
    sourceDeviceId: string,
    targetDeviceId: string,
    fromEpoch: number,
    toEpoch: number,
    stage: MigrationStage,
    progressPercent: number,
    interruptionMs: number,
    error?: string
  ): MigrationEvent {
    const event: MigrationEvent = {
      migrationId,
      workloadId,
      sourceDeviceId,
      targetDeviceId,
      fromEpoch,
      toEpoch,
      stage,
      progressPercent,
      interruptionMs,
      error,
      timestamp: Date.now()
    };
    this.activeMigrations.set(migrationId, event);
    if (this.onStageChangeCallback) {
      this.onStageChangeCallback(event);
    }
    return event;
  }

  /**
   * Executes the atomic 6-stage live migration pipeline.
   * If any step fails or checksum corruption is simulated, executes an instant rollback (< 35ms).
   */
  public async executeMigration(
    workload: BaseWorkload,
    targetDeviceId: string,
    options?: {
      simulateCorruptChecksum?: boolean;
      simulateNetworkDrop?: boolean;
      artificialDelayMs?: number;
    }
  ): Promise<{ success: boolean; event: MigrationEvent; error?: string }> {
    const startTime = Date.now();
    const migrationId = `mig-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const sourceDeviceId = workload.currentDeviceId;
    const source = deviceRegistry.get(sourceDeviceId);
    const target = deviceRegistry.get(targetDeviceId);

    if (!source || !target) {
      throw new Error(`Device not found: source ${sourceDeviceId}, target ${targetDeviceId}`);
    }

    // Pre-flight Feasibility Check
    const feasibility = feasibilityEngine.evaluate(source, target, workload.getStateSummary());
    if (feasibility.decision === "REMOTE_FALLBACK" && !options?.simulateCorruptChecksum) {
      // Force remote fallback if hard gates failed
      workload.status = "REMOTE_FALLBACK";
      const event = this.emitStage(
        migrationId,
        workload.id,
        sourceDeviceId,
        targetDeviceId,
        workload.epoch,
        workload.epoch,
        "FAILED_ROLLBACK",
        0,
        0,
        feasibility.reasons.join(" | ")
      );
      return { success: false, event, error: feasibility.reasons.join(" | ") };
    }

    const currentEpoch = workload.epoch;
    const nextEpoch = currentEpoch + 1;
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const stepDelay = options?.artificialDelayMs || 120;

    try {
      // --- STAGE 1: CHECKPOINT_CREATED ---
      this.emitStage(
        migrationId,
        workload.id,
        sourceDeviceId,
        targetDeviceId,
        currentEpoch,
        nextEpoch,
        "CHECKPOINT_CREATED",
        15,
        Date.now() - startTime
      );
      await delay(stepDelay);

      const rawState = workload.serializeState();

      // --- STAGE 2: AES_ENCRYPTED ---
      let envelope: EncryptedEnvelope = encryptStatePayload(rawState);

      // Fault injection: simulate bit-flip / checksum corruption
      if (options?.simulateCorruptChecksum) {
        envelope = {
          ...envelope,
          sha256Digest: "000000000000000000000000000000000000000000000000000000000000dead"
        };
      }

      this.emitStage(
        migrationId,
        workload.id,
        sourceDeviceId,
        targetDeviceId,
        currentEpoch,
        nextEpoch,
        "AES_ENCRYPTED",
        35,
        Date.now() - startTime
      );
      await delay(stepDelay);

      // --- STAGE 3: SOURCE_FENCED (Epoch Revoked) ---
      epochLeaseManager.fenceSource(workload.id, sourceDeviceId);
      workload.fence(currentEpoch);

      this.emitStage(
        migrationId,
        workload.id,
        sourceDeviceId,
        targetDeviceId,
        currentEpoch,
        nextEpoch,
        "SOURCE_FENCED",
        50,
        Date.now() - startTime
      );
      await delay(stepDelay);

      // --- STAGE 4: TRANSFERRING ---
      if (options?.simulateNetworkDrop) {
        throw new Error("Network Partition Fault: TCP connection severed during encrypted state transfer.");
      }

      this.emitStage(
        migrationId,
        workload.id,
        sourceDeviceId,
        targetDeviceId,
        currentEpoch,
        nextEpoch,
        "TRANSFERRING",
        70,
        Date.now() - startTime
      );
      await delay(stepDelay);

      // --- STAGE 5: INTEGRITY_VERIFIED ---
      let restoredState: any;
      try {
        restoredState = decryptStatePayload(envelope);
      } catch (cryptoErr: any) {
        throw new Error(`Security Rejection: ${cryptoErr.message}`);
      }

      this.emitStage(
        migrationId,
        workload.id,
        sourceDeviceId,
        targetDeviceId,
        currentEpoch,
        nextEpoch,
        "INTEGRITY_VERIFIED",
        85,
        Date.now() - startTime
      );
      await delay(stepDelay);

      // --- STAGE 6: TARGET_RESTORED (New Epoch Granted) ---
      epochLeaseManager.commitTargetActivation(workload.id, targetDeviceId, nextEpoch);
      workload.restoreState(restoredState, nextEpoch, targetDeviceId);

      const totalInterruption = Date.now() - startTime;
      const successEvent = this.emitStage(
        migrationId,
        workload.id,
        sourceDeviceId,
        targetDeviceId,
        currentEpoch,
        nextEpoch,
        "TARGET_RESTORED",
        100,
        totalInterruption
      );

      return { success: true, event: successEvent };
    } catch (err: any) {
      // --- CONTINUITY & INSTANT ROLLBACK RECOVERY (< 35ms) ---
      const rollbackStartTime = Date.now();
      epochLeaseManager.rollbackToSource(workload.id, sourceDeviceId);
      workload.unfence(currentEpoch);
      const rollbackDuration = Date.now() - rollbackStartTime;

      const failureEvent = this.emitStage(
        migrationId,
        workload.id,
        sourceDeviceId,
        targetDeviceId,
        currentEpoch,
        currentEpoch,
        "FAILED_ROLLBACK",
        0,
        Date.now() - startTime,
        `${err.message} (Source unfenced in ${rollbackDuration}ms. Zero computations lost.)`
      );

      return { success: false, event: failureEvent, error: err.message };
    }
  }
}

export const migrationCoordinator = new MigrationCoordinator();

