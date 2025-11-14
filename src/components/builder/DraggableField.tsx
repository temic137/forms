"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Field, FormStyling } from "@/types/form";
import FieldRenderer from "./FieldRenderer";

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
      className={`
        relative group bg-white rounded-xl border transition-all duration-200 cursor-pointer
        ${isSelected 
          ? 'border-blue-500 shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/20' 
          : 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
        }
        ${isDragging ? 'shadow-xl opacity-90 scale-105' : ''}
      `}
      onClick={onSelect}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <div className="flex items-center gap-3 flex-1">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-move text-gray-400 hover:text-gray-600 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
            </svg>
          </div>
          
          {/* Field Type Badge */}
          <div className="px-2.5 py-1 rounded-md text-xs font-medium bg-white border border-gray-200 text-gray-700">
            {field.type}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-1.5 rounded-md bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all text-gray-600"
            title="Duplicate field"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-md bg-white border border-gray-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all text-gray-600"
            title="Delete field"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Field Preview Content */}
      <div 
        className="px-5 py-4 rounded-b-xl"
        style={{ 
          backgroundColor: styling?.backgroundColor || '#ffffff',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget || (e.target as HTMLElement).closest('input, textarea, select, button')) {
            // Allow clicking through to inputs/buttons
            return;
          }
          onSelect();
        }}
      >
        {isSelected ? (
          <FieldEditor field={field} onUpdate={onUpdate} styling={styling} />
        ) : (
          <FieldRenderer field={field} isPreview={false} styling={styling} />
        )}
      </div>
    </div>
  );
}

function FieldEditor({ 
  field, 
  onUpdate, 
  styling 
}: { 
  field: Field; 
  onUpdate: (updates: Partial<Field>) => void;
  styling?: FormStyling;
}) {
  const hasOptions = [
    "multiple-choice", "choices", "dropdown", "multiselect", "checkboxes", "radio", "select", "ranking"
  ].includes(field.type);

  const isDisplayOnly = [
    "display-text", "h1", "heading", "paragraph", "banner", "divider", "image", "video"
  ].includes(field.type);

  return (
    <div className="space-y-4">
      {/* Label */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Label {!isDisplayOnly && field.required && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          value={field.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Field label"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Placeholder */}
      {!isDisplayOnly && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Placeholder
          </label>
          <input
            type="text"
            value={field.placeholder || ""}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Placeholder text"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Help Text */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Help Text
        </label>
        <textarea
          value={field.helpText || ""}
          onChange={(e) => onUpdate({ helpText: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Additional instructions"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Required Toggle */}
      {!isDisplayOnly && (
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
            <span className="text-sm text-gray-700">Required Field</span>
          </label>
        </div>
      )}

      {/* Options Editor */}
      {hasOptions && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-gray-700">
              Options
            </label>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const newOptions = [...(field.options || []), `Option ${(field.options || []).length + 1}`];
                onUpdate({ options: newOptions });
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add
            </button>
          </div>
          <div className="space-y-2">
            {(field.options || ["Option 1", "Option 2", "Option 3"]).map((option, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...(field.options || [])];
                    newOptions[idx] = e.target.value;
                    onUpdate({ options: newOptions });
                  }}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Option ${idx + 1}`}
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newOptions = (field.options || []).filter((_, i) => i !== idx);
                    onUpdate({ options: newOptions.length > 0 ? newOptions : undefined });
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove option"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      <div className="pt-3 border-t border-gray-200">
        <p className="text-xs font-medium text-gray-700 mb-2">Preview</p>
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <FieldRenderer field={field} isPreview={false} styling={styling} />
        </div>
      </div>
    </div>
  );
}

