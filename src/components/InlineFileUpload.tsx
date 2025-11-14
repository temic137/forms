"use client";

import { useState, useRef } from "react";
import { Upload, X, AlertCircle } from "lucide-react";

interface InlineFileUploadProps {
  onFileSelect: (file: File) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export default function InlineFileUpload({
  onFileSelect,
  onCancel,
  disabled = false,
}: InlineFileUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["csv", "json", "txt"].includes(extension)) {
      setError("Please select a CSV, JSON, or TXT file");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be less than 5MB");
      return;
    }

    onFileSelect(file);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json,.txt"
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="btn btn-secondary flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Select File
        </button>
        <button
          onClick={onCancel}
          disabled={disabled}
          className="btn btn-ghost"
        >
          Cancel
        </button>
        <span 
          className="text-sm"
          style={{ color: 'var(--foreground-subtle)' }}
        >
          CSV, JSON, or TXT (max 5MB)
        </span>
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

      <details className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
        <summary className="cursor-pointer hover:underline">View file format examples</summary>
        <div className="mt-2 space-y-2 pl-4">
          <div>
            <strong>CSV:</strong>
            <pre className="mt-1 text-xs p-2 rounded" style={{ background: 'var(--background-subtle)' }}>
{`label,type,required
Full Name,text,true
Email,email,true`}
            </pre>
          </div>
          <div>
            <strong>JSON:</strong>
            <pre className="mt-1 text-xs p-2 rounded" style={{ background: 'var(--background-subtle)' }}>
{`{"fields": [
  {"label": "Name", "type": "text"},
  {"label": "Email", "type": "email"}
]}`}
            </pre>
          </div>
        </div>
      </details>
    </div>
  );
}
