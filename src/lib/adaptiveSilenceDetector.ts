/**
 * Adaptive Silence Detector
 * Intelligently determines when user is done speaking vs just pausing
 * Prevents cutting off mid-conversation
 */

export interface SpeechPattern {
  lastSpeechTime: number;
  speechCount: number;
  averagePauseLength: number;
  isActiveConversation: boolean;
  audioLevels: number[]; // Last 10 audio level readings
}

export class AdaptiveSilenceDetector {
  private pattern: SpeechPattern = {
    lastSpeechTime: 0,
    speechCount: 0,
    averagePauseLength: 1000,
    isActiveConversation: false,
    audioLevels: [],
  };

  private silenceTimeout: NodeJS.Timeout | null = null;
  private lastAudioLevel: number = 0;
  private pauseStartTime: number = 0;
  private recentPauses: number[] = [];

  /**
   * Update with new speech detected
   */
  public onSpeechDetected(): void {
    const now = Date.now();
    
    // Calculate pause length if we were in a pause
    if (this.pauseStartTime > 0) {
      const pauseLength = now - this.pauseStartTime;
      this.recentPauses.push(pauseLength);
      
      // Keep only last 5 pauses for averaging
      if (this.recentPauses.length > 5) {
        this.recentPauses.shift();
      }
      
      // Update average pause length
      if (this.recentPauses.length > 0) {
        this.pattern.averagePauseLength = 
          this.recentPauses.reduce((a, b) => a + b, 0) / this.recentPauses.length;
      }
    }
    
    this.pattern.lastSpeechTime = now;
    this.pattern.speechCount++;
    this.pattern.isActiveConversation = true;
    this.pauseStartTime = 0;
  }

  /**
   * Update with audio level reading
   */
  public onAudioLevel(level: number): void {
    this.lastAudioLevel = level;
    
    // Track audio levels
    this.pattern.audioLevels.push(level);
    if (this.pattern.audioLevels.length > 10) {
      this.pattern.audioLevels.shift();
    }
    
    // If audio level is above threshold, consider it speech
    if (level > 15) { // Lowered threshold to catch softer speech
      this.onSpeechDetected();
    }
  }

  /**
   * Start silence detection with callback
   * Uses adaptive timeout based on speech patterns
   */
  public startDetection(onSilenceDetected: () => void): void {
    this.pauseStartTime = Date.now();
    
    const timeout = this.calculateAdaptiveTimeout();
    
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
    }
    
    this.silenceTimeout = setTimeout(() => {
      // Double-check we're really done (audio level should be low)
      const avgAudioLevel = this.getAverageAudioLevel();
      
      if (avgAudioLevel < 10) {
        // Really silent, user is done
        onSilenceDetected();
      } else {
        // Still some audio, extend timeout
        console.log('Extended timeout - still detecting audio');
        this.startDetection(onSilenceDetected);
      }
    }, timeout);
  }

  /**
   * Calculate adaptive timeout based on speech patterns
   * MUCH SMARTER than fixed timeout!
   */
  private calculateAdaptiveTimeout(): number {
    const BASE_TIMEOUT = 3000; // 3 seconds base (was causing issues before)
    
    // If user is actively conversing (multiple speech events)
    if (this.pattern.isActiveConversation && this.pattern.speechCount > 2) {
      // Use their average pause length + buffer
      // This prevents cutting off mid-conversation!
      const adaptiveTimeout = Math.max(
        BASE_TIMEOUT,
        this.pattern.averagePauseLength * 2, // 2x their normal pause
        5000 // Minimum 5 seconds during active conversation
      );
      
      console.log(`Adaptive timeout: ${adaptiveTimeout}ms (active conversation)`);
      return adaptiveTimeout;
    }
    
    // If just starting, be more patient
    if (this.pattern.speechCount <= 2) {
      console.log('Adaptive timeout: 8000ms (just started)');
      return 8000; // 8 seconds when just starting
    }
    
    // Default
    return BASE_TIMEOUT;
  }

  /**
   * Get average audio level from recent readings
   */
  private getAverageAudioLevel(): number {
    if (this.pattern.audioLevels.length === 0) return 0;
    
    const sum = this.pattern.audioLevels.reduce((a, b) => a + b, 0);
    return sum / this.pattern.audioLevels.length;
  }

  /**
   * Reset detection state
   */
  public reset(): void {
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
    
    this.pattern = {
      lastSpeechTime: 0,
      speechCount: 0,
      averagePauseLength: 1000,
      isActiveConversation: false,
      audioLevels: [],
    };
    
    this.pauseStartTime = 0;
    this.recentPauses = [];
    this.lastAudioLevel = 0;
  }

  /**
   * Stop detection
   */
  public stop(): void {
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
  }

  /**
   * Check if user is actively speaking
   */
  public isActivelySpeaking(): boolean {
    const timeSinceLastSpeech = Date.now() - this.pattern.lastSpeechTime;
    const avgAudioLevel = this.getAverageAudioLevel();
    
    // Consider actively speaking if:
    // 1. Recent speech detected (< 2 seconds ago), OR
    // 2. Audio level is high (> 15)
    return timeSinceLastSpeech < 2000 || avgAudioLevel > 15;
  }

  /**
   * Get human-readable status for debugging
   */
  public getStatus(): string {
    const avgAudioLevel = this.getAverageAudioLevel();
    const timeSinceLastSpeech = Date.now() - this.pattern.lastSpeechTime;
    
    return `Speech count: ${this.pattern.speechCount}, ` +
           `Avg pause: ${Math.round(this.pattern.averagePauseLength)}ms, ` +
           `Audio level: ${Math.round(avgAudioLevel)}, ` +
           `Time since last speech: ${Math.round(timeSinceLastSpeech)}ms`;
  }
}

/**
 * Create a new adaptive silence detector
 */
export function createAdaptiveSilenceDetector(): AdaptiveSilenceDetector {
  return new AdaptiveSilenceDetector();
}




