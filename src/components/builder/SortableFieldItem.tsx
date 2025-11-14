"use client";

import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Field } from "@/types/form";
import ConditionalLogicEditor from "./ConditionalLogicEditor";
import ValidationEditor from "./ValidationEditor";

interface SortableFieldItemProps {
  field: Field;
  index: number;
  fields: Field[];
  generatingOptions: number | null;
  onUpdate: (index: number, patch: Partial<Field>) => void;
  onRemove: (index: number) => void;
  onDuplicate: (index: number) => void;
  onGenerateOptions?: (index: number) => void;
  onAddOption: (index: number) => void;
  onUpdateOption: (fieldIndex: number, optionIndex: number, value: string) => void;
  onRemoveOption: (fieldIndex: number, optionIndex: number) => void;
  isSelected?: boolean;
  onToggleSelection?: (fieldId: string) => void;
}

function SortableFieldItem({
  field,
  index,
  fields,
  onUpdate,
  onRemove,
  onDuplicate,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
  isSelected = false,
  onToggleSelection,
}: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 bg-black border border-[#1a1a1a] rounded-lg space-y-4"
    >
      <div className="flex items-start gap-3">
        {/* Field selection checkbox */}
        {onToggleSelection && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelection(field.id)}
            className="mt-3 w-4 h-4 border-[#1a1a1a] bg-black text-white focus:ring-0 focus:ring-offset-0 rounded cursor-pointer"
            aria-label={`Select ${field.label || "field"}`}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-2 cursor-grab active:cursor-grabbing text-neutral-500 hover:text-neutral-300"
          aria-label="Drag to reorder"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 3.5C6 4.05228 5.55228 4.5 5 4.5C4.44772 4.5 4 4.05228 4 3.5C4 2.94772 4.44772 2.5 5 2.5C5.55228 2.5 6 2.94772 6 3.5Z"
              fill="currentColor"
            />
            <path
              d="M12 3.5C12 4.05228 11.5523 4.5 11 4.5C10.4477 4.5 10 4.05228 10 3.5C10 2.94772 10.4477 2.5 11 2.5C11.5523 2.5 12 2.94772 12 3.5Z"
              fill="currentColor"
            />
            <path
              d="M6 8C6 8.55228 5.55228 9 5 9C4.44772 9 4 8.55228 4 8C4 7.44772 4.44772 7 5 7C5.55228 7 6 7.44772 6 8Z"
              fill="currentColor"
            />
            <path
              d="M12 8C12 8.55228 11.5523 9 11 9C10.4477 9 10 8.55228 10 8C10 7.44772 10.4477 7 11 7C11.5523 7 12 7.44772 12 8Z"
              fill="currentColor"
            />
            <path
              d="M6 12.5C6 13.0523 5.55228 13.5 5 13.5C4.44772 13.5 4 13.0523 4 12.5C4 11.9477 4.44772 11.5 5 11.5C5.55228 11.5 6 11.9477 6 12.5Z"
              fill="currentColor"
            />
            <path
              d="M12 12.5C12 13.0523 11.5523 13.5 11 13.5C10.4477 13.5 10 13.0523 10 12.5C10 11.9477 10.4477 11.5 11 11.5C11.5523 11.5 12 11.9477 12 12.5Z"
              fill="currentColor"
            />
          </svg>
        </button>
        <div className="flex-1 space-y-4">
          <input
            className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg focus:outline-none focus:border-neutral-700 text-white placeholder:text-neutral-600"
            placeholder="Label"
            value={field.label}
            onChange={(e) => onUpdate(index, { label: e.target.value })}
          />

          <input
            className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg focus:outline-none focus:border-neutral-700 text-white placeholder:text-neutral-600 text-sm"
            placeholder="Placeholder text (optional)"
            value={field.placeholder || ""}
            onChange={(e) => onUpdate(index, { placeholder: e.target.value })}
          />

          <div className="flex items-center gap-4">
            <select
              value={field.type || "text"}
              onChange={(e) =>
                onUpdate(index, { type: e.target.value as Field["type"] })
              }
              className="px-3 py-1.5 text-sm border border-[#1a1a1a] rounded-lg focus:outline-none focus:border-neutral-700 bg-[#0a0a0a] text-white"
            >
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="textarea">Textarea</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="select">Select</option>
              <option value="radio">Radio</option>
            </select>

            <label className="flex items-center gap-2 text-neutral-400 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={!!field.required}
                onChange={(e) => onUpdate(index, { required: e.target.checked })}
                className="w-4 h-4 border-[#1a1a1a] bg-[#0a0a0a] text-white focus:ring-0 focus:ring-offset-0 rounded"
              />
              Required
            </label>

            <button
              onClick={() => onDuplicate(index)}
              className="ml-auto px-3 py-1.5 bg-[#1a1a1a] text-neutral-400 text-xs font-medium rounded hover:text-white hover:bg-[#252525] transition-colors"
              title="Duplicate field"
            >
              Duplicate
            </button>

            <button
              onClick={() => onRemove(index)}
              className="px-3 py-1.5 bg-[#1a1a1a] text-neutral-400 text-xs font-medium rounded hover:text-white hover:bg-[#252525] transition-colors"
            >
              Remove
            </button>
          </div>

          <textarea
            className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg focus:outline-none focus:border-neutral-700 text-white placeholder:text-neutral-600 text-sm resize-none"
            placeholder="Help text (optional)"
            rows={2}
            value={field.helpText || ""}
            onChange={(e) => onUpdate(index, { helpText: e.target.value })}
          />

          {/* Auto-Complete Configuration */}
          {(field.type === "select" || field.type === "radio") && (
            <div className="pl-4 space-y-3 border-l-2 border-[#1a1a1a]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500 font-medium">Options</span>
                <button
                  onClick={() => onAddOption(index)}
                  className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  + Add
                </button>
              </div>

              {(!field.options || field.options.length === 0) ? (
                <p className="text-xs text-neutral-600 italic">No options yet</p>
              ) : (
                <div className="space-y-2">
                  {field.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        className="flex-1 px-2 py-1 text-sm border border-[#1a1a1a] rounded-lg focus:outline-none focus:border-neutral-700 bg-[#0a0a0a] text-white"
                        placeholder={`Option ${oi + 1}`}
                        value={opt}
                        onChange={(e) => onUpdateOption(index, oi, e.target.value)}
                      />
                      <button
                        onClick={() => onRemoveOption(index, oi)}
                        className="text-neutral-500 hover:text-neutral-300 transition-colors text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <ValidationEditor
            rules={field.validation || []}
            onChange={(rules) => onUpdate(index, { validation: rules })}
            fieldLabel={field.label}
            fieldType={field.type}
          />

          <ConditionalLogicEditor
            fieldId={field.id || `field_${index}`}
            fields={fields}
            rules={field.conditionalLogic || []}
            onChange={(rules) => onUpdate(index, { conditionalLogic: rules })}
          />
        </div>
      </div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(SortableFieldItem);
