/**
 * Unit tests for useVoiceInput hook
 * Tests Requirements: 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 6.2, 6.3
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useVoiceInput } from '../useVoiceInput';
import { SpeechRecognitionService } from '@/lib/speechRecognition';
import { VoiceError } from '@/types/voice';

// Mock dependencies
jest.mock('@/lib/speechRecognition');
jest.mock('@/lib/debounce', () => ({
  debounce: (fn: Function) => fn, // Return function directly for testing
}));
jest.mock('@/lib/performanceMonitor', () => ({
  performanceMonitor: {
    mark: jest.fn(),
    measure: jest.fn(() => 500),
  },
}));
jest.mock('@/lib/voiceAnalytics', () => ({
  voiceAnalytics: {
    trackPerformance: jest.fn(),
    trackError: jest.fn(),
  },
}));

describe('useVoiceInput', () => {
  let mockService: jest.Mocked<SpeechRecognitionService>;
  let mockCallbacks: {
    onResult?: (transcript: string, isFinal: boolean) => void;
    onError?: (error: VoiceError) => void;
    onEnd?: () => void;
    onStart?: () => void;
    onAudioLevel?: (level: number) => void;
  };

  beforeEach(() => {
    mockCallbacks = {};
    
    mockService = {
      isSupported: jest.fn(() => true),
      initialize: jest.fn(),
      start: jest.fn(() => Promise.resolve()),
      stop: jest.fn(),
      abort: jest.fn(),
      dispose: jest.fn(),
      onResult: jest.fn((cb) => { mockCallbacks.onResult = cb; }),
      onError: jest.fn((cb) => { mockCallbacks.onError = cb; }),
      onEnd: jest.fn((cb) => { mockCallbacks.onEnd = cb; }),
      onStart: jest.fn((cb) => { mockCallbacks.onStart = cb; }),
      onAudioLevel: jest.fn((cb) => { mockCallbacks.onAudioLevel = cb; }),
      detectBrowserSupport: jest.fn(),
      getIsListening: jest.fn(),
    } as any;

    (SpeechRecognitionService as jest.Mock).mockImplementation(() => mockService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('Initialization', () => {
    test('should initialize with default values', () => {
      const { result } = renderHook(() => useVoiceInput());

      expect(result.current.isListening).toBe(false);
      expect(result.current.transcript).toBe('');
      expect(result.current.interimTranscript).toBe('');
      expect(result.current.error).toBeNull();
      expect(result.current.isSupported).toBe(true);
      expect(result.current.language).toBe('en-US');
      expect(result.current.audioLevel).toBe(0);
    });

    test('should initialize with custom configuration', () => {
      const { result } = renderHook(() =>
        useVoiceInput({
          language: 'es-ES',
          initialTranscript: 'Initial text',
        })
      );

      expect(result.current.transcript).toBe('Initial text');
      expect(result.current.language).toBe('es-ES');
    });

    test('should detect browser support', () => {
      mockService.isSupported.mockReturnValue(false);
      
      const { result } = renderHook(() => useVoiceInput());

      expect(result.current.isSupported).toBe(false);
    });
  });

  describe('Start Listening', () => {
    test('should start listening successfully', async () => {
      const { result } = renderHook(() => useVoiceInput());

      await act(async () => {
        await result.current.startListening();
      });

      expect(mockService.initialize).toHaveBeenCalledWith({
        language: 'en-US',
        continuous: true,
        interimResults: true,
      });
      expect(mockService.start).toHaveBeenCalled();
    });

    test('should set isListening to true when started', async () => {
      const { result } = renderHook(() => useVoiceInput());

      await act(async () => {
        await result.current.startListening();
        // Simulate onStart callback
        if (mockCallbacks.onStart) {
          mockCallbacks.onStart();
        }
      });

      expect(result.current.isListening).toBe(true);
    });

    test('should clear previous errors when starting', async () => {
      const { result } = renderHook(() => useVoiceInput());

      // Set an error first
      await act(async () => {
        if (mockCallbacks.onError) {
          mockCallbacks.onError({
            type: 'no-speech',
            message: 'No speech',
            recoverable: true,
          });
        }
      });

      expect(result.current.error).not.toBeNull();

      // Start listening should clear error
      await act(async () => {
        await result.current.startListening();
      });

      expect(result.current.error).toBeNull();
    });

    test('should handle not-supported error', async () => {
      mockService.isSupported.mockReturnValue(false);
      const onError = jest.fn();
      
      const { result } = renderHook(() => useVoiceInput({ onError }));

      await act(async () => {
        await result.current.startListening();
      });

      expect(result.current.error).toEqual({
        type: 'not-supported',
        message: expect.stringContaining('not supported'),
        recoverable: false,
      });
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('Stop Listening', () => {
    test('should stop listening', async () => {
      const { result } = renderHook(() => useVoiceInput());

      await act(async () => {
        await result.current.startListening();
        result.current.stopListening();
      });

      expect(mockService.stop).toHaveBeenCalled();
    });

    test('should set isListening to false when stopped', async () => {
      const { result } = renderHook(() => useVoiceInput());

      await act(async () => {
        await result.current.startListening();
        if (mockCallbacks.onStart) {
          mockCallbacks.onStart();
        }
      });

      expect(result.current.isListening).toBe(true);

      await act(async () => {
        result.current.stopListening();
        if (mockCallbacks.onEnd) {
          mockCallbacks.onEnd();
        }
      });

      expect(result.current.isListening).toBe(false);
    });
  });

  describe('Transcript Accumulation', () => {
    test('should accumulate final transcripts', async () => {
      const { result } = renderHook(() => useVoiceInput());

      await act(async () => {
        await result.current.startListening();
        
        // Simulate multiple final results
        if (mockCallbacks.onResult) {
          mockCallbacks.onResult('Hello', true);
        }
      });

      expect(result.current.transcript).toBe('Hello');

      await act(async () => {
        if (mockCallbacks.onResult) {
          mockCallbacks.onResult('world', true);
        }
      });

      expect(result.current.transcript).toBe('Hello world');
    });

    test('should update interim transcript', async () => {
      const { result } = renderHook(() => useVoiceInput());

      await act(async () => {
        await result.current.startListening();
        
        // Simulate interim result
        if (mockCallbacks.onResult) {
          mockCallbacks.onResult('Testing', false);
        }
      });

      expect(result.current.interimTranscript).toBe('Testing');
      expect(result.current.transcript).toBe('');
    });

    test('should clear interim transcript when final result arrives', async () => {
      const { result } = renderHook(() => useVoiceInput());

      await act(async () => {
        await result.current.startListening();
        
        // Interim result
        if (mockCallbacks.onResult) {
          mockCallbacks.onResult('Testing', false);
        }
      });

      expect(result.current.interimTranscript).toBe('Testing');

      await act(async () => {
        // Final result
        if (mockCallbacks.onResult) {
          mockCallbacks.onResult('Testing', true);
        }
      });

      expect(result.current.transcript).toBe('Testing');
      expect(result.current.interimTranscript).toBe('');
    });

    test('should call onTranscriptChange callback', async () => {
      const onTranscriptChange = jest.fn();
      const { result } = renderHook(() => useVoiceInput({ onTranscriptChange }));

      await act(async () => {
        await result.current.startListening();
        
        if (mockCallbacks.onResult) {
          mockCallbacks.onResult('Hello', true);
        }
      });

      expect(onTranscriptChange).toHaveBeenCalledWith('Hello');
    });
  });

  describe('Reset Transcript', () => {
    test('should reset transcript to empty', async () => {
      const { result } = renderHook(() => useVoiceInput());

      await act(async () => {
        await result.current.startListening();
        
        if (mockCallbacks.onResult) {
          mockCallbacks.onResult('Hello world', true);
        }
      });

      expect(result.current.transcript).toBe('Hello world');

      await act(async () => {
        result.current.resetTranscript();
      });

      expect(result.current.transcript).toBe('');
      expect(result.current.interimTranscript).toBe('');
    });

    test('should call onTranscriptChange with empty string', async () => {
      const onTranscriptChange = jest.fn();
      const { result } = renderHook(() => useVoiceInput({ onTranscriptChange }));

      await act(async () => {
        result.current.resetTranscript();
      });

      expect(onTranscriptChange).toHaveBeenCalledWith('');
    });
  });

  describe('Manual Transcript Update', () => {
    test('should update transcript manually', async () => {
      const { result } = renderHook(() => useVoiceInput());

      await act(async () => {
        result.current.setTranscript('Manually edited text');
      });

      expect(result.current.transcript).toBe('Manually edited text');
    });

    test('should preserve manual edits when resuming voice input', async () => {
      const { result } = renderHook(() => useVoiceInput());

      await act(async () => {
        result.current.setTranscript('Edited: ');
      });

      await act(async () => {
        await result.current.startListening();
        
        if (mockCallbacks.onResult) {
          mockCallbacks.onResult('new speech', true);
        }
      });

      expect(result.current.transcript).toBe('Edited:  new speech');
    });
  });

  describe('Error Handling', () => {
    test('should handle errors from speech recognition', async () => {
      const onError = jest.fn();
      const { result } = renderHook(() => useVoiceInput({ onError }));

      const testError: VoiceError = {
        type: 'permission-denied',
        message: 'Permission denied',
        recoverable: true,
      };

      await act(async () => {
        await result.current.startListening();
        
        if (mockCallbacks.onError) {
          mockCallbacks.onError(testError);
        }
      });

      expect(result.current.error).toEqual(testError);
      expect(result.current.isListening).toBe(false);
      expect(onError).toHaveBeenCalledWith(testError);
    });

    test('should handle no-speech timeout', async () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useVoiceInput());

      await act(async () => {
        await result.current.startListening();
      });

      // Fast-forward 10 seconds
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      await waitFor(() => {
        expect(result.current.error?.type).toBe('no-speech');
        expect(result.current.isListening).toBe(false);
      });

      jest.useRealTimers();
    });

    test('should reset no-speech timeout on speech detection', async () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useVoiceInput());

      await act(async () => {
        await result.current.startListening();
      });

      // Advance 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Detect speech (should reset timeout)
      await act(async () => {
        if (mockCallbacks.onResult) {
          mockCallbacks.onResult('Hello', true);
        }
      });

      // Advance another 5 seconds (total 10, but timeout was reset)
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Should still be listening
      expect(result.current.isListening).toBe(true);
      expect(result.current.error).toBeNull();

      jest.useRealTimers();
    });
  });

  describe('Language Switching', () => {
    test('should update language', async () => {
      const { result } = renderHook(() => useVoiceInput());

      await act(async () => {
        result.current.setLanguage('es-ES');
      });

      expect(result.current.language).toBe('es-ES');
    });

    test('should restart recognition when changing language while listening', async () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useVoiceInput());

      await act(async () => {
        await result.current.startListening();
        if (mockCallbacks.onStart) {
          mockCallbacks.onStart();
        }
      });

      expect(result.current.isListening).toBe(true);

      await act(async () => {
        result.current.setLanguage('fr-FR');
      });

      expect(mockService.stop).toHaveBeenCalled();

      // Fast-forward the restart delay
      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(mockService.start).toHaveBeenCalledTimes(2);
      });

      jest.useRealTimers();
    });
  });

  describe('Audio Level', () => {
    test('should update audio level', async () => {
      const { result } = renderHook(() => useVoiceInput());

      await act(async () => {
        await result.current.startListening();
        
        if (mockCallbacks.onAudioLevel) {
          mockCallbacks.onAudioLevel(75);
        }
      });

      expect(result.current.audioLevel).toBe(75);
    });
  });

  describe('Cleanup', () => {
    test('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useVoiceInput());

      unmount();

      expect(mockService.dispose).toHaveBeenCalled();
    });

    test('should clear no-speech timeout on unmount', () => {
      jest.useFakeTimers();
      const { unmount } = renderHook(() => useVoiceInput());

      unmount();

      // Should not throw or cause issues
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      jest.useRealTimers();
    });
  });
});
