"use client";

import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Spinner } from "@/components/ui/Spinner";
import Link from "next/link";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { Field, FormStyling, NotificationConfig, MultiStepConfig, QuizModeConfig } from "@/types/form";
import ShareButton from "@/components/ShareButton";
// import IntegrationButton from "@/components/IntegrationButton";
// Lazy load the heavy builder component
const DragDropFormBuilder = lazy(() => import("@/components/builder/DragDropFormBuilder"));
import { FileText, Edit2, Trash2, BarChart3, Sparkles, Upload, Globe, Camera, FileJson, Plus } from "lucide-react";
import { useToastContext } from "@/contexts/ToastContext";
import { ConfirmationDialog, useConfirmDialog } from "@/components/ui/ConfirmationDialog";
import { useCollaboration } from "@/hooks/useCollaboration";
import {
  useForms,
  updateFormInCache,
  removeFormFromCache,
  addFormToCache,
  revalidateForms
} from "@/hooks/useForms";

export default function DashboardPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const toast = useToastContext();
  const { confirm, dialogState } = useConfirmDialog();

  // Use SWR for forms fetching with caching
  const { forms, isLoading: formsLoading } = useForms();

  // Form generation state
  const [query, setQuery] = useState("");
  const [generatingForm, setGeneratingForm] = useState(false);
  const [showSuccess] = useState(false);
  const [newFormId] = useState<string | null>(null);
  const [savingForm, setSavingForm] = useState(false);
  const [deletingFormId, setDeletingFormId] = useState<string | null>(null);
  const [loadingFormId, setLoadingFormId] = useState<string | null>(null);



  // Builder state (used for both AI-generated and manual creation)
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewFields, setPreviewFields] = useState<Field[]>([]);
  const [previewStyling, setPreviewStyling] = useState<FormStyling | undefined>(undefined);
  const [previewNotifications, setPreviewNotifications] = useState<NotificationConfig | undefined>(undefined);
  const [previewMultiStepConfig, setPreviewMultiStepConfig] = useState<MultiStepConfig | undefined>(undefined);
  const [previewQuizMode, setPreviewQuizMode] = useState<QuizModeConfig | undefined>(undefined);
  const [limitOneResponse, setLimitOneResponse] = useState(false);
  const [saveAndEdit, setSaveAndEdit] = useState(false);

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

  // Real-time collaboration
  const handleCollaborationUpdate = (data: any) => {
    if (data.title !== undefined) setPreviewTitle(data.title);
    if (data.fieldsJson !== undefined) setPreviewFields(data.fieldsJson); // API returns fieldsJson
    if (data.fields !== undefined) setPreviewFields(data.fields); // Hook payload uses fields
    if (data.styling !== undefined) setPreviewStyling(data.styling);
    if (data.notifications !== undefined) setPreviewNotifications(data.notifications);
    if (data.multiStepConfig !== undefined) setPreviewMultiStepConfig(data.multiStepConfig);
    if (data.quizMode !== undefined) setPreviewQuizMode(data.quizMode);
    if (data.limitOneResponse !== undefined) setLimitOneResponse(data.limitOneResponse);
    if (data.saveAndEdit !== undefined) setSaveAndEdit(data.saveAndEdit);

    toast.info('Form updated by collaborator');
  };

  useCollaboration({
    formId: editingFormId,
    enabled: !!editingFormId && showBuilder,
    onUpdate: handleCollaborationUpdate,
    user: session?.user || null,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // SWR handles data fetching automatically - no need for manual fetchForms useEffect

  // Restore editing state if returning from preview
  useEffect(() => {
    if (status !== "authenticated" || showBuilder) return;

    const storedPreviewData = sessionStorage.getItem('formPreviewData');
    if (!storedPreviewData) return;

    try {
      const previewData = JSON.parse(storedPreviewData);
      setPreviewTitle(previewData.title || "Untitled Form");
      setPreviewFields(Array.isArray(previewData.fields) ? previewData.fields : []);
      setPreviewStyling(previewData.styling || undefined);
      setPreviewNotifications(previewData.notifications || undefined);
      setPreviewMultiStepConfig(previewData.multiStepConfig || undefined);
      const storedEditingFormId = sessionStorage.getItem('formPreviewEditingFormId');
      setEditingFormId(storedEditingFormId && storedEditingFormId !== 'new' ? storedEditingFormId : null);
      setShowBuilder(true);
    } catch (error) {
      console.error('Error restoring preview state:', error);
    } finally {
      sessionStorage.removeItem('formPreviewEditingFormId');
      sessionStorage.removeItem('formPreviewData');
    }
  }, [status, showBuilder]);

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
  }, [query, isListening, stopListening]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !generatingForm) {
      await generateForm(query.trim());
    }
  };

  async function generateForm(brief: string) {
    setGeneratingForm(true);
    try {
      let referenceData = "";

      // Process File - extract content as reference data (NOT part of the prompt)
      if (attachedFile) {
        const formData = new FormData();
        formData.append("file", attachedFile);
        const res = await fetch("/api/utils/parse-file", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Failed to parse file");
        const data = await res.json();
        referenceData += `Content from uploaded file (${attachedFile.name}):\n${data.text}`;
      }

      // Process URL - extract content as reference data (NOT part of the prompt)
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
      // IMPORTANT: User's prompt (brief) is passed as 'content' for form type detection
      // File/URL content is passed as 'referenceData' which is source material only
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

      // Open builder with generated form
      setPreviewTitle(data.title);
      setPreviewFields(normalizedFields);
      setPreviewStyling(undefined); // Use defaults from StyleEditor
      setPreviewMultiStepConfig(undefined);
      // Set quiz mode if API returned it (auto-enabled for quizzes)
      setPreviewQuizMode(data.quizMode as QuizModeConfig | undefined);
      setEditingFormId(null); // This is a new form
      setShowBuilder(true); // Use drag-drop builder instead of old preview
      setQuery("");
      setAttachedFile(null);
      setAttachedUrl("");
      setShowUrlInput(false);
    } catch (error) {
      console.error("Error generating form:", error);
      toast.error("Failed to generate form. Please try again.");
    } finally {
      setGeneratingForm(false);
    }
  }



  // Old publishForm, updateField, removeField, addField functions removed
  // Now using the drag-drop builder for all form editing

  // Open builder for creating new form
  const openBuilderForCreate = () => {
    setPreviewTitle("Untitled Form");
    setPreviewFields([]);
    setEditingFormId(null);
    setPreviewStyling(undefined); // Use defaults from StyleEditor
    setPreviewNotifications(undefined);
    setPreviewMultiStepConfig(undefined);
    setLimitOneResponse(false);
    setSaveAndEdit(false);
    setShowBuilder(true);
  };

  // Open builder for editing existing form
  const openBuilderForEdit = async (formId: string) => {
    setLoadingFormId(formId);
    try {
      const response = await fetch(`/api/forms/${formId}`);
      if (response.ok) {
        const data = await response.json();
        setPreviewTitle(data.title);
        setPreviewFields(Array.isArray(data.fieldsJson) ? data.fieldsJson : []);
        setPreviewStyling(data.styling as FormStyling | undefined);
        setPreviewNotifications(data.notifications as NotificationConfig | undefined);
        setPreviewMultiStepConfig(data.multiStepConfig as MultiStepConfig | undefined);
        setPreviewQuizMode(data.quizMode as QuizModeConfig | undefined);
        setLimitOneResponse(data.limitOneResponse || false);
        setSaveAndEdit(data.saveAndEdit || false);
        setEditingFormId(formId);
        setShowBuilder(true);
      } else {
        toast.error("Failed to load form");
      }
    } catch (error) {
      console.error("Error loading form:", error);
      toast.error("Failed to load form");
    } finally {
      setLoadingFormId(null);
    }
  };

  // Save form from builder with optimistic updates
  const handleBuilderSave = async () => {
    if (!previewTitle.trim()) {
      toast.warning("Please enter a form title");
      return;
    }

    if (previewFields.length === 0) {
      toast.warning("Please add at least one field");
      return;
    }

    setSavingForm(true);

    // Store previous state for rollback
    const isNewForm = !editingFormId;
    const now = new Date().toISOString();

    try {
      let url: string;
      let method: string;

      if (editingFormId) {
        // Optimistic update for existing form
        updateFormInCache(editingFormId, {
          title: previewTitle,
          updatedAt: now,
        });

        // Use sync endpoint for updates to support real-time collaboration
        url = `/api/forms/${editingFormId}/sync`;
        method = "POST";
      } else {
        // Create new form
        url = "/api/forms";
        method = "POST";
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: previewTitle,
          fields: previewFields,
          styling: previewStyling,
          notifications: previewNotifications,
          multiStepConfig: previewMultiStepConfig,
          quizMode: previewQuizMode,
          limitOneResponse,
          saveAndEdit,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(editingFormId ? "Form updated successfully!" : "Form created successfully!");

        // If creating a new form, add it to cache and set the editingFormId
        if (isNewForm && data.id) {
          // Add the new form to cache optimistically
          addFormToCache({
            id: data.id,
            title: previewTitle,
            createdAt: now,
            updatedAt: now,
            _count: { submissions: 0 },
          });
          setEditingFormId(data.id);
        }

        // Revalidate in background to ensure consistency
        revalidateForms();
      } else {
        const error = await response.json();
        toast.error(`Failed to save form: ${error.error || "Unknown error"}`);

        // Rollback optimistic update on error
        if (editingFormId) {
          revalidateForms();
        }
      }
    } catch (error) {
      console.error("Error saving form:", error);
      toast.error("Failed to save form. Please try again.");

      // Rollback on error
      revalidateForms();
    } finally {
      setSavingForm(false);
    }
  };

  // Cancel builder
  const handleBuilderCancel = async () => {
    if (previewFields.length > 0) {
      const confirmed = await confirm(
        "Discard changes?",
        "Are you sure you want to leave? Any unsaved changes will be lost.",
        {
          confirmText: "Discard",
          cancelText: "Cancel",
          variant: "warning",
        }
      );
      if (confirmed) {
        setShowBuilder(false);
        setEditingFormId(null);
        setPreviewStyling(undefined);
        setPreviewNotifications(undefined);
        setPreviewMultiStepConfig(undefined);
        setLimitOneResponse(false);
        setSaveAndEdit(false);
      }
    } else {
      setShowBuilder(false);
      setEditingFormId(null);
      setPreviewStyling(undefined);
      setPreviewMultiStepConfig(undefined);
      setLimitOneResponse(false);
      setSaveAndEdit(false);
    }
  };

  const deleteForm = async (formId: string) => {
    const confirmed = await confirm(
      "Delete form?",
      "Are you sure you want to delete this form? This action cannot be undone.",
      {
        confirmText: "Delete",
        cancelText: "Cancel",
        variant: "danger",
      }
    );

    if (!confirmed) {
      return;
    }

    // Store the form for potential rollback
    const formToDelete = forms.find((f) => f.id === formId);

    // Optimistic update - remove immediately from UI
    removeFormFromCache(formId);
    setDeletingFormId(formId);

    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Form deleted successfully");
        // Already removed from cache, just revalidate in background
        revalidateForms();
      } else {
        // Rollback - add the form back to cache
        if (formToDelete) {
          addFormToCache(formToDelete);
        }
        toast.error("Failed to delete form");
      }
    } catch (error) {
      console.error("Error deleting form:", error);
      // Rollback - add the form back to cache
      if (formToDelete) {
        addFormToCache(formToDelete);
      }
      toast.error("Failed to delete form");
    } finally {
      setDeletingFormId(null);
    }
  };

  if (status === "loading" || (formsLoading && forms.length === 0)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--background)' }}
      >
        <div className="flex items-center gap-3" style={{ color: 'var(--foreground-muted)' }}>
          <Spinner size="lg" variant="primary" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Show drag-drop builder (for AI-generated forms, manual creation, and editing)
  if (showBuilder) {
    return (
      <>
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
        <Suspense fallback={
          <div
            className="min-h-screen flex items-center justify-center"
            style={{ background: 'var(--background)' }}
          >
            <div className="flex items-center gap-3" style={{ color: 'var(--foreground-muted)' }}>
              <Spinner size="lg" variant="primary" />
              <span>Loading builder...</span>
            </div>
          </div>
        }>
          <DragDropFormBuilder
            formTitle={previewTitle}
            fields={previewFields}
            styling={previewStyling}
            notifications={previewNotifications}
            multiStepConfig={previewMultiStepConfig}
            quizMode={previewQuizMode}
            limitOneResponse={limitOneResponse}
            saveAndEdit={saveAndEdit}
            currentFormId={editingFormId}
            onFormTitleChange={setPreviewTitle}
            onFieldsChange={setPreviewFields}
            onStylingChange={setPreviewStyling}
            onNotificationsChange={setPreviewNotifications}
            onMultiStepConfigChange={setPreviewMultiStepConfig}
            onQuizModeChange={setPreviewQuizMode}
            onLimitOneResponseChange={setLimitOneResponse}
            onSaveAndEditChange={setSaveAndEdit}
            onSave={handleBuilderSave}
            onCancel={handleBuilderCancel}
            saving={savingForm}
          />
        </Suspense>
      </>
    );
  }

  // Main dashboard view with form list

  return (
    <>
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
      <div
        className="min-h-screen"
        style={{ background: 'var(--background)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Welcome Header - Simplified and Friendlier */}
          <div className="mb-10 text-center">
            <h1
              className="text-4xl font-bold mb-4"
              style={{ color: 'var(--foreground)' }}
            >
              {forms.length === 0 ? "Welcome to AnyForm" : "Dashboard"}
            </h1>
            <p
              className="text-lg max-w-2xl mx-auto"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {forms.length === 0
                ? "Let's create your first form. Just describe what you need, and AI will build it for you."
                : "Manage your forms or create a new one in seconds."}
            </p>
          </div>

          {/* Main Creation Area - Clean and Simple */}
          <div className="max-w-3xl mx-auto mb-16">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                  <h2 className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>Create a Form</h2>
                </div>

              </div>
            </div>


            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <textarea
                  id="prompt"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Describe your form here... (e.g., 'A registration form for a cooking class with dietary restrictions')"
                  className="w-full px-4 py-4 text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  style={{
                    minHeight: '120px',
                    background: 'var(--background-subtle)',
                    border: 'none',
                    color: 'var(--foreground)'
                  }}
                  disabled={generatingForm}
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
                    <svg
                      className="w-5 h-5"
                      fill={isListening ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Attachments Area */}
              <div className="flex flex-wrap gap-2">
                {/* File Attachment Button */}
                <div className="relative">
                  <input
                    type="file"
                    id="attach-file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setAttachedFile(e.target.files[0]);
                    }}
                    accept=".pdf,.txt,.csv,.json"
                  />
                  <label
                    htmlFor="attach-file"
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-colors ${attachedFile
                      ? "bg-blue-50 text-blue-700"
                      : "hover:bg-gray-100 text-gray-600"
                      }`}
                  >
                    <Upload className="w-4 h-4" />
                    {attachedFile ? attachedFile.name : "Attach File"}
                  </label>
                </div>

                {/* Scan Document Button */}
                <div className="relative">
                  <input
                    type="file"
                    id="scan-doc"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setAttachedFile(e.target.files[0]);
                    }}
                    accept="image/*"
                    capture="environment"
                  />
                  <label
                    htmlFor="scan-doc"
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-colors hover:bg-gray-100 text-gray-600"
                  >
                    <Camera className="w-4 h-4" />
                    Scan Doc
                  </label>
                </div>

                {/* Import JSON Button */}
                <div className="relative">
                  <input
                    type="file"
                    id="import-json"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setAttachedFile(e.target.files[0]);
                    }}
                    accept=".json"
                  />
                  <label
                    htmlFor="import-json"
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-colors hover:bg-gray-100 text-gray-600"
                  >
                    <FileJson className="w-4 h-4" />
                    Import JSON
                  </label>
                </div>

                {/* URL Attachment Button */}
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${attachedUrl
                    ? "bg-blue-50 text-blue-700"
                    : "hover:bg-gray-100 text-gray-600"
                    }`}
                >
                  <Globe className="w-4 h-4" />
                  {attachedUrl ? "URL Attached" : "Attach URL"}
                </button>
              </div>

              {/* URL Input Field */}
              {(showUrlInput || attachedUrl) && (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={attachedUrl}
                    onChange={(e) => setAttachedUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1 px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ background: 'var(--background-subtle)', border: 'none' }}
                  />
                  {attachedUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setAttachedUrl("");
                        setShowUrlInput(false);
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {isListening && autoSubmitCountdown !== null && (
                <div className="text-center text-sm font-medium animate-pulse" style={{ color: 'var(--accent)' }}>
                  Auto-generating in {autoSubmitCountdown}s...
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={!query.trim() || generatingForm}
                  className="flex-1 py-3 px-6 rounded-lg font-medium text-base transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    background: 'var(--accent)',
                    color: '#ffffff',
                  }}
                >
                  {generatingForm ? (
                    <>
                      <Spinner size="sm" variant="current" />
                      <span>Generating...</span>
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
                  className="px-5 py-3 rounded-lg font-medium transition-colors"
                  style={{
                    background: 'var(--background-subtle)',
                    color: 'var(--foreground-muted)',
                  }}
                  title="Build manually"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </form>




            {/* Success Message */}
            {showSuccess && newFormId && (
              <div
                className="mt-4 p-4 rounded-lg"
                style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  color: '#22c55e'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-full bg-green-100 text-green-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <span className="font-medium">Form created!</span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/forms/${newFormId}/submissions`}
                      className="px-3 py-1 rounded text-sm font-medium hover:bg-green-100 transition-colors"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/f/${newFormId}`;
                        navigator.clipboard.writeText(link);
                        toast.success('Link copied!');
                      }}
                      className="px-3 py-1 rounded text-sm font-medium hover:bg-green-100 transition-colors"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>
            )}


          </div>

          <div className="max-w-3xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <h2
                className="text-2xl font-bold"
                style={{ color: 'var(--foreground)' }}
              >
                Your Forms
              </h2>
              {forms.length > 0 && (
                <button
                  onClick={openBuilderForCreate}
                  className="text-sm font-medium hover:underline flex items-center gap-1"
                  style={{ color: 'var(--accent)' }}
                >
                  <Plus className="w-4 h-4" />
                  Create Manually
                </button>
              )}
            </div>

            {forms.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4">
                  <FileText className="w-8 h-8 mx-auto mb-4" style={{ color: 'var(--foreground-muted)' }} />
                  <h3 className="text-lg font-medium mb-1" style={{ color: 'var(--foreground)' }}>No forms yet</h3>
                  <p style={{ color: 'var(--foreground-muted)' }}>Create your first form above!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {forms.map((form) => (
                  <div
                    key={form.id}
                    className="flex items-center justify-between py-4 group"
                    style={{ borderBottom: '1px solid var(--divider-subtle)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate" style={{ color: 'var(--foreground)' }}>{form.title}</h3>
                      <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                        <span>{form._count.submissions} responses</span>
                        <span>·</span>
                        <span>{new Date(form.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/forms/${form.id}/submissions`}
                        className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                        style={{ color: 'var(--foreground-muted)' }}
                        title="View Results"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => openBuilderForEdit(form.id)}
                        disabled={loadingFormId === form.id}
                        className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                        style={{ color: 'var(--foreground-muted)' }}
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <ShareButton
                        url={`${typeof window !== "undefined" ? window.location.origin : ""}/f/${form.id}`}
                        label=""
                        variant="icon-only"
                        size="sm"
                        formTitle={form.title}
                      />
                      <button
                        onClick={() => deleteForm(form.id)}
                        disabled={deletingFormId === form.id}
                        className="p-2 rounded-md hover:bg-red-50 transition-colors text-red-500"
                        title="Delete form"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
