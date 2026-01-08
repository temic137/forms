"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import dynamic from "next/dynamic";
import { Field, FormStyling, NotificationConfig, MultiStepConfig, QuizModeConfig } from "@/types/form";
import { useFormGenerator } from "@/hooks/useFormGenerator";

const DragDropFormBuilder = dynamic(() => import("@/components/builder/DragDropFormBuilder"), {
  loading: () => <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" variant="primary" /></div>,
  ssr: false
});
import { Spinner } from "@/components/ui/Spinner";
import { Sparkles, Globe, Trash2, Upload, X, Edit2, Camera, FileJson, Check, Minus, ArrowRight, AlertCircle, FileText, Zap, Brain, Shield, BarChart3, Palette, Code2, Clock, Users } from "lucide-react";
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
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isSigningIn, setIsSigningIn] = useState(false);

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

  const {
    query,
    setQuery,
    loading,
    statusMessage,
    attachedFiles,
    attachedUrl,
    setAttachedUrl,
    showUrlInput,
    setShowUrlInput,
    handleFileSelect,
    removeFile,
    clearAttachments,
    generateForm
  } = useFormGenerator({
    confirm,
    onSuccess: (data) => {
      setPreviewTitle(data.title);
      setPreviewFields(data.fields);
      setPreviewStyling(undefined);
      setPreviewMultiStepConfig(undefined);
      setPreviewQuizMode(data.quizMode as QuizModeConfig | undefined);
      setShowBuilder(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('hasCreatedForm', 'true');
        setHasCreatedForm(true);
      }
    }
  });

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

  const handleSave = async () => {
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

      // Save to session storage
      sessionStorage.setItem('pendingForm', JSON.stringify(formData));

      // Trigger Sign Up modal
      const confirmed = await confirm(
        "Create Free Account",
        "Sign up now to save your form, collect unlimited responses, and access analytics.",
        {
          confirmText: "Sign Up Free",
          cancelText: "Cancel",
          variant: "default"
        }
      );

      if (confirmed) {
        router.push('/auth/signup');
      }
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setIsSigningIn(true);
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
      setIsSigningIn(false);
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
    <div className="min-h-screen flex flex-col paper-texture font-paper">
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
        <section className="pt-16 pb-12 sm:pt-20 sm:pb-16 bg-transparent">

          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 mb-6 paper-badge text-black text-sm">
              THE AI FORM BUILDER
              <span className="ml-2 pl-2 border-l border-black/20 text-black/50">IT'S FREE</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-black mb-6 leading-tight">
              Skip the grunt work
            </h1>

            <AnimatedLandingDescription />

            {/* Ghost Access Button - Subtle Version */}
            <div className="mb-8 flex flex-col items-center justify-center">
              <button
                onClick={handleGuestSignIn}
                disabled={isSigningIn}
                className="group flex items-center gap-2 px-5 py-2 paper-button text-black text-sm font-bold"
              >
                <span className="text-lg">👻</span>
                <span>Try Ghost Mode</span>
                <ArrowRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
              </button>
              <p className="mt-3 text-xs text-black/50 text-center max-w-sm">
                What is this? Instant anonymous access to try the builder.<br/>
                No login, no emails, just build.
              </p>
            </div>


            {/* Hero Input - Dashboard Style */}
            <div className="max-w-2xl mx-auto mb-10 relative">
              <div className="mb-4">
                <div className="flex items-center justify-center mb-3">
                  <AnimatedFormTitle />

                </div>
              </div>


              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <textarea
                    id="landing-prompt-input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onPaste={(e) => setQuery(e.currentTarget.value)}
                    placeholder={placeholderExamples[placeholderIndex]}
                    className="w-full px-3 py-3 text-sm paper-input resize-none bg-white"
                    style={{
                      minHeight: '80px',
                    }}
                    disabled={loading}
                  />
                </div>

                {/* Attachments Area */}
                <div className="space-y-2 flex flex-col items-center">
                  <div className="flex flex-wrap gap-2 justify-center">
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
                        className={`flex items-center gap-1.5 px-2 py-1 text-xs font-bold paper-button cursor-pointer ${loading ? "opacity-50 cursor-not-allowed" : "text-black"} ${attachedFiles.length > 0
                          ? "bg-black text-white border-black"
                          : "bg-white border-black/10 hover:border-black/30"
                          }`}
                      >
                        <Upload className="w-3 h-3" />
                        <span className="hidden sm:inline">Attach File</span>
                        <span className="sm:hidden">File</span>
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
                        className={`flex items-center gap-1.5 px-2 py-1 text-xs font-bold paper-button cursor-pointer bg-white border-black/10 hover:border-black/30 ${loading ? "opacity-50 cursor-not-allowed" : "text-black"}`}
                      >
                        <Camera className="w-3 h-3" />
                        <span className="hidden sm:inline">Scan Doc</span>
                        <span className="sm:hidden">Scan</span>
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
                        className={`flex items-center gap-1.5 px-2 py-1 text-xs font-bold paper-button cursor-pointer bg-white border-black/10 hover:border-black/30 ${loading ? "opacity-50 cursor-not-allowed" : "text-black"}`}
                      >
                        <FileJson className="w-3 h-3" />
                        <span className="hidden sm:inline">Import JSON</span>
                        <span className="sm:hidden">JSON</span>
                      </label>
                    </div>

                    {/* URL Attachment Button */}
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      disabled={loading}
                      className={`flex items-center gap-1.5 px-2 py-1 text-xs font-bold paper-button ${attachedUrl
                        ? "bg-black text-white border-black"
                        : "bg-white text-black border-black/10 hover:border-black/30"
                        }`}
                    >
                      <Globe className="w-3 h-3" />
                      {attachedUrl ? (<span className="hidden sm:inline">URL Attached</span>) : (<span className="hidden sm:inline">Attach URL</span>)}
                      {attachedUrl ? (<span className="sm:hidden">URL</span>) : (<span className="sm:hidden">URL</span>)}
                    </button>

                    {attachedFiles.length > 0 && (
                      <button
                        type="button"
                        onClick={() => clearAttachments()}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold paper-button text-black border-black/10 hover:border-red-500 hover:text-red-600 ml-auto disabled:opacity-50 bg-white"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Attached Files List */}
                  {attachedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {attachedFiles.map((file) => (
                        <div
                          key={file.id}
                          className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-all border-2 font-bold ${file.status === 'error'
                            ? 'bg-white text-red-600 border-red-200'
                            : file.status === 'parsing'
                              ? 'bg-white text-black border-black/30'
                              : 'bg-white text-black border-black/10'
                            }`}
                          title={file.errorMessage}
                        >
                          <div className="flex-1 flex items-center gap-1.5">
                            {file.status === 'parsing' ? (
                              <Spinner size="xs" variant="primary" />
                            ) : file.status === 'error' ? (
                              <AlertCircle className="w-3 h-3 shrink-0" />
                            ) : (
                              <FileText className="w-3 h-3 shrink-0 text-black/40" />
                            )}

                            <div className="flex flex-col min-w-0 max-w-[120px]">
                              <span className="truncate font-bold">{file.file.name}</span>
                              <span className="text-[10px] opacity-60">{(file.file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFile(file.id)}
                            disabled={loading}
                            className="p-0.5 rounded-md hover:bg-black/5 text-current opacity-60 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* URL Input Field */}
                  {(showUrlInput || attachedUrl) && (
                    <div className="flex gap-2 w-full">
                      <input
                        type="url"
                        value={attachedUrl}
                        onChange={(e) => setAttachedUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="flex-1 px-2 py-1.5 text-xs rounded-md focus:outline-none border-2 border-black/10 focus:border-black bg-white font-bold paper-input"
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
                          className="p-1.5 text-black/40 hover:text-red-600 hover:bg-black/5 rounded-md disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 justify-center">
                  <button
                    type="submit"
                    disabled={!query.trim() || loading}
                    className="flex-1 py-3 px-6 font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2 paper-button bg-black text-white border-2 border-black hover:bg-black/90"
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" variant="white" />
                        <span>{statusMessage || (attachedFiles.some(f => f.status === 'parsing') ? 'Processing Files...' : 'Generating...')}</span>
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
                    className="px-4 py-3 font-bold paper-button bg-white text-black border-2 border-black/10 hover:border-black/30"
                    title="Build manually"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>


        {/* Problem Statement Section */}
        <section className="py-16 bg-transparent">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-black mb-4">
                Form builders shouldn't feel like work
              </h2>
              <p className="text-lg text-black/60 font-bold max-w-2xl mx-auto">
                Traditional form builders force you to click through endless menus, drag fields one by one, 
                and manually configure every validation rule. We believe there's a better way.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="paper-card p-6 bg-white border-2 border-black/10">
                <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-black mb-2">Time Wasted</h3>
                <p className="text-sm text-black/60 font-bold">
                  Spending 10+ minutes clicking through menus to create a simple contact form
                </p>
              </div>

              <div className="paper-card p-6 bg-white border-2 border-black/10">
                <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center mb-4">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-black mb-2">Manual Labor</h3>
                <p className="text-sm text-black/60 font-bold">
                  Copying data from spreadsheets or documents field by field into your form
                </p>
              </div>

              <div className="paper-card p-6 bg-white border-2 border-black/10">
                <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-black mb-2">Limited Access</h3>
                <p className="text-sm text-black/60 font-bold">
                  Non-technical team members struggling with complex form builder interfaces
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bento Grid Features Section */}
        <section className="py-16 bg-transparent">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-black mb-4">
                Features that actually matter
              </h2>
              <p className="text-lg text-black/60 font-bold">
                Everything you need to create, customize, and deploy forms in seconds
              </p>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Large Feature - AI Generation */}
              <div className="md:col-span-2 md:row-span-2 paper-card p-8 bg-white relative overflow-hidden border-2 border-black/10">
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-black flex items-center justify-center mb-6">
                    <Brain className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-3">AI-Powered Generation</h3>
                  <p className="text-base text-black/70 font-bold mb-6 max-w-md">
                    Just describe what you need in plain English. Our AI understands context, creates proper validation, 
                    and even generates quiz questions with correct answers.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-black/5 border border-black/10 rounded-full text-xs font-bold text-black">Natural Language</span>
                    <span className="px-3 py-1 bg-black/5 border border-black/10 rounded-full text-xs font-bold text-black">Smart Validation</span>
                    <span className="px-3 py-1 bg-black/5 border border-black/10 rounded-full text-xs font-bold text-black">Quiz Mode</span>
                  </div>
                </div>
              </div>

              {/* File Import */}
              <div className="paper-card p-6 bg-white border-2 border-black/10">
                <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-black mb-2">Import Anything</h3>
                <p className="text-sm text-black/60 font-bold">
                  Upload PDFs, CSVs, JSON, or scan documents. We'll extract and structure the data.
                </p>
              </div>

              {/* Real-time Analytics */}
              <div className="paper-card p-6 bg-white border-2 border-black/10">
                <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-black mb-2">Live Analytics</h3>
                <p className="text-sm text-black/60 font-bold">
                  Track responses in real-time with beautiful charts and export to Google Sheets.
                </p>
              </div>

              {/* Custom Styling */}
              <div className="paper-card p-6 bg-white border-2 border-black/10">
                <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center mb-4">
                  <Palette className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-black mb-2">Full Customization</h3>
                <p className="text-sm text-black/60 font-bold">
                  Brand your forms with custom colors, fonts, and layouts. No coding required.
                </p>
              </div>

              {/* Embed Anywhere */}
              <div className="md:col-span-2 paper-card p-6 bg-white border-2 border-black/10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
                    <Code2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black mb-2">Embed Anywhere</h3>
                    <p className="text-sm text-black/60 font-bold mb-3">
                      One line of code to embed your form on any website. Works with WordPress, Webflow, Notion, and more.
                    </p>
                    <code className="text-xs bg-black/5 border border-black/10 px-3 py-1.5 rounded font-mono text-black/80 inline-block">
                      &lt;script src=&quot;anyform.com/embed.js&quot;&gt;&lt;/script&gt;
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section id="comparison" className="py-16 bg-transparent">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 paper-card p-6 bg-white">
            <h2 className="text-2xl font-bold text-black mb-6 text-center">vs Google Forms</h2>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 gap-1 sm:gap-0 border-b border-black/5 last:border-0">
                <span className="text-sm font-bold text-black">Creation Speed</span>
                <div className="flex gap-4 text-sm justify-between sm:justify-start">
                  <span className="text-black/40 w-24 text-left sm:text-right font-bold">5-10 min</span>
                  <span className="text-black font-bold w-24 text-right">30 sec</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 gap-1 sm:gap-0 border-b border-black/5 last:border-0">
                <span className="text-sm font-bold text-black">Input Methods</span>
                <div className="flex gap-4 text-sm justify-between sm:justify-start">
                  <span className="text-black/40 w-24 text-left sm:text-right font-bold">Click only</span>
                  <span className="text-black font-bold w-24 text-right">Voice, File, URL</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 gap-1 sm:gap-0 border-b border-black/5 last:border-0">
                <span className="text-sm font-bold text-black">AI Detection</span>
                <div className="flex gap-4 text-sm justify-between sm:justify-start">
                  <span className="text-black/40 w-24 text-left sm:text-right flex items-center sm:justify-end"><Minus className="w-4 h-4" /></span>
                  <span className="text-black font-bold w-24 text-right flex items-center justify-end"><Check className="w-4 h-4" /></span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 gap-1 sm:gap-0 border-b border-black/5 last:border-0">
                <span className="text-sm font-bold text-black">File Imports</span>
                <div className="flex gap-4 text-sm justify-between sm:justify-start">
                  <span className="text-black/40 w-24 text-left sm:text-right flex items-center sm:justify-end"><Minus className="w-4 h-4" /></span>
                  <span className="text-black font-bold w-24 text-right flex items-center justify-end"><Check className="w-4 h-4" /></span>
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
            <div className="paper-card max-w-lg w-full max-h-[80vh] overflow-hidden bg-white" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b-2 border-black/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-black">What can I say?</h3>
                    <p className="text-base text-black/60 mt-1 font-bold">Just describe your form naturally. Here are some examples:</p>
                  </div>
                  <button onClick={() => setShowHelpPopup(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                    <X className="w-6 h-6 text-black" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
                {examplePrompts.map((category) => (
                  <div key={category.category}>
                    <h4 className="text-base font-bold text-black mb-3">{category.category}</h4>
                    <div className="space-y-2">
                      {category.prompts.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => {
                            setQuery(prompt);
                            setShowHelpPopup(false);
                          }}
                          className="w-full text-left p-3 bg-white hover:bg-black/5 rounded-lg text-base text-black transition-all font-bold border-2 border-black/10 hover:border-black/30"
                        >
                          &quot;{prompt}&quot;
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t-2 border-black/10">
                  <h4 className="text-base font-bold text-black mb-2">💡 Pro Tips</h4>
                  <ul className="text-base text-black/60 space-y-2 font-bold">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-black mt-0.5 flex-shrink-0" />
                      <span>Mention specific field types: &quot;email&quot;, &quot;phone number&quot;, &quot;date picker&quot;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-black mt-0.5 flex-shrink-0" />
                      <span>Specify if fields are required: &quot;required email address&quot;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-black mt-0.5 flex-shrink-0" />
                      <span>Add validation: &quot;phone number with US format&quot;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-black mt-0.5 flex-shrink-0" />
                      <span>For quizzes: &quot;quiz with 5 multiple choice questions about [topic]&quot;</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )
      }

      <footer className="bg-transparent py-12 border-t-2 border-black/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-black font-bold text-xl">
              <span>AnyForm</span>
            </div>
            {/* Product Hunt Badge - Subtle */}
            <a
              href="https://www.producthunt.com/products/anyform-2?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-anyform-2"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
            >
              <img
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1053675&theme=neutral&t=1766549102046"
                alt="AnyForm - create forms in seconds | Product Hunt"
                width="200"
                height="43"
                style={{ height: '43px', width: '200px' }}
              />
            </a>
            <div className="flex gap-8 text-sm text-black/60 font-bold">
              <a href="/privacy" className="hover:text-black">Privacy</a>
              <a href="/terms" className="hover:text-black">Terms</a>
              <a href="#" className="hover:text-black">Twitter</a>
            </div>
          </div>
        </div>
      </footer>
    </div >
  );
}

