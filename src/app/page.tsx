"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import { Field, FormStyling, NotificationConfig, MultiStepConfig, QuizModeConfig } from "@/types/form";
import { useVoiceInput } from "@/hooks/useVoiceInput";

import DragDropFormBuilder from "@/components/builder/DragDropFormBuilder";
import { Spinner } from "@/components/ui/Spinner";
import { Mic, Sparkles, Globe, Trash2, Upload, X, Edit2, Camera, FileJson, Check, Minus, ArrowRight, AlertCircle, FileText } from "lucide-react";
import { useToastContext } from "@/contexts/ToastContext";
import { ConfirmationDialog, useConfirmDialog } from "@/components/ui/ConfirmationDialog";
import AnimatedFormTitle from "@/components/AnimatedFormTitle";
import AnimatedLandingDescription from "@/components/AnimatedLandingDescription";
import {
  FileAttachment,
  parseFileWithTimeout,
  formatFileContext,
  MAX_TOTAL_SIZE
} from "@/lib/client-file-parser";

// Example prompts for help popup
const examplePrompts = [
  { category: "Basic Forms", prompts: ["contact form with name, email, and message", "newsletter signup with email and preferences"] },
  { category: "Business", prompts: ["job application with resume upload", "customer feedback survey with NPS score"] },
  { category: "Events", prompts: ["event registration with dietary restrictions", "wedding RSVP with meal preference and plus one"] },
  { category: "Education", prompts: ["quiz about world history with 10 multiple choice questions", "student enrollment form with parent contact info"] },
];

// Rotating placeholder examples
const placeholderExamples = [
  "A contact form with name, email, and message...",
  "Job application with resume upload and cover letter...",
  "Customer feedback survey with NPS score...",
  "Event registration with dietary restrictions...",
  "Quiz about world history with 10 questions...",
  "Wedding RSVP with meal preference and plus one...",
  "Product order form with quantity and shipping...",
];

export default function Home() {
  const router = useRouter();
  const toast = useToastContext();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Form state
  const [showBuilder, setShowBuilder] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewFields, setPreviewFields] = useState<Field[]>([]);
  const [previewStyling, setPreviewStyling] = useState<FormStyling | undefined>(undefined);
  const [previewNotifications, setPreviewNotifications] = useState<NotificationConfig | undefined>(undefined);
  const [previewMultiStepConfig, setPreviewMultiStepConfig] = useState<MultiStepConfig | undefined>(undefined);
  const [previewQuizMode, setPreviewQuizMode] = useState<QuizModeConfig | undefined>(undefined);
  const [limitOneResponse, setLimitOneResponse] = useState(false);
  const [saveAndEdit, setSaveAndEdit] = useState(false);

  // Dialog state
  const { confirm, dialogState } = useConfirmDialog();

  // Help popup and onboarding state
  const [showHelpPopup, setShowHelpPopup] = useState(false);
  const [hasCreatedForm, setHasCreatedForm] = useState(false);


  // Check if user has created a form before (for progressive disclosure)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const created = localStorage.getItem('hasCreatedForm');
      setHasCreatedForm(created === 'true');
    }
  }, []);

  // Attachment state
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [attachedUrl, setAttachedUrl] = useState<string>("");
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Voice input state
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptRef = useRef<string>('');
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState<number | null>(null);

  const {
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  } = useVoiceInput({
    continuous: true,
    interimResults: true,
    onTranscriptChange: (newTranscript) => {
      setQuery(newTranscript);
    },
  });

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Convert to array
    const newFiles = Array.from(files);

    // 1. Validation Logic

    // Check count limit
    if (attachedFiles.length + newFiles.length > 5) {
      toast.error("You can attach a maximum of 5 files.");
      return;
    }

    // Process each new file
    const validNewFiles: FileAttachment[] = [];

    for (const file of newFiles) {
      // Check for duplicates
      const isDuplicate = attachedFiles.some(f =>
        f.file.name === file.name && f.file.size === file.size
      );
      if (isDuplicate) {
        toast.warning(`${file.name} is already attached.`);
        continue;
      }

      // Initialize attachment object
      const attachment: FileAttachment = {
        id: Math.random().toString(36).substring(7),
        file,
        status: 'parsing'
      };

      validNewFiles.push(attachment);
    }

    if (validNewFiles.length === 0) return;

    // Update state to show loading immediately
    setAttachedFiles(prev => [...prev, ...validNewFiles]);

    // Check Total Size
    const currentTotalSize = attachedFiles.reduce((acc, f) => acc + f.file.size, 0);
    const newTotalSize = validNewFiles.reduce((acc, f) => acc + f.file.size, 0);

    if (currentTotalSize + newTotalSize > MAX_TOTAL_SIZE) {
      // Revert addition if size exceeded
      setAttachedFiles(prev => prev.filter(f => !validNewFiles.find(vf => vf.id === f.id)));
      toast.error(`Total file size exceeds 25MB limit.`);
      return;
    }

    // Trigger parsing for each new file
    validNewFiles.forEach(async (attachment) => {
      try {
        const text = await parseFileWithTimeout(attachment.file);
        setAttachedFiles(prev => prev.map(f =>
          f.id === attachment.id
            ? { ...f, status: 'success', content: text }
            : f
        ));
      } catch (error) {
        setAttachedFiles(prev => prev.map(f =>
          f.id === attachment.id
            ? { ...f, status: 'error', errorMessage: error instanceof Error ? error.message : 'Parsing failed' }
            : f
        ));
      }
    });
  };

  const removeFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };


  const generateForm = useCallback(async (brief: string) => {
    // Check if any files are still parsing
    if (attachedFiles.some(f => f.status === 'parsing')) {
      toast.warning("Please wait for files to finish processing.");
      return;
    }

    // Handle failed files
    const failedFiles = attachedFiles.filter(f => f.status === 'error');
    if (failedFiles.length > 0) {
      const confirmed = await confirm(
        "Parsing Errors",
        `${failedFiles.length} file(s) failed to parse. Generate form with valid files only?`,
        { variant: 'warning', confirmText: "Generate Anyway" }
      );
      if (!confirmed) return;
    }

    setLoading(true);
    try {
      let referenceData = "";

      // Append File Content
      const fileContext = formatFileContext(attachedFiles);
      if (fileContext) {
        referenceData += fileContext;
      }

      // Process URL - extract content
      if (attachedUrl) {
        const res = await fetch("/api/utils/scrape-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: attachedUrl }),
        });
        if (!res.ok) throw new Error("Failed to scrape URL");
        const data = await res.json();
        if (referenceData) referenceData += "\n\n";
        referenceData += `Content from URL (${attachedUrl}):\n${data.content}`;
      }

      // Use generate-enhanced for better results with context
      const res = await fetch("/api/ai/generate-enhanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: brief, // User's prompt - used for form type detection
          referenceData: referenceData || undefined, // File/URL content - source material only
          sourceType: "text",
          userContext: "The user wants to create a form.",
          options: {
            formComplexity: "moderate",
          }
        }),
      });

      if (!res.ok) throw new Error("Failed to generate form");

      const data = await res.json();

      // Normalize fields...
      const normalizedFields = data.fields.map((f: Partial<Field>, idx: number) => ({
        id: f.id || `field_${Date.now()}_${idx}`,
        label: f.label || "Field",
        type: f.type || "text",
        required: f.required || false,
        options: f.options || [],
        placeholder: f.placeholder,
        helpText: f.helpText,
        validation: f.validation,
        quizConfig: f.quizConfig ? {
          correctAnswer: f.quizConfig.correctAnswer || '',
          points: f.quizConfig.points || 1,
          explanation: f.quizConfig.explanation || ''
        } : undefined,
        order: idx,
        conditionalLogic: [],
        color: '#ffffff',
      }));

      setPreviewTitle(data.title);
      setPreviewFields(normalizedFields);
      setPreviewStyling(undefined);
      setPreviewMultiStepConfig(undefined);
      setPreviewQuizMode(data.quizMode as QuizModeConfig | undefined);
      setShowBuilder(true);

      // Clear attachments on success
      setAttachedFiles([]);
      setAttachedUrl("");
      setShowUrlInput(false);
      setQuery("");

      if (typeof window !== 'undefined') {
        localStorage.setItem('hasCreatedForm', 'true');
        setHasCreatedForm(true);
      }
    } catch {
      toast.error("Failed to generate form. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [attachedFiles, attachedUrl, toast, confirm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !loading) {
      await generateForm(query.trim());
    }
  };





  // Rotate placeholder text
  useEffect(() => {
    const placeholderInterval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderExamples.length);
    }, 3000);
    return () => clearInterval(placeholderInterval);
  }, []);

  // Auto-submit after 3 seconds of silence
  useEffect(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    setAutoSubmitCountdown(null);

    // Don't auto-submit if files are parsing
    if (attachedFiles.some(f => f.status === 'parsing')) return;

    if (isListening && query.trim() && query !== lastTranscriptRef.current) {
      lastTranscriptRef.current = query;

      // Start 3-second countdown
      setAutoSubmitCountdown(3);
      let countdown = 3;

      const countdownInterval = setInterval(() => {
        countdown -= 1;
        setAutoSubmitCountdown(countdown);

        if (countdown <= 0) {
          clearInterval(countdownInterval);
        }
      }, 1000);

      // Auto-submit after 3 seconds
      silenceTimerRef.current = setTimeout(() => {
        clearInterval(countdownInterval);
        if (query.trim()) {
          stopListening();
          generateForm(query);
        }
      }, 3000);

      return () => clearInterval(countdownInterval);
    }
  }, [query, isListening, stopListening, generateForm, attachedFiles]);

  // Handle voice button click
  const handleVoiceClick = async () => {
    if (isListening) {
      stopListening();
    } else {
      try {
        // Clear previous transcript before starting new recording
        resetTranscript();
        setQuery('');
        lastTranscriptRef.current = '';
        await startListening();
      } catch (error) {
        console.error('Failed to start voice input:', error);
        toast.error('Failed to start voice input. Please check microphone permissions.');
      }
    }
  };

  const openBuilderForCreate = () => {
    setPreviewTitle("Untitled Form");
    setPreviewFields([]);
    setPreviewStyling(undefined);
    setPreviewMultiStepConfig(undefined);
    setShowBuilder(true);
  };

  function startOver() {
    setShowBuilder(false);
    setPreviewTitle("");
    setPreviewFields([]);
    setQuery("");
  }

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      const formData = {
        title: previewTitle,
        fields: previewFields,
        styling: previewStyling,
        notifications: previewNotifications,
        multiStepConfig: previewMultiStepConfig,
        quizMode: previewQuizMode,
        limitOneResponse,
        saveAndEdit
      };

      // Save to session storage for retrieval after signup
      sessionStorage.setItem('pendingForm', JSON.stringify(formData));

      toast.success("Please sign up to save your form!");
      setTimeout(() => {
        router.push('/auth/signup');
      }, 1500);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setLoading(true);
      const result = await signIn("anonymous", {
        redirect: false,
      });

      if (result?.error) {
        toast.error("Failed to sign in anonymously");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      console.error("Anonymous sign in failed:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };



  // Show form editor if form exists
  if (showBuilder) {
    return (
      <DragDropFormBuilder
        formTitle={previewTitle}
        fields={previewFields}
        styling={previewStyling}
        notifications={previewNotifications}
        multiStepConfig={previewMultiStepConfig}
        quizMode={previewQuizMode}
        limitOneResponse={limitOneResponse}
        saveAndEdit={saveAndEdit}
        currentFormId={null} // No ID yet as it's not saved
        onFormTitleChange={setPreviewTitle}
        onFieldsChange={setPreviewFields}
        onStylingChange={setPreviewStyling}
        onNotificationsChange={setPreviewNotifications}
        onMultiStepConfigChange={setPreviewMultiStepConfig}
        onQuizModeChange={setPreviewQuizMode}
        onLimitOneResponseChange={setLimitOneResponse}
        onSaveAndEditChange={setSaveAndEdit}
        onSave={handleSave}
        onCancel={startOver}
        saving={false}
      />
    );
  }

  // Structured Data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "AnyForm",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "The AI Form Builder. Create complex, validated forms in seconds using natural language. No drag-and-drop required.",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "120"
    }
  };

  // Show initial search interface
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <ConfirmationDialog
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        variant={dialogState.variant}
        onConfirm={dialogState.onConfirm}
        onCancel={dialogState.onCancel}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-24 pb-20 sm:pt-32 sm:pb-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium uppercase tracking-wide mb-8">
              The AI Form Builder
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-gray-900 mb-8 leading-tight">
              Skip the grunt work
            </h1>

            <AnimatedLandingDescription />

            {/* Ghost Access Button - Subtle Version */}
            <div className="mb-10 flex justify-center">
              <button
                onClick={handleGuestSignIn}
                disabled={loading}
                className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 text-sm font-medium transition-all duration-200 border border-gray-200 hover:border-gray-300"
              >
                <span className="text-lg">👻</span>
                <span>Try Ghost Mode</span>
                <ArrowRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
              </button>
            </div>


            {/* Hero Input - Dashboard Style */}
            <div className="max-w-3xl mx-auto mb-12 relative">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <AnimatedFormTitle />

                </div>
              </div>


              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <textarea
                    id="landing-prompt-input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholderExamples[placeholderIndex]}
                    className="w-full px-4 py-4 text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    style={{
                      minHeight: '120px',
                      background: 'var(--background-subtle)',
                      border: 'none',
                      color: 'var(--foreground)'
                    }}
                    disabled={loading}
                  />
                  {isSupported && (
                    <button
                      type="button"
                      onClick={handleVoiceClick}
                      className="absolute right-3 bottom-3 p-2.5 rounded-full transition-colors"
                      style={{
                        background: isListening ? '#ef4444' : 'var(--background)',
                        color: isListening ? '#fff' : 'var(--foreground-muted)',
                      }}
                      title={isListening ? 'Stop recording' : 'Start voice input'}
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Attachments Area */}
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {/* File Attachment Button */}
                    <div className="relative">
                      <input
                        type="file"
                        id="landing-attach-file"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files)}
                        accept=".pdf,.txt,.csv,.json"
                        multiple
                        disabled={loading}
                      />
                      <label
                        htmlFor="landing-attach-file"
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-colors ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100 text-gray-600"} ${attachedFiles.length > 0
                          ? "bg-blue-50 text-blue-700"
                          : ""
                          }`}
                      >
                        <Upload className="w-4 h-4" />
                        Attach File
                      </label>
                    </div>

                    {/* Scan Document Button */}
                    <div className="relative">
                      <input
                        type="file"
                        id="landing-scan-doc"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files)}
                        accept="image/*"
                        capture="environment"
                        multiple
                        disabled={loading}
                      />
                      <label
                        htmlFor="landing-scan-doc"
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-colors ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100 text-gray-600"}`}
                      >
                        <Camera className="w-4 h-4" />
                        Scan Doc
                      </label>
                    </div>

                    {/* Import JSON Button */}
                    <div className="relative">
                      <input
                        type="file"
                        id="landing-import-json"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files)}
                        accept=".json"
                        multiple
                        disabled={loading}
                      />
                      <label
                        htmlFor="landing-import-json"
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-colors ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100 text-gray-600"}`}
                      >
                        <FileJson className="w-4 h-4" />
                        Import JSON
                      </label>
                    </div>

                    {/* URL Attachment Button */}
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      disabled={loading}
                      className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${attachedUrl
                        ? "bg-blue-50 text-blue-700"
                        : "hover:bg-gray-100 text-gray-600"
                        }`}
                    >
                      <Globe className="w-4 h-4" />
                      {attachedUrl ? "URL Attached" : "Attach URL"}
                    </button>

                    {attachedFiles.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setAttachedFiles([])}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 ml-auto transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Attached Files List */}
                  {attachedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {attachedFiles.map((file) => (
                        <div
                          key={file.id}
                          className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all ${file.status === 'error'
                            ? 'bg-red-50 border-red-200 text-red-700'
                            : file.status === 'parsing'
                              ? 'bg-blue-50 border-blue-200 text-blue-700'
                              : 'bg-white border-gray-200 text-gray-700'
                            }`}
                          title={file.errorMessage}
                        >
                          <div className="flex-1 flex items-center gap-2">
                            {file.status === 'parsing' ? (
                              <Spinner size="xs" variant="primary" />
                            ) : file.status === 'error' ? (
                              <AlertCircle className="w-4 h-4 shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 shrink-0 text-gray-400" />
                            )}

                            <div className="flex flex-col min-w-0 max-w-[150px]">
                              <span className="truncate font-medium">{file.file.name}</span>
                              <span className="text-xs opacity-70">{(file.file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFile(file.id)}
                            disabled={loading}
                            className="p-1 rounded-md hover:bg-black/5 text-current opacity-60 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* URL Input Field */}
                  {(showUrlInput || attachedUrl) && (
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={attachedUrl}
                        onChange={(e) => setAttachedUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="flex-1 px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 border-0"
                        disabled={loading}
                      />
                      {attachedUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setAttachedUrl("");
                            setShowUrlInput(false);
                          }}
                          disabled={loading}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-md disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {isListening && autoSubmitCountdown !== null && (
                  <div className="text-center text-sm font-medium animate-pulse text-blue-600">
                    Auto-generating in {autoSubmitCountdown}s...
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={!query.trim() || loading}
                    className="flex-1 py-3 px-6 rounded-lg font-medium text-base transition-colors disabled:opacity-50 flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" variant="white" />
                        <span>{attachedFiles.some(f => f.status === 'parsing') ? 'Processing Files...' : 'Generating...'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Form
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={openBuilderForCreate}
                    className="px-5 py-3 rounded-lg font-medium transition-colors bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
                    title="Build manually"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>


        {/* Comparison Section */}
        <section id="comparison" className="py-14 bg-gray-50 border-t border-gray-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">vs Google Forms</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">Creation Speed</span>
                <div className="flex gap-6 text-sm">
                  <span className="text-gray-400 w-28 text-right">5-10 min</span>
                  <span className="text-gray-900 font-medium w-28 text-right">30 sec</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">Input Methods</span>
                <div className="flex gap-6 text-sm">
                  <span className="text-gray-400 w-28 text-right">Click only</span>
                  <span className="text-gray-900 font-medium w-28 text-right">Voice, File, URL</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">AI Detection</span>
                <div className="flex gap-6 text-sm">
                  <span className="text-gray-400 w-28 text-right flex justify-end"><Minus className="w-4 h-4" /></span>
                  <span className="text-gray-900 font-medium w-28 text-right flex justify-end"><Check className="w-4 h-4 text-green-600" /></span>
                </div>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-gray-700">File Imports</span>
                <div className="flex gap-6 text-sm">
                  <span className="text-gray-400 w-28 text-right flex justify-end"><Minus className="w-4 h-4" /></span>
                  <span className="text-gray-900 font-medium w-28 text-right flex justify-end"><Check className="w-4 h-4 text-green-600" /></span>
                </div>
              </div>
            </div>
          </div>
        </section >
      </main >

      {/* What Can I Say? Help Popup */}
      {
        showHelpPopup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowHelpPopup(false)}>
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">What can I say?</h3>
                    <p className="text-sm text-gray-500 mt-1">Just describe your form naturally. Here are some examples:</p>
                  </div>
                  <button onClick={() => setShowHelpPopup(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
                {examplePrompts.map((category) => (
                  <div key={category.category}>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">{category.category}</h4>
                    <div className="space-y-2">
                      {category.prompts.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => {
                            setQuery(prompt);
                            setShowHelpPopup(false);
                          }}
                          className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg text-sm text-gray-700 hover:text-blue-700 transition-colors"
                        >
                          &quot;{prompt}&quot;
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">💡 Pro Tips</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Mention specific field types: &quot;email&quot;, &quot;phone number&quot;, &quot;date picker&quot;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Specify if fields are required: &quot;required email address&quot;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Add validation: &quot;phone number with US format&quot;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>For quizzes: &quot;quiz with 5 multiple choice questions about [topic]&quot;</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )
      }

      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-gray-900 font-bold">
              <span>AnyForm</span>
            </div>
            <div className="flex gap-8 text-sm text-gray-500">
              <a href="/privacy" className="hover:text-gray-900">Privacy</a>
              <a href="/terms" className="hover:text-gray-900">Terms</a>
              <a href="#" className="hover:text-gray-900">Twitter</a>
            </div>
          </div>
        </div>
      </footer>
    </div >
  );
}
