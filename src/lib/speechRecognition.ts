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
 * Detect if the current browser is iOS (Safari or Chrome)
 */
function isIOSDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
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
 * Detect if the current browser is Android Chrome
 */
function isAndroidChrome(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent;
  return /Android/.test(userAgent) && /Chrome/.test(userAgent);
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
  private mediaStream: MediaStream | null = null;
  private audioLevelInterval: NodeJS.Timeout | null = null;
  private isMobile: boolean = false;
  private isIOS: boolean = false;
  private isAndroid: boolean = false;
  private shouldAutoRestart: boolean = false;
  private restartAttempts: number = 0;
  private maxRestartAttempts: number = 5; // Increased for mobile reliability
  private restartTimeout: NodeJS.Timeout | null = null;
  private config: SpeechConfig | null = null;
  private lastResultTime: number = 0;
  private noResultTimeout: NodeJS.Timeout | null = null;
  private hasReceivedResult: boolean = false;

  constructor() {
    this.supported = this.detectBrowserSupport().speechRecognition;
    this.isMobile = isMobileDevice();
    this.isIOS = isIOSDevice();
    this.isAndroid = isAndroidChrome();
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
   * Request microphone permissions explicitly (important for mobile)
   * This should be called before initialize() on mobile devices
   */
  async requestMicrophonePermission(): Promise<MediaStream> {
    try {
      // Request permission with specific constraints optimized for speech
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Optimize for speech on mobile
          ...(this.isMobile ? {
            sampleRate: 16000,
            channelCount: 1,
          } : {})
        } 
      });
      
      // Store the stream for later use
      this.mediaStream = stream;
      
      return stream;
    } catch (error) {
      console.error('Microphone permission request failed:', error);
      throw createVoiceError('permission-denied', error as Error);
    }
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

      // Configure recognition settings with mobile-optimized settings
      // MOBILE FIX: On iOS, continuous mode doesn't work reliably
      // We handle this by auto-restarting when recognition ends
      if (this.isIOS) {
        // iOS: Use single-shot mode with manual restarts
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
      } else if (this.isAndroid) {
        // Android Chrome: Continuous mode works but needs restarts
        this.recognition.continuous = config.continuous;
        this.recognition.interimResults = config.interimResults;
      } else {
        // Desktop: Standard configuration
        this.recognition.continuous = config.continuous;
        this.recognition.interimResults = config.interimResults;
      }
      
      this.recognition.lang = config.language;

      // IMPROVED: Request multiple alternatives for better accuracy (3-5 alternatives)
      if ('maxAlternatives' in this.recognition) {
        this.recognition.maxAlternatives = config.maxAlternatives || 5;
      }

      // Reset state when initializing
      this.restartAttempts = 0;
      this.shouldAutoRestart = false;
      this.hasReceivedResult = false;
      this.lastResultTime = 0;

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
      
      // Start a timeout to check if we're receiving results (mobile fix)
      if (this.isMobile) {
        this.startNoResultTimeout();
      }

      if (this.callbacks.onStart) {
        this.callbacks.onStart();
      }
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (!this.callbacks.onResult) return;

      // Reset restart attempts on successful result
      this.restartAttempts = 0;
      this.hasReceivedResult = true;
      this.lastResultTime = Date.now();
      
      // Reset no-result timeout since we got a result
      if (this.isMobile) {
        this.resetNoResultTimeout();
      }

      // Process all results from the event
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];

        // Get all alternatives and pass them to callback
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
      console.warn('Speech recognition error:', event.error, 'on', this.isMobile ? 'mobile' : 'desktop');
      
      const error = createVoiceError(event);

      // MOBILE FIX: Handle errors differently on mobile
      if (this.isMobile) {
        // Don't stop on 'no-speech' error on mobile - just restart
        if (event.error === 'no-speech') {
          console.log('Mobile: no-speech error, attempting restart');
          if (this.shouldAutoRestart) {
            this.attemptRestart();
          }
          return;
        }

        // On 'aborted' error, try to restart on mobile
        if (event.error === 'aborted' && this.shouldAutoRestart) {
          console.log('Mobile: aborted error, attempting restart');
          this.attemptRestart();
          return;
        }
        
        // On 'network' error, try once more
        if (event.error === 'network' && this.restartAttempts < 2) {
          console.log('Mobile: network error, attempting restart');
          this.attemptRestart();
          return;
        }
      }

      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }

      // Stop listening on error
      this.isListening = false;
      this.shouldAutoRestart = false;
      this.clearNoResultTimeout();
    };

    this.recognition.onend = () => {
      const wasListening = this.isListening;
      this.isListening = false;
      
      this.clearNoResultTimeout();

      // MOBILE FIX: Auto-restart on mobile devices when recognition ends unexpectedly
      // Mobile browsers stop recognition after each utterance even in continuous mode
      if (this.isMobile && this.shouldAutoRestart && wasListening) {
        console.log('Mobile: recognition ended, attempting restart. Attempts:', this.restartAttempts);
        this.attemptRestart();
        return;
      }

      if (this.callbacks.onEnd) {
        this.callbacks.onEnd();
      }
    };

    // MOBILE FIX: Add additional event handlers for better mobile support
    if ('onspeechstart' in this.recognition) {
      (this.recognition as SpeechRecognition & { onspeechstart: (() => void) | null }).onspeechstart = () => {
        console.log('Mobile: speech detected');
        this.restartAttempts = 0;
        this.hasReceivedResult = true;
        
        // Reset no-result timeout since speech was detected
        if (this.isMobile) {
          this.resetNoResultTimeout();
        }
      };
    }

    if ('onaudiostart' in this.recognition) {
      (this.recognition as SpeechRecognition & { onaudiostart: (() => void) | null }).onaudiostart = () => {
        console.log('Mobile: audio capture started');
      };
    }
    
    if ('onsoundstart' in this.recognition) {
      (this.recognition as SpeechRecognition & { onsoundstart: (() => void) | null }).onsoundstart = () => {
        console.log('Mobile: sound detected');
      };
    }
  }
  
  /**
   * Start a timeout to check if we're receiving results
   * If no results after a period, restart recognition
   */
  private startNoResultTimeout(): void {
    this.clearNoResultTimeout();
    
    // On mobile, if no result in 5 seconds and still listening, restart
    this.noResultTimeout = setTimeout(() => {
      if (this.shouldAutoRestart && !this.hasReceivedResult && this.isListening) {
        console.log('Mobile: no results received, restarting recognition');
        this.forceRestart();
      }
    }, 5000);
  }
  
  /**
   * Reset the no-result timeout
   */
  private resetNoResultTimeout(): void {
    this.clearNoResultTimeout();
    
    if (this.isMobile && this.shouldAutoRestart) {
      this.startNoResultTimeout();
    }
  }
  
  /**
   * Clear the no-result timeout
   */
  private clearNoResultTimeout(): void {
    if (this.noResultTimeout) {
      clearTimeout(this.noResultTimeout);
      this.noResultTimeout = null;
    }
  }
  
  /**
   * Force restart recognition (for mobile when stuck)
   */
  private forceRestart(): void {
    if (!this.recognition || !this.config) return;
    
    try {
      // Abort current recognition
      this.recognition.abort();
    } catch (e) {
      console.warn('Error aborting recognition:', e);
    }
    
    // Re-initialize and start
    setTimeout(() => {
      if (this.shouldAutoRestart && this.config) {
        try {
          this.initialize(this.config);
          this.recognition?.start();
          this.isListening = true;
          this.hasReceivedResult = false;
          console.log('Mobile: force restarted recognition');
        } catch (error) {
          console.warn('Mobile: force restart failed:', error);
          if (this.callbacks.onEnd) {
            this.callbacks.onEnd();
          }
        }
      }
    }, 200);
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
      console.warn('Mobile: max restart attempts reached, stopping');
      this.shouldAutoRestart = false;
      this.clearNoResultTimeout();
      if (this.callbacks.onEnd) {
        this.callbacks.onEnd();
      }
      return;
    }

    this.restartAttempts++;

    // IMPROVED: Longer delay before restarting to reduce flickering
    // iOS Safari needs even longer delay to avoid rapid restart loops
    const restartDelay = this.isIOS ? 500 : 300;

    this.restartTimeout = setTimeout(() => {
      if (this.shouldAutoRestart && this.config) {
        try {
          // For iOS, we need to re-initialize the recognition object
          if (this.isIOS) {
            const SpeechRecognitionConstructor =
              window.SpeechRecognition ||
              window.webkitSpeechRecognition;
              
            this.recognition = new SpeechRecognitionConstructor();
            this.recognition.continuous = false; // iOS doesn't support continuous
            this.recognition.interimResults = true;
            this.recognition.lang = this.config.language;
            
            if ('maxAlternatives' in this.recognition) {
              this.recognition.maxAlternatives = this.config.maxAlternatives || 5;
            }
            
            // Re-setup event handlers for new recognition instance
            this.setupEventHandlers();
          }

          console.log(`Mobile: restarting recognition (attempt ${this.restartAttempts})`);
          this.recognition?.start();
          this.isListening = true;
          this.hasReceivedResult = false;
          
          // Restart the no-result timeout
          if (this.isMobile) {
            this.startNoResultTimeout();
          }
        } catch (error) {
          console.warn('Mobile: failed to restart recognition:', error);
          
          // If we get "already started" error, the recognition is still running
          const errorMessage = (error as Error).message?.toLowerCase() || '';
          if (errorMessage.includes('already started')) {
            console.log('Mobile: recognition already running');
            this.isListening = true;
            return;
          }
          
          // Try again with exponential backoff
          if (this.restartAttempts < this.maxRestartAttempts) {
            setTimeout(() => this.attemptRestart(), restartDelay * 2);
          } else {
            this.shouldAutoRestart = false;
            if (this.callbacks.onEnd) {
              this.callbacks.onEnd();
            }
          }
        }
      }
    }, restartDelay);
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
        // On mobile, ensure we have microphone permission first
        if (this.isMobile && !this.mediaStream) {
          // Request permission if not already granted
          this.requestMicrophonePermission()
            .then(() => {
              this.startRecognition(resolve, reject);
            })
            .catch(reject);
        } else {
          this.startRecognition(resolve, reject);
        }
      } catch (error) {
        const voiceError = createVoiceError('aborted', error as Error);
        reject(voiceError);
      }
    });
  }
  
  /**
   * Internal method to start recognition after permission is granted
   */
  private startRecognition(
    resolve: () => void, 
    reject: (error: VoiceError) => void
  ): void {
    if (!this.recognition) {
      reject(createVoiceError('not-supported'));
      return;
    }
    
    try {
      this.recognition.start();
      this.hasReceivedResult = false;
      this.startAudioLevelMonitoring();
      resolve();
    } catch (error) {
      const voiceError = createVoiceError('aborted', error as Error);
      reject(voiceError);
    }
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

      // Use existing stream if available (mobile optimization)
      let stream: MediaStream;
      if (this.mediaStream) {
        stream = this.mediaStream;
      } else {
        // Request microphone access with speech-optimized settings
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          } 
        });
        this.mediaStream = stream;
      }

      // Create audio context and analyser
      const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContextConstructor();
      this.analyser = this.audioContext.createAnalyser();

      // Optimize FFT size for performance (smaller = faster)
      // Use larger size on desktop for better visualization
      this.analyser.fftSize = this.isMobile ? 64 : 128;
      this.analyser.smoothingTimeConstant = 0.8; // Smooth out rapid changes

      // Connect microphone to analyser
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);

      // Pre-allocate data array to avoid repeated allocations
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      // Start monitoring audio levels with optimized calculation
      // Use longer interval on mobile to save battery
      const updateInterval = this.isMobile ? 150 : 100;
      
      this.audioLevelInterval = setInterval(() => {
        if (!this.analyser || !this.isListening) return;

        // Get frequency data (more efficient than time domain for level detection)
        this.analyser.getByteFrequencyData(dataArray);

        // Optimized average calculation using a simple loop
        let sum = 0;
        const length = dataArray.length;
        for (let i = 0; i < length; i++) {
          sum += dataArray[i];
        }

        // Calculate normalized level (0-100)
        const average = sum / length;
        const normalizedLevel = Math.min(100, (average * 100) / 255);

        if (this.callbacks.onAudioLevel) {
          this.callbacks.onAudioLevel(normalizedLevel);
        }
      }, updateInterval);
    } catch (error) {
      console.warn('Failed to start audio level monitoring:', error);
      // Don't fail the entire recognition if audio monitoring fails
    }
  }

  /**
   * Stop audio level monitoring and release media stream
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
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    
    // Release media stream tracks to stop microphone indicator
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
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
    
    // Clear no-result timeout
    this.clearNoResultTimeout();

    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
        this.stopAudioLevelMonitoring();
      } catch (error) {
        console.warn('Error stopping speech recognition:', error);
      }
    }
    
    this.isListening = false;
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
    
    // Clear no-result timeout
    this.clearNoResultTimeout();

    if (this.recognition && this.isListening) {
      try {
        this.recognition.abort();
        this.stopAudioLevelMonitoring();
      } catch (error) {
        console.warn('Error aborting speech recognition:', error);
      }
    }
    
    this.isListening = false;
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
   * Check if running on iOS
   */
  getIsIOS(): boolean {
    return this.isIOS;
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
    
    // Clear no-result timeout
    this.clearNoResultTimeout();

    this.abort();
    this.stopAudioLevelMonitoring();
    this.callbacks = {};
    this.recognition = null;
    this.config = null;
    this.hasReceivedResult = false;
    this.lastResultTime = 0;
  }
}

/**
 * Create a new speech recognition service instance
 */
export function createSpeechRecognitionService(): SpeechRecognitionService {
  return new SpeechRecognitionService();
}
