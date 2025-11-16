"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Field, FormStyling } from "@/types/form";

import FieldRenderer from "./FieldRenderer";

const OPTION_FIELD_TYPES = new Set([
  "multiple-choice",
  "choices",
  "dropdown",
  "multiselect",
  "checkboxes",
  "radio",
  "select",
  "ranking",
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

interface DraggableFieldProps {
  field: Field;
  index: number;
  isSelected: boolean;
  styling?: FormStyling;
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
      className={`group relative rounded-2xl border bg-white p-4 shadow-sm transition-all ${
        isSelected
          ? "border-blue-500 ring-2 ring-blue-500/10"
          : "border-gray-100 hover:border-blue-300 hover:shadow-md"
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
        <FieldEditor field={field} onUpdate={onUpdate} styling={styling} />
      </div>
    </div>
  );
}

function FieldEditor({
  field,
  onUpdate,
  styling,
}: {
  field: Field;
  onUpdate: (updates: Partial<Field>) => void;
  styling?: FormStyling;
}) {
  const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
  const hasOptions = useMemo(() => OPTION_FIELD_TYPES.has(field.type), [field.type]);
  const isDisplayOnly = useMemo(
    () => DISPLAY_ONLY_FIELD_TYPES.has(field.type),
    [field.type]
  );

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
    if (field.options && field.options.length > 0) return field.options;
    return ["Option 1", "Option 2"];
  }, [field.options, hasOptions]);

  useEffect(() => {
    resolvedOptions.forEach((option, idx) => {
      const ref = optionRefs.current.get(idx);
      if (!ref) return;
      const value =
        field.options && field.options[idx] !== undefined ? field.options[idx] : option;
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
    persistOptions(next, Math.max(index - 1, 0));
  };

  const handleOptionInsertAfter = (index?: number) => {
    const current =
      field.options && field.options.length > 0 ? [...field.options] : [...resolvedOptions];
    const insertAt = typeof index === "number" ? index + 1 : current.length;
    current.splice(insertAt, 0, `Option ${current.length + 1}`);
    persistOptions(current, insertAt);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
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
        {!isDisplayOnly && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ required: !field.required });
            }}
            className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              field.required
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOptionInsertAfter();
            }}
            className="w-full rounded-xl border border-dashed border-gray-300 py-2 text-sm font-medium text-gray-500 transition-colors hover:border-blue-300 hover:text-blue-600"
            type="button"
          >
            + Add option
          </button>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
        <FieldRenderer field={field} isPreview={false} styling={styling} />
      </div>
    </div>
  );
}
