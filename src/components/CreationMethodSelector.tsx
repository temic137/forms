"use client";

import { Upload, FileJson, Camera } from "lucide-react";

export type CreationMethodInline = "prompt" | "file" | "json" | "scan";

interface CreationMethodSelectorProps {
  selectedMethod: CreationMethodInline;
  onMethodChange: (method: CreationMethodInline) => void;
  disabled?: boolean;
}

const methods = [
  {
    id: "prompt" as CreationMethodInline,
    label: "Text/Voice",
    icon: null, // No icon, it's the default
  },
  {
    id: "file" as CreationMethodInline,
    label: "Upload File",
    icon: Upload,
  },
  {
    id: "json" as CreationMethodInline,
    label: "Import JSON",
    icon: FileJson,
  },
  {
    id: "scan" as CreationMethodInline,
    label: "Scan Form",
    icon: Camera,
  },
];

export default function CreationMethodSelector({
  selectedMethod,
  onMethodChange,
  disabled = false,
}: CreationMethodSelectorProps) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span 
        className="text-sm font-medium shrink-0"
        style={{ color: 'var(--foreground-muted)' }}
      >
        Create from:
      </span>
      <div className="flex gap-2 flex-wrap">
        {methods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;
          
          return (
            <button
              key={method.id}
              onClick={() => onMethodChange(method.id)}
              disabled={disabled}
              className="px-3 py-1.5 text-sm rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: isSelected ? 'var(--accent-light)' : 'var(--card-bg)',
                borderColor: isSelected ? 'var(--accent)' : 'var(--card-border)',
                color: isSelected ? 'var(--accent)' : 'var(--foreground)',
              }}
              onMouseEnter={(e) => {
                if (!disabled && !isSelected) {
                  e.currentTarget.style.borderColor = 'var(--card-border-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'var(--card-border)';
                }
              }}
            >
              <span className="flex items-center gap-1.5">
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {method.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
