"use client";

import { useForm, Controller } from "react-hook-form";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type { ChangeEvent } from "react";
import { Field, MultiStepConfig, QuizModeConfig } from "@/types/form";
import { getVisibleFields } from "@/lib/conditionalLogic";
import { validateField } from "@/lib/validation";
import { QuizScore } from "@/lib/scoring";
import MultiStepRenderer from "@/components/MultiStepRenderer";
import FileUpload from "@/components/FileUpload";
import ConversationalForm from "@/components/ConversationalForm";
import { Spinner } from "@/components/ui/Spinner";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
    case "open-sans":
      return "'Open Sans', sans-serif";
    case "lato":
      return "'Lato', sans-serif";
    case "montserrat":
      return "'Montserrat', sans-serif";
    case "playfair":
      return "'Playfair Display', serif";
    case "merriweather":
      return "'Merriweather', serif";
    case "courier":
      return "'Courier New', Courier, monospace";
    case "arial":
      return "Arial, Helvetica, sans-serif";
    case "georgia":
      return "Georgia, serif";
    case "times":
      return "'Times New Roman', Times, serif";
    case "poppins":
      return "'Poppins', sans-serif";
    case "raleway":
      return "'Raleway', sans-serif";
    case "nunito":
      return "'Nunito', sans-serif";
    case "rubik":
      return "'Rubik', sans-serif";
    case "pt-serif":
      return "'PT Serif', serif";
    case "source-serif":
      return "'Source Serif Pro', serif";
    case "fira-code":
      return "'Fira Code', monospace";
    case "jetbrains-mono":
      return "'JetBrains Mono', monospace";
    case "patrick-hand":
      return "'Patrick Hand', cursive";
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

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Star Rating Field Component
function StarRatingField({
  id,
  value,
  onSelect,
  isPreviewMode,
}: {
  id: string;
  value?: number;
  onSelect: (rating: number) => void;
  isPreviewMode: boolean;
}) {
  const selectedRating = value || 0;

  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-full p-1 ${
            star <= selectedRating
              ? 'text-yellow-400'
              : 'text-gray-300 hover:text-yellow-400'
          }`}
          onClick={() => onSelect(star)}
          aria-label={`Rate ${star} out of 5 stars`}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className="w-8 h-8"
          >
            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 4.646 1.251 5.318c.277 1.162-1.074 2.056-1.987 1.488L12 18.771l-4.695 2.636c-.913.568-2.264-.326-1.987-1.488l1.251-5.318-4.117-4.646c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
          </svg>
        </button>
      ))}
    </div>
  );
}

// ...existing code...
// Slider Field Component
function SliderField({
  id,
  value,
  onChange,
  isPreviewMode,
  required,
  register,
}: {
  id: string;
  value?: number;
  onChange: (value: number) => void;
  isPreviewMode: boolean;
  required: boolean;
  register?: (name: string, rules?: Record<string, unknown>) => unknown;
}) {
// ...existing code...
  const sliderValue = value ?? 50;

  return (
    <div className="space-y-2">
      <input
        id={id}
        type="range"
        min="0"
        max="100"
        value={sliderValue}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, var(--accent, #3b82f6) 0%, var(--accent, #3b82f6) ${sliderValue}%, #e5e7eb ${sliderValue}%, #e5e7eb 100%)`,
        }}
        {...(register && !isPreviewMode ? register(id, { required }) || {} : {})}
        onChange={(e) => {
          const newValue = parseInt(e.target.value, 10);
          onChange(newValue);
        }}
      />
      <div className="flex justify-between text-sm" style={{ color: 'var(--foreground-muted)' }}>
        <span>0</span>
        <span>{sliderValue}</span>
        <span>100</span>
      </div>
    </div>
  );
}

// ...existing code...
// Opinion Scale Field Component
function OpinionScaleField({
  id,
  value,
  onSelect,
  isPreviewMode,
  styling,
}: {
  id: string;
  value?: number;
  onSelect: (value: number) => void;
  isPreviewMode: boolean;
  styling?: import("@/types/form").FormStyling;
}) {
// ...existing code...
  const selectedValue = value;

  return (
    <div className="flex gap-2 justify-between">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
        const isSelected = selectedValue === num;
        const primaryColor = styling?.primaryColor || 'var(--accent)';
        
        return (
          <button
            key={num}
            type="button"
            className={`w-10 h-10 border-2 rounded-lg transition-colors focus:outline-none ${
              isSelected
                ? 'font-semibold'
                : 'hover:border-blue-500 hover:bg-blue-50'
            }`}
            style={{
              borderColor: isSelected ? primaryColor : 'var(--card-border, #d1d5db)',
              backgroundColor: isSelected ? `${primaryColor}20` : 'transparent',
              color: isSelected ? primaryColor : 'var(--foreground)',
            }}
            onClick={() => onSelect(num)}
            aria-label={`Select ${num}`}
            aria-pressed={isSelected}
          >
            {num}
          </button>
        );
      })}
    </div>
  );
}

// Sortable item component for ranking
function SortableRankingItem({ 
  id, 
  value, 
  index, 
  isPreviewMode 
}: { 
  id: string; 
  value: string; 
  index: number; 
  isPreviewMode: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: false });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 border rounded-lg bg-white ${
        isDragging ? 'shadow-lg' : 'border-gray-300'
      } ${isPreviewMode ? 'cursor-move' : 'cursor-grab active:cursor-grabbing'}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-center"
        style={{ touchAction: 'none' }}
      >
        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
        </svg>
      </div>
      <span className="flex-1" style={{ color: 'var(--foreground)' }}>{value}</span>
      <span className="text-sm font-medium" style={{ color: 'var(--foreground-muted)' }}>#{index + 1}</span>
    </div>
  );
}

// ...existing code...
// Ranking field component with drag-and-drop
function RankingField({
  fieldId,
  options,
  value,
  onChange,
  onBlur,
  isPreviewMode,
  styling,
}: {
  fieldId: string;
  options: (string | { id?: string; label?: string })[];
  value?: string[];
  onChange: (rankedOptions: string[]) => void;
  onBlur: () => void;
  isPreviewMode: boolean;
  styling?: import("@/types/form").FormStyling;
}) {
// ...existing code...
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Convert options to strings
  const optionStrings = useMemo(() => 
    options.map(opt => getOptionValue(opt)),
    [options]
  );

  // Track the last value we sent via onChange to prevent sync loops
  const lastSentValueRef = useRef<string[] | undefined>(undefined);
  
  // Initialize ranked order from value or use default order
  const [rankedItems, setRankedItems] = useState<string[]>(() => {
    if (value && Array.isArray(value)) {
      // Validate that all items in value exist in options
      const validItems = value.filter(item => optionStrings.includes(item));
      // Add any missing options
      const missingItems = optionStrings.filter(opt => !validItems.includes(opt));
      const initialItems = [...validItems, ...missingItems];
      lastSentValueRef.current = initialItems;
      return initialItems;
    }
    const initialItems = optionStrings;
    lastSentValueRef.current = initialItems;
    return initialItems;
  });

  // Update ranked items when options change
  useEffect(() => {
    setRankedItems(prev => {
      const newItems = [...prev];
      // Remove items that no longer exist in options
      const filtered = newItems.filter(item => optionStrings.includes(item));
      // Add new options that weren't in the previous list
      const newOptions = optionStrings.filter(opt => !filtered.includes(opt));
      return [...filtered, ...newOptions];
    });
  }, [optionStrings]);

  // Sync ranked items with value prop when it changes externally (e.g., form reset)
  // Skip if the value matches what we just sent (prevents sync loops)
  useEffect(() => {
    // Skip if we don't have options ready
    if (!optionStrings.length) return;
    
    // Build the expected items array from the value prop
    const validItems = value && Array.isArray(value) 
      ? value.filter(item => optionStrings.includes(item))
      : [];
    const missingItems = optionStrings.filter(opt => !validItems.includes(opt));
    const expectedItems = [...validItems, ...missingItems];
    const expectedItemsStr = JSON.stringify(expectedItems);
    
    // Get the last sent value as string for comparison
    const lastSentStr = lastSentValueRef.current ? JSON.stringify(lastSentValueRef.current) : null;
    
    // If the expected items match what we just sent, skip sync (it's our own change)
    if (expectedItemsStr === lastSentStr) {
      return;
    }
    
    // Update state only if it's actually different
    setRankedItems(prev => {
      const prevStr = JSON.stringify(prev);
      if (prevStr !== expectedItemsStr) {
        // This is an external change, update the ref
        lastSentValueRef.current = expectedItems;
        return expectedItems;
      }
      return prev;
    });
  }, [value, optionStrings]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    let newItems: string[] = [];
    
    // Update local state first
    setRankedItems((items) => {
      const oldIndex = items.indexOf(active.id as string);
      const newIndex = items.indexOf(over.id as string);
      newItems = arrayMove(items, oldIndex, newIndex);
      return newItems;
    });
    
    // Update ref to track what we're sending (before calling onChange)
    lastSentValueRef.current = newItems;
    
    // Defer onChange to avoid updating parent state during render
    // Use setTimeout to ensure it runs after the current render cycle
    setTimeout(() => {
      onChange(newItems);
      // Only trigger blur validation if not in preview mode
      if (!isPreviewMode) {
        onBlur();
      }
    }, 0);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={rankedItems} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {rankedItems.map((item, index) => (
            <SortableRankingItem
              key={item}
              id={item}
              value={item}
              index={index}
              isPreviewMode={isPreviewMode}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// ...existing code...
export default function FormRenderer({
  formId,
  fields: initialFields,
  onSubmit: onSubmitOverride,
  submitLabel,
  multiStepConfig,
  styling,
  formTitle,
  conversationalMode,
  quizMode,
  isPreview = false,
  limitOneResponse,
  saveAndEdit,
  defaultValues,
  isEditMode,
  submissionId,
  editToken,
}: {
  formId: string;
  fields: Field[];
  onSubmit?: (values: Record<string, unknown>) => Promise<void> | void;
  submitLabel?: string;
  multiStepConfig?: MultiStepConfig;
  styling?: import("@/types/form").FormStyling;
  formTitle?: string;
  conversationalMode?: boolean;
  quizMode?: QuizModeConfig;
  limitOneResponse?: boolean;
  saveAndEdit?: boolean;
  isPreview?: boolean;
  defaultValues?: Record<string, unknown>;
  isEditMode?: boolean;
  submissionId?: string;
  editToken?: string;
}) {
// ...existing code...
  const { register, handleSubmit, formState, watch, setValue, trigger, control, reset } = useForm({
    defaultValues: defaultValues || {},
  });
  
  const [respondentId, setRespondentId] = useState<string>("");
  const [alreadyResponded, setAlreadyResponded] = useState(false);

  useEffect(() => {
    // Generate or get respondentId
    if (typeof window !== 'undefined') {
      let rid = localStorage.getItem("form_respondent_id");
      if (!rid) {
        rid = crypto.randomUUID();
        localStorage.setItem("form_respondent_id", rid);
      }
      setRespondentId(rid);

      if (limitOneResponse && !isPreview) {
        // Check if already submitted
        fetch(`/api/forms/${formId}/check-submission?respondentId=${rid}`)
          .then(res => res.json())
          .then(data => {
              if (data.submitted) setAlreadyResponded(true);
          })
          .catch(err => console.error("Failed to check submission", err));
      }
    }
  }, [formId, limitOneResponse, isPreview]);
  const [fields] = useState(() => {
    if (quizMode?.shuffleQuestions) {
      return shuffleArray([...initialFields]);
    }
    return initialFields;
  });

  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [tempSubmissionId] = useState(() => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [quizScore, setQuizScore] = useState<QuizScore | null>(null);

  
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
        
        // Special handling for date-range fields - clear both start and end
        if (field.type === "date-range") {
          setValue(`${field.id}_start`, undefined);
          setValue(`${field.id}_end`, undefined);
        }
      }
    });
  }, [visibleFieldIds, fields, setValue]);

  // Memoize validation function to avoid recreating on every render
  const validateFieldWithRules = useCallback((fieldId: string): string | null => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return null;
    
    // Special handling for date-range fields
    if (field.type === "date-range") {
      const startValue = formValues[`${fieldId}_start`];
      const endValue = formValues[`${fieldId}_end`];
      
      if (field.required) {
        if (!startValue || (typeof startValue === "string" && !startValue.trim())) {
          return "Start date is required";
        }
        if (!endValue || (typeof endValue === "string" && !endValue.trim())) {
          return "End date is required";
        }
        
        // Validate that end date is after start date
        if (startValue && endValue && new Date(String(endValue)) < new Date(String(startValue))) {
          return "End date must be after start date";
        }
      }
      
      return null;
    }
    
    const value = formValues[fieldId];
    
    // Check required first
    if (field.required && (!value || (typeof value === "string" && !value.trim()))) {
      return "This field is required";
    }
    
    // Apply custom validation rules
    if (field.validation && field.validation.length > 0) {
      const error = validateField(value as string | number | undefined, field.validation);
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
    
    // Process "Other" option values - replace __other__ with actual text
    const processedValues = { ...values };
    Object.keys(processedValues).forEach(key => {
      // Skip the _other_text fields, they'll be used to replace __other__ values
      if (key.endsWith('_other_text')) return;
      
      const value = processedValues[key];
      const otherTextKey = `${key}_other_text`;
      const otherText = values[otherTextKey] as string;
      
      if (value === '__other__' && otherText) {
        // Single selection (radio, dropdown) - replace with text
        processedValues[key] = `Other: ${otherText}`;
        delete processedValues[otherTextKey];
      } else if (Array.isArray(value) && value.includes('__other__') && otherText) {
        // Multiple selection (checkboxes) - replace __other__ in array with text
        processedValues[key] = value.map(v => v === '__other__' ? `Other: ${otherText}` : v);
        delete processedValues[otherTextKey];
      } else if (otherText !== undefined) {
        // Clean up unused _other_text fields
        delete processedValues[otherTextKey];
      }
    });
    
    setStatus("submitting");
    try {
      if (onSubmitOverride) {
        await onSubmitOverride(processedValues);
        setStatus("idle");
        return;
      }
      
      const url = isEditMode && submissionId 
        ? `/api/forms/${formId}/submit?submissionId=${submissionId}`
        : `/api/forms/${formId}/submit`;
        
      const method = isEditMode ? "PUT" : "POST";
      const body = isEditMode 
        ? { ...processedValues, editToken } 
        : { ...processedValues, respondentId };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to submit");
      }
      
      const data = await res.json();
      if (data.score) {
        setQuizScore(data.score);
      }
      setStatus("done");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed";
      alert(message);
      setStatus("idle");
    }
  }

  // Render conversational form if enabled
  if (alreadyResponded) {
    return (
      <div className="text-center py-12">
        <div 
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
          style={{ background: 'var(--accent-light)' }}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--accent)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
          You have already responded
        </h3>
        <p style={{ color: 'var(--foreground-muted)' }}>
          This form is limited to one response per person.
        </p>
      </div>
    );
  }

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
          buttonTextColor: styling?.buttonTextColor,
          fontFamily: styling?.fontFamily,
          headerImage: styling?.headerImage,
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

        <div className="mt-8 pt-8 border-t border-dashed" style={{ borderColor: 'var(--card-border)' }}>
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--foreground)' }}>
            Want to create a form like this?
          </p>
          <a
            href="/"
            target="_blank"
            className="paper-button paper-button-primary inline-flex items-center justify-center px-5 py-2.5 text-sm shadow-sm hover:shadow-md transition-all"
          >
            Create Your Own Form
          </a>
        </div>

        {quizScore && (
          <div className="mt-8 max-w-md mx-auto">
            <div 
              className="rounded-lg p-6 border"
              style={{ 
                background: 'var(--card-bg)',
                borderColor: 'var(--card-border)'
              }}
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    quizScore.passed ? 'bg-green-100' : 'bg-yellow-100'
                  }`}
                >
                  <span className={`text-2xl font-bold ${
                    quizScore.passed ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {quizScore.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
              
              <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                Your Score
              </h4>
              
              <div className="space-y-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                <p>
                  <span className="font-medium">Points:</span> {quizScore.earnedPoints.toFixed(1)} / {quizScore.totalPoints}
                </p>
                <p>
                  <span className="font-medium">Result:</span>{' '}
                  <span className={quizScore.passed ? 'text-green-600 font-semibold' : 'text-yellow-600 font-semibold'}>
                    {quizScore.passed ? 'Passed ✓' : 'Not Passed'}
                  </span>
                </p>
              </div>

              {quizScore.questionScores && quizScore.questionScores.length > 0 && (
                <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--card-border)' }}>
                  <h5 className="font-semibold mb-3 text-sm" style={{ color: 'var(--foreground)' }}>
                    Question Breakdown
                  </h5>
                  <div className="space-y-3 text-left">
                    {quizScore.questionScores.map((q, idx) => (
                      <div key={q.fieldId} className="text-sm">
                        <div className="flex items-start gap-2">
                          <span className={`mt-0.5 ${q.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            {q.isCorrect ? '✓' : '✗'}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                              {q.fieldLabel}
                            </p>
                            <p style={{ color: 'var(--foreground-muted)' }}>
                              {q.pointsEarned.toFixed(1)} / {q.pointsPossible} points
                            </p>
                            {q.explanation && (
                              <p className="mt-1 text-xs italic" style={{ color: 'var(--foreground-muted)' }}>
                                {q.explanation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render field helper function
  function renderField(f: Field, idx: number, isPreviewMode = isPreview, fieldNumbers?: Map<string, number>) {
    const id = f.id || slugify(f.label);

    const label = f.label || `Field ${idx + 1}`;
    const type = f.type || inferTypeFromLabel(label);
    const required = Boolean(f.required);
    const options = f.options || [];
    const placeholder = f.placeholder || `Enter ${label.toLowerCase()}`;
    const helpText = f.helpText;
    
    const fieldNumber = styling?.showFieldNumbers && fieldNumbers ? fieldNumbers.get(id) : undefined;

    // Check if field should be visible based on conditional logic
    const isVisible = visibleFieldIds.includes(id);

    if (!isVisible) {
      return null;
    }

    // Special handling for date-range fields - check both start and end errors
    const hasError = type === "date-range" 
      ? (formState.errors[`${id}_start`] || formState.errors[`${id}_end`] || validationErrors[id])
      : (formState.errors[id] || validationErrors[id]);
    const errorId = `${id}-error`;
    const helpTextId = `${id}-help`;

    // Display-only fields (no form input)
    const isDisplayOnly = [
      "display-text", "h1", "heading", "paragraph", "banner", "divider", "image", "video", "html"
    ].includes(type);

    // Render display-only fields
    if (isDisplayOnly) {
      return (
        <div key={id} className="space-y-2">
          {type === "h1" && (
            <h1
              className="text-4xl font-bold"
              style={{ color: styling?.primaryColor || '#111827' }}
            >
              {label}
            </h1>
          )}
          {type === "heading" && (
            <h2
              className="text-2xl font-bold"
              style={{ color: styling?.primaryColor || '#111827' }}
            >
              {label}
            </h2>
          )}
          {(type === "paragraph" || type === "display-text") && (
            <p style={{ color: styling?.primaryColor || '#374151' }}>
              {helpText || label}
            </p>
          )}
          {type === "banner" && (
            <div 
              className="border-l-4 p-4 rounded"
              style={{
                backgroundColor: styling?.primaryColor 
                  ? (styling.primaryColor.startsWith('#') 
                      ? `rgba(${parseInt(styling.primaryColor.slice(1, 3), 16)}, ${parseInt(styling.primaryColor.slice(3, 5), 16)}, ${parseInt(styling.primaryColor.slice(5, 7), 16)}, 0.1)`
                      : `${styling.primaryColor}1A`)
                  : 'rgba(59, 130, 246, 0.1)',
                borderColor: styling?.primaryColor || '#3b82f6',
              }}
            >
              <p 
                className="font-medium"
                style={{ color: styling?.primaryColor || '#1e40af' }}
              >
                {label}
              </p>
              {helpText && (
                <p 
                  className="text-sm mt-1"
                  style={{ 
                    color: styling?.primaryColor || '#1e3a8a'
                  }}
                >
                  {helpText}
                </p>
              )}
            </div>
          )}
          {type === "divider" && (
            <hr 
              className="border-t-2"
              style={{ borderColor: 'var(--card-border)' }}
            />
          )}
          {type === "image" && (
            <div className="rounded-lg overflow-hidden">
              {f.imageUrl || helpText || placeholder ? (
                <img
                  src={f.imageUrl || helpText || placeholder}
                  alt={label || "Image"}
                  className="w-full h-auto max-h-96 object-contain"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.image-placeholder')) {
                      const placeholder = document.createElement('div');
                      placeholder.className = 'image-placeholder border-2 border-dashed border-gray-300 rounded-lg p-8 text-center';
                      placeholder.innerHTML = `
                        <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p class="text-gray-500 mt-2">Image failed to load</p>
                      `;
                      parent.appendChild(placeholder);
                    }
                  }}
                />
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 mt-2">Image will be displayed here</p>
                  {label && <p className="text-sm text-gray-400 mt-1">{label}</p>}
                </div>
              )}
            </div>
          )}
          {type === "video" && (
            <div className="rounded-lg overflow-hidden">
              {helpText || placeholder ? (
                <video
                  src={helpText || placeholder}
                  controls
                  className="w-full h-auto max-h-96"
                  style={{ backgroundColor: 'var(--card-bg)' }}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 mt-2">Video will be displayed here</p>
                  {label && <p className="text-sm text-gray-400 mt-1">{label}</p>}
                </div>
              )}
            </div>
          )}
          {type === "html" && (
            <div dangerouslySetInnerHTML={{ __html: helpText || label }} />
          )}
        </div>
      );
    }

    // Render form input fields
    return (
      <div key={id} className="space-y-2">
        {!isDisplayOnly && (
          <label
            className="block text-sm font-medium"
            htmlFor={type === "radio" || type === "checkboxes" || type === "multiselect" ? undefined : id}
            style={{ color: styling?.primaryColor || 'var(--foreground-muted)' }}
          >
            {fieldNumber && <span>{fieldNumber}. </span>}
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
        )}

        {helpText && !isDisplayOnly && (
          <p id={helpTextId} className="text-sm -mt-1" style={{ color: 'var(--foreground-subtle)' }}>
            {helpText}
          </p>
        )}

        {/* File Upload */}
        {(type === "file" || type === "file-uploader") && (
          <FileUpload
            fieldId={id}
            formId={formId}
            submissionId={tempSubmissionId}
            config={f.fileConfig || { acceptedTypes: "all", maxSizeMB: 10, multiple: false }}
            value={formValues[id] as string[] | undefined}
            onChange={(urls) => isPreviewMode ? undefined : setValue(id, urls)}
            error={validationErrors[id]}
          />
        )}

        {/* Text Inputs */}
        {(type === "short-answer" || type === "text") && (
          <input
            id={id}
            type="text"
            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
              hasError ? "border-red-500" : ""
            }`}
            style={{
              '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
              background: 'var(--card-bg)',
              borderColor: hasError ? '#ef4444' : 'var(--card-border)',
              color: 'var(--foreground)',
            } as React.CSSProperties}
            {...(isPreviewMode ? { name: id, value: (formValues[id] as string) || '' } : register(id, { required }))}
            placeholder={placeholder}
            {...(isPreviewMode ? { onChange: (event: ChangeEvent<HTMLInputElement>) => setValue(id, event.target.value) } : {})}
            onBlur={() => isPreviewMode ? undefined : handleFieldBlur(id)}
            aria-describedby={helpText ? helpTextId : undefined}
            aria-invalid={hasError ? "true" : "false"}
            aria-errormessage={hasError ? errorId : undefined}
            aria-required={required ? "true" : "false"}
          />
        )}

        {/* Long Text / Textarea */}
        {(type === "long-answer" || type === "textarea") && (
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
            {...(isPreviewMode ? { name: id, value: (formValues[id] as string) || '' } : register(id, { required }))}
            placeholder={placeholder}
            {...(isPreviewMode ? { onChange: (event: ChangeEvent<HTMLTextAreaElement>) => setValue(id, event.target.value) } : {})}
            onBlur={() => isPreviewMode ? undefined : handleFieldBlur(id)}
            aria-describedby={helpText ? helpTextId : undefined}
            aria-invalid={hasError ? "true" : "false"}
            aria-errormessage={hasError ? errorId : undefined}
            aria-required={required ? "true" : "false"}
          />
        )}

        {/* Contact Info */}
        {type === "email" && (
          <input
            id={id}
            type="email"
            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
              hasError ? "border-red-500" : ""
            }`}
            style={{
              '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
              background: 'var(--card-bg)',
              borderColor: hasError ? '#ef4444' : 'var(--card-border)',
              color: 'var(--foreground)',
            } as React.CSSProperties}
            {...(isPreviewMode ? { name: id, value: (formValues[id] as string) || '' } : register(id, { required }))}
            placeholder={placeholder || "your@email.com"}
            {...(isPreviewMode ? { onChange: (event: ChangeEvent<HTMLInputElement>) => setValue(id, event.target.value) } : {})}
            onBlur={() => isPreviewMode ? undefined : handleFieldBlur(id)}
            aria-describedby={helpText ? helpTextId : undefined}
            aria-invalid={hasError ? "true" : "false"}
            aria-errormessage={hasError ? errorId : undefined}
            aria-required={required ? "true" : "false"}
          />
        )}

        {type === "phone" && (
          <input
            id={id}
            type="tel"
            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
              hasError ? "border-red-500" : ""
            }`}
            style={{
              '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
              background: 'var(--card-bg)',
              borderColor: hasError ? '#ef4444' : 'var(--card-border)',
              color: 'var(--foreground)',
            } as React.CSSProperties}
            {...(isPreviewMode ? { name: id, value: (formValues[id] as string) || '' } : register(id, { required }))}
            placeholder={placeholder || "+1 (555) 000-0000"}
            {...(isPreviewMode ? { onChange: (event: ChangeEvent<HTMLInputElement>) => setValue(id, event.target.value) } : {})}
            onBlur={() => isPreviewMode ? undefined : handleFieldBlur(id)}
            aria-describedby={helpText ? helpTextId : undefined}
            aria-invalid={hasError ? "true" : "false"}
            aria-errormessage={hasError ? errorId : undefined}
            aria-required={required ? "true" : "false"}
          />
        )}

        {type === "address" && (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Street Address"
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                hasError ? "border-red-500" : ""
              }`}
              style={{
                '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
                background: 'var(--card-bg)',
                borderColor: hasError ? '#ef4444' : 'var(--card-border)',
                color: 'var(--foreground)',
              } as React.CSSProperties}
              {...(isPreviewMode ? { name: `${id}_street`, value: (formValues[`${id}_street`] as string) || '' } : register(`${id}_street`, { required }))}
              {...(isPreviewMode ? { onChange: (event: ChangeEvent<HTMLInputElement>) => setValue(`${id}_street`, event.target.value) } : {})}
              onBlur={() => isPreviewMode ? undefined : handleFieldBlur(id)}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="City"
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                  hasError ? "border-red-500" : ""
                }`}
                style={{
                  '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
                  background: 'var(--card-bg)',
                  borderColor: hasError ? '#ef4444' : 'var(--card-border)',
                  color: 'var(--foreground)',
                } as React.CSSProperties}
                {...(isPreviewMode ? { name: `${id}_city`, value: (formValues[`${id}_city`] as string) || '' } : register(`${id}_city`, { required }))}
                {...(isPreviewMode ? { onChange: (event: ChangeEvent<HTMLInputElement>) => setValue(`${id}_city`, event.target.value) } : {})}
                onBlur={() => isPreviewMode ? undefined : handleFieldBlur(id)}
              />
              <input
                type="text"
                placeholder="State/Province"
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                  hasError ? "border-red-500" : ""
                }`}
                style={{
                  '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
                  background: 'var(--card-bg)',
                  borderColor: hasError ? '#ef4444' : 'var(--card-border)',
                  color: 'var(--foreground)',
                } as React.CSSProperties}
                {...(isPreviewMode ? { name: `${id}_state`, value: (formValues[`${id}_state`] as string) || '' } : register(`${id}_state`, { required }))}
                {...(isPreviewMode ? { onChange: (event: ChangeEvent<HTMLInputElement>) => setValue(`${id}_state`, event.target.value) } : {})}
                onBlur={() => isPreviewMode ? undefined : handleFieldBlur(id)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="ZIP/Postal Code"
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                  hasError ? "border-red-500" : ""
                }`}
                style={{
                  '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
                  background: 'var(--card-bg)',
                  borderColor: hasError ? '#ef4444' : 'var(--card-border)',
                  color: 'var(--foreground)',
                } as React.CSSProperties}
                {...(isPreviewMode ? { name: `${id}_zip`, value: (formValues[`${id}_zip`] as string) || '' } : register(`${id}_zip`, { required }))}
                {...(isPreviewMode ? { onChange: (event: ChangeEvent<HTMLInputElement>) => setValue(`${id}_zip`, event.target.value) } : {})}
                onBlur={() => isPreviewMode ? undefined : handleFieldBlur(id)}
              />
              <input
                type="text"
                placeholder="Country"
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                  hasError ? "border-red-500" : ""
                }`}
                style={{
                  '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
                  background: 'var(--card-bg)',
                  borderColor: hasError ? '#ef4444' : 'var(--card-border)',
                  color: 'var(--foreground)',
                } as React.CSSProperties}
                {...(isPreviewMode ? { name: `${id}_country`, value: (formValues[`${id}_country`] as string) || '' } : register(`${id}_country`, { required }))}
                {...(isPreviewMode ? { onChange: (event: ChangeEvent<HTMLInputElement>) => setValue(`${id}_country`, event.target.value) } : {})}
                onBlur={() => isPreviewMode ? undefined : handleFieldBlur(id)}
              />
            </div>
          </div>
        )}

        {/* Choice Fields - Radio/Multiple Choice/Choices (single selection) */}

        {(type === "radio" || type === "multiple-choice" || type === "choices") && (
          <div className="space-y-3">
            {((options && options.length > 0) ? options : ["Option 1", "Option 2", "Option 3"]).map((opt, i) => {
              const optValue = getOptionValue(opt);
              const radioId = `${id}_${i}`;
              const isChecked = formValues[id] === optValue;
              
              return (
        <label key={i} className="flex items-center gap-3 cursor-pointer">
          <input
            id={radioId}
            type="radio"
            value={optValue}
            checked={isChecked}
            {...(isPreviewMode ? { name: id } : register(id, { required }))}
            className="w-4 h-4 focus:ring-2 transition-colors"
            style={{
              accentColor: styling?.primaryColor || 'var(--accent)',
              '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
            } as React.CSSProperties}
            {...(isPreviewMode ? { onChange: (event: ChangeEvent<HTMLInputElement>) => {
              setValue(id, event.target.value);
              // Clear the "other" text field when selecting a predefined option
              setValue(`${id}_other_text`, '');
            } } : {})}
            onBlur={() => isPreviewMode ? undefined : handleFieldBlur(id)}
          />
          <span className="text-sm" style={{ color: styling?.primaryColor || 'var(--foreground)' }}>{optValue}</span>
        </label>
      );
    })}
    {/* "Other" option for radio/multiple-choice */}
    {f.allowOther && (
      <div className="space-y-2">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            id={`${id}_other`}
            type="radio"
            value="__other__"
            checked={formValues[id] === '__other__'}
            {...(isPreviewMode ? { name: id } : register(id, { required }))}
            className="w-4 h-4 focus:ring-2 transition-colors"
            style={{
              accentColor: styling?.primaryColor || 'var(--accent)',
              '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
            } as React.CSSProperties}
            {...(isPreviewMode ? { onChange: (event: ChangeEvent<HTMLInputElement>) => setValue(id, event.target.value) } : {})}
            onBlur={() => isPreviewMode ? undefined : handleFieldBlur(id)}
          />
          <span className="text-sm" style={{ color: styling?.primaryColor || 'var(--foreground)' }}>Other</span>
        </label>
        {formValues[id] === '__other__' && (
          <input
            type="text"
            placeholder="Please specify..."
            value={(formValues[`${id}_other_text`] as string) || ''}
            className="ml-7 w-[calc(100%-1.75rem)] px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors text-sm"
            style={{
              '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
              background: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
              color: 'var(--foreground)',
            } as React.CSSProperties}
            {...(isPreviewMode ? { onChange: (event: ChangeEvent<HTMLInputElement>) => setValue(`${id}_other_text`, event.target.value) } : register(`${id}_other_text`))}
          />
        )}
      </div>
    )}
  </div>
)}

        {(type === "dropdown" || type === "select") && (
          <div>
            <select
              id={id}
              value={(formValues[id] as string) || ''}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                hasError ? "border-red-500" : ""
              }`}
              style={{
                '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
                background: 'var(--card-bg)',
                borderColor: hasError ? '#ef4444' : 'var(--card-border)',
                color: 'var(--foreground)',
              } as React.CSSProperties}
              {...(isPreviewMode ? { name: id } : register(id, { required }))}
              {...(isPreviewMode ? { onChange: (event: ChangeEvent<HTMLSelectElement>) => setValue(id, event.target.value) } : {})}
              onBlur={() => isPreviewMode ? undefined : handleFieldBlur(id)}
              aria-describedby={helpText ? helpTextId : undefined}
              aria-invalid={hasError ? "true" : "false"}
              aria-errormessage={hasError ? errorId : undefined}
              aria-required={required ? "true" : "false"}
            >
              <option value="">Select an option...</option>
              {options.map((opt, i) => {
                const optValue = getOptionValue(opt);
                return (
                  <option key={i} value={optValue}>
                    {optValue}
                  </option>
                );
              })}
              {f.allowOther && <option value="__other__">Other</option>}
            </select>
            {/* "Other" text field for dropdown */}
            {f.allowOther && formValues[id] === '__other__' && (
              <input
                type="text"
                placeholder="Please specify..."
                value={(formValues[`${id}_other_text`] as string) || ''}
                className="mt-2 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors text-sm"
                style={{
                  '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
                  background: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--foreground)',
                } as React.CSSProperties}
                {...(isPreviewMode ? { onChange: (event: ChangeEvent<HTMLInputElement>) => setValue(`${id}_other_text`, event.target.value) } : register(`${id}_other_text`))}
              />
            )}
          </div>
        )}

        {(type === "checkboxes" || type === "multiselect") && (
          <div className="space-y-2">
            {options.map((opt, i) => {
              const optValue = getOptionValue(opt);
              const checkboxId = `${id}_${i}`;
              const currentValue = formValues[id];
              const selectedValues = Array.isArray(currentValue) ? currentValue : (currentValue ? [currentValue] : []);
              const isChecked = selectedValues.includes(optValue);
              
              return (
                <label key={i} className="flex items-center gap-3 cursor-pointer">
                  <input
                    id={checkboxId}
                    type="checkbox"
                    value={optValue}
                    checked={isChecked}
                    {...(isPreviewMode ? { name: id } : register(id, { required }))}
                    className="w-4 h-4 rounded focus:ring-2 transition-colors"
                    style={{
                      accentColor: styling?.primaryColor || 'var(--accent)',
                      '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
                    } as React.CSSProperties}
                    {...(isPreviewMode ? {
                      onChange: (event: ChangeEvent<HTMLInputElement>) => {
                        const newSelectedValues = event.target.checked
                          ? [...selectedValues, optValue]
                          : selectedValues.filter((v: string) => v !== optValue);
                        setValue(id, newSelectedValues);
                        // Clear "other" text when unchecking "other"
                        if (!event.target.checked && optValue === '__other__') {
                          setValue(`${id}_other_text`, '');
                        }
                      },
                    } : {})}
                    onBlur={() => isPreviewMode ? undefined : handleFieldBlur(id)}
                  />
                  <span className="text-sm" style={{ color: styling?.primaryColor || 'var(--foreground)' }}>{optValue}</span>
                </label>
              );
            })}
            {/* "Other" option for checkboxes/multiselect */}
            {f.allowOther && (() => {
              const currentValue = formValues[id];
              const selectedValues = Array.isArray(currentValue) ? currentValue : (currentValue ? [currentValue] : []);
              const isOtherChecked = selectedValues.includes('__other__');
              
              return (
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      id={`${id}_other`}
                      type="checkbox"
                      value="__other__"
                      checked={isOtherChecked}
                      {...(isPreviewMode ? { name: id } : register(id, { required }))}
                      className="w-4 h-4 rounded focus:ring-2 transition-colors"
                      style={{
                        accentColor: styling?.primaryColor || 'var(--accent)',
                        '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
                      } as React.CSSProperties}
                      {...(isPreviewMode ? {
                        onChange: (event: ChangeEvent<HTMLInputElement>) => {
                          const newSelectedValues = event.target.checked
                            ? [...selectedValues, '__other__']
                            : selectedValues.filter((v: string) => v !== '__other__');
                          setValue(id, newSelectedValues);
                          // Clear "other" text when unchecking
                          if (!event.target.checked) {
                            setValue(`${id}_other_text`, '');
                          }
                        },
                      } : {})}
                      onBlur={() => isPreviewMode ? undefined : handleFieldBlur(id)}
                    />
                    <span className="text-sm" style={{ color: styling?.primaryColor || 'var(--foreground)' }}>Other</span>
                  </label>
                  {isOtherChecked && (
                    <input
                      type="text"
                      placeholder="Please specify..."
                      value={(formValues[`${id}_other_text`] as string) || ''}
                      className="ml-7 w-[calc(100%-1.75rem)] px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors text-sm"
                      style={{
                        '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
                        background: 'var(--card-bg)',
                        borderColor: 'var(--card-border)',
                        color: 'var(--foreground)',
                      } as React.CSSProperties}
                      {...(isPreviewMode ? { onChange: (event: ChangeEvent<HTMLInputElement>) => setValue(`${id}_other_text`, event.target.value) } : register(`${id}_other_text`))}
                    />
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {type === "checkbox" && (
          <div className="flex items-center gap-3">
            <input
              id={id}
              type="checkbox"
              checked={Boolean(formValues[id])}
              {...(isPreviewMode ? { name: id } : register(id, { required }))}
              className="w-4 h-4 rounded focus:ring-2 transition-colors"
              style={{
                accentColor: styling?.primaryColor || 'var(--accent)',
                '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
              } as React.CSSProperties}
              {...(isPreviewMode ? { onChange: (event: ChangeEvent<HTMLInputElement>) => setValue(id, event.target.checked) } : {})}
              onBlur={() => isPreviewMode ? undefined : handleFieldBlur(id)}
              aria-describedby={helpText ? helpTextId : undefined}
              aria-invalid={hasError ? "true" : "false"}
              aria-errormessage={hasError ? errorId : undefined}
              aria-required={required ? "true" : "false"}
            />
            <label htmlFor={id} className="text-sm cursor-pointer" style={{ color: styling?.primaryColor || 'var(--foreground)' }}>
              {placeholder}
            </label>
          </div>
        )}

        {type === "switch" && (
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative inline-block w-12 h-6">
              <input
                type="checkbox"
                checked={Boolean(formValues[id])}
                {...(isPreviewMode ? { name: id } : register(id, { required }))}
                className="sr-only peer"
                {...(isPreviewMode ? { onChange: (event: ChangeEvent<HTMLInputElement>) => setValue(id, event.target.checked) } : {})}
                onBlur={() => isPreviewMode ? undefined : handleFieldBlur(id)}
                style={{
                  '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
                } as React.CSSProperties}
              />
              <div
                className="w-12 h-6 peer-focus:outline-none peer-focus:ring-2 rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                style={{
                  '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
                  backgroundColor: formValues[id] ? (styling?.primaryColor || '#3b82f6') : '#e5e7eb',
                } as React.CSSProperties}
              ></div>
            </div>
            <span className="text-sm" style={{ color: styling?.primaryColor || 'var(--foreground)' }}>{label}</span>
          </label>
        )}

        {type === "picture-choice" && (
          <div className="grid grid-cols-3 gap-3">
            {((options && options.length > 0) ? options : ["Option 1", "Option 2", "Option 3"]).map((opt, i) => {
              const optValue = getOptionValue(opt);
              const isSelected = formValues[id] === optValue;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={isPreviewMode ? () => setValue(id, optValue) : undefined}
                  className={`relative border-2 rounded-lg p-4 transition-all ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-300 hover:border-blue-400'
                  } ${isPreviewMode ? 'cursor-pointer' : 'cursor-default'}`}
                  style={{
                    borderColor: isSelected 
                      ? (styling?.primaryColor || '#3b82f6')
                      : 'var(--card-border)',
                    '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
                  } as React.CSSProperties}
                  disabled={!isPreviewMode}
                >
                  <div className="aspect-square bg-gray-100 rounded flex items-center justify-center mb-2">
                    {f.optionImages?.[i] || (typeof opt === 'object' && opt !== null && 'image' in opt && (opt as { image?: string }).image) ? (
                      <img
                        src={f.optionImages?.[i] || ((opt as unknown as { image: string }).image)}
                        alt={optValue}
                        className="w-full h-full object-cover rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm text-center" style={{ color: 'var(--foreground)' }}>{optValue}</p>
                  {isSelected && (
                    <div 
                      className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: styling?.primaryColor || '#3b82f6' }}
                    >
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {type === "choice-matrix" && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border px-4 py-2 bg-gray-50 text-left" style={{ borderColor: 'var(--card-border)' }}></th>
                  {((options && options.length > 0) ? options : ["Option 1", "Option 2", "Option 3"]).map((opt, i) => {
                    const optValue = getOptionValue(opt);
                    return (
                      <th key={i} className="border px-4 py-2 bg-gray-50 text-center" style={{ borderColor: 'var(--card-border)' }}>
                        {optValue}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {(f.matrixRows || ["Row 1", "Row 2", "Row 3"]).map((row, rowIdx) => {
                  const rowId = `${id}_row_${rowIdx}`;
                  const selectedValue = formValues[rowId];
                  return (
                    <tr key={rowIdx}>
                      <td className="border px-4 py-2 font-medium" style={{ borderColor: 'var(--card-border)' }}>{row}</td>
                      {((options && options.length > 0) ? options : ["Option 1", "Option 2", "Option 3"]).map((opt, colIdx) => {
                        const optValue = getOptionValue(opt);
                        const isChecked = f.allowMultipleSelection
                          ? Array.isArray(selectedValue) && selectedValue.includes(optValue)
                          : selectedValue === optValue;
                        
                        return (
                          <td key={colIdx} className="border px-4 py-2 text-center" style={{ borderColor: 'var(--card-border)' }}>
                            <input
                              type={f.allowMultipleSelection ? "checkbox" : "radio"}
                              value={optValue}
                              checked={isChecked}
                              {...(isPreviewMode ? { 
                                name: rowId,
                                onChange: (event: ChangeEvent<HTMLInputElement>) => {
                                  if (f.allowMultipleSelection) {
                                    const currentValues = Array.isArray(selectedValue) ? selectedValue : [];
                                    const newValues = event.target.checked
                                      ? [...currentValues, optValue]
                                      : currentValues.filter((v: string) => v !== optValue);
                                    setValue(rowId, newValues);
                                  } else {
                                    setValue(rowId, event.target.value);
                                  }
                                }
                              } : {
                                ...register(rowId, { required: required && rowIdx === 0 }),
                                onChange: (event: ChangeEvent<HTMLInputElement>) => {
                                  if (f.allowMultipleSelection) {
                                    const currentValues = Array.isArray(selectedValue) ? selectedValue : [];
                                    const newValues = event.target.checked
                                      ? [...currentValues, optValue]
                                      : currentValues.filter((v: string) => v !== optValue);
                                    setValue(rowId, newValues);
                                  } else {
                                    register(rowId).onChange(event);
                                  }
                                }
                              })}
                              onBlur={() => isPreviewMode ? undefined : handleFieldBlur(rowId)}
                              className="w-4 h-4 focus:ring-2 transition-colors"
                              style={{
                                accentColor: styling?.primaryColor || 'var(--accent)',
                                '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
                              } as React.CSSProperties}
                              disabled={!isPreviewMode && false} // React Hook Form handles disabled state
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Date & Time */}
        {(type === "date" || type === "date-picker") && (
          <input
            id={id}
            type="date"
            value={(formValues[id] as string) || ''}
            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
              hasError ? "border-red-500" : ""
            }`}
            style={{
              '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
              background: 'var(--card-bg)',
              borderColor: hasError ? '#ef4444' : 'var(--card-border)',
              color: 'var(--foreground)',
            } as React.CSSProperties}
            {...(isPreviewMode ? { name: id } : register(id, { required }))}
            {...(isPreviewMode ? { onChange: (event: ChangeEvent<HTMLInputElement>) => setValue(id, event.target.value) } : {})}
            onBlur={() => isPreviewMode ? undefined : handleFieldBlur(id)}
            aria-describedby={helpText ? helpTextId : undefined}
            aria-invalid={hasError ? "true" : "false"}
            aria-errormessage={hasError ? errorId : undefined}
            aria-required={required ? "true" : "false"}
          />
        )}

        {(type === "time" || type === "time-picker") && (
          <input
            id={id}
            type="time"
            value={(formValues[id] as string) || ''}
            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
              hasError ? "border-red-500" : ""
            }`}
            style={{
              '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
              background: 'var(--card-bg)',
              borderColor: hasError ? '#ef4444' : 'var(--card-border)',
              color: 'var(--foreground)',
            } as React.CSSProperties}
            {...(isPreviewMode ? { name: id } : register(id, { required }))}
            {...(isPreviewMode ? { onChange: (event: ChangeEvent<HTMLInputElement>) => setValue(id, event.target.value) } : {})}
            onBlur={() => isPreviewMode ? undefined : handleFieldBlur(id)}
            aria-describedby={helpText ? helpTextId : undefined}
            aria-invalid={hasError ? "true" : "false"}
            aria-errormessage={hasError ? errorId : undefined}
            aria-required={required ? "true" : "false"}
          />
        )}

        {type === "datetime-picker" && (
          <input
            id={id}
            type="datetime-local"
            value={(formValues[id] as string) || ''}
            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
              hasError ? "border-red-500" : ""
            }`}
            style={{
              '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
              background: 'var(--card-bg)',
              borderColor: hasError ? '#ef4444' : 'var(--card-border)',
              color: 'var(--foreground)',
            } as React.CSSProperties}
            {...(isPreviewMode ? { name: id } : register(id, { required }))}
            {...(isPreviewMode ? { onChange: (event: ChangeEvent<HTMLInputElement>) => setValue(id, event.target.value) } : {})}
            onBlur={() => isPreviewMode ? undefined : handleFieldBlur(id)}
            aria-describedby={helpText ? helpTextId : undefined}
            aria-invalid={hasError ? "true" : "false"}
            aria-errormessage={hasError ? errorId : undefined}
            aria-required={required ? "true" : "false"}
          />
        )}

        {type === "date-range" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label 
                htmlFor={`${id}_start`}
                className="block text-sm mb-1" 
                style={{ color: 'var(--foreground-muted)' }}
              >
                Start Date
              </label>
              <input
                id={`${id}_start`}
                type="date"
                value={(formValues[`${id}_start`] as string) || ''}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                  hasError ? "border-red-500" : ""
                }`}
                style={{
                  '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
                  background: 'var(--card-bg)',
                  borderColor: hasError ? '#ef4444' : 'var(--card-border)',
                  color: 'var(--foreground)',
                } as React.CSSProperties}
                {...(isPreviewMode ? { name: `${id}_start` } : register(`${id}_start`, { required }))}
                {...(isPreviewMode ? { onChange: (event: ChangeEvent<HTMLInputElement>) => setValue(`${id}_start`, event.target.value) } : {})}
                onBlur={() => isPreviewMode ? undefined : handleFieldBlur(id)}
                aria-describedby={helpText ? helpTextId : undefined}
                aria-invalid={hasError ? "true" : "false"}
                aria-errormessage={hasError ? errorId : undefined}
                aria-required={required ? "true" : "false"}
              />
            </div>
            <div>
              <label 
                htmlFor={`${id}_end`}
                className="block text-sm mb-1" 
                style={{ color: 'var(--foreground-muted)' }}
              >
                End Date
              </label>
              <input
                id={`${id}_end`}
                type="date"
                value={(formValues[`${id}_end`] as string) || ''}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                  hasError ? "border-red-500" : ""
                }`}
                style={{
                  '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
                  background: 'var(--card-bg)',
                  borderColor: hasError ? '#ef4444' : 'var(--card-border)',
                  color: 'var(--foreground)',
                } as React.CSSProperties}
                {...(isPreviewMode ? { name: `${id}_end` } : register(`${id}_end`, { required }))}
                {...(isPreviewMode ? { onChange: (event: ChangeEvent<HTMLInputElement>) => setValue(`${id}_end`, event.target.value) } : {})}
                onBlur={() => isPreviewMode ? undefined : handleFieldBlur(id)}
                aria-describedby={helpText ? helpTextId : undefined}
                aria-invalid={hasError ? "true" : "false"}
                aria-errormessage={hasError ? errorId : undefined}
                aria-required={required ? "true" : "false"}
              />
            </div>
            {hasError && validationErrors[id] && (
              <div id={errorId} className="col-span-2 text-sm text-red-500 mt-1">
                {validationErrors[id]}
              </div>
            )}
          </div>
        )}

        {/* Rating & Ranking */}
        {type === "star-rating" && (
          <Controller
            name={id}
            control={control}
            defaultValue={formValues[id] ?? 0}
            rules={required ? { validate: (val) => !!val || "This field is required" } : undefined}
            render={({ field }) => (
              <StarRatingField
                id={id}
                value={
                  typeof field.value === "number"
                    ? field.value
                    : field.value
                    ? Number(field.value)
                    : undefined
                }
                onSelect={(rating) => {
                  field.onChange(rating);
                  if (!isPreviewMode) {
                    field.onBlur();
                    handleFieldBlur(id);
                  }
                }}
                isPreviewMode={isPreviewMode}
              />
            )}
          />
        )}

        {type === "slider" && (
          <SliderField
            id={id}
            value={formValues[id] as number | undefined}
            onChange={(value) => {
              setValue(id, value);
              // Only trigger validation blur if not in preview mode
              if (!isPreviewMode) {
                handleFieldBlur(id);
              }
            }}
            isPreviewMode={isPreviewMode}
            required={required}
            register={isPreviewMode ? undefined : register}
          />
        )}

        {type === "opinion-scale" && (
          <OpinionScaleField
            id={id}
            value={formValues[id] as number | undefined}
            onSelect={(value) => {
              setValue(id, value);
              // Only trigger validation blur if not in preview mode
              if (!isPreviewMode) {
                handleFieldBlur(id);
              }
            }}
            isPreviewMode={isPreviewMode}
            styling={styling}
          />
        )}

        {type === "ranking" && (
          <RankingField
            fieldId={id}
            options={options}
            value={formValues[id] as string[] | undefined}
            onChange={(rankedOptions) => {
              setValue(id, rankedOptions);
              // Only trigger validation blur if not in preview mode
              if (!isPreviewMode) {
                handleFieldBlur(id);
              }
            }}
            onBlur={() => isPreviewMode ? undefined : handleFieldBlur(id)}
            isPreviewMode={isPreviewMode}
            styling={styling}
          />
        )}

        {/* Numbers */}
        {type === "number" && (
          <input
            id={id}
            type="number"
            value={(formValues[id] as string | number) || ''}
            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
              hasError ? "border-red-500" : ""
            }`}
            style={{
              '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
              background: 'var(--card-bg)',
              borderColor: hasError ? '#ef4444' : 'var(--card-border)',
              color: 'var(--foreground)',
            } as React.CSSProperties}
            {...(isPreviewMode ? { name: id } : register(id, { required, valueAsNumber: true }))}
            placeholder={placeholder || "0"}
            {...(isPreviewMode ? { onChange: (event: ChangeEvent<HTMLInputElement>) => setValue(id, event.target.value ? parseFloat(event.target.value) : undefined) } : {})}
            onBlur={() => isPreviewMode ? undefined : handleFieldBlur(id)}
            aria-describedby={helpText ? helpTextId : undefined}
            aria-invalid={hasError ? "true" : "false"}
            aria-errormessage={hasError ? errorId : undefined}
            aria-required={required ? "true" : "false"}
          />
        )}

        {type === "currency" && (
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              id={id}
              type="number"
              step="0.01"
              value={(formValues[id] as string | number) || ''}
              className={`w-full pl-8 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                hasError ? "border-red-500" : ""
              }`}
              style={{
                '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
                background: 'var(--card-bg)',
                borderColor: hasError ? '#ef4444' : 'var(--card-border)',
                color: 'var(--foreground)',
              } as React.CSSProperties}
              {...(isPreviewMode ? { name: id } : register(id, { required, valueAsNumber: true }))}
              placeholder="0.00"
              {...(isPreviewMode ? { onChange: (event: ChangeEvent<HTMLInputElement>) => setValue(id, event.target.value ? parseFloat(event.target.value) : undefined) } : {})}
              onBlur={() => isPreviewMode ? undefined : handleFieldBlur(id)}
              aria-describedby={helpText ? helpTextId : undefined}
              aria-invalid={hasError ? "true" : "false"}
              aria-errormessage={hasError ? errorId : undefined}
              aria-required={required ? "true" : "false"}
            />
          </div>
        )}

        {/* Fallback for unsupported types */}
        {![
          "short-answer", "text", "long-answer", "textarea", "email", "phone", "address",
          "multiple-choice", "choices", "radio", "dropdown", "select", "checkboxes", "multiselect", "checkbox", "switch",
          "date", "date-picker", "time", "time-picker", "datetime-picker", "date-range",
          "star-rating", "slider", "opinion-scale", "ranking", "number", "currency", "file", "file-uploader"
        ].includes(type) && (
          <input
            id={id}
            type="text"
            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
              hasError ? "border-red-500" : ""
            }`}
            style={{
              '--tw-ring-color': styling?.primaryColor || 'var(--accent)',
              background: 'var(--card-bg)',
              borderColor: hasError ? '#ef4444' : 'var(--card-border)',
              color: 'var(--foreground)',
            } as React.CSSProperties}
            {...(isPreviewMode ? { name: id } : register(id, { required }))}
            placeholder={placeholder}
            onBlur={() => isPreviewMode ? undefined : handleFieldBlur(id)}
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
    
    // Display-only field types that don't get numbered
    const displayOnlyTypes = [
      "display-text", "h1", "heading", "paragraph", "banner", "divider", "image", "video", "html"
    ];
    
    // Pre-compute field numbers for visible, non-display-only fields
    let fieldNumber = 0;
    const fieldNumbers = new Map<string, number>();
    
    fieldsToShow.forEach((f) => {
      const id = f.id || slugify(f.label || '');
      const type = f.type || inferTypeFromLabel(f.label || '');
      const isVisible = visibleFieldIds.includes(id);
      const isDisplayOnly = displayOnlyTypes.includes(type);
      
      if (isVisible && !isDisplayOnly) {
        fieldNumber++;
        fieldNumbers.set(id, fieldNumber);
      }
    });
    
    return fieldsToShow.map((f, idx) => renderField(f, idx, isPreview, fieldNumbers));
  }

  // Get the appropriate submit button label
  const finalSubmitLabel = submitLabel || "Submit";

  return (
    <div role="main">
      {styling?.headerImage && (
        <div className="mb-6 rounded-lg overflow-hidden">
          <img 
            src={styling.headerImage} 
            alt={formTitle || "Header"} 
            className="w-full h-auto object-cover max-h-64"
          />
        </div>
      )}
      {formTitle && (
        <h1 
          className="text-3xl font-bold mb-6"
          style={{ 
            color: styling?.primaryColor || 'var(--foreground)',
            fontFamily: fontFamily,
          }}
        >
          {formTitle}
        </h1>
      )}
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
            isSubmitting={status === "submitting"}
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
                  <Spinner size="sm" variant="current" />
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


