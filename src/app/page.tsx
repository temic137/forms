"use client";

import { useState, useRef, useEffect } from "react";
import { Field } from "@/types/form";
import FormRenderer from "@/app/f/[formId]/renderer";
import { Card, CardHeader, CardTitle, CardContent, CardSection } from "@/components/ui/Card";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import CreationMethodSelector, { CreationMethodInline } from "@/components/CreationMethodSelector";
import InlineFileUpload from "@/components/InlineFileUpload";
import InlineDocumentScanner from "@/components/InlineDocumentScanner";
import InlineJSONImport from "@/components/InlineJSONImport";
import InlineURLScraper from "@/components/InlineURLScraper";
import { ArrowRight, CheckCircle2, Mic, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [fields, setFields] = useState<Field[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  // Creation method state
  const [creationMethod, setCreationMethod] = useState<CreationMethodInline>("prompt");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !loading) {
      await generateForm(query.trim());
    }
  };

  async function generateForm(brief: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      });
      
      if (!res.ok) throw new Error("Failed to generate form");
      
      const data = await res.json() as { title: string; fields: Partial<Field>[] };
      
      setTitle(data.title);
      const normalizedFields = data.fields.map((f: Partial<Field>, idx: number) => ({
        id: f.id || `field_${Date.now()}_${idx}`,
        label: f.label || "Field",
        type: f.type || "text",
        required: f.required || false,
        options: f.options || [],
        order: idx,
        conditionalLogic: [],
      }));
      setFields(normalizedFields);
      setShowForm(true);
    } catch {
      alert("Failed to generate form. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  
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
      setTitle(data.title || "Imported Form");
      const normalizedFields = data.fields.map((f: Partial<Field>, idx: number) => ({
        id: f.id || `field_${Date.now()}_${idx}`,
        label: f.label || "Field",
        type: f.type || "text",
        required: f.required || false,
        options: f.options || [],
        order: idx,
        conditionalLogic: [],
      }));
      setFields(normalizedFields);
      setShowForm(true);
      setCreationMethod("prompt"); // Reset to prompt after success
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to upload file");
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
      setTitle(data.title || "Scanned Form");
      const normalizedFields = data.fields.map((f: Partial<Field>, idx: number) => ({
        id: f.id || `field_${Date.now()}_${idx}`,
        label: f.label || "Field",
        type: f.type || "text",
        required: f.required || false,
        options: f.options || [],
        placeholder: f.placeholder,
        order: idx,
        conditionalLogic: [],
      }));
      setFields(normalizedFields);
      setShowForm(true);
      setCreationMethod("prompt"); // Reset to prompt after success
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to scan document");
    } finally {
      setLoading(false);
    }
  }

  async function handleJSONImport(jsonData: { title?: string; fields: Array<Partial<Field>> }) {
    setLoading(true);
    try {
      setTitle(jsonData.title || "Imported Form");
      const normalizedFields = jsonData.fields.map((f: Partial<Field>, idx: number) => ({
        id: f.id || f.label?.toLowerCase().replace(/\s+/g, "_") || `field_${idx}`,
        label: f.label || "Field",
        type: f.type || "text",
        required: f.required || false,
        options: f.options || [],
        placeholder: f.placeholder,
        order: idx,
        conditionalLogic: [],
      }));
      setFields(normalizedFields);
      setShowForm(true);
      setCreationMethod("prompt"); // Reset to prompt after success
    } catch {
      alert("Failed to import JSON");
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
        order: f.order || idx,
        conditionalLogic: f.conditionalLogic || [],
      }));

      setTitle(data.title || "Form from URL");
      setFields(normalizedFields);
      setShowForm(true);
      setCreationMethod("prompt"); // Reset to prompt after success
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to scrape URL and generate form");
    } finally {
      setLoading(false);
    }
  }

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
        alert('Failed to start voice input. Please check microphone permissions.');
      }
    }
  };

  function addField() {
    setFields((prev) => [
      ...prev,
      {
        id: `field_${Date.now()}`,
        label: "New field",
        type: "text",
        required: false,
        order: prev.length,
        conditionalLogic: [],
      },
    ]);
  }

  function updateField(index: number, patch: Partial<Field>) {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }

  async function publishForm() {
    setPublishing(true);
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, fields }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      const url = `${window.location.origin}/f/${data.id}`;
      await navigator.clipboard.writeText(url);
      alert("Form published! Link copied to clipboard.");
    } catch {
      alert("Failed to publish form");
    } finally {
      setPublishing(false);
    }
  }

  function startOver() {
    setShowForm(false);
    setTitle("");
    setFields([]);
    setQuery("");
  }

  const quickActions = [
    { label: "Contact Form", query: "contact form with name email and message" },
    { label: "Survey", query: "customer satisfaction survey" },
    { label: "Registration", query: "user registration form" },
    { label: "Feedback", query: "product feedback form" },
    { label: "Job Application", query: "job application with resume upload" },
    { label: "Event RSVP", query: "event registration and rsvp" },
  ];

  const heroHighlights = [
    {
      title: "Generate complete forms in seconds",
      description: "Use natural language prompts and let AI structure the perfect layout.",
      icon: Sparkles,
    },
    {
      title: "Talk instead of typing",
      description: "Capture requirements hands-free with live voice input and auto-submit cues.",
      icon: Mic,
    },
    {
      title: "Bring your existing assets",
      description: "Upload documents, spreadsheets, or JSON to transform them into polished forms.",
      icon: UploadCloud,
    },
  ];

  const featureCards = [
    {
      title: "AI-first workflow",
      description: "Combine prompt-based generation with manual fine-tuning for complete control.",
      icon: Sparkles,
    },
    {
      title: "Secure sharing",
      description: "Publish confidently with built-in sharing tools and access controls.",
      icon: ShieldCheck,
    },
    {
      title: "Voice to form",
      description: "Turn conversations into forms instantly with our multi-language voice capture.",
      icon: Mic,
    },
    {
      title: "Import anything",
      description: "Scan documents or drop files to auto-detect fields and validation rules.",
      icon: UploadCloud,
    },
  ];

  // Show form editor if form exists
  if (showForm) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        {/* Sticky Header with Action Bar */}
        <header className="sticky top-0 z-50 border-b" style={{ 
          background: 'var(--background)',
          borderColor: 'var(--divider)'
        }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-4">
                <h1 className="text-lg sm:text-xl font-medium" style={{ color: 'var(--foreground)' }}>
                  Forms
                </h1>
                <span className="hidden sm:inline text-sm" style={{ color: 'var(--foreground-subtle)' }}>
                  Builder
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={startOver}
                  className="btn btn-ghost"
                >
                  Start Over
                </button>
                <button
                  onClick={publishForm}
                  disabled={publishing}
                  className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {publishing && (
                    <div className="relative w-4 h-4">
                      <div className="absolute inset-0 border-2 border-current border-opacity-25 rounded-full"></div>
                      <div className="absolute inset-0 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  {publishing ? "Publishing..." : "Publish Form"}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Command Bar */}
        <div className="border-b" style={{ borderColor: 'var(--divider)' }}>
          <div className="max-w-7xl mx-auto px-6 py-4">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Add or modify fields... (e.g., 'add phone number field')"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none  focus:ring-gray-200 transition-all"
                  disabled={loading}
                />
              </div>
              <button
                type="button"
                onClick={handleVoiceClick}
                disabled={loading || !isSupported}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={isListening ? "Stop recording" : "Start voice input"}
              >
                {isListening ? (
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <rect x="6" y="6" width="8" height="8" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <button
                type="submit"
                disabled={!query.trim() || loading}
                className="btn btn-primary flex items-center gap-2"
              >
                {loading && (
                  <div className="relative w-4 h-4">
                    <div className="absolute inset-0 border-2 border-current border-opacity-25 rounded-full"></div>
                    <div className="absolute inset-0 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                {loading ? "Updating..." : "Update"}
              </button>
            </form>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {/* Left: Form Editor */}
            <div className="space-y-6">
              {/* Title Card */}
              <Card>
                <CardContent>
                  <CardSection
                    label="Form Title"
                    value={
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-base font-medium focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-all"
                        placeholder="Untitled Form"
                      />
                    }
                  />
                </CardContent>
              </Card>

              {/* Fields Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Fields ({fields.length})</CardTitle>
                    <button
                      onClick={addField}
                      className="btn btn-primary text-sm"
                    >
                      Add Field
                    </button>
                  </div>
                </CardHeader>

                <CardContent>
                  {fields.length === 0 ? (
                    <div className="py-12 text-center" style={{ color: 'var(--foreground-muted)' }}>
                      <p>No fields yet. Describe your form above or click Add Field.</p>
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: 'var(--divider)' }}>
                      {fields.map((field, index) => (
                        <div key={field.id} className="py-5">
                          <div className="flex items-start gap-4">
                            <div className="flex-1 space-y-3">
                              <input
                                type="text"
                                value={field.label}
                                onChange={(e) => updateField(index, { label: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-all"
                                placeholder="Field label"
                              />
                              <div className="flex gap-2 items-center">
                                <select
                                  value={field.type}
                                  onChange={(e) => updateField(index, { type: e.target.value as Field["type"] })}
                                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-all"
                                >
                                  <option value="text">Text</option>
                                  <option value="email">Email</option>
                                  <option value="number">Number</option>
                                  <option value="textarea">Textarea</option>
                                  <option value="select">Select</option>
                                  <option value="radio">Radio</option>
                                  <option value="checkbox">Checkbox</option>
                                  <option value="date">Date</option>
                                  <option value="file">File</option>
                                </select>
                                <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                  <input
                                    type="checkbox"
                                    checked={field.required}
                                    onChange={(e) => updateField(index, { required: e.target.checked })}
                                    className="rounded"
                                  />
                                  Required
                                </label>
                              </div>
                            </div>
                            <button
                              onClick={() => removeField(index)}
                              className="p-2 rounded-lg transition-colors"
                              style={{ color: 'var(--error)' }}
                              title="Remove field"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Live Preview */}
            <div className="lg:sticky lg:top-24 h-fit">
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormRenderer
                    formId="preview"
                    fields={fields}
                    formTitle={title}
                    isPreview={true}
                    onSubmit={async () => {
                      // Preview mode - no actual submission
                    }}
                    submitLabel="Submit (Preview)"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show initial search interface
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      <main className="flex-1">
        <section className="pt-20 pb-16 sm:pb-20 md:pb-24">
          <div className="max-w-6xl mx-auto grid items-center gap-12 px-4 sm:px-6 lg:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,420px)]">
            <div className="space-y-8">
              <div
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                style={{
                  background: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--foreground-muted)',
                }}
              >
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span>AI Form Builder</span>
              </div>
              <div className="space-y-6">
                <h1
                  className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight"
                  style={{ color: 'var(--foreground)' }}
                >
                  Design high-converting forms in minutes
                </h1>
                <p className="text-lg sm:text-xl text-gray-600 max-w-xl">
                  Combine AI suggestions, drag-and-drop controls, and instant previews to ship polished forms without manual setup.
                </p>
              </div>
              <ul className="space-y-4">
                {heroHighlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.title} className="flex items-start gap-3">
                      <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                          {item.title}
                        </p>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => {
                    const input = document.getElementById('landing-prompt-input') as HTMLInputElement | null;
                    if (input) input.focus();
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  style={{ background: 'var(--accent)', color: 'var(--accent-dark)' }}
                >
                  Start creating
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    const section = document.getElementById('features');
                    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
                  style={{ borderColor: 'var(--card-border)', color: 'var(--foreground)' }}
                >
                  Explore features
                </button>
              </div>
              <div className="pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Popular templates</p>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => {
                        setQuery(action.query);
                        generateForm(action.query);
                      }}
                      disabled={loading}
                      className="rounded-full border px-4 py-2 text-xs font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                      style={{
                        borderColor: 'var(--card-border)',
                        background: 'var(--card-bg)',
                        color: 'var(--foreground)',
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="relative">
              <div
                className="relative overflow-hidden rounded-3xl border shadow-xl"
                style={{
                  background: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  boxShadow: 'var(--card-shadow)',
                }}
              >
                <div className="absolute -top-24 right-6 hidden h-40 w-40 rotate-12 rounded-full bg-blue-100 opacity-40 blur-3xl sm:block" />
                <div className="p-6 sm:p-8">
                  <div className="mb-6">
                    <h3 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
                      Describe your form
                    </h3>
                    <p className="text-sm text-gray-600">
                      Pick a creation method or start with a quick prompt. We&apos;ll handle the structure.
                    </p>
                  </div>
                  <CreationMethodSelector
                    selectedMethod={creationMethod}
                    onMethodChange={setCreationMethod}
                    disabled={loading}
                  />
                  {creationMethod === 'prompt' && (
                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                      <div className="relative">
                        <input
                          id="landing-prompt-input"
                          type="text"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Create a contact form with name, email, and message..."
                          className="w-full rounded-lg border px-4 py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          disabled={loading}
                          autoFocus
                        />
                      </div>
                      <div className="flex flex-col justify-end gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={handleVoiceClick}
                          disabled={loading || !isSupported}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                          style={{ borderColor: 'var(--card-border)' }}
                        >
                          {isListening ? (
                            <>
                              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Mic className="h-4 w-4" />
                              <span>Voice</span>
                            </>
                          )}
                        </button>
                        <button
                          type="submit"
                          disabled={!query.trim() || loading}
                          className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                          style={{ background: 'var(--accent)', color: 'var(--accent-dark)' }}
                        >
                          {loading && (
                            <div className="relative h-4 w-4">
                              <div className="absolute inset-0 rounded-full border-2 border-white/40" />
                              <div className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            </div>
                          )}
                          {loading ? 'Creating...' : 'Create form'}
                        </button>
                      </div>
                    </form>
                  )}
                  {creationMethod === 'file' && (
                    <div className="mt-6">
                      <InlineFileUpload
                        onFileSelect={handleFileUpload}
                        onCancel={() => setCreationMethod('prompt')}
                        disabled={loading}
                      />
                    </div>
                  )}
                  {creationMethod === 'scan' && (
                    <div className="mt-6">
                      <InlineDocumentScanner
                        onFileSelect={handleDocumentScan}
                        onCancel={() => setCreationMethod('prompt')}
                        disabled={loading}
                      />
                    </div>
                  )}
                  {creationMethod === 'json' && (
                    <div className="mt-6">
                      <InlineJSONImport
                        onImport={handleJSONImport}
                        onCancel={() => setCreationMethod('prompt')}
                        disabled={loading}
                      />
                    </div>
                  )}
                  {creationMethod === 'url' && (
                    <div className="mt-6 space-y-4">
                      <p className="text-sm text-gray-600">
                        Paste a website URL and our AI will analyze the content to generate an appropriate form.
                      </p>
                      <InlineURLScraper
                        onURLSubmit={handleURLScrape}
                        onCancel={() => setCreationMethod('prompt')}
                        disabled={loading}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {isListening && (
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-8 max-w-3xl animate-slide-in">
              <div
                className="flex items-center gap-3 rounded-2xl border px-5 py-4"
                style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    {autoSubmitCountdown !== null && autoSubmitCountdown > 0
                      ? `Auto-submitting in ${autoSubmitCountdown}s...`
                      : 'Listening...'}
                  </span>
                </div>
                {autoSubmitCountdown !== null && autoSubmitCountdown > 0 && (
                  <p className="text-xs text-gray-500">Keep talking to cancel auto-submit.</p>
                )}
              </div>
            </div>
          </div>
        )}

        <section id="features" className="bg-gray-50 py-16 sm:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-14 text-center sm:mb-20">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-gray-900">
                Everything you need to move fast
              </h2>
              <p className="mt-4 text-base text-gray-600 sm:text-lg">
                Powerful tooling that keeps your team focused on insights instead of formatting.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-8">
              {featureCards.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="flex h-full flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                    style={{ borderColor: 'var(--card-border)' }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                    </div>
                    <p className="mt-4 text-sm text-gray-600">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <div className="space-y-6">
              <h2
                className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight"
                style={{ color: 'var(--foreground)' }}
              >
                Ready to launch your next form?
              </h2>
              <p className="text-base text-gray-600 sm:text-lg">
                Start from a prompt, upload existing assets, or talk through your idea. You&apos;ll get a shareable form in minutes.
              </p>
            </div>
            <ul className="mx-auto mb-10 mt-8 space-y-3 text-left text-sm text-gray-600">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                Works with prompts, documents, URLs, and JSON imports.
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                Instant previews show exactly what respondents will see.
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                Publish and share with one click—no extra tooling required.
              </li>
            </ul>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={() => {
                  const input = document.getElementById('landing-prompt-input') as HTMLInputElement | null;
                  if (input) input.focus();
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: 'var(--accent)', color: 'var(--accent-dark)' }}
              >
                Start for free
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg border px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
                style={{ borderColor: 'var(--card-border)', color: 'var(--foreground)' }}
              >
                Watch it in action
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t" style={{ borderColor: 'var(--divider)', background: 'var(--card-bg)' }}>
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 font-semibold" style={{ color: 'var(--foreground)' }}>
              <Sparkles className="h-4 w-4 text-blue-600" />
              Forms
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <a href="#" className="hover:text-gray-700">
                About
              </a>
              <a href="#" className="hover:text-gray-700">
                Help
              </a>
              <a href="#" className="hover:text-gray-700">
                Privacy
              </a>
              <a href="#" className="hover:text-gray-700">
                Terms
              </a>
            </div>
            <p>© {new Date().getFullYear()} Forms. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
