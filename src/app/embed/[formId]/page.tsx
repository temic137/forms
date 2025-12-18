import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EmbedFormRenderer from "./EmbedFormRenderer";
import type { FormStyling, Field, MultiStepConfig } from "@/types/form";
import type { CSSProperties } from "react";
import type { Metadata } from "next";

type Props = { 
  params: Promise<{ formId: string }>;
  searchParams: Promise<{ 
    transparent?: string;
    padding?: string;
    hideTitle?: string;
    hideBranding?: string;
    theme?: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { formId } = await params;
  
  const form = await prisma.form.findUnique({
    where: { id: formId },
    select: { title: true },
  });

  return {
    title: form?.title || "Form",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function EmbedFormPage({ params, searchParams }: Props) {
  const { formId: paramId } = await params;
  const resolvedSearchParams = await searchParams;
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
    },
  });
  
  if (!form) return notFound();

  // Parse embed options from search params
  const embedOptions = {
    transparent: resolvedSearchParams.transparent === "true",
    padding: resolvedSearchParams.padding || "16",
    hideTitle: resolvedSearchParams.hideTitle === "true",
    hideBranding: resolvedSearchParams.hideBranding === "true",
    theme: resolvedSearchParams.theme || "auto", // auto, light, dark
  };

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

  const resolvedBackground = embedOptions.transparent 
    ? "transparent" 
    : (styling?.backgroundColor || "var(--background)");
  
  const cardBackground = embedOptions.transparent
    ? "transparent"
    : (styling?.backgroundColor && styling.backgroundColor !== "#f3f4f6"
      ? styling.backgroundColor
      : "var(--card-bg)");

  const paddingValue = `${parseInt(embedOptions.padding, 10)}px`;

  // Theme class for the container
  const themeClass = embedOptions.theme === "dark" ? "dark" : "";

  return (
    <div
      className={`embed-form-container ${themeClass}`}
      style={{ 
        padding: paddingValue, 
        background: resolvedBackground, 
        minHeight: "100vh",
        colorScheme: embedOptions.theme === "dark" ? "dark" : embedOptions.theme === "light" ? "light" : "normal",
        ...(cssVariables ?? {}) 
      }}
    >
      <div 
        className={embedOptions.transparent ? "" : "border"}
        style={{
          ...(cssVariables ?? {}),
          background: cardBackground,
          borderColor: embedOptions.transparent ? "transparent" : "var(--card-border)",
          borderRadius: embedOptions.transparent ? "0" : "var(--card-radius-lg)",
          boxShadow: embedOptions.transparent ? "none" : "var(--card-shadow)",
          padding: embedOptions.transparent ? "0" : "1.5rem",
        }}
      >
        <EmbedFormRenderer 
          formId={form.id} 
          formTitle={form.title}
          fields={form.fieldsJson as unknown as Field[]}
          multiStepConfig={form.multiStepConfig as unknown as MultiStepConfig | undefined}
          styling={form.styling as unknown as FormStyling | undefined}
          conversationalMode={form.conversationalMode || false}
          hideTitle={embedOptions.hideTitle}
          hideBranding={embedOptions.hideBranding}
        />
      </div>
    </div>
  );
}
