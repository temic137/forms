/**
 * Voice input error types based on Web Speech API error codes
 */
export type VoiceErrorType =
  | 'not-supported'
  | 'permission-denied'
  | 'network'
  | 'no-speech'
  | 'aborted'
  | 'audio-capture'
  | 'service-not-allowed';

/**
 * Voice input error with recovery information
 */
export interface VoiceError {
  type: VoiceErrorType;
  message: string;
  recoverable: boolean;
  originalError?: Error;
}

/**
 * Speech recognition configuration
 */
export interface SpeechConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives?: number;
}

/**
 * Browser support detection result
 */
export interface BrowserSupport {
  speechRecognition: boolean;
  webAudioAPI: boolean;
  localStorage: boolean;
  recommendedBrowser?: string;
}

/**
 * Speech recognition alternative result
 */
export interface SpeechAlternative {
  transcript: string;
  confidence: number;
}

/**
 * Speech recognition event callbacks
 */
export interface SpeechRecognitionCallbacks {
  onResult?: (
    transcript: string, 
    isFinal: boolean, 
    confidence?: number,
    alternatives?: SpeechAlternative[]
  ) => void;
  onError?: (error: VoiceError) => void;
  onEnd?: () => void;
  onStart?: () => void;
  onAudioLevel?: (level: number) => void;
}
