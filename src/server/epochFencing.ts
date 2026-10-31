export interface LeaseRecord {
  workloadId: string;
  activeDeviceId: string;
  currentEpoch: number;
  fencedDevices: Set<string>;
  leaseGrantedAt: number;
}

export class EpochLeaseManager {
  private leases: Map<string, LeaseRecord> = new Map();

  /**
   * Initializes a workload lease under Epoch 1 for the designated device.
   */
  public initializeLease(workloadId: string, initialDeviceId: string): number {
    this.leases.set(workloadId, {
      workloadId,
      activeDeviceId: initialDeviceId,
      currentEpoch: 1,
      fencedDevices: new Set(),
      leaseGrantedAt: Date.now()
    });
    return 1;
  }

  public getCurrentEpoch(workloadId: string): number {
    return this.leases.get(workloadId)?.currentEpoch || 1;
  }

  public getActiveDevice(workloadId: string): string | undefined {
    return this.leases.get(workloadId)?.activeDeviceId;
  }

  /**
   * Checks if a device is authorized to execute and mutate state for a workload.
   */
  public isAuthorized(workloadId: string, deviceId: string, epoch: number): boolean {
    const record = this.leases.get(workloadId);
    if (!record) return false;
    return (
      record.activeDeviceId === deviceId &&
      record.currentEpoch === epoch &&
      !record.fencedDevices.has(deviceId)
    );
  }

  /**
   * Stage 1 of Migration: Revokes the lease from the source device and marks it as FENCED.
   * Returns the next epoch token (E + 1) reserved for the target.
   */
  public fenceSource(workloadId: string, sourceDeviceId: string): number {
    const record = this.leases.get(workloadId);
    if (!record) {
      this.initializeLease(workloadId, sourceDeviceId);
      return this.fenceSource(workloadId, sourceDeviceId);
    }

    record.fencedDevices.add(sourceDeviceId);
    const nextEpoch = record.currentEpoch + 1;
    return nextEpoch;
  }

  /**
   * Stage 2 of Migration: Atomically transfers authoritative execution to the target device
   * under the incremented monotonic epoch.
   */
  public commitTargetActivation(
    workloadId: string,
    targetDeviceId: string,
    newEpoch: number
  ): void {
    const record = this.leases.get(workloadId);
    if (!record) {
      throw new Error(`Lease not found for workload ${workloadId}`);
    }

    record.activeDeviceId = targetDeviceId;
    record.currentEpoch = newEpoch;
    record.leaseGrantedAt = Date.now();
  }

  /**
   * Emergency Rollback: Re-grants execution authorization back to the source device
   * within < 35ms if target verification fails.
   */
  public rollbackToSource(workloadId: string, sourceDeviceId: string): number {
    const record = this.leases.get(workloadId);
    if (!record) {
      return this.initializeLease(workloadId, sourceDeviceId);
    }

    record.fencedDevices.delete(sourceDeviceId);
    record.activeDeviceId = sourceDeviceId;
    record.leaseGrantedAt = Date.now();
    return record.currentEpoch;
  }
}

export const epochLeaseManager = new EpochLeaseManager();

