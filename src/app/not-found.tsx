import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you are looking for could not be found.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: "var(--background)" }}
    >
      <div className="text-center max-w-md">
        <div
          className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{
            background: "var(--accent-light)",
            color: "var(--accent)",
          }}
        >
          <svg
            className="w-12 h-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1
          className="text-4xl font-bold mb-4"
          style={{ color: "var(--foreground)" }}
        >
          404
        </h1>

        <h2
          className="text-xl font-semibold mb-4"
          style={{ color: "var(--foreground)" }}
        >
          Page Not Found
        </h2>

        <p className="mb-8" style={{ color: "var(--foreground-muted)" }}>
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It may
          have been moved or deleted.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all hover:opacity-90"
            style={{
              background: "var(--accent)",
              color: "var(--accent-dark)",
            }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Go Home
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all hover:opacity-80"
            style={{
              border: "1px solid var(--card-border)",
              background: "var(--card-bg)",
              color: "var(--foreground)",
            }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
            Dashboard
          </Link>
        </div>

        <div className="mt-12 pt-6 border-t" style={{ borderColor: "var(--divider)" }}>
          <p
            className="text-sm"
            style={{ color: "var(--foreground-muted)" }}
          >
            Need help?{" "}
            <Link
              href="/"
              className="underline font-medium"
              style={{ color: "var(--foreground)" }}
            >
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
