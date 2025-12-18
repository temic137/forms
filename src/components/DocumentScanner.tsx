"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, X, Upload, Image as ImageIcon, FileText, AlertCircle, CheckCircle, Loader, Smartphone, WifiOff, RefreshCw, Edit3, ChevronDown, ChevronUp } from "lucide-react";
import { Field } from "@/types/form";

interface DocumentScannerProps {
  onFormGenerated: (title: string, fields: Field[]) => void;
  onCancel?: () => void;
}

// Generated result type for retry functionality
interface GeneratedResult {
  title: string;
  fields: Field[];
  extractedText: string;
}

// Detect mobile/touch device
function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Detect mobile device
function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor || '';
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

// Check network status
function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
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
  const [isMobile, setIsMobile] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  
  // Retry/Regenerate state
  const [lastResult, setLastResult] = useState<GeneratedResult | null>(null);
  const [customInstructions, setCustomInstructions] = useState("");
  const [showCustomInstructions, setShowCustomInstructions] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateCount, setRegenerateCount] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  
  // Network status for mobile optimization
  const isOnline = useNetworkStatus();
  
  // Detect device type on mount
  useEffect(() => {
    setIsMobile(isMobileDevice());
    setIsTouch(isTouchDevice());
  }, []);

  const acceptedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];

  // Standard drag events for desktop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone entirely
    const rect = dropZoneRef.current?.getBoundingClientRect();
    if (rect) {
      const { clientX, clientY } = e;
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        setIsDragging(false);
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  // Touch event handlers for mobile drag-and-drop
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    
    // If significant movement detected, show drag state
    if (deltaX > 10 || deltaY > 10) {
      setIsDragging(true);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    setIsDragging(false);
  }, []);

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

    // Mobile-optimized file size limit (5MB for mobile, 10MB for desktop)
    const maxSize = isMobile ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    const maxSizeLabel = isMobile ? "5MB" : "10MB";
    
    if (file.size > maxSize) {
      setError(`File size must be less than ${maxSizeLabel}${isMobile ? ' on mobile devices' : ''}.`);
      return;
    }

    setSelectedFile(file);

    // Create preview for images with mobile-optimized loading
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.onerror = () => {
        setError("Failed to load image preview. The file may be corrupted.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async (useCustomInstructions = false) => {
    if (!selectedFile && !lastResult?.extractedText) return;
    
    // Check network status before attempting upload
    if (!isOnline) {
      setError("You appear to be offline. Please check your internet connection and try again.");
      return;
    }

    const isRegenerate = useCustomInstructions && lastResult?.extractedText;
    
    if (isRegenerate) {
      setIsRegenerating(true);
    } else {
      setLoading(true);
    }
    
    setError(null);
    setSuccess(false);
    setProcessingStage(isRegenerate ? "Regenerating with new instructions..." : "Uploading document...");

    try {
      const formData = new FormData();
      
      if (isRegenerate && lastResult?.extractedText) {
        // Regenerate mode: use cached extracted text
        formData.append("extractedText", lastResult.extractedText);
        if (customInstructions.trim()) {
          formData.append("customInstructions", customInstructions);
        }
      } else if (selectedFile) {
        // Initial scan mode
        formData.append("file", selectedFile);
        if (customInstructions.trim()) {
          formData.append("customInstructions", customInstructions);
        }
      }

      setProcessingStage(isRegenerate ? "Applying your instructions..." : "Analyzing document with OCR...");
      
      // Mobile-optimized fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), isMobile ? 60000 : 120000);
      
      const response = await fetch("/api/ai/scan-form", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

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

      // Store result for potential regeneration
      setLastResult({
        title: data.title || "Scanned Form",
        fields: normalizedFields,
        extractedText: data.extractedText,
      });
      
      if (isRegenerate) {
        setRegenerateCount(prev => prev + 1);
      }

      setSuccess(true);
      setProcessingStage("Complete!");
      
      setTimeout(() => {
        onFormGenerated(data.title || "Scanned Form", normalizedFields);
      }, 1500);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError("Request timed out. Please try again with a smaller file or better connection.");
      } else {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
      setProcessingStage("");
    } finally {
      setLoading(false);
      setIsRegenerating(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    setSuccess(false);
    setProcessingStage("");
    setLastResult(null);
    setCustomInstructions("");
    setShowCustomInstructions(false);
    setRegenerateCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-3 sm:p-6">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header - Mobile optimized */}
        <div className="bg-gradient-to-r from-rose-500 to-red-500 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {isMobile ? "Scan Form" : "Scan Form Document"}
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              {/* Network status indicator */}
              {!isOnline && (
                <div className="flex items-center text-white/80" title="Offline">
                  <WifiOff className="w-4 h-4" />
                </div>
              )}
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors touch-manipulation"
                  aria-label="Close scanner"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content - Mobile optimized padding */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Mobile device indicator */}
          {isMobile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
              <p className="text-sm text-blue-800">
                Mobile mode active. Use camera or gallery to upload.
              </p>
            </div>
          )}
          
          {/* Offline warning */}
          {!isOnline && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center space-x-2">
              <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">
                You&apos;re offline. Scanning requires an internet connection.
              </p>
            </div>
          )}

          {/* Info banner - Collapsible on mobile */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4">
            <h3 className="font-semibold text-purple-900 mb-1 sm:mb-2 flex items-center text-sm sm:text-base">
              <ImageIcon className="w-4 h-4 mr-2 shrink-0" />
              AI-Powered OCR Form Recognition
            </h3>
            <p className="text-xs sm:text-sm text-purple-800">
              Upload an image or PDF of an existing form. Our AI will extract all fields and structure.
            </p>
          </div>

          {/* Drop zone - Touch-optimized */}
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDragEnter={handleDragEnter}
            onDrop={handleDrop}
            onTouchStart={isTouch ? handleTouchStart : undefined}
            onTouchMove={isTouch ? handleTouchMove : undefined}
            onTouchEnd={isTouch ? handleTouchEnd : undefined}
            className={`
              relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all
              ${isDragging ? "border-rose-500 bg-rose-50 scale-[1.02]" : "border-gray-300 bg-gray-50"}
              ${selectedFile ? "border-rose-500 bg-rose-50" : ""}
              ${isTouch ? "active:scale-[0.98]" : ""}
              touch-manipulation
            `}
            role="button"
            tabIndex={0}
            aria-label="Drop zone for file upload"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                fileInputRef.current?.click();
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
              // Mobile: Allow camera capture
              capture={isMobile ? "environment" : undefined}
            />

            {!selectedFile ? (
              <>
                <div className="mb-3 sm:mb-4">
                  <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-200 mb-2 sm:mb-3">
                    <Upload className="w-7 h-7 sm:w-8 sm:h-8 text-gray-600" />
                  </div>
                  <p className="text-base sm:text-lg font-semibold text-gray-700 mb-1 sm:mb-2">
                    {isMobile ? "Take Photo or Upload" : "Upload a form image or PDF"}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                    Supports: JPEG, PNG, WebP, PDF (Max {isMobile ? "5MB" : "10MB"})
                  </p>
                </div>
                
                {/* Mobile: Show both camera and gallery options */}
                {isMobile ? (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                    <button
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.capture = "environment";
                          fileInputRef.current.click();
                        }
                      }}
                      className="px-5 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 active:bg-rose-700 transition-colors font-medium touch-manipulation flex items-center justify-center space-x-2 min-h-[48px]"
                    >
                      <Camera className="w-5 h-5" />
                      <span>Take Photo</span>
                    </button>
                    <button
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.removeAttribute('capture');
                          fileInputRef.current.click();
                        }
                      }}
                      className="px-5 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 active:bg-gray-800 transition-colors font-medium touch-manipulation flex items-center justify-center space-x-2 min-h-[48px]"
                    >
                      <ImageIcon className="w-5 h-5" />
                      <span>Choose File</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors font-medium touch-manipulation min-h-[48px]"
                  >
                    Select Document
                  </button>
                )}
                
                {/* Drag hint - Desktop only */}
                {!isMobile && (
                  <p className="text-xs text-gray-400 mt-3">
                    or drag and drop a file here
                  </p>
                )}
              </>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {/* Preview - Responsive sizing */}
                {preview && (
                  <div className="mb-3 sm:mb-4">
                    <img
                      src={preview}
                      alt="Document preview"
                      className="max-h-48 sm:max-h-64 mx-auto rounded-lg border border-gray-300 shadow-sm object-contain"
                    />
                  </div>
                )}
                {!preview && selectedFile.type === "application/pdf" && (
                  <div className="mb-3 sm:mb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-red-100">
                      <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" />
                    </div>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 text-sm sm:text-base truncate max-w-[250px] sm:max-w-none mx-auto">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                
                {/* Action buttons - Touch-optimized */}
                <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
                  <button
                    onClick={handleRemoveFile}
                    disabled={loading}
                    className="px-4 py-3 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors disabled:opacity-50 touch-manipulation min-h-[48px] sm:min-h-0"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => handleScan(false)}
                    disabled={loading || success || !isOnline}
                    className="px-6 py-3 sm:py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 active:bg-rose-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 touch-manipulation min-h-[48px] sm:min-h-0"
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

          {/* Processing stages - Mobile optimized */}
          {loading && processingStage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-center space-x-3">
                <Loader className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-blue-900 text-sm sm:text-base">Processing</p>
                  <p className="text-xs sm:text-sm text-blue-700 truncate">{processingStage}</p>
                </div>
              </div>
              {/* Mobile: Show progress hint */}
              {isMobile && (
                <p className="text-xs text-blue-600 mt-2">
                  Please keep this screen open while processing...
                </p>
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-semibold text-red-900 text-sm sm:text-base">Error</p>
                <p className="text-xs sm:text-sm text-red-700 break-words">{error}</p>
              </div>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900 text-sm sm:text-base">Success!</p>
                <p className="text-xs sm:text-sm text-green-700">
                  Form extracted successfully. Creating your form...
                </p>
              </div>
            </div>
          )}

          {/* Regenerate with Custom Instructions */}
          {lastResult && !loading && !isRegenerating && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <button
                onClick={() => setShowCustomInstructions(!showCustomInstructions)}
                className="w-full flex items-center justify-between text-left touch-manipulation"
              >
                <div className="flex items-center space-x-2">
                  <Edit3 className="w-5 h-5 text-indigo-600" />
                  <span className="font-semibold text-indigo-900 text-sm sm:text-base">
                    Not quite right? Refine the results
                  </span>
                </div>
                {showCustomInstructions ? (
                  <ChevronUp className="w-5 h-5 text-indigo-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-indigo-600" />
                )}
              </button>
              
              {showCustomInstructions && (
                <div className="mt-4 space-y-3">
                  <p className="text-xs sm:text-sm text-indigo-700">
                    Add instructions to improve the form generation. The AI will re-analyze with your guidance.
                  </p>
                  
                  <textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="e.g., 'Make all fields required', 'Add an email field', 'Split the address into separate fields', 'Use dropdown for country selection'..."
                    className="w-full p-3 border border-indigo-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none touch-manipulation"
                    rows={3}
                  />
                  
                  {/* Quick instruction suggestions */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-indigo-600 font-medium">Quick suggestions:</span>
                    {[
                      "Make all fields required",
                      "Add validation hints",
                      "Split address fields",
                      "Use dropdowns where possible"
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setCustomInstructions(prev => 
                          prev ? `${prev}, ${suggestion.toLowerCase()}` : suggestion
                        )}
                        className="px-2 py-1 text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-full transition-colors touch-manipulation"
                      >
                        + {suggestion}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <button
                      onClick={() => handleScan(true)}
                      disabled={isRegenerating || !isOnline}
                      className="flex-1 px-4 py-3 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 touch-manipulation min-h-[48px] sm:min-h-0"
                    >
                      <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                      <span>
                        {isRegenerating ? "Regenerating..." : "Regenerate Form"}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setCustomInstructions("");
                        setShowCustomInstructions(false);
                      }}
                      className="px-4 py-3 sm:py-2 border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors touch-manipulation min-h-[48px] sm:min-h-0"
                    >
                      Cancel
                    </button>
                  </div>
                  
                  {regenerateCount > 0 && (
                    <p className="text-xs text-indigo-600 text-center">
                      Regenerated {regenerateCount} time{regenerateCount > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Regenerating indicator */}
          {isRegenerating && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-center space-x-3">
                <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-indigo-900 text-sm sm:text-base">Regenerating</p>
                  <p className="text-xs sm:text-sm text-indigo-700 truncate">{processingStage}</p>
                </div>
              </div>
              {customInstructions && (
                <p className="text-xs text-indigo-600 mt-2 italic truncate">
                  With: &quot;{customInstructions.slice(0, 50)}{customInstructions.length > 50 ? '...' : ''}&quot;
                </p>
              )}
            </div>
          )}

          {/* Tips - Collapsible on mobile */}
          <details className="bg-gray-50 rounded-lg" open={!isMobile}>
            <summary className="p-3 sm:p-4 cursor-pointer font-semibold text-gray-900 text-sm sm:text-base flex items-center justify-between touch-manipulation">
              <span>📸 Tips for Best Results</span>
              <span className="text-gray-400 text-xs">{isMobile ? "(tap to expand)" : ""}</span>
            </summary>
            <ul className="text-xs sm:text-sm text-gray-700 space-y-1.5 sm:space-y-2 px-3 sm:px-4 pb-3 sm:pb-4">
              <li>• Ensure good lighting and clear visibility of all text</li>
              <li>• Capture the entire form in the frame</li>
              <li>• Avoid shadows, glare, or blurry areas</li>
              {!isMobile && (
                <>
                  <li>• Use high-resolution images (at least 300 DPI for scans)</li>
                  <li>• For PDFs, ensure text is selectable (not just an image)</li>
                </>
              )}
              {isMobile && (
                <li>• Hold your phone steady when taking photos</li>
              )}
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
}
