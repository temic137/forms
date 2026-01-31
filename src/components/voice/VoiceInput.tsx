"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useVoiceInput } from '@/hooks/useVoiceInput';

export interface VoiceInputProps {
  onTranscriptComplete?: (transcript: string) => void;
  onGenerateForm?: (transcript: string) => Promise<void>;
  disabled?: boolean;
  inline?: boolean;
}

export default function VoiceInput({
  onTranscriptComplete,
  onGenerateForm,
  disabled = false,
  inline = false,
}: VoiceInputProps) {
  const [transcript, setTranscript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const {
    isListening,
    transcript: voiceTranscript,
    interimTranscript,
    error,
    isSupported,
    audioLevel,
    isMobile,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript: setVoiceTranscript,
  } = useVoiceInput({
    language: 'en-US',
    continuous: true,
    interimResults: true,
    onTranscriptChange: (newTranscript) => {
      setTranscript(newTranscript);
      if (onTranscriptComplete) {
        onTranscriptComplete(newTranscript);
      }
    },
  });

  useEffect(() => {
    setTranscript(voiceTranscript);
  }, [voiceTranscript]);

  const handleStartListening = async () => {
    if (disabled) return;
    try {
      await startListening();
    } catch (err) {
      console.error('Error starting voice input:', err);
    }
  };

  const handleStopListening = () => {
    stopListening();
  };

  const handleClearTranscript = () => {
    resetTranscript();
    setTranscript('');
    setShowClearConfirm(false);
  };

  const handleGenerateClick = async () => {
    if (!transcript.trim() || !onGenerateForm) return;
    
    setIsGenerating(true);
    try {
      await onGenerateForm(transcript);
    } catch (err) {
      console.error('Error generating form:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className={`voice-input ${inline ? 'inline' : 'standalone'}`}>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error.message}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Controls */}
        <div className="flex gap-2">
          <button
            onClick={isListening ? handleStopListening : handleStartListening}
            disabled={disabled}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors
              ${isListening 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isListening ? '⏹ Stop' : '🎤 Start Recording'}
          </button>

          {transcript && (
            <>
              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-4 py-2 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Clear
              </button>
              {onGenerateForm && (
                <button
                  onClick={handleGenerateClick}
                  disabled={isGenerating}
                  className="px-4 py-2 rounded-lg font-medium bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
                >
                  {isGenerating ? 'Generating...' : 'Generate Form'}
                </button>
              )}
            </>
          )}
        </div>

        {/* Audio Level Indicator */}
        {isListening && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Audio Level:</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-100"
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Transcript Display */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg min-h-[100px]">
          {transcript ? (
            <p className="text-gray-800 whitespace-pre-wrap">{transcript}</p>
          ) : (
            <p className="text-gray-400 italic">
              {isListening ? 'Listening... Start speaking' : 'No transcript yet'}
            </p>
          )}
          {interimTranscript && (
            <p className="text-gray-500 italic mt-2">{interimTranscript}</p>
          )}
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md">
            <h3 className="text-lg font-semibold mb-2">Clear Transcript?</h3>
            <p className="text-gray-600 mb-4">
              This will permanently delete your current transcript. This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleClearTranscript}
                className="px-4 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
