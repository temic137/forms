"use client";

import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { useToastContext } from "@/contexts/ToastContext";

interface GoogleSheetsIntegrationProps {
  formId: string;
}

export default function GoogleSheetsIntegration({ formId }: GoogleSheetsIntegrationProps) {
  const toast = useToastContext();
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [sheetName, setSheetName] = useState("Form Responses");
  const [hasIntegration, setHasIntegration] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Load existing integration
  useEffect(() => {
    loadIntegration();
    
    // Check for OAuth success in URL params
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth_success') === 'true' && params.get('formId') === formId) {
      toast?.success("✓ Google account connected! Now add your spreadsheet details.");
      // Reload integration to get OAuth tokens
      setTimeout(() => {
        loadIntegration();
      }, 500);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
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
          setIsConnected(!!config.accessToken);
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

  const handleConnectGoogle = () => {
    // Redirect to OAuth endpoint
    window.location.href = `/api/integrations/google-sheets/oauth?formId=${formId}`;
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
          {!isConnected && (
            <div
              className="p-3 rounded-lg"
              style={{
                background: 'rgba(66, 133, 244, 0.1)',
                border: '1px solid rgba(66, 133, 244, 0.25)',
              }}
            >
              <p
                className="text-xs mb-2"
                style={{ color: 'var(--foreground-muted)' }}
              >
                First, connect your Google account to authorize access to Google Sheets.
              </p>
              <button
                onClick={handleConnectGoogle}
                className="w-full px-3 py-2 text-sm rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                style={{
                  background: '#4285f4',
                  color: 'white',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#357ae8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#4285f4';
                }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Connect Google Account
              </button>
            </div>
          )}

          {isConnected && (
            <>
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
                  onChange={(e) => {
                    const value = e.target.value;
                    setSpreadsheetId(extractSpreadsheetId(value));
                  }}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                  style={{
                    background: 'var(--background-subtle)',
                    border: '1px solid var(--card-border)',
                    color: 'var(--foreground)',
                    '--tw-ring-color': 'var(--accent)',
                  } as CSSProperties}
                />
                <p
                  className="text-xs mt-1"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  Paste your Google Sheet URL or just the spreadsheet ID
                </p>
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
                <p
                  className="text-xs mt-1"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  Name of the sheet tab (default: "Form Responses")
                </p>
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
                {loading ? "Connecting..." : "Connect Sheet"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

