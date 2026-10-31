import React, { useState } from "react";
import { X, QrCode, Copy, Check, Plus, Laptop, Smartphone } from "lucide-react";
import { DeviceOS, CPUArch } from "../types/teleport";

interface PairDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterDevice: (device: {
    id: string;
    name: string;
    os: DeviceOS;
    arch: CPUArch;
    totalMemoryMB: number;
    freeMemoryMB: number;
    batteryLevel: number;
    isCharging: boolean;
  }) => void;
}

export const PairDeviceModal: React.FC<PairDeviceModalProps> = ({
  isOpen,
  onClose,
  onRegisterDevice
}) => {
  const [copied, setCopied] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [os, setOs] = useState<DeviceOS>("macos");
  const [arch, setArch] = useState<CPUArch>("arm64");
  const [ramGB, setRamGB] = useState(16);
  const [battery, setBattery] = useState(85);
  const [isCharging, setIsCharging] = useState(false);

  if (!isOpen) return null;

  const joinUrl = typeof window !== "undefined" ? `${window.location.protocol}//${window.location.host}/` : "http://localhost:5173/";

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName.trim()) return;

    onRegisterDevice({
      id: `node-${Date.now().toString(36)}`,
      name: deviceName.trim(),
      os,
      arch,
      totalMemoryMB: ramGB * 1024,
      freeMemoryMB: Math.round(ramGB * 1024 * 0.6),
      batteryLevel: battery,
      isCharging
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bedrock/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded vantage-panel bg-surface p-6 shadow-2xl space-y-6 ticks">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-rule pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-surface-elevated border border-rule text-signal">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-display font-medium text-ink">
                Pair physical device to fleet
              </h3>
              <p className="text-xs text-ink-muted">
                Connect real secondary laptops, tablets, or phones to test live migration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-elevated transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR CODE & JOIN LINK */}
        <div className="p-4 rounded bg-bedrock border border-rule space-y-3 text-center">
          <div className="flex items-center justify-center py-2">
            {/* High-fidelity Vector QR Representation */}
            <div className="p-3 bg-white rounded shadow-inner">
              <svg className="w-28 h-28" viewBox="0 0 100 100" fill="#0B0F17">
                {/* Position detection patterns */}
                <rect x="0" y="0" width="30" height="30" fill="none" stroke="#0B0F17" strokeWidth="8"/>
                <rect x="8" y="8" width="14" height="14"/>
                <rect x="70" y="0" width="30" height="30" fill="none" stroke="#0B0F17" strokeWidth="8"/>
                <rect x="78" y="8" width="14" height="14"/>
                <rect x="0" y="70" width="30" height="30" fill="none" stroke="#0B0F17" strokeWidth="8"/>
                <rect x="8" y="78" width="14" height="14"/>
                {/* Data modules */}
                <rect x="36" y="8" width="8" height="8"/>
                <rect x="48" y="16" width="8" height="8"/>
                <rect x="36" y="24" width="8" height="8"/>
                <rect x="8" y="36" width="8" height="8"/>
                <rect x="20" y="44" width="8" height="8"/>
                <rect x="36" y="36" width="12" height="12"/>
                <rect x="52" y="36" width="12" height="12"/>
                <rect x="68" y="40" width="8" height="8"/>
                <rect x="84" y="44" width="8" height="8"/>
                <rect x="44" y="52" width="12" height="12"/>
                <rect x="60" y="52" width="8" height="8"/>
                <rect x="76" y="52" width="8" height="8"/>
                <rect x="36" y="68" width="8" height="8"/>
                <rect x="48" y="76" width="12" height="12"/>
                <rect x="64" y="68" width="8" height="8"/>
                <rect x="80" y="76" width="12" height="12"/>
              </svg>
            </div>
          </div>
          <p className="text-xs text-ink-muted">
            Open this URL on any secondary device on the local Wi-Fi to pair instantly:
          </p>
          <div className="flex items-center justify-center gap-2">
            <code className="px-3 py-1.5 rounded bg-surface border border-rule text-xs font-mono text-signal truncate max-w-xs teleport-num">
              {joinUrl}
            </code>
            <button
              onClick={handleCopy}
              className="vantage-btn-primary py-1 px-2.5 text-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* MANUAL SIMULATED REGISTRATION FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2">
            <Plus className="w-3.5 h-3.5 text-signal" />
            <h4 className="text-xs font-display font-medium text-ink">
              Or configure custom node profile
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-ink-muted block mb-1">Device name / model:</label>
              <input
                type="text"
                placeholder="e.g. MacBook Air M2 or Surface Pro 9"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                required
                className="w-full bg-bedrock border border-rule rounded px-3 py-2 text-ink focus:outline-none focus:border-signal font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-ink-muted block mb-1">Operating system:</label>
                <select
                  value={os}
                  onChange={(e) => setOs(e.target.value as DeviceOS)}
                  className="w-full bg-bedrock border border-rule rounded px-3 py-2 text-ink focus:outline-none focus:border-signal"
                >
                  <option value="macos">macOS</option>
                  <option value="windows">Windows</option>
                  <option value="linux">Linux</option>
                  <option value="ios">iOS</option>
                  <option value="android">Android</option>
                </select>
              </div>

              <div>
                <label className="text-ink-muted block mb-1">CPU architecture:</label>
                <select
                  value={arch}
                  onChange={(e) => setArch(e.target.value as CPUArch)}
                  className="w-full bg-bedrock border border-rule rounded px-3 py-2 text-ink focus:outline-none focus:border-signal font-mono"
                >
                  <option value="arm64">arm64 (Apple Silicon / Mobile)</option>
                  <option value="x86_64">x86_64 (Intel / AMD)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-ink-muted block mb-1">Total RAM (GB):</label>
                <input
                  type="number"
                  min="2"
                  max="128"
                  value={ramGB}
                  onChange={(e) => setRamGB(Number(e.target.value))}
                  className="w-full bg-bedrock border border-rule rounded px-3 py-2 text-ink font-mono teleport-num"
                />
              </div>

              <div>
                <label className="text-ink-muted block mb-1">Initial battery (%):</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={battery}
                  onChange={(e) => setBattery(Number(e.target.value))}
                  className="w-full bg-bedrock border border-rule rounded px-3 py-2 text-ink font-mono teleport-num"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full vantage-btn-primary py-2 text-xs"
          >
            Register device to fleet
          </button>
        </form>

      </div>
    </div>
  );
};
