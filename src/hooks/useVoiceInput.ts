import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SpeechRecognitionService } from '@/lib/speechRecognition';
import { VoiceError } from '@/types/voice';
import { debounce } from '@/lib/debounce';
import { performanceMonitor } from '@/lib/performanceMonitor';
import { voiceAnalytics } from '@/lib/voiceAnalytics';

/**
 * Configuration options for the useVoiceInput hook
 */
export interface UseVoiceInputConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  initialTranscript?: string;
  onTranscriptChange?: (transcript: string) => void;
  onError?: (error: VoiceError) => void;
}

/**
 * Return type for the useVoiceInput hook
 */
export interface UseVoiceInputReturn {
  // State
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: VoiceError | null;
  isSupported: boolean;
  audioLevel: number;
  isMobile: boolean;
  
  // Controls
  startListening: () => Promise<void>;
  stopListening: () => void;
  resetTranscript: () => void;
  setTranscript: (transcript: string) => void;
  
  // Configuration
  language: string;
  setLanguage: (lang: string) => void;
}

/**
 * Custom React hook for voice input using Web Speech API
 * 
 * Provides state management for listening status, transcript accumulation,
 * error handling, and language configuration.
 * 
 * @param config - Configuration options for voice input
 * @returns Voice input state and control functions
 */
export function useVoiceInput(config: UseVoiceInputConfig = {}): UseVoiceInputReturn {
  const {
    language: initialLanguage = 'en-US',
    continuous = true,
    interimResults = true,
    initialTranscript = '',
    onTranscriptChange,
    onError: onErrorCallback,
  } = config;

  // State management
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState(initialTranscript);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<VoiceError | null>(null);
  const [language, setLanguage] = useState(initialLanguage);
  const [audioLevel, setAudioLevel] = useState(0);

  // Refs to maintain transcript state and avoid stale closures
  const finalTranscriptRef = useRef(initialTranscript);
  
  // No-speech timeout handling (Requirement 10.2: auto-pause after 10 seconds)
  const noSpeechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechTimeRef = useRef<number>(0);
  
  // Mobile-specific refs
  const mobileRetryCountRef = useRef(0);
  const maxMobileRetries = 3;
  
  // Initialize service once using useMemo
  const service = useMemo(() => {
    if (typeof window !== 'undefined') {
      return new SpeechRecognitionService();
    }
    return {
      isSupported: () => false,
      dispose: () => {},
      initialize: () => {},
      start: async () => {},
      stop: () => {},
      onResult: () => {},
      onError: () => {},
      onEnd: () => {},
      onStart: () => {},
      onAudioLevel: () => {},
      getIsMobile: () => false,
      getIsIOS: () => false,
      requestMicrophonePermission: async () => { throw new Error('Not supported'); },
    } as unknown as SpeechRecognitionService;
  }, []);

  const [isSupported, setIsSupported] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsSupported(service.isSupported());
    setIsMobile(service.getIsMobile());
  }, [service]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Clear no-speech timeout
      if (noSpeechTimeoutRef.current) {
        clearTimeout(noSpeechTimeoutRef.current);
      }
      
      // Cleanup on unmount
      service.dispose();
    };
  }, [service]);

  /**
   * Reset no-speech timeout
   */
  const resetNoSpeechTimeout = useCallback(() => {
    // Clear existing timeout
    if (noSpeechTimeoutRef.current) {
      clearTimeout(noSpeechTimeoutRef.current);
    }
    
    // Update last speech time
    lastSpeechTimeRef.current = Date.now();
    
    // Shorter timeout on mobile (8 seconds) vs desktop (10 seconds)
    const timeoutDuration = isMobile ? 8000 : 10000;
    
    // Set new timeout
    noSpeechTimeoutRef.current = setTimeout(() => {
      // Auto-pause if no speech detected
      service.stop();
      
      const noSpeechError: VoiceError = {
        type: 'no-speech',
        message: isMobile 
          ? 'No speech detected. Tap the microphone to try again.'
          : 'No speech detected for 10 seconds. Recording paused automatically.',
        recoverable: true,
      };
      
      setError(noSpeechError);
      setIsListening(false);
      
      if (onErrorCallback) {
        onErrorCallback(noSpeechError);
      }
    }, timeoutDuration);
  }, [service, onErrorCallback, isMobile]);

  /**
   * Debounced interim transcript update for performance optimization
   * Requirement 12.1: Debounce interim transcription updates (100ms)
   */
  const debouncedSetInterimTranscript = useMemo(
    () => debounce((text: string) => setInterimTranscript(text), 100),
    []
  );

  /**
   * Handle transcript accumulation from speech recognition results
   * Optimized with debouncing for interim results
   */
  const handleResult = useCallback((newTranscript: string, isFinal: boolean) => {
    // Reset no-speech timeout on any speech detection
    resetNoSpeechTimeout();
    
    if (isFinal) {
      // Track transcription latency (Requirement 12.2: < 1s)
      performanceMonitor.mark('transcription-latency');
      
      // Append final result to accumulated transcript
      const updatedTranscript = finalTranscriptRef.current 
        ? `${finalTranscriptRef.current} ${newTranscript}`.trim()
        : newTranscript;
      
      finalTranscriptRef.current = updatedTranscript;
      setTranscript(updatedTranscript);
      setInterimTranscript(''); // Clear interim immediately for final results

      // Measure transcription latency
      const latency = performanceMonitor.measure('transcription-latency');
      if (latency && latency > 1000) {
        console.warn(`Transcription latency ${latency.toFixed(0)}ms (target: <1000ms)`);
      }

      // Track performance metric in analytics (Requirement 15.2)
      if (latency) {
        voiceAnalytics.trackPerformance('transcription-latency', latency);
      }

      // Notify parent component of transcript change
      if (onTranscriptChange) {
        onTranscriptChange(updatedTranscript);
      }
    } else {
      // Update interim transcript with debouncing to reduce re-renders
      // This prevents excessive updates during rapid speech recognition
      debouncedSetInterimTranscript(newTranscript);
    }
  }, [onTranscriptChange, resetNoSpeechTimeout, debouncedSetInterimTranscript]);

  /**
   * Handle speech recognition errors
   */
  const handleError = useCallback((voiceError: VoiceError) => {
    // On mobile, some errors are expected and should trigger retry
    if (isMobile && voiceError.type === 'no-speech' && mobileRetryCountRef.current < maxMobileRetries) {
      mobileRetryCountRef.current++;
      console.log(`Mobile: no-speech error, retry ${mobileRetryCountRef.current}/${maxMobileRetries}`);
      // Don't set error state for mobile no-speech, let it restart
      return;
    }
    
    setError(voiceError);
    setIsListening(false);
    
    // Reset mobile retry count on actual error
    mobileRetryCountRef.current = 0;

    // Track error in analytics (Requirement 15.3)
    voiceAnalytics.trackError(
      voiceError.type,
      voiceError.message,
      voiceError.recoverable
    );

    // Notify parent component of error
    if (onErrorCallback) {
      onErrorCallback(voiceError);
    }
  }, [onErrorCallback, isMobile]);

  /**
   * Handle speech recognition end event
   */
  const handleEnd = useCallback(() => {
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  /**
   * Handle speech recognition start event
   */
  const handleStart = useCallback(() => {
    setIsListening(true);
    setError(null);
    
    // Reset mobile retry count on successful start
    mobileRetryCountRef.current = 0;
    
    // Start no-speech timeout when listening begins
    resetNoSpeechTimeout();
  }, [resetNoSpeechTimeout]);

  /**
   * Handle audio level updates
   */
  const handleAudioLevel = useCallback((level: number) => {
    setAudioLevel(level);
  }, []);

  /**
   * Initialize or reinitialize the service with current configuration
   */
  const initializeService = useCallback(() => {
    try {
      service.initialize({
        language,
        continuous,
        interimResults,
      });

      // Register event callbacks
      service.onResult(handleResult);
      service.onError(handleError);
      service.onEnd(handleEnd);
      service.onStart(handleStart);
      service.onAudioLevel(handleAudioLevel);
    } catch (err) {
      const voiceError = err as VoiceError;
      setError(voiceError);
      if (onErrorCallback) {
        onErrorCallback(voiceError);
      }
    }
  }, [service, language, continuous, interimResults, handleResult, handleError, handleEnd, handleStart, handleAudioLevel, onErrorCallback]);

  /**
   * Start listening for speech input
   * Includes performance monitoring (Requirement 12.1)
   */
  const startListening = useCallback(async () => {
    if (!isSupported) {
      const notSupportedError: VoiceError = {
        type: 'not-supported',
        message: isMobile 
          ? 'Voice input is not supported in this browser. Try Safari on iOS or Chrome on Android.'
          : 'Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.',
        recoverable: false,
      };
      setError(notSupportedError);
      if (onErrorCallback) {
        onErrorCallback(notSupportedError);
      }
      return;
    }

    // Clear any previous errors
    setError(null);
    
    // Reset mobile retry count
    mobileRetryCountRef.current = 0;

    // Track voice input activation time (Requirement 12.1: < 500ms)
    performanceMonitor.mark('voice-activation');

    // Initialize service with current configuration
    initializeService();

    try {
      // On mobile, request microphone permission first for better UX
      if (isMobile) {
        try {
          await service.requestMicrophonePermission();
        } catch {
          // If permission denied, show specific error
          const permissionError: VoiceError = {
            type: 'permission-denied',
            message: 'Microphone access is required. Please allow microphone permissions in your browser settings.',
            recoverable: true,
          };
          setError(permissionError);
          if (onErrorCallback) {
            onErrorCallback(permissionError);
          }
          return;
        }
      }
      
      await service.start();
      
      // Measure activation time
      const activationTime = performanceMonitor.measure('voice-activation');
      if (activationTime && activationTime > 500) {
        console.warn(`Voice activation took ${activationTime.toFixed(0)}ms (target: <500ms)`);
      }

      // Track performance metric in analytics (Requirement 15.2)
      if (activationTime) {
        voiceAnalytics.trackPerformance('voice-activation', activationTime);
      }
    } catch (err) {
      const voiceError = err as VoiceError;
      setError(voiceError);
      setIsListening(false);
      if (onErrorCallback) {
        onErrorCallback(voiceError);
      }
    }
  }, [service, isSupported, isMobile, initializeService, onErrorCallback]);

  /**
   * Stop listening for speech input
   */
  const stopListening = useCallback(() => {
    // Clear no-speech timeout
    if (noSpeechTimeoutRef.current) {
      clearTimeout(noSpeechTimeoutRef.current);
      noSpeechTimeoutRef.current = null;
    }
    
    service.stop();
  }, [service]);

  /**
   * Reset transcript to empty state
   */
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';
    
    if (onTranscriptChange) {
      onTranscriptChange('');
    }
  }, [onTranscriptChange]);

  /**
   * Update transcript manually (for edits)
   * This allows preserving manual edits when resuming voice input
   */
  const updateTranscript = useCallback((newTranscript: string) => {
    setTranscript(newTranscript);
    finalTranscriptRef.current = newTranscript;
    
    if (onTranscriptChange) {
      onTranscriptChange(newTranscript);
    }
  }, [onTranscriptChange]);

  /**
   * Update language configuration
   * Note: Language change requires restarting the recognition service
   */
  const updateLanguage = useCallback((newLanguage: string) => {
    const wasListening = isListening;
    
    // Stop current session if listening
    if (wasListening) {
      service.stop();
    }

    // Update language
    setLanguage(newLanguage);

    // Restart if was listening
    if (wasListening) {
      // Wait for stop to complete before restarting
      setTimeout(() => {
        startListening();
      }, 100);
    }
  }, [service, isListening, startListening]);

  return {
    // State
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    audioLevel,
    isMobile,
    
    // Controls
    startListening,
    stopListening,
    resetTranscript,
    setTranscript: updateTranscript,
    
    // Configuration
    language,
    setLanguage: updateLanguage,
  };
}
