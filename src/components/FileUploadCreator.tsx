"use client";

import { useState, useRef, CSSProperties } from "react";
import { Upload, X, FileText, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { Field } from "@/types/form";

interface FileUploadCreatorProps {
  onFormGenerated: (title: string, fields: Field[]) => void;
  onCancel?: () => void;
}

type FileType = "csv" | "json" | "txt" | "xlsx";

export default function FileUploadCreator({
  onFormGenerated,
  onCancel,
}: FileUploadCreatorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = {
    csv: "text/csv",
    json: "application/json",
    txt: "text/plain",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    setSuccess(false);

    // Check file type
    const extension = file.name.split(".").pop()?.toLowerCase() as FileType;
    if (!extension || !acceptedTypes[extension]) {
      setError("Invalid file type. Please upload a CSV, JSON, TXT, or Excel file.");
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB.");
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/ai/import-file", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process file");
      }

      const data = await response.json();
      
      // Normalize fields
      const normalizedFields: Field[] = data.fields.map((f: Partial<Field>, idx: number) => ({
        id: f.id || `field_${Date.now()}_${idx}`,
        label: f.label || "Field",
        type: f.type || "text",
        required: f.required || false,
        options: f.options || [],
        order: idx,
        conditionalLogic: [],
      }));

      setSuccess(true);
      setTimeout(() => {
        onFormGenerated(data.title || "Imported Form", normalizedFields);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const dropZoneActive = isDragging || Boolean(selectedFile);
  const dropZoneStyle: CSSProperties = {
    borderColor: dropZoneActive ? 'var(--accent)' : 'var(--card-border)',
    background: dropZoneActive ? 'var(--accent-light)' : 'var(--background-subtle)',
    color: 'var(--foreground)',
    boxShadow: dropZoneActive ? 'var(--card-shadow-hover)' : 'none',
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div 
        className="card overflow-hidden"
        style={{ borderRadius: 'var(--card-radius-lg)' }}
      >
        {/* Header */}
        <div
          className="px-6 py-4"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.9))',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Upload className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">Upload Form File</h2>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="rounded-lg p-2 transition-colors"
                style={{ color: 'rgba(255,255,255,0.85)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                }}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Supported formats info */}
          <div className="notice notice-accent">
            <h3 className="font-semibold mb-2 flex items-center" style={{ color: 'var(--accent)' }}>
              <FileText className="w-4 h-4 mr-2" />
              Supported File Formats
            </h3>
            <ul className="text-sm space-y-1" style={{ color: 'var(--accent)' }}>
              <li>• <strong>CSV</strong> - Comma-separated values with headers</li>
              <li>• <strong>JSON</strong> - Form structure in JSON format</li>
              <li>• <strong>TXT</strong> - Plain text field list (one per line)</li>
              <li>• <strong>Excel (.xlsx)</strong> - Spreadsheet with field definitions</li>
            </ul>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="relative border-2 border-dashed rounded-xl p-12 text-center transition-all"
            style={dropZoneStyle}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,.txt,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!selectedFile ? (
              <>
                <div className="mb-4">
                  <div 
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3"
                    style={{
                      background: 'var(--background-subtle)',
                      color: 'var(--accent)',
                    }}
                  >
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>
                  <p 
                    className="text-lg font-semibold mb-2"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Drop your file here, or click to browse
                  </p>
                  <p 
                    className="text-sm"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    Maximum file size: 5MB
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-primary font-medium"
                  style={{ paddingInline: '24px' }}
                >
                  Select File
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div 
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-2"
                  style={{
                    background: 'var(--success-light)',
                    color: 'var(--success)',
                  }}
                >
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <p 
                    className="font-semibold"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {selectedFile.name}
                  </p>
                  <p 
                    className="text-sm"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={handleRemoveFile}
                    className="btn btn-secondary"
                  >
                    Remove
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={loading || success}
                    className="btn btn-primary font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ paddingInline: '24px' }}
                  >
                    {loading && <Spinner size="sm" variant="white" />}
                    {success && <CheckCircle className="w-4 h-4" />}
                    <span>
                      {loading ? "Processing..." : success ? "Success!" : "Generate Form"}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div 
              className="notice flex items-start gap-3"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
              }}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Error</p>
                <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>
              </div>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="notice notice-success flex items-start gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Success!</p>
                <p className="text-sm" style={{ color: 'var(--success)' }}>
                  Form generated successfully. Redirecting...
                </p>
              </div>
            </div>
          )}

          {/* Example format section */}
          <details className="surface-muted p-4">
            <summary 
              className="font-semibold cursor-pointer"
              style={{ color: 'var(--foreground)' }}
            >
              Example File Formats
            </summary>
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="font-medium mb-2" style={{ color: 'var(--foreground)' }}>CSV Format:</h4>
                <pre
                  className="card text-xs overflow-x-auto"
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--card-radius)',
                  }}
                >
{`label,type,required,options
Full Name,text,true,
Email Address,email,true,
Age,number,false,
Country,select,true,"USA,UK,Canada,Australia"
Subscribe to newsletter,checkbox,false,`}
                </pre>
              </div>
              <div>
                <h4 className="font-medium mb-2" style={{ color: 'var(--foreground)' }}>JSON Format:</h4>
                <pre
                  className="card text-xs overflow-x-auto"
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--card-radius)',
                  }}
                >
{`{
  "title": "Contact Form",
  "fields": [
    {"label": "Full Name", "type": "text", "required": true},
    {"label": "Email", "type": "email", "required": true},
    {"label": "Message", "type": "textarea", "required": true}
  ]
}`}
                </pre>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
