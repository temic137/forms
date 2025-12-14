"use client";

import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { useToast } from "@/components/ui/Toast";
import { extractDatabaseId } from "@/lib/notion";

interface NotionIntegrationProps {
  formId: string;
}

export default function NotionIntegration({ formId }: NotionIntegrationProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [databaseId, setDatabaseId] = useState("");
  const [hasIntegration, setHasIntegration] = useState(false);
  const [databaseTitle, setDatabaseTitle] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  // Load existing integration
  useEffect(() => {
    loadIntegration();
  }, [formId]);

  const loadIntegration = async () => {
    try {
      const response = await fetch(`/api/integrations/notion?formId=${formId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.integration) {
          setHasIntegration(true);
          setEnabled(data.integration.enabled);
          const config = data.integration.config as any;
          setApiKey(config.apiKey || "");
          setDatabaseId(config.databaseId || "");
          setDatabaseTitle(config.databaseTitle || "");
        }
      }
    } catch (error) {
      console.error("Error loading integration:", error);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast?.error("Please enter your Notion API key");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/integrations/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId,
          apiKey: apiKey.trim(),
          databaseId: databaseId.trim() ? extractDatabaseId(databaseId.trim()) : undefined,
          enabled: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        setEnabled(true);
        setHasIntegration(true);
        if (data.databaseTitle) {
          setDatabaseTitle(data.databaseTitle);
        }
        toast?.success("✓ Notion integration enabled!");
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
      const response = await fetch(`/api/integrations/notion?formId=${formId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setEnabled(false);
        setHasIntegration(false);
        setApiKey("");
        setDatabaseId("");
        setDatabaseTitle("");
        toast?.success("Notion integration disabled");
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">📝</span>
        <div>
          <h3
            className="text-sm font-semibold"
            style={{ color: 'var(--foreground)' }}
          >
            Notion
          </h3>
          <p
            className="text-xs"
            style={{ color: 'var(--foreground-muted)' }}
          >
            Sync submissions to Notion database
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
              {databaseTitle && (
                <p
                  className="text-xs"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  Database: <code
                    className="px-1.5 py-0.5 rounded text-xs"
                    style={{
                      background: 'var(--background-subtle)',
                      color: 'var(--foreground)',
                    }}
                  >
                    {databaseTitle}
                  </code>
                </p>
              )}
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
          {!showApiKeyInput ? (
            <>
              <button
                onClick={() => {
                  // Open Notion integrations in new tab
                  window.open('https://www.notion.so/my-integrations', '_blank');
                  // Show API key input after a moment
                  setTimeout(() => setShowApiKeyInput(true), 500);
                }}
                className="w-full px-4 py-3 text-sm rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--accent-dark)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--accent)';
                }}
              >
                <span>📝</span>
                Connect Notion
              </button>
              <p className="text-xs text-center" style={{ color: 'var(--foreground-muted)' }}>
                Click above → Create integration → Copy token → Paste below
              </p>
            </>
          ) : null}

          {showApiKeyInput && (
            <>
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: 'var(--foreground)' }}
                >
                  Paste your Notion token here
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="ntn_abc123..."
                  autoFocus
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
                disabled={loading || !apiKey}
                className="w-full px-3 py-2 text-sm rounded-lg font-medium transition-all disabled:cursor-not-allowed"
                style={{
                  background: loading || !apiKey ? 'var(--background-subtle)' : 'var(--accent)',
                  color: loading || !apiKey ? 'var(--foreground-muted)' : 'var(--accent-dark)',
                  opacity: loading || !apiKey ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!(loading || !apiKey)) {
                    e.currentTarget.style.background = 'var(--accent-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(loading || !apiKey)) {
                    e.currentTarget.style.background = 'var(--accent)';
                  }
                }}
              >
                {loading ? "Connecting..." : "✓ Done"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

