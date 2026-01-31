"use client";

import { useState } from 'react';
import VoiceModeLazy from '@/components/voice/VoiceModeLazy';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { featureFlags } from '@/lib/featureFlags';

interface VoiceInputPanelProps {
  onGenerateForm: (transcript: string, language?: string) => Promise<void>;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function VoiceInputPanel({
  onGenerateForm,
  isExpanded,
  onToggle,
}: VoiceInputPanelProps) {
  const [transcript, setTranscript] = useState('');

  // Check if voice input feature is enabled
  const isFeatureEnabled = featureFlags.voiceInput.isEnabled();

  // Keyboard shortcut: Ctrl+Shift+V to toggle voice input
  useKeyboardShortcut(
    { key: 'v', ctrl: true, shift: true },
    onToggle,
    isFeatureEnabled
  );

  const handleTranscriptComplete = (newTranscript: string) => {
    setTranscript(newTranscript);
  };

  const handleGenerateForm = async (transcriptToGenerate: string) => {
    await onGenerateForm(transcriptToGenerate);
  };

  // If feature is disabled, don't render anything
  if (!isFeatureEnabled) {
    return null;
  }

  return (
    <div className="mb-8">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onToggle}
          className="flex-1 flex items-center justify-between group focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 rounded-lg p-2 -m-2"
          title="Use voice input to describe your form (Ctrl+Shift+V)"
          aria-label={isExpanded ? "Collapse voice mode panel" : "Expand voice mode panel"}
          aria-expanded={isExpanded}
          aria-controls="voice-input-content"
        >
          <div className="flex items-center gap-2">
            <MicrophoneIcon />
            <h2 className="text-lg font-bold text-black font-paper">Voice Mode</h2>
            {transcript && !isExpanded && (
              <span className="text-xs px-2 py-0.5 border-2 border-black/20 bg-black/5 text-black rounded-full font-paper font-bold" aria-label="Transcript is ready">
                Ready
              </span>
            )}
          </div>
          <span className="text-black/40 font-bold" aria-hidden="true">
            {isExpanded ? "−" : "+"}
          </span>
        </button>
      </div>

      {/* Collapsible Panel */}
      {isExpanded && (
        <div id="voice-input-content" className="animate-slide-in" role="region" aria-label="Voice mode controls">
          <VoiceModeLazy
            onTranscriptComplete={handleTranscriptComplete}
            onGenerateForm={handleGenerateForm}
          />
        </div>
      )}
    </div>
  );
}

function MicrophoneIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="text-black"
    >
      <path
        d="M8 1C7.20435 1 6.44129 1.31607 5.87868 1.87868C5.31607 2.44129 5 3.20435 5 4V8C5 8.79565 5.31607 9.55871 5.87868 10.1213C6.44129 10.6839 7.20435 11 8 11C8.79565 11 9.55871 10.6839 10.1213 10.1213C10.6839 9.55871 11 8.79565 11 8V4C11 3.20435 10.6839 2.44129 10.1213 1.87868C9.55871 1.31607 8.79565 1 8 1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 8C3 9.32608 3.52678 10.5979 4.46447 11.5355C5.40215 12.4732 6.67392 13 8 13C9.32608 13 10.5979 12.4732 11.5355 11.5355C12.4732 10.5979 13 9.32608 13 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 13V15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 15H10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
