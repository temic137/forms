"use client";

import { useState, useEffect } from "react";
import { X, UserPlus, Trash2, User, Mail } from "lucide-react";

interface Collaborator {
  id: string;
  email: string;
  user?: {
    name: string | null;
    image: string | null;
  };
  role: string;
}

interface CollaboratorModalProps {
  formId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CollaboratorModal({
  formId,
  isOpen,
  onClose,
}: CollaboratorModalProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (isOpen && formId) {
      fetchCollaborators();
    }
  }, [isOpen, formId]);

  const fetchCollaborators = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/forms/${formId}/collaborators`);
      if (!res.ok) throw new Error("Failed to fetch collaborators");
      const data = await res.json();
      setCollaborators(data);
    } catch (err) {
      setError("Could not load collaborators");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setInviting(true);
    setError(null);

    try {
      const res = await fetch(`/api/forms/${formId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to invite");

      setCollaborators([data, ...collaborators]);
      setEmail("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (collaboratorId: string) => {
    if (!confirm("Remove this collaborator?")) return;

    try {
      const res = await fetch(
        `/api/forms/${formId}/collaborators/${collaboratorId}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) throw new Error("Failed to remove");

      setCollaborators(collaborators.filter((c) => c.id !== collaboratorId));
    } catch (err) {
      setError("Could not remove collaborator");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      style={{ background: "rgba(11, 12, 14, 0.75)" }}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="max-w-md w-full"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          borderRadius: "var(--card-radius-lg)",
          boxShadow: "var(--card-shadow-hover)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--divider)" }}
        >
          <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
            Collaborators
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 transition-colors hover:bg-white/10"
            style={{ color: "var(--foreground-muted)" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Invite Form */}
          <form onSubmit={handleInvite} className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground-muted)" }}>
              Invite by Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="flex-1 px-3 py-2 rounded-lg text-sm bg-transparent border focus:outline-none focus:ring-1"
                style={{
                  borderColor: "var(--input-border)",
                  color: "var(--foreground)",
                }}
                required
              />
              <button
                type="submit"
                disabled={inviting}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-dark)",
                }}
              >
                {inviting ? "Inviting..." : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Invite
                  </>
                )}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </form>

          {/* List */}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {loading ? (
              <p className="text-center py-4" style={{ color: "var(--foreground-muted)" }}>Loading...</p>
            ) : collaborators.length === 0 ? (
              <p className="text-center py-4 text-sm" style={{ color: "var(--foreground-muted)" }}>
                No collaborators yet. Invite someone above.
              </p>
            ) : (
              collaborators.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  style={{ borderColor: "var(--divider)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                      {c.user?.image ? (
                        <img src={c.user.image} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <User className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                        {c.user?.name || c.email}
                      </p>
                      {c.user?.name && (
                        <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                          {c.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(c.id)}
                    className="p-1.5 rounded hover:bg-red-500/10 hover:text-red-500 transition-colors"
                    style={{ color: "var(--foreground-muted)" }}
                    title="Remove access"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


