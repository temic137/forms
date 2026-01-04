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
    const inputClasses = "w-full px-2.5 py-1.5 text-sm border border-black/20 rounded-lg bg-transparent focus:border-black/40 focus:ring-0 transition-colors font-paper text-black placeholder:text-black/30";
    
    switch (field.type) {
      // Text Inputs
      case "short-answer":
      case "text":
        return (
          <input
            type="text"
            placeholder={field.placeholder || "Your answer"}
            className={inputClasses}
            disabled={!isPreview}
          />
        );

      case "long-answer":
      case "textarea":
        return (
          <textarea
            placeholder={field.placeholder || "Your answer"}
            rows={4}
            className={`${inputClasses} resize-vertical`}
            disabled={!isPreview}
          />
        );

      // Contact Info
      case "email":
        return (
          <input
            type="email"
            placeholder={field.placeholder || "your@email.com"}
            className={inputClasses}
            disabled={!isPreview}
          />
        );

      case "phone":
        return (
          <input
            type="tel"
            placeholder={field.placeholder || "+1 (555) 000-0000"}
            className={inputClasses}
            disabled={!isPreview}
          />
        );

      case "address":
        return (
          <div className="space-y-2 font-paper">
            <input type="text" placeholder="Street Address" className={inputClasses} disabled={!isPreview} />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="City" className={inputClasses} disabled={!isPreview} />
              <input type="text" placeholder="State/Province" className={inputClasses} disabled={!isPreview} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="ZIP/Postal Code" className={inputClasses} disabled={!isPreview} />
              <input type="text" placeholder="Country" className={inputClasses} disabled={!isPreview} />
            </div>
          </div>
        );

      // Choices
      case "multiple-choice":
      case "choices":
      case "radio":
        return (
          <div className="space-y-2 font-paper">
            {normalizeOptions(field.options).map((option, idx) => (
              <label key={idx} className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5 border border-black/20 rounded-full group-hover:border-black/40">
                  <input type="radio" name={field.id} disabled={!isPreview} className="peer sr-only" />
                  <div className="w-2.5 h-2.5 bg-black rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="text-black">{option}</span>
              </label>
            ))}
          </div>
        );

      case "dropdown":
      case "select":
        return (
          <select
            className={inputClasses}
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
          <div className="space-y-2 font-paper">
            {normalizeOptions(field.options).map((option, idx) => (
              <label key={idx} className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5 border border-black/20 rounded group-hover:border-black/40">
                  <input type="checkbox" disabled={!isPreview} className="peer sr-only" />
                  <svg className="w-3.5 h-3.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-black">{option}</span>
              </label>
            ))}
          </div>
        );

      case "checkbox":
        // If options are provided, treat as multiple checkboxes
        if (field.options && field.options.length > 0) {
          return (
            <div className="space-y-2 font-paper">
              {normalizeOptions(field.options).map((option, idx) => (
                <label key={idx} className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5 border border-black/20 rounded group-hover:border-black/40">
                    <input type="checkbox" disabled={!isPreview} className="peer sr-only" />
                    <svg className="w-3.5 h-3.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-black">{option}</span>
                </label>
              ))}
            </div>
          );
        }
        // Otherwise treat as single boolean checkbox
        return (
          <label className="flex items-center gap-2 cursor-pointer group font-paper">
            <div className="relative flex items-center justify-center w-5 h-5 border border-black/20 rounded group-hover:border-black/40">
              <input type="checkbox" disabled={!isPreview} className="peer sr-only" />
              <svg className="w-3.5 h-3.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-black">{field.placeholder || "I agree"}</span>
          </label>
        );

      case "switch":
        return (
          <label className="flex items-center gap-3 cursor-pointer font-paper">
            <div className="relative inline-block w-10 h-6">
              <input type="checkbox" disabled={!isPreview} className="sr-only peer" />
              <div className="w-10 h-6 bg-transparent border border-black/20 rounded-full peer peer-checked:bg-black/5 peer-checked:border-black transition-colors"></div>
              <div className="absolute left-1 top-1 bg-black w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4"></div>
            </div>
            <span className="text-black">{field.label}</span>
          </label>
        );

      case "picture-choice":
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-paper">
            {normalizeOptions(field.options).map((option, i) => (
              <label key={i} className="relative cursor-pointer group">
                <input 
                  type="radio" 
                  name={field.id} 
                  value={option}
                  disabled={!isPreview}
                  className="peer sr-only"
                />
                <div className="rounded-xl border border-black/10 p-3 transition-all hover:border-black/30 peer-checked:border-black peer-checked:bg-black/5">
                    <div className="aspect-square bg-white rounded-lg flex items-center justify-center overflow-hidden mb-3 relative border border-black/5">
                      {field.optionImages?.[i] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={field.optionImages[i]} alt={option} className="w-full h-full object-cover grayscale" />
                      ) : (
                        <svg className="w-8 h-8 text-black/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center justify-center">
                        <span className="text-sm font-bold text-black">{option}</span>
                    </div>
                </div>
              </label>
            ))}
          </div>
        );

      case "choice-matrix":
        return (
          <div className="overflow-x-auto font-paper">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-black/10 px-4 py-2 bg-transparent"></th>
                  {normalizeOptions(field.options).map((option, idx) => (
                    <th key={idx} className="border border-black/10 px-4 py-2 bg-transparent font-bold text-black">
                      {option}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(field.matrixRows || ["Row 1", "Row 2", "Row 3"]).map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    <td className="border border-black/10 px-4 py-2 font-bold text-black">{row}</td>
                    {normalizeOptions(field.options).map((option, colIdx) => (
                      <td key={colIdx} className="border border-black/10 px-4 py-2 text-center">
                        <div className="flex justify-center">
                          {field.allowMultipleSelection ? (
                            <div className="relative flex items-center justify-center w-5 h-5 border border-black/20 rounded hover:border-black/40">
                              <input type="checkbox" name={`matrix-${field.id}-${rowIdx}`} disabled={!isPreview} className="peer sr-only" />
                              <svg className="w-3.5 h-3.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : (
                            <div className="relative flex items-center justify-center w-5 h-5 border border-black/20 rounded-full hover:border-black/40">
                              <input type="radio" name={`matrix-${field.id}-${rowIdx}`} disabled={!isPreview} className="peer sr-only" />
                              <div className="w-2.5 h-2.5 bg-black rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </div>
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
            className={inputClasses}
            disabled={!isPreview}
          />
        );

      case "time":
      case "time-picker":
        return (
          <input
            type="time"
            className={inputClasses}
            disabled={!isPreview}
          />
        );

      case "datetime-picker":
        return (
          <input
            type="datetime-local"
            className={inputClasses}
            disabled={!isPreview}
          />
        );

      case "date-range":
        return (
          <div className="grid grid-cols-2 gap-3 font-paper">
            <div>
              <label className="block text-sm text-black/60 mb-1 font-bold">Start Date</label>
              <input type="date" className={inputClasses} disabled={!isPreview} />
            </div>
            <div>
              <label className="block text-sm text-black/60 mb-1 font-bold">End Date</label>
              <input type="date" className={inputClasses} disabled={!isPreview} />
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
                className="text-black/20 hover:text-black transition-colors" 
                disabled={!isPreview}
                type="button"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="w-8 h-8"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.563.045.8.77.397 1.107l-4.19 3.523a.562.562 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.19-3.523a.562.562 0 01.397-1.107l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </button>
            ))}
          </div>
        );

      case "slider":
        return (
          <div className="space-y-2 font-paper">
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="50"
              className="w-full h-2 bg-black/10 rounded-lg appearance-none cursor-pointer accent-black"
              disabled={!isPreview}
            />
            <div className="flex justify-between text-sm text-black/60 font-bold">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>
        );

      case "opinion-scale":
        return (
          <div className="flex gap-2 justify-between font-paper">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                className="w-8 h-8 sm:w-10 sm:h-10 border border-black/20 rounded-lg hover:border-black hover:bg-black/5 transition-colors font-bold text-black"
                disabled={!isPreview}
              >
                {num}
              </button>
            ))}
          </div>
        );

      case "ranking":
        return (
          <div className="space-y-2 font-paper">
            {normalizeOptions(field.options).map((option, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 border border-black/10 rounded-lg bg-white hover:border-black/30 transition-colors">
                <svg className="w-5 h-5 text-black/40 cursor-move" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
                <span className="flex-1 text-black font-bold">{option}</span>
                <span className="text-sm text-black/40 font-bold">#{idx + 1}</span>
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
            className={inputClasses}
            disabled={!isPreview}
          />
        );

      case "currency":
        return (
          <div className="relative font-paper">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black/60 font-bold">$</span>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              className={`${inputClasses} pl-8`}
              disabled={!isPreview}
            />
          </div>
        );

      // Display Elements
      case "h1":
        return (
          <h1 
            className="text-4xl font-bold font-paper text-black"
          >
            {field.label}
          </h1>
        );

      case "heading":
        return (
          <h2 
            className="text-2xl font-bold font-paper text-black"
          >
            {field.label}
          </h2>
        );

      case "paragraph":
      case "display-text":
        return (
          <p className="font-paper text-black/80">
            {field.helpText || field.label}
          </p>
        );

      case "banner":
        return (
          <div className="bg-transparent border border-black/20 border-dashed p-4 rounded-xl font-paper">
            <p className="text-black font-bold text-lg">{field.label}</p>
            {field.helpText && <p className="text-black/60 text-sm mt-1">{field.helpText}</p>}
          </div>
        );

      case "divider":
        return <hr className="border-t border-black/10 border-dashed my-4" />;

      case "image":
        if (field.imageUrl || field.helpText) {
          return (
            <div className="rounded-xl overflow-hidden border border-black/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={field.imageUrl || field.helpText}
                alt={field.label || "Image"}
                className="w-full h-auto max-h-96 object-contain grayscale"
              />
            </div>
          );
        }
        return (
          <div className="border-2 border-dashed border-black/20 rounded-xl p-8 text-center font-paper">
            <svg className="w-12 h-12 mx-auto text-black/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-black/40 mt-2 font-bold">Image will be displayed here</p>
          </div>
        );

      // File Upload
      case "file":
      case "file-uploader":
        return <FileUploadField field={field} isPreview={isPreview} styling={styling} />;

      default:
        return (
          <div className="p-4 border border-black/10 rounded-xl bg-transparent text-black/60 font-paper font-bold">
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

