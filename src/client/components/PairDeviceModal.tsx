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

  const joinUrl = `${window.location.protocol}//${window.location.host}/`;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-6">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Pair Physical Device to Fleet
              </h3>
              <p className="text-xs text-slate-400">
                Connect external laptops, tablets, or phones to test live migration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR CODE & JOIN LINK */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-center">
          <p className="text-xs text-slate-300">
            Open this URL on any secondary laptop, iPhone, or Android device on the same network:
          </p>
          <div className="flex items-center justify-center gap-2">
            <code className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-400 truncate max-w-xs">
              {joinUrl}
            </code>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs flex items-center gap-1 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* MANUAL SIMULATED REGISTRATION FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Or Register Custom Node Profile
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Device Name / Model:</label>
              <input
                type="text"
                placeholder="e.g. MacBook Air M2 or Surface Pro 9"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Operating System:</label>
                <select
                  value={os}
                  onChange={(e) => setOs(e.target.value as DeviceOS)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="macos">macOS</option>
                  <option value="windows">Windows</option>
                  <option value="linux">Linux</option>
                  <option value="ios">iOS</option>
                  <option value="android">Android</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">CPU Architecture:</label>
                <select
                  value={arch}
                  onChange={(e) => setArch(e.target.value as CPUArch)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="arm64">arm64 (Apple Silicon / Mobile)</option>
                  <option value="x86_64">x86_64 (Intel / AMD)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Total RAM (GB):</label>
                <input
                  type="number"
                  min="2"
                  max="128"
                  value={ramGB}
                  onChange={(e) => setRamGB(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Initial Battery %:</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={battery}
                  onChange={(e) => setBattery(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-98"
          >
            Register Device to Cluster
          </button>
        </form>

      </div>
    </div>
  );
};

