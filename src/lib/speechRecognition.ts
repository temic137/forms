import { SpeechConfig, VoiceError, SpeechRecognitionCallbacks, BrowserSupport, SpeechAlternative } from '@/types/voice';
import { createVoiceError } from '@/lib/voiceErrors';

/**
 * Detect if the current device is a mobile device
 */
function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || '';

  // Check for mobile user agents
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

  // Also check for touch capability as a secondary indicator
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return mobileRegex.test(userAgent) || (hasTouch && window.innerWidth < 768);
}

/**
 * Detect if the current browser is iOS Safari
 */
function isIOSSafari(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isWebkit = /WebKit/.test(userAgent);
  const isNotChrome = !/CriOS/.test(userAgent);

  return isIOS && isWebkit && isNotChrome;
}

/**
 * Wrapper service for Web Speech API with browser support detection
 */
export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private supported: boolean;
  private callbacks: SpeechRecognitionCallbacks = {};
  private isListening: boolean = false;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private audioLevelInterval: NodeJS.Timeout | null = null;
  private isMobile: boolean = false;
  private isIOS: boolean = false;
  private shouldAutoRestart: boolean = false;
  private restartAttempts: number = 0;
  private maxRestartAttempts: number = 3;
  private restartTimeout: NodeJS.Timeout | null = null;
  private config: SpeechConfig | null = null;

  constructor() {
    this.supported = this.detectBrowserSupport().speechRecognition;
    this.isMobile = isMobileDevice();
    this.isIOS = isIOSSafari();
  }

  /**
   * Detect browser support for speech recognition and related APIs
   */
  detectBrowserSupport(): BrowserSupport {
    const hasSpeechRecognition =
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    const hasWebAudioAPI =
      typeof window !== 'undefined' &&
      ('AudioContext' in window || 'webkitAudioContext' in window);

    const hasLocalStorage = typeof Storage !== 'undefined';

    let recommendedBrowser: string | undefined;
    if (!hasSpeechRecognition) {
      recommendedBrowser = 'Chrome or Edge';
    }

    // Add mobile-specific information
    const isMobileBrowser = this.isMobile;

    return {
      speechRecognition: hasSpeechRecognition,
      webAudioAPI: hasWebAudioAPI,
      localStorage: hasLocalStorage,
      recommendedBrowser,
      isMobile: isMobileBrowser,
    };
  }

  /**
   * Check if speech recognition is supported in the current browser
   */
  isSupported(): boolean {
    return this.supported;
  }

  /**
   * Initialize the speech recognition service with configuration
   */
  initialize(config: SpeechConfig): void {
    if (!this.isSupported) {
      throw createVoiceError('not-supported');
    }

    // Store config for potential restarts
    this.config = config;

    try {
      // Get the SpeechRecognition constructor (with vendor prefix support)
      const SpeechRecognitionConstructor =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

      this.recognition = new SpeechRecognitionConstructor();

      // Configure recognition settings with enhanced accuracy
      // MOBILE FIX: On mobile devices, continuous mode is unreliable
      // We handle this by auto-restarting when recognition ends unexpectedly
      this.recognition.continuous = config.continuous;
      this.recognition.interimResults = config.interimResults;
      this.recognition.lang = config.language;

      // IMPROVED: Request multiple alternatives for better accuracy (3-5 alternatives)
      // This allows us to choose the best interpretation or combine them
      if ('maxAlternatives' in this.recognition) {
        this.recognition.maxAlternatives = config.maxAlternatives || 5;
      }

      // Reset restart attempts when initializing
      this.restartAttempts = 0;
      this.shouldAutoRestart = false;

      // Set up event handlers
      this.setupEventHandlers();
    } catch (error) {
      throw createVoiceError('not-supported', error as Error);
    }
  }

  /**
   * Set up event handlers for speech recognition events
   */
  private setupEventHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.shouldAutoRestart = true;
      this.restartAttempts = 0;

      if (this.callbacks.onStart) {
        this.callbacks.onStart();
      }
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (!this.callbacks.onResult) return;

      // Reset restart attempts on successful result (speech is being recognized)
      this.restartAttempts = 0;

      // Process all results from the event
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];

        // IMPROVED: Get all alternatives and pass them to callback
        // This allows the hook to intelligently choose or combine alternatives
        const alternatives: Array<{ transcript: string; confidence: number }> = [];
        for (let j = 0; j < result.length; j++) {
          alternatives.push({
            transcript: result[j].transcript,
            confidence: result[j].confidence,
          });
        }

        // Pass primary transcript (highest confidence) and all alternatives
        const transcript = result[0].transcript;
        const isFinal = result.isFinal;
        const confidence = result[0].confidence;

        this.callbacks.onResult(transcript, isFinal, confidence, alternatives);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const error = createVoiceError(event);

      // MOBILE FIX: Don't stop on 'no-speech' error on mobile - just restart
      // Mobile browsers often fire this error prematurely
      if (this.isMobile && event.error === 'no-speech') {

        // Don't call onError for no-speech on mobile, let it restart silently
        return;
      }

      // MOBILE FIX: On 'aborted' error, try to restart on mobile
      if (this.isMobile && event.error === 'aborted' && this.shouldAutoRestart) {

        this.attemptRestart();
        return;
      }

      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }

      // Stop listening on error
      this.isListening = false;
      this.shouldAutoRestart = false;
    };

    this.recognition.onend = () => {
      const wasListening = this.isListening;
      this.isListening = false;

      // MOBILE FIX: Auto-restart on mobile devices when recognition ends unexpectedly
      // Mobile browsers (especially iOS Safari) stop recognition after each utterance
      // even when continuous mode is enabled
      if (this.isMobile && this.shouldAutoRestart && wasListening) {

        this.attemptRestart();
        return;
      }

      if (this.callbacks.onEnd) {
        this.callbacks.onEnd();
      }
    };

    // MOBILE FIX: Add additional event handlers for better mobile support
    // onspeechstart helps us know when speech is detected
    if ('onspeechstart' in this.recognition) {
      (this.recognition as SpeechRecognition & { onspeechstart: (() => void) | null }).onspeechstart = () => {

        this.restartAttempts = 0;
      };
    }

    // onaudiostart helps us know when audio capture has started
    if ('onaudiostart' in this.recognition) {
      (this.recognition as SpeechRecognition & { onaudiostart: (() => void) | null }).onaudiostart = () => {

      };
    }
  }

  /**
   * Attempt to restart speech recognition on mobile devices
   * MOBILE FIX: This handles the case where mobile browsers stop recognition
   * after each utterance even in continuous mode
   */
  private attemptRestart(): void {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
    }

    if (this.restartAttempts >= this.maxRestartAttempts) {

      this.shouldAutoRestart = false;
      if (this.callbacks.onEnd) {
        this.callbacks.onEnd();
      }
      return;
    }

    this.restartAttempts++;

    // Small delay before restarting to avoid rapid restart loops
    this.restartTimeout = setTimeout(() => {
      if (this.shouldAutoRestart && this.recognition && this.config) {
        try {

          this.recognition.start();
          this.isListening = true;
        } catch (error) {
          console.warn('Mobile: failed to restart recognition:', error);
          // If restart fails, notify the end
          if (this.callbacks.onEnd) {
            this.callbacks.onEnd();
          }
        }
      }
    }, 100); // 100ms delay for iOS Safari compatibility
  }

  /**
   * Start listening for speech input
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(createVoiceError('not-supported'));
        return;
      }

      if (this.isListening) {
        resolve();
        return;
      }

      try {
        this.recognition.start();
        this.startAudioLevelMonitoring();
        resolve();
      } catch (error) {
        const voiceError = createVoiceError('aborted', error as Error);
        reject(voiceError);
      }
    });
  }

  /**
   * Start monitoring audio levels for visual feedback
   * Optimized for performance with reduced FFT size and efficient calculations
   * 
   * Requirement 12.5: Optimize audio level calculations
   */
  private async startAudioLevelMonitoring(): Promise<void> {
    try {
      // Check if mediaDevices is available (requires HTTPS or localhost)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('MediaDevices API not available. Audio level monitoring disabled.');
        return;
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create audio context and analyser
      const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContextConstructor();
      this.analyser = this.audioContext.createAnalyser();

      // Optimize FFT size for performance (smaller = faster)
      // 128 is sufficient for audio level visualization
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.8; // Smooth out rapid changes

      // Connect microphone to analyser
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);

      // Pre-allocate data array to avoid repeated allocations
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      // Start monitoring audio levels with optimized calculation
      this.audioLevelInterval = setInterval(() => {
        if (!this.analyser || !this.isListening) return;

        // Get frequency data (more efficient than time domain for level detection)
        this.analyser.getByteFrequencyData(dataArray);

        // Optimized average calculation using a simple loop
        // Faster than reduce() for small arrays
        let sum = 0;
        const length = dataArray.length;
        for (let i = 0; i < length; i++) {
          sum += dataArray[i];
        }

        // Calculate normalized level (0-100)
        // Use bitwise operations for faster division
        const average = sum / length;
        const normalizedLevel = Math.min(100, (average * 100) / 255);

        if (this.callbacks.onAudioLevel) {
          this.callbacks.onAudioLevel(normalizedLevel);
        }
      }, 100); // Update every 100ms (balanced between responsiveness and performance)
    } catch (error) {
      console.warn('Failed to start audio level monitoring:', error);
      // Don't fail the entire recognition if audio monitoring fails
    }
  }

  /**
   * Stop audio level monitoring
   */
  private stopAudioLevelMonitoring(): void {
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
    }

    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
  }

  /**
   * Stop listening for speech input (graceful stop)
   */
  stop(): void {
    // Disable auto-restart when explicitly stopping
    this.shouldAutoRestart = false;

    // Clear any pending restart timeout
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
        this.stopAudioLevelMonitoring();
      } catch (error) {
        console.warn('Error stopping speech recognition:', error);
      }
    }
  }

  /**
   * Abort speech recognition immediately
   */
  abort(): void {
    // Disable auto-restart when aborting
    this.shouldAutoRestart = false;

    // Clear any pending restart timeout
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    if (this.recognition && this.isListening) {
      try {
        this.recognition.abort();
        this.stopAudioLevelMonitoring();
      } catch (error) {
        console.warn('Error aborting speech recognition:', error);
      }
    }
  }

  /**
   * Register callback for speech recognition results
   */
  onResult(callback: (transcript: string, isFinal: boolean, confidence?: number, alternatives?: SpeechAlternative[]) => void): void {
    this.callbacks.onResult = callback;
  }

  /**
   * Register callback for speech recognition errors
   */
  onError(callback: (error: VoiceError) => void): void {
    this.callbacks.onError = callback;
  }

  /**
   * Register callback for speech recognition end event
   */
  onEnd(callback: () => void): void {
    this.callbacks.onEnd = callback;
  }

  /**
   * Register callback for speech recognition start event
   */
  onStart(callback: () => void): void {
    this.callbacks.onStart = callback;
  }

  /**
   * Register callback for audio level updates
   */
  onAudioLevel(callback: (level: number) => void): void {
    this.callbacks.onAudioLevel = callback;
  }

  /**
   * Get current listening status
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Check if running on a mobile device
   */
  getIsMobile(): boolean {
    return this.isMobile;
  }

  /**
   * Clean up and dispose of the speech recognition instance
   */
  dispose(): void {
    // Disable auto-restart
    this.shouldAutoRestart = false;

    // Clear any pending restart timeout
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    this.abort();
    this.stopAudioLevelMonitoring();
    this.callbacks = {};
    this.recognition = null;
    this.config = null;
  }
}

/**
 * Create a new speech recognition service instance
 */
export function createSpeechRecognitionService(): SpeechRecognitionService {
  return new SpeechRecognitionService();
}
