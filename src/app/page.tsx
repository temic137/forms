"use client";

import { useState, useRef, useEffect } from "react";
import { Field } from "@/types/form";
import FormRenderer from "@/app/f/[id]/renderer";
import { Card, CardHeader, CardTitle, CardContent, CardSection } from "@/components/ui/Card";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import CreationMethodSelector, { CreationMethodInline } from "@/components/CreationMethodSelector";
import InlineFileUpload from "@/components/InlineFileUpload";
import InlineDocumentScanner from "@/components/InlineDocumentScanner";
import InlineJSONImport from "@/components/InlineJSONImport";
import InlineURLScraper from "@/components/InlineURLScraper";

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

  // Show form editor if form exists
  if (showForm) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        {/* Sticky Header with Action Bar */}
        <header className="sticky top-0 z-50 border-b" style={{ 
          background: 'var(--background)',
          borderColor: 'var(--divider)'
        }}>
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-medium" style={{ color: 'var(--foreground)' }}>
                  Forms
                </h1>
                <span className="text-sm" style={{ color: 'var(--foreground-subtle)' }}>
                  Builder
                </span>
              </div>
              <div className="flex items-center gap-3">
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-all"
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
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
    <div className="min-h-screen flex flex-col bg-white">
      {/* Hero Section */}
      <main className="flex-1">
        {/* Hero Content */}
        <section className="relative overflow-hidden pt-32 pb-24 px-6">
          <div className="max-w-5xl mx-auto">
            {/* Hero Text */}
            <div className="text-center mb-16 animate-fade-in">
              <h1 className="text-8xl md:text-9xl font-extralight mb-8 tracking-tighter text-black">
                Build Forms
                <br />
                <span className="font-black">Instantly</span>
              </h1>
              <p className="text-2xl md:text-3xl mb-4 font-light text-gray-600 max-w-2xl mx-auto">
                Describe what you need, and we&apos;ll build it
              </p>
              <p className="text-lg max-w-xl mx-auto text-gray-500">
                Create beautiful, functional forms in seconds with AI. No coding required.
              </p>
            </div>

            {/* Main Input Card */}
            <div className="max-w-3xl mx-auto mb-16 animate-scale-in">
              <div className="bg-white border-2 border-black rounded-2xl shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-all hover:shadow-[12px_12px_0_0_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1">
                <div className="p-8">
                  {/* Creation Method Selector */}
                  <CreationMethodSelector
                    selectedMethod={creationMethod}
                    onMethodChange={setCreationMethod}
                    disabled={loading}
                  />
                  
                  {/* Show different UI based on creation method */}
                  {creationMethod === "prompt" && (
                    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                      <div className="flex items-center gap-3 border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-300 transition-all">
                        <div className="shrink-0 text-gray-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Create a contact form with name, email, and message..."
                          className="flex-1 bg-transparent border-none text-base focus:outline-none text-gray-900 placeholder-gray-400"
                          autoFocus
                          disabled={loading}
                        />
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleVoiceClick}
                          disabled={loading || !isSupported}
                          className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isListening ? (
                            <>
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                              </svg>
                              <span>Voice</span>
                            </>
                          )}
                        </button>
                        <button
                          type="submit"
                          disabled={!query.trim() || loading}
                          className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {loading && (
                            <div className="relative w-4 h-4">
                              <div className="absolute inset-0 border-2 border-white border-opacity-25 rounded-full"></div>
                              <div className="absolute inset-0 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                          {loading ? "Creating..." : "Create Form"}
                        </button>
                      </div>
                    </form>
                  )}
                  
                  {creationMethod === "file" && (
                    <InlineFileUpload
                      onFileSelect={handleFileUpload}
                      onCancel={() => setCreationMethod("prompt")}
                      disabled={loading}
                    />
                  )}
                  
                  {creationMethod === "scan" && (
                    <InlineDocumentScanner
                      onFileSelect={handleDocumentScan}
                      onCancel={() => setCreationMethod("prompt")}
                      disabled={loading}
                    />
                  )}
                  
                  {creationMethod === "json" && (
                    <InlineJSONImport
                      onImport={handleJSONImport}
                      onCancel={() => setCreationMethod("prompt")}
                      disabled={loading}
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
                        disabled={loading}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Voice Status Indicator */}
            {isListening && (
              <div className="max-w-3xl mx-auto mb-8 animate-slide-in">
                <div className="bg-black text-white rounded-xl px-6 py-4 border-2 border-black">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium">
                        {autoSubmitCountdown !== null && autoSubmitCountdown > 0 
                          ? `Auto-submitting in ${autoSubmitCountdown}s...` 
                          : 'Listening...'}
                      </span>
                    </div>
                  </div>
                  {autoSubmitCountdown !== null && autoSubmitCountdown > 0 && (
                    <p className="text-xs mt-2 text-gray-300">
                      Keep talking to cancel auto-submit
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="text-center mb-20">
              <p className="text-sm mb-6 font-medium text-gray-500 uppercase tracking-wider">
                Popular Templates
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => {
                      setQuery(action.query);
                      generateForm(action.query);
                    }}
                    disabled={loading}
                    className="px-5 py-2.5 border-2 border-black rounded-full text-sm font-medium text-black bg-white hover:bg-black hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-extralight mb-6 text-black tracking-tight">
                Everything you need
              </h2>
              <p className="text-xl max-w-2xl mx-auto text-gray-600">
                Powerful features that make form creation effortless
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="bg-white border-2 border-black rounded-2xl p-8 text-center hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-all hover:-translate-x-1 hover:-translate-y-1">
                <div className="w-14 h-14 mx-auto mb-6 rounded-full flex items-center justify-center bg-black">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-black">
                  AI-Powered
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Describe your form in natural language and watch it come to life instantly
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white border-2 border-black rounded-2xl p-8 text-center hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-all hover:-translate-x-1 hover:-translate-y-1">
                <div className="w-14 h-14 mx-auto mb-6 rounded-full flex items-center justify-center bg-black">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-black">
                  Voice Input
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Speak your form requirements and let voice recognition do the work
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white border-2 border-black rounded-2xl p-8 text-center hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-all hover:-translate-x-1 hover:-translate-y-1">
                <div className="w-14 h-14 mx-auto mb-6 rounded-full flex items-center justify-center bg-black">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-black">
                  Import & Scan
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Upload files, scan documents, or import JSON to create forms from existing data
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-white border-2 border-black rounded-2xl p-8 text-center hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-all hover:-translate-x-1 hover:-translate-y-1">
                <div className="w-14 h-14 mx-auto mb-6 rounded-full flex items-center justify-center bg-black">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-black">
                  Live Preview
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  See your form come together in real-time as you build it
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-white border-2 border-black rounded-2xl p-8 text-center hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-all hover:-translate-x-1 hover:-translate-y-1">
                <div className="w-14 h-14 mx-auto mb-6 rounded-full flex items-center justify-center bg-black">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-black">
                  Customizable
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Edit fields, change types, and customize your form to match your needs
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-white border-2 border-black rounded-2xl p-8 text-center hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-all hover:-translate-x-1 hover:-translate-y-1">
                <div className="w-14 h-14 mx-auto mb-6 rounded-full flex items-center justify-center bg-black">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-black">
                  Share Instantly
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Publish and share your form with a single click
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl md:text-6xl font-extralight mb-8 text-black tracking-tight">
              Ready to build?
            </h2>
            <p className="text-xl mb-12 max-w-2xl mx-auto text-gray-600">
              Get started in seconds. No account required.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                  if (input) input.focus();
                }}
                className="px-10 py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-all shadow-[6px_6px_0_0_rgba(0,0,0,0.2)] hover:shadow-[8px_8px_0_0_rgba(0,0,0,0.2)] hover:-translate-x-1 hover:-translate-y-1"
              >
                Start Creating
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 border-t-2 border-black bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <div className="flex gap-6">
              <a href="#" className="text-gray-600 hover:text-black transition-colors font-medium">About</a>
              <a href="#" className="text-gray-600 hover:text-black transition-colors font-medium">Help</a>
            </div>
            <div className="text-sm text-gray-500 font-medium">
              © {new Date().getFullYear()} Forms. All rights reserved.
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-gray-600 hover:text-black transition-colors font-medium">Privacy</a>
              <a href="#" className="text-gray-600 hover:text-black transition-colors font-medium">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
