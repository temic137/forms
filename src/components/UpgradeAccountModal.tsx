"use client";

import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { X } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

interface UpgradeAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function UpgradeAccountModal({ isOpen, onClose }: UpgradeAccountModalProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/auth/migrate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Failed to upgrade account");
                setLoading(false);
                return;
            }

            setSuccess(true);

            // Sign out and sign back in with new credentials
            setTimeout(async () => {
                await signOut({ redirect: false });
                await signIn("credentials", {
                    email,
                    password,
                    redirect: true,
                    callbackUrl: "/dashboard",
                });
            }, 1500);
        } catch (error) {
            console.error("Upgrade failed:", error);
            setError("An error occurred. Please try again.");
            setLoading(false);
        }
    };

    const handleGoogleUpgrade = async () => {
        // Sign out first, then sign in with Google
        // The Google OAuth will create/link the account
        await signOut({ redirect: false });
        await signIn("google", { callbackUrl: "/dashboard" });
    };

    if (success) {
        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: 'rgba(0, 0, 0, 0.5)' }}
            >
                <div
                    className="w-full max-w-md rounded-xl p-6 text-center"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                        Account Upgraded!
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--foreground-muted)' }}>
                        Your account has been upgraded. Signing you in...
                    </p>
                    <Spinner size="sm" variant="primary" />
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.5)' }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b" style={{ borderColor: 'var(--card-border)' }}>
                    <div>
                        <h2 className="text-lg sm:text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                            Upgrade Your Account
                        </h2>
                        <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
                            Keep your forms forever
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg transition-colors hover:bg-gray-100"
                        style={{ color: 'var(--foreground-muted)' }}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 space-y-4">
                    {/* Info Banner */}
                    <div
                        className="p-3 rounded-lg text-sm"
                        style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}
                    >
                        <p style={{ color: '#3b82f6' }}>
                            ✨ All your forms will be preserved when you upgrade.
                        </p>
                    </div>

                    {/* Google Option */}
                    <button
                        onClick={handleGoogleUpgrade}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Continue with Google</span>
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1" style={{ background: 'var(--card-border)' }} />
                        <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--foreground-muted)' }}>
                            or with email
                        </span>
                        <div className="h-px flex-1" style={{ background: 'var(--card-border)' }} />
                    </div>

                    {/* Email Form */}
                    <form onSubmit={handleSubmit} className="space-y-3">
                        {error && (
                            <div
                                className="p-3 rounded-lg text-sm"
                                style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.2)'
                                }}
                            >
                                {error}
                            </div>
                        )}

                        <div>
                            <label
                                htmlFor="upgrade-name"
                                className="block text-sm font-medium mb-1.5"
                                style={{ color: 'var(--foreground)' }}
                            >
                                Name (optional)
                            </label>
                            <input
                                id="upgrade-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                style={{
                                    background: 'var(--background)',
                                    border: '1px solid var(--card-border)',
                                    color: 'var(--foreground)',
                                }}
                                placeholder="Your name"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="upgrade-email"
                                className="block text-sm font-medium mb-1.5"
                                style={{ color: 'var(--foreground)' }}
                            >
                                Email
                            </label>
                            <input
                                id="upgrade-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-3 py-2.5 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                style={{
                                    background: 'var(--background)',
                                    border: '1px solid var(--card-border)',
                                    color: 'var(--foreground)',
                                }}
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="upgrade-password"
                                className="block text-sm font-medium mb-1.5"
                                style={{ color: 'var(--foreground)' }}
                            >
                                Password
                            </label>
                            <input
                                id="upgrade-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                                className="w-full px-3 py-2.5 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                style={{
                                    background: 'var(--background)',
                                    border: '1px solid var(--card-border)',
                                    color: 'var(--foreground)',
                                }}
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="upgrade-confirm"
                                className="block text-sm font-medium mb-1.5"
                                style={{ color: 'var(--foreground)' }}
                            >
                                Confirm Password
                            </label>
                            <input
                                id="upgrade-confirm"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full px-3 py-2.5 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                style={{
                                    background: 'var(--background)',
                                    border: '1px solid var(--card-border)',
                                    color: 'var(--foreground)',
                                }}
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{
                                background: 'var(--foreground)',
                                color: 'var(--background)',
                            }}
                        >
                            {loading ? (
                                <>
                                    <Spinner size="sm" variant="white" />
                                    <span>Upgrading...</span>
                                </>
                            ) : "Upgrade Account"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
