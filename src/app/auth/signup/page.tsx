"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import Link from "next/link";
import GoogleLoginButton from "@/components/GoogleLoginButton";

export default function SignUpPage() {
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
        // Use direct navigation for faster redirect
        window.location.href = "/dashboard";
      }
    } catch (error) {
      console.error("Sign up failed:", error);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen font-paper paper-texture flex items-center justify-center p-4 sm:p-6"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <h1 
            className="text-4xl sm:text-5xl font-bold mb-2 text-black"
          >
            Create Account
          </h1>
          <p className="text-xl text-gray-600">
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
                <div className="h-[2px] flex-1 bg-black" />
                <span className="text-sm uppercase tracking-wide font-bold text-black">
                  or continue with email
                </span>
                <div className="h-[2px] flex-1 bg-black" />
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {error && (
                <div 
                  className="paper-card p-3 text-base font-bold bg-red-50 text-black"
                >
                  {error}
                </div>
              )}

              <div>
                <label 
                  htmlFor="name" 
                  className="block text-base font-bold mb-2 text-black"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="paper-input w-full px-4 py-3 text-base"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label 
                  htmlFor="email" 
                  className="block text-base font-bold mb-2 text-black"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="paper-input w-full px-4 py-3 text-base"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label 
                  htmlFor="password" 
                  className="block text-base font-bold mb-2 text-black"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="paper-input w-full px-4 py-3 text-base"
                  placeholder="••••••••"
                  minLength={8}
                />
              </div>

              <div>
                <label 
                  htmlFor="confirmPassword" 
                  className="block text-base font-bold mb-2 text-black"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="paper-input w-full px-4 py-3 text-base"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="paper-button paper-button-primary w-full py-4 px-4 text-lg font-bold disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" variant="white" />
                    <span>Creating account...</span>
                  </div>
                ) : "Create Account"}
              </button>

              <div className="text-center mt-4">
                <p className="text-base text-gray-600">
                  Already have an account?{" "}
                  <Link 
                    href="/auth/signin" 
                    className="font-bold text-black underline"
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
