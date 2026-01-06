"use client";

import { useState } from "react";
import { Field, FieldType, QuizConfig, ValidationRule } from "@/types/form";
import { SingleAIButton } from "./InlineAIButton";
import { InlineSuggestions } from "./AISuggestionsModal";

interface FieldPropertiesPanelProps {
  field: Field | null;
  onUpdate: (updates: Partial<Field>) => void;
  onClose: () => void;
  quizModeEnabled?: boolean;
}

export default function FieldPropertiesPanel({ field, onUpdate, onClose, quizModeEnabled = false }: FieldPropertiesPanelProps) {
  // AI suggestion states
  const [placeholderSuggestions, setPlaceholderSuggestions] = useState<{ text: string; reason?: string }[]>([]);
  const [helpTextSuggestions, setHelpTextSuggestions] = useState<{ text: string; reason?: string }[]>([]);
  const [validationSuggestions, setValidationSuggestions] = useState<ValidationRule[]>([]);
  const [showPlaceholderSuggestions, setShowPlaceholderSuggestions] = useState(false);
  const [showHelpTextSuggestions, setShowHelpTextSuggestions] = useState(false);
  const [showValidationSuggestions, setShowValidationSuggestions] = useState(false);

  if (!field) {
    return (
      <div className="w-80 h-full border-l border-gray-200 bg-gray-50 p-6">
        <div className="text-center text-gray-500 mt-8">
          <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <p className="mt-4">Select a field to edit its properties</p>
        </div>
      </div>
    );
  }

  const hasOptions = [
    "multiple-choice", "choices", "dropdown", "multiselect", "checkboxes", "radio", "select", "ranking"
  ].includes(field.type);

  const isDisplayOnly = [
    "display-text", "h1", "heading", "paragraph", "banner", "divider", "image", "video"
  ].includes(field.type);

  // Field types that support quiz answers
  const supportsQuizAnswer = !isDisplayOnly && ![
    "file", "file-uploader", "signature", "voice-recording", "captcha", "image", "video"
  ].includes(field.type);

  const updateQuizConfig = (updates: Partial<QuizConfig>) => {
    onUpdate({
      quizConfig: {
        ...field.quizConfig,
        ...updates,
      },
    });
  };

  // AI context for this field
  const getAIContext = () => ({
    fieldLabel: field.label,
    fieldType: field.type,
    currentValue: field.placeholder,
    options: field.options,
  });

  // Handler for AI placeholder suggestions
  const handlePlaceholderAIResult = (data: Record<string, unknown>) => {
    const suggestions = [];
    if (data.placeholder) {
      suggestions.push({ text: data.placeholder as string, reason: "Primary suggestion" });
    }
    if (data.alternative) {
      suggestions.push({ text: data.alternative as string, reason: "Alternative" });
    }
    if (suggestions.length > 0) {
      setPlaceholderSuggestions(suggestions);
      setShowPlaceholderSuggestions(true);
    }
  };

  // Handler for AI help text suggestions
  const handleHelpTextAIResult = (data: Record<string, unknown>) => {
    const suggestions = [];
    if (data.helpText) {
      suggestions.push({ text: data.helpText as string, reason: "Primary suggestion" });
    }
    if (data.alternative) {
      suggestions.push({ text: data.alternative as string, reason: "Alternative" });
    }
    if (suggestions.length > 0) {
      setHelpTextSuggestions(suggestions);
      setShowHelpTextSuggestions(true);
    }
  };

  // Handler for AI validation suggestions
  const handleValidationAIResult = (data: Record<string, unknown>) => {
    if (data.suggestions) {
      const suggestions = data.suggestions as Array<{
        type: string;
        value: string | number;
        message: string;
      }>;
      setValidationSuggestions(suggestions.map(s => ({
        type: s.type as ValidationRule["type"],
        value: s.value,
        message: s.message,
      })));
      setShowValidationSuggestions(true);
    }
    if (data.shouldBeRequired !== undefined) {
      // Optionally auto-apply required status
    }
  };

  return (
    <div className="w-80 h-full overflow-y-auto border-l border-gray-200 bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-gray-50 border-b border-gray-200 p-4 z-10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900">Field Properties</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            title="Close"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded inline-block">
          {field.type}
        </div>
      </div>

      {/* Properties Form */}
      <div className="p-4 space-y-6">
        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Label
          </label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Field label"
          />
        </div>

        {/* Placeholder (for input fields) */}
        {!isDisplayOnly && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Placeholder
              </label>
              {field.label && (
                <SingleAIButton
                  action="suggest-placeholder"
                  context={getAIContext()}
                  onResult={handlePlaceholderAIResult}
                  label="✨ Suggest"
                  className="text-[10px] py-1 px-2"
                />
              )}
            </div>
            <input
              type="text"
              value={field.placeholder || ""}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Placeholder text"
            />
            {showPlaceholderSuggestions && placeholderSuggestions.length > 0 && (
              <InlineSuggestions
                suggestions={placeholderSuggestions}
                onSelect={(text) => {
                  onUpdate({ placeholder: text });
                  setShowPlaceholderSuggestions(false);
                  setPlaceholderSuggestions([]);
                }}
                onClose={() => {
                  setShowPlaceholderSuggestions(false);
                  setPlaceholderSuggestions([]);
                }}
              />
            )}
          </div>
        )}

        {/* Help Text */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Help Text
            </label>
            {field.label && (
              <SingleAIButton
                action="suggest-help-text"
                context={getAIContext()}
                onResult={handleHelpTextAIResult}
                label="✨ Suggest"
                className="text-[10px] py-1 px-2"
              />
            )}
          </div>
          <textarea
            value={field.helpText || ""}
            onChange={(e) => onUpdate({ helpText: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Additional instructions"
          />
          {showHelpTextSuggestions && helpTextSuggestions.length > 0 && (
            <InlineSuggestions
              suggestions={helpTextSuggestions}
              onSelect={(text) => {
                onUpdate({ helpText: text });
                setShowHelpTextSuggestions(false);
                setHelpTextSuggestions([]);
              }}
              onClose={() => {
                setShowHelpTextSuggestions(false);
                setHelpTextSuggestions([]);
              }}
            />
          )}
        </div>

        {/* AI Validation Suggestions */}
        {!isDisplayOnly && field.label && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Validation
              </label>
              <SingleAIButton
                action="suggest-validation"
                context={getAIContext()}
                onResult={handleValidationAIResult}
                label="✨ Suggest Rules"
                className="text-[10px] py-1 px-2"
              />
            </div>
            {showValidationSuggestions && validationSuggestions.length > 0 && (
              <div className="space-y-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 mb-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Suggested Validations
                </div>
                {validationSuggestions.map((rule, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      const currentRules = field.validation || [];
                      onUpdate({ validation: [...currentRules, rule] });
                    }}
                    className="w-full text-left p-2 bg-white rounded-lg text-xs hover:bg-purple-100 transition-colors shadow-sm"
                  >
                    <div className="font-medium text-gray-800">
                      {rule.type}: {rule.value}
                    </div>
                    <div className="text-gray-500 mt-0.5">{rule.message}</div>
                  </button>
                ))}
                <button
                  onClick={() => {
                    setShowValidationSuggestions(false);
                    setValidationSuggestions([]);
                  }}
                  className="text-xs text-purple-600 hover:text-purple-800"
                >
                  Dismiss
                </button>
              </div>
            )}
            {/* Show existing validation rules */}
            {field.validation && field.validation.length > 0 && (
              <div className="space-y-2 mt-2">
                {field.validation.map((rule, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded-lg text-xs">
                    <span className="text-gray-700">
                      {rule.type}: {rule.value}
                    </span>
                    <button
                      onClick={() => {
                        const newRules = field.validation?.filter((_, i) => i !== index);
                        onUpdate({ validation: newRules });
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* File Upload Settings */}
        {(field.type === "file" || field.type === "file-uploader") && (
          <div className="space-y-4">
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                File Upload Settings
              </h4>
              
              {/* Accepted File Types */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accepted File Types
                </label>
                <select
                  value={field.fileConfig?.acceptedTypes || "all"}
                  onChange={(e) => onUpdate({ 
                    fileConfig: { 
                      ...field.fileConfig,
                      acceptedTypes: e.target.value as "images" | "documents" | "all" | "pdf" | "pdf_image",
                      maxSizeMB: field.fileConfig?.maxSizeMB || 10,
                      multiple: field.fileConfig?.multiple || false
                    } 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Files</option>
                  <option value="images">Images Only (JPG, PNG, GIF, WebP)</option>
                  <option value="documents">Documents Only (PDF, Word, Excel)</option>
                  <option value="pdf">PDF Only</option>
                  <option value="pdf_image">PDF & Images</option>
                </select>
              </div>
              
              {/* Max File Size */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum File Size (MB)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={field.fileConfig?.maxSizeMB || 10}
                  onChange={(e) => onUpdate({ 
                    fileConfig: { 
                      ...field.fileConfig,
                      acceptedTypes: field.fileConfig?.acceptedTypes || "all",
                      maxSizeMB: Math.min(10, Math.max(1, parseInt(e.target.value) || 10)),
                      multiple: field.fileConfig?.multiple || false
                    } 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum allowed: 10MB</p>
              </div>
              
              {/* Allow Multiple Files */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.fileConfig?.multiple || false}
                  onChange={(e) => onUpdate({ 
                    fileConfig: { 
                      ...field.fileConfig,
                      acceptedTypes: field.fileConfig?.acceptedTypes || "all",
                      maxSizeMB: field.fileConfig?.maxSizeMB || 10,
                      multiple: e.target.checked
                    } 
                  })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-700">Allow Multiple Files</div>
                  <div className="text-xs text-gray-500">Users can upload more than one file</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Required Toggle */}
        {!isDisplayOnly && (
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => onUpdate({ required: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-medium text-gray-700">Required Field</div>
                <div className="text-xs text-gray-500">Users must fill this field</div>
              </div>
            </label>
          </div>
        )}

        {/* Options (for choice fields) */}
        {hasOptions && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Options
            </label>
            <div className="space-y-2">
              {(field.options || []).map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(field.options || [])];
                      newOptions[index] = e.target.value;
                      onUpdate({ options: newOptions });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Option ${index + 1}`}
                  />
                  <button
                    onClick={() => {
                      const newOptions = (field.options || []).filter((_, i) => i !== index);
                      onUpdate({ options: newOptions });
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove option"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newOptions = [...(field.options || []), `Option ${(field.options || []).length + 1}`];
                  onUpdate({ options: newOptions });
                }}
                className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                + Add Option
              </button>
            </div>

            {/* Allow Other Option */}
            <div className="mt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.allowOther || false}
                  onChange={(e) => onUpdate({ allowOther: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-700">Allow &quot;Other&quot; Option</div>
                  <div className="text-xs text-gray-500">Adds an &quot;Other&quot; option with a text field for custom answers</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Choice Matrix Specific */}
        {field.type === "choice-matrix" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rows
            </label>
            <div className="space-y-2 mb-4">
              {(field.matrixRows || []).map((row, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={row}
                    onChange={(e) => {
                      const newRows = [...(field.matrixRows || [])];
                      newRows[index] = e.target.value;
                      onUpdate({ matrixRows: newRows });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Row ${index + 1}`}
                  />
                  <button
                    onClick={() => {
                      const newRows = (field.matrixRows || []).filter((_, i) => i !== index);
                      onUpdate({ matrixRows: newRows });
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove row"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newRows = [...(field.matrixRows || []), `Row ${(field.matrixRows || []).length + 1}`];
                  onUpdate({ matrixRows: newRows });
                }}
                className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                + Add Row
              </button>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Columns
            </label>
            <div className="space-y-2 mb-4">
              {(field.options || []).map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(field.options || [])];
                      newOptions[index] = e.target.value;
                      onUpdate({ options: newOptions });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Column ${index + 1}`}
                  />
                  <button
                    onClick={() => {
                      const newOptions = (field.options || []).filter((_, i) => i !== index);
                      onUpdate({ options: newOptions });
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove column"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newOptions = [...(field.options || []), `Column ${(field.options || []).length + 1}`];
                  onUpdate({ options: newOptions });
                }}
                className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                + Add Column
              </button>
            </div>

            <div className="mt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.allowMultipleSelection || false}
                  onChange={(e) => onUpdate({ allowMultipleSelection: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-700">Allow Multiple Selection</div>
                  <div className="text-xs text-gray-500">Users can select multiple options per row (Checkbox Grid)</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Validation Section */}
        {!isDisplayOnly && (
          <div className="pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Validation</h4>
            
            {/* Min Length (for text fields) */}
            {["short-answer", "long-answer", "text", "textarea"].includes(field.type) && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Min Length</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="No minimum"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Max Length</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="No maximum"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Min/Max Value (for number fields) */}
            {["number", "currency", "slider"].includes(field.type) && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Min Value</label>
                  <input
                    type="number"
                    placeholder="No minimum"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Max Value</label>
                  <input
                    type="number"
                    placeholder="No maximum"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Styling Section */}
        <div className="pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Styling</h4>
          
          <div>
            <label className="block text-sm text-gray-700 mb-2">Background Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={field.color || "#ffffff"}
                onChange={(e) => onUpdate({ color: e.target.value })}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={field.color || "#ffffff"}
                onChange={(e) => onUpdate({ color: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="#ffffff"
              />
            </div>
          </div>
        </div>

        {/* Quiz Configuration Section */}
        {quizModeEnabled && supportsQuizAnswer && (
          <div className="pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="text-sm font-semibold text-gray-900">Quiz Settings</h4>
            </div>
            
            {/* Points */}
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-2">Points</label>
              <input
                type="number"
                min="0"
                step="1"
                value={field.quizConfig?.points || 1}
                onChange={(e) => updateQuizConfig({ points: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="1"
              />
              <p className="text-xs text-gray-500 mt-1">Points awarded for correct answer</p>
            </div>

            {/* Correct Answer - Text Fields */}
            {["short-answer", "long-answer", "text", "textarea", "email", "url", "tel"].includes(field.type) && (
              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-2">Correct Answer</label>
                <div className="flex gap-2 mb-2">
                  <select
                    value={field.quizConfig?.matchType || "exact"}
                    onChange={(e) => updateQuizConfig({ matchType: e.target.value as "exact" | "contains" })}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  >
                    <option value="exact">Exact Match</option>
                    <option value="contains">Contains</option>
                  </select>
                  <input
                    type="text"
                    value={(field.quizConfig?.correctAnswer as string) || ""}
                    onChange={(e) => updateQuizConfig({ correctAnswer: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={field.quizConfig?.matchType === "contains" ? "Required text" : "Exact answer"}
                  />
                </div>
                <label className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={field.quizConfig?.caseSensitive || false}
                    onChange={(e) => updateQuizConfig({ caseSensitive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  Case sensitive
                </label>
              </div>
            )}

            {/* Correct Answer - Number Fields */}
            {["number", "currency"].includes(field.type) && (
              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-2">Correct Answer</label>
                <input
                  type="number"
                  value={(field.quizConfig?.correctAnswer as number) || ""}
                  onChange={(e) => updateQuizConfig({ correctAnswer: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter correct number"
                />
              </div>
            )}

            {/* Correct Answer - Choice Fields (Single) */}
            {["multiple-choice", "choices", "radio", "dropdown", "select"].includes(field.type) && (
              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-2">Correct Answer</label>
                <select
                  value={(field.quizConfig?.correctAnswer as string) || ""}
                  onChange={(e) => updateQuizConfig({ correctAnswer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select correct option</option>
                  {(field.options || []).map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Correct Answer - Choice Fields (Multiple) */}
            {["checkboxes", "multiselect"].includes(field.type) && (
              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-2">Correct Answers</label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {(field.options || []).map((option, index) => {
                    const correctAnswers = (field.quizConfig?.correctAnswer as string[]) || [];
                    const isChecked = correctAnswers.includes(option);
                    
                    return (
                      <label key={index} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const current = correctAnswers.filter(a => a !== option);
                            const updated = e.target.checked ? [...current, option] : current;
                            updateQuizConfig({ correctAnswer: updated });
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        {option}
                      </label>
                    );
                  })}
                </div>
                <label className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={field.quizConfig?.acceptPartialCredit || false}
                    onChange={(e) => updateQuizConfig({ acceptPartialCredit: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  Accept partial credit
                </label>
              </div>
            )}

            {/* Correct Answer - Date Fields */}
            {["date", "date-picker"].includes(field.type) && (
              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-2">Correct Date</label>
                <input
                  type="date"
                  value={(field.quizConfig?.correctAnswer as string) || ""}
                  onChange={(e) => updateQuizConfig({ correctAnswer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Explanation */}
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-2">Explanation (Optional)</label>
              <textarea
                value={field.quizConfig?.explanation || ""}
                onChange={(e) => updateQuizConfig({ explanation: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Explain why this is the correct answer"
              />
              <p className="text-xs text-gray-500 mt-1">Shown to users after submission</p>
            </div>
          </div>
        )}

        {/* Advanced Section */}
        <div className="pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Advanced</h4>
          
          <div>
            <label className="block text-sm text-gray-700 mb-2">Field ID</label>
            <input
              type="text"
              value={field.id}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Use this ID for conditional logic</p>
          </div>
        </div>
      </div>
    </div>
  );
}

