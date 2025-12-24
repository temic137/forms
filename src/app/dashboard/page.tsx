"use client";

import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Spinner } from "@/components/ui/Spinner";
import Link from "next/link";
import { useFormGenerator } from "@/hooks/useFormGenerator";
import { Field, FormStyling, NotificationConfig, MultiStepConfig, QuizModeConfig } from "@/types/form";
import ShareButton from "@/components/ShareButton";
// import IntegrationButton from "@/components/IntegrationButton";
// Lazy load the heavy builder component
const DragDropFormBuilder = lazy(() => import("@/components/builder/DragDropFormBuilder"));
import PostSaveShareModal from "@/components/PostSaveShareModal";
import AnimatedFormTitle from "@/components/AnimatedFormTitle";
import AnimatedDashboardSubtitle from "@/components/AnimatedDashboardSubtitle";
import { FileText, Edit2, Trash2, BarChart3, Sparkles, Upload, Globe, Camera, FileJson, Plus, AlertCircle, X } from "lucide-react";
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
import {
  FileAttachment,
  parseFileWithTimeout,
  formatFileContext,
  MAX_TOTAL_SIZE
} from "@/lib/client-file-parser";

export default function DashboardPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const toast = useToastContext();
  const { confirm, dialogState } = useConfirmDialog();

  // Use SWR for forms fetching with caching
  const { forms, isLoading: formsLoading } = useForms();

  // Form generation state
  const [showSuccess] = useState(false);
  const [newFormId] = useState<string | null>(null);
  const [savingForm, setSavingForm] = useState(false);
  const [deletingFormId, setDeletingFormId] = useState<string | null>(null);
  const [loadingFormId, setLoadingFormId] = useState<string | null>(null);
  const [showPostSaveModal, setShowPostSaveModal] = useState(false);

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

  const {
    query,
    setQuery,
    loading: generatingForm,
    statusMessage,
    attachedFiles,
    attachedUrl,
    setAttachedUrl,
    showUrlInput,
    setShowUrlInput,
    handleFileSelect,
    removeFile,
    clearAttachments,
    generateForm,
    handleVoiceClick,
    isListening,
    isSupported,
    autoSubmitCountdown
  } = useFormGenerator({
    confirm,
    onSuccess: (data) => {
      setPreviewTitle(data.title);
      setPreviewFields(data.fields);
      setPreviewStyling(undefined);
      setPreviewMultiStepConfig(undefined);
      setPreviewQuizMode(data.quizMode as QuizModeConfig | undefined);
      setEditingFormId(null);
      setShowBuilder(true);
    }
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

  // Auto-submit logic is now handled by useFormGenerator hook

  // Voice interaction is now handled by useFormGenerator hook

  // File handling is now handled by useFormGenerator hook


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !generatingForm) {
      await generateForm(query.trim());
    }
  };

  // generateForm logic is now handled by useFormGenerator hook



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

        // Show simplified share modal
        setShowPostSaveModal(true);

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
        <PostSaveShareModal
          isOpen={showPostSaveModal}
          onClose={() => setShowPostSaveModal(false)}
          formId={editingFormId || ""}
          formTitle={previewTitle}
          isPublished={true}
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
      <PostSaveShareModal
        isOpen={showPostSaveModal}
        onClose={() => setShowPostSaveModal(false)}
        formId={editingFormId || ""}
        formTitle={previewTitle}
        isPublished={true}
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
                : <AnimatedDashboardSubtitle />}
            </p>
          </div>

          {/* Main Creation Area - Clean and Simple */}
          <div className="max-w-5xl mx-auto mb-16">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <AnimatedFormTitle />

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
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {/* File Attachment Button */}
                  <div className="relative">
                    <input
                      type="file"
                      id="attach-file"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e.target.files)}
                      accept=".pdf,.txt,.csv,.json"
                      multiple
                      disabled={generatingForm}
                    />
                    <label
                      htmlFor="attach-file"
                      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all border shadow-sm ${generatingForm ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50 hover:border-gray-300"} ${attachedFiles.length > 0
                        ? "bg-blue-50 border-blue-200 text-blue-700 shadow-none"
                        : "bg-white border-gray-200 text-gray-700"
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
                      id="scan-doc"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e.target.files)}
                      accept="image/*"
                      capture="environment"
                      multiple
                      disabled={generatingForm}
                    />
                    <label
                      htmlFor="scan-doc"
                      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all border shadow-sm ${generatingForm ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50 hover:border-gray-300"} bg-white border-gray-200 text-gray-700`}
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
                      onChange={(e) => handleFileSelect(e.target.files)}
                      accept=".json"
                      multiple
                      disabled={generatingForm}
                    />
                    <label
                      htmlFor="import-json"
                      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all border shadow-sm ${generatingForm ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50 hover:border-gray-300"} bg-white border-gray-200 text-gray-700`}
                    >
                      <FileJson className="w-4 h-4" />
                      Import JSON
                    </label>
                  </div>

                  {/* URL Attachment Button */}
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    disabled={generatingForm}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all border shadow-sm ${attachedUrl
                      ? "bg-blue-50 border-blue-200 text-blue-700 shadow-none"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                      }`}
                  >
                    <Globe className="w-4 h-4" />
                    {attachedUrl ? "URL Attached" : "Attach URL"}
                  </button>

                  {attachedFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => clearAttachments()}
                      disabled={generatingForm}
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
                          disabled={generatingForm}
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
                      className="flex-1 px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ background: 'var(--background-subtle)', border: 'none' }}
                      disabled={generatingForm}
                    />
                    {attachedUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setAttachedUrl("");
                          setShowUrlInput(false);
                        }}
                        disabled={generatingForm}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-md disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

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
                      <span>{statusMessage || (attachedFiles.some(f => f.status === 'parsing') ? 'Processing Files...' : 'Generating...')}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Form
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full">
            {/* Header for the list */}
            <div className="flex items-center justify-between mb-2 px-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Your Forms</h3>
              <button
                onClick={openBuilderForCreate}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create From Scratch
              </button>
            </div>

            {/* Existing Forms List */}
            {forms.map((form) => (
              <div
                key={form.id}
                className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg transition-all duration-200 hover:bg-black/5"
                style={{
                  color: 'var(--foreground)',
                }}
              >
                <Link href={`/forms/${form.id}/submissions`} className="flex-1 flex items-start sm:items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                    <FileText className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-semibold text-base truncate pr-2" style={{ color: 'var(--foreground)' }}>
                      {form.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-3.5 h-3.5" />
                        {form._count?.submissions || 0}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(form.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-1 mt-3 sm:mt-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent Link navigation
                      openBuilderForEdit(form.id)
                    }}
                    className="p-2 rounded-lg hover:bg-black/5 transition-colors text-gray-500"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <div onClick={(e) => e.stopPropagation()}>
                    <ShareButton url={`/f/${form.id}`} formTitle={form.title} variant="icon-only" />
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteForm(form.id)
                    }}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Visual loading overlay for deleting/loading */}
                {(deletingFormId === form.id || loadingFormId === form.id) && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 backdrop-blur-sm rounded-lg">
                    <Spinner size="md" variant="primary" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
