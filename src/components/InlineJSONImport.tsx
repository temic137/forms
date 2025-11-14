"use client";

import { useState } from "react";
import { FileJson, AlertCircle, CheckCircle } from "lucide-react";

interface InlineJSONImportProps {
  onImport: (jsonData: any) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export default function InlineJSONImport({
  onImport,
  onCancel,
  disabled = false,
}: InlineJSONImportProps) {
  const [jsonInput, setJsonInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const exampleJSON = `{
  "title": "Contact Form",
  "fields": [
    {"label": "Name", "type": "text", "required": true},
    {"label": "Email", "type": "email", "required": true}
  ]
}`;

  const handleImport = () => {
    setError(null);

    if (!jsonInput.trim()) {
      setError("Please enter JSON data");
      return;
    }

    try {
      const data = JSON.parse(jsonInput);

      if (!data.fields || !Array.isArray(data.fields)) {
        throw new Error("JSON must contain a 'fields' array");
      }

      if (data.fields.length === 0) {
        throw new Error("Fields array cannot be empty");
      }

      onImport(data);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError(`Invalid JSON syntax: ${err.message}`);
      } else {
        setError(err instanceof Error ? err.message : "Invalid JSON structure");
      }
    }
  };

  const handleFormat = () => {
    try {
      const data = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(data, null, 2));
      setError(null);
    } catch {
      setError("Cannot format invalid JSON");
    }
  };

  return (
    <div className="space-y-3">
      <textarea
        value={jsonInput}
        onChange={(e) => {
          setJsonInput(e.target.value);
          setError(null);
        }}
        placeholder={exampleJSON}
        disabled={disabled}
        className="w-full h-40 px-3 py-2 text-sm font-mono rounded-lg border resize-none transition-colors"
        style={{
          background: 'var(--card-bg)',
          borderColor: 'var(--card-border)',
          color: 'var(--foreground)',
        }}
      />

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

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleImport}
            disabled={!jsonInput.trim() || disabled}
            className="btn btn-primary flex items-center gap-2"
          >
            <FileJson className="w-4 h-4" />
            Import JSON
          </button>
          <button
            onClick={handleFormat}
            disabled={!jsonInput.trim() || disabled}
            className="btn btn-secondary"
          >
            Format
          </button>
          <button
            onClick={onCancel}
            disabled={disabled}
            className="btn btn-ghost"
          >
            Cancel
          </button>
        </div>
        <button
          onClick={() => setJsonInput(exampleJSON)}
          className="btn btn-ghost text-sm"
          style={{ color: 'var(--foreground-muted)' }}
        >
          Use Example
        </button>
      </div>

      <details className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
        <summary className="cursor-pointer hover:underline">View JSON structure requirements</summary>
        <div className="mt-2 pl-4 space-y-1">
          <p>• <code className="px-1 rounded" style={{ background: 'var(--background-subtle)' }}>fields</code> (required): Array of field objects</p>
          <p>• <code className="px-1 rounded" style={{ background: 'var(--background-subtle)' }}>title</code> (optional): Form title</p>
          <p className="mt-2">Each field must have:</p>
          <p className="ml-4">• <code className="px-1 rounded" style={{ background: 'var(--background-subtle)' }}>label</code> (required)</p>
          <p className="ml-4">• <code className="px-1 rounded" style={{ background: 'var(--background-subtle)' }}>type</code> (optional, default: text)</p>
          <p className="ml-4">• <code className="px-1 rounded" style={{ background: 'var(--background-subtle)' }}>required</code> (optional, default: false)</p>
        </div>
      </details>
    </div>
  );
}
