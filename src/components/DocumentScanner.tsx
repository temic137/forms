"use client";

import { useState, useRef } from "react";
import { Camera, X, Upload, Image as ImageIcon, FileText, AlertCircle, CheckCircle, Loader } from "lucide-react";
import { Field } from "@/types/form";

interface DocumentScannerProps {
  onFormGenerated: (title: string, fields: Field[]) => void;
  onCancel?: () => void;
}

export default function DocumentScanner({
  onFormGenerated,
  onCancel,
}: DocumentScannerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];

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
    setPreview(null);

    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      setError("Invalid file type. Please upload an image (JPEG, PNG, WebP) or PDF file.");
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB.");
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setProcessingStage("Uploading document...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      setProcessingStage("Analyzing document with OCR...");
      
      const response = await fetch("/api/ai/scan-form", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process document");
      }

      setProcessingStage("Extracting form fields...");
      const data = await response.json();
      
      setProcessingStage("Generating form structure...");
      
      // Normalize fields
      const normalizedFields: Field[] = data.fields.map((f: Partial<Field>, idx: number) => ({
        id: f.id || `field_${Date.now()}_${idx}`,
        label: f.label || "Field",
        type: f.type || "text",
        required: f.required || false,
        options: f.options || [],
        placeholder: f.placeholder,
        order: idx,
        conditionalLogic: [],
      }));

      setSuccess(true);
      setProcessingStage("Complete!");
      
      setTimeout(() => {
        onFormGenerated(data.title || "Scanned Form", normalizedFields);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setProcessingStage("");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    setSuccess(false);
    setProcessingStage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 to-red-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Camera className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">Scan Form Document</h2>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info banner */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-2 flex items-center">
              <ImageIcon className="w-4 h-4 mr-2" />
              AI-Powered OCR Form Recognition
            </h3>
            <p className="text-sm text-purple-800">
              Upload an image or PDF of an existing form. Our AI will scan and extract all fields,
              labels, and structure to recreate your form digitally.
            </p>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all
              ${isDragging ? "border-rose-500 bg-rose-50" : "border-gray-300 bg-gray-50"}
              ${selectedFile ? "border-rose-500 bg-rose-50" : ""}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!selectedFile ? (
              <>
                <div className="mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 mb-3">
                    <Upload className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-lg font-semibold text-gray-700 mb-2">
                    Upload a form image or PDF
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Supports: JPEG, PNG, WebP, PDF (Max 10MB)
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors font-medium"
                >
                  Select Document
                </button>
              </>
            ) : (
              <div className="space-y-4">
                {/* Preview */}
                {preview && (
                  <div className="mb-4">
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg border border-gray-300 shadow-sm"
                    />
                  </div>
                )}
                {!preview && selectedFile.type === "application/pdf" && (
                  <div className="mb-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-lg bg-red-100">
                      <FileText className="w-10 h-10 text-red-600" />
                    </div>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={handleRemoveFile}
                    disabled={loading}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    Remove
                  </button>
                  <button
                    onClick={handleScan}
                    disabled={loading || success}
                    className="px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading && <Loader className="w-4 h-4 animate-spin" />}
                    {success && <CheckCircle className="w-4 h-4" />}
                    <span>
                      {loading ? "Scanning..." : success ? "Success!" : "Scan & Generate"}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Processing stages */}
          {loading && processingStage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Loader className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                <div>
                  <p className="font-semibold text-blue-900">Processing</p>
                  <p className="text-sm text-blue-700">{processingStage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Success!</p>
                <p className="text-sm text-green-700">
                  Form extracted successfully. Creating your form...
                </p>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">📸 Tips for Best Results</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• Ensure good lighting and clear visibility of all text</li>
              <li>• Capture the entire form in the frame</li>
              <li>• Avoid shadows, glare, or blurry areas</li>
              <li>• Use high-resolution images (at least 300 DPI for scans)</li>
              <li>• For PDFs, ensure text is selectable (not just an image)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
