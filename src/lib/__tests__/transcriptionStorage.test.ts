/**
 * Tests for TranscriptionStorage class
 * Verifies save, load, clear, and expiration functionality
 */

import { TranscriptionStorage, TranscriptionSession } from '../transcriptionStorage';

describe('TranscriptionStorage', () => {
  let storage: TranscriptionStorage;
  const mockSession: TranscriptionSession = {
    id: 'test-session-1',
    transcript: 'This is a test transcription',
    language: 'en-US',
    timestamp: Date.now(),
  };

  beforeEach(() => {
    storage = new TranscriptionStorage();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('save', () => {
    it('should save a session to local storage', () => {
      const result = storage.save(mockSession);
      expect(result).toBe(true);
      
      const saved = localStorage.getItem('voice_transcription_session');
      expect(saved).not.toBeNull();
      expect(JSON.parse(saved!)).toEqual(mockSession);
    });

    it('should return false on storage quota error', () => {
      // Mock localStorage.setItem to throw QuotaExceededError
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        const error = new DOMException('Quota exceeded', 'QuotaExceededError');
        throw error;
      });

      const result = storage.save(mockSession);
      expect(result).toBe(false);

      localStorage.setItem = originalSetItem;
    });
  });

  describe('load', () => {
    it('should load a valid session from local storage', () => {
      storage.save(mockSession);
      const loaded = storage.load();
      
      expect(loaded).not.toBeNull();
      expect(loaded).toEqual(mockSession);
    });

    it('should return null if no session exists', () => {
      const loaded = storage.load();
      expect(loaded).toBeNull();
    });

    it('should return null and clear expired session', () => {
      const expiredSession: TranscriptionSession = {
        ...mockSession,
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
      };
      
      localStorage.setItem('voice_transcription_session', JSON.stringify(expiredSession));
      
      const loaded = storage.load();
      expect(loaded).toBeNull();
      expect(localStorage.getItem('voice_transcription_session')).toBeNull();
    });

    it('should handle corrupted data gracefully', () => {
      localStorage.setItem('voice_transcription_session', 'invalid json');
      
      const loaded = storage.load();
      expect(loaded).toBeNull();
      expect(localStorage.getItem('voice_transcription_session')).toBeNull();
    });
  });

  describe('clear', () => {
    it('should remove session from local storage', () => {
      storage.save(mockSession);
      expect(localStorage.getItem('voice_transcription_session')).not.toBeNull();
      
      storage.clear();
      expect(localStorage.getItem('voice_transcription_session')).toBeNull();
    });

    it('should not throw error if no session exists', () => {
      expect(() => storage.clear()).not.toThrow();
    });
  });

  describe('hasValidSession', () => {
    it('should return true if valid session exists', () => {
      storage.save(mockSession);
      expect(storage.hasValidSession()).toBe(true);
    });

    it('should return false if no session exists', () => {
      expect(storage.hasValidSession()).toBe(false);
    });

    it('should return false if session is expired', () => {
      const expiredSession: TranscriptionSession = {
        ...mockSession,
        timestamp: Date.now() - (25 * 60 * 60 * 1000),
      };
      localStorage.setItem('voice_transcription_session', JSON.stringify(expiredSession));
      
      expect(storage.hasValidSession()).toBe(false);
    });
  });

  describe('getSessionAge', () => {
    it('should return age of current session', () => {
      storage.save(mockSession);
      const age = storage.getSessionAge();
      
      expect(age).not.toBeNull();
      expect(age).toBeGreaterThanOrEqual(0);
      expect(age).toBeLessThan(1000); // Should be very recent
    });

    it('should return null if no session exists', () => {
      expect(storage.getSessionAge()).toBeNull();
    });
  });

  describe('isStorageAvailable', () => {
    it('should return true when localStorage is available', () => {
      expect(storage.isStorageAvailable()).toBe(true);
    });
  });
});
