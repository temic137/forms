"use client";

import { useState } from 'react';
import { voiceSettings } from '@/lib/voiceSettings';
import { featureFlags } from '@/lib/featureFlags';

export interface VoiceSettingsToggleProps {
  onChange?: (enabled: boolean) => void;
}

/**
 * VoiceSettingsToggle - Toggle to enable/disable voice input feature
 * Requirement 9.2: Add option to disable voice input in settings
 */
export default function VoiceSettingsToggle({ onChange }: VoiceSettingsToggleProps) {
  const [isEnabled, setIsEnabled] = useState(() => voiceSettings.isEnabled());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Check if feature is globally enabled (Requirement 9.5, 10.5)
  const isFeatureEnabled = featureFlags.voiceInput.isEnabled();

  const handleToggle = () => {
    // Can't enable if feature is globally disabled
    if (!isFeatureEnabled && !isEnabled) {
      return;
    }
    
    if (isEnabled) {
      // Show confirmation before disabling
      setShowConfirmDialog(true);
    } else {
      // Enable immediately
      enableVoiceInput();
    }
  };

  const enableVoiceInput = () => {
    voiceSettings.setEnabled(true);
    setIsEnabled(true);
    if (onChange) {
      onChange(true);
    }
  };

  const disableVoiceInput = () => {
    voiceSettings.setEnabled(false);
    setIsEnabled(false);
    setShowConfirmDialog(false);
    if (onChange) {
      onChange(false);
    }
  };

  const cancelDisable = () => {
    setShowConfirmDialog(false);
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-white border border-neutral-200 rounded-lg">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-black mb-1">
            Voice Input
          </h4>
          <p className="text-xs text-neutral-600">
            {!isFeatureEnabled 
              ? 'Voice input is disabled globally by administrator.'
              : isEnabled 
                ? 'Voice input is enabled. You can use speech-to-text to create forms.'
                : 'Voice input is disabled. Enable it to use speech-to-text features.'
            }
          </p>
        </div>

        <button
          onClick={handleToggle}
          disabled={!isFeatureEnabled && !isEnabled}
          role="switch"
          aria-checked={isEnabled}
          aria-label={isEnabled ? 'Disable voice input' : 'Enable voice input'}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isEnabled ? 'bg-black' : 'bg-neutral-300'}
          `}
          title={!isFeatureEnabled && !isEnabled ? 'Voice input is disabled by administrator' : ''}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${isEnabled ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>
      
      {/* Feature Flag Status */}
      {!isFeatureEnabled && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="shrink-0 mt-0.5">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-yellow-600">
                <path d="M8 1L1 14H15L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 6V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="8" cy="11.5" r="0.5" fill="currentColor"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs text-yellow-900">
                <strong>Feature Disabled:</strong> Voice input has been disabled globally. 
                Contact your administrator to enable this feature.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="disable-dialog-title"
          aria-describedby="disable-dialog-description"
        >
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h4 id="disable-dialog-title" className="text-lg font-medium text-black mb-2">
              Disable Voice Input?
            </h4>
            <p id="disable-dialog-description" className="text-sm text-neutral-600 mb-6">
              This will disable the voice input feature. You can re-enable it at any time 
              from settings. Any saved transcriptions will be preserved.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelDisable}
                className="flex-1 px-4 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors"
                aria-label="Cancel disabling voice input"
              >
                Cancel
              </button>
              <button
                onClick={disableVoiceInput}
                className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors"
                aria-label="Confirm disable voice input"
              >
                Disable
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
