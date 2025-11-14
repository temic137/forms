"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Field, MultiStepConfig } from "@/types/form";
import { getVisibleFields } from "@/lib/conditionalLogic";
import { validateField } from "@/lib/validation";
import MultiStepRenderer from "@/components/MultiStepRenderer";
import FileUpload from "@/components/FileUpload";
import ConversationalForm from "@/components/ConversationalForm";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "_");
}

function inferTypeFromLabel(label: string): Field["type"] {
  const l = label.toLowerCase();
  if (/(email|e-mail)/.test(l)) return "email";
  if (/(age|number|qty|quantity|count|amount|price)/.test(l)) return "number";
  if (/(date|dob|birthday)/.test(l)) return "date";
  if (/(message|comments?|feedback|description|bio)/.test(l)) return "textarea";
  return "text";
}

function getFontFamily(family: "system" | "sans" | "serif" | "mono"): string {
  switch (family) {
    case "sans":
      return "ui-sans-serif, system-ui, sans-serif";
    case "serif":
      return "ui-serif, Georgia, serif";
    case "mono":
      return "ui-monospace, monospace";
    case "system":
    default:
      return "system-ui, -apple-system, sans-serif";
  }
}

// Helper to safely extract string value from option (handles both string and object formats)
function getOptionValue(opt: string | { id?: string; label?: string } | unknown): string {
  if (typeof opt === 'string') return opt;
  if (typeof opt === 'object' && opt !== null) {
    const obj = opt as { id?: string; label?: string };
    return obj.label || obj.id || String(opt);
  }
  return String(opt);
}

export default function FormRenderer({
  formId,
  fields,
  onSubmit: onSubmitOverride,
  submitLabel,
  multiStepConfig,
  styling,
  formTitle,
  conversationalMode,
}: {
  formId: string;
  fields: Field[];
  onSubmit?: (values: Record<string, unknown>) => Promise<void> | void;
  submitLabel?: string;
  multiStepConfig?: MultiStepConfig;
  styling?: import("@/types/form").FormStyling;
  formTitle?: string;
  conversationalMode?: boolean;
}) {
  const { register, handleSubmit, formState, watch, setValue, trigger } = useForm();
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [tempSubmissionId] = useState(() => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  
  // Memoize CSS variables to avoid recalculation
  const cssVariables = useMemo(() => {
    if (!styling) return {};
    return {
      '--form-primary-color': styling.primaryColor,
      '--form-bg-color': styling.backgroundColor,
      '--form-button-color': styling.buttonColor,
      '--form-button-text-color': styling.buttonTextColor,
      '--form-button-radius': `${styling.buttonRadius}px`,
    } as React.CSSProperties;
  }, [styling]);
  
  const fontFamily = useMemo(
    () => (styling ? getFontFamily(styling.fontFamily) : undefined),
    [styling]
  );
  
  // Watch all form values for conditional logic
  const formValues = watch();
  
  // Memoize visible fields calculation to avoid unnecessary re-calculations
  const visibleFieldIds = useMemo(
    () => getVisibleFields(fields, formValues),
    [fields, formValues]
  );
  
  // Clear hidden field values when fields become hidden
  useEffect(() => {
    fields.forEach((field) => {
      if (!visibleFieldIds.includes(field.id)) {
        // Field is hidden, clear its value
        setValue(field.id, undefined);
      }
    });
  }, [visibleFieldIds, fields, setValue]);

  // Memoize validation function to avoid recreating on every render
  const validateFieldWithRules = useCallback((fieldId: string): string | null => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return null;
    
    const value = formValues[fieldId];
    
    // Check required first
    if (field.required && (!value || (typeof value === "string" && !value.trim()))) {
      return "This field is required";
    }
    
    // Apply custom validation rules
    if (field.validation && field.validation.length > 0) {
      const error = validateField(value, field.validation);
      if (error) return error;
    }
    
    return null;
  }, [fields, formValues]);
  
  // Handle field blur event for real-time validation
  const handleFieldBlur = useCallback((fieldId: string) => {
    const error = validateFieldWithRules(fieldId);
    setValidationErrors((prev) => {
      if (error) {
        return { ...prev, [fieldId]: error };
      } else {
        // Remove the error for this field
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      }
    });
  }, [validateFieldWithRules]);
  
  // Validate all visible fields
  const validateAllFields = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    
    visibleFieldIds.forEach((fieldId) => {
      const error = validateFieldWithRules(fieldId);
      if (error) {
        errors[fieldId] = error;
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [visibleFieldIds, validateFieldWithRules]);

  // Validate fields in a specific step
  async function validateStep(stepIndex: number): Promise<boolean> {
    if (!multiStepConfig) return true;
    
    const step = multiStepConfig.steps[stepIndex];
    if (!step) return true;
    
    // Get fields in this step that are visible
    const stepFieldIds = step.fieldIds.filter((fid) => visibleFieldIds.includes(fid));
    
    // Trigger validation for all fields in the step
    const result = await trigger(stepFieldIds);
    
    // Check for required field errors and custom validation
    const errors: Record<string, string> = {};
    stepFieldIds.forEach((fieldId) => {
      const error = validateFieldWithRules(fieldId);
      if (error) {
        errors[fieldId] = error;
      }
    });
    
    setValidationErrors(errors);
    
    return result && Object.keys(errors).length === 0;
  }

  async function onSubmit(values: Record<string, unknown>) {
    // Validate all fields before submission
    const isValid = validateAllFields();
    if (!isValid) {
      return; // Prevent submission if validation fails
    }
    
    setStatus("submitting");
    try {
      if (onSubmitOverride) {
        await onSubmitOverride(values);
        setStatus("idle");
        return;
      }
      const res = await fetch(`/api/forms/${formId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setStatus("done");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed";
      alert(message);
      setStatus("idle");
    }
  }

  // Render conversational form if enabled
  if (conversationalMode) {
    return (
      <ConversationalForm
        fields={fields}
        formTitle={formTitle || "Form"}
        onSubmit={async (data) => {
          await onSubmit(data);
        }}
        styling={{
          primaryColor: styling?.primaryColor,
          backgroundColor: styling?.backgroundColor,
          buttonColor: styling?.buttonColor,
        }}
      />
    );
  }

  if (status === "done") {
    return (
      <div className="text-center py-12">
        <div 
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
          style={{ background: 'var(--accent-light)' }}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--accent)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
          Thank you!
        </h3>
        <p style={{ color: 'var(--foreground-muted)' }}>
          Your response has been recorded.
        </p>
      </div>
    );
  }

  // Render field helper function
  function renderField(f: Field, idx: number) {
    const id = f.id || slugify(f.label);
    
    const label = f.label || `Field ${idx + 1}`;
    const type = f.type || inferTypeFromLabel(label);
    const required = Boolean(f.required);
    const options = f.options || [];
    const placeholder = f.placeholder || `Enter ${label.toLowerCase()}`;
    const helpText = f.helpText;
    
    // Check if field should be visible based on conditional logic
    const isVisible = visibleFieldIds.includes(id);
    
    if (!isVisible) {
      return null;
    }
    
    const hasError = formState.errors[id] || validationErrors[id];
    const errorId = `${id}-error`;
    const helpTextId = `${id}-help`;
    
    return (
      <div key={id} className="space-y-2">
        <label 
          className="block text-sm font-medium" 
          htmlFor={type === "radio" ? undefined : id}
          style={{ color: styling?.primaryColor || 'var(--foreground-muted)' }}
        >
          {label}
          {required && (
            <span 
              className="ml-1" 
              style={{ color: styling?.primaryColor || 'var(--accent)' }}
              aria-label="required"
            >
              *
            </span>
          )}
        </label>
        
        {helpText && (
          <p id={helpTextId} className="text-sm -mt-1" style={{ color: 'var(--foreground-subtle)' }}>
            {helpText}
          </p>
        )}
        
        {type === "file" ? (
          <FileUpload
            fieldId={id}
            formId={formId}
            submissionId={tempSubmissionId}
            config={f.fileConfig || { acceptedTypes: "all", maxSizeMB: 10, multiple: false }}
            value={formValues[id]}
            onChange={(urls) => setValue(id, urls)}
            error={validationErrors[id]}
          />
        ) : type === "textarea" ? (
          <textarea
            id={id}
            rows={4}
            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none transition-colors ${
              hasError ? "border-red-500" : ""
            }`}
            style={{
              '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
              background: 'var(--card-bg)',
              borderColor: hasError ? '#ef4444' : 'var(--card-border)',
              color: 'var(--foreground)',
            } as React.CSSProperties}
            {...register(id, { required })}
            placeholder={placeholder}
            onBlur={() => handleFieldBlur(id)}
            aria-describedby={helpText ? helpTextId : undefined}
            aria-invalid={hasError ? "true" : "false"}
            aria-errormessage={hasError ? errorId : undefined}
            aria-required={required ? "true" : "false"}
          />
        ) : type === "select" ? (
          <select
            id={id}
            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
              hasError ? "border-red-500" : ""
            }`}
            style={{
              '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
              background: 'var(--card-bg)',
              borderColor: hasError ? '#ef4444' : 'var(--card-border)',
              color: 'var(--foreground)',
            } as React.CSSProperties}
            {...register(id, { required })}
            onBlur={() => handleFieldBlur(id)}
            aria-describedby={helpText ? helpTextId : undefined}
            aria-invalid={hasError ? "true" : "false"}
            aria-errormessage={hasError ? errorId : undefined}
            aria-required={required ? "true" : "false"}
          >
            <option value="">Select an option</option>
            {options.map((opt, i) => {
              const optValue = getOptionValue(opt);
              return (
                <option key={i} value={optValue}>
                  {optValue}
                </option>
              );
            })}
          </select>
        ) : type === "radio" ? (
          <div 
            role="radiogroup" 
            aria-labelledby={`${id}-label`}
            aria-describedby={helpText ? helpTextId : undefined}
            aria-required={required ? "true" : "false"}
            className="space-y-2"
          >
            {options.map((opt, i) => {
              const optValue = getOptionValue(opt);
              return (
                <label key={i} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    value={optValue}
                    {...register(id, { required })}
                    className="w-4 h-4 focus:ring-2 transition-colors"
                    style={{
                      accentColor: styling?.primaryColor || 'var(--accent)',
                      '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
                    } as React.CSSProperties}
                    onBlur={() => handleFieldBlur(id)}
                    aria-label={optValue}
                  />
                  <span className="text-sm" style={{ color: styling?.primaryColor || 'var(--foreground)' }}>{optValue}</span>
                </label>
              );
            })}
          </div>
        ) : type === "checkbox" ? (
          <div className="flex items-center gap-3">
            <input
              id={id}
              type="checkbox"
              {...register(id, { required })}
              className="w-4 h-4 rounded focus:ring-2 transition-colors"
              style={{
                accentColor: styling?.primaryColor || 'var(--accent)',
                '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
              } as React.CSSProperties}
              onBlur={() => handleFieldBlur(id)}
              aria-describedby={helpText ? helpTextId : undefined}
              aria-invalid={hasError ? "true" : "false"}
              aria-errormessage={hasError ? errorId : undefined}
              aria-required={required ? "true" : "false"}
            />
            <label htmlFor={id} className="text-sm cursor-pointer" style={{ color: styling?.primaryColor || 'var(--foreground)' }}>
              {placeholder}
            </label>
          </div>
        ) : (
          <input
            id={id}
            type={type === "text" ? "text" : type}
            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
              hasError ? "border-red-500" : ""
            }`}
            style={{
              '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
              background: 'var(--card-bg)',
              borderColor: hasError ? '#ef4444' : 'var(--card-border)',
              color: 'var(--foreground)',
            } as React.CSSProperties}
            {...register(id, { required })}
            placeholder={placeholder}
            onBlur={() => handleFieldBlur(id)}
            aria-describedby={helpText ? helpTextId : undefined}
            aria-invalid={hasError ? "true" : "false"}
            aria-errormessage={hasError ? errorId : undefined}
            aria-required={required ? "true" : "false"}
          />
        )}
        
        {hasError && (
          <p id={errorId} className="text-sm text-red-600 mt-1" role="alert">
            {validationErrors[id] || "This field is required"}
          </p>
        )}
      </div>
    );
  }

  // Render fields based on multi-step config or all at once
  function renderFields(fieldIdsToRender?: string[]) {
    const fieldsToShow = fieldIdsToRender
      ? fields.filter((f) => fieldIdsToRender.includes(f.id))
      : fields;
    
    return fieldsToShow.map((f, idx) => renderField(f, idx));
  }

  // Get the appropriate submit button label
  const finalSubmitLabel = submitLabel || "Submit";

  return (
    <div role="main">
      <form 
        onSubmit={handleSubmit(onSubmit)} 
        className="space-y-5"
        style={{
          ...cssVariables,
          fontFamily: fontFamily,
          backgroundColor: styling?.backgroundColor,
        }}
        aria-label={formTitle || "Form"}
        noValidate
      >
        {multiStepConfig?.enabled && multiStepConfig.steps.length > 0 ? (
          <MultiStepRenderer
            config={multiStepConfig}
            steps={multiStepConfig.steps}
            onValidateStep={validateStep}
            isLastStep={status === "submitting"}
            submitLabel={finalSubmitLabel}
          >
            {(stepFieldIds) => renderFields(stepFieldIds)}
          </MultiStepRenderer>
        ) : (
          <>
            {renderFields()}
            <div className="pt-2">
              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full px-6 py-3 font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm flex items-center justify-center gap-2"
                style={{
                  backgroundColor: styling?.buttonColor || 'var(--foreground)',
                  color: styling?.buttonTextColor || 'var(--background)',
                  borderRadius: styling?.buttonRadius ? `${styling.buttonRadius}px` : '8px',
                  '--tw-ring-color': styling?.buttonColor || 'var(--foreground)',
                  opacity: status === "submitting" ? 0.5 : 1,
                  cursor: status === "submitting" ? "not-allowed" : "pointer",
                } as React.CSSProperties}
                aria-label={status === "submitting" ? "Submitting form" : finalSubmitLabel}
              >
                {status === "submitting" && (
                  <div className="relative w-4 h-4">
                    <div className="absolute inset-0 border-2 border-current border-opacity-25 rounded-full"></div>
                    <div className="absolute inset-0 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                {status === "submitting" ? "Submitting..." : finalSubmitLabel}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}


