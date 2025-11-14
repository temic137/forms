/**
 * Voice input utilities - main export file
 * Provides easy access to voice input infrastructure
 */

export { SpeechRecognitionService, createSpeechRecognitionService } from './speechRecognition';
export { createVoiceError, getRecoveryStrategy, ERROR_STRATEGIES } from './voiceErrors';
export type { ErrorRecoveryStrategy } from './voiceErrors';
export type {
  VoiceError,
  VoiceErrorType,
  SpeechConfig,
  BrowserSupport,
  SpeechRecognitionCallbacks,
} from '@/types/voice';
