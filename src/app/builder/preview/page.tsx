"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FormRenderer from "@/app/f/[formId]/renderer";
import { Field, FormStyling, MultiStepConfig, QuizModeConfig, NotificationConfig } from "@/types/form";
import { ArrowLeft } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

interface PreviewData {
  title: string;
  fields: Field[];
  styling?: FormStyling;
  multiStepConfig?: MultiStepConfig;
  quizMode?: QuizModeConfig;
  notifications?: NotificationConfig;
  limitOneResponse?: boolean;
  saveAndEdit?: boolean;
  conversationalMode?: boolean;
  closesAt?: string;
  opensAt?: string;
  isClosed?: boolean;
  closedMessage?: string;
}

export default function FormPreviewPage() {
  const router = useRouter();
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read form data from sessionStorage
    const storedData = sessionStorage.getItem('formPreviewData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData) as PreviewData;
        setPreviewData(data);
      } catch (error) {
        console.error('Error parsing preview data:', error);
      }
    }
    setLoading(false);
  }, []);

  const handleBack = () => {
    // Use browser history to go back, preserving the builder's state
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="flex items-center gap-3" style={{ color: 'var(--foreground-muted)' }}>
          <Spinner size="sm" variant="current" />
          <span>Loading preview...</span>
        </div>
      </div>
    );
  }

  if (!previewData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="max-w-md mx-auto text-center px-4">
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
            No preview data found
          </h2>
          <p className="mb-4" style={{ color: 'var(--foreground-muted)' }}>
            Please go back to the form builder and click the Preview button.
          </p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors font-medium flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Builder</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-12 px-4 sm:px-6 lg:px-8"
      style={{
        background: previewData.styling?.backgroundColor || 'var(--background)',
      }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white/50 rounded-md transition-colors"
            style={{
              background: previewData.styling?.backgroundColor === '#f3f4f6' || !previewData.styling?.backgroundColor
                ? 'white'
                : 'rgba(255, 255, 255, 0.9)',
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Builder</span>
          </button>
          <div
            className="px-3 py-1.5 text-xs font-medium rounded-md"
            style={{
              background: previewData.styling?.primaryColor || 'rgba(0, 0, 0, 0.05)',
              color: previewData.styling?.primaryColor ? 'white' : 'var(--foreground-muted)',
            }}
          >
            Preview Mode
          </div>
        </div>

        {/* Info banner for special settings */}
        {(previewData.isClosed || previewData.closesAt || previewData.opensAt || previewData.limitOneResponse || previewData.quizMode?.enabled) && (
          <div className="mb-4 p-4 rounded-lg border" style={{ 
            background: 'rgba(59, 130, 246, 0.05)',
            borderColor: 'rgba(59, 130, 246, 0.2)'
          }}>
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Active Settings:</p>
                <ul className="text-blue-800 space-y-0.5">
                  {previewData.quizMode?.enabled && (
                    <li>• Quiz Mode enabled</li>
                  )}
                  {previewData.limitOneResponse && (
                    <li>• Limited to one response per person</li>
                  )}
                  {previewData.isClosed && (
                    <li>• Form is currently closed</li>
                  )}
                  {previewData.closesAt && (
                    <li>• Closes at: {new Date(previewData.closesAt).toLocaleString()}</li>
                  )}
                  {previewData.opensAt && (
                    <li>• Opens at: {new Date(previewData.opensAt).toLocaleString()}</li>
                  )}
                  {previewData.saveAndEdit && (
                    <li>• Save and continue later enabled</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Form Container */}
        <div
          className="border p-8 rounded-lg"
          style={{
            background: previewData.styling?.backgroundColor === '#f3f4f6' || !previewData.styling?.backgroundColor
              ? 'var(--card-bg)'
              : previewData.styling.backgroundColor,
            borderColor: 'var(--card-border)',
          }}
        >
          <FormRenderer
            formId="preview"
            fields={previewData.fields}
            styling={previewData.styling}
            multiStepConfig={previewData.multiStepConfig}
            quizMode={previewData.quizMode}
            formTitle={previewData.title}
            conversationalMode={previewData.conversationalMode}
            limitOneResponse={previewData.limitOneResponse}
            saveAndEdit={previewData.saveAndEdit}
            isPreview={true}
            onSubmit={async () => {
              // Preview mode - show alert instead of submitting
              alert('This is a preview. Form submission is disabled.');
            }}
            submitLabel="Submit (Preview)"
          />
        </div>
      </div>
    </div>
  );
}

