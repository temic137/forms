"use client";

import { useState } from 'react';
import { voiceSettings } from '@/lib/voiceSettings';

export interface VoicePrivacyNoticeProps {
  onAccept: () => void;
  onDecline?: () => void;
}

/**
 * VoicePrivacyNotice - Displays privacy information about voice input
 * Explains local speech processing and data handling
 * Requirement 9.1: Display privacy notice explaining local speech processing
 */
export default function VoicePrivacyNotice({ onAccept, onDecline }: VoicePrivacyNoticeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAccept = () => {
    voiceSettings.acceptPrivacyNotice();
    onAccept();
  };

  const handleDecline = () => {
    if (onDecline) {
      onDecline();
    }
  };

  return (
    <div 
      className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4"
      role="region"
      aria-label="Voice input privacy notice"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <PrivacyIcon />
        </div>
        
        <div className="flex-1">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Privacy & Security Notice
          </h4>
          
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>Your privacy is important to us.</strong> Here&apos;s how voice input works:
            </p>
            
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Speech processing happens <strong>locally in your browser</strong> using the Web Speech API</li>
              <li><strong>No audio data</strong> is sent to our servers</li>
              <li>Only the <strong>text transcription</strong> is sent to generate your form</li>
              <li>Transcriptions are stored temporarily in your browser for 24 hours</li>
              <li>All data is automatically cleared when you close your browser or generate a form</li>
            </ul>

            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-blue-200 space-y-2">
                <p className="font-medium">Additional Details:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    <strong>Browser-based processing:</strong> The Web Speech API processes your voice 
                    directly in your browser. Your audio never leaves your device during this step.
                  </li>
                  <li>
                    <strong>Text-only transmission:</strong> After speech is converted to text in your 
                    browser, only the text is sent to our AI service to generate form fields.
                  </li>
                  <li>
                    <strong>Temporary storage:</strong> Transcriptions are saved in your browser&apos;s 
                    local storage to prevent data loss if you refresh the page. This data expires 
                    after 24 hours.
                  </li>
                  <li>
                    <strong>Automatic cleanup:</strong> When you navigate away from the form builder 
                    or successfully generate a form, all voice data is automatically removed.
                  </li>
                  <li>
                    <strong>Your control:</strong> You can disable voice input at any time in settings, 
                    and you can manually clear transcriptions using the &ldquo;Clear&rdquo; button.
                  </li>
                </ul>
                
                <p className="mt-3 text-xs text-blue-700">
                  <strong>Note:</strong> Voice input requires microphone permissions. You can revoke 
                  these permissions at any time through your browser settings.
                </p>
              </div>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-700 hover:text-blue-900 underline text-xs font-medium mt-2"
              aria-expanded={isExpanded}
              aria-controls="privacy-details"
            >
              {isExpanded ? 'Show less' : 'Read more about privacy'}
            </button>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAccept}
              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 text-sm font-medium transition-colors"
              aria-label="Accept privacy notice and enable voice input"
            >
              I Understand
            </button>
            
            {onDecline && (
              <button
                onClick={handleDecline}
                className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm font-medium transition-colors"
                aria-label="Decline and disable voice input"
              >
                No Thanks
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PrivacyIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="text-blue-600"
    >
      <path
        d="M12 2L4 6V11C4 16.55 7.84 21.74 12 23C16.16 21.74 20 16.55 20 11V6L12 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <path
        d="M9 12L11 14L15 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
