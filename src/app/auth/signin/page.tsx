"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import Link from "next/link";
import GoogleLoginButton from "@/components/GoogleLoginButton";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        // Use replace for faster navigation (no history entry)
        // and avoid router.refresh() which causes unnecessary re-validation
        window.location.href = "/dashboard";
      }
    } catch (error) {
      console.error("Sign in failed:", error);
      setError("An error occurred. Please try again.");
    } finally {
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
            Welcome Back
          </h1>
          <p className="text-xl text-gray-600">
            Sign in to manage your forms
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
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
                    <span>Signing in...</span>
                  </div>
                ) : "Sign In"}
              </button>

              <div className="text-center mt-4">
                <p className="text-base text-gray-600">
                  Don&apos;t have an account?{" "}
                  <Link 
                    href="/auth/signup" 
                    className="font-bold text-black underline"
                  >
                    Sign up
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
