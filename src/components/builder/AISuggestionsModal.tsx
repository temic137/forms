"use client";

import { useState, useEffect } from "react";
import { InlineAIAction, getActionDisplayName } from "@/hooks/useInlineAI";

interface Suggestion {
  text: string;
  reason?: string;
}

interface AISuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: InlineAIAction;
  suggestions: Suggestion[];
  onSelect: (text: string) => void;
  title?: string;
}

export default function AISuggestionsModal({
  isOpen,
  onClose,
  action,
  suggestions,
  onSelect,
  title,
}: AISuggestionsModalProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">{title || getActionDisplayName(action)}</h3>
                <p className="text-xs text-gray-300">Click to select a suggestion</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <svg className="h-5 w-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Suggestions */}
        <div className="p-4 max-h-80 overflow-y-auto">
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedIndex(index);
                  onSelect(suggestion.text);
                  onClose();
                }}
                className={`
                  w-full text-left p-4 rounded-xl border-2 transition-all duration-200
                  ${selectedIndex === index
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-100 hover:border-blue-200 hover:bg-blue-50/50"
                  }
                `}
              >
                <p className="text-sm font-medium text-gray-900">{suggestion.text}</p>
                {suggestion.reason && (
                  <p className="mt-1 text-xs text-gray-500">{suggestion.reason}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Compact inline suggestions (for showing below an input)
interface InlineSuggestionsProps {
  suggestions: Suggestion[];
  onSelect: (text: string) => void;
  onClose: () => void;
  maxShow?: number;
}

export function InlineSuggestions({
  suggestions,
  onSelect,
  onClose,
  maxShow = 3,
}: InlineSuggestionsProps) {
  const displaySuggestions = suggestions.slice(0, maxShow);

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="text-xs font-semibold text-gray-700">AI Suggestions</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-200 transition-colors"
        >
          <svg className="h-3.5 w-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="space-y-1.5">
        {displaySuggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect(suggestion.text)}
            className="w-full text-left px-3 py-2 bg-white rounded-lg text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors shadow-sm border border-gray-100"
          >
            {suggestion.text}
          </button>
        ))}
      </div>
    </div>
  );
}
