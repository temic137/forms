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
const VoiceModeLazy = lazy(() => import("@/components/voice/VoiceModeLazy"));
import PostSaveShareModal from "@/components/PostSaveShareModal";
import AnimatedFormTitle from "@/components/AnimatedFormTitle";
import AnimatedDashboardSubtitle from "@/components/AnimatedDashboardSubtitle";
import { FileText, Edit2, Trash2, BarChart3, Sparkles, Upload, Globe, Camera, FileJson, Plus, AlertCircle, X, UserPlus, History, Clock, Mic } from "lucide-react";
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
import UpgradeAccountModal from "@/components/UpgradeAccountModal";

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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Check if user is anonymous/guest
  const isGuestUser = (session?.user as { isAnonymous?: boolean })?.isAnonymous === true;

  // Builder state (used for both AI-generated and manual creation)
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewFields, setPreviewFields] = useState<Field[]>([]);
  const [previewStyling, setPreviewStyling] = useState<FormStyling | undefined>(undefined);
  const [previewNotifications, setPreviewNotifications] = useState<NotificationConfig | undefined>(undefined);
  const [previewMultiStepConfig, setPreviewMultiStepConfig] = useState<MultiStepConfig | undefined>(undefined);
  const [previewQuizMode, setPreviewQuizMode] = useState<QuizModeConfig | undefined>(undefined);
  const [previewConversationalMode, setPreviewConversationalMode] = useState(false);
  const [limitOneResponse, setLimitOneResponse] = useState(false);
  const [saveAndEdit, setSaveAndEdit] = useState(false);

  // Scheduling state
  const [closesAt, setClosesAt] = useState<string | undefined>(undefined);
  const [opensAt, setOpensAt] = useState<string | undefined>(undefined);
  const [isClosed, setIsClosed] = useState(false);
  const [closedMessage, setClosedMessage] = useState<string | undefined>(undefined);
  
  // Voice Mode state
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);

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
    generateForm
  } = useFormGenerator({
    confirm,
    onSuccess: (data) => {
      setPreviewTitle(data.title);
      setPreviewFields(data.fields);
      setPreviewStyling(undefined);
      setPreviewMultiStepConfig(undefined);
      setPreviewQuizMode(data.quizMode as QuizModeConfig | undefined);
      setPreviewConversationalMode(data.conversationalMode || false);
      // Reset scheduling for generated forms
      setClosesAt(undefined);
      setOpensAt(undefined);
      setIsClosed(false);
      setClosedMessage(undefined);
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
    if (data.conversationalMode !== undefined) setPreviewConversationalMode(data.conversationalMode);
    if (data.limitOneResponse !== undefined) setLimitOneResponse(data.limitOneResponse);
    if (data.limitOneResponse !== undefined) setLimitOneResponse(data.limitOneResponse);
    if (data.saveAndEdit !== undefined) setSaveAndEdit(data.saveAndEdit);
    // Scheduling updates from collaborator
    if (data.closesAt !== undefined) setClosesAt(data.closesAt);
    if (data.opensAt !== undefined) setOpensAt(data.opensAt);
    if (data.isClosed !== undefined) setIsClosed(data.isClosed);
    if (data.closedMessage !== undefined) setClosedMessage(data.closedMessage);

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
      // Restore quiz mode configuration
      setPreviewQuizMode(previewData.quizMode || undefined);
      setPreviewConversationalMode(previewData.conversationalMode || false);
      // Restore other settings
      setLimitOneResponse(previewData.limitOneResponse || false);
      setSaveAndEdit(previewData.saveAndEdit || false);
      setClosesAt(previewData.closesAt || undefined);
      setOpensAt(previewData.opensAt || undefined);
      setIsClosed(previewData.isClosed || false);
      setClosedMessage(previewData.closedMessage || undefined);
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
    setPreviewConversationalMode(false);
    setLimitOneResponse(false);
    setLimitOneResponse(false);
    setSaveAndEdit(false);
    setClosesAt(undefined);
    setOpensAt(undefined);
    setIsClosed(false);
    setClosedMessage(undefined);
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
        setPreviewConversationalMode(data.conversationalMode || false);
        setLimitOneResponse(data.limitOneResponse || false);
        setLimitOneResponse(data.limitOneResponse || false);
        setSaveAndEdit(data.saveAndEdit || false);
        setClosesAt(data.closesAt || undefined);
        setOpensAt(data.opensAt || undefined);
        setIsClosed(data.isClosed || false);
        setClosedMessage(data.closedMessage || undefined);
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
          conversationalMode: previewConversationalMode,
          limitOneResponse,
          saveAndEdit,
          closesAt,
          opensAt,
          isClosed,
          closedMessage,
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
        setPreviewConversationalMode(false);
        setLimitOneResponse(false);
        setSaveAndEdit(false);
      }
    } else {
      setShowBuilder(false);
      setEditingFormId(null);
      setPreviewStyling(undefined);
      setPreviewMultiStepConfig(undefined);
      setPreviewConversationalMode(false);
      setLimitOneResponse(false);
      setLimitOneResponse(false);
      setSaveAndEdit(false);
      setClosesAt(undefined);
      setOpensAt(undefined);
      setIsClosed(false);
      setClosedMessage(undefined);
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
            conversationalMode={previewConversationalMode}
            limitOneResponse={limitOneResponse}
            saveAndEdit={saveAndEdit}
            currentFormId={editingFormId}
            onFormTitleChange={setPreviewTitle}
            onFieldsChange={setPreviewFields}
            onStylingChange={setPreviewStyling}
            onNotificationsChange={setPreviewNotifications}
            onMultiStepConfigChange={setPreviewMultiStepConfig}
            onQuizModeChange={setPreviewQuizMode}
            onConversationalModeChange={setPreviewConversationalMode}
            onLimitOneResponseChange={setLimitOneResponse}
            onSaveAndEditChange={setSaveAndEdit}

            // Scheduling props
            closesAt={closesAt}
            opensAt={opensAt}
            isClosed={isClosed}
            closedMessage={closedMessage}
            onClosesAtChange={setClosesAt}
            onOpensAtChange={setOpensAt}
            onIsClosedChange={setIsClosed}
            onClosedMessageChange={setClosedMessage}

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
      <UpgradeAccountModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
      <div
        className="min-h-screen font-paper paper-texture bg-paper"
      >
        {/* Guest User Upgrade Banner */}
        {isGuestUser && (
          <div
            className="bg-white border-b border-black/10"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-center sm:text-left">
                  <UserPlus className="w-5 h-5 text-black hidden sm:block" />
                  <p className="text-base text-black font-paper">
                    <span className="font-bold">You&apos;re using guest mode.</span>
                    <span className="hidden sm:inline"> Create an account to save your forms permanently.</span>
                  </p>
                </div>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="paper-button paper-button-primary px-6 py-2 text-base whitespace-nowrap"
                >
                  Create Account
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center">
          {/* Welcome Header - Simplified and Friendlier */}
          <div className="mb-8 text-center w-full">
            <h1
              className="text-4xl font-bold mb-3 text-black font-paper"
            >
              {forms.length === 0 ? "Welcome to AnyForm" : "Dashboard"}
            </h1>
            <p
              className="text-lg max-w-xl mx-auto text-black/60 font-paper"
            >
              {forms.length === 0
                ? "Let's create your first form. Just describe what you need, and AI will build it for you."
                : <AnimatedDashboardSubtitle />}
            </p>
          </div>

          {/* Main Creation Area - Clean and Simple */}
          <div className="max-w-3xl mx-auto mb-10 w-full">
            <div className="mb-4 flex justify-center">
              <div className="flex items-center justify-center mb-2">
                <AnimatedFormTitle />

              </div>
            </div>


            <form onSubmit={handleSubmit} className="space-y-3 w-full">
              {/* Voice Mode Inline */}
              {isVoiceModeActive ? (
                <div className="bg-white border-2 border-black/20 rounded-xl p-4 sm:p-6">
                  <Suspense fallback={<div className="p-6"><Spinner size="md" variant="primary" /></div>}>
                    <VoiceModeLazy
                      inline
                      onTranscriptComplete={(transcript) => {
                        setQuery(transcript);
                      }}
                    />
                  </Suspense>
                  <button
                    type="button"
                    onClick={() => setIsVoiceModeActive(false)}
                    className="mt-3 text-xs sm:text-sm font-bold text-black/60 hover:text-black font-paper underline touch-manipulation min-h-[44px] flex items-center"
                  >
                    ← Switch to typing
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <textarea
                    id="prompt"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Describe your form here... (e.g., 'A registration form for a cooking class with dietary restrictions')"
                    className="paper-input w-full px-4 py-4 text-base resize-none border-2 border-black/20 focus:border-black/40 rounded-xl bg-white"
                    style={{
                      minHeight: '100px'
                    }}
                    disabled={generatingForm}
                  />
                </div>
              )}

              {/* Attachments Area */}
              <div className="space-y-2 flex flex-col items-center">
                <div className="flex flex-wrap gap-2 justify-center">
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
                      className={`paper-button flex items-center gap-1.5 px-3 py-2 text-sm font-bold cursor-pointer border-2 ${generatingForm ? "opacity-50 cursor-not-allowed" : ""} ${attachedFiles.length > 0
                        ? "bg-black text-white border-black"
                        : "bg-white text-black border-black/20 hover:border-black/40"
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
                      className={`paper-button flex items-center gap-1.5 px-3 py-2 text-sm font-bold bg-white text-black cursor-pointer border-2 border-black/20 hover:border-black/40 ${generatingForm ? "opacity-50 cursor-not-allowed" : ""}`}
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
                      className={`paper-button flex items-center gap-1.5 px-3 py-2 text-sm font-bold bg-white text-black cursor-pointer border-2 border-black/20 hover:border-black/40 ${generatingForm ? "opacity-50 cursor-not-allowed" : ""}`}
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
                    className={`paper-button flex items-center gap-1.5 px-3 py-2 text-sm font-bold border-2 ${attachedUrl
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-black/20 hover:border-black/40"
                      }`}
                  >
                    <Globe className="w-4 h-4" />
                    {attachedUrl ? "URL Attached" : "Attach URL"}
                  </button>

                  {/* Voice Mode Button - only show when not in voice mode */}
                  {!isVoiceModeActive && (
                    <button
                      type="button"
                      onClick={() => setIsVoiceModeActive(true)}
                      disabled={generatingForm}
                      className="paper-button flex items-center gap-1.5 px-3 py-2 text-sm font-bold bg-white text-black border-2 border-black/20 hover:border-black/40"
                    >
                      <Mic className="w-4 h-4" />
                      Voice Mode
                    </button>
                  )}

                  {attachedFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => clearAttachments()}
                      disabled={generatingForm}
                      className="paper-button flex items-center gap-1.5 px-3 py-2 text-sm font-bold bg-white text-black ml-auto disabled:opacity-50 border-2 border-black/20 hover:border-red-500 hover:text-red-500"
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
                        className={`paper-card group flex items-center gap-2 px-3 py-2 text-sm border-2 ${file.status === 'error'
                          ? 'bg-white text-black border-black/20'
                          : file.status === 'parsing'
                            ? 'bg-white text-black border-black/20'
                            : 'bg-white text-black border-black/20'
                          }`}
                        title={file.errorMessage}
                      >
                        <div className="flex-1 flex items-center gap-2">
                          {file.status === 'parsing' ? (
                            <Spinner size="xs" variant="primary" />
                          ) : file.status === 'error' ? (
                            <AlertCircle className="w-4 h-4 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 shrink-0 text-black" />
                          )}

                          <div className="flex flex-col min-w-0 max-w-[150px]">
                            <span className="truncate font-bold">{file.file.name}</span>
                            <span className="text-xs opacity-70">{(file.file.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          disabled={generatingForm}
                          className="p-1 rounded-full hover:bg-black/5 text-black disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <X className="w-3 h-3" />
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
                      className="paper-input flex-1 px-3 py-2 text-sm border-2 border-black/20 focus:border-black/40 rounded-xl"
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
                        className="paper-button p-2 bg-white text-black disabled:opacity-50 border-2 border-black/20 hover:border-red-500 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={!query.trim() || generatingForm}
                  className="paper-button paper-button-primary flex-1 py-3 px-6 text-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2 border-2 border-black shadow-none hover:shadow-none transition-transform active:scale-[0.98]"
                >
                  {generatingForm ? (
                    <>
                      <Spinner size="sm" variant="current" />
                      <span>{statusMessage || (attachedFiles.some(f => f.status === 'parsing') ? 'Processing Files...' : 'Generating...')}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Form
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="flex flex-col gap-3 max-w-3xl mx-auto w-full">
            {/* Header for the list */}
            <div className="flex items-center justify-between mb-3 px-2">
              <h3 className="text-lg font-bold text-black font-paper">Your Forms</h3>
              <button
                onClick={openBuilderForCreate}
                className="paper-button px-4 py-2 bg-white text-black flex items-center gap-2 border-2 border-black/20 hover:border-black/40 font-bold text-sm"
              >
                <Plus className="w-4 h-4" />
                Create From Scratch
              </button>
            </div>

            {/* Existing Forms List */}
            {forms.map((form) => (
              <div
                key={form.id}
                className="paper-card group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 transition-all duration-200 border-2 border-black/10 hover:border-black/30 bg-white rounded-xl"
              >
                <Link href={`/forms/${form.id}/submissions`} className="flex-1 flex items-start sm:items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-black/5 flex items-center justify-center shrink-0 border border-black/10">
                    <FileText className="w-5 h-5 text-black" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-bold text-lg truncate pr-2 flex items-center gap-2 text-black font-paper">
                      {form.title}
                      {/* Status Badges */}
                      {(form.isClosed || (form.closesAt && new Date(form.closesAt) < new Date())) && (
                        <span className="paper-badge inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-black/5 text-black border border-black/10">
                          <History className="w-3 h-3" />
                          Closed
                        </span>
                      )}
                      {(!form.isClosed && form.opensAt && new Date(form.opensAt) > new Date()) && (
                        <span className="paper-badge inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-black/5 text-black border border-black/10">
                          <Clock className="w-3 h-3" />
                          Scheduled
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-3 text-sm mt-1 text-black/60 font-paper">
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
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
                    className="p-2 rounded-full hover:bg-black/5 transition-colors text-black border border-transparent hover:border-black/10"
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
                    className="p-2 rounded-full hover:bg-black/5 transition-colors text-black border border-transparent hover:border-black/10"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Visual loading overlay for deleting/loading */}
                {(deletingFormId === form.id || loadingFormId === form.id) && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 backdrop-blur-sm rounded-[20px]">
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
