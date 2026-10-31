import { useEffect, useState } from "react";

export interface LocalBatteryState {
  isSupported: boolean;
  level: number; // 0 - 100
  charging: boolean;
  dischargeRate: number; // % per hour
}

export function useBatteryTelemetry(
  onTelemetryUpdate?: (battery: LocalBatteryState) => void
) {
  const [batteryState, setBatteryState] = useState<LocalBatteryState>({
    isSupported: false,
    level: 100,
    charging: true,
    dischargeRate: 0
  });

  useEffect(() => {
    let batteryInstance: any = null;

    if ("getBattery" in navigator) {
      (navigator as any)
        .getBattery()
        .then((battery: any) => {
          batteryInstance = battery;

          const update = () => {
            const level = Math.round(battery.level * 100);
            const charging = battery.charging;
            // Estimated discharge rate based on dischargingTime if discharging
            let dischargeRate = 0;
            if (!charging && battery.dischargingTime && battery.dischargingTime !== Infinity) {
              const hoursRemaining = battery.dischargingTime / 3600;
              if (hoursRemaining > 0) {
                dischargeRate = +(level / hoursRemaining).toFixed(1);
              }
            } else if (!charging) {
              dischargeRate = 15; // default nominal laptop discharge % / hr
            }

            const newState: LocalBatteryState = {
              isSupported: true,
              level,
              charging,
              dischargeRate
            };

            setBatteryState(newState);
            if (onTelemetryUpdate) {
              onTelemetryUpdate(newState);
            }
          };

          update();

          battery.addEventListener("levelchange", update);
          battery.addEventListener("chargingchange", update);
          battery.addEventListener("dischargingtimechange", update);
        })
        .catch(() => {
          // not supported
        });
    }

    return () => {
      if (batteryInstance) {
        // cleanup listeners
      }
    };
  }, [onTelemetryUpdate]);

  return batteryState;
}

