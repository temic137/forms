"use client";

import { useState, useRef } from "react";
import { Camera, AlertCircle } from "lucide-react";

interface InlineDocumentScannerProps {
  onFileSelect: (file: File) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export default function InlineDocumentScanner({
  onFileSelect,
  onCancel,
  disabled = false,
}: InlineDocumentScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      setError("Please select an image (JPG, PNG, WebP) or PDF file");
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be less than 10MB");
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
          accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <Camera className="w-4 h-4" />
          Select Image/PDF
        </button>
        <button
          onClick={onCancel}
          disabled={disabled}
          className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <span className="text-sm text-gray-500">
          Image or PDF (max 10MB)
        </span>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm p-3 rounded-lg border border-red-200 bg-red-50 text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="text-xs p-3 rounded-lg bg-gray-50 text-gray-600 border border-gray-100">
        <strong className="block mb-1 text-gray-900">
          Tips for best results:
        </strong>
        • Use good lighting with no shadows or glare<br />
        • Ensure all text is clearly visible<br />
        • For PDFs, ensure text is selectable
      </div>
    </div>
  );
}
