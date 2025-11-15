"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Link from "next/link";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { Field, FormStyling, NotificationConfig, MultiStepConfig } from "@/types/form";
import CreationMethodSelector, { CreationMethodInline } from "@/components/CreationMethodSelector";
import InlineFileUpload from "@/components/InlineFileUpload";
import InlineDocumentScanner from "@/components/InlineDocumentScanner";
import InlineJSONImport from "@/components/InlineJSONImport";
import InlineURLScraper from "@/components/InlineURLScraper";
import ShareButton from "@/components/ShareButton";
// import IntegrationButton from "@/components/IntegrationButton";
import DragDropFormBuilder from "@/components/builder/DragDropFormBuilder";
import { FileText, MessageSquare, Calendar, Edit2, Trash2, BarChart3 } from "lucide-react";
import { useToastContext } from "@/contexts/ToastContext";
import { ConfirmationDialog, useConfirmDialog } from "@/components/ConfirmationDialog";

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
  const { status } = useSession();
  const router = useRouter();
  const toast = useToastContext();
  const { confirm, dialogState } = useConfirmDialog();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form generation state
  const [query, setQuery] = useState("");
  const [generatingForm, setGeneratingForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newFormId, setNewFormId] = useState<string | null>(null);
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
  const [conversationalMode, setConversationalMode] = useState(false);
  const [previewStyling, setPreviewStyling] = useState<FormStyling | undefined>(undefined);
  const [previewNotifications, setPreviewNotifications] = useState<NotificationConfig | undefined>(undefined);
  const [previewMultiStepConfig, setPreviewMultiStepConfig] = useState<MultiStepConfig | undefined>(undefined);

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
    if (status === "authenticated") {
      const storedEditingFormId = sessionStorage.getItem('formPreviewEditingFormId');
      const storedPreviewData = sessionStorage.getItem('formPreviewData');

      if (storedEditingFormId && storedPreviewData && !editingFormId && !showBuilder) {
        // Restore the preview/builder state from sessionStorage
        try {
          const previewData = JSON.parse(storedPreviewData);
          setPreviewTitle(previewData.title || "Untitled Form");
          setPreviewFields(Array.isArray(previewData.fields) ? previewData.fields : []);
          setPreviewStyling(previewData.styling || undefined);
          setPreviewNotifications(previewData.notifications || undefined);
          setPreviewMultiStepConfig(previewData.multiStepConfig || undefined);
          setShowBuilder(true);
          setEditingFormId(storedEditingFormId === 'preview' ? null : storedEditingFormId);

          // Clean up sessionStorage
          sessionStorage.removeItem('formPreviewEditingFormId');
          sessionStorage.removeItem('formPreviewData');
        } catch (error) {
          console.error('Error restoring preview state:', error);
          sessionStorage.removeItem('formPreviewEditingFormId');
          sessionStorage.removeItem('formPreviewData');
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

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
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      });
      
      if (!res.ok) throw new Error("Failed to generate form");
      
      const data = await res.json() as { 
        title: string; 
        fields: Partial<Field>[];
        context?: {
          analysis?: any;
          summary?: string;
        };
      };
      
      // Log context for debugging (contains rich analysis)
      if (data.context) {
        console.log("Form context analysis:", data.context);
      }
      
      const normalizedFields = data.fields.map((f: Partial<Field>, idx: number) => ({
        id: f.id || `field_${Date.now()}_${idx}`,
        label: f.label || "Field",
        type: f.type || "text",
        required: f.required || false,
        options: f.options || [],
        placeholder: f.placeholder,
        helpText: f.helpText,
        validation: f.validation,
        order: idx,
        conditionalLogic: [],
        color: '#ffffff',
      }));

      // Open builder with generated form
      setPreviewTitle(data.title);
      setPreviewFields(normalizedFields);
      setPreviewStyling(undefined); // Use defaults from StyleEditor
      setPreviewMultiStepConfig(undefined);
      setConversationalMode(false);
      setEditingFormId(null); // This is a new form
      setShowBuilder(true); // Use drag-drop builder instead of old preview
      setQuery("");
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
        order: idx,
        conditionalLogic: [],
        color: '#ffffff',
      }));
      
      setPreviewTitle(data.title || "Imported Form");
      setPreviewFields(normalizedFields);
      setPreviewStyling(undefined); // Use defaults from StyleEditor
      setPreviewMultiStepConfig(undefined);
      setConversationalMode(false);
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
      setConversationalMode(false);
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
      setConversationalMode(false);
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
        order: f.order || idx,
        conditionalLogic: f.conditionalLogic || [],
        color: '#ffffff',
      }));
      
      setPreviewTitle(data.title || "Form from URL");
      setPreviewFields(normalizedFields);
      setPreviewStyling(undefined); // Use defaults from StyleEditor
      setPreviewMultiStepConfig(undefined);
      setConversationalMode(false);
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
      const url = editingFormId ? `/api/forms/${editingFormId}` : "/api/forms";
      const method = editingFormId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: previewTitle,
          fields: previewFields,
          styling: previewStyling,
          notifications: previewNotifications,
          multiStepConfig: previewMultiStepConfig,
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
      }
    } else {
      setShowBuilder(false);
      setEditingFormId(null);
      setPreviewStyling(undefined);
      setPreviewMultiStepConfig(undefined);
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
          <div className="relative w-5 h-5">
            <div className="absolute inset-0 border-2 border-current border-opacity-25 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          </div>
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
          onFormTitleChange={setPreviewTitle}
          onFieldsChange={setPreviewFields}
          onStylingChange={setPreviewStyling}
          onNotificationsChange={setPreviewNotifications}
          onMultiStepConfigChange={setPreviewMultiStepConfig}
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
        {/* Header */}
        <div className="mb-8">
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: 'var(--foreground)' }}
          >
            My Forms
          </h1>
          <p style={{ color: 'var(--foreground-muted)' }}>
            Create forms with AI or view responses to your existing forms
          </p>
        </div>

        {/* Form Generation Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{
                    background: 'var(--accent-light)',
                    color: 'var(--accent)',
                  }}
                >
                  <FileText className="w-5 h-5" />
                </div>
                <CardTitle>Create New Form</CardTitle>
              </div>
              <button
                onClick={openBuilderForCreate}
                className="px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--accent-dark)',
                }}
              >
                <span className="flex items-center gap-2">
                  <Edit2 className="w-4 h-4" />
                  Open Builder
                </span>
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Creation Method Selector */}
            <div className="mb-6">
              <CreationMethodSelector
                selectedMethod={creationMethod}
                onMethodChange={setCreationMethod}
                disabled={generatingForm}
              />
            </div>

            {/* AI Prompt Method */}
            {creationMethod === "prompt" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label 
                    htmlFor="prompt" 
                    className="block text-sm font-medium mb-2"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Describe your form
                  </label>
                  <div className="relative">
                    <textarea
                      id="prompt"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="E.g., Create a customer feedback form with name, email, rating, and comments"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                      style={{
                        minHeight: '80px',
                      }}
                      disabled={generatingForm}
                    />
                    {isSupported && (
                      <button
                        type="button"
                        onClick={handleVoiceClick}
                        className="absolute right-3 top-3 p-2 rounded-lg transition-all"
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
                  {isListening && autoSubmitCountdown !== null && (
                    <div className="mt-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                      Auto-generating in {autoSubmitCountdown}s...
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!query.trim() || generatingForm}
                  className="w-full py-3 px-4 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--accent-dark)',
                  }}
                >
                  {generatingForm && (
                    <div className="relative w-4 h-4">
                      <div className="absolute inset-0 border-2 border-current border-opacity-25 rounded-full"></div>
                      <div className="absolute inset-0 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  {generatingForm ? "Generating Form..." : "Generate Form with AI"}
                </button>
              </form>
            )}

            {/* File Upload Method */}
            {creationMethod === "file" && (
              <InlineFileUpload
                onFileSelect={handleFileUpload}
                onCancel={() => setCreationMethod("prompt")}
                disabled={generatingForm}
              />
            )}

            {/* Document Scanner Method */}
            {creationMethod === "scan" && (
              <InlineDocumentScanner
                onFileSelect={handleDocumentScan}
                onCancel={() => setCreationMethod("prompt")}
                disabled={generatingForm}
              />
            )}

            {/* JSON Import Method */}
            {creationMethod === "json" && (
              <InlineJSONImport
                onImport={handleJSONImport}
                onCancel={() => setCreationMethod("prompt")}
                disabled={generatingForm}
              />
            )}

            {/* URL Scraping Method */}
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

            {showSuccess && newFormId && (
              <div 
                className="mt-4 p-4 rounded-lg"
                style={{ 
                  background: 'rgba(34, 197, 94, 0.1)', 
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  color: '#22c55e'
                }}
              >
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <div className="font-medium mb-1">Form created successfully!</div>
                    <div className="flex gap-2 mt-2">
                      <Link
                        href={`/forms/${newFormId}/submissions`}
                        className="px-3 py-1 rounded text-sm font-medium"
                        style={{
                          background: 'rgba(34, 197, 94, 0.2)',
                          color: '#22c55e',
                        }}
                      >
                        View Form
                      </Link>
                      <button
                        onClick={() => {
                          const link = `${window.location.origin}/f/${newFormId}`;
                          navigator.clipboard.writeText(link);
                          toast.success('Link copied!');
                        }}
                        className="px-3 py-1 rounded text-sm font-medium"
                        style={{
                          background: 'rgba(34, 197, 94, 0.2)',
                          color: '#22c55e',
                        }}
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Existing Forms Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 
              className="text-2xl font-semibold"
              style={{ color: 'var(--foreground)' }}
            >
              Your Forms
            </h2>
            {forms.length > 0 && (
              <span 
                className="text-sm px-3 py-1 rounded-full"
                style={{ 
                  background: 'var(--accent-light)',
                  color: 'var(--accent)',
                }}
              >
                {forms.length} {forms.length === 1 ? 'form' : 'forms'}
              </span>
            )}
          </div>
        </div>

        {forms.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <div className="mb-6">
                <div 
                  className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
                  style={{
                    background: 'var(--accent-light)',
                    color: 'var(--accent)',
                  }}
                >
                  <FileText className="w-10 h-10" />
                </div>
              </div>
              <h3 
                className="text-xl font-semibold mb-2"
                style={{ color: 'var(--foreground)' }}
              >
                No forms yet
              </h3>
              <p 
                className="mb-6 max-w-md mx-auto"
                style={{ color: 'var(--foreground-muted)' }}
              >
                Create your first form using AI, upload a file, or use the form builder to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {forms.map((form) => (
              <Card key={form.id} hover className="flex flex-col">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div 
                        className="p-2 rounded-lg shrink-0"
                        style={{
                          background: 'var(--accent-light)',
                          color: 'var(--accent)',
                        }}
                      >
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="truncate text-base mb-1">{form.title}</CardTitle>
                        <div 
                          className="flex items-center gap-1 text-xs"
                          style={{ color: 'var(--foreground-muted)' }}
                        >
                          <Calendar className="w-3 h-3" />
                          <span>Updated {new Date(form.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="mb-4">
                    <div 
                      className="flex items-center gap-2 p-3 rounded-lg"
                      style={{
                        background: 'var(--background-subtle)',
                      }}
                    >
                      <div 
                        className="p-1.5 rounded"
                        style={{
                          background: 'var(--accent-light)',
                          color: 'var(--accent)',
                        }}
                      >
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div 
                          className="text-xs font-medium"
                          style={{ color: 'var(--foreground-muted)' }}
                        >
                          Responses
                        </div>
                        <div 
                          className="text-xl font-bold"
                          style={{ color: 'var(--foreground)' }}
                        >
                          {form._count.submissions}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t space-y-2" style={{ borderColor: 'var(--divider)' }}>
                    <div className="flex gap-2">
                      <Link
                        href={`/forms/${form.id}/submissions`}
                        className="flex-1 px-3 py-2 rounded-lg text-center text-sm font-medium transition-all hover:opacity-90 flex items-center justify-center gap-2"
                        style={{
                          background: 'var(--accent)',
                          color: 'var(--accent-dark)',
                        }}
                      >
                        <MessageSquare className="w-4 h-4" />
                        Responses
                      </Link>
                      <button
                        onClick={() => openBuilderForEdit(form.id)}
                        disabled={loadingFormId === form.id}
                        className="flex-1 px-3 py-2 rounded-lg text-center text-sm font-medium transition-all hover:opacity-80 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          border: '1px solid var(--card-border)',
                          background: 'var(--card-bg)',
                          color: 'var(--foreground)',
                        }}
                      >
                        {loadingFormId === form.id ? (
                          <div className="relative w-4 h-4">
                            <div className="absolute inset-0 border-2 border-current border-opacity-25 rounded-full"></div>
                            <div className="absolute inset-0 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          <Edit2 className="w-4 h-4" />
                        )}
                        {loadingFormId === form.id ? "Loading..." : "Edit"}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <ShareButton 
                          url={`${typeof window !== "undefined" ? window.location.origin : ""}/f/${form.id}`}
                          label="Share"
                        />
                      </div>
                      <button
                        onClick={() => deleteForm(form.id)}
                        disabled={deletingFormId === form.id}
                        className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          border: '1px solid var(--card-border)',
                          background: 'var(--card-bg)',
                          color: 'var(--error)',
                        }}
                        title="Delete form"
                      >
                        {deletingFormId === form.id ? (
                          <div className="relative w-4 h-4">
                            <div className="absolute inset-0 border-2 border-current border-opacity-25 rounded-full"></div>
                            <div className="absolute inset-0 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
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
