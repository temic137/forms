"use client";

import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { useToast } from "@/components/Toast";

interface GoogleSheetsIntegrationProps {
  formId: string;
}

export default function GoogleSheetsIntegration({ formId }: GoogleSheetsIntegrationProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [sheetName, setSheetName] = useState("Form Responses");
  const [hasIntegration, setHasIntegration] = useState(false);

  // Load existing integration
  useEffect(() => {
    loadIntegration();
  }, [formId]);

  const loadIntegration = async () => {
    try {
      const response = await fetch(`/api/integrations/google-sheets?formId=${formId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.integration) {
          setHasIntegration(true);
          setEnabled(data.integration.enabled);
          const config = data.integration.config as any;
          setSpreadsheetId(config.spreadsheetId || "");
          setSheetName(config.sheetName || "Form Responses");
        }
      }
    } catch (error) {
      console.error("Error loading integration:", error);
    }
  };

  const handleSave = async () => {
    if (!spreadsheetId.trim() || !sheetName.trim()) {
      toast?.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/integrations/google-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId,
          spreadsheetId: spreadsheetId.trim(),
          sheetName: sheetName.trim(),
          enabled: true
        })
      });

      if (response.ok) {
        setEnabled(true);
        setHasIntegration(true);
        toast?.success("✓ Google Sheets integration enabled!");
      } else {
        const error = await response.json();
        toast?.error(error.error || "Failed to save integration");
      }
    } catch (error) {
      console.error("Error saving integration:", error);
      toast?.error("Failed to save integration");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/integrations/google-sheets?formId=${formId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setEnabled(false);
        setHasIntegration(false);
        setSpreadsheetId("");
        setSheetName("Form Responses");
        toast?.success("Google Sheets integration disabled");
      } else {
        toast?.error("Failed to disable integration");
      }
    } catch (error) {
      console.error("Error disabling integration:", error);
      toast?.error("Failed to disable integration");
    } finally {
      setLoading(false);
    }
  };

  const extractSpreadsheetId = (input: string) => {
    // Extract ID from URL or use as-is
    const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      return match[1];
    }
    return input;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">📊</span>
        <div>
          <h3
            className="text-sm font-semibold"
            style={{ color: 'var(--foreground)' }}
          >
            Google Sheets
          </h3>
          <p
            className="text-xs"
            style={{ color: 'var(--foreground-muted)' }}
          >
            Sync submissions automatically
          </p>
        </div>
      </div>

      {hasIntegration && enabled ? (
        <div
          className="p-3 rounded-lg"
          style={{
            background: 'rgba(52, 168, 83, 0.1)',
            border: '1px solid rgba(52, 168, 83, 0.25)',
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p
                className="text-sm font-medium mb-1"
                style={{ color: '#34a853' }}
              >
                ✓ Connected
              </p>
              <p
                className="text-xs"
                style={{ color: 'var(--foreground-muted)' }}
              >
                Sheet: <code
                  className="px-1.5 py-0.5 rounded text-xs"
                  style={{
                    background: 'var(--background-subtle)',
                    color: 'var(--foreground)',
                  }}
                >
                  {sheetName}
                </code>
              </p>
            </div>
            <button
              onClick={handleDisable}
              disabled={loading}
              className="text-xs underline transition-colors"
              style={{ color: 'var(--error)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--error-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--error)';
              }}
            >
              {loading ? "..." : "Disconnect"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: 'var(--foreground)' }}
            >
              Spreadsheet URL
            </label>
            <input
              type="text"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(extractSpreadsheetId(e.target.value))}
              placeholder="Paste Google Sheets URL..."
              className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
              style={{
                background: 'var(--background-subtle)',
                border: '1px solid var(--card-border)',
                color: 'var(--foreground)',
                '--tw-ring-color': 'var(--accent)',
              } as CSSProperties}
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: 'var(--foreground)' }}
            >
              Sheet Name
            </label>
            <input
              type="text"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              placeholder="Form Responses"
              className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
              style={{
                background: 'var(--background-subtle)',
                border: '1px solid var(--card-border)',
                color: 'var(--foreground)',
                '--tw-ring-color': 'var(--accent)',
              } as CSSProperties}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={loading || !spreadsheetId || !sheetName}
            className="w-full px-3 py-2 text-sm rounded-lg font-medium transition-all disabled:cursor-not-allowed"
            style={{
              background: loading || !spreadsheetId || !sheetName ? 'var(--background-subtle)' : 'var(--accent)',
              color: loading || !spreadsheetId || !sheetName ? 'var(--foreground-muted)' : 'var(--accent-dark)',
              opacity: loading || !spreadsheetId || !sheetName ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!(loading || !spreadsheetId || !sheetName)) {
                e.currentTarget.style.background = 'var(--accent-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (!(loading || !spreadsheetId || !sheetName)) {
                e.currentTarget.style.background = 'var(--accent)';
              }
            }}
          >
            {loading ? "Connecting..." : "Connect"}
          </button>
        </div>
      )}
    </div>
  );
}

