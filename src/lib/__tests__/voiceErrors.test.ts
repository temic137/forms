/**
 * Unit tests for voice error handling utilities
 * Tests Requirements: 2.5, 7.5, 10.1, 10.2, 10.3
 */

import { createVoiceError, getRecoveryStrategy, ERROR_STRATEGIES } from '../voiceErrors';
import { VoiceError, VoiceErrorType } from '@/types/voice';

describe('voiceErrors', () => {
  describe('ERROR_STRATEGIES', () => {
    test('should have strategies for all error types', () => {
      const errorTypes: VoiceErrorType[] = [
        'not-supported',
        'permission-denied',
        'no-speech',
        'network',
        'aborted',
        'audio-capture',
        'service-not-allowed',
      ];

      errorTypes.forEach(type => {
        expect(ERROR_STRATEGIES[type]).toBeDefined();
        expect(ERROR_STRATEGIES[type].type).toBe(type);
        expect(ERROR_STRATEGIES[type].userMessage).toBeTruthy();
        expect(ERROR_STRATEGIES[type].action).toBeTruthy();
        expect(typeof ERROR_STRATEGIES[type].retryable).toBe('boolean');
      });
    });

    test('should have correct retryable flags', () => {
      expect(ERROR_STRATEGIES['not-supported'].retryable).toBe(false);
      expect(ERROR_STRATEGIES['permission-denied'].retryable).toBe(true);
      expect(ERROR_STRATEGIES['no-speech'].retryable).toBe(true);
      expect(ERROR_STRATEGIES['network'].retryable).toBe(true);
      expect(ERROR_STRATEGIES['aborted'].retryable).toBe(true);
      expect(ERROR_STRATEGIES['audio-capture'].retryable).toBe(true);
      expect(ERROR_STRATEGIES['service-not-allowed'].retryable).toBe(true);
    });

    test('should have appropriate actions', () => {
      expect(ERROR_STRATEGIES['not-supported'].action).toBe('manual-input');
      expect(ERROR_STRATEGIES['permission-denied'].action).toBe('check-settings');
      expect(ERROR_STRATEGIES['no-speech'].action).toBe('retry');
      expect(ERROR_STRATEGIES['network'].action).toBe('retry');
      expect(ERROR_STRATEGIES['aborted'].action).toBe('retry');
      expect(ERROR_STRATEGIES['audio-capture'].action).toBe('check-settings');
      expect(ERROR_STRATEGIES['service-not-allowed'].action).toBe('check-settings');
    });
  });

  describe('createVoiceError', () => {
    test('should create error from string type', () => {
      const error = createVoiceError('no-speech');

      expect(error.type).toBe('no-speech');
      expect(error.message).toBe(ERROR_STRATEGIES['no-speech'].userMessage);
      expect(error.recoverable).toBe(true);
    });

    test('should create error from SpeechRecognitionErrorEvent', () => {
      const mockEvent = {
        error: 'not-allowed',
      } as SpeechRecognitionErrorEvent;

      const error = createVoiceError(mockEvent);

      expect(error.type).toBe('permission-denied');
      expect(error.message).toContain('microphone');
      expect(error.recoverable).toBe(true);
    });

    test('should map Web Speech API error codes correctly', () => {
      const errorMappings = [
        { apiError: 'not-allowed', expectedType: 'permission-denied' },
        { apiError: 'no-speech', expectedType: 'no-speech' },
        { apiError: 'network', expectedType: 'network' },
        { apiError: 'aborted', expectedType: 'aborted' },
        { apiError: 'audio-capture', expectedType: 'audio-capture' },
        { apiError: 'service-not-allowed', expectedType: 'service-not-allowed' },
      ];

      errorMappings.forEach(({ apiError, expectedType }) => {
        const mockEvent = { error: apiError } as SpeechRecognitionErrorEvent;
        const error = createVoiceError(mockEvent);

        expect(error.type).toBe(expectedType);
      });
    });

    test('should default to aborted for unknown error codes', () => {
      const mockEvent = {
        error: 'unknown-error-code',
      } as any;

      const error = createVoiceError(mockEvent);

      expect(error.type).toBe('aborted');
    });

    test('should include original error when provided', () => {
      const originalError = new Error('Original error message');
      const error = createVoiceError('network', originalError);

      expect(error.originalError).toBe(originalError);
    });

    test('should create not-supported error', () => {
      const error = createVoiceError('not-supported');

      expect(error.type).toBe('not-supported');
      expect(error.message).toContain('not supported');
      expect(error.recoverable).toBe(false);
    });

    test('should create permission-denied error', () => {
      const mockEvent = {
        error: 'not-allowed',
      } as SpeechRecognitionErrorEvent;

      const error = createVoiceError(mockEvent);

      expect(error.type).toBe('permission-denied');
      expect(error.message).toContain('denied');
      expect(error.recoverable).toBe(true);
    });

    test('should create no-speech error', () => {
      const error = createVoiceError('no-speech');

      expect(error.type).toBe('no-speech');
      expect(error.message).toContain('No speech');
      expect(error.recoverable).toBe(true);
    });

    test('should create network error', () => {
      const error = createVoiceError('network');

      expect(error.type).toBe('network');
      expect(error.message).toContain('Network');
      expect(error.recoverable).toBe(true);
    });

    test('should create audio-capture error', () => {
      const mockEvent = {
        error: 'audio-capture',
      } as SpeechRecognitionErrorEvent;

      const error = createVoiceError(mockEvent);

      expect(error.type).toBe('audio-capture');
      expect(error.message).toContain('microphone');
      expect(error.recoverable).toBe(true);
    });
  });

  describe('getRecoveryStrategy', () => {
    test('should return correct strategy for each error type', () => {
      const errorTypes: VoiceErrorType[] = [
        'not-supported',
        'permission-denied',
        'no-speech',
        'network',
        'aborted',
        'audio-capture',
        'service-not-allowed',
      ];

      errorTypes.forEach(type => {
        const error: VoiceError = {
          type,
          message: 'Test error',
          recoverable: true,
        };

        const strategy = getRecoveryStrategy(error);

        expect(strategy).toBe(ERROR_STRATEGIES[type]);
        expect(strategy.type).toBe(type);
      });
    });

    test('should return strategy with correct action for not-supported', () => {
      const error: VoiceError = {
        type: 'not-supported',
        message: 'Not supported',
        recoverable: false,
      };

      const strategy = getRecoveryStrategy(error);

      expect(strategy.action).toBe('manual-input');
      expect(strategy.retryable).toBe(false);
    });

    test('should return strategy with correct action for permission-denied', () => {
      const error: VoiceError = {
        type: 'permission-denied',
        message: 'Permission denied',
        recoverable: true,
      };

      const strategy = getRecoveryStrategy(error);

      expect(strategy.action).toBe('check-settings');
      expect(strategy.retryable).toBe(true);
    });

    test('should return strategy with correct action for no-speech', () => {
      const error: VoiceError = {
        type: 'no-speech',
        message: 'No speech',
        recoverable: true,
      };

      const strategy = getRecoveryStrategy(error);

      expect(strategy.action).toBe('retry');
      expect(strategy.retryable).toBe(true);
    });

    test('should return strategy with user-friendly messages', () => {
      const errorTypes: VoiceErrorType[] = [
        'not-supported',
        'permission-denied',
        'no-speech',
        'network',
      ];

      errorTypes.forEach(type => {
        const error: VoiceError = {
          type,
          message: 'Test',
          recoverable: true,
        };

        const strategy = getRecoveryStrategy(error);

        expect(strategy.userMessage).toBeTruthy();
        expect(strategy.userMessage.length).toBeGreaterThan(10);
        expect(strategy.userMessage).not.toContain('undefined');
        expect(strategy.userMessage).not.toContain('null');
      });
    });
  });

  describe('Error Message Quality', () => {
    test('should have clear and actionable error messages', () => {
      Object.values(ERROR_STRATEGIES).forEach(strategy => {
        // Message should be clear
        expect(strategy.userMessage.length).toBeGreaterThan(20);
        
        // Message should not be too long
        expect(strategy.userMessage.length).toBeLessThan(200);
        
        // Message should start with capital letter
        expect(strategy.userMessage[0]).toBe(strategy.userMessage[0].toUpperCase());
        
        // Message should end with period
        expect(strategy.userMessage.endsWith('.')).toBe(true);
      });
    });

    test('should have consistent message style', () => {
      Object.values(ERROR_STRATEGIES).forEach(strategy => {
        // Should not contain technical jargon for user-facing messages
        expect(strategy.userMessage).not.toContain('API');
        expect(strategy.userMessage).not.toContain('callback');
        expect(strategy.userMessage).not.toContain('undefined');
      });
    });
  });

  describe('Recovery Actions', () => {
    test('should have valid recovery actions', () => {
      const validActions = ['retry', 'fallback', 'manual-input', 'check-settings'];

      Object.values(ERROR_STRATEGIES).forEach(strategy => {
        expect(validActions).toContain(strategy.action);
      });
    });

    test('should map non-retryable errors to appropriate actions', () => {
      const nonRetryableStrategies = Object.values(ERROR_STRATEGIES).filter(
        s => !s.retryable
      );

      nonRetryableStrategies.forEach(strategy => {
        expect(['manual-input', 'fallback']).toContain(strategy.action);
      });
    });

    test('should map retryable errors to appropriate actions', () => {
      const retryableStrategies = Object.values(ERROR_STRATEGIES).filter(
        s => s.retryable
      );

      retryableStrategies.forEach(strategy => {
        expect(['retry', 'check-settings']).toContain(strategy.action);
      });
    });
  });
});
