"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { FileUploadConfig } from "@/types/form";

/**
 * FileUpload Component
 * 
 * A drag-and-drop file upload component with validation and progress tracking.
 * 
 * Usage in FormRenderer:
 * ```tsx
 * import FileUpload, { FileMetadata } from "@/components/FileUpload";
 * 
 * // In your form component:
 * const [fileMetadata, setFileMetadata] = useState<FileMetadata[]>([]);
 * 
 * // When rendering a file field:
 * <FileUpload
 *   fieldId={field.id}
 *   formId={formId}
 *   submissionId={tempSubmissionId} // Generate a temp ID before submission
 *   config={field.fileConfig || { acceptedTypes: "all", maxSizeMB: 10, multiple: false }}
 *   value={formValues[field.id] || []}
 *   onChange={(urls, metadata) => {
 *     setValue(field.id, urls);
 *     if (metadata) {
 *       setFileMetadata(prev => [...prev.filter(m => m.fieldId !== field.id), ...metadata]);
 *     }
 *   }}
 *   error={errors[field.id]?.message}
 * />
 * 
 * // When submitting the form:
 * const submitData = {
 *   ...formValues,
 *   _fileMetadata: fileMetadata
 * };
 * ```
 */

export interface FileMetadata {
  fieldId: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
}

interface FileUploadProps {
  fieldId: string;
  formId: string;
  submissionId: string;
  config: FileUploadConfig;
  value?: string[];
  onChange: (urls: string[], metadata?: FileMetadata[]) => void;
  error?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
  uploading: boolean;
  progress: number;
  error?: string;
}

export default function FileUpload({
  fieldId,
  formId,
  submissionId,
  config,
  value = [],
  onChange,
  error,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    const maxSize = config.maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      return `File size exceeds maximum of ${config.maxSizeMB}MB`;
    }

    // Check file type
    if (config.acceptedTypes === "images") {
      if (!file.type.startsWith("image/")) {
        return "Only image files are accepted";
      }
    } else if (config.acceptedTypes === "documents") {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
        "text/csv",
      ];
      if (!allowedTypes.includes(file.type)) {
        return "Only document files (PDF, Word, Excel, Text) are accepted";
      }
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      const errorFile: UploadedFile = {
        id: Math.random().toString(36),
        name: file.name,
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
        url: "",
        uploading: false,
        progress: 0,
        error: validationError,
      };
      setFiles((prev) => [...prev, errorFile]);
      return;
    }

    const tempId = Math.random().toString(36);
    const newFile: UploadedFile = {
      id: tempId,
      name: file.name,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
      url: "",
      uploading: true,
      progress: 0,
    };

    setFiles((prev) => [...prev, newFile]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("formId", formId);
      formData.append("submissionId", submissionId);
      formData.append("fieldId", fieldId);
      formData.append("acceptedTypes", config.acceptedTypes);
      formData.append("maxSizeMB", config.maxSizeMB.toString());

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();

      setFiles((prev) =>
        prev.map((f) =>
          f.id === tempId
            ? { 
                ...f, 
                id: data.fileId, 
                name: data.filename,
                originalName: data.originalName,
                url: data.url, 
                uploading: false, 
                progress: 100 
              }
            : f
        )
      );

      // Update parent component with new URL and metadata
      const newUrls = [...value, data.url];
      const currentFiles = files.filter(f => f.url && !f.error);
      const newMetadata: FileMetadata[] = [
        ...currentFiles.map(f => ({
          fieldId,
          filename: f.name,
          originalName: f.originalName,
          size: f.size,
          mimeType: f.mimeType,
          url: f.url,
        })),
        {
          fieldId,
          filename: data.filename,
          originalName: data.originalName,
          size: data.size,
          mimeType: data.type,
          url: data.url,
        }
      ];
      onChange(newUrls, newMetadata);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setFiles((prev) =>
        prev.map((f) =>
          f.id === tempId
            ? { ...f, uploading: false, error: errorMessage }
            : f
        )
      );
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const filesToUpload = config.multiple ? droppedFiles : droppedFiles.slice(0, 1);
    filesToUpload.forEach(uploadFile);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const filesToUpload = config.multiple ? selectedFiles : selectedFiles.slice(0, 1);
      filesToUpload.forEach(uploadFile);
    }
  };

  const removeFile = (fileId: string, fileUrl: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    const newUrls = value.filter((url) => url !== fileUrl);
    const remainingFiles = files.filter(f => f.url && !f.error && f.url !== fileUrl);
    const newMetadata: FileMetadata[] = remainingFiles.map(f => ({
      fieldId,
      filename: f.name,
      originalName: f.originalName,
      size: f.size,
      mimeType: f.mimeType,
      url: f.url,
    }));
    onChange(newUrls, newMetadata);
  };

  const getAcceptAttribute = () => {
    if (config.acceptedTypes === "images") {
      return "image/*";
    } else if (config.acceptedTypes === "documents") {
      return ".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv";
    }
    return "*";
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept={getAcceptAttribute()}
          multiple={config.multiple}
        />

        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="text-sm text-gray-600">
            <button
              type="button"
              className="font-medium text-blue-600 hover:text-blue-500"
              onClick={() => fileInputRef.current?.click()}
            >
              Click to upload
            </button>
            <span> or drag and drop</span>
          </div>
          <p className="text-xs text-gray-500">
            {config.acceptedTypes === "images" && "Images only"}
            {config.acceptedTypes === "documents" && "Documents only (PDF, Word, Excel, Text)"}
            {config.acceptedTypes === "all" && "Any file type"}
            {" • "}
            Max {config.maxSizeMB}MB
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                {file.error && (
                  <p className="text-xs text-red-600 mt-1">{file.error}</p>
                )}
              </div>

              {file.uploading && (
                <div className="ml-4 flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              )}

              {!file.uploading && !file.error && (
                <button
                  type="button"
                  onClick={() => removeFile(file.id, file.url)}
                  className="ml-4 text-red-600 hover:text-red-800"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
