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
import { Spinner } from "@/components/ui/Spinner";
import { Mic, Sparkles, UploadCloud, Globe, Trash2, BarChart3, Check, Minus, Upload, ArrowRight, Clock, Brain, FileText, ScanLine, Lock, HelpCircle, X, Languages, GraduationCap } from "lucide-react";
import { useToastContext } from "@/contexts/ToastContext";

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

// Template cards data
const templateCards = [
  {
    title: "Contact Form",
    description: "Name, email, phone & message",
    fields: 4,
    icon: "📧",
    query: "contact form with name, email, phone number, and message fields",
  },
  {
    title: "Event Registration",
    description: "Attendee info & preferences",
    fields: 6,
    icon: "🎉",
    query: "event registration form with name, email, company, dietary restrictions, session preferences, and special requirements",
  },
  {
    title: "Customer Feedback",
    description: "NPS score & detailed feedback",
    fields: 5,
    icon: "⭐",
    query: "customer feedback survey with NPS score rating, what did you like most, what can we improve, would you recommend us, and additional comments",
  },
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

  // Creation method state
  const [creationMethod, setCreationMethod] = useState<CreationMethodInline>("prompt");

  // Help popup and onboarding state
  const [showHelpPopup, setShowHelpPopup] = useState(false);
  const [hasCreatedForm, setHasCreatedForm] = useState(false);
  const [showMethodTooltip, setShowMethodTooltip] = useState(false);

  // Check if user has created a form before (for progressive disclosure)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const created = localStorage.getItem('hasCreatedForm');
      setHasCreatedForm(created === 'true');
    }
  }, []);

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

      // Mark that user has created their first form (for progressive disclosure)
      if (typeof window !== 'undefined') {
        localStorage.setItem('hasCreatedForm', 'true');
        setHasCreatedForm(true);
      }
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

            {/* Value Proposition Badges */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm">
                <Check className="w-4 h-4 text-blue-600" />
                <span className="text-gray-700">AI-Powered Generation</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm">
                <ScanLine className="w-4 h-4 text-blue-600" />
                <span className="text-gray-700">Document Scanning/OCR</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span className="text-gray-700">Quiz Mode with Auto-Grading</span>
              </div>
            </div>

            {/* Ghost Access Button - Try Without Signup */}
            <div className="mb-12 flex justify-center">
              <button
                onClick={handleGuestSignIn}
                disabled={loading}
                className="relative group overflow-hidden px-8 py-5 rounded-2xl font-semibold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* Main button background */}
                <div className="absolute inset-0 bg-white border-2 border-gray-200 group-hover:border-gray-800 transition-all duration-300 group-hover:bg-gray-900" />

                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
                    animation: 'shimmer 2s infinite'
                  }}
                />

                {/* Content */}
                <div className="relative flex items-center gap-4 z-10">
                  <div className="relative flex-shrink-0">
                    {/* Ghost icon with animation */}
                    <div className="text-4xl group-hover:scale-125 transition-transform duration-300 group-hover:animate-bounce origin-center">
                      👻
                    </div>
                  </div>

                  <div className="text-left">
                    <div className="text-gray-900 font-bold text-base group-hover:text-white transition-colors duration-300 leading-tight">Go Ghost Mode</div>
                    <div className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors duration-300 font-normal">Try it instantly, no signup needed</div>
                  </div>

                  {/* Arrow animation */}
                  <div className="ml-2 text-gray-400 group-hover:text-white transition-all duration-300 group-hover:translate-x-3">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>

                {/* Add keyframes animation */}
                <style jsx>{`
                  @keyframes shimmer {
                    0% {
                      transform: translateX(-100%);
                    }
                    100% {
                      transform: translateX(100%);
                    }
                  }
                  button:hover {
                    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
                  }
                `}</style>
              </button>
            </div>

            {/* Hero Input */}
            <div className="max-w-2xl mx-auto mb-12 relative">
              <div className="relative bg-gray-50 rounded-xl border border-gray-200 p-2">
                <CreationMethodSelector
                  selectedMethod={creationMethod}
                  onMethodChange={setCreationMethod}
                  disabled={loading}
                />

                {/* Onboarding tooltip for first-time users */}
                {!hasCreatedForm && !showMethodTooltip && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">First time here? Start simple!</p>
                        <p className="text-blue-600 mt-1">Just describe your form in plain English below. Try: &quot;job application with resume upload&quot;</p>
                      </div>
                      <button onClick={() => setShowMethodTooltip(true)} className="text-blue-400 hover:text-blue-600 ml-auto">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {creationMethod === 'prompt' && (
                  <form onSubmit={handleSubmit} className="mt-4">
                    <div className="relative">
                      {/* Help button */}
                      <button
                        type="button"
                        onClick={() => setShowHelpPopup(true)}
                        className="absolute left-3 top-3 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors z-10"
                        title="What can I say?"
                      >
                        <HelpCircle className="w-5 h-5" />
                      </button>

                      <textarea
                        id="landing-prompt-input"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={placeholderExamples[placeholderIndex]}
                        className="w-full pl-12 pr-4 py-4 text-lg bg-transparent border-0 focus:ring-0 placeholder:text-gray-400 placeholder:transition-opacity text-gray-900 font-medium resize-none"
                        style={{ minHeight: '120px' }}
                      />
                      {isSupported && (
                        <div className="absolute right-3 bottom-3 flex items-center gap-2 z-10">
                          <span className="hidden sm:flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                            <Lock className="w-3 h-3" />
                            Processed locally
                          </span>
                          <button
                            type="button"
                            onClick={handleVoiceClick}
                            className="p-3 rounded-full transition-all shadow-sm hover:shadow-md"
                            style={{
                              background: isListening ? '#ef4444' : '#f3f4f6',
                              color: isListening ? '#fff' : '#4b5563',
                            }}
                            title={isListening ? 'Stop recording' : 'Start voice input'}
                          >
                            <Mic className="w-5 h-5" />
                          </button>
                        </div>
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
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border cursor-pointer transition-colors ${attachedFile
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
                          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${attachedUrl
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
                            <Spinner size="sm" variant="white" />
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
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-3 bg-green-50 py-2 rounded-lg border border-green-100">
                        <Lock className="w-3 h-3 text-green-600" />
                        <span className="text-green-700">🔒 Your documents are processed securely and not stored</span>
                      </div>
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

        {/* Why AnyForm Section */}
        <section className="py-16 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">Why AnyForm?</h2>

            <div className="grid md:grid-cols-3 gap-10">
              {/* Speed */}
              <div className="text-center">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-5 h-5 text-gray-700" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">10x Faster</h3>
                <p className="text-sm text-gray-600">30 seconds instead of 10 minutes. Just describe what you need.</p>
              </div>

              {/* Intelligence */}
              <div className="text-center">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-5 h-5 text-gray-700" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Context-Aware</h3>
                <p className="text-sm text-gray-600">Auto-detects field types, validation, and conditional logic.</p>
              </div>

              {/* Multiple Inputs */}
              <div className="text-center">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-5 h-5 text-gray-700" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Any Input</h3>
                <p className="text-sm text-gray-600">Voice, files, documents, URLs—we turn anything into a form.</p>
              </div>
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
        </section>

        {/* Features */}
        <section id="features" className="py-14 bg-white border-t border-gray-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <Mic className="w-5 h-5 text-gray-500 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Voice Input</h3>
                <p className="text-xs text-gray-500">Dictate while walking or driving</p>
              </div>
              <div>
                <UploadCloud className="w-5 h-5 text-gray-500 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-gray-900 mb-1">File to Form</h3>
                <p className="text-xs text-gray-500">PDF, Word docs auto-extracted</p>
              </div>
              <div>
                <BarChart3 className="w-5 h-5 text-gray-500 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Analytics</h3>
                <p className="text-xs text-gray-500">Real-time response insights</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 bg-gray-50 border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Ready to build?</h2>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                const input = document.getElementById('landing-prompt-input');
                if (input) input.focus();
              }}
              className="bg-gray-900 text-white hover:bg-gray-800 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              Start Now
            </button>
          </div>
        </section>
      </main>

      {/* What Can I Say? Help Popup */}
      {showHelpPopup && (
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
      )}

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
    </div>
  );
}
