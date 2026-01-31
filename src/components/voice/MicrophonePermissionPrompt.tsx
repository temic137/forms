"use client";

import { useState } from 'react';

export interface MicrophonePermissionPromptProps {
  onRequestPermission: () => Promise<void>;
  onCancel?: () => void;
}

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
    } catch (err) {
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to request microphone permission'
      );
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="text-center mb-4">
          <div className="text-5xl mb-3">🎤</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Microphone Permission Required
          </h2>
          <p className="text-gray-600">
            To use voice input, we need access to your microphone. Your audio is processed locally and never stored.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <span>🔒</span>
              <span>Privacy & Security</span>
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Audio is processed in real-time</li>
              <li>• No recordings are stored</li>
              <li>• You can revoke permission anytime</li>
              <li>• Works entirely in your browser</li>
            </ul>
          </div>

          <div className="flex gap-2">
            {onCancel && (
              <button
                onClick={onCancel}
                disabled={isRequesting}
                className="flex-1 px-4 py-3 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleRequest}
              disabled={isRequesting}
              className="flex-1 px-4 py-3 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {isRequesting ? 'Requesting...' : 'Allow Microphone'}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            You can change this permission later in your browser settings
          </p>
        </div>
      </div>
    </div>
  );
}
