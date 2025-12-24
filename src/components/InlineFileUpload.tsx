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
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          Select File
        </button>
        <button
          onClick={onCancel}
          disabled={disabled}
          className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <span className="text-sm text-gray-500">
          CSV, JSON, or TXT (max 5MB)
        </span>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm p-3 rounded-lg border border-red-200 bg-red-50 text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <details className="text-sm text-gray-500">
        <summary className="cursor-pointer hover:text-gray-900 transition-colors">View file format examples</summary>
        <div className="mt-2 space-y-2 pl-4">
          <div>
            <strong className="text-gray-700 block text-xs mb-1">CSV:</strong>
            <pre className="text-[10px] p-2 rounded bg-gray-50 border border-gray-100 font-mono text-gray-600">
              {`label,type,required
Full Name,text,true
Email,email,true`}
            </pre>
          </div>
          <div>
            <strong className="text-gray-700 block text-xs mb-1">JSON:</strong>
            <pre className="text-[10px] p-2 rounded bg-gray-50 border border-gray-100 font-mono text-gray-600">
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
