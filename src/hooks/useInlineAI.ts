"use client";

import { useState, useCallback } from "react";

export type InlineAIAction =
  | "improve-question"
  | "rewrite-concise"
  | "rewrite-formal"
  | "rewrite-casual"
  | "fix-grammar"
  | "translate"
  | "generate-options"
  | "add-more-options"
  | "suggest-placeholder"
  | "suggest-help-text"
  | "suggest-validation"
  | "generate-distractors"
  | "explain-answer"
  | "suggest-follow-up"
  | "suggest-section-name"
  | "check-accessibility"
  | "suggest-conditional-logic";

export interface InlineAIContext {
  fieldLabel?: string;
  fieldType?: string;
  currentValue?: string;
  options?: string[];
  correctAnswer?: string | string[] | number | boolean;
  formTitle?: string;
  formContext?: string;
  targetLanguage?: string;
  otherFields?: { label: string; type: string }[];
}

export interface InlineAIResult {
  success: boolean;
  action: InlineAIAction;
  data: Record<string, unknown>;
}

interface UseInlineAIReturn {
  loading: boolean;
  error: string | null;
  execute: (action: InlineAIAction, context: InlineAIContext) => Promise<InlineAIResult | null>;
  reset: () => void;
}

export function useInlineAI(): UseInlineAIReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (action: InlineAIAction, context: InlineAIContext): Promise<InlineAIResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/inline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, context }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process AI request");
      }

      const result = await response.json();
      return result as InlineAIResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return { loading, error, execute, reset };
}

// Helper function to get action display names
export function getActionDisplayName(action: InlineAIAction): string {
  const names: Record<InlineAIAction, string> = {
    "improve-question": "Improve Question",
    "rewrite-concise": "Make Concise",
    "rewrite-formal": "Make Formal",
    "rewrite-casual": "Make Casual",
    "fix-grammar": "Fix Grammar",
    "translate": "Translate",
    "generate-options": "Generate Options",
    "add-more-options": "Add More Options",
    "suggest-placeholder": "Suggest Placeholder",
    "suggest-help-text": "Suggest Help Text",
    "suggest-validation": "Suggest Validation",
    "generate-distractors": "Generate Wrong Answers",
    "explain-answer": "Generate Explanation",
    "suggest-follow-up": "Suggest Follow-up",
    "suggest-section-name": "Suggest Section Name",
    "check-accessibility": "Check Accessibility",
    "suggest-conditional-logic": "Suggest Logic Rules",
  };
  return names[action] || action;
}

// Helper function to get action icons (as SVG paths)
export function getActionIcon(action: InlineAIAction): string {
  const icons: Record<InlineAIAction, string> = {
    "improve-question": "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    "rewrite-concise": "M4 6h16M4 12h8m-8 6h16",
    "rewrite-formal": "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    "rewrite-casual": "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    "fix-grammar": "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    "translate": "M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129",
    "generate-options": "M4 6h16M4 10h16M4 14h16M4 18h16",
    "add-more-options": "M12 6v6m0 0v6m0-6h6m-6 0H6",
    "suggest-placeholder": "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z",
    "suggest-help-text": "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    "suggest-validation": "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    "generate-distractors": "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
    "explain-answer": "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    "suggest-follow-up": "M13 5l7 7-7 7M5 5l7 7-7 7",
    "suggest-section-name": "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z",
    "check-accessibility": "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
    "suggest-conditional-logic": "M8 9l4-4 4 4m0 6l-4 4-4-4",
  };
  return icons[action] || "M13 10V3L4 14h7v7l9-11h-7z";
}
