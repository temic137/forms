"use client";

import { VoiceError } from '@/types/voice';
import { ERROR_STRATEGIES, ErrorRecoveryStrategy } from '@/lib/voiceErrors';

export interface VoiceErrorDisplayProps {
  error: VoiceError;
  onRetry?: () => void;
  onDismiss?: () => void;
}

/**
 * Error display component with user-friendly messages and recovery actions
 * Requirement 7.5: Display specific error messages with troubleshooting guidance
 */
export default function VoiceErrorDisplay({ error, onRetry, onDismiss }: VoiceErrorDisplayProps) {
  const strategy = ERROR_STRATEGIES[error.type];

  return (
    <div 
      className="p-4 bg-red-50 border border-red-200 rounded-lg animate-slide-in" 
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex items-start gap-3">
        <ErrorIcon />
        
        <div className="flex-1 min-w-0">
          {/* Error Title */}
          <h4 className="text-sm font-semibold text-red-900 mb-1">
            {getErrorTitle(error.type)}
          </h4>
          
          {/* Error Message */}
          <p className="text-sm text-red-800 mb-3">
            {strategy.userMessage}
          </p>
          
          {/* Troubleshooting Guidance */}
          <TroubleshootingGuidance strategy={strategy} />
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-3">
            {strategy.retryable && onRetry && (
              <button
                onClick={onRetry}
                className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                aria-label="Retry voice input"
              >
                Try Again
              </button>
            )}
            
            {strategy.action === 'check-settings' && (
              <button
                onClick={() => window.open(getSettingsUrl(), '_blank')}
                className="px-3 py-1.5 border border-red-300 text-red-700 text-sm font-medium rounded hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                aria-label="Open browser settings guide in new tab"
              >
                Open Settings Guide
              </button>
            )}
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="ml-auto text-sm text-red-600 hover:text-red-800 underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                aria-label="Dismiss error message"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded transition-colors"
            aria-label="Close error message"
          >
            <CloseIcon />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Get user-friendly error title based on error type
 */
function getErrorTitle(errorType: VoiceError['type']): string {
  const titles: Record<VoiceError['type'], string> = {
    'not-supported': 'Browser Not Supported',
    'permission-denied': 'Microphone Access Denied',
    'no-speech': 'No Speech Detected',
    'network': 'Network Error',
    'aborted': 'Recording Stopped',
    'audio-capture': 'Microphone Error',
    'service-not-allowed': 'Service Not Allowed',
  };
  
  return titles[errorType];
}

/**
 * Display troubleshooting guidance based on recovery strategy
 */
function TroubleshootingGuidance({ strategy }: { strategy: ErrorRecoveryStrategy }) {
  const guidance = getTroubleshootingSteps(strategy);
  
  if (!guidance || guidance.length === 0) return null;
  
  return (
    <div className="mt-2 p-3 bg-white rounded border border-red-200">
      <p className="text-xs font-semibold text-red-900 mb-2">How to fix this:</p>
      <ol className="text-xs text-red-800 space-y-1 list-decimal list-inside">
        {guidance.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
    </div>
  );
}

/**
 * Get troubleshooting steps for each error type
 * Requirement 10.3: Handle network connectivity loss
 */
function getTroubleshootingSteps(strategy: ErrorRecoveryStrategy): string[] {
  const steps: Record<ErrorRecoveryStrategy['type'], string[]> = {
    'not-supported': [
      'Use Google Chrome, Microsoft Edge, or Safari browser',
      'Update your browser to the latest version',
      'Use manual text input as an alternative',
    ],
    'permission-denied': [
      'Click the lock icon in your browser\'s address bar',
      'Find "Microphone" in the permissions list',
      'Change the setting to "Allow"',
      'Refresh the page and try again',
    ],
    'no-speech': [
      'Make sure your microphone is not muted',
      'Speak clearly and closer to your microphone',
      'Check that the correct microphone is selected in your system settings',
      'Try speaking louder or in a quieter environment',
    ],
    'network': [
      'Check your internet connection',
      'Try refreshing the page',
      'If the problem persists, try again in a few minutes',
    ],
    'aborted': [
      'Click the microphone button to start recording again',
      'Make sure you don\'t have multiple tabs trying to use the microphone',
    ],
    'audio-capture': [
      'Check that your microphone is properly connected',
      'Make sure no other application is using your microphone',
      'Try selecting a different microphone in your system settings',
      'Restart your browser and try again',
    ],
    'service-not-allowed': [
      'Check your browser\'s privacy settings',
      'Make sure speech recognition is not blocked by browser extensions',
      'Try using an incognito/private window',
      'Check if your organization has restricted speech recognition',
    ],
  };
  
  return steps[strategy.type] || [];
}

/**
 * Get URL for browser settings based on user agent
 */
function getSettingsUrl(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('chrome')) {
    return 'chrome://settings/content/microphone';
  } else if (userAgent.includes('edge')) {
    return 'edge://settings/content/microphone';
  } else if (userAgent.includes('firefox')) {
    return 'about:preferences#privacy';
  } else if (userAgent.includes('safari')) {
    return 'x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone';
  }
  
  // Generic help page
  return 'https://support.google.com/chrome/answer/2693767';
}

// Icon Components
function ErrorIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="text-red-600 shrink-0"
    >
      <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
      <path
        d="M12 8V12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
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
