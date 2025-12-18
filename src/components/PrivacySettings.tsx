"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Shield, Download, Trash2, Loader } from "lucide-react";

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
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
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Privacy Settings</h1>
            <p className="text-gray-500">Manage your data and privacy preferences.</p>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div 
            className={`p-4 rounded-lg flex items-center justify-between border ${
              message.type === "success" 
                ? "bg-green-50 border-green-200 text-green-700" 
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="font-bold">×</button>
          </div>
        )}

        {/* Data Summary */}
        {data && (
          <div className="card p-6">
            <h2 className="font-semibold mb-4 text-gray-900">Your Data</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-2xl font-bold text-blue-600">{data.dataSummary.formsCreated}</p>
                <p className="text-sm text-gray-500">Forms</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-2xl font-bold text-blue-600">{data.dataSummary.submissionsReceived}</p>
                <p className="text-sm text-gray-500">Submissions</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Member since: {new Date(data.user.memberSince).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="card p-6">
          <h2 className="font-semibold mb-4 text-gray-900">Data Actions</h2>
          
          <button
            onClick={handleExport}
            disabled={actionLoading === "export"}
            className="w-full flex items-center gap-3 p-4 rounded-lg mb-3 border border-gray-200 hover:border-blue-300 hover:bg-gray-50 transition"
          >
            {actionLoading === "export" ? (
              <Loader className="w-5 h-5 animate-spin text-blue-600" />
            ) : (
              <Download className="w-5 h-5 text-blue-600" />
            )}
            <span className="font-medium text-gray-900">Export My Data</span>
          </button>

          <button
            onClick={() => setShowDelete(!showDelete)}
            className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-gray-50 transition"
          >
            <Trash2 className="w-5 h-5 text-red-600" />
            <span className="font-medium text-gray-900">Delete Data</span>
          </button>

          {showDelete && (
            <div className="mt-4 p-4 rounded-lg border border-red-200 bg-red-50">
              <div className="space-y-3">
                <button
                  onClick={() => handleDelete("submissions")}
                  disabled={!!actionLoading}
                  className="w-full text-left p-3 rounded border border-gray-200 bg-white hover:bg-gray-50 text-gray-900"
                >
                  Delete all submissions
                </button>
                <button
                  onClick={() => handleDelete("forms")}
                  disabled={!!actionLoading}
                  className="w-full text-left p-3 rounded border border-gray-200 bg-white hover:bg-gray-50 text-gray-900"
                >
                  Delete all forms
                </button>
                <div className="pt-3 border-t border-red-200">
                  <p className="text-sm font-medium mb-2 text-red-600">
                    Delete Account (Permanent)
                  </p>
                  <input
                    type="email"
                    placeholder="Type your email to confirm"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    className="w-full p-2 rounded mb-2 border border-gray-200 bg-white text-gray-900"
                  />
                  <button
                    onClick={() => handleDelete("account")}
                    disabled={!!actionLoading || !confirmEmail}
                    className="w-full p-2 rounded font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading === "account" ? "Deleting..." : "Delete My Account"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Privacy Policy Link */}
        <div className="text-center">
          <a href="/privacy" className="text-blue-600 hover:underline">
            Read our Privacy Policy →
          </a>
        </div>
      </div>
    </div>
  );
}
