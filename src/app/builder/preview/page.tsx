"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FormRenderer from "@/app/f/[id]/renderer";
import { Field, FormStyling, MultiStepConfig } from "@/types/form";
import { ArrowLeft } from "lucide-react";

interface PreviewData {
  title: string;
  fields: Field[];
  styling?: FormStyling;
  multiStepConfig?: MultiStepConfig;
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
    // Store the editing form ID in sessionStorage to restore editing state
    if (previewData) {
      sessionStorage.setItem('formPreviewEditingFormId', 'preview'); // Use a flag to indicate we came from preview
    }
    router.push('/dashboard'); // Go back to dashboard, which will restore the builder state
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="flex items-center gap-3" style={{ color: 'var(--foreground-muted)' }}>
          <div className="relative w-5 h-5">
            <div className="absolute inset-0 border-2 border-current border-opacity-25 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          </div>
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

        {/* Form Container */}
        <div 
          className="border p-8"
          style={{
            background: previewData.styling?.backgroundColor === '#f3f4f6' || !previewData.styling?.backgroundColor
              ? 'var(--card-bg)'
              : previewData.styling.backgroundColor,
            borderColor: 'var(--card-border)',
            borderRadius: 'var(--card-radius-lg)',
            boxShadow: 'var(--card-shadow)'
          }}
        >
          <FormRenderer
            formId="preview"
            fields={previewData.fields}
            styling={previewData.styling}
            multiStepConfig={previewData.multiStepConfig}
            formTitle={previewData.title}
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

