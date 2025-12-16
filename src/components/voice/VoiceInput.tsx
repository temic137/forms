"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { transcriptionStorage, TranscriptionSession } from '@/lib/transcriptionStorage';
import VoiceErrorDisplay from './VoiceErrorDisplay';
import BrowserCompatibilityWarning from './BrowserCompatibilityWarning';
import { SpeechRecognitionService } from '@/lib/speechRecognition';
import ScreenReaderAnnouncement, { useScreenReaderAnnouncement } from '@/components/ui/ScreenReaderAnnouncement';
import VoiceInputTutorial from './VoiceInputTutorial';
import VoiceInputHelpModal from './VoiceInputHelpModal';
import { voiceInputTutorial } from '@/lib/voiceInputTutorial';
import VoicePrivacyNotice from './VoicePrivacyNotice';
import { voiceSettings } from '@/lib/voiceSettings';
import { useVoiceCleanup } from '@/hooks/useVoiceCleanup';
import TranscriptionDisplay from './TranscriptionDisplay';
import { 
  SupportedLanguage, 
  LANGUAGE_NAMES, 
  SUPPORTED_LANGUAGES,
  detectUserLanguage 
} from '@/lib/languageDetection';
import { voiceAnalytics } from '@/lib/voiceAnalytics';

export interface VoiceInputProps {
  onTranscriptComplete?: (transcript: string) => void;
  onGenerateForm?: (transcript: string, language?: string) => Promise<void>;
  initialTranscript?: string;
  disabled?: boolean;
}

export default function VoiceInput({
  onTranscriptComplete,
  onGenerateForm,
  initialTranscript = '',
  disabled = false,
}: VoiceInputProps) {
  const [editableTranscript, setEditableTranscript] = useState(initialTranscript);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCompatibilityWarning, setShowCompatibilityWarning] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const [voiceInputEnabled, setVoiceInputEnabled] = useState(true);
  const [restoredSession, setRestoredSession] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [showLanguageWarning, setShowLanguageWarning] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState<SupportedLanguage | null>(null);
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState<number | null>(null);
  
  // Ref to track last saved transcript to avoid unnecessary saves
  const lastSavedTranscriptRef = useRef<string>('');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialLanguageRef = useRef<SupportedLanguage | null>(null);
  const hasDisabledStorageRef = useRef<boolean>(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptRef = useRef<string>('');
  
  // Browser support detection
  const browserSupport = useRef(new SpeechRecognitionService().detectBrowserSupport()).current;
  
  // Track browser compatibility on mount (Requirement 15.4)
  useEffect(() => {
    const browserInfo = `${navigator.userAgent}`;
    voiceAnalytics.trackBrowserCompatibility(browserInfo, browserSupport.speechRecognition);
  }, [browserSupport.speechRecognition]);
  
  // Screen reader announcements
  const { announcement, priority, announce } = useScreenReaderAnnouncement();

  // Automatic cleanup on navigation (Requirement 9.4)
  useVoiceCleanup({
    enabled: true,
    onCleanup: () => {
      console.log('Voice data cleaned up on navigation');
    },
  });

  // Auto-detect user's browser language as default (Requirement 6.5)
  const defaultLanguage = useRef(detectUserLanguage()).current;
  
  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    audioLevel,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript: setVoiceTranscript,
    language,
    setLanguage,
  } = useVoiceInput({
    language: defaultLanguage,
    continuous: true,
    interimResults: true,
    initialTranscript: editableTranscript,
    onTranscriptChange: (newTranscript) => {
      setEditableTranscript(newTranscript);
      if (onTranscriptComplete) {
        onTranscriptComplete(newTranscript);
      }
    },
  });

  // Load saved transcription on mount and check tutorial/privacy status
  useEffect(() => {
    // Check if voice input is enabled (Requirement 9.2)
    const enabled = voiceSettings.isEnabled();
    setVoiceInputEnabled(enabled);

    if (!enabled) {
      return; // Don't load anything if voice input is disabled
    }

    // Check if privacy notice has been accepted (Requirement 9.1)
    const privacyAccepted = voiceSettings.hasAcceptedPrivacyNotice();
    if (!privacyAccepted) {
      setShowPrivacyNotice(true);
      return; // Don't show tutorial or load data until privacy is accepted
    }

    // Check if local storage is available (Requirement 14.5)
    const isStorageAvailable = transcriptionStorage.isStorageAvailable();
    setStorageAvailable(isStorageAvailable);

    if (!isStorageAvailable) {
      console.warn('Local storage not available. Session persistence disabled.');
      announce('Local storage unavailable. Your transcription will not be saved.', 'polite');
    }

    // Load saved transcription from local storage on page load (Requirement 14.2)
    try {
      const savedSession = transcriptionStorage.load();
      if (savedSession && savedSession.transcript) {
        setEditableTranscript(savedSession.transcript);
        setRestoredSession(true); // Display restored session with visual indicator
        
        // Update voice hook transcript
        setVoiceTranscript(savedSession.transcript);
        
        // Restore language from saved session if available
        if (savedSession.language) {
          const savedLang = savedSession.language as SupportedLanguage;
          setLanguage(savedLang);
          initialLanguageRef.current = savedLang;
        }
        
        if (onTranscriptComplete) {
          onTranscriptComplete(savedSession.transcript);
        }
        
        // Announce restoration to screen readers
        announce('Previous transcription session restored.', 'polite');
        
        // Auto-hide the restored session indicator after 5 seconds
        setTimeout(() => {
          setRestoredSession(false);
        }, 5000);
      }
    } catch (error) {
      // Handle storage errors with fallback to in-memory storage (Requirement 14.5)
      console.error('Failed to load saved session:', error);
      setStorageAvailable(false);
      announce('Unable to restore previous session. Starting fresh.', 'polite');
    }

    // Show tutorial for first-time users (Requirement 13.1)
    if (!voiceInputTutorial.hasCompletedTutorial()) {
      setShowTutorial(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Initialize editable transcript from voice hook
  useEffect(() => {
    if (transcript) {
      setEditableTranscript(transcript);
    }
  }, [transcript]);

  // Auto-save to local storage every 5 seconds
  useEffect(() => {
    // Skip auto-save if storage is not available (fallback to in-memory only)
    if (!storageAvailable) {
      return;
    }

    // Clear any existing timer
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }

    // Only set up auto-save if there's content and it's different from last save
    if (editableTranscript.trim() && editableTranscript !== lastSavedTranscriptRef.current) {
      // Set up interval to save every 5 seconds
      autoSaveTimerRef.current = setInterval(() => {
        if (editableTranscript !== lastSavedTranscriptRef.current) {
          const session: TranscriptionSession = {
            id: sessionId,
            transcript: editableTranscript,
            language: language,
            timestamp: Date.now(),
          };
          
          const saved = transcriptionStorage.save(session);
          if (saved) {
            lastSavedTranscriptRef.current = editableTranscript;
          } else {
            // Storage failed, disable future attempts
            // Use a ref to prevent multiple calls
            if (!hasDisabledStorageRef.current) {
              hasDisabledStorageRef.current = true;
              setStorageAvailable(false);
              console.warn('Storage save failed. Falling back to in-memory only.');
            }
          }
        }
      }, 5000); // 5 seconds
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [editableTranscript, language, sessionId, storageAvailable]);

  // Save immediately when transcript changes (in addition to periodic saves)
  useEffect(() => {
    // Skip if storage is not available (fallback to in-memory only)
    if (!storageAvailable) {
      return;
    }

    if (editableTranscript.trim() && editableTranscript !== lastSavedTranscriptRef.current) {
      const session: TranscriptionSession = {
        id: sessionId,
        transcript: editableTranscript,
        language: language,
        timestamp: Date.now(),
      };
      
      const saved = transcriptionStorage.save(session);
      if (saved) {
        lastSavedTranscriptRef.current = editableTranscript;
      } else {
        // Storage failed, disable future attempts
        // Use a ref to prevent multiple calls
        if (!hasDisabledStorageRef.current) {
          hasDisabledStorageRef.current = true;
          setStorageAvailable(false);
          console.warn('Storage save failed. Falling back to in-memory only.');
        }
      }
    }
  }, [editableTranscript, language, sessionId, storageAvailable]);

  const handleStartListening = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      await startListening();
      
      // Track session start in analytics (Requirement 15.1)
      voiceAnalytics.startSession(sessionId, language);
      
      // Announce to screen readers (Requirement 8.2)
      announce('Voice input started. Recording in progress.', 'polite');
    } catch (err) {
      // Error is already handled by useVoiceInput hook
      console.error('Failed to start listening:', err);
    }
  };
  
  const handleRetry = async () => {
    await handleStartListening();
  };
  
  const handleDismissError = () => {
    // Clear error state but keep transcript
    setErrorMessage(null);
  };

  const handleStopListening = () => {
    stopListening();
    
    // Track session stop in analytics (Requirement 15.1)
    const wordCount = editableTranscript.trim().split(/\s+/).filter(w => w.length > 0).length;
    voiceAnalytics.stopSession(wordCount);
    
    setSuccessMessage('Recording stopped successfully');
    // Announce to screen readers (Requirement 8.2)
    announce('Voice input stopped. Recording complete.', 'polite');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleClear = () => {
    if (editableTranscript.trim()) {
      setShowClearConfirm(true);
    }
  };

  const confirmClear = () => {
    resetTranscript();
    setEditableTranscript('');
    setShowClearConfirm(false);
    lastSavedTranscriptRef.current = '';
    transcriptionStorage.clear(); // Clear from local storage
    // Announce to screen readers (Requirement 8.2)
    announce('Transcription cleared.', 'polite');
    if (onTranscriptComplete) {
      onTranscriptComplete('');
    }
  };

  const cancelClear = () => {
    setShowClearConfirm(false);
  };

  const handleTranscriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setEditableTranscript(newValue);
    // Update the voice hook's transcript so it appends to the edited version
    setVoiceTranscript(newValue);
    if (onTranscriptComplete) {
      onTranscriptComplete(newValue);
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value as SupportedLanguage;
    
    // Requirement 6.3: Display warning when switching languages mid-session
    // Check if there's existing transcription and we're changing language
    if (editableTranscript.trim() && newLanguage !== language) {
      // Store the initial language if not already stored
      if (!initialLanguageRef.current) {
        initialLanguageRef.current = language as SupportedLanguage;
      }
      
      // Show warning dialog
      setPendingLanguage(newLanguage);
      setShowLanguageWarning(true);
    } else {
      // No transcription yet, safe to change language
      setLanguage(newLanguage);
      // Announce language change to screen readers
      announce(`Language changed to ${LANGUAGE_NAMES[newLanguage]}`, 'polite');
    }
  };
  
  const confirmLanguageChange = () => {
    if (pendingLanguage) {
      // Requirement 6.2: Update speech recognition language when changed
      setLanguage(pendingLanguage);
      setShowLanguageWarning(false);
      setPendingLanguage(null);
      
      // Announce language change to screen readers
      announce(`Language changed to ${LANGUAGE_NAMES[pendingLanguage]}. Previous transcription may not match the new language.`, 'polite');
    }
  };
  
  const cancelLanguageChange = () => {
    setShowLanguageWarning(false);
    setPendingLanguage(null);
  };

  const handleGenerateForm = useCallback(async () => {
    if (!onGenerateForm || !editableTranscript.trim()) return;
    
    setIsGenerating(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    // Announce to screen readers (Requirement 8.2)
    announce('Generating form from transcription. Please wait.', 'polite');
    
    const startTime = Date.now();
    
    try {
      // Requirement 6.4: Pass language to AI service for proper interpretation
      await onGenerateForm(editableTranscript, language);
      
      // Track form generation in analytics (Requirement 15.2)
      const wordCount = editableTranscript.trim().split(/\s+/).filter(w => w.length > 0).length;
      const generationTime = Date.now() - startTime;
      
      // Note: fieldsGenerated will be tracked separately when we know the actual count
      // For now, we'll estimate based on typical form generation
      voiceAnalytics.trackFormGeneration(0, wordCount, language);
      voiceAnalytics.trackPerformance('form-generation-time', generationTime);
      
      // Clear local storage after successful form generation (Requirement 14.3)
      transcriptionStorage.clear();
      lastSavedTranscriptRef.current = '';
      setSuccessMessage('Form generated successfully!');
      // Announce to screen readers (Requirement 8.2)
      announce('Form generated successfully!', 'polite');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Form generation failed:', error);
      setErrorMessage('Failed to generate form. Please try again.');
      // Announce error to screen readers (Requirement 8.4)
      announce('Failed to generate form. Please try again.', 'assertive');
      // Don't clear storage on error - preserve transcription for retry
    } finally {
      setIsGenerating(false);
    }
  }, [onGenerateForm, editableTranscript, language, announce]);

  // Auto-submit after 3 seconds of silence when listening
  useEffect(() => {
    // Clear any existing timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setAutoSubmitCountdown(null);

    // Only set up auto-submit if:
    // 1. We're listening
    // 2. We have a transcript
    // 3. The transcript has changed (user spoke something)
    // 4. onGenerateForm is available
    if (isListening && editableTranscript.trim() && editableTranscript !== lastTranscriptRef.current && onGenerateForm) {
      lastTranscriptRef.current = editableTranscript;
      
      // Start 3-second countdown
      setAutoSubmitCountdown(3);
      let countdown = 3;
      
      countdownIntervalRef.current = setInterval(() => {
        countdown -= 1;
        setAutoSubmitCountdown(countdown);
        
        if (countdown <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
        }
      }, 1000);
      
      // Auto-submit after 3 seconds
      silenceTimerRef.current = setTimeout(() => {
        if (editableTranscript.trim()) {
          // Stop listening first
          stopListening();
          // Auto-submit
          handleGenerateForm();
          announce('Silence detected. Automatically submitting your form request.', 'polite');
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
  }, [editableTranscript, isListening, onGenerateForm, stopListening, announce, handleGenerateForm]);

  const handleTutorialComplete = () => {
    voiceInputTutorial.markTutorialCompleted();
    setShowTutorial(false);
  };

  const handleTutorialSkip = () => {
    voiceInputTutorial.markTutorialCompleted();
    setShowTutorial(false);
  };

  const handleOpenHelp = () => {
    setShowHelpModal(true);
  };

  const handleCloseHelp = () => {
    setShowHelpModal(false);
  };

  const handlePrivacyAccept = () => {
    setShowPrivacyNotice(false);
    // Show tutorial after accepting privacy notice
    if (!voiceInputTutorial.hasCompletedTutorial()) {
      setShowTutorial(true);
    }
  };

  const handlePrivacyDecline = () => {
    // Disable voice input if user declines privacy notice
    voiceSettings.setEnabled(false);
    setVoiceInputEnabled(false);
    setShowPrivacyNotice(false);
  };

  // Announce errors to screen readers (Requirement 8.4)
  useEffect(() => {
    if (error) {
      announce(error.message, 'assertive');
    }
  }, [error, announce]);

  // Announce transcription updates non-intrusively (Requirement 8.5)
  // Only announce when final transcript changes, not interim results
  const lastAnnouncedTranscriptRef = useRef('');
  useEffect(() => {
    if (editableTranscript && editableTranscript !== lastAnnouncedTranscriptRef.current) {
      // Debounce announcements to avoid overwhelming screen readers
      const timeoutId = setTimeout(() => {
        const wordCount = editableTranscript.trim().split(/\s+/).length;
        announce(`Transcription updated. ${wordCount} words captured.`, 'polite');
        lastAnnouncedTranscriptRef.current = editableTranscript;
      }, 2000); // Wait 2 seconds after last change

      return () => clearTimeout(timeoutId);
    }
  }, [editableTranscript, announce]);

  // If voice input is disabled, show message
  if (!voiceInputEnabled) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-6" role="region" aria-label="Voice input controls">
        <div className="text-center py-8">
          <div className="mb-4">
            <DisabledIcon />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            Voice Input Disabled
          </h3>
          <p className="text-sm text-neutral-600 mb-4">
            Voice input has been disabled. You can re-enable it in your settings.
          </p>
          <button
            onClick={() => {
              voiceSettings.setEnabled(true);
              setVoiceInputEnabled(true);
              setShowPrivacyNotice(true);
            }}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors"
          >
            Enable Voice Input
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-6" role="region" aria-label="Voice input controls">
      {/* Privacy Notice (Requirement 9.1, 9.5) */}
      {showPrivacyNotice && (
        <VoicePrivacyNotice
          onAccept={handlePrivacyAccept}
          onDecline={handlePrivacyDecline}
        />
      )}

      {/* Header with controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-normal text-black">Voice Input</h3>
          
          {/* Help Button (Requirement 13.3) */}
          <button
            onClick={handleOpenHelp}
            className="text-neutral-400 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 rounded p-1"
            aria-label="Open voice input help and best practices"
            title="Help & Best Practices"
          >
            <HelpIcon />
          </button>
        </div>
        
        {/* Language Selector (Requirement 6.1) */}
        <select
          value={language}
          onChange={handleLanguageChange}
          disabled={Boolean(disabled || isListening)}
          className="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 focus:border-black bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Select voice input language"
          aria-describedby="language-help"
          title={isListening ? "Cannot change language while recording" : "Select language for voice recognition"}
        >
          {SUPPORTED_LANGUAGES.map((code) => (
            <option key={code} value={code}>
              {LANGUAGE_NAMES[code]}
            </option>
          ))}
        </select>
        <span id="language-help" className="sr-only">
          Choose the language for voice recognition. Currently set to {LANGUAGE_NAMES[language as SupportedLanguage]}.
        </span>
      </div>

      {/* Browser Compatibility Warning */}
      {showCompatibilityWarning && !browserSupport.speechRecognition && (
        <div className="mb-4">
          <BrowserCompatibilityWarning
            support={browserSupport}
            onDismiss={() => setShowCompatibilityWarning(false)}
          />
        </div>
      )}
      
      {/* Mobile Device Hint */}
      {browserSupport.isMobile && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs text-amber-900">
                <strong>Mobile Tip:</strong> Speak clearly and pause briefly between phrases. 
                Voice recognition will automatically restart if it stops. 
                For best results, use Safari on iOS or Chrome on Android.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Voice Controls */}
      <div className="flex items-center gap-3 mb-4">
        {/* Microphone Button */}
        {!isListening ? (
          <button
            onClick={handleStartListening}
            disabled={Boolean(disabled || !isSupported)}
            className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Start voice input recording"
            aria-pressed={isListening}
            aria-describedby="mic-button-help"
            title="Start voice input (Ctrl+Shift+V)"
          >
            <MicrophoneIcon />
            <span className="text-sm font-medium">Start Recording</span>
          </button>
        ) : (
          <button
            onClick={handleStopListening}
            disabled={disabled}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Stop voice input recording"
            aria-pressed={isListening}
            title="Stop recording"
          >
            <StopIcon />
            <span className="text-sm font-medium">Stop Recording</span>
          </button>
        )}
        <span id="mic-button-help" className="sr-only">
          Click to start recording your voice, or press Ctrl+Shift+V
        </span>

        {/* Clear Button */}
        <button
          onClick={handleClear}
          disabled={Boolean(disabled || !editableTranscript.trim())}
          className="px-4 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Clear all transcription text"
          title="Clear transcription"
        >
          <span className="text-sm font-medium">Clear</span>
        </button>

        {/* Recording Status Indicator with Audio Level */}
        {isListening && (
          <div className="flex items-center gap-3 ml-auto" role="status" aria-live="polite" aria-label="Recording in progress">
            <div className="flex items-center gap-2">
              {/* Pulsing Recording Indicator */}
              <div className="relative flex items-center justify-center" aria-hidden="true">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse-slow" />
                <div className="absolute w-3 h-3 bg-red-600 rounded-full animate-ping-slow opacity-75" />
              </div>
              
              {/* Animated Microphone Icon */}
              <div className="animate-bounce-subtle" aria-hidden="true">
                <AnimatedMicrophoneIcon />
              </div>
              
              <span className="text-sm text-neutral-600 font-medium">
                {autoSubmitCountdown !== null && autoSubmitCountdown > 0 
                  ? `Auto-submitting in ${autoSubmitCountdown}s...` 
                  : 'Recording...'}
              </span>
            </div>
            
            {/* Audio Level Meter */}
            <AudioLevelMeter level={audioLevel} />
          </div>
        )}
      </div>

      {/* Auto-submit countdown notice */}
      {autoSubmitCountdown !== null && autoSubmitCountdown > 0 && !isGenerating && (
        <div 
          className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2"
          role="status"
          aria-live="polite"
        >
          <div className="flex-1">
            <p className="text-sm text-blue-900 font-medium">
              🎤 Silence detected - Auto-submitting in {autoSubmitCountdown} second{autoSubmitCountdown !== 1 ? 's' : ''}...
            </p>
            <p className="text-xs text-blue-700 mt-0.5">
              Keep talking to cancel auto-submit, or click Stop to submit immediately
            </p>
          </div>
        </div>
      )}

      {/* Restored Session Indicator (Requirement 14.2) */}
      {restoredSession && (
        <div 
          className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2 animate-slide-in"
          role="status"
          aria-live="polite"
        >
          <RestoreIcon />
          <div className="flex-1">
            <p className="text-sm text-blue-900 font-medium">Session Restored</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Your previous transcription has been recovered. You can continue editing or generate a form.
            </p>
          </div>
          <button
            onClick={() => setRestoredSession(false)}
            className="text-blue-400 hover:text-blue-600 focus:outline-none"
            aria-label="Dismiss restored session notification"
          >
            <CloseIcon />
          </button>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div 
          className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2 animate-slide-in"
          role="status"
          aria-live="polite"
        >
          <SuccessIcon />
          <p className="text-sm text-green-900 font-medium">{successMessage}</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4">
          <VoiceErrorDisplay
            error={error}
            onRetry={error.recoverable ? handleRetry : undefined}
            onDismiss={handleDismissError}
          />
        </div>
      )}
      
      {/* Generic Error Message (for non-voice errors) */}
      {!error && errorMessage && (
        <div 
          className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 animate-slide-in"
          role="alert"
          aria-live="assertive"
        >
          <ErrorIcon />
          <div className="flex-1">
            <p className="text-sm text-red-900 font-medium">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Storage Unavailable Warning (Requirement 14.5) */}
      {!storageAvailable && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="shrink-0 mt-0.5">
              <WarningIcon />
            </div>
            <div className="flex-1">
              <p className="text-xs text-yellow-900">
                <strong>Storage Unavailable:</strong> Your transcription will not be saved automatically. 
                Make sure to generate your form before closing this page.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Reminder (Requirement 9.5) */}
      {!showPrivacyNotice && (
        <div className="mb-4 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="shrink-0 mt-0.5">
              <LockIcon />
            </div>
            <div className="flex-1">
              <p className="text-xs text-neutral-700">
                <strong>Privacy:</strong> Your speech is processed locally in your browser. 
                Only text transcriptions are sent to generate forms. 
                <button
                  onClick={handleOpenHelp}
                  className="text-blue-600 hover:text-blue-800 underline ml-1"
                  aria-label="Learn more about privacy"
                >
                  Learn more
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Transcription Display - Optimized with React.memo */}
      <div className="mb-4">
        <label htmlFor="voice-transcript" className="block text-sm font-normal text-neutral-500 mb-2">
          Transcription
        </label>
        <TranscriptionDisplay
          value={editableTranscript}
          onChange={handleTranscriptChange}
          disabled={Boolean(disabled || isListening)}
          placeholder="Click 'Start Recording' and describe your form... For example: 'I need a contact form with name, email, phone number, and a message field'"
          isListening={isListening}
          interimText={interimTranscript}
          aria-label="Voice transcription text area"
          aria-describedby="transcript-help"
        />
        
        {/* Example Phrases for Empty State (Requirement 13.2) */}
        {!editableTranscript && !isListening && (
          <div className="mt-3 space-y-2">
            <p id="transcript-help" className="text-xs font-medium text-neutral-500">
              Example phrases to try:
            </p>
            <div className="space-y-1.5">
              <ExamplePhrase text="I need a contact form with name, email, phone number, and a message field" />
              <ExamplePhrase text="Create a registration form with first name, last name, email, password, and agree to terms checkbox" />
              <ExamplePhrase text="Make a survey with a rating from 1 to 5 and a comment box" />
            </div>
            <p className="text-xs text-neutral-400 mt-2">
              💡 Tip: Speak naturally and describe the fields you need. You can edit the text after recording.
            </p>
          </div>
        )}
        
        {/* Tips During Transcription (Requirement 13.4) */}
        {editableTranscript && !isListening && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-900">
              <strong>Tip:</strong> You can edit the transcription above before generating your form. Be specific about field types and requirements for best results.
            </p>
          </div>
        )}
      </div>

      {/* Generate Form Button */}
      {onGenerateForm && (
        <button
          onClick={handleGenerateForm}
          disabled={Boolean(disabled || !editableTranscript.trim() || isGenerating || isListening)}
          className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          aria-label={isGenerating ? 'Generating form, please wait' : 'Generate form from transcription'}
          aria-busy={isGenerating}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner />
              Generating Form...
            </span>
          ) : (
            'Generate Form'
          )}
        </button>
      )}

      {/* Language Change Warning Dialog (Requirement 6.3) */}
      {showLanguageWarning && pendingLanguage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="language-dialog-title"
          aria-describedby="language-dialog-description"
        >
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-start gap-3 mb-4">
              <WarningIcon />
              <div>
                <h4 id="language-dialog-title" className="text-lg font-normal text-black mb-2">
                  Change Language?
                </h4>
                <p id="language-dialog-description" className="text-sm text-neutral-600 mb-2">
                  You have existing transcription in <strong>{LANGUAGE_NAMES[language as SupportedLanguage]}</strong>. 
                  Changing to <strong>{LANGUAGE_NAMES[pendingLanguage as SupportedLanguage]}</strong> may cause issues if your 
                  transcription doesn&apos;t match the new language.
                </p>
                <p className="text-sm text-neutral-600">
                  The AI will interpret your transcription in the new language, which may produce 
                  unexpected results if the text is in a different language.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={cancelLanguageChange}
                className="flex-1 px-4 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors"
                aria-label="Cancel language change"
              >
                Cancel
              </button>
              <button
                onClick={confirmLanguageChange}
                className="flex-1 px-4 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors"
                aria-label="Confirm language change"
              >
                Change Language
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation Dialog */}
      {showClearConfirm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-dialog-title"
          aria-describedby="clear-dialog-description"
        >
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h4 id="clear-dialog-title" className="text-lg font-normal text-black mb-2">Clear Transcription?</h4>
            <p id="clear-dialog-description" className="text-sm text-neutral-600 mb-6">
              This will remove all transcribed text. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelClear}
                className="flex-1 px-4 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors"
                aria-label="Cancel clearing transcription"
              >
                Cancel
              </button>
              <button
                onClick={confirmClear}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                aria-label="Confirm clear transcription"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen Reader Announcements */}
      <ScreenReaderAnnouncement message={announcement} priority={priority} />

      {/* Tutorial Overlay (Requirement 13.1) */}
      {showTutorial && (
        <VoiceInputTutorial
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
        />
      )}

      {/* Help Modal (Requirement 13.3, 13.4, 13.5) */}
      <VoiceInputHelpModal
        isOpen={showHelpModal}
        onClose={handleCloseHelp}
      />
    </div>
  );
}

// Helper Components
interface ExamplePhraseProps {
  text: string;
}

function ExamplePhrase({ text }: ExamplePhraseProps) {
  return (
    <div className="flex items-start gap-2 text-xs text-neutral-600">
      <span className="text-neutral-400 shrink-0 mt-0.5">•</span>
      <span className="italic">&ldquo;{text}&rdquo;</span>
    </div>
  );
}

// Icon Components
function HelpIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        cx="9"
        cy="9"
        r="7.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M9 13V12.5C9 11.5 9.5 11 10.5 10.5C11.5 10 12 9.5 12 8.5C12 7.11929 10.8807 6 9.5 6C8.11929 6 7 7.11929 7 8.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="9" cy="15" r="0.5" fill="currentColor" />
    </svg>
  );
}

function MicrophoneIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
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

function StopIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="10"
        height="10"
        rx="1"
        fill="currentColor"
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

function AnimatedMicrophoneIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="text-red-600"
    >
      <path
        d="M8 1C7.20435 1 6.44129 1.31607 5.87868 1.87868C5.31607 2.44129 5 3.20435 5 4V8C5 8.79565 5.31607 9.55871 5.87868 10.1213C6.44129 10.6839 7.20435 11 8 11C8.79565 11 9.55871 10.6839 10.1213 10.1213C10.6839 9.55871 11 8.79565 11 8V4C11 3.20435 10.6839 2.44129 10.1213 1.87868C9.55871 1.31607 8.79565 1 8 1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.2"
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

function SuccessIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="text-green-600 shrink-0"
    >
      <circle cx="10" cy="10" r="9" fill="currentColor" fillOpacity="0.1" />
      <path
        d="M6 10L8.5 12.5L14 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="text-red-600 shrink-0"
    >
      <circle cx="10" cy="10" r="9" fill="currentColor" fillOpacity="0.1" />
      <path
        d="M10 6V10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="10" cy="13" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

interface AudioLevelMeterProps {
  level: number;
}

function AudioLevelMeter({ level }: AudioLevelMeterProps) {
  // Calculate number of bars to show (0-5)
  const bars = Math.ceil((level / 100) * 5);
  
  return (
    <div 
      className="flex items-center gap-0.5" 
      role="meter"
      aria-label="Audio input level"
      aria-valuenow={Math.round(level)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${Math.round(level)} percent`}
    >
      {[1, 2, 3, 4, 5].map((bar) => (
        <div
          key={bar}
          className={`w-1 rounded-full transition-all duration-100 ${
            bar <= bars
              ? 'bg-green-500'
              : 'bg-neutral-300'
          }`}
          style={{
            height: `${8 + bar * 2}px`,
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function DisabledIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="text-neutral-400 mx-auto"
    >
      <circle
        cx="24"
        cy="24"
        r="20"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M14 14L34 34"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="text-neutral-500"
    >
      <path
        d="M12 7H4C3.44772 7 3 7.44772 3 8V13C3 13.5523 3.44772 14 4 14H12C12.5523 14 13 13.5523 13 13V8C13 7.44772 12.5523 7 12 7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 7V5C5 4.20435 5.31607 3.44129 5.87868 2.87868C6.44129 2.31607 7.20435 2 8 2C8.79565 2 9.55871 2.31607 10.1213 2.87868C10.6839 3.44129 11 4.20435 11 5V7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RestoreIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="text-blue-600 shrink-0"
    >
      <path
        d="M3 10C3 10 3 6.13401 6.13401 3C9.26801 -0.134007 13.732 -0.134007 16.866 3C20 6.13401 20 10 20 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 6V10H7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="1.5" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 4L4 12M4 4L12 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="text-yellow-600"
    >
      <path
        d="M8 1L1 14H15L8 1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 6V9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="8" cy="11.5" r="0.5" fill="currentColor" />
    </svg>
  );
}
