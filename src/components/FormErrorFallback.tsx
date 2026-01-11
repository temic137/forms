"use client";

import React from "react";

export default function FormErrorFallback() {
  return (
    <div className="text-center py-12">
      <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
        Unable to load form
      </h2>
      <p className="mb-4" style={{ color: 'var(--foreground-muted)' }}>
        There was an error loading this form. Please try refreshing the page.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="btn btn-primary"
      >
        Refresh Page
      </button>
    </div>
  );
}
