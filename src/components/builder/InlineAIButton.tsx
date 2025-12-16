"use client";

import { useState, useRef, useEffect } from "react";
import { useInlineAI, InlineAIAction, InlineAIContext, getActionDisplayName, getActionIcon } from "@/hooks/useInlineAI";

interface InlineAIButtonProps {
  actions: InlineAIAction[];
  context: InlineAIContext;
  onResult: (action: InlineAIAction, data: Record<string, unknown>) => void;
  onError?: (error: string) => void;
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
}

export default function InlineAIButton({
  actions,
  context,
  onResult,
  onError,
  size = "sm",
  className = "",
  disabled = false,
}: InlineAIButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<InlineAIAction | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { loading, error, execute } = useInlineAI();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Report errors
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleAction = async (action: InlineAIAction) => {
    setActiveAction(action);
    const result = await execute(action, context);
    if (result?.success) {
      onResult(action, result.data);
    }
    setActiveAction(null);
    setIsOpen(false);
  };

  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
  };

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        disabled={disabled || loading}
        className={`
          flex items-center justify-center rounded-md
          ${sizeClasses[size]}
          ${loading ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600"}
          transition-all duration-200 border border-gray-200 hover:border-blue-300
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${className}
        `}
        title="AI Assistant"
      >
        {loading ? (
          <svg className={`${iconSizes[size]} animate-spin`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg className={iconSizes[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )}
      </button>

      {isOpen && !loading && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-56 rounded-xl bg-white shadow-xl ring-1 ring-black/5 overflow-hidden"
          style={{
            right: 0,
            maxHeight: "320px",
            overflowY: "auto",
          }}
        >
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-sm font-semibold text-gray-800">AI Assistant</span>
            </div>
          </div>
          <div className="py-1">
            {actions.map((action) => (
              <button
                key={action}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(action);
                }}
                disabled={activeAction === action}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 text-left text-sm
                  ${activeAction === action ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}
                  transition-colors
                `}
              >
                <svg className="h-4 w-4 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getActionIcon(action)} />
                </svg>
                <span className="flex-1">{getActionDisplayName(action)}</span>
                {activeAction === action && (
                  <svg className="h-4 w-4 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Simpler single-action button variant
interface SingleAIButtonProps {
  action: InlineAIAction;
  context: InlineAIContext;
  onResult: (data: Record<string, unknown>) => void;
  onError?: (error: string) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function SingleAIButton({
  action,
  context,
  onResult,
  onError,
  label,
  className = "",
  disabled = false,
}: SingleAIButtonProps) {
  const { loading, error, execute } = useInlineAI();

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleClick = async () => {
    const result = await execute(action, context);
    if (result?.success) {
      onResult(result.data);
    }
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        handleClick();
      }}
      disabled={disabled || loading}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md
        bg-gray-100 text-gray-700 border border-gray-200
        hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {loading ? (
        <svg className="h-3.5 w-3.5 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )}
      {label || getActionDisplayName(action)}
    </button>
  );
}
