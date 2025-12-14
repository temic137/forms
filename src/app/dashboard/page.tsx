"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import Link from "next/link";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { Field, FormStyling, NotificationConfig, MultiStepConfig, QuizModeConfig } from "@/types/form";
import { CreationMethodInline } from "@/components/CreationMethodSelector";
import InlineFileUpload from "@/components/InlineFileUpload";
import InlineDocumentScanner from "@/components/InlineDocumentScanner";
import InlineJSONImport from "@/components/InlineJSONImport";
import InlineURLScraper from "@/components/InlineURLScraper";
import ShareButton from "@/components/ShareButton";
// import IntegrationButton from "@/components/IntegrationButton";
import DragDropFormBuilder from "@/components/builder/DragDropFormBuilder";
import { FileText, Calendar, Edit2, Trash2, BarChart3, Sparkles, Upload, Globe, Camera, FileJson, Plus } from "lucide-react";
import { useToastContext } from "@/contexts/ToastContext";
import { ConfirmationDialog, useConfirmDialog } from "@/components/ui/ConfirmationDialog";
import { useCollaboration } from "@/hooks/useCollaboration";

interface Form {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    submissions: number;
  };
}

export default function DashboardPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const toast = useToastContext();
  const { confirm, dialogState } = useConfirmDialog();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form generation state
  const [query, setQuery] = useState("");
  const [generatingForm, setGeneratingForm] = useState(false);
  const [showSuccess] = useState(false);
  const [newFormId] = useState<string | null>(null);
  const [savingForm, setSavingForm] = useState(false);
  const [deletingFormId, setDeletingFormId] = useState<string | null>(null);
  const [loadingFormId, setLoadingFormId] = useState<string | null>(null);
  
  // Creation method state
  const [creationMethod, setCreationMethod] = useState<CreationMethodInline>("prompt");
  
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

  useEffect(() => {
    if (status === "authenticated") {
      fetchForms();
    }
  }, [status]);

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

  const fetchForms = async () => {
    try {
      const response = await fetch("/api/forms/my-forms");
      if (response.ok) {
        const data = await response.json();
        setForms(data.forms);
      }
    } catch (error) {
      console.error("Error fetching forms:", error);
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

      // Use generate-enhanced for better results with context
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
  
  async function handleFileUpload(file: File) {
    setGeneratingForm(true);
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
        // Preserve quizConfig with default points of 1
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
      setPreviewStyling(undefined); // Use defaults from StyleEditor
      setPreviewMultiStepConfig(undefined);
      // Set quiz mode if API returned it
      setPreviewQuizMode(data.quizMode as QuizModeConfig | undefined);
      setEditingFormId(null);
      setShowBuilder(true); // Use drag-drop builder
      setCreationMethod("prompt");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setGeneratingForm(false);
    }
  }

  async function handleDocumentScan(file: File) {
    setGeneratingForm(true);
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
      setPreviewStyling(undefined); // Use defaults from StyleEditor
      setEditingFormId(null);
      setShowBuilder(true); // Use drag-drop builder
      setCreationMethod("prompt");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to scan document");
    } finally {
      setGeneratingForm(false);
    }
  }

  async function handleJSONImport(jsonData: { title?: string; fields: Array<Partial<Field>> }) {
    setGeneratingForm(true);
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
      setPreviewStyling(undefined); // Use defaults from StyleEditor
      setPreviewMultiStepConfig(undefined);
      setEditingFormId(null);
      setShowBuilder(true); // Use drag-drop builder
      setCreationMethod("prompt");
    } finally {
      setGeneratingForm(false);
    }
  }

  async function handleURLScrape(url: string) {
    setGeneratingForm(true);
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
        // Preserve quizConfig with default points of 1
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
      setPreviewStyling(undefined); // Use defaults from StyleEditor
      // Set quiz mode if API returned it
      setPreviewQuizMode(data.quizMode as QuizModeConfig | undefined);
      setPreviewMultiStepConfig(undefined);
      setEditingFormId(null);
      setShowBuilder(true); // Use drag-drop builder
      setCreationMethod("prompt");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to scrape URL and generate form");
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

  // Save form from builder
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
    try {
      let url: string;
      let method: string;

      if (editingFormId) {
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
        
        // If creating a new form, set the editingFormId to the newly created form's ID
        // This allows the user to continue editing and keeps the builder open
        if (!editingFormId && data.id) {
          setEditingFormId(data.id);
        }
        
        // Keep the builder open in both cases (new and existing forms)
        await fetchForms();
      } else {
        const error = await response.json();
        toast.error(`Failed to save form: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error saving form:", error);
      toast.error("Failed to save form. Please try again.");
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

    setDeletingFormId(formId);
    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setForms(forms.filter((f) => f.id !== formId));
        toast.success("Form deleted successfully");
      } else {
        toast.error("Failed to delete form");
      }
    } catch (error) {
      console.error("Error deleting form:", error);
      toast.error("Failed to delete form");
    } finally {
      setDeletingFormId(null);
    }
  };

  if (status === "loading" || loading) {
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
            {forms.length === 0 ? "Welcome to Forms" : "Dashboard"}
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

        {/* Main Creation Area - Centered and Focused */}
        <div className="max-w-3xl mx-auto mb-16">
          <Card className="overflow-hidden border-2 shadow-lg transition-all hover:shadow-xl">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="p-2 rounded-lg"
                    style={{
                      background: 'var(--accent-light)',
                      color: 'var(--accent)',
                    }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <CardTitle>Magic Form Generator</CardTitle>
                </div>
                {creationMethod !== 'prompt' && (
                  <button 
                    onClick={() => setCreationMethod('prompt')}
                    className="text-sm hover:underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    Back to AI Generator
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              
              {/* AI Prompt Method (Default) */}
              {creationMethod === "prompt" && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <textarea
                      id="prompt"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Describe your form here... (e.g., 'A registration form for a cooking class with dietary restrictions')"
                      className="w-full px-4 py-4 text-lg border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-sm"
                      style={{
                        minHeight: '120px',
                        background: 'var(--background)',
                        borderColor: 'var(--card-border)',
                        color: 'var(--foreground)'
                      }}
                      disabled={generatingForm}
                    />
                    {isSupported && (
                      <button
                        type="button"
                        onClick={handleVoiceClick}
                        className="absolute right-3 bottom-3 p-3 rounded-full transition-all shadow-sm hover:shadow-md"
                        style={{
                          background: isListening ? '#ef4444' : 'var(--card-bg)',
                          border: '1px solid var(--card-border)',
                          color: isListening ? '#fff' : 'var(--foreground)',
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
                    <div className="flex gap-2">
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
                    <div className="text-center text-sm font-medium animate-pulse" style={{ color: 'var(--accent)' }}>
                      Auto-generating in {autoSubmitCountdown}s...
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={!query.trim() || generatingForm}
                      className="flex-1 py-3 px-6 rounded-xl font-bold text-lg transition-all disabled:opacity-50 shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
                      style={{
                        background: 'var(--accent)',
                        color: 'var(--accent-dark)',
                      }}
                    >
                      {generatingForm ? (
                        <>
                          <Spinner size="sm" variant="current" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Generate Form
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={openBuilderForCreate}
                      className="px-6 py-3 rounded-xl font-medium transition-all hover:bg-opacity-80 border-2"
                      style={{
                        borderColor: 'var(--card-border)',
                        color: 'var(--foreground)',
                      }}
                      title="Build manually"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              )}

              {/* Other Methods */}
              {creationMethod === "file" && (
                <InlineFileUpload
                  onFileSelect={handleFileUpload}
                  onCancel={() => setCreationMethod("prompt")}
                  disabled={generatingForm}
                />
              )}

              {creationMethod === "scan" && (
                <InlineDocumentScanner
                  onFileSelect={handleDocumentScan}
                  onCancel={() => setCreationMethod("prompt")}
                  disabled={generatingForm}
                />
              )}

              {creationMethod === "json" && (
                <InlineJSONImport
                  onImport={handleJSONImport}
                  onCancel={() => setCreationMethod("prompt")}
                  disabled={generatingForm}
                />
              )}

              {creationMethod === "url" && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Paste a website URL and our AI will analyze the content to generate an appropriate form.
                  </p>
                  <InlineURLScraper
                    onURLSubmit={handleURLScrape}
                    onCancel={() => setCreationMethod("prompt")}
                    disabled={generatingForm}
                  />
                </div>
              )}

              {/* Success Message */}
              {showSuccess && newFormId && (
                <div 
                  className="mt-4 p-4 rounded-lg animate-in fade-in slide-in-from-top-2"
                  style={{ 
                    background: 'rgba(34, 197, 94, 0.1)', 
                    border: '1px solid rgba(34, 197, 94, 0.2)',
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
            </CardContent>
            
            {/* Footer with Alternative Methods */}
            {creationMethod === 'prompt' && (
              <div className="bg-opacity-50 px-6 py-4 border-t" style={{ background: 'var(--background-subtle)', borderColor: 'var(--card-border)' }}>
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                  <span style={{ color: 'var(--foreground-muted)' }}>Or try these methods:</span>
                  
                  <button 
                    onClick={() => setCreationMethod('file')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    style={{ color: 'var(--foreground)' }}
                  >
                    <Upload className="w-4 h-4" />
                    Upload File
                  </button>
                  
                  <button 
                    onClick={() => setCreationMethod('url')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    style={{ color: 'var(--foreground)' }}
                  >
                    <Globe className="w-4 h-4" />
                    Website URL
                  </button>
                  
                  <button 
                    onClick={() => setCreationMethod('scan')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    style={{ color: 'var(--foreground)' }}
                  >
                    <Camera className="w-4 h-4" />
                    Scan Doc
                  </button>

                  <button 
                    onClick={() => setCreationMethod('json')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    style={{ color: 'var(--foreground)' }}
                  >
                    <FileJson className="w-4 h-4" />
                    Import JSON
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Existing Forms Section */}
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
          <div className="text-center py-12 rounded-2xl border-2 border-dashed" style={{ borderColor: 'var(--card-border)' }}>
            <div className="mb-4">
              <div 
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
                style={{
                  background: 'var(--background-subtle)',
                  color: 'var(--foreground-muted)',
                }}
              >
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium mb-1" style={{ color: 'var(--foreground)' }}>No forms yet</h3>
              <p style={{ color: 'var(--foreground-muted)' }}>Use the Magic Generator above to create your first form!</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form) => (
              <Card key={form.id} hover className="flex flex-col transition-all hover:-translate-y-1 hover:shadow-md group">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div 
                        className="p-2.5 rounded-xl shrink-0 transition-colors group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20"
                        style={{
                          background: 'var(--background-subtle)',
                          color: 'var(--accent)',
                        }}
                      >
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="truncate text-lg mb-1">{form.title}</CardTitle>
                        <div 
                          className="flex items-center gap-1.5 text-xs font-medium"
                          style={{ color: 'var(--foreground-muted)' }}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(form.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                        {form._count.submissions}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                        responses
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-2">
                    <Link
                      href={`/forms/${form.id}/submissions`}
                      className="col-span-2 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors hover:bg-opacity-90"
                      style={{
                        background: 'var(--background-subtle)',
                        color: 'var(--foreground)',
                      }}
                    >
                      <BarChart3 className="w-4 h-4" />
                      View Results
                    </Link>
                    
                    <button
                      onClick={() => openBuilderForEdit(form.id)}
                      disabled={loadingFormId === form.id}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors hover:bg-opacity-90 border"
                      style={{
                        borderColor: 'var(--card-border)',
                        color: 'var(--foreground)',
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>

                    <ShareButton 
                      url={`${typeof window !== "undefined" ? window.location.origin : ""}/f/${form.id}`}
                      label="Share"
                      variant="subtle"
                      size="md"
                      formTitle={form.title}
                      className="w-full"
                    />
                    
                    <button
                      onClick={() => deleteForm(form.id)}
                      disabled={deletingFormId === form.id}
                      className="flex items-center justify-center py-2.5 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                      title="Delete form"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
