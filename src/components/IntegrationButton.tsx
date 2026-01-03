"use client";

import { useState, useCallback } from "react";
import { X, Plug } from "lucide-react";
import GoogleSheetsIntegration from "./GoogleSheetsIntegration";

interface IntegrationButtonProps {
  formId: string;
  label?: string;
}

export default function IntegrationButton({ formId, label = "Integrations" }: IntegrationButtonProps) {
  const [open, setOpen] = useState(false);

  const closeModal = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 w-full"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          color: "var(--foreground)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--card-bg-hover)";
          e.currentTarget.style.borderColor = "var(--card-border-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--card-bg)";
          e.currentTarget.style.borderColor = "var(--card-border)";
        }}
        aria-label={label}
      >
        <Plug className="w-4 h-4" />
        <span className="flex-1 text-left">{label}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
          style={{ background: "rgba(11, 12, 14, 0.75)" }}
          role="dialog"
          aria-modal="true"
          aria-label="Form integrations"
          onClick={closeModal}
        >
          <div
            className="max-w-lg w-full"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              borderRadius: "var(--card-radius-lg)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "var(--divider)" }}
            >
              <h2
                className="text-lg font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                Integrations
              </h2>
              <button
                onClick={closeModal}
                className="rounded-full p-1.5 transition-colors"
                style={{ color: "var(--foreground-muted)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--foreground)";
                  e.currentTarget.style.background = "var(--background-subtle)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--foreground-muted)";
                  e.currentTarget.style.background = "transparent";
                }}
                aria-label="Close integrations modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-4">
              <GoogleSheetsIntegration formId={formId} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}




