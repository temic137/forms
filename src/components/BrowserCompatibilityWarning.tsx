"use client";

import { BrowserSupport } from '@/types/voice';

export interface BrowserCompatibilityWarningProps {
  support: BrowserSupport;
  onDismiss?: () => void;
}

/**
 * Display browser compatibility warnings for unsupported browsers
 * Requirement 10.5: Display browser compatibility warnings
 */
export default function BrowserCompatibilityWarning({ 
  support, 
  onDismiss 
}: BrowserCompatibilityWarningProps) {
  // Don't show if fully supported
  if (support.speechRecognition && support.webAudioAPI && support.localStorage) {
    return null;
  }

  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg" role="alert">
      <div className="flex items-start gap-3">
        <WarningIcon />
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-amber-900 mb-1">
            Limited Browser Support
          </h4>
          
          <div className="text-sm text-amber-800 space-y-2">
            {!support.speechRecognition && (
              <p>
                <strong>Voice input is not supported</strong> in this browser. 
                {support.recommendedBrowser && (
                  <> Please use {support.recommendedBrowser} for the best experience.</>
                )}
              </p>
            )}
            
            {!support.webAudioAPI && (
              <p>
                <strong>Audio visualization is not available</strong> in this browser.
                Voice input will work, but you won&apos;t see audio level indicators.
              </p>
            )}
            
            {!support.localStorage && (
              <p>
                <strong>Session persistence is not available</strong> in this browser.
                Your transcriptions won&apos;t be saved if you refresh the page.
              </p>
            )}
          </div>
          
          {/* Recommended Browsers */}
          <div className="mt-3 p-3 bg-white rounded border border-amber-200">
            <p className="text-xs font-semibold text-amber-900 mb-2">
              Recommended Browsers:
            </p>
            <ul className="text-xs text-amber-800 space-y-1">
              <li className="flex items-center gap-2">
                <CheckIcon />
                <span>Google Chrome (version 25+)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon />
                <span>Microsoft Edge (version 79+)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon />
                <span>Safari (version 14.1+)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon />
                <span>Opera (version 27+)</span>
              </li>
            </ul>
          </div>
          
          {/* Alternative Input Method */}
          <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-xs text-blue-900">
              <strong>Alternative:</strong> You can still create forms by typing your description 
              in the text area below, then clicking &quot;Generate Form&quot;.
            </p>
          </div>
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-amber-400 hover:text-amber-600 transition-colors"
            aria-label="Dismiss warning"
          >
            <CloseIcon />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Get detailed browser information for debugging
 */
export function getBrowserInfo(): {
  name: string;
  version: string;
  userAgent: string;
} {
  const ua = navigator.userAgent;
  let name = 'Unknown';
  let version = 'Unknown';
  
  if (ua.includes('Chrome') && !ua.includes('Edge')) {
    name = 'Chrome';
    const match = ua.match(/Chrome\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  } else if (ua.includes('Edge')) {
    name = 'Edge';
    const match = ua.match(/Edge\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    name = 'Safari';
    const match = ua.match(/Version\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  } else if (ua.includes('Firefox')) {
    name = 'Firefox';
    const match = ua.match(/Firefox\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  } else if (ua.includes('Opera') || ua.includes('OPR')) {
    name = 'Opera';
    const match = ua.match(/(?:Opera|OPR)\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  }
  
  return { name, version, userAgent: ua };
}

// Icon Components
function WarningIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="text-amber-600 shrink-0"
    >
      <path
        d="M12 2L2 20h20L12 2z"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 9v4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="text-green-600 shrink-0"
    >
      <path
        d="M3 8L6 11L13 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
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
        d="M6 6L14 14M14 6L6 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
