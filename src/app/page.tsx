"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Field, FormStyling, NotificationConfig, MultiStepConfig, QuizModeConfig } from "@/types/form";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import RotatingText from "@/components/RotatingText";
import CreationMethodSelector, { CreationMethodInline } from "@/components/CreationMethodSelector";
import InlineFileUpload from "@/components/InlineFileUpload";
import InlineDocumentScanner from "@/components/InlineDocumentScanner";
import InlineJSONImport from "@/components/InlineJSONImport";
import InlineURLScraper from "@/components/InlineURLScraper";
import DragDropFormBuilder from "@/components/builder/DragDropFormBuilder";
import { Mic, Sparkles, UploadCloud, Globe, Trash2, BarChart3, Check, Minus, Upload, ArrowRight, Zap } from "lucide-react";
import { useToastContext } from "@/contexts/ToastContext";

export default function Home() {
  const router = useRouter();
  const toast = useToastContext();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  
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
  
  // Creation method state
  const [creationMethod, setCreationMethod] = useState<CreationMethodInline>("prompt");

  // Attachment state
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
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

  const generateForm = useCallback(async (brief: string) => {
    setLoading(true);
    try {
      let additionalContext = "";

      // Process File
      if (attachedFile) {
        const formData = new FormData();
        formData.append("file", attachedFile);
        const res = await fetch("/api/utils/parse-file", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Failed to parse file");
        const data = await res.json();
        additionalContext += `\n\nContext from uploaded file (${attachedFile.name}):\n${data.text}`;
      }

      // Process URL
      if (attachedUrl) {
        const res = await fetch("/api/utils/scrape-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: attachedUrl }),
        });
        if (!res.ok) throw new Error("Failed to scrape URL");
        const data = await res.json();
        additionalContext += `\n\nContext from URL (${attachedUrl}):\n${data.content}`;
      }

      const fullContent = `
User Request: Create a form.
User Description: ${brief}
${additionalContext}
      `.trim();

      const res = await fetch("/api/ai/generate-enhanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: fullContent,
          sourceType: "text",
          userContext: "The user wants to create a form.",
          options: {
            formComplexity: "moderate",
          }
        }),
      });
      
      if (!res.ok) throw new Error("Failed to generate form");
      
      const data = await res.json();
      
      // Normalize fields consistent with Dashboard implementation
      const normalizedFields = data.fields.map((f: Partial<Field>, idx: number) => ({
        id: f.id || `field_${Date.now()}_${idx}`,
        label: f.label || "Field",
        type: f.type || "text",
        required: f.required || false,
        options: f.options || [],
        placeholder: f.placeholder,
        helpText: f.helpText,
        validation: f.validation,
        // Preserve quizConfig for quiz questions with default points of 1
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
      setAttachedFile(null);
      setAttachedUrl("");
      setShowUrlInput(false);
      setQuery("");
    } catch {
      toast.error("Failed to generate form. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [attachedFile, attachedUrl, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !loading) {
      await generateForm(query.trim());
    }
  };
  
  async function handleFileUpload(file: File) {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ai/import-file", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process file");
      }

      const data = await response.json();
      const normalizedFields = data.fields.map((f: Partial<Field>, idx: number) => ({
        id: f.id || `field_${Date.now()}_${idx}`,
        label: f.label || "Field",
        type: f.type || "text",
        required: f.required || false,
        options: f.options || [],
        quizConfig: f.quizConfig ? {
          correctAnswer: f.quizConfig.correctAnswer || '',
          points: f.quizConfig.points || 1,
          explanation: f.quizConfig.explanation || ''
        } : undefined,
        order: idx,
        conditionalLogic: [],
        color: '#ffffff',
      }));

      setPreviewTitle(data.title || "Imported Form");
      setPreviewFields(normalizedFields);
      setPreviewStyling(undefined);
      setPreviewMultiStepConfig(undefined);
      setPreviewQuizMode(data.quizMode as QuizModeConfig | undefined);
      setShowBuilder(true);
      setCreationMethod("prompt");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setLoading(false);
    }
  }

  async function handleDocumentScan(file: File) {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ai/scan-form", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to scan document");
      }

      const data = await response.json();
      const normalizedFields = data.fields.map((f: Partial<Field>, idx: number) => ({
        id: f.id || `field_${Date.now()}_${idx}`,
        label: f.label || "Field",
        type: f.type || "text",
        required: f.required || false,
        options: f.options || [],
        placeholder: f.placeholder,
        order: idx,
        conditionalLogic: [],
        color: '#ffffff',
      }));

      setPreviewTitle(data.title || "Scanned Form");
      setPreviewFields(normalizedFields);
      setPreviewStyling(undefined);
      setShowBuilder(true);
      setCreationMethod("prompt"); 
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to scan document");
    } finally {
      setLoading(false);
    }
  }

  async function handleJSONImport(jsonData: { title?: string; fields: Array<Partial<Field>> }) {
    setLoading(true);
    try {
      const normalizedFields = jsonData.fields.map((f: Partial<Field>, idx: number) => ({
        id: f.id || f.label?.toLowerCase().replace(/\s+/g, "_") || `field_${idx}`,
        label: f.label || "Field",
        type: f.type || "text",
        required: f.required || false,
        options: f.options || [],
        placeholder: f.placeholder,
        order: idx,
        conditionalLogic: [],
        color: '#ffffff',
      }));

      setPreviewTitle(jsonData.title || "Imported Form");
      setPreviewFields(normalizedFields);
      setPreviewStyling(undefined);
      setPreviewMultiStepConfig(undefined);
      setShowBuilder(true);
      setCreationMethod("prompt"); 
    } catch {
      toast.error("Failed to import JSON");
    } finally {
      setLoading(false);
    }
  }

  async function handleURLScrape(url: string) {
    setLoading(true);
    try {
      const response = await fetch("/api/ai/generate-from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to scrape URL and generate form");
      }

      const data = await response.json();
      const normalizedFields = data.fields.map((f: Partial<Field>, idx: number) => ({
        id: f.id || `field_${Date.now()}_${idx}`,
        label: f.label || "Field",
        type: f.type || "text",
        required: f.required || false,
        options: f.options || [],
        placeholder: f.placeholder,
        helpText: f.helpText,
        quizConfig: f.quizConfig ? {
          correctAnswer: f.quizConfig.correctAnswer || '',
          points: f.quizConfig.points || 1,
          explanation: f.quizConfig.explanation || ''
        } : undefined,
        order: f.order || idx,
        conditionalLogic: f.conditionalLogic || [],
        color: '#ffffff',
      }));

      setPreviewTitle(data.title || "Form from URL");
      setPreviewFields(normalizedFields);
      setPreviewStyling(undefined); 
      setPreviewQuizMode(data.quizMode as QuizModeConfig | undefined);
      setPreviewMultiStepConfig(undefined);
      setShowBuilder(true);
      setCreationMethod("prompt");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to scrape URL and generate form");
    } finally {
      setLoading(false);
    }
  }

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

  // Auto-submit after 3 seconds of silence
  useEffect(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    setAutoSubmitCountdown(null);

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
  }, [query, isListening, stopListening, generateForm]);

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

  const quickActions = [
    { label: "Wedding RSVP", query: "wedding rsvp with meal preference and plus one" },
    { label: "Job Application", query: "job application with resume upload and cover letter" },
    { label: "Customer Feedback", query: "product feedback survey with nps score" },
    { label: "Event Registration", query: "conference registration with dietary restrictions" },
    { label: "Quiz", query: "trivia quiz about general knowledge with 5 questions" },
  ];

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
      {/* 
        NOTE: Navigation is handled globally in src/components/layout/Navigation.tsx 
      */}

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-24 pb-20 sm:pt-32 sm:pb-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium uppercase tracking-wide mb-8">
              The AI Form Builder
            </div>
            
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-gray-900 mb-8 leading-tight">
              Stop building <RotatingText words={["forms", "quizzes", "surveys", "tests", "questionnaires"]} className="text-blue-600" />. <br />
              <span className="text-gray-500">Just describe them.</span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              Create complex, validated forms in seconds using natural language. No drag-and-drop required.
            </p>

            {/* Instant Access Button */}
            <div className="mb-12 flex justify-center">
              <button
                onClick={handleGuestSignIn}
                disabled={loading}
                className="flex items-center gap-3 bg-white text-gray-900 border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg px-6 py-4 rounded-xl font-semibold text-lg transition-all group"
              >
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <div className="text-left">
                  <div className="text-gray-900 font-bold leading-tight">Instant Access</div>
                  <div className="text-xs text-gray-500 font-normal">Jump in without an account</div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all ml-2" />
              </button>
            </div>

            {/* Hero Input */}
            <div className="max-w-2xl mx-auto mb-16 relative">
              <div className="relative bg-white rounded-xl shadow-lg border border-gray-200 p-2">
                <CreationMethodSelector
                  selectedMethod={creationMethod}
                  onMethodChange={setCreationMethod}
                  disabled={loading}
                />
                
                {creationMethod === 'prompt' && (
                  <form onSubmit={handleSubmit} className="mt-4">
                    <div className="relative">
                      <textarea
                        id="landing-prompt-input"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Describe your form here... (e.g., 'A registration form for a cooking class with dietary restrictions')"
                        className="w-full px-4 py-4 text-lg bg-transparent border-0 focus:ring-0 placeholder:text-gray-400 text-gray-900 font-medium resize-none"
                        style={{ minHeight: '120px' }}
                        autoFocus
                      />
                      {isSupported && (
                        <button
                          type="button"
                          onClick={handleVoiceClick}
                          className="absolute right-3 bottom-3 p-3 rounded-full transition-all shadow-sm hover:shadow-md z-10"
                          style={{
                            background: isListening ? '#ef4444' : '#f3f4f6',
                            color: isListening ? '#fff' : '#4b5563',
                          }}
                          title={isListening ? 'Stop recording' : 'Start voice input'}
                        >
                          <Mic className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {/* Attachments Area */}
                    <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {/* File Attachment Button */}
                        <div className="relative">
                          <input
                            type="file"
                            id="landing-attach-file"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) setAttachedFile(e.target.files[0]);
                            }}
                            accept=".pdf,.txt,.csv,.json"
                          />
                          <label
                            htmlFor="landing-attach-file"
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border cursor-pointer transition-colors ${
                              attachedFile 
                                ? "bg-blue-50 border-blue-200 text-blue-700" 
                                : "hover:bg-gray-50 border-gray-200 text-gray-600"
                            }`}
                          >
                            <Upload className="w-4 h-4" />
                            {attachedFile ? attachedFile.name : "Attach File"}
                          </label>
                        </div>

                        {/* URL Attachment Button */}
                        <button
                          type="button"
                          onClick={() => setShowUrlInput(!showUrlInput)}
                          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                            attachedUrl 
                              ? "bg-blue-50 border-blue-200 text-blue-700" 
                              : "hover:bg-gray-50 border-gray-200 text-gray-600"
                          }`}
                        >
                          <Globe className="w-4 h-4" />
                          {attachedUrl ? "URL Attached" : "Attach URL"}
                        </button>
                      </div>

                      {/* URL Input Field */}
                      {(showUrlInput || attachedUrl) && (
                        <div className="flex gap-2 mb-4">
                          <input
                            type="url"
                            value={attachedUrl}
                            onChange={(e) => setAttachedUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {attachedUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setAttachedUrl("");
                                setShowUrlInput(false);
                              }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                      
                      {isListening && autoSubmitCountdown !== null && (
                        <div className="text-center text-sm font-medium animate-pulse text-blue-600 mb-2">
                          Auto-generating in {autoSubmitCountdown}s...
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={(!query.trim() && !attachedFile && !attachedUrl) || loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-lg transition-all disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            Create Form
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
                
                {/* Other Input Methods (File, URL, etc) */}
                <div className="px-4 pb-4">
                   {creationMethod === 'file' && (
                    <div className="mt-4">
                      <InlineFileUpload
                        onFileSelect={handleFileUpload}
                        onCancel={() => setCreationMethod('prompt')}
                        disabled={loading}
                      />
                    </div>
                  )}
                  {creationMethod === 'scan' && (
                    <div className="mt-4">
                      <InlineDocumentScanner
                        onFileSelect={handleDocumentScan}
                        onCancel={() => setCreationMethod('prompt')}
                        disabled={loading}
                      />
                    </div>
                  )}
                  {creationMethod === 'json' && (
                    <div className="mt-4">
                      <InlineJSONImport
                        onImport={handleJSONImport}
                        onCancel={() => setCreationMethod('prompt')}
                        disabled={loading}
                      />
                    </div>
                  )}
                  {creationMethod === 'url' && (
                    <div className="mt-4">
                      <InlineURLScraper
                        onURLSubmit={handleURLScrape}
                        onCancel={() => setCreationMethod('prompt')}
                        disabled={loading}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Suggestions */}
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <span className="text-sm text-gray-500 py-1">Try:</span>
                {quickActions.slice(0, 3).map((action) => (
                  <button
                    key={action.label}
                    onClick={() => {
                      setQuery(action.query);
                      generateForm(action.query);
                    }}
                    className="text-sm text-gray-600 bg-gray-50 border border-gray-200 hover:border-gray-300 hover:text-gray-900 px-3 py-1 rounded-md transition-all"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Comparison Table */}
        <section id="comparison" className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why switch from Google Forms?</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Google Forms is stuck in 2014. We built a tool for 2024 that understands context, logic, and design automatically.
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th scope="col" className="py-5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900">Feature</th>
                        <th scope="col" className="px-3 py-5 text-left text-sm font-medium text-gray-500">Google Forms</th>
                        <th scope="col" className="px-3 py-5 text-left text-sm font-bold text-blue-600 bg-blue-50/50">AnyForm (Our Tool)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {/* Row 1: Speed */}
                      <tr>
                        <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-gray-900">Creation Speed</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">5-10 minutes (Manual)</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-gray-900 bg-blue-50/10">30 seconds (AI)</td>
                      </tr>
                      
                      {/* Row 2: Input Method */}
                      <tr>
                        <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-gray-900">Input Method</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Click & Type (Slow)</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-gray-900 bg-blue-50/10">Voice, Text, URL, File</td>
                      </tr>

                      {/* Row 3: Intelligence */}
                      <tr>
                        <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-gray-900">Context Awareness</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">None (Dumb Canvas)</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-gray-900 bg-blue-50/10">Auto-detects logic & fields</td>
                      </tr>

                      {/* Row 4: File Imports */}
                      <tr>
                        <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-gray-900">File Imports</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className="inline-flex items-center gap-1.5 text-red-500">
                            <Minus className="w-4 h-4" /> Not Supported
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-gray-900 bg-blue-50/10">
                          <span className="inline-flex items-center gap-1.5 text-green-600">
                            <Check className="w-4 h-4" /> PDF / Word / Excel
                          </span>
                        </td>
                      </tr>

                      {/* Row 5: Design */}
                      <tr>
                        <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-gray-900">Design Quality</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Generic &quot;Purple Header&quot;</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-gray-900 bg-blue-50/10">Professional & Clean</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-900 mb-6 mx-auto border border-gray-100">
                  <Mic className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Voice Input</h3>
                <p className="text-gray-600 leading-relaxed">Dictate your form requirements while walking or driving. We&apos;ll handle the structure.</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-900 mb-6 mx-auto border border-gray-100">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">File to Form</h3>
                <p className="text-gray-600 leading-relaxed">Upload a PDF or Word doc. We&apos;ll extract the questions and logic automatically.</p>
              </div>

               <div className="text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-900 mb-6 mx-auto border border-gray-100">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Instant Analytics</h3>
                <p className="text-gray-600 leading-relaxed">Get insights immediately. Visualize your response data without exporting.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gray-50 border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">Ready to build?</h2>
            <p className="text-lg text-gray-600 mb-8">It takes less than 30 seconds to get started.</p>
            
            <button
               onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  const input = document.getElementById('landing-prompt-input');
                  if (input) input.focus();
                }}
              className="bg-gray-900 text-white hover:bg-gray-800 px-8 py-3 rounded-lg font-medium transition-colors shadow-sm"
            >
              Start Building Now
            </button>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-gray-900 font-bold">
              <span>AnyForm</span>
            </div>
            <div className="flex gap-8 text-sm text-gray-500">
              <a href="/privacy" className="hover:text-gray-900">Privacy</a>
              <a href="#" className="hover:text-gray-900">Terms</a>
              <a href="#" className="hover:text-gray-900">Twitter</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
