import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import FormRenderer from "../renderer";
import ShareButton from "@/components/ShareButton";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import type { FormStyling } from "@/types/form";
import type { CSSProperties } from "react";

type Props = { 
  params: Promise<{ formId: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function EditResponsePage({ params, searchParams }: Props) {
  const { formId } = await params;
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          Invalid edit link. Token missing.
        </div>
      </div>
    );
  }

  // Fetch submission and verify formId match
  const submission = await prisma.submission.findUnique({
    where: { editToken: token },
    include: { form: true },
  });

  if (!submission || submission.formId !== formId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          Invalid edit link. Submission not found or expired.
        </div>
      </div>
    );
  }

  const form = submission.form;
  const styling = (form.styling as FormStyling | null) ?? null;
  const cssVariables = styling
    ? ({
        "--form-primary-color": styling.primaryColor,
        "--form-bg-color": styling.backgroundColor,
        "--form-button-color": styling.buttonColor,
        "--form-button-text-color": styling.buttonTextColor,
        "--form-button-radius": `${styling.buttonRadius}px`,
      } as CSSProperties)
    : undefined;

  const resolvedBackground = styling?.backgroundColor || "var(--background)";
  const cardBackground = styling?.backgroundColor && styling.backgroundColor !== "#f3f4f6"
    ? styling.backgroundColor
    : "var(--card-bg)";

  return (
    <div
      className="min-h-screen py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8"
      style={{ background: resolvedBackground, ...(cssVariables ?? {}) }}
    >
      <div className="max-w-2xl mx-auto">
        <div 
          className="border p-4 sm:p-6 md:p-8"
          style={{
            ...(cssVariables ?? {}),
            background: cardBackground,
            borderColor: 'var(--card-border)',
            borderRadius: 'var(--card-radius-lg)',
            boxShadow: 'var(--card-shadow)'
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-700">
              Editing Response
            </div>
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
                quizMode={form.quizMode as unknown as import("@/types/form").QuizModeConfig | undefined}
                limitOneResponse={form.limitOneResponse || false}
                saveAndEdit={form.saveAndEdit || false}
                defaultValues={submission.answersJson as Record<string, unknown>}
                isEditMode={true}
                submissionId={submission.id}
                editToken={token}
                submitLabel="Update Response"
              />
            </div>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}


