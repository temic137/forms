"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Shield, Download, Trash2 } from "lucide-react";
import { Spinner, PageSpinner } from "@/components/ui/Spinner";

interface PrivacyData {
  user: { name: string | null; email: string | null; memberSince: string };
  dataSummary: { formsCreated: number; submissionsReceived: number };
}

export default function PrivacySettings() {
  const { status } = useSession();
  const [data, setData] = useState<PrivacyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/user/privacy")
        .then(res => res.json())
        .then(setData)
        .catch(() => setMessage({ type: "error", text: "Failed to load data" }))
        .finally(() => setLoading(false));
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  const handleExport = async () => {
    setActionLoading("export");
    try {
      const res = await fetch("/api/user/privacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "export" }),
      });
      const result = await res.json();

      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-data-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setMessage({ type: "success", text: "Data exported!" });
    } catch {
      setMessage({ type: "error", text: "Export failed" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (type: "submissions" | "forms" | "account") => {
    setActionLoading(type);
    try {
      const res = await fetch("/api/user/privacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          options: {
            deleteSubmissions: type === "submissions" || type === "account",
            deleteForms: type === "forms" || type === "account",
            deleteAccount: type === "account",
            confirmEmail: type === "account" ? confirmEmail : undefined,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      if (type === "account") {
        window.location.href = "/";
      } else {
        setMessage({ type: "success", text: "Data deleted" });
        setShowDelete(false);
        const newData = await fetch("/api/user/privacy").then(r => r.json());
        setData(newData);
      }
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Delete failed" });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <PageSpinner />;
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-paper paper-texture font-paper">
        <div className="paper-card p-6 text-center max-w-sm w-full border-2 border-black/10">
          <Shield className="w-10 h-10 mx-auto mb-3 text-black/40" />
          <h2 className="text-lg font-bold mb-2 text-black">Sign In Required</h2>
          <p className="mb-4 text-black/60 text-sm">Sign in to manage your privacy settings.</p>
          <a
            href="/auth/signin"
            className="paper-button paper-button-primary inline-block px-5 py-2 rounded-lg font-bold text-sm"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 px-4 pt-20 bg-paper paper-texture font-paper">
      <div className="max-w-lg mx-auto flex flex-col items-center w-full">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 mb-6 text-center">
          <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center border border-black/10">
            <Shield className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black">Privacy Settings</h1>
            <p className="text-base text-black/60">Manage your data and privacy preferences.</p>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`p-3 rounded-xl flex items-center justify-between mb-5 text-sm font-bold w-full border-2 ${message.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
              }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="font-bold p-1 hover:bg-black/5 rounded-full">×</button>
          </div>
        )}

        {/* Data Summary */}
        {data && (
          <div className="mb-6 w-full text-center">
            <h2 className="text-base font-bold text-black mb-3">Your Data</h2>
            <div className="flex justify-center gap-6 mb-2">
              <div className="paper-card p-4 min-w-[100px] border-2 border-black/10">
                <p className="text-2xl font-bold text-black">{data.dataSummary.formsCreated}</p>
                <p className="text-xs font-bold text-black/50 uppercase tracking-wider">Forms</p>
              </div>
              <div className="paper-card p-4 min-w-[100px] border-2 border-black/10">
                <p className="text-2xl font-bold text-black">{data.dataSummary.submissionsReceived}</p>
                <p className="text-xs font-bold text-black/50 uppercase tracking-wider">Submissions</p>
              </div>
            </div>
            <p className="text-xs text-black/40 font-bold mt-2">
              Member since {new Date(data.user.memberSince).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="w-full max-w-md border-t-2 border-black/5 pt-6 flex flex-col items-center">
          <h2 className="text-base font-bold text-black mb-4">Data Actions</h2>

          <div className="w-full space-y-3">
            <button
              onClick={handleExport}
              disabled={actionLoading === "export"}
              className="paper-button w-full flex items-center justify-center gap-2 py-2.5 bg-white text-black border-2 border-black/10 hover:border-black/30 font-bold text-sm"
            >
              {actionLoading === "export" ? (
                <Spinner size="sm" variant="primary" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Export My Data</span>
            </button>

            <button
              onClick={() => setShowDelete(!showDelete)}
              className="paper-button w-full flex items-center justify-center gap-2 py-2.5 bg-white text-black border-2 border-black/10 hover:border-red-200 hover:text-red-600 font-bold text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Data</span>
            </button>
          </div>

          {showDelete && (
            <div className="mt-4 py-4 w-full border-t-2 border-black/5 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2 flex flex-col items-center">
                <button
                  onClick={() => handleDelete("submissions")}
                  disabled={!!actionLoading}
                  className="w-full text-center py-2 px-3 rounded-lg text-sm font-bold text-black/70 hover:bg-black/5 transition-colors"
                >
                  Delete all submissions
                </button>
                <button
                  onClick={() => handleDelete("forms")}
                  disabled={!!actionLoading}
                  className="w-full text-center py-2 px-3 rounded-lg text-sm font-bold text-black/70 hover:bg-black/5 transition-colors"
                >
                  Delete all forms
                </button>
                <div className="pt-4 mt-2 w-full border-t-2 border-black/5 flex flex-col items-center">
                  <p className="text-xs font-bold mb-2 text-red-600 uppercase tracking-wider">
                    Delete Account (Permanent)
                  </p>
                  <input
                    type="email"
                    placeholder="Type your email to confirm"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    className="paper-input w-full p-2 text-sm rounded-lg border-2 border-black/10 focus:border-red-500 bg-white text-black mb-3 text-center"
                  />
                  <button
                    onClick={() => handleDelete("account")}
                    disabled={!!actionLoading || !confirmEmail}
                    className="paper-button w-full py-2.5 rounded-lg text-sm font-bold bg-red-500 text-white border-2 border-red-600 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {actionLoading === "account" ? "Deleting..." : "Delete My Account"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Privacy Policy Link */}
        <div className="text-center mt-8 pt-6 border-t-2 border-black/5 w-full max-w-md">
          <a href="/privacy" className="text-sm font-bold text-black/40 hover:text-black transition-colors">
            Read our Privacy Policy →
          </a>
        </div>
      </div>
    </div>
  );
}
