"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useVoiceInput } from '@/hooks/useVoiceInput';

export interface VoiceModeProps {
  onTranscriptComplete?: (transcript: string) => void;
  onGenerateForm?: (transcript: string) => Promise<void>;
  disabled?: boolean;
  inline?: boolean;
}

export default function VoiceMode({
  onTranscriptComplete,
  onGenerateForm,
  disabled = false,
  inline = false,
}: VoiceModeProps) {
  const [transcript, setTranscript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [silenceCountdown, setSilenceCountdown] = useState<number | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptRef = useRef<string>('');

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
    if (voiceTranscript) {
      setTranscript(voiceTranscript);
    }
  }, [voiceTranscript]);

  // Auto-stop after 3 seconds of silence
  useEffect(() => {
    // Clear any existing timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setSilenceCountdown(null);

    // Only set up auto-stop if listening and we have a transcript
    if (isListening && transcript.trim() && transcript !== lastTranscriptRef.current) {
      lastTranscriptRef.current = transcript;
      
      // Start 3-second countdown
      setSilenceCountdown(3);
      let countdown = 3;
      
      countdownIntervalRef.current = setInterval(() => {
        countdown -= 1;
        setSilenceCountdown(countdown);
        
        if (countdown <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
        }
      }, 1000);
      
      // Auto-stop after 3 seconds
      silenceTimerRef.current = setTimeout(() => {
        if (transcript.trim()) {
          stopListening();
          setSilenceCountdown(null);
        }
      }, 3000);
    }

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [transcript, isListening, stopListening]);

  const handleStartListening = async () => {
    try {
      await startListening();
    } catch (err) {
      console.error('Failed to start listening:', err);
      
      // Show user-friendly error message based on device
      if (isMobile) {
        // Mobile-specific error handling
        alert('Please allow microphone access:\n\n' +
              'iOS: Settings → Safari → Microphone\n' +
              'Android: Settings → Apps → Chrome → Permissions → Microphone');
      }
    }
  };

  const handleStopListening = () => {
    stopListening();
  };

  const handleClear = () => {
    if (transcript.trim()) {
      setShowClearConfirm(true);
    }
  };

  const confirmClear = () => {
    resetTranscript();
    setTranscript('');
    setShowClearConfirm(false);
    if (onTranscriptComplete) {
      onTranscriptComplete('');
    }
  };

  const cancelClear = () => {
    setShowClearConfirm(false);
  };

  const handleTranscriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setTranscript(newValue);
    setVoiceTranscript(newValue);
    if (onTranscriptComplete) {
      onTranscriptComplete(newValue);
    }
  };

  const handleGenerateForm = useCallback(async () => {
    if (!onGenerateForm || !transcript.trim()) return;

    setIsGenerating(true);

    try {
      await onGenerateForm(transcript);
    } catch (error) {
      console.error('Form generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [onGenerateForm, transcript]);

  if (!isSupported) {
    return (
      <div className={inline ? "p-4 bg-red-50 border-2 border-red-200 rounded-xl" : "bg-white border-2 border-black/20 rounded-2xl p-6"}>
        <div className="text-center">
          <p className="text-sm font-bold text-red-900 font-paper mb-2">
            Voice input not supported in this browser.
          </p>
          <p className="text-xs text-red-700 font-paper">
            {isMobile 
              ? "Try Safari on iOS or Chrome on Android" 
              : "Try Chrome, Edge, or Safari"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={inline ? "space-y-3" : "bg-white border-2 border-black/20 rounded-2xl p-6"}>
      {/* Header - only show if not inline */}
      {!inline && (
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-black font-paper">🎤 Voice Mode</h3>
          {isListening && (
            <div className="flex items-center gap-2">
              <div className="relative flex items-center justify-center">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                <div className="absolute w-2 h-2 bg-red-600 rounded-full animate-ping opacity-75" />
              </div>
              <span className="text-xs font-bold text-black/60 font-paper">Recording...</span>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className={`${inline ? 'mb-3' : 'mb-4'} p-4 bg-red-50 border-2 border-red-200 rounded-xl`}>
          <div className="flex items-start gap-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-red-600 shrink-0 mt-0.5"
            >
              <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
              <path
                d="M10 6V10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="10" cy="13" r="1" fill="currentColor" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-bold text-red-900 font-paper mb-1">{error.message}</p>
              {isMobile && error.type === 'permission-denied' && (
                <p className="text-xs text-red-700 font-paper">
                  Go to your browser settings and allow microphone access for this site.
                </p>
              )}
              {error.recoverable && (
                <button
                  onClick={handleStartListening}
                  className="mt-2 text-xs font-bold text-red-700 hover:text-red-900 underline font-paper"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Controls */}
      <div className={`flex items-center gap-2 ${inline ? 'mb-3' : 'mb-6'} flex-wrap`}>
        {!isListening ? (
          <button
            onClick={handleStartListening}
            disabled={disabled}
            className={`flex items-center gap-2 ${inline ? (isMobile ? 'px-5 py-3 text-sm min-h-[48px]' : 'px-4 py-2 text-sm') : (isMobile ? 'px-6 py-4' : 'px-6 py-3')} bg-black text-white rounded-full border-2 border-black hover:bg-black/90 active:scale-95 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-paper font-bold touch-manipulation`}
            aria-label="Start voice recording"
          >
            <svg
              width={inline ? "16" : "20"}
              height={inline ? "16" : "20"}
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 2C9.20435 2 8.44129 2.31607 7.87868 2.87868C7.31607 3.44129 7 4.20435 7 5V10C7 10.7956 7.31607 11.5587 7.87868 12.1213C8.44129 12.6839 9.20435 13 10 13C10.7956 13 11.5587 12.6839 12.1213 12.1213C12.6839 11.5587 13 10.7956 13 10V5C13 4.20435 12.6839 3.44129 12.1213 2.87868C11.5587 2.31607 10.7956 2 10 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5 10C5 11.3261 5.52678 12.5979 6.46447 13.5355C7.40215 14.4732 8.67392 15 10 15C11.3261 15 12.5979 14.4732 13.5355 13.5355C14.4732 12.5979 15 11.3261 15 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 15V18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 18H12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{inline ? 'Dictate' : 'Start Dictation'}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleStopListening}
              disabled={disabled}
              className={`flex items-center gap-2 ${inline ? (isMobile ? 'px-5 py-3 text-sm min-h-[48px]' : 'px-4 py-2 text-sm') : (isMobile ? 'px-6 py-4' : 'px-6 py-3')} bg-red-600 text-white rounded-full border-2 border-red-600 hover:bg-red-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-paper font-bold animate-pulse touch-manipulation`}
              aria-label="Stop voice recording"
            >
              <svg
                width={inline ? "16" : "20"}
                height={inline ? "16" : "20"}
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="5"
                  y="5"
                  width="10"
                  height="10"
                  rx="2"
                  fill="currentColor"
                />
              </svg>
              <span>Stop</span>
            </button>
            
            {/* Silence Countdown */}
            {silenceCountdown !== null && silenceCountdown > 0 && (
              <span className="text-xs font-bold text-black/60 font-paper animate-pulse">
                Auto-stopping in {silenceCountdown}s...
              </span>
            )}
            
            {/* Audio Level Indicator */}
            {audioLevel > 0 && (
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((bar) => (
                  <div
                    key={bar}
                    className={`w-1 rounded-full transition-all duration-100 ${
                      bar <= Math.ceil((audioLevel / 100) * 5)
                        ? 'bg-black'
                        : 'bg-black/20'
                    }`}
                    style={{
                      height: `${8 + bar * 3}px`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {!isListening && transcript.trim() && (
          <button
            onClick={handleClear}
            disabled={disabled}
            className={`${inline ? (isMobile ? 'px-4 py-3 text-sm min-h-[48px]' : 'px-3 py-2 text-sm') : (isMobile ? 'px-5 py-4' : 'px-4 py-3')} border-2 border-black/30 text-black rounded-full hover:bg-black/5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-paper font-bold touch-manipulation`}
            aria-label="Clear transcription"
          >
            Clear
          </button>
        )}
      </div>
      
      {/* Mobile-specific tips */}
      {isMobile && isListening && (
        <div className="mb-3 p-3 bg-blue-50 border-2 border-blue-200 rounded-xl">
          <p className="text-xs font-bold text-blue-900 font-paper">
            💡 Speak clearly and hold your device close. The recording will stop automatically after 3 seconds of silence.
          </p>
        </div>
      )}

      {/* Transcription Display - only show if not inline or if there's content */}
      {(!inline || transcript || isListening) && (
        <div className={inline ? 'mb-3' : 'mb-6'}>
          {!inline && (
            <label htmlFor="voice-transcript" className="block text-sm font-bold text-black/60 mb-2 font-paper">
              Transcription
            </label>
          )}
          <div className="relative">
            <textarea
              id="voice-transcript"
              value={transcript}
              onChange={handleTranscriptChange}
              disabled={disabled || isListening}
              placeholder={inline ? "Click 'Dictate' and speak..." : "Click 'Start Dictation' and describe your form... For example: 'I need a contact form with name, email, and message fields'"}
              className={`w-full ${inline ? 'px-3 py-2 text-sm' : 'px-4 py-3'} border-2 border-black/20 rounded-xl bg-white text-black font-paper focus:outline-none focus:border-black transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-black/30`}
              rows={inline ? 3 : 6}
              aria-label="Voice transcription text area"
            />
            {isListening && interimTranscript && (
              <div className={`absolute ${inline ? 'bottom-2 left-3 right-3 text-xs' : 'bottom-3 left-4 right-4 text-sm'} text-black/40 italic font-paper pointer-events-none`}>
                {interimTranscript}
              </div>
            )}
          </div>

          {/* Example Phrases - only show in non-inline mode */}
          {!inline && !transcript && !isListening && (
            <div className="mt-4 p-4 bg-black/5 border-2 border-black/10 rounded-xl">
              <p className="text-xs font-bold text-black/60 mb-2 font-paper">
                💡 Example phrases to try:
              </p>
              <div className="space-y-1.5">
                <ExamplePhrase text="I need a contact form with name, email, phone, and message" />
                <ExamplePhrase text="Create a registration form with username, password, and email" />
                <ExamplePhrase text="Make a survey with rating from 1 to 5 and comments" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generate Form Button - only show in non-inline mode */}
      {!inline && onGenerateForm && (
        <button
          onClick={handleGenerateForm}
          disabled={disabled || !transcript.trim() || isGenerating || isListening}
          className="w-full px-6 py-4 bg-black text-white rounded-full border-2 border-black hover:bg-black/90 active:scale-95 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-paper font-bold text-base"
          aria-label={isGenerating ? 'Generating form, please wait' : 'Generate form from transcription'}
          aria-busy={isGenerating}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner />
              <span>Generating Form...</span>
            </span>
          ) : (
            <span>Generate Form from Voice</span>
          )}
        </button>
      )}

      {/* Clear Confirmation Dialog */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-dialog-title"
        >
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 border-2 border-black/20">
            <h4 id="clear-dialog-title" className="text-lg font-bold text-black mb-2 font-paper">
              Clear Transcription?
            </h4>
            <p className="text-sm text-black/60 mb-6 font-paper">
              This will remove all transcribed text. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelClear}
                className="flex-1 px-4 py-3 border-2 border-black/30 text-black rounded-full hover:bg-black/5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all font-paper font-bold"
                aria-label="Cancel clearing transcription"
              >
                Cancel
              </button>
              <button
                onClick={confirmClear}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-full border-2 border-red-600 hover:bg-red-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all font-paper font-bold"
                aria-label="Confirm clear transcription"
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

// Helper Components
function ExamplePhrase({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 text-xs text-black/60 font-paper">
      <span className="text-black/40 shrink-0 mt-0.5">•</span>
      <span className="italic">&ldquo;{text}&rdquo;</span>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="10"
        cy="10"
        r="8"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="40"
        strokeDashoffset="10"
      />
    </svg>
  );
}
