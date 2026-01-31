"use client";

import { useEffect, useState } from 'react';
import { SpeechRecognitionService } from '@/lib/speechRecognition';
import { BrowserSupport } from '@/types/voice';

export interface BrowserCompatibilityWarningProps {
  onDismiss?: () => void;
  showDetails?: boolean;
  support?: BrowserSupport;
}

export default function BrowserCompatibilityWarning({
  onDismiss,
  showDetails = false,
  support: providedSupport,
}: BrowserCompatibilityWarningProps) {
  const [support, setSupport] = useState<BrowserSupport | null>(null);

  useEffect(() => {
    // If support is provided as a prop, use it
    if (providedSupport) {
      setSupport(providedSupport);
      return;
    }

    // Otherwise, detect browser support
    const service = new SpeechRecognitionService();
    const browserSupport = service.detectBrowserSupport();
    setSupport(browserSupport);
  }, [providedSupport]);

  if (!support || support.speechRecognition) {
    return null;
  }

  return (
    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-2xl">⚠️</div>
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-900 mb-1">
            Browser Not Supported
          </h3>
          <p className="text-sm text-yellow-800 mb-2">
            Voice input is not supported in your current browser{support.recommendedBrowser ? `. Try ${support.recommendedBrowser}` : ''}.
          </p>
          
          {showDetails && (
            <div className="mt-3 p-3 bg-yellow-100 rounded text-xs text-yellow-900 space-y-1">
              <div><strong>Speech Recognition:</strong> {support.speechRecognition ? 'Available' : 'Not Available'}</div>
              <div><strong>Web Audio API:</strong> {support.webAudioAPI ? 'Available' : 'Not Available'}</div>
              <div><strong>Local Storage:</strong> {support.localStorage ? 'Available' : 'Not Available'}</div>
              <div><strong>Mobile:</strong> {support.isMobile ? 'Yes' : 'No'}</div>
            </div>
          )}

          <div className="mt-3">
            <h4 className="font-medium text-sm text-yellow-900 mb-2">
              Supported Browsers:
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>Google Chrome (Desktop & Mobile)</li>
              <li>Microsoft Edge (Desktop)</li>
              <li>Safari (Desktop & Mobile)</li>
            </ul>
          </div>

          <div className="mt-3 text-xs text-yellow-700">
            <strong>Note:</strong> Firefox does not currently support the Web Speech API for speech recognition.
          </div>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="mt-3 text-sm font-medium text-yellow-900 hover:text-yellow-950 underline"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
