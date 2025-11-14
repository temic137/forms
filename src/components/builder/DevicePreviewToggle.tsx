"use client";

import { useState } from "react";

export type DeviceType = "desktop" | "tablet" | "mobile";

interface DevicePreviewToggleProps {
  activeDevice: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
}

export default function DevicePreviewToggle({
  activeDevice,
  onDeviceChange,
}: DevicePreviewToggleProps) {
  const devices: { type: DeviceType; label: string; icon: string }[] = [
    { type: "desktop", label: "Desktop", icon: "🖥️" },
    { type: "tablet", label: "Tablet", icon: "📱" },
    { type: "mobile", label: "Mobile", icon: "📱" },
  ];

  return (
    <div className="flex gap-2 mb-6">
      {devices.map((device) => (
        <button
          key={device.type}
          onClick={() => onDeviceChange(device.type)}
          className={`
            px-4 py-2 text-sm font-normal rounded-full transition-all
            ${
              activeDevice === device.type
                ? "bg-black text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }
          `}
        >
          <span className="mr-2">{device.icon}</span>
          {device.label}
        </button>
      ))}
    </div>
  );
}
