"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Field, FormStyling, QuizConfig } from "@/types/form";
import { InlineAIAction } from "@/hooks/useInlineAI";

import FieldRenderer from "./FieldRenderer";
import InlineAIButton, { SingleAIButton } from "./InlineAIButton";
import { InlineSuggestions } from "./AISuggestionsModal";

const OPTION_FIELD_TYPES = new Set([
  "multiple-choice",
  "choices",
  "dropdown",
  "multiselect",
  "checkboxes",
  "radio",
  "select",
  "ranking",
  "picture-choice",
]);

const DISPLAY_ONLY_FIELD_TYPES = new Set([
  "display-text",
  "h1",
  "heading",
  "paragraph",
  "banner",
  "divider",
  "image",
  "video",
]);

function normalizeEditableValue(value: string): string {
  return value.replace(/\u00A0/g, " ").replace(/\r?\n/g, " ");
}

// Helper function to normalize options - handles both string[] and {value, label}[] formats
function normalizeOptions(options: unknown[] | undefined): string[] {
  if (!options || options.length === 0) return [];
  return options.map((opt) => {
    if (typeof opt === 'string') return opt;
    if (typeof opt === 'object' && opt !== null) {
      const optObj = opt as { value?: string; label?: string; text?: string };
      return optObj.label || optObj.value || optObj.text || String(opt);
    }
    return String(opt);
  });
}

interface DraggableFieldProps {
  field: Field;
  index: number;
  isSelected: boolean;
  styling?: FormStyling;
  isQuizMode?: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onUpdate: (updates: Partial<Field>) => void;
}

function formatFieldType(type: Field["type"]): string {
  return type
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export default function DraggableField({
  field,
  index,
  isSelected,
  styling,
  isQuizMode,
  onSelect,
  onDelete,
  onDuplicate,
  onUpdate,
}: DraggableFieldProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
    data: { index },
  });

  const dragStyle = useMemo(() => {
    const style: CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
    };
    if (isDragging) {
      style.zIndex = 60;
      style.opacity = 0.85;
    }
    return style;
  }, [isDragging, transform, transition]);

  const fieldTypeLabel = useMemo(() => formatFieldType(field.type), [field.type]);

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      className={`group relative rounded-lg border bg-white p-4 transition-all ${isSelected
        ? "border-blue-500"
        : "border-gray-200 hover:border-gray-300"
        } ${isDragging ? "opacity-80" : ""}`}
      onClick={onSelect}
      role="presentation"
    >
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            onClick={(event) => event.stopPropagation()}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition hover:border-blue-200 hover:text-blue-500 active:cursor-grabbing"
            aria-label="Drag to reorder"
            type="button"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 4C7 4.55228 6.55228 5 6 5C5.44772 5 5 4.55228 5 4C5 3.44772 5.44772 3 6 3C6.55228 3 7 3.44772 7 4Z" fill="currentColor" />
              <path d="M15 4C15 4.55228 14.5523 5 14 5C13.4477 5 13 4.55228 13 4C13 3.44772 13.4477 3 14 3C14.5523 3 15 3.44772 15 4Z" fill="currentColor" />
              <path d="M7 10C7 10.5523 6.55228 11 6 11C5.44772 11 5 10.5523 5 10C5 9.44772 5.44772 9 6 9C6.55228 9 7 9.44772 7 10Z" fill="currentColor" />
              <path d="M15 10C15 10.5523 14.5523 11 14 11C13.4477 11 13 10.5523 13 10C13 9.44772 13.4477 9 14 9C14.5523 9 15 9.44772 15 10Z" fill="currentColor" />
              <path d="M7 16C7 16.5523 6.55228 17 6 17C5.44772 17 5 16.5523 5 16C5 15.4477 5.44772 15 6 15C6.55228 15 7 15.4477 7 16Z" fill="currentColor" />
              <path d="M15 16C15 16.5523 14.5523 17 14 17C13.4477 17 13 16.5523 13 16C13 15.4477 13.4477 15 14 15C14.5523 15 15 15.4477 15 16Z" fill="currentColor" />
            </svg>
          </button>
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold tracking-wide text-gray-600">
            {fieldTypeLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(event) => {
              event.stopPropagation();
              onDuplicate();
            }}
            className="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            type="button"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8a2 2 0 01-2 2H8" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2" />
            </svg>
            Duplicate
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            className="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-red-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
            type="button"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>

      <div className="pt-4">
        <FieldEditor field={field} onUpdate={onUpdate} styling={styling} isQuizMode={isQuizMode} />
      </div>
    </div>
  );
}

function FieldEditor({
  field,
  onUpdate,
  styling,
  isQuizMode,
}: {
  field: Field;
  onUpdate: (updates: Partial<Field>) => void;
  styling?: FormStyling;
  isQuizMode?: boolean;
}) {
  const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
  const hasOptions = useMemo(() => OPTION_FIELD_TYPES.has(field.type), [field.type]);
  const isDisplayOnly = useMemo(
    () => DISPLAY_ONLY_FIELD_TYPES.has(field.type),
    [field.type]
  );

  // AI suggestion states
  const [labelSuggestions, setLabelSuggestions] = useState<{ text: string; reason?: string }[]>([]);
  const [showLabelSuggestions, setShowLabelSuggestions] = useState(false);

  const labelRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef(new Map<number, HTMLDivElement>());
  const selectionStore = useRef<{
    label?: { start: number; end: number };
    options: Map<number, { start: number; end: number }>;
  }>({ options: new Map() });

  const focusEditable = (element: HTMLElement | null) => {
    if (!element || !isBrowser) return;
    element.focus();
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const captureSelection = (element: HTMLElement | null, key: "label" | number) => {
    if (!isBrowser || !element) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (!element.contains(range.startContainer) || !element.contains(range.endContainer)) return;
    const record = { start: range.startOffset, end: range.endOffset };
    if (key === "label") {
      selectionStore.current.label = record;
    } else {
      selectionStore.current.options.set(key, record);
    }
  };

  const restoreSelection = (element: HTMLElement | null, key: "label" | number) => {
    if (!isBrowser || !element) return;
    const store =
      key === "label"
        ? selectionStore.current.label
        : selectionStore.current.options.get(key);
    if (!store) return;

    if (document.activeElement !== element) {
      if (key === "label") {
        selectionStore.current.label = undefined;
      } else {
        selectionStore.current.options.delete(key);
      }
      return;
    }

    const textNode = element.firstChild;
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
      if (key === "label") {
        selectionStore.current.label = undefined;
      } else {
        selectionStore.current.options.delete(key);
      }
      return;
    }

    const length = textNode.textContent?.length ?? 0;
    const start = Math.min(store.start, length);
    const end = Math.min(store.end, length);
    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    range.setStart(textNode, start);
    range.setEnd(textNode, end);
    selection.removeAllRanges();
    selection.addRange(range);

    if (key === "label") {
      selectionStore.current.label = undefined;
    } else {
      selectionStore.current.options.delete(key);
    }
  };

  useEffect(() => {
    if (!labelRef.current) return;
    const text = field.label || "";
    if (labelRef.current.textContent !== text) {
      labelRef.current.textContent = text;
    }
    restoreSelection(labelRef.current, "label");
  }, [field.label]);

  useEffect(() => {
    focusEditable(labelRef.current);
  }, [field.id]);

  const resolvedOptions = useMemo(() => {
    if (!hasOptions) return [] as string[];
    if (field.options && field.options.length > 0) return normalizeOptions(field.options);
    return ["Option 1", "Option 2"];
  }, [field.options, hasOptions]);

  useEffect(() => {
    const normalizedOptions = normalizeOptions(field.options);
    resolvedOptions.forEach((option, idx) => {
      const ref = optionRefs.current.get(idx);
      if (!ref) return;
      const value =
        normalizedOptions && normalizedOptions[idx] !== undefined ? normalizedOptions[idx] : option;
      if (ref.textContent !== value) {
        ref.textContent = value;
      }
      restoreSelection(ref, idx);
    });
  }, [resolvedOptions, field.options]);

  useEffect(() => {
    optionRefs.current.forEach((_ref, idx) => {
      if (idx >= resolvedOptions.length) {
        optionRefs.current.delete(idx);
      }
    });
    selectionStore.current.options.forEach((_value, key) => {
      if (key >= resolvedOptions.length) {
        selectionStore.current.options.delete(key);
      }
    });
  }, [resolvedOptions.length]);

  const updateLabel = (rawValue: string) => {
    const value = normalizeEditableValue(rawValue);
    if ((field.label || "") === value) return;
    onUpdate({ label: value });
  };

  const optionControlType = useMemo(() => {
    if (["multiple-choice", "choices", "radio"].includes(field.type)) return "radio";
    if (["checkboxes", "multiselect", "checkbox"].includes(field.type)) return "checkbox";
    return null;
  }, [field.type]);

  const persistOptions = (nextOptions: string[], focusIndex?: number) => {
    onUpdate({ options: nextOptions.length ? nextOptions : undefined });
    if (typeof focusIndex === "number" && isBrowser) {
      window.setTimeout(() => {
        const target = optionRefs.current.get(
          Math.min(focusIndex, Math.max(nextOptions.length - 1, 0))
        );
        focusEditable(target || null);
      }, 0);
    }
  };

  const handleFieldImageUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("formId", "builder-assets");
      formData.append("submissionId", "field-image");
      formData.append("fieldId", field.id);
      formData.append("acceptedTypes", "images");

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      onUpdate({ imageUrl: data.url, helpText: data.url }); // Update both for compatibility
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
    }
  };

  const handleImageUpload = async (index: number, file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("formId", "builder-assets");
      formData.append("submissionId", "options");
      formData.append("fieldId", field.id);
      formData.append("acceptedTypes", "images");

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      const currentImages = field.optionImages ? [...field.optionImages] : [];

      // Ensure array is long enough
      const currentOptions = field.options && field.options.length > 0 ? field.options : resolvedOptions;
      while (currentImages.length < currentOptions.length) currentImages.push("");

      currentImages[index] = data.url;
      onUpdate({ optionImages: currentImages });
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
    }
  };

  const handleOptionChange = (index: number, rawValue: string) => {
    const value = normalizeEditableValue(rawValue);
    const current =
      field.options && field.options.length > 0 ? [...field.options] : [...resolvedOptions];
    if (current[index] === value) return;
    current[index] = value;
    persistOptions(current);
  };

  const handleOptionRemove = (index: number) => {
    const current =
      field.options && field.options.length > 0 ? [...field.options] : [...resolvedOptions];
    const next = current.filter((_, idx) => idx !== index);
    if (next.length === 0) return;

    const updates: Partial<Field> = { options: next };
    if (field.optionImages) {
      updates.optionImages = field.optionImages.filter((_, idx) => idx !== index);
    }

    onUpdate(updates);

    if (isBrowser) {
      window.setTimeout(() => {
        const target = optionRefs.current.get(
          Math.min(Math.max(index - 1, 0), Math.max(next.length - 1, 0))
        );
        focusEditable(target || null);
      }, 0);
    }
  };

  const handleOptionInsertAfter = (index?: number) => {
    const current =
      field.options && field.options.length > 0 ? [...field.options] : [...resolvedOptions];
    const insertAt = typeof index === "number" ? index + 1 : current.length;
    current.splice(insertAt, 0, `Option ${current.length + 1}`);

    const updates: Partial<Field> = { options: current };

    if (field.type === "picture-choice") {
      const currentImages = field.optionImages ? [...field.optionImages] : [];
      // Pad images array if needed
      while (currentImages.length < current.length - 1) currentImages.push("");
      currentImages.splice(insertAt, 0, "");
      updates.optionImages = currentImages;
    }

    onUpdate(updates);

    if (isBrowser) {
      window.setTimeout(() => {
        const target = optionRefs.current.get(insertAt);
        focusEditable(target || null);
      }, 0);
    }
  };

  const updateQuizConfig = (updates: Partial<QuizConfig>) => {
    onUpdate({
      quizConfig: {
        ...field.quizConfig,
        ...updates,
      },
    });
  };

  // Handler for AI label improvements
  const handleLabelAIResult = (action: InlineAIAction, data: Record<string, unknown>) => {
    if (action === "improve-question" && data.suggestions) {
      const suggestions = data.suggestions as { text: string; reason?: string }[];
      setLabelSuggestions(suggestions);
      setShowLabelSuggestions(true);
    } else if (action === "rewrite-concise" || action === "rewrite-formal" || action === "rewrite-casual") {
      const rewritten = data.rewritten as string;
      if (rewritten) {
        onUpdate({ label: rewritten });
      }
    } else if (action === "fix-grammar") {
      const fixed = data.fixed as string;
      if (fixed) {
        onUpdate({ label: fixed });
      }
    } else if (action === "translate") {
      const translated = data.translated as string;
      if (translated) {
        onUpdate({ label: translated });
      }
    }
  };

  // Handler for AI options generation
  const handleOptionsAIResult = (data: Record<string, unknown>) => {
    const normalizeAIResponse = (items: unknown[]): string[] => {
      return items.map(item => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          const obj = item as any;
          return obj.text || obj.label || obj.value || String(item);
        }
        return String(item);
      });
    };

    if (data.options) {
      const options = normalizeAIResponse(data.options as unknown[]);
      onUpdate({ options });
    } else if (data.newOptions) {
      const newOptions = normalizeAIResponse(data.newOptions as unknown[]);
      const current = field.options || resolvedOptions;
      onUpdate({ options: [...current, ...newOptions] });
    }
  };

  // Handler for quiz AI results
  const handleQuizAIResult = (action: string, data: Record<string, unknown>) => {
    if (action === "generate-distractors" && data.distractors) {
      const distractors = data.distractors as { text: string }[];
      const currentOptions = field.options || [];
      const correctAnswer = field.quizConfig?.correctAnswer;
      const newOptions = distractors.map(d => d.text);
      // Add correct answer if not present
      if (correctAnswer && typeof correctAnswer === "string" && !newOptions.includes(correctAnswer)) {
        newOptions.unshift(correctAnswer);
      }
      onUpdate({ options: [...currentOptions, ...newOptions.filter(o => !currentOptions.includes(o))] });
    } else if (action === "explain-answer" && data.explanation) {
      updateQuizConfig({ explanation: data.explanation as string });
    }
  };

  // AI context for this field
  const getAIContext = () => ({
    fieldLabel: field.label,
    fieldType: field.type,
    options: field.options,
    correctAnswer: field.quizConfig?.correctAnswer,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div
            ref={labelRef}
            role="textbox"
            contentEditable
            suppressContentEditableWarning
            className="relative flex-1 cursor-text rounded-md px-1 py-1 text-base font-semibold text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-500/40 before:pointer-events-none before:absolute before:inset-1 before:select-none before:text-sm before:text-gray-400 before:opacity-0 before:content-[attr(data-placeholder)] empty:before:opacity-100"
            data-placeholder="Untitled field"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onInput={(e) => {
              captureSelection(e.currentTarget, "label");
              updateLabel(e.currentTarget.textContent || "");
            }}
            onBlur={(e) => updateLabel(e.currentTarget.textContent || "")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                focusEditable(optionRefs.current.get(0) || null);
              }
            }}
          />
          {/* AI Button for question label */}
          {field.label && field.label.length > 2 && (
            <InlineAIButton
              actions={["improve-question", "rewrite-concise", "rewrite-formal", "rewrite-casual", "fix-grammar"]}
              context={getAIContext()}
              onResult={handleLabelAIResult}
              size="sm"
            />
          )}
        </div>
        {!isDisplayOnly && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ required: !field.required });
            }}
            className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${field.required
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
              }`}
            type="button"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {field.required ? "Required" : "Optional"}
          </button>
        )}
      </div>

      {/* AI Label Suggestions */}
      {showLabelSuggestions && labelSuggestions.length > 0 && (
        <InlineSuggestions
          suggestions={labelSuggestions}
          onSelect={(text) => {
            onUpdate({ label: text });
            setShowLabelSuggestions(false);
            setLabelSuggestions([]);
          }}
          onClose={() => {
            setShowLabelSuggestions(false);
            setLabelSuggestions([]);
          }}
        />
      )}

      {hasOptions && (
        <div className="space-y-2">
          {resolvedOptions.map((option, idx) => {
            const currentValue =
              field.options && field.options[idx] !== undefined ? field.options[idx] : option;

            return (
              <div
                key={`${field.id}-option-${idx}`}
                className="group flex items-center gap-3 rounded-xl border border-transparent bg-gray-50 px-3 py-2 transition-colors hover:border-gray-300 hover:bg-white"
              >
                {optionControlType ? (
                  <input type={optionControlType} disabled className="h-4 w-4" />
                ) : (
                  <span className="text-gray-400">•</span>
                )}
                <div
                  ref={(el) => {
                    if (el) {
                      optionRefs.current.set(idx, el);
                      if (el.textContent !== currentValue) {
                        el.textContent = currentValue;
                      }
                    } else {
                      optionRefs.current.delete(idx);
                    }
                  }}
                  role="textbox"
                  contentEditable
                  suppressContentEditableWarning
                  className="relative flex-1 cursor-text rounded px-1 py-0.5 text-sm text-gray-800 outline-none before:pointer-events-none before:absolute before:inset-y-0 before:left-1 before:select-none before:text-sm before:text-gray-400 before:opacity-0 before:content-[attr(data-placeholder)] empty:before:opacity-100"
                  data-placeholder={`Option ${idx + 1}`}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onInput={(e) => {
                    captureSelection(e.currentTarget, idx);
                    handleOptionChange(idx, e.currentTarget.textContent || "");
                  }}
                  onBlur={(e) => handleOptionChange(idx, e.currentTarget.textContent || "")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleOptionInsertAfter(idx);
                    }
                    if (e.key === "Backspace" && !e.shiftKey) {
                      const value = e.currentTarget.textContent || "";
                      const optionsCount =
                        field.options && field.options.length > 0
                          ? field.options.length
                          : resolvedOptions.length;
                      if (!value && optionsCount > 1) {
                        e.preventDefault();
                        handleOptionRemove(idx);
                      }
                    }
                  }}
                />

                {field.type === "picture-choice" && field.optionImages?.[idx] && (
                  <div className="h-8 w-8 relative rounded overflow-hidden border border-gray-200 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={field.optionImages[idx]} alt="Option" className="h-full w-full object-cover" />
                  </div>
                )}

                {field.type === "picture-choice" && (
                  <label className="cursor-pointer rounded-md border border-gray-200 p-1.5 text-gray-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Upload image">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(idx, file);
                      }}
                    />
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </label>
                )}

                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOptionInsertAfter(idx);
                    }}
                    className="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                    title="Add option below"
                    type="button"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOptionRemove(idx);
                    }}
                    className="rounded-md border border-gray-200 p-1.5 text-red-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300"
                    title="Remove option"
                    disabled={resolvedOptions.length <= 1}
                    type="button"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOptionInsertAfter();
              }}
              className="flex-1 rounded-xl border border-dashed border-gray-300 py-2 text-sm font-medium text-gray-500 transition-colors hover:border-blue-300 hover:text-blue-600"
              type="button"
            >
              + Add option
            </button>
            {/* AI Generate Options Button */}
            {field.label && (
              <SingleAIButton
                action={field.options && field.options.length > 1 ? "add-more-options" : "generate-options"}
                context={getAIContext()}
                onResult={handleOptionsAIResult}
                label={field.options && field.options.length > 1 ? "✨ More" : "✨ Generate"}
                className="flex-shrink-0"
              />
            )}
          </div>
        </div>
      )}

      {field.type === "image" && (
        <div className="space-y-2 mb-4">
          <label className="block text-sm font-medium text-gray-700">Image</label>
          <div className="flex items-center gap-4">
            {field.imageUrl || field.helpText ? (
              <div className="relative w-full max-w-xs rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={field.imageUrl || field.helpText}
                  alt="Field image"
                  className="w-full h-auto object-contain"
                />
                <button
                  onClick={() => onUpdate({ imageUrl: undefined, helpText: undefined })}
                  className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm hover:bg-gray-100 border border-gray-200 transition-colors"
                  title="Remove image"
                  type="button"
                >
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-blue-400 transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-gray-500">SVG, PNG, JPG or GIF</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFieldImageUpload(file);
                  }}
                />
              </label>
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
        <FieldRenderer field={field} isPreview={false} styling={styling} />
      </div>

      {/* Quiz Configuration Section */}
      {isQuizMode && !isDisplayOnly && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-green-100 text-green-600">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Quiz Answer</h4>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-medium text-gray-500">Grade this field</span>
              <div className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={field.quizConfig?.correctAnswer !== undefined && field.quizConfig?.correctAnswer !== null}
                  onChange={(e) => {
                    if (e.target.checked) {
                      updateQuizConfig({ correctAnswer: "", points: 1 });
                    } else {
                      // We need to pass undefined to remove the key, but Partial<QuizConfig> might not like explicit undefined if not typed optionally?
                      // Actually in JS/TS passing undefined is fine for optional fields.
                      // However, we need to make sure the backend/state handles it.
                      // Let's set it to null or remove the config object?
                      // Ideally we just clear the values.
                      updateQuizConfig({ correctAnswer: undefined, points: 1, explanation: "" });
                    }
                  }}
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
              </div>
            </label>
          </div>

          {(field.quizConfig?.correctAnswer !== undefined && field.quizConfig?.correctAnswer !== null) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Points */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Points</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={field.quizConfig?.points || 1}
                  onChange={(e) => updateQuizConfig({ points: parseInt(e.target.value) || 1 })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Correct Answer */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Correct Answer</label>

                {/* Text Fields */}
                {["short-answer", "long-answer", "text", "textarea", "email", "url", "tel"].includes(field.type) && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <select
                        value={field.quizConfig?.matchType || "exact"}
                        onChange={(e) => updateQuizConfig({ matchType: e.target.value as "exact" | "contains" })}
                        className="w-32 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="exact">Exact Match</option>
                        <option value="contains">Contains</option>
                      </select>
                      <input
                        type="text"
                        value={(field.quizConfig?.correctAnswer as string) || ""}
                        onChange={(e) => updateQuizConfig({ correctAnswer: e.target.value })}
                        className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={field.quizConfig?.matchType === "contains" ? "Enter text that must be included" : "Enter exact answer"}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={field.quizConfig?.caseSensitive || false}
                          onChange={(e) => updateQuizConfig({ caseSensitive: e.target.checked })}
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        Case sensitive
                      </label>
                    </div>
                  </div>
                )}

                {/* Number Fields */}
                {["number", "currency"].includes(field.type) && (
                  <input
                    type="number"
                    value={(field.quizConfig?.correctAnswer as number) || ""}
                    onChange={(e) => updateQuizConfig({ correctAnswer: parseFloat(e.target.value) })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter correct number"
                  />
                )}

                {/* Single Choice */}
                {["multiple-choice", "choices", "radio", "dropdown", "select"].includes(field.type) && (
                  <select
                    value={(field.quizConfig?.correctAnswer as string) || ""}
                    onChange={(e) => updateQuizConfig({ correctAnswer: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select correct option...</option>
                    {normalizeOptions(field.options).map((option, index) => (
                      <option key={index} value={option}>{option}</option>
                    ))}
                  </select>
                )}

                {/* Multiple Choice */}
                {["checkboxes", "multiselect"].includes(field.type) && (
                  <div className="space-y-1.5 border border-gray-200 rounded-md p-2 max-h-32 overflow-y-auto">
                    {normalizeOptions(field.options).map((option, index) => {
                      const correctAnswers = (field.quizConfig?.correctAnswer as string[]) || [];
                      return (
                        <label key={index} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={correctAnswers.includes(option)}
                            onChange={(e) => {
                              const current = correctAnswers.filter(a => a !== option);
                              const updated = e.target.checked ? [...current, option] : current;
                              updateQuizConfig({ correctAnswer: updated });
                            }}
                            className="w-3.5 h-3.5 text-blue-600 rounded"
                          />
                          {option}
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Date */}
                {["date", "date-picker"].includes(field.type) && (
                  <input
                    type="date"
                    value={(field.quizConfig?.correctAnswer as string) || ""}
                    onChange={(e) => updateQuizConfig({ correctAnswer: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              </div>

              {/* Explanation */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-500">Explanation</label>
                  {/* AI Generate Explanation Button */}
                  {field.quizConfig?.correctAnswer && (
                    <SingleAIButton
                      action="explain-answer"
                      context={getAIContext()}
                      onResult={(data) => handleQuizAIResult("explain-answer", data)}
                      label="✨ Generate"
                      className="text-[10px] py-1 px-2"
                    />
                  )}
                </div>
                <textarea
                  value={field.quizConfig?.explanation || ""}
                  onChange={(e) => updateQuizConfig({ explanation: e.target.value })}
                  rows={2}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Explain why this is correct (shown after submission)"
                />
              </div>

              {/* AI Generate Distractors (Wrong Answers) - for choice fields */}
              {hasOptions && field.quizConfig?.correctAnswer && (
                <div className="sm:col-span-2 pt-2 border-t border-gray-100">
                  <SingleAIButton
                    action="generate-distractors"
                    context={getAIContext()}
                    onResult={(data) => handleQuizAIResult("generate-distractors", data)}
                    label="✨ Generate Wrong Answers"
                    className="w-full justify-center"
                  />
                  <p className="text-[10px] text-gray-400 mt-1 text-center">
                    AI will create plausible but incorrect options
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
