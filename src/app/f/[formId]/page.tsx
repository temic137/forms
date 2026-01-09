import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import FormRenderer from "./renderer";
import ShareButton from "@/components/ShareButton";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import FormClosedMessage from "@/components/FormClosedMessage";
import { formatInTimezone, getLocalTimezone } from "@/lib/timezone";
import type { FormStyling } from "@/types/form";
import type { CSSProperties } from "react";
import { Metadata } from "next";

type Props = { params: Promise<{ formId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { formId: paramId } = await params;
  const id = String(paramId || "").trim();

  if (!id) return { title: "Form Not Found" };

  const form = await prisma.form.findUnique({
    where: { id },
    select: { title: true }
  });

  if (!form) return { title: "Form Not Found" };

  return {
    title: form.title,
    openGraph: {
      title: form.title,
      description: "Fill out this form on AnyForm",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: form.title,
      description: "Fill out this form on AnyForm",
    }
  };
}

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
      quizMode: true,
      limitOneResponse: true,
      saveAndEdit: true,
      // Scheduling
      closesAt: true,
      opensAt: true,
      isClosed: true,
      closedMessage: true,
    },
  });

  if (!form) return notFound();

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

  // Check scheduling status
  const now = new Date();
  let isClosed = form.isClosed;
  let closedMessage = form.closedMessage;

  // Check if auto-closed
  if (!isClosed && form.closesAt && new Date(form.closesAt) < now) {
    isClosed = true;
  }

  // Check if not yet open
  if (!isClosed && form.opensAt && new Date(form.opensAt) > now) {
    isClosed = true;
    const timeZone = getLocalTimezone();
    const openDate = formatInTimezone(new Date(form.opensAt), 'MMMM d, yyyy h:mm a', timeZone);
    closedMessage = `This form is scheduled to open on ${openDate}.`;
  }

  if (isClosed) {
    return (
      <div
        className="min-h-screen py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center"
        style={{ background: resolvedBackground, ...(cssVariables ?? {}) }}
      >
        <div className="max-w-md w-full">
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
            <FormClosedMessage message={closedMessage} />
            
            {/* Branding for closed forms */}
            <div className="mt-6 pt-4 border-t text-center" style={{ borderColor: 'var(--card-border)' }}>
              <a 
                href="/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium opacity-60 hover:opacity-100 transition-opacity"
                style={{ color: 'var(--foreground)' }}
              >
                Powered by <strong>AnyForm</strong>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                quizMode={form.quizMode as unknown as import("@/types/form").QuizModeConfig | undefined}
                limitOneResponse={form.limitOneResponse || false}
                saveAndEdit={form.saveAndEdit || false}
              />
            </div>
          </ErrorBoundary>

          {/* Powered By Footer */}
          <div className="mt-8 pt-6 border-t text-center" style={{ borderColor: 'var(--card-border)' }}>
             <a 
               href="/" 
               target="_blank" 
               rel="noopener noreferrer"
               className="inline-flex items-center gap-1.5 text-xs font-bold opacity-60 hover:opacity-100 transition-opacity font-paper"
               style={{ color: 'var(--foreground)' }}
             >
               Powered by <strong>AnyForm</strong>
             </a>
          </div>
        </div>
      </div>
    </div>
  );
}
