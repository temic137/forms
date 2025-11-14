"use client";

import { useEffect, useState } from "react";

interface ConversationalModeToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export default function ConversationalModeToggle({
  enabled,
  onChange
}: ConversationalModeToggleProps) {
  const [isEnabled, setIsEnabled] = useState(enabled);

  useEffect(() => {
    setIsEnabled(enabled);
  }, [enabled]);

  const handleToggle = () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    onChange(newValue);
  };

  return (
    <div
      className="card p-6"
      style={{
        borderRadius: 'var(--card-radius-lg)',
        borderStyle: 'dashed',
        borderWidth: '1px',
        borderColor: 'var(--card-border)',
        background: 'var(--card-bg)',
      }}
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-2xl">💬</span>
            <h3
              className="text-lg font-bold"
              style={{ color: 'var(--foreground)' }}
            >
              Conversational Mode
            </h3>
            <span
              className="badge shrink-0"
              style={{
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                borderColor: 'rgba(59, 130, 246, 0.4)',
                marginLeft: 'auto',
              }}
            >
              2-3x Higher Completion
            </span>
          </div>
          
          <p
            className="text-sm"
            style={{ color: 'var(--foreground-muted)' }}
          >
            Transform your form into a friendly chat conversation. Questions appear one at a time,
            making it feel like chatting with a friend instead of filling out a boring form.
          </p>

          <div className="space-y-3 text-sm">
            {[
              { title: "Higher completion rates", detail: "Users are 2-3x more likely to finish" },
              { title: "Mobile-friendly", detail: "Perfect for small screens" },
              { title: "Engaging", detail: "Feels modern and interactive" },
              { title: "Less intimidating", detail: "One question at a time" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span
                  className="font-bold"
                  style={{ color: 'var(--success)' }}
                >
                  ✓
                </span>
                <div className="space-y-1" style={{ color: 'var(--foreground)' }}>
                  <div className="font-semibold">{item.title}</div>
                  <div style={{ color: 'var(--foreground-muted)', fontSize: '0.875rem' }}>{item.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2">
          <button
            onClick={handleToggle}
            className="relative inline-flex h-9 w-16 items-center rounded-full transition-colors focus:outline-none"
            style={{
              background: isEnabled ? 'var(--accent)' : 'var(--divider)',
            }}
            role="switch"
            aria-checked={isEnabled}
          >
            <span
              className="inline-block h-7 w-7 transform rounded-full bg-white transition-transform"
              style={{
                transform: isEnabled ? 'translateX(28px)' : 'translateX(5px)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
              }}
            />
          </button>
          <span
            className="text-xs font-semibold uppercase tracking-wide"
            style={{
              color: isEnabled ? 'var(--accent)' : 'var(--foreground-muted)',
            }}
          >
            {isEnabled ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      {isEnabled && (
        <div className="notice notice-accent mt-6">
          <p className="text-xs">
            <strong>💡 Tip:</strong> Conversational mode works best with 3-15 questions. 
            It automatically handles validation and shows a progress indicator.
          </p>
        </div>
      )}
    </div>
  );
}

