/**
 * TranscriptionStorage - Manages local storage operations for voice transcription sessions
 * Implements 24-hour TTL and graceful error handling for storage quota issues
 */

export interface TranscriptionSession {
  id: string;
  transcript: string;
  language: string;
  timestamp: number;
  formId?: string;
}

export class TranscriptionStorage {
  private readonly STORAGE_KEY = 'voice_transcription_session';
  private readonly MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Save a transcription session to local storage
   * Handles storage quota errors gracefully by logging warnings
   * 
   * @param session - The transcription session to save
   * @returns boolean indicating success
   */
  save(session: TranscriptionSession): boolean {
    try {
      const sessionData = JSON.stringify(session);
      localStorage.setItem(this.STORAGE_KEY, sessionData);
      return true;
    } catch (error) {
      // Handle quota exceeded errors gracefully
      if (error instanceof DOMException && 
          (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        console.warn('Local storage quota exceeded. Transcription will not be persisted.', error);
      } else {
        console.warn('Failed to save transcription to local storage', error);
      }
      return false;
    }
  }

  /**
   * Load a transcription session from local storage
   * Returns null if no session exists or if session has expired (>24 hours)
   * 
   * @returns The loaded session or null
   */
  load(): TranscriptionSession | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        return null;
      }

      const session: TranscriptionSession = JSON.parse(data);
      
      // Check if session has expired (older than 24 hours)
      if (Date.now() - session.timestamp > this.MAX_AGE_MS) {
        this.clear();
        return null;
      }

      return session;
    } catch (error) {
      console.warn('Failed to load transcription from local storage', error);
      // Clear corrupted data
      this.clear();
      return null;
    }
  }

  /**
   * Clear the transcription session from local storage
   * Safe to call even if no session exists
   */
  clear(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear transcription from local storage', error);
    }
  }

  /**
   * Check if a valid session exists in storage
   * 
   * @returns boolean indicating if a valid session exists
   */
  hasValidSession(): boolean {
    return this.load() !== null;
  }

  /**
   * Get the age of the current session in milliseconds
   * Returns null if no session exists
   * 
   * @returns Age in milliseconds or null
   */
  getSessionAge(): number | null {
    const session = this.load();
    if (!session) {
      return null;
    }
    return Date.now() - session.timestamp;
  }

  /**
   * Check if local storage is available
   * 
   * @returns boolean indicating if local storage is supported
   */
  isStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}

// Export a singleton instance for convenience
export const transcriptionStorage = new TranscriptionStorage();
