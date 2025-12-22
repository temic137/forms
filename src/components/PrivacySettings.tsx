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
      <div className="min-h-screen flex items-center justify-center p-4 bg-white">
        <div className="card p-8 text-center max-w-md">
          <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2 text-gray-900">Sign In Required</h2>
          <p className="mb-4 text-gray-500">Sign in to manage your privacy settings.</p>
          <a
            href="/auth/signin"
            className="inline-block px-6 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 pt-24 bg-white">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-6 h-6 text-gray-600" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Privacy Settings</h1>
            <p className="text-sm text-gray-500">Manage your data and privacy preferences.</p>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`p-3 rounded-lg flex items-center justify-between mb-6 text-sm ${message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
              }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="font-bold">×</button>
          </div>
        )}

        {/* Data Summary */}
        {data && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-gray-900 mb-4">Your Data</h2>
            <div className="flex gap-8 mb-3">
              <div>
                <p className="text-2xl font-semibold text-gray-900">{data.dataSummary.formsCreated}</p>
                <p className="text-xs text-gray-500">Forms</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{data.dataSummary.submissionsReceived}</p>
                <p className="text-xs text-gray-500">Submissions</p>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Member since {new Date(data.user.memberSince).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="border-t border-gray-100 pt-6">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Data Actions</h2>

          <button
            onClick={handleExport}
            disabled={actionLoading === "export"}
            className="w-full flex items-center gap-3 py-3 text-left hover:bg-gray-50 transition rounded-lg"
          >
            {actionLoading === "export" ? (
              <Spinner size="sm" />
            ) : (
              <Download className="w-4 h-4 text-gray-500" />
            )}
            <span className="text-sm text-gray-900">Export My Data</span>
          </button>

          <button
            onClick={() => setShowDelete(!showDelete)}
            className="w-full flex items-center gap-3 py-3 text-left hover:bg-gray-50 transition rounded-lg"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
            <span className="text-sm text-gray-900">Delete Data</span>
          </button>

          {showDelete && (
            <div className="mt-4 py-4 border-t border-gray-100">
              <div className="space-y-2">
                <button
                  onClick={() => handleDelete("submissions")}
                  disabled={!!actionLoading}
                  className="w-full text-left py-2 px-3 rounded text-sm text-gray-700 hover:bg-gray-50"
                >
                  Delete all submissions
                </button>
                <button
                  onClick={() => handleDelete("forms")}
                  disabled={!!actionLoading}
                  className="w-full text-left py-2 px-3 rounded text-sm text-gray-700 hover:bg-gray-50"
                >
                  Delete all forms
                </button>
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <p className="text-xs font-medium mb-2 text-red-600">
                    Delete Account (Permanent)
                  </p>
                  <input
                    type="email"
                    placeholder="Type your email to confirm"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    className="w-full p-2 text-sm rounded border border-gray-200 bg-white text-gray-900 mb-2"
                  />
                  <button
                    onClick={() => handleDelete("account")}
                    disabled={!!actionLoading || !confirmEmail}
                    className="w-full py-2 rounded text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading === "account" ? "Deleting..." : "Delete My Account"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Privacy Policy Link */}
        <div className="text-center mt-8 pt-6 border-t border-gray-100">
          <a href="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
            Read our Privacy Policy →
          </a>
        </div>
      </div>
    </div>
  );
}
