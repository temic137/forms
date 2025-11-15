"use client";

import { useState } from "react";
import { Globe, AlertCircle, ExternalLink } from "lucide-react";

interface InlineURLScraperProps {
  onURLSubmit: (url: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export default function InlineURLScraper({
  onURLSubmit,
  onCancel,
  disabled = false,
}: InlineURLScraperProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const validateURL = (urlString: string): boolean => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleSubmit = () => {
    setError(null);

    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    const trimmedUrl = url.trim();
    if (!validateURL(trimmedUrl)) {
      setError("Please enter a valid URL (must start with http:// or https://)");
      return;
    }

    onURLSubmit(trimmedUrl);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !disabled && url.trim()) {
      handleSubmit();
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label 
          htmlFor="url-input"
          className="block text-sm font-medium"
          style={{ color: 'var(--foreground)' }}
        >
          Enter website URL
        </label>
        <div className="relative">
          <Globe 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--foreground-muted)' }}
          />
          <input
            id="url-input"
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            onKeyPress={handleKeyPress}
            placeholder="https://example.com/form"
            disabled={disabled}
            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-all"
            style={{
              borderColor: error ? 'rgba(239, 68, 68, 0.3)' : undefined,
            }}
          />
        </div>
      </div>

      {error && (
        <div 
          className="flex items-start gap-2 text-sm p-3 rounded-lg border"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
          }}
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={!url.trim() || disabled}
          className="btn btn-primary flex items-center gap-2"
          style={{
            opacity: (!url.trim() || disabled) ? 0.5 : 1,
            cursor: (!url.trim() || disabled) ? 'not-allowed' : 'pointer',
          }}
        >
          <ExternalLink className="w-4 h-4" />
          Generate Form from URL
        </button>
        <button
          onClick={onCancel}
          disabled={disabled}
          className="btn btn-ghost"
        >
          Cancel
        </button>
        <span 
          className="text-sm ml-auto"
          style={{ color: 'var(--foreground-muted)' }}
        >
          Paste any website URL
        </span>
      </div>

      <details className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
        <summary className="cursor-pointer hover:underline">How it works</summary>
        <div className="mt-2 pl-4 space-y-2">
          <p>
            Our AI will analyze the website and automatically extract form fields and structure to create a new form.
          </p>
          <div className="space-y-1">
            <p className="font-medium" style={{ color: 'var(--foreground)' }}>Supported:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>HTML forms on any website</li>
              <li>Contact forms, surveys, and registration forms</li>
              <li>Forms with various field types (text, email, select, etc.)</li>
            </ul>
          </div>
        </div>
      </details>
    </div>
  );
}

