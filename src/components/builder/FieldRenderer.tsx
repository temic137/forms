"use client";

import { Field, FormStyling } from "@/types/form";
import { useMemo, useState, useRef, useCallback } from "react";
import { Spinner } from "@/components/ui/Spinner";

interface FieldRendererProps {
  field: Field;
  isPreview?: boolean;
  styling?: FormStyling;
}

// File Upload Field Component
interface FileUploadFieldProps {
  field: Field;
  isPreview?: boolean;
  styling?: FormStyling;
}

interface UploadedFile {
  fileId: string;
  filename: string;
  originalName: string;
  size: number;
  type: string;
  url: string;
}

function FileUploadField({ field, isPreview = false, styling }: FileUploadFieldProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const fileConfig = field.fileConfig || { acceptedTypes: "all", maxSizeMB: 10, multiple: false };
  
  const getAcceptAttribute = () => {
    switch (fileConfig.acceptedTypes) {
      case "images":
        return "image/jpeg,image/png,image/gif,image/webp,image/svg+xml";
      case "documents":
        return ".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv";
      case "pdf":
        return ".pdf,application/pdf";
      case "pdf_image":
        return "image/*,.pdf,application/pdf";
      default:
        return "*/*";
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
  
  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || !isPreview) return;
    
    setUploadError(null);
    setIsUploading(true);
    
    const filesToUpload = fileConfig.multiple ? Array.from(files) : [files[0]];
    
    for (const file of filesToUpload) {
      // Client-side validation
      const maxSize = fileConfig.maxSizeMB * 1024 * 1024;
      if (file.size > maxSize) {
        setUploadError(`File "${file.name}" exceeds ${fileConfig.maxSizeMB}MB limit`);
        continue;
      }
      
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("formId", "preview");
        formData.append("submissionId", `temp-${Date.now()}`);
        formData.append("fieldId", field.id);
        formData.append("acceptedTypes", fileConfig.acceptedTypes);
        formData.append("maxSizeMB", String(fileConfig.maxSizeMB));
        
        const response = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Upload failed");
        }
        
        const result = await response.json();
        
        if (fileConfig.multiple) {
          setUploadedFiles(prev => [...prev, result]);
        } else {
          setUploadedFiles([result]);
        }
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "Upload failed");
      }
    }
    
    setIsUploading(false);
  }, [isPreview, field.id, fileConfig]);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isPreview) setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isPreview) handleFiles(e.dataTransfer.files);
  };
  
  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.fileId !== fileId));
  };
  
  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return (
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    if (type === "application/pdf") {
      return (
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onClick={() => isPreview && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-all
          ${isDragging 
            ? "border-blue-500 bg-blue-50" 
            : "border-gray-300 hover:border-gray-400"
          }
          ${isPreview ? "cursor-pointer" : "cursor-default opacity-75"}
          ${isUploading ? "pointer-events-none" : ""}
        `}
        style={{
          borderColor: isDragging ? styling?.primaryColor : undefined,
          backgroundColor: isDragging ? `${styling?.primaryColor}10` : undefined,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptAttribute()}
          multiple={fileConfig.multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={!isPreview}
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center">
            <Spinner size="lg" />
            <p className="text-gray-600 mt-2">Uploading...</p>
          </div>
        ) : (
          <>
            <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-gray-600 mt-2">
              {isPreview ? "Click to upload or drag and drop" : "File upload field"}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {fileConfig.acceptedTypes === "images" && "Images only (JPG, PNG, GIF, WebP)"}
              {fileConfig.acceptedTypes === "documents" && "Documents only (PDF, Word, Excel, TXT)"}
              {fileConfig.acceptedTypes === "pdf" && "PDF only"}
              {fileConfig.acceptedTypes === "pdf_image" && "Images and PDF only"}
              {fileConfig.acceptedTypes === "all" && "All file types accepted"}
              {" • Max "}{fileConfig.maxSizeMB}MB
              {fileConfig.multiple && " • Multiple files allowed"}
            </p>
          </>
        )}
      </div>
      
      {/* Error Message */}
      {uploadError && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="ml-auto hover:text-red-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file) => (
            <div
              key={file.fileId}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              {file.type.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={file.url} 
                  alt={file.originalName}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                getFileIcon(file.type)
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.originalName}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
              {isPreview && (
                <button
                  onClick={() => removeFile(file.fileId)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove file"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

function getFontFamily(family: FormStyling["fontFamily"]): string {
  switch (family) {
    case "sans":
      return "ui-sans-serif, system-ui, sans-serif";
    case "serif":
      return "ui-serif, Georgia, serif";
    case "mono":
      return "ui-monospace, monospace";
    case "inter":
      return '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    case "roboto":
      return '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    case "open-sans":
      return '"Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    case "lato":
      return '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    case "montserrat":
      return '"Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    case "playfair":
      return '"Playfair Display", "Times New Roman", serif';
    case "merriweather":
      return '"Merriweather", "Times New Roman", serif';
    case "arial":
      return "Arial, Helvetica, sans-serif";
    case "georgia":
      return "Georgia, serif";
    case "times":
      return '"Times New Roman", Times, serif';
    case "courier":
      return '"Courier New", Courier, monospace';
    case "poppins":
      return '"Poppins", sans-serif';
    case "raleway":
      return '"Raleway", sans-serif';
    case "nunito":
      return '"Nunito", sans-serif';
    case "rubik":
      return '"Rubik", sans-serif';
    case "pt-serif":
      return '"PT Serif", serif';
    case "source-serif":
      return '"Source Serif Pro", serif';
    case "fira-code":
      return '"Fira Code", monospace';
    case "jetbrains-mono":
      return '"JetBrains Mono", monospace';
    case "system":
    default:
      return "system-ui, -apple-system, sans-serif";
  }
}

export default function FieldRenderer({ field, isPreview = false, styling }: FieldRendererProps) {
  const cssVariables = useMemo(() => {
    if (!styling) return {};
    return {
      '--form-primary-color': styling.primaryColor,
      '--form-bg-color': styling.backgroundColor,
      '--form-button-color': styling.buttonColor,
      '--form-button-text-color': styling.buttonTextColor,
      '--form-button-radius': `${styling.buttonRadius}px`,
    } as React.CSSProperties;
  }, [styling]);
  
  const fontFamily = useMemo(
    () => (styling ? getFontFamily(styling.fontFamily) : undefined),
    [styling]
  );
  
  // Helper function to normalize options - handles both string[] and {value, label}[] formats
  const normalizeOptions = (options: unknown[] | undefined): string[] => {
    if (!options) return ["Option 1", "Option 2", "Option 3"];
    return options.map((opt) => {
      if (typeof opt === 'string') return opt;
      if (typeof opt === 'object' && opt !== null) {
        // Handle {value, label} or {label} format
        const optObj = opt as { value?: string; label?: string };
        return optObj.label || optObj.value || String(opt);
      }
      return String(opt);
    });
  };
  
  const isDisplayOnly = [
    "display-text", "h1", "heading", "paragraph", "banner", "divider", "image", "video"
  ].includes(field.type);

  const renderFieldInput = () => {
    switch (field.type) {
      // Text Inputs
      case "short-answer":
      case "text":
        return (
          <input
            type="text"
            placeholder={field.placeholder || "Your answer"}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors"
            style={{
              borderColor: styling?.primaryColor ? 'rgba(0,0,0,0.2)' : '#d1d5db',
              backgroundColor: styling?.backgroundColor || '#ffffff',
              '--tw-ring-color': styling?.primaryColor || '#3b82f6',
            } as React.CSSProperties}
            disabled={!isPreview}
          />
        );

      case "long-answer":
      case "textarea":
        return (
          <textarea
            placeholder={field.placeholder || "Your answer"}
            rows={4}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent resize-vertical transition-colors"
            style={{
              borderColor: styling?.primaryColor ? 'rgba(0,0,0,0.2)' : '#d1d5db',
              backgroundColor: styling?.backgroundColor || '#ffffff',
              '--tw-ring-color': styling?.primaryColor || '#3b82f6',
            } as React.CSSProperties}
            disabled={!isPreview}
          />
        );

      // Contact Info
      case "email":
        return (
          <input
            type="email"
            placeholder={field.placeholder || "your@email.com"}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors"
            style={{
              borderColor: styling?.primaryColor ? 'rgba(0,0,0,0.2)' : '#d1d5db',
              backgroundColor: styling?.backgroundColor || '#ffffff',
              '--tw-ring-color': styling?.primaryColor || '#3b82f6',
            } as React.CSSProperties}
            disabled={!isPreview}
          />
        );

      case "phone":
        return (
          <input
            type="tel"
            placeholder={field.placeholder || "+1 (555) 000-0000"}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors"
            style={{
              borderColor: styling?.primaryColor ? 'rgba(0,0,0,0.2)' : '#d1d5db',
              backgroundColor: styling?.backgroundColor || '#ffffff',
              '--tw-ring-color': styling?.primaryColor || '#3b82f6',
            } as React.CSSProperties}
            disabled={!isPreview}
          />
        );

      case "address":
        return (
          <div className="space-y-2">
            <input type="text" placeholder="Street Address" className="w-full px-4 py-2 border border-gray-300 rounded-lg" disabled={!isPreview} />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="City" className="px-4 py-2 border border-gray-300 rounded-lg" disabled={!isPreview} />
              <input type="text" placeholder="State/Province" className="px-4 py-2 border border-gray-300 rounded-lg" disabled={!isPreview} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="ZIP/Postal Code" className="px-4 py-2 border border-gray-300 rounded-lg" disabled={!isPreview} />
              <input type="text" placeholder="Country" className="px-4 py-2 border border-gray-300 rounded-lg" disabled={!isPreview} />
            </div>
          </div>
        );

      // Choices
      case "multiple-choice":
      case "choices":
      case "radio":
        return (
          <div className="space-y-2">
            {normalizeOptions(field.options).map((option, idx) => (
              <label key={idx} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name={field.id} disabled={!isPreview} className="w-4 h-4" />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case "dropdown":
      case "select":
        return (
          <select
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors"
            style={{
              borderColor: styling?.primaryColor ? 'rgba(0,0,0,0.2)' : '#d1d5db',
              backgroundColor: styling?.backgroundColor || '#ffffff',
              '--tw-ring-color': styling?.primaryColor || '#3b82f6',
            } as React.CSSProperties}
            disabled={!isPreview}
          >
            <option value="">Select an option...</option>
            {normalizeOptions(field.options).map((option, idx) => (
              <option key={idx} value={option}>{option}</option>
            ))}
          </select>
        );

      case "checkboxes":
      case "multiselect":
        return (
          <div className="space-y-2">
            {normalizeOptions(field.options).map((option, idx) => (
              <label key={idx} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" disabled={!isPreview} className="w-4 h-4" />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case "checkbox":
        // If options are provided, treat as multiple checkboxes
        if (field.options && field.options.length > 0) {
          return (
            <div className="space-y-2">
              {normalizeOptions(field.options).map((option, idx) => (
                <label key={idx} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" disabled={!isPreview} className="w-4 h-4" />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          );
        }
        // Otherwise treat as single boolean checkbox
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" disabled={!isPreview} className="w-4 h-4" />
            <span className="text-gray-700">{field.placeholder || "I agree"}</span>
          </label>
        );

      case "switch":
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative inline-block w-12 h-6">
              <input type="checkbox" disabled={!isPreview} className="sr-only peer" />
              <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </div>
            <span className="text-gray-700">{field.label}</span>
          </label>
        );

      case "picture-choice":
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {normalizeOptions(field.options).map((option, i) => (
              <label key={i} className="relative cursor-pointer">
                <input 
                  type="radio" 
                  name={field.id} 
                  value={option}
                  disabled={!isPreview}
                  className="peer sr-only"
                />
                <div className="rounded-lg border-2 border-gray-200 p-3 transition-all hover:border-blue-300 peer-checked:border-blue-500 peer-checked:bg-blue-50">
                    <div className="aspect-square bg-white rounded-md flex items-center justify-center overflow-hidden mb-3 relative border border-gray-100">
                      {field.optionImages?.[i] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={field.optionImages[i]} alt={option} className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">{option}</span>
                    </div>
                </div>
              </label>
            ))}
          </div>
        );

      case "choice-matrix":
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-4 py-2 bg-gray-50"></th>
                  {normalizeOptions(field.options).map((option, idx) => (
                    <th key={idx} className="border border-gray-300 px-4 py-2 bg-gray-50 font-medium">
                      {option}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(field.matrixRows || ["Row 1", "Row 2", "Row 3"]).map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    <td className="border border-gray-300 px-4 py-2 font-medium">{row}</td>
                    {normalizeOptions(field.options).map((option, colIdx) => (
                      <td key={colIdx} className="border border-gray-300 px-4 py-2 text-center">
                        <input
                          type={field.allowMultipleSelection ? "checkbox" : "radio"}
                          name={`matrix-${field.id}-${rowIdx}`}
                          disabled={!isPreview}
                          className="w-4 h-4"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      // Date & Time
      case "date":
      case "date-picker":
        return (
          <input
            type="date"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!isPreview}
          />
        );

      case "time":
      case "time-picker":
        return (
          <input
            type="time"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!isPreview}
          />
        );

      case "datetime-picker":
        return (
          <input
            type="datetime-local"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!isPreview}
          />
        );

      case "date-range":
        return (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Start Date</label>
              <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-lg" disabled={!isPreview} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">End Date</label>
              <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-lg" disabled={!isPreview} />
            </div>
          </div>
        );

      // Rating & Ranking
      case "star-rating":
        return (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button 
                key={star} 
                className="text-gray-300 hover:text-yellow-400 transition-colors" 
                disabled={!isPreview}
                type="button"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="currentColor" 
                  className="w-8 h-8"
                >
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 4.646 1.251 5.318c.277 1.162-1.074 2.056-1.987 1.488L12 18.771l-4.695 2.636c-.913.568-2.264-.326-1.987-1.488l1.251-5.318-4.117-4.646c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                </svg>
              </button>
            ))}
          </div>
        );

      case "slider":
        return (
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="50"
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              disabled={!isPreview}
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>
        );

      case "opinion-scale":
        return (
          <div className="flex gap-2 justify-between">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                className="w-10 h-10 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                disabled={!isPreview}
              >
                {num}
              </button>
            ))}
          </div>
        );

      case "ranking":
        return (
          <div className="space-y-2">
            {normalizeOptions(field.options).map((option, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg bg-white">
                <svg className="w-5 h-5 text-gray-400 cursor-move" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                </svg>
                <span className="flex-1">{option}</span>
                <span className="text-sm text-gray-500">#{idx + 1}</span>
              </div>
            ))}
          </div>
        );

      // Number
      case "number":
        return (
          <input
            type="number"
            placeholder={field.placeholder || "0"}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors"
            style={{
              borderColor: styling?.primaryColor ? 'rgba(0,0,0,0.2)' : '#d1d5db',
              backgroundColor: styling?.backgroundColor || '#ffffff',
              '--tw-ring-color': styling?.primaryColor || '#3b82f6',
            } as React.CSSProperties}
            disabled={!isPreview}
          />
        );

      case "currency":
        return (
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!isPreview}
            />
          </div>
        );

      // Display Elements
      case "h1":
        return (
          <h1 
            className="text-4xl font-bold"
            style={{ color: styling?.primaryColor || '#111827' }}
          >
            {field.label}
          </h1>
        );

      case "heading":
        return (
          <h2 
            className="text-2xl font-bold"
            style={{ color: styling?.primaryColor || '#111827' }}
          >
            {field.label}
          </h2>
        );

      case "paragraph":
      case "display-text":
        return (
          <p style={{ color: styling?.primaryColor || '#374151' }}>
            {field.helpText || field.label}
          </p>
        );

      case "banner":
        return (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-blue-900 font-medium">{field.label}</p>
            {field.helpText && <p className="text-blue-700 text-sm mt-1">{field.helpText}</p>}
          </div>
        );

      case "divider":
        return <hr className="border-t-2 border-gray-300" />;

      case "image":
        if (field.imageUrl || field.helpText) {
          return (
            <div className="rounded-lg overflow-hidden border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={field.imageUrl || field.helpText}
                alt={field.label || "Image"}
                className="w-full h-auto max-h-96 object-contain"
              />
            </div>
          );
        }
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 mt-2">Image will be displayed here</p>
          </div>
        );

      // File Upload
      case "file":
      case "file-uploader":
        return <FileUploadField field={field} isPreview={isPreview} styling={styling} />;

      default:
        return (
          <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 text-gray-600">
            {field.type} field (preview not implemented)
          </div>
        );
    }
  };

  const containerStyle = {
    ...cssVariables,
    fontFamily: fontFamily,
    backgroundColor: styling?.backgroundColor,
    color: styling?.primaryColor,
  } as React.CSSProperties;

  return (
    <div className="space-y-2" style={containerStyle}>
      {!isDisplayOnly && (
        <label 
          className="block text-sm font-medium"
          style={{ color: styling?.primaryColor || '#111827' }}
        >
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {field.helpText && !isDisplayOnly && (
        <p className="text-sm" style={{ color: styling?.primaryColor ? 'rgba(0,0,0,0.6)' : '#4b5563' }}>
          {field.helpText}
        </p>
      )}
      {renderFieldInput()}
    </div>
  );
}

