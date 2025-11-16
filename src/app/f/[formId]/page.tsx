import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import FormRenderer from "./renderer";
import ShareButton from "@/components/ShareButton";
import ErrorBoundary from "@/components/ErrorBoundary";

type Props = { params: Promise<{ formId: string }> };

export default async function PublicFormPage({ params }: Props) {
  const { formId: paramId } = await params;
  const id = String(paramId || "").trim();
  if (!id) return notFound();
  
  const form = await prisma.form.findUnique({
    where: { id },
    select: { 
      id: true, 
      title: true, 
      fieldsJson: true, 
      multiStepConfig: true, 
      styling: true,
      conversationalMode: true,
    },
  });
  
  if (!form) return notFound();

  return (
    <div className="min-h-screen py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--background)' }}>
      <div className="max-w-2xl mx-auto">
        <div 
          className="border p-4 sm:p-6 md:p-8"
          style={{
            background: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
            borderRadius: 'var(--card-radius-lg)',
            boxShadow: 'var(--card-shadow)'
          }}
        >
          <div className="flex items-start justify-end gap-4 mb-6">
            <ShareButton label="Share" />
          </div>
          <ErrorBoundary
            fallback={
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  Unable to load form
                </h2>
                <p className="mb-4" style={{ color: 'var(--foreground-muted)' }}>
                  There was an error loading this form. Please try refreshing the page.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn btn-primary"
                >
                  Refresh Page
                </button>
              </div>
            }
          >
            <div>
              <FormRenderer 
                formId={form.id} 
                fields={form.fieldsJson as unknown as import("@/types/form").Field[]}
                multiStepConfig={form.multiStepConfig as unknown as import("@/types/form").MultiStepConfig | undefined}
                styling={form.styling as unknown as import("@/types/form").FormStyling | undefined}
                formTitle={form.title}
                conversationalMode={form.conversationalMode || false}
              />
            </div>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}


