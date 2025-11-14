/**
 * Voice Input Analytics Service
 * 
 * Tracks voice session events, performance metrics, and errors
 * for monitoring and improving the voice input feature.
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
 */

export interface VoiceSessionEvent {
  type: 'start' | 'stop' | 'error' | 'generate';
  timestamp: number;
  sessionId: string;
  data?: Record<string, string | number | boolean>;
}

export interface VoicePerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  sessionId?: string;
}

export interface VoiceErrorLog {
  type: string;
  message: string;
  timestamp: number;
  sessionId?: string;
  recoverable: boolean;
}

export interface VoiceSessionSummary {
  sessionId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  language: string;
  wordCount: number;
  fieldsGenerated?: number;
  errors: number;
  success: boolean;
}

export interface VoiceUsageStatistics {
  totalSessions: number;
  successfulSessions: number;
  totalDuration: number;
  averageDuration: number;
  totalFormsGenerated: number;
  totalWords: number;
  averageWords: number;
  errorRate: number;
  languageDistribution: Record<string, number>;
  browserCompatibilityIssues: number;
  lastUsed?: number;
}

class VoiceAnalyticsService {
  private readonly STORAGE_KEY = 'voice_analytics';
  private readonly MAX_EVENTS = 1000; // Keep last 1000 events
  private readonly MAX_METRICS = 1000;
  private readonly MAX_ERRORS = 500;
  private readonly MAX_SESSIONS = 100;
  
  private enabled: boolean = true;
  private currentSessionId: string | null = null;
  private currentSessionStart: number | null = null;

  /**
   * Check if analytics is enabled
   * Safe for SSR - returns true if localStorage is not available
   */
  isEnabled(): boolean {
    // Check if we're in a browser environment (localStorage is not available during SSR)
    if (typeof window === 'undefined') {
      return true; // Default to enabled during SSR
    }

    try {
      const settings = localStorage.getItem('voice_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        // Default to true if not explicitly set
        return parsed.analyticsEnabled !== false;
      }
      return true;
    } catch {
      return true;
    }
  }

  /**
   * Enable or disable analytics tracking
   * Requirement 15.5: Respect user preference for analytics opt-out
   * Safe for SSR - no-op if localStorage is not available
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    
    // Check if we're in a browser environment (localStorage is not available during SSR)
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const settings = localStorage.getItem('voice_settings');
      const parsed = settings ? JSON.parse(settings) : {};
      parsed.analyticsEnabled = enabled;
      localStorage.setItem('voice_settings', JSON.stringify(parsed));
    } catch (error) {
      console.warn('Failed to save analytics preference:', error);
    }
  }

  /**
   * Start a new voice session
   * Requirement 15.1: Track voice session events
   */
  startSession(sessionId: string, language: string): void {
    if (!this.isEnabled()) return;

    this.currentSessionId = sessionId;
    this.currentSessionStart = Date.now();

    const event: VoiceSessionEvent = {
      type: 'start',
      timestamp: Date.now(),
      sessionId,
      data: { language },
    };

    this.saveEvent(event);
  }

  /**
   * End the current voice session
   * Requirement 15.1: Track voice session events
   */
  stopSession(wordCount: number): void {
    if (!this.isEnabled() || !this.currentSessionId) return;

    const event: VoiceSessionEvent = {
      type: 'stop',
      timestamp: Date.now(),
      sessionId: this.currentSessionId,
      data: { 
        wordCount,
        duration: this.currentSessionStart ? Date.now() - this.currentSessionStart : 0,
      },
    };

    this.saveEvent(event);
  }

  /**
   * Track form generation from voice
   * Requirement 15.2: Track number of fields generated
   */
  trackFormGeneration(fieldsGenerated: number, wordCount: number, language: string): void {
    if (!this.isEnabled() || !this.currentSessionId) return;

    const event: VoiceSessionEvent = {
      type: 'generate',
      timestamp: Date.now(),
      sessionId: this.currentSessionId,
      data: {
        fieldsGenerated,
        wordCount,
        language,
        duration: this.currentSessionStart ? Date.now() - this.currentSessionStart : 0,
      },
    };

    this.saveEvent(event);

    // Save session summary
    const summary: VoiceSessionSummary = {
      sessionId: this.currentSessionId,
      startTime: this.currentSessionStart || Date.now(),
      endTime: Date.now(),
      duration: this.currentSessionStart ? Date.now() - this.currentSessionStart : 0,
      language,
      wordCount,
      fieldsGenerated,
      errors: 0,
      success: true,
    };

    this.saveSessionSummary(summary);

    // Reset current session
    this.currentSessionId = null;
    this.currentSessionStart = null;
  }

  /**
   * Track voice input errors
   * Requirement 15.3: Track error types and frequencies
   */
  trackError(errorType: string, errorMessage: string, recoverable: boolean): void {
    if (!this.isEnabled()) return;

    const event: VoiceSessionEvent = {
      type: 'error',
      timestamp: Date.now(),
      sessionId: this.currentSessionId || 'unknown',
      data: {
        errorType,
        errorMessage,
        recoverable,
      },
    };

    this.saveEvent(event);

    const errorLog: VoiceErrorLog = {
      type: errorType,
      message: errorMessage,
      timestamp: Date.now(),
      sessionId: this.currentSessionId || undefined,
      recoverable,
    };

    this.saveError(errorLog);
  }

  /**
   * Track performance metrics
   * Requirement 15.2: Log performance metrics (latency, duration)
   */
  trackPerformance(metricName: string, value: number): void {
    if (!this.isEnabled()) return;

    const metric: VoicePerformanceMetric = {
      name: metricName,
      value,
      timestamp: Date.now(),
      sessionId: this.currentSessionId || undefined,
    };

    this.saveMetric(metric);
  }

  /**
   * Track browser compatibility issues
   * Requirement 15.4: Monitor browser compatibility issues
   */
  trackBrowserCompatibility(browserInfo: string, supported: boolean): void {
    if (!this.isEnabled()) return;

    const event: VoiceSessionEvent = {
      type: 'error',
      timestamp: Date.now(),
      sessionId: 'compatibility-check',
      data: {
        errorType: 'browser-compatibility',
        browserInfo,
        supported,
      },
    };

    this.saveEvent(event);

    if (!supported) {
      const errorLog: VoiceErrorLog = {
        type: 'browser-compatibility',
        message: `Browser not supported: ${browserInfo}`,
        timestamp: Date.now(),
        recoverable: false,
      };

      this.saveError(errorLog);
    }
  }

  /**
   * Get usage statistics
   * Requirement 15.3: Display voice input usage statistics
   */
  getUsageStatistics(): VoiceUsageStatistics {
    const sessions = this.getSessionSummaries();
    const errors = this.getErrors();

    const totalSessions = sessions.length;
    const successfulSessions = sessions.filter(s => s.success).length;
    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalFormsGenerated = sessions.filter(s => s.fieldsGenerated).length;
    const totalWords = sessions.reduce((sum, s) => sum + s.wordCount, 0);

    // Language distribution
    const languageDistribution: Record<string, number> = {};
    sessions.forEach(s => {
      languageDistribution[s.language] = (languageDistribution[s.language] || 0) + 1;
    });

    // Browser compatibility issues
    const browserCompatibilityIssues = errors.filter(
      e => e.type === 'browser-compatibility'
    ).length;

    // Last used timestamp
    const lastUsed = sessions.length > 0 
      ? Math.max(...sessions.map(s => s.startTime))
      : undefined;

    return {
      totalSessions,
      successfulSessions,
      totalDuration,
      averageDuration: totalSessions > 0 ? totalDuration / totalSessions : 0,
      totalFormsGenerated,
      totalWords,
      averageWords: totalSessions > 0 ? totalWords / totalSessions : 0,
      errorRate: totalSessions > 0 ? (totalSessions - successfulSessions) / totalSessions : 0,
      languageDistribution,
      browserCompatibilityIssues,
      lastUsed,
    };
  }

  /**
   * Get error frequency by type
   */
  getErrorFrequency(): Record<string, number> {
    const errors = this.getErrors();
    const frequency: Record<string, number> = {};

    errors.forEach(error => {
      frequency[error.type] = (frequency[error.type] || 0) + 1;
    });

    return frequency;
  }

  /**
   * Get performance metrics summary
   */
  getPerformanceMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const metrics = this.getMetrics();
    const summary: Record<string, { avg: number; min: number; max: number; count: number }> = {};

    metrics.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          avg: 0,
          min: metric.value,
          max: metric.value,
          count: 0,
        };
      }

      const s = summary[metric.name];
      s.avg = (s.avg * s.count + metric.value) / (s.count + 1);
      s.min = Math.min(s.min, metric.value);
      s.max = Math.max(s.max, metric.value);
      s.count++;
    });

    return summary;
  }

  /**
   * Clear all analytics data
   * Safe for SSR - no-op if localStorage is not available
   */
  clearAll(): void {
    // Check if we're in a browser environment (localStorage is not available during SSR)
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem(`${this.STORAGE_KEY}_events`);
      localStorage.removeItem(`${this.STORAGE_KEY}_metrics`);
      localStorage.removeItem(`${this.STORAGE_KEY}_errors`);
      localStorage.removeItem(`${this.STORAGE_KEY}_sessions`);
    } catch (error) {
      console.warn('Failed to clear analytics data:', error);
    }
  }

  // Private helper methods

  private saveEvent(event: VoiceSessionEvent): void {
    // Check if we're in a browser environment (localStorage is not available during SSR)
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const events = this.getEvents();
      events.push(event);

      // Keep only last MAX_EVENTS
      const trimmed = events.slice(-this.MAX_EVENTS);
      localStorage.setItem(`${this.STORAGE_KEY}_events`, JSON.stringify(trimmed));
    } catch (error) {
      console.warn('Failed to save analytics event:', error);
    }
  }

  private saveMetric(metric: VoicePerformanceMetric): void {
    // Check if we're in a browser environment (localStorage is not available during SSR)
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const metrics = this.getMetrics();
      metrics.push(metric);

      // Keep only last MAX_METRICS
      const trimmed = metrics.slice(-this.MAX_METRICS);
      localStorage.setItem(`${this.STORAGE_KEY}_metrics`, JSON.stringify(trimmed));
    } catch (error) {
      console.warn('Failed to save performance metric:', error);
    }
  }

  private saveError(error: VoiceErrorLog): void {
    // Check if we're in a browser environment (localStorage is not available during SSR)
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const errors = this.getErrors();
      errors.push(error);

      // Keep only last MAX_ERRORS
      const trimmed = errors.slice(-this.MAX_ERRORS);
      localStorage.setItem(`${this.STORAGE_KEY}_errors`, JSON.stringify(trimmed));
    } catch (error) {
      console.warn('Failed to save error log:', error);
    }
  }

  private saveSessionSummary(summary: VoiceSessionSummary): void {
    // Check if we're in a browser environment (localStorage is not available during SSR)
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const sessions = this.getSessionSummaries();
      sessions.push(summary);

      // Keep only last MAX_SESSIONS
      const trimmed = sessions.slice(-this.MAX_SESSIONS);
      localStorage.setItem(`${this.STORAGE_KEY}_sessions`, JSON.stringify(trimmed));
    } catch (error) {
      console.warn('Failed to save session summary:', error);
    }
  }

  private getEvents(): VoiceSessionEvent[] {
    // Check if we're in a browser environment (localStorage is not available during SSR)
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const data = localStorage.getItem(`${this.STORAGE_KEY}_events`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private getMetrics(): VoicePerformanceMetric[] {
    // Check if we're in a browser environment (localStorage is not available during SSR)
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const data = localStorage.getItem(`${this.STORAGE_KEY}_metrics`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private getErrors(): VoiceErrorLog[] {
    // Check if we're in a browser environment (localStorage is not available during SSR)
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const data = localStorage.getItem(`${this.STORAGE_KEY}_errors`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private getSessionSummaries(): VoiceSessionSummary[] {
    // Check if we're in a browser environment (localStorage is not available during SSR)
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const data = localStorage.getItem(`${this.STORAGE_KEY}_sessions`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}

// Export singleton instance
export const voiceAnalytics = new VoiceAnalyticsService();
