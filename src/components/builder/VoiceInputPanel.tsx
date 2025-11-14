"use client";

import { useState } from 'react';
import VoiceInputLazy from '@/components/VoiceInputLazy';
import VoiceSettingsToggle from '@/components/VoiceSettingsToggle';
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
  const [showSettings, setShowSettings] = useState(false);

  // Check if voice input feature is enabled (Requirement 9.5, 10.5)
  const isFeatureEnabled = featureFlags.voiceInput.isEnabled();

  // Keyboard shortcut: Ctrl+Shift+V to toggle voice input (Requirement 8.1)
  // Only enable if feature is enabled
  useKeyboardShortcut(
    { key: 'v', ctrl: true, shift: true },
    onToggle,
    isFeatureEnabled
  );

  const handleTranscriptComplete = (newTranscript: string) => {
    setTranscript(newTranscript);
  };

  const handleGenerateForm = async (transcriptToGenerate: string, language?: string) => {
    await onGenerateForm(transcriptToGenerate, language);
  };

  // If feature is disabled, don't render anything
  if (!isFeatureEnabled) {
    return null;
  }

  return (
    <div className="mb-8">
      {/* Header with Toggle and Settings */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onToggle}
          className="flex-1 flex items-center justify-between group focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 rounded-lg p-2 -m-2"
          title="Use voice input to describe your form (Ctrl+Shift+V)"
          aria-label={isExpanded ? "Collapse voice input panel" : "Expand voice input panel"}
          aria-expanded={isExpanded}
          aria-controls="voice-input-content"
        >
          <div className="flex items-center gap-2">
            <MicrophoneIcon />
            <h2 className="text-lg font-normal text-black">Voice Input</h2>
            {transcript && !isExpanded && (
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full" aria-label="Transcript is ready">
                Transcript ready
              </span>
            )}
          </div>
          <span className="text-neutral-400" aria-hidden="true">
            {isExpanded ? "−" : "+"}
          </span>
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="ml-2 p-2 text-neutral-500 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 rounded-lg"
          aria-label="Voice input settings"
          title="Voice input settings"
        >
          <SettingsIcon />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-4 animate-slide-in">
          <VoiceSettingsToggle
            onChange={(enabled) => {
              if (!enabled) {
                setShowSettings(false);
              }
            }}
          />
        </div>
      )}

      {/* Collapsible Panel - Lazy loaded for performance */}
      {isExpanded && (
        <div id="voice-input-content" className="animate-slide-in" role="region" aria-label="Voice input controls">
          <VoiceInputLazy
            onTranscriptComplete={handleTranscriptComplete}
            onGenerateForm={handleGenerateForm}
            initialTranscript={transcript}
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

function SettingsIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.1667 12.5C16.0557 12.7513 16.0226 13.0301 16.0717 13.3006C16.1209 13.5711 16.2501 13.8203 16.4417 14.0167L16.4917 14.0667C16.6461 14.221 16.7687 14.4046 16.8527 14.6067C16.9368 14.8089 16.9806 15.0257 16.9806 15.2446C16.9806 15.4635 16.9368 15.6803 16.8527 15.8824C16.7687 16.0846 16.6461 16.2682 16.4917 16.4225C16.3373 16.5769 16.1537 16.6995 15.9516 16.7835C15.7495 16.8676 15.5327 16.9114 15.3138 16.9114C15.0949 16.9114 14.8781 16.8676 14.6759 16.7835C14.4738 16.6995 14.2902 16.5769 14.1358 16.4225L14.0858 16.3725C13.8895 16.1809 13.6403 16.0517 13.3698 16.0025C13.0993 15.9534 12.8205 15.9865 12.5692 16.0975C12.3226 16.2032 12.1128 16.3784 11.9658 16.6019C11.8188 16.8254 11.7407 17.0877 11.7408 17.3558V17.5C11.7408 17.942 11.5653 18.3659 11.2527 18.6785C10.9402 18.9911 10.5163 19.1667 10.0742 19.1667C9.63214 19.1667 9.20825 18.9911 8.89569 18.6785C8.58313 18.3659 8.40754 17.942 8.40754 17.5V17.425C8.40154 17.1476 8.31373 16.8778 8.15448 16.6497C7.99523 16.4216 7.77149 16.2451 7.51087 16.1417C7.25959 16.0307 6.98078 15.9976 6.71028 16.0467C6.43978 16.0959 6.19061 16.2251 5.99421 16.4167L5.94421 16.4667C5.78982 16.621 5.60622 16.7437 5.40408 16.8277C5.20194 16.9117 4.98512 16.9556 4.76629 16.9556C4.54746 16.9556 4.33064 16.9117 4.1285 16.8277C3.92636 16.7437 3.74276 16.621 3.58837 16.4667C3.43399 16.3123 3.31138 16.1287 3.22733 15.9265C3.14328 15.7244 3.09943 15.5076 3.09943 15.2887C3.09943 15.0699 3.14328 14.8531 3.22733 14.6509C3.31138 14.4488 3.43399 14.2652 3.58837 14.1108L3.63837 14.0608C3.82998 13.8644 3.95916 13.6153 4.00831 13.3448C4.05746 13.0743 4.02434 12.7955 3.91337 12.5442C3.80768 12.2976 3.63247 12.0878 3.40897 11.9408C3.18547 11.7938 2.92318 11.7157 2.65504 11.7158H2.51087C2.06882 11.7158 1.64493 11.5402 1.33237 11.2277C1.01981 10.9151 0.844208 10.4912 0.844208 10.0492C0.844208 9.60711 1.01981 9.18322 1.33237 8.87066C1.64493 8.5581 2.06882 8.3825 2.51087 8.3825H2.58587C2.86327 8.3765 3.13306 8.28869 3.36116 8.12944C3.58926 7.97019 3.76577 7.74645 3.86921 7.48583C3.98018 7.23455 4.0133 6.95574 3.96415 6.68524C3.915 6.41474 3.78582 6.16557 3.59421 5.96917L3.54421 5.91917C3.38983 5.76478 3.26722 5.58118 3.18317 5.37904C3.09912 5.1769 3.05527 4.96008 3.05527 4.74125C3.05527 4.52242 3.09912 4.3056 3.18317 4.10346C3.26722 3.90132 3.38983 3.71772 3.54421 3.56333C3.6986 3.40895 3.8822 3.28634 4.08434 3.20229C4.28648 3.11824 4.5033 3.07439 4.72213 3.07439C4.94096 3.07439 5.15778 3.11824 5.35992 3.20229C5.56206 3.28634 5.74566 3.40895 5.90004 3.56333L5.95004 3.61333C6.14644 3.80494 6.39561 3.93412 6.66611 3.98327C6.93661 4.03242 7.21542 3.9993 7.46671 3.88833H7.51087C7.75747 3.78264 7.96726 3.60743 8.11426 3.38393C8.26126 3.16043 8.33936 2.89814 8.33921 2.63V2.48583C8.33921 2.04378 8.5148 1.61989 8.82736 1.30733C9.13992 0.994772 9.56381 0.819168 10.0059 0.819168C10.4479 0.819168 10.8718 0.994772 11.1844 1.30733C11.4969 1.61989 11.6725 2.04378 11.6725 2.48583V2.56083C11.6724 2.82897 11.7505 3.09126 11.8975 3.31476C12.0445 3.53826 12.2543 3.71347 12.5009 3.81917C12.7521 3.93014 13.031 3.96326 13.3015 3.91411C13.572 3.86496 13.8211 3.73578 14.0175 3.54417L14.0675 3.49417C14.2219 3.33979 14.4055 3.21718 14.6077 3.13313C14.8098 3.04908 15.0266 3.00523 15.2455 3.00523C15.4643 3.00523 15.6811 3.04908 15.8833 3.13313C16.0854 3.21718 16.269 3.33979 16.4234 3.49417C16.5778 3.64855 16.7004 3.83215 16.7844 4.03429C16.8685 4.23643 16.9123 4.45325 16.9123 4.67208C16.9123 4.89091 16.8685 5.10773 16.7844 5.30987C16.7004 5.51201 16.5778 5.69561 16.4234 5.85L16.3734 5.9C16.1818 6.0964 16.0526 6.34557 16.0035 6.61607C15.9543 6.88657 15.9874 7.16538 16.0984 7.41667V7.46083C16.2041 7.70743 16.3793 7.91722 16.6028 8.06422C16.8263 8.21122 17.0886 8.28932 17.3567 8.28917H17.5009C17.9429 8.28917 18.3668 8.46476 18.6794 8.77732C18.9919 9.08988 19.1675 9.51377 19.1675 9.95583C19.1675 10.3979 18.9919 10.8218 18.6794 11.1343C18.3668 11.4469 17.9429 11.6225 17.5009 11.6225H17.4259C17.1577 11.6226 16.8954 11.7007 16.6719 11.8477C16.4484 11.9947 16.2732 12.2045 16.1675 12.4508V12.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
