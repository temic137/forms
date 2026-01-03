"use client";

import { useForm, Controller } from "react-hook-form";
import { useState, useMemo, useCallback } from "react";
import { Field, MultiStepConfig, FormStyling } from "@/types/form";
import { getVisibleFields } from "@/lib/conditionalLogic";
import { validateField } from "@/lib/validation";
import ConversationalForm from "@/components/ConversationalForm";

interface EmbedFormRendererProps {
  formId: string;
  formTitle: string;
  fields: Field[];
  multiStepConfig?: MultiStepConfig;
  styling?: FormStyling;
  conversationalMode?: boolean;
  hideTitle?: boolean;
  hideBranding?: boolean;
}

function getFontFamily(family: string): string {
  switch (family) {
    case "sans":
      return "ui-sans-serif, system-ui, sans-serif";
    case "serif":
      return "ui-serif, Georgia, serif";
    case "mono":
      return "ui-monospace, monospace";
    case "inter":
      return "'Inter', sans-serif";
    case "roboto":
      return "'Roboto', sans-serif";
    case "system":
    default:
      return "system-ui, -apple-system, sans-serif";
  }
}

function getOptionValue(opt: string | { id?: string; label?: string } | unknown): string {
  if (typeof opt === 'string') return opt;
  if (typeof opt === 'object' && opt !== null) {
    const obj = opt as { id?: string; label?: string };
    return obj.label || obj.id || String(opt);
  }
  return String(opt);
}

export default function EmbedFormRenderer({
  formId,
  formTitle,
  fields,
  multiStepConfig,
  styling,
  conversationalMode = false,
  hideTitle = false,
  hideBranding = false,
}: EmbedFormRendererProps) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [respondentId, setRespondentId] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
    reset,
  } = useForm({
    mode: "onBlur",
    defaultValues: fields.reduce((acc, f) => {
      acc[f.id] = f.type === "checkbox" ? false : "";
      return acc;
    }, {} as Record<string, unknown>),
  });

  // Generate or get respondentId for tracking
  useState(() => {
    if (typeof window !== 'undefined') {
      let rid = localStorage.getItem("form_respondent_id");
      if (!rid) {
        rid = crypto.randomUUID();
        localStorage.setItem("form_respondent_id", rid);
      }
      setRespondentId(rid);
    }
  });

  const watchedValues = watch();
  
  // getVisibleFields returns field IDs, so we filter the original fields array
  const visibleFieldIds = useMemo(
    () => new Set(getVisibleFields(fields, watchedValues)),
    [fields, watchedValues]
  );
  
  const visibleFields = useMemo(
    () => fields.filter(f => visibleFieldIds.has(f.id)),
    [fields, visibleFieldIds]
  );

  const isMultiStep = !!multiStepConfig?.enabled && (multiStepConfig?.steps?.length ?? 0) > 1;

  // Font family
  const fontFamily = useMemo(() => getFontFamily(styling?.fontFamily || "system"), [styling?.fontFamily]);

  // Handle form submission
  const onSubmitHandler = useCallback(
    async (data: Record<string, unknown>) => {
      setSubmitting(true);
      setServerError(null);
      setFieldErrors({});

      // Validate all visible fields
      const newFieldErrors: Record<string, string> = {};
      for (const field of visibleFields) {
        const key = field.id;
        const value = data[key];
        
        // Check required fields
        if (field.required && (value === undefined || value === null || value === "")) {
          newFieldErrors[key] = `${field.label} is required`;
          continue;
        }
        
        // Validate with custom rules if present
        if (field.validation && field.validation.length > 0) {
          const error = validateField(value as string | number | undefined, field.validation);
          if (error) {
            newFieldErrors[key] = error;
          }
        }
      }

      if (Object.keys(newFieldErrors).length > 0) {
        setFieldErrors(newFieldErrors);
        setSubmitting(false);
        return;
      }

      try {
        const response = await fetch(`/api/forms/${formId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, respondentId }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || "Submission failed");
        }

        // Notify parent window of successful submission (for embed communication)
        if (window.parent !== window) {
          window.parent.postMessage({
            type: "FORM_SUBMITTED",
            formId,
            success: true,
          }, "*");
        }

        setSubmitted(true);
        reset();
      } catch (error) {
        setServerError(error instanceof Error ? error.message : "An error occurred");
        
        // Notify parent window of submission error
        if (window.parent !== window) {
          window.parent.postMessage({
            type: "FORM_SUBMISSION_ERROR",
            formId,
            error: error instanceof Error ? error.message : "An error occurred",
          }, "*");
        }
      } finally {
        setSubmitting(false);
      }
    },
    [formId, visibleFields, reset, respondentId]
  );

  // Render success message
  if (submitted) {
    return (
      <div 
        className="text-center py-12"
        style={{ fontFamily }}
      >
        <div 
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ background: "var(--accent-light, #e0f2fe)" }}
        >
          <svg 
            className="w-8 h-8" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: "var(--accent, #3b82f6)" }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 
          className="text-xl font-semibold mb-2"
          style={{ color: "var(--foreground)" }}
        >
          Thank you!
        </h2>
        <p style={{ color: "var(--foreground-muted)" }}>
          Your response has been submitted successfully.
        </p>
      </div>
    );
  }

  // Conversational mode
  if (conversationalMode && !isMultiStep) {
    return (
      <div style={{ fontFamily }}>
        {!hideTitle && (
          <h1 
            className="text-2xl font-bold mb-6"
            style={{ color: "var(--foreground)" }}
          >
            {formTitle}
          </h1>
        )}
        <ConversationalForm
          fields={visibleFields}
          formTitle={formTitle}
          onSubmit={onSubmitHandler}
          styling={styling ? { primaryColor: styling.primaryColor, backgroundColor: styling.backgroundColor, buttonColor: styling.buttonColor } : undefined}
        />
      </div>
    );
  }

  // Standard form (including multi-step - rendered as single form for embed)
  return (
    <div style={{ fontFamily }}>
      {!hideTitle && (
        <h1 
          className="text-2xl font-bold mb-6"
          style={{ color: "var(--foreground)" }}
        >
          {formTitle}
        </h1>
      )}

      {serverError && (
        <div 
          className="mb-4 p-4 rounded-lg border"
          style={{ 
            background: "var(--error-bg, #fef2f2)", 
            borderColor: "var(--error-border, #fecaca)",
            color: "var(--error, #dc2626)"
          }}
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
        {visibleFields.map((field) => {
          const key = field.id;
          const error = fieldErrors[key] || errors[key]?.message;

          return (
            <div key={field.id} className="space-y-2">
              <label 
                htmlFor={key}
                className="block text-sm font-medium"
                style={{ color: "var(--foreground)" }}
              >
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {field.helpText && (
                <p 
                  className="text-sm"
                  style={{ color: "var(--foreground-muted)" }}
                >
                  {field.helpText}
                </p>
              )}

              {renderFieldInput(field, key, register, setValue, watch, control)}

              {error && (
                <p className="text-sm text-red-500">{String(error)}</p>
              )}
            </div>
          );
        })}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
          style={{
            background: styling?.buttonColor || "var(--accent)",
            color: styling?.buttonTextColor || "white",
            borderRadius: styling?.buttonRadius ? `${styling.buttonRadius}px` : "var(--button-radius)",
          }}
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </form>

      {!hideBranding && (
        <div 
          className="mt-8 pt-4 border-t text-center"
          style={{ borderColor: "var(--card-border)" }}
        >
          <a 
            href="/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs transition-colors"
            style={{ color: "var(--foreground-muted)" }}
          >
            Powered by Anyform
          </a>
        </div>
      )}
    </div>
  );
}

// Helper function to render different field types
function renderFieldInput(
  field: Field,
  key: string,
  register: ReturnType<typeof useForm>["register"],
  setValue: ReturnType<typeof useForm>["setValue"],
  watch: ReturnType<typeof useForm>["watch"],
  control: ReturnType<typeof useForm>["control"]
) {
  const inputStyles = {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "0.5rem",
    border: "1px solid var(--input-border)",
    background: "var(--input-bg)",
    color: "var(--foreground)",
    fontSize: "1rem",
  };

  switch (field.type) {
    case "text":
    case "email":
    case "tel":
    case "url":
      return (
        <input
          id={key}
          type={field.type}
          placeholder={field.placeholder}
          {...register(key, { required: field.required })}
          style={inputStyles}
        />
      );

    case "number":
      return (
        <input
          id={key}
          type="number"
          placeholder={field.placeholder}
          {...register(key, { required: field.required, valueAsNumber: true })}
          style={inputStyles}
        />
      );

    case "date":
      return (
        <input
          id={key}
          type="date"
          {...register(key, { required: field.required })}
          style={inputStyles}
        />
      );

    case "time":
      return (
        <input
          id={key}
          type="time"
          {...register(key, { required: field.required })}
          style={inputStyles}
        />
      );

    case "textarea":
      return (
        <textarea
          id={key}
          placeholder={field.placeholder}
          rows={4}
          {...register(key, { required: field.required })}
          style={{ ...inputStyles, resize: "vertical" }}
        />
      );

    case "select":
    case "dropdown":
      return (
        <select
          id={key}
          {...register(key, { required: field.required })}
          style={inputStyles}
        >
          <option value="">Select an option</option>
          {field.options?.map((opt, idx) => {
            const value = getOptionValue(opt);
            return (
              <option key={idx} value={value}>
                {value}
              </option>
            );
          })}
        </select>
      );

    case "radio":
      return (
        <div className="space-y-2">
          {field.options?.map((opt, idx) => {
            const value = getOptionValue(opt);
            return (
              <label key={idx} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value={value}
                  {...register(key, { required: field.required })}
                  className="w-4 h-4"
                />
                <span style={{ color: "var(--foreground)" }}>{value}</span>
              </label>
            );
          })}
        </div>
      );

    case "checkbox":
      if (field.options && field.options.length > 0) {
        return (
          <div className="space-y-2">
            {field.options.map((opt, idx) => {
              const value = getOptionValue(opt);
              return (
                <label key={idx} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    value={value}
                    {...register(key)}
                    className="w-4 h-4"
                  />
                  <span style={{ color: "var(--foreground)" }}>{value}</span>
                </label>
              );
            })}
          </div>
        );
      }
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register(key, { required: field.required })}
            className="w-4 h-4"
          />
          <span style={{ color: "var(--foreground)" }}>Yes</span>
        </label>
      );

    case "file":
    case "file-uploader":
      // Simple file input for embed - no file upload service integration
      return (
        <input
          id={key}
          type="file"
          accept={field.fileConfig?.acceptedTypes === "images" ? "image/*" : 
                  field.fileConfig?.acceptedTypes === "documents" ? ".pdf,.doc,.docx,.txt" :
                  field.fileConfig?.acceptedTypes === "pdf" ? ".pdf" : undefined}
          multiple={field.fileConfig?.multiple}
          {...register(key, { required: field.required })}
          className="w-full p-2 border rounded-lg"
          style={{
            borderColor: "var(--input-border)",
            background: "var(--input-bg)",
            color: "var(--foreground)",
          }}
        />
      );

    case "star-rating":
      return (
        <Controller
          name={key}
          control={control}
          rules={{ required: field.required }}
          render={({ field: controllerField }) => (
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => controllerField.onChange(star)}
                  className={`text-2xl transition-colors ${
                    star <= (controllerField.value as number || 0)
                      ? "text-yellow-400"
                      : "text-gray-300 hover:text-yellow-400"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          )}
        />
      );

    default:
      return (
        <input
          id={key}
          type="text"
          placeholder={field.placeholder}
          {...register(key, { required: field.required })}
          style={inputStyles}
        />
      );
  }
}
