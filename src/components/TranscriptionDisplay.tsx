"use client";

import { memo } from 'react';

/**
 * Props for the TranscriptionDisplay component
 */
interface TranscriptionDisplayProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled: boolean;
  placeholder: string;
  isListening: boolean;
  interimText?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

/**
 * Optimized transcription display component with React.memo
 * Prevents unnecessary re-renders when props haven't changed
 * 
 * Requirement 12.2: Use React.memo for transcription display component
 */
const TranscriptionDisplay = memo(function TranscriptionDisplay({
  value,
  onChange,
  disabled,
  placeholder,
  isListening,
  interimText = '',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}: TranscriptionDisplayProps) {
  // Display full transcript (final + interim)
  const displayValue = value + (isListening && interimText ? ' ' + interimText : '');

  return (
    <div className="relative">
      <textarea
        id="voice-transcript"
        value={displayValue}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full min-h-[200px] px-4 py-3 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 focus:border-black resize-y disabled:bg-neutral-50 disabled:cursor-not-allowed"
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-live="off"
      />
      
      {/* Interim Results Indicator */}
      {isListening && interimText && (
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded" aria-hidden="true">
          Listening...
        </div>
      )}
    </div>
  );
});

TranscriptionDisplay.displayName = 'TranscriptionDisplay';

export default TranscriptionDisplay;
