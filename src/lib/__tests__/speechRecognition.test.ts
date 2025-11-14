/**
 * Unit tests for SpeechRecognitionService
 * Tests Requirements: 1.1, 1.2, 1.3, 2.1, 10.1, 10.5
 */

import { SpeechRecognitionService } from '../speechRecognition';
import { VoiceError } from '@/types/voice';

// Mock Web Speech API
class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = 'en-US';
  maxAlternatives = 1;
  
  onstart: (() => void) | null = null;
  onresult: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onend: (() => void) | null = null;

  start = jest.fn(() => {
    if (this.onstart) {
      setTimeout(() => this.onstart!(), 0);
    }
  });
  
  stop = jest.fn(() => {
    if (this.onend) {
      setTimeout(() => this.onend!(), 0);
    }
  });
  
  abort = jest.fn(() => {
    if (this.onend) {
      setTimeout(() => this.onend!(), 0);
    }
  });
}

// Mock AudioContext
class MockAudioContext {
  createAnalyser = jest.fn(() => ({
    fftSize: 0,
    smoothingTimeConstant: 0,
    frequencyBinCount: 64,
    getByteFrequencyData: jest.fn((array: Uint8Array) => {
      // Fill with mock data
      for (let i = 0; i < array.length; i++) {
        array[i] = 128; // Mid-level audio
      }
    }),
  }));
  
  createMediaStreamSource = jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
  }));
  
  close = jest.fn(() => Promise.resolve());
}

describe('SpeechRecognitionService', () => {
  let service: SpeechRecognitionService;
  let mockRecognition: MockSpeechRecognition;

  beforeEach(() => {
    // Setup Web Speech API mock
    mockRecognition = new MockSpeechRecognition();
    (global as any).SpeechRecognition = jest.fn(() => mockRecognition);
    (global as any).webkitSpeechRecognition = jest.fn(() => mockRecognition);
    
    // Setup AudioContext mock
    (global as any).AudioContext = MockAudioContext;
    (global as any).webkitAudioContext = MockAudioContext;
    
    // Setup MediaDevices mock
    (global.navigator as any).mediaDevices = {
      getUserMedia: jest.fn(() => Promise.resolve({
        getTracks: () => [],
      })),
    };

    service = new SpeechRecognitionService();
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.dispose();
  });

  describe('Browser Support Detection', () => {
    test('should detect speech recognition support', () => {
      const support = service.detectBrowserSupport();

      expect(support.speechRecognition).toBe(true);
      expect(support.webAudioAPI).toBe(true);
      expect(support.localStorage).toBe(true);
      expect(support.recommendedBrowser).toBeUndefined();
    });

    test('should recommend browser when not supported', () => {
      delete (global as any).SpeechRecognition;
      delete (global as any).webkitSpeechRecognition;
      
      const newService = new SpeechRecognitionService();
      const support = newService.detectBrowserSupport();

      expect(support.speechRecognition).toBe(false);
      expect(support.recommendedBrowser).toBe('Chrome or Edge');
    });

    test('should return isSupported correctly', () => {
      expect(service.isSupported()).toBe(true);
    });
  });

  describe('Initialization', () => {
    test('should initialize with configuration', () => {
      service.initialize({
        language: 'es-ES',
        continuous: true,
        interimResults: true,
        maxAlternatives: 1,
      });

      expect(mockRecognition.lang).toBe('es-ES');
      expect(mockRecognition.continuous).toBe(true);
      expect(mockRecognition.interimResults).toBe(true);
      expect(mockRecognition.maxAlternatives).toBe(1);
    });

    test('should throw error when not supported', () => {
      delete (global as any).SpeechRecognition;
      delete (global as any).webkitSpeechRecognition;
      
      const unsupportedService = new SpeechRecognitionService();

      expect(() => {
        unsupportedService.initialize({
          language: 'en-US',
          continuous: true,
          interimResults: true,
        });
      }).toThrow();
    });

    test('should setup event handlers', () => {
      service.initialize({
        language: 'en-US',
        continuous: true,
        interimResults: true,
      });

      expect(mockRecognition.onstart).not.toBeNull();
      expect(mockRecognition.onresult).not.toBeNull();
      expect(mockRecognition.onerror).not.toBeNull();
      expect(mockRecognition.onend).not.toBeNull();
    });
  });

  describe('Start and Stop', () => {
    beforeEach(() => {
      service.initialize({
        language: 'en-US',
        continuous: true,
        interimResults: true,
      });
    });

    test('should start recognition', async () => {
      await service.start();

      expect(mockRecognition.start).toHaveBeenCalled();
    });

    test('should call onStart callback', async () => {
      const onStart = jest.fn();
      service.onStart(onStart);

      await service.start();

      // Wait for async callback
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(onStart).toHaveBeenCalled();
    });

    test('should stop recognition', () => {
      service.stop();

      expect(mockRecognition.stop).toHaveBeenCalled();
    });

    test('should call onEnd callback when stopped', async () => {
      const onEnd = jest.fn();
      service.onEnd(onEnd);

      service.stop();

      // Wait for async callback
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(onEnd).toHaveBeenCalled();
    });

    test('should abort recognition', () => {
      service.abort();

      expect(mockRecognition.abort).toHaveBeenCalled();
    });

    test('should not start if already listening', async () => {
      await service.start();
      mockRecognition.start.mockClear();

      await service.start();

      expect(mockRecognition.start).not.toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      service.initialize({
        language: 'en-US',
        continuous: true,
        interimResults: true,
      });
    });

    test('should handle result events', () => {
      const onResult = jest.fn();
      service.onResult(onResult);

      // Simulate speech recognition result
      const mockEvent = {
        resultIndex: 0,
        results: [
          {
            0: { transcript: 'Hello world' },
            isFinal: true,
          },
        ],
      };

      if (mockRecognition.onresult) {
        mockRecognition.onresult(mockEvent);
      }

      expect(onResult).toHaveBeenCalledWith('Hello world', true);
    });

    test('should handle multiple results in one event', () => {
      const onResult = jest.fn();
      service.onResult(onResult);

      const mockEvent = {
        resultIndex: 0,
        results: [
          {
            0: { transcript: 'Hello' },
            isFinal: true,
          },
          {
            0: { transcript: 'world' },
            isFinal: false,
          },
        ],
      };

      if (mockRecognition.onresult) {
        mockRecognition.onresult(mockEvent);
      }

      expect(onResult).toHaveBeenCalledTimes(2);
      expect(onResult).toHaveBeenNthCalledWith(1, 'Hello', true);
      expect(onResult).toHaveBeenNthCalledWith(2, 'world', false);
    });

    test('should handle error events', () => {
      const onError = jest.fn();
      service.onError(onError);

      const mockErrorEvent = {
        error: 'not-allowed',
      };

      if (mockRecognition.onerror) {
        mockRecognition.onerror(mockErrorEvent);
      }

      expect(onError).toHaveBeenCalled();
      const error = onError.mock.calls[0][0] as VoiceError;
      expect(error.type).toBe('permission-denied');
    });

    test('should map error codes correctly', () => {
      const onError = jest.fn();
      service.onError(onError);

      const errorMappings = [
        { apiError: 'not-allowed', expectedType: 'permission-denied' },
        { apiError: 'no-speech', expectedType: 'no-speech' },
        { apiError: 'network', expectedType: 'network' },
        { apiError: 'aborted', expectedType: 'aborted' },
        { apiError: 'audio-capture', expectedType: 'audio-capture' },
        { apiError: 'service-not-allowed', expectedType: 'service-not-allowed' },
      ];

      errorMappings.forEach(({ apiError, expectedType }) => {
        onError.mockClear();
        
        if (mockRecognition.onerror) {
          mockRecognition.onerror({ error: apiError });
        }

        expect(onError).toHaveBeenCalled();
        const error = onError.mock.calls[0][0] as VoiceError;
        expect(error.type).toBe(expectedType);
      });
    });
  });

  describe('Audio Level Monitoring', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      service.initialize({
        language: 'en-US',
        continuous: true,
        interimResults: true,
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should start audio level monitoring on start', async () => {
      const onAudioLevel = jest.fn();
      service.onAudioLevel(onAudioLevel);

      await service.start();

      // Fast-forward to trigger audio level update
      jest.advanceTimersByTime(100);

      expect(onAudioLevel).toHaveBeenCalled();
      const level = onAudioLevel.mock.calls[0][0];
      expect(level).toBeGreaterThanOrEqual(0);
      expect(level).toBeLessThanOrEqual(100);
    });

    test('should stop audio level monitoring on stop', async () => {
      const onAudioLevel = jest.fn();
      service.onAudioLevel(onAudioLevel);

      await service.start();
      jest.advanceTimersByTime(100);
      
      const callCountBeforeStop = onAudioLevel.mock.calls.length;
      
      service.stop();
      jest.advanceTimersByTime(200);

      // Should not have additional calls after stop
      expect(onAudioLevel.mock.calls.length).toBe(callCountBeforeStop);
    });

    test('should handle getUserMedia failure gracefully', async () => {
      (global.navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValue(
        new Error('Permission denied')
      );

      // Should not throw
      await expect(service.start()).resolves.not.toThrow();
    });
  });

  describe('Callback Registration', () => {
    test('should register onResult callback', () => {
      const callback = jest.fn();
      service.onResult(callback);

      service.initialize({
        language: 'en-US',
        continuous: true,
        interimResults: true,
      });

      const mockEvent = {
        resultIndex: 0,
        results: [{ 0: { transcript: 'test' }, isFinal: true }],
      };

      if (mockRecognition.onresult) {
        mockRecognition.onresult(mockEvent);
      }

      expect(callback).toHaveBeenCalledWith('test', true);
    });

    test('should register onError callback', () => {
      const callback = jest.fn();
      service.onError(callback);

      service.initialize({
        language: 'en-US',
        continuous: true,
        interimResults: true,
      });

      if (mockRecognition.onerror) {
        mockRecognition.onerror({ error: 'no-speech' });
      }

      expect(callback).toHaveBeenCalled();
    });

    test('should register onEnd callback', async () => {
      const callback = jest.fn();
      service.onEnd(callback);

      service.initialize({
        language: 'en-US',
        continuous: true,
        interimResults: true,
      });

      service.stop();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(callback).toHaveBeenCalled();
    });

    test('should register onStart callback', async () => {
      const callback = jest.fn();
      service.onStart(callback);

      service.initialize({
        language: 'en-US',
        continuous: true,
        interimResults: true,
      });

      await service.start();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(callback).toHaveBeenCalled();
    });

    test('should register onAudioLevel callback', async () => {
      jest.useFakeTimers();
      const callback = jest.fn();
      service.onAudioLevel(callback);

      service.initialize({
        language: 'en-US',
        continuous: true,
        interimResults: true,
      });

      await service.start();
      jest.advanceTimersByTime(100);

      expect(callback).toHaveBeenCalled();
      jest.useRealTimers();
    });
  });

  describe('Cleanup', () => {
    test('should dispose and cleanup resources', () => {
      service.initialize({
        language: 'en-US',
        continuous: true,
        interimResults: true,
      });

      service.dispose();

      expect(mockRecognition.abort).toHaveBeenCalled();
    });

    test('should clear callbacks on dispose', () => {
      const onResult = jest.fn();
      service.onResult(onResult);

      service.initialize({
        language: 'en-US',
        continuous: true,
        interimResults: true,
      });

      service.dispose();

      // Callbacks should not be called after dispose
      const mockEvent = {
        resultIndex: 0,
        results: [{ 0: { transcript: 'test' }, isFinal: true }],
      };

      if (mockRecognition.onresult) {
        mockRecognition.onresult(mockEvent);
      }

      expect(onResult).not.toHaveBeenCalled();
    });
  });

  describe('getIsListening', () => {
    test('should return listening status', async () => {
      service.initialize({
        language: 'en-US',
        continuous: true,
        interimResults: true,
      });

      expect(service.getIsListening()).toBe(false);

      await service.start();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(service.getIsListening()).toBe(true);

      service.stop();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(service.getIsListening()).toBe(false);
    });
  });
});
