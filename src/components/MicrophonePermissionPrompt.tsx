"use client";

import { useState } from 'react';

export interface MicrophonePermissionPromptProps {
  onRequestPermission: () => Promise<void>;
  onCancel?: () => void;
}

/**
 * Permission request flow with instructions
 * Requirement 10.2: Implement permission request flow with instructions
 */
export default function MicrophonePermissionPrompt({
  onRequestPermission,
  onCancel,
}: MicrophonePermissionPromptProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = async () => {
    setIsRequesting(true);
    setError(null);
    
    try {
      await onRequestPermission();
    } catch {
      setError('Permission was denied. Please check your browser settings.');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="p-6 bg-white border border-neutral-200 rounded-lg">
      <div className="flex flex-col items-center text-center">
        {/* Microphone Icon */}
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <MicrophoneIcon />
        </div>
        
        {/* Title */}
        <h3 className="text-lg font-semibold text-black mb-2">
          Microphone Access Required
        </h3>
        
        {/* Description */}
        <p className="text-sm text-neutral-600 mb-4 max-w-md">
          To use voice input, we need access to your microphone. Your voice will be processed 
          locally in your browser using the Web Speech API. No audio is sent to our servers.
        </p>
        
        {/* Privacy Notice */}
        <div className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <div className="flex items-start gap-2 text-left">
            <ShieldIcon />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-blue-900 mb-1">
                Your Privacy is Protected
              </p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Speech processing happens in your browser</li>
                <li>• Only text transcriptions are sent to our AI</li>
                <li>• No audio recordings are stored</li>
                <li>• You can disable voice input anytime</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-lg mb-4 text-left">
          <p className="text-xs font-semibold text-neutral-900 mb-2">
            What happens next:
          </p>
          <ol className="text-xs text-neutral-700 space-y-1 list-decimal list-inside">
            <li>Your browser will ask for microphone permission</li>
            <li>Click &quot;Allow&quot; to enable voice input</li>
            <li>Start speaking to describe your form</li>
            <li>Review and edit the transcription</li>
            <li>Generate your form with AI</li>
          </ol>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="w-full p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-3 w-full">
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={isRequesting}
              className="flex-1 px-4 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          )}
          
          <button
            onClick={handleRequest}
            disabled={isRequesting}
            className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isRequesting ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner />
                Requesting...
              </span>
            ) : (
              'Allow Microphone Access'
            )}
          </button>
        </div>
        
        {/* Help Link */}
        <button
          onClick={() => window.open('https://support.google.com/chrome/answer/2693767', '_blank')}
          className="mt-3 text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Having trouble? Learn how to enable microphone access
        </button>
      </div>
    </div>
  );
}

// Icon Components
function MicrophoneIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="text-blue-600"
    >
      <path
        d="M16 4C14.4087 4 12.8826 4.63214 11.7574 5.75736C10.6321 6.88258 10 8.4087 10 10V16C10 17.5913 10.6321 19.1174 11.7574 20.2426C12.8826 21.3679 14.4087 22 16 22C17.5913 22 19.1174 21.3679 20.2426 20.2426C21.3679 19.1174 22 17.5913 22 16V10C22 8.4087 21.3679 6.88258 20.2426 5.75736C19.1174 4.63214 17.5913 4 16 4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 16C6 18.6522 7.05357 21.1957 8.92893 23.0711C10.8043 24.9464 13.3478 26 16 26C18.6522 26 21.1957 24.9464 23.0711 23.0711C24.9464 21.1957 26 18.6522 26 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 26V28"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 28H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="text-blue-600 shrink-0 mt-0.5"
    >
      <path
        d="M8 1L3 3V7C3 10.5 5.5 13.5 8 14.5C10.5 13.5 13 10.5 13 7V3L8 1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <path
        d="M6 8L7.5 9.5L10 6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="32"
        strokeDashoffset="8"
      />
    </svg>
  );
}
