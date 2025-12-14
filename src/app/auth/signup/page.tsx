"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import Link from "next/link";
import GoogleLoginButton from "@/components/GoogleLoginButton";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create account");
        setLoading(false);
        return;
      }

      // Auto sign in after registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but sign in failed. Please try signing in.");
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      console.error("Sign up failed:", error);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{ background: 'var(--background)' }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <h1 
            className="text-2xl sm:text-3xl font-bold mb-2"
            style={{ color: 'var(--foreground)' }}
          >
            Create Account
          </h1>
          <p style={{ color: 'var(--foreground-muted)' }}>
            Start building forms with AI
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <GoogleLoginButton />
              <div className="flex items-center gap-2">
                <div className="h-px flex-1" style={{ background: 'var(--card-border)' }} />
                <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--foreground-muted)' }}>
                  or continue with email
                </span>
                <div className="h-px flex-1" style={{ background: 'var(--card-border)' }} />
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
                  htmlFor="name" 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--foreground)' }}
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg transition-all focus:outline-none focus:ring-2"
                  style={{
                    background: 'var(--background-subtle)',
                    border: '1px solid var(--card-border)',
                    color: 'var(--foreground)',
                  }}
                  placeholder="Your name"
                />
              </div>

              <div>
                <label 
                  htmlFor="email" 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--foreground)' }}
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg transition-all focus:outline-none focus:ring-2"
                  style={{
                    background: 'var(--background-subtle)',
                    border: '1px solid var(--card-border)',
                    color: 'var(--foreground)',
                  }}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label 
                  htmlFor="password" 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--foreground)' }}
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg transition-all focus:outline-none focus:ring-2"
                  style={{
                    background: 'var(--background-subtle)',
                    border: '1px solid var(--card-border)',
                    color: 'var(--foreground)',
                  }}
                  placeholder="••••••••"
                  minLength={8}
                />
              </div>

              <div>
                <label 
                  htmlFor="confirmPassword" 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--foreground)' }}
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg transition-all focus:outline-none focus:ring-2"
                  style={{
                    background: 'var(--background-subtle)',
                    border: '1px solid var(--card-border)',
                    color: 'var(--foreground)',
                  }}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center"
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
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" variant="white" />
                    <span>Creating account...</span>
                  </div>
                ) : "Create Account"}
              </button>

              <div className="text-center mt-4">
                <p style={{ color: 'var(--foreground-muted)' }}>
                  Already have an account?{" "}
                  <Link 
                    href="/auth/signin" 
                    className="font-medium"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
