import { VoiceError, VoiceErrorType } from '@/types/voice';

/**
 * Error recovery strategy for each error type
 */
export interface ErrorRecoveryStrategy {
  type: VoiceErrorType;
  userMessage: string;
  action: 'retry' | 'fallback' | 'manual-input' | 'check-settings';
  retryable: boolean;
}

/**
 * Predefined error recovery strategies
 */
export const ERROR_STRATEGIES: Record<VoiceErrorType, ErrorRecoveryStrategy> = {
  'not-supported': {
    type: 'not-supported',
    userMessage: 'Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.',
    action: 'manual-input',
    retryable: false,
  },
  'permission-denied': {
    type: 'permission-denied',
    userMessage: 'Microphone access was denied. Please enable microphone permissions in your browser settings.',
    action: 'check-settings',
    retryable: true,
  },
  'no-speech': {
    type: 'no-speech',
    userMessage: 'No speech detected. Please try speaking again.',
    action: 'retry',
    retryable: true,
  },
  'network': {
    type: 'network',
    userMessage: 'Network error occurred. Please check your connection and try again.',
    action: 'retry',
    retryable: true,
  },
  'aborted': {
    type: 'aborted',
    userMessage: 'Voice input was stopped. Click the microphone to start again.',
    action: 'retry',
    retryable: true,
  },
  'audio-capture': {
    type: 'audio-capture',
    userMessage: 'Could not access your microphone. Please check your audio settings.',
    action: 'check-settings',
    retryable: true,
  },
  'service-not-allowed': {
    type: 'service-not-allowed',
    userMessage: 'Speech recognition service is not allowed. Please check your browser settings.',
    action: 'check-settings',
    retryable: true,
  },
};

/**
 * Create a VoiceError from a Web Speech API error event
 */
export function createVoiceError(
  errorEvent: SpeechRecognitionErrorEvent | string,
  originalError?: Error
): VoiceError {
  let errorType: VoiceErrorType;
  
  if (typeof errorEvent === 'string') {
    errorType = errorEvent as VoiceErrorType;
  } else {
    // Map Web Speech API error codes to our error types
    switch (errorEvent.error) {
      case 'not-allowed':
        errorType = 'permission-denied';
        break;
      case 'no-speech':
        errorType = 'no-speech';
        break;
      case 'network':
        errorType = 'network';
        break;
      case 'aborted':
        errorType = 'aborted';
        break;
      case 'audio-capture':
        errorType = 'audio-capture';
        break;
      case 'service-not-allowed':
        errorType = 'service-not-allowed';
        break;
      default:
        errorType = 'aborted';
    }
  }

  const strategy = ERROR_STRATEGIES[errorType];
  
  return {
    type: errorType,
    message: strategy.userMessage,
    recoverable: strategy.retryable,
    originalError,
  };
}

/**
 * Get recovery strategy for a voice error
 */
export function getRecoveryStrategy(error: VoiceError): ErrorRecoveryStrategy {
  return ERROR_STRATEGIES[error.type];
}
