/**
 * Integration Tests: Complete Voice-to-Form Flow
 * Tests Requirements: All voice form generation requirements
 * 
 * These tests verify the end-to-end integration of:
 * - Voice input capture
 * - Transcription processing
 * - AI form generation
 * - Form builder integration
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VoiceInput from '@/components/voice/VoiceInput';
import { transcriptionStorage } from '@/lib/transcriptionStorage';
import { voiceSettings } from '@/lib/voiceSettings';

// Mock dependencies
jest.mock('@/lib/speechRecognition');
jest.mock('@/lib/voiceAnalytics');
jest.mock('@/lib/performanceMonitor');

// Mock fetch for AI API calls
global.fetch = jest.fn();

describe('Voice-to-Form Integration Tests', () => {
  let mockRecognition: any;
  let mockCallbacks: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    transcriptionStorage.clear();
    voiceSettings.setEnabled(true);
    voiceSettings.acceptPrivacyNotice();
    
    // Setup mock callbacks
    mockCallbacks = {};
    
    // Mock SpeechRecognition
    mockRecognition = {
      continuous: false,
      interimResults: false,
      lang: 'en-US',
      maxAlternatives: 1,
      onstart: null,
      onresult: null,
      onerror: null,
      onend: null,
      start: jest.fn(() => {
        if (mockRecognition.onstart) {
          setTimeout(() => mockRecognition.onstart(), 0);
        }
      }),
      stop: jest.fn(() => {
        if (mockRecognition.onend) {
          setTimeout(() => mockRecognition.onend(), 0);
        }
      }),
      abort: jest.fn(),
    };

    (global as any).SpeechRecognition = jest.fn(() => mockRecognition);
    (global as any).webkitSpeechRecognition = jest.fn(() => mockRecognition);
    
    // Mock AudioContext
    (global as any).AudioContext = jest.fn(() => ({
      createAnalyser: jest.fn(() => ({
        fftSize: 0,
        smoothingTimeConstant: 0,
        frequencyBinCount: 64,
        getByteFrequencyData: jest.fn(),
      })),
      createMediaStreamSource: jest.fn(() => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
      })),
      close: jest.fn(() => Promise.resolve()),
    }));

    // Mock getUserMedia
    (global.navigator as any).mediaDevices = {
      getUserMedia: jest.fn(() => Promise.resolve({
        getTracks: () => [],
      })),
    };

    // Mock fetch for AI API
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        form: {
          title: 'Contact Form',
          fields: [
            { id: 'name', label: 'Name', type: 'text', required: true, order: 0 },
            { id: 'email', label: 'Email', type: 'email', required: true, order: 1 },
            { id: 'message', label: 'Message', type: 'textarea', required: true, order: 2 },
          ],
        },
        confidence: 0.95,
      }),
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Complete Voice-to-Form Flow', () => {
    test('should complete full flow: start recording → speak → stop → generate form', async () => {
      const user = userEvent.setup();
      const onGenerateForm = jest.fn().mockResolvedValue(undefined);
      const onTranscriptComplete = jest.fn();

      render(
        <VoiceInput
          onGenerateForm={onGenerateForm}
          onTranscriptComplete={onTranscriptComplete}
        />
      );

      // Step 1: Start recording
      const startButton = screen.getByRole('button', { name: /start voice input/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(mockRecognition.start).toHaveBeenCalled();
      });

      // Step 2: Simulate speech recognition result
      act(() => {
        const mockEvent = {
          resultIndex: 0,
          results: [
            {
              0: { transcript: 'I need a contact form with name, email, and message' },
              isFinal: true,
            },
          ],
        };
        if (mockRecognition.onresult) {
          mockRecognition.onresult(mockEvent);
        }
      });

      await waitFor(() => {
        expect(onTranscriptComplete).toHaveBeenCalledWith(
          'I need a contact form with name, email, and message'
        );
      });

      // Step 3: Stop recording
      const stopButton = screen.getByRole('button', { name: /stop voice input/i });
      await user.click(stopButton);

      await waitFor(() => {
        expect(mockRecognition.stop).toHaveBeenCalled();
      });

      // Step 4: Generate form
      const generateButton = screen.getByRole('button', { name: /generate form/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(onGenerateForm).toHaveBeenCalledWith(
          'I need a contact form with name, email, and message',
          'en-US'
        );
      });

      // Verify success message
      await waitFor(() => {
        expect(screen.getByText(/form generated successfully/i)).toBeInTheDocument();
      });
    });

    test('should allow editing transcription before generating form', async () => {
      const user = userEvent.setup();
      const onGenerateForm = jest.fn().mockResolvedValue(undefined);

      render(<VoiceInput onGenerateForm={onGenerateForm} />);

      // Start and get transcription
      const startButton = screen.getByRole('button', { name: /start voice input/i });
      await user.click(startButton);

      act(() => {
        const mockEvent = {
          resultIndex: 0,
          results: [
            {
              0: { transcript: 'contact form with name and email' },
              isFinal: true,
            },
          ],
        };
        if (mockRecognition.onresult) {
          mockRecognition.onresult(mockEvent);
        }
      });

      // Stop recording
      const stopButton = await screen.findByRole('button', { name: /stop voice input/i });
      await user.click(stopButton);

      // Edit transcription
      const textarea = screen.getByRole('textbox', { name: /voice transcription/i });
      await user.clear(textarea);
      await user.type(textarea, 'contact form with name, email, and phone number');

      // Generate form with edited text
      const generateButton = screen.getByRole('button', { name: /generate form/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(onGenerateForm).toHaveBeenCalledWith(
          'contact form with name, email, and phone number',
          'en-US'
        );
      });
    });

    test('should accumulate multiple speech segments', async () => {
      const user = userEvent.setup();
      const onTranscriptComplete = jest.fn();

      render(<VoiceInput onTranscriptComplete={onTranscriptComplete} />);

      const startButton = screen.getByRole('button', { name: /start voice input/i });
      await user.click(startButton);

      // First segment
      act(() => {
        const mockEvent = {
          resultIndex: 0,
          results: [
            {
              0: { transcript: 'I need a form' },
              isFinal: true,
            },
          ],
        };
        if (mockRecognition.onresult) {
          mockRecognition.onresult(mockEvent);
        }
      });

      // Second segment
      act(() => {
        const mockEvent = {
          resultIndex: 1,
          results: [
            {
              0: { transcript: 'I need a form' },
              isFinal: true,
            },
            {
              0: { transcript: 'with name and email' },
              isFinal: true,
            },
          ],
        };
        if (mockRecognition.onresult) {
          mockRecognition.onresult(mockEvent);
        }
      });

      await waitFor(() => {
        const lastCall = onTranscriptComplete.mock.calls[onTranscriptComplete.mock.calls.length - 1];
        expect(lastCall[0]).toBe('I need a form with name and email');
      });
    });
  });

  describe('Error Recovery Scenarios', () => {
    test('should handle permission denied error with retry', async () => {
      const user = userEvent.setup();

      render(<VoiceInput />);

      const startButton = screen.getByRole('button', { name: /start voice input/i });
      await user.click(startButton);

      // Simulate permission denied error
      act(() => {
        if (mockRecognition.onerror) {
          mockRecognition.onerror({ error: 'not-allowed' });
        }
      });

      // Verify error message displayed
      await waitFor(() => {
        expect(screen.getByText(/microphone access/i)).toBeInTheDocument();
      });

      // Verify retry button is available
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();

      // Click retry
      mockRecognition.start.mockClear();
      await user.click(retryButton);

      await waitFor(() => {
        expect(mockRecognition.start).toHaveBeenCalled();
      });
    });

    test('should handle no-speech error gracefully', async () => {
      const user = userEvent.setup();

      render(<VoiceInput />);

      const startButton = screen.getByRole('button', { name: /start voice input/i });
      await user.click(startButton);

      // Simulate no-speech error
      act(() => {
        if (mockRecognition.onerror) {
          mockRecognition.onerror({ error: 'no-speech' });
        }
      });

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/no speech detected/i)).toBeInTheDocument();
      });

      // Verify can retry
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
    });

    test('should handle form generation failure and preserve transcription', async () => {
      const user = userEvent.setup();
      const onGenerateForm = jest.fn().mockRejectedValue(new Error('AI service unavailable'));

      render(<VoiceInput onGenerateForm={onGenerateForm} />);

      // Get transcription
      const startButton = screen.getByRole('button', { name: /start voice input/i });
      await user.click(startButton);

      act(() => {
        const mockEvent = {
          resultIndex: 0,
          results: [
            {
              0: { transcript: 'test form' },
              isFinal: true,
            },
          ],
        };
        if (mockRecognition.onresult) {
          mockRecognition.onresult(mockEvent);
        }
      });

      const stopButton = await screen.findByRole('button', { name: /stop voice input/i });
      await user.click(stopButton);

      // Try to generate form
      const generateButton = screen.getByRole('button', { name: /generate form/i });
      await user.click(generateButton);

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/failed to generate form/i)).toBeInTheDocument();
      });

      // Verify transcription is preserved
      const textarea = screen.getByRole('textbox', { name: /voice transcription/i });
      expect(textarea).toHaveValue('test form');
    });

    test('should handle network errors during form generation', async () => {
      const user = userEvent.setup();
      const onGenerateForm = jest.fn().mockRejectedValue(new Error('Network error'));

      render(<VoiceInput onGenerateForm={onGenerateForm} />);

      // Get transcription
      const startButton = screen.getByRole('button', { name: /start voice input/i });
      await user.click(startButton);

      act(() => {
        const mockEvent = {
          resultIndex: 0,
          results: [
            {
              0: { transcript: 'test form' },
              isFinal: true,
            },
          ],
        };
        if (mockRecognition.onresult) {
          mockRecognition.onresult(mockEvent);
        }
      });

      const stopButton = await screen.findByRole('button', { name: /stop voice input/i });
      await user.click(stopButton);

      // Try to generate form
      const generateButton = screen.getByRole('button', { name: /generate form/i });
      await user.click(generateButton);

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByText(/failed to generate form/i)).toBeInTheDocument();
      });

      // Verify can retry
      expect(generateButton).toBeEnabled();
    });
  });

  describe('Session Persistence and Restoration', () => {
    test('should save transcription to local storage automatically', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });

      render(<VoiceInput />);

      const startButton = screen.getByRole('button', { name: /start voice input/i });
      await user.click(startButton);

      act(() => {
        const mockEvent = {
          resultIndex: 0,
          results: [
            {
              0: { transcript: 'test transcription' },
              isFinal: true,
            },
          ],
        };
        if (mockRecognition.onresult) {
          mockRecognition.onresult(mockEvent);
        }
      });

      // Fast-forward to trigger auto-save
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Verify saved to storage
      const saved = transcriptionStorage.load();
      expect(saved).not.toBeNull();
      expect(saved?.transcript).toBe('test transcription');

      jest.useRealTimers();
    });

    test('should restore previous session on mount', async () => {
      // Save a session first
      transcriptionStorage.save({
        id: 'test-session',
        transcript: 'restored transcription',
        language: 'en-US',
        timestamp: Date.now(),
      });

      render(<VoiceInput />);

      // Verify transcription is restored
      await waitFor(() => {
        const textarea = screen.getByRole('textbox', { name: /voice transcription/i });
        expect(textarea).toHaveValue('restored transcription');
      });

      // Verify restored session indicator
      expect(screen.getByText(/session restored/i)).toBeInTheDocument();
    });

    test('should clear storage after successful form generation', async () => {
      const user = userEvent.setup();
      const onGenerateForm = jest.fn().mockResolvedValue(undefined);

      // Save initial session
      transcriptionStorage.save({
        id: 'test-session',
        transcript: 'test form',
        language: 'en-US',
        timestamp: Date.now(),
      });

      render(<VoiceInput onGenerateForm={onGenerateForm} />);

      // Generate form
      const generateButton = await screen.findByRole('button', { name: /generate form/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(onGenerateForm).toHaveBeenCalled();
      });

      // Verify storage is cleared
      await waitFor(() => {
        const saved = transcriptionStorage.load();
        expect(saved).toBeNull();
      });
    });

    test('should handle expired sessions', async () => {
      // Save an expired session (older than 24 hours)
      const oldTimestamp = Date.now() - (25 * 60 * 60 * 1000);
      transcriptionStorage.save({
        id: 'old-session',
        transcript: 'old transcription',
        language: 'en-US',
        timestamp: oldTimestamp,
      });

      render(<VoiceInput />);

      // Verify expired session is not restored
      await waitFor(() => {
        const textarea = screen.getByRole('textbox', { name: /voice transcription/i });
        expect(textarea).toHaveValue('');
      });

      // Verify no restored session indicator
      expect(screen.queryByText(/session restored/i)).not.toBeInTheDocument();
    });

    test('should handle storage quota errors gracefully', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });

      // Mock storage quota exceeded
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn(() => {
        throw new Error('QuotaExceededError');
      });

      render(<VoiceInput />);

      const startButton = screen.getByRole('button', { name: /start voice input/i });
      await user.click(startButton);

      act(() => {
        const mockEvent = {
          resultIndex: 0,
          results: [
            {
              0: { transcript: 'test' },
              isFinal: true,
            },
          ],
        };
        if (mockRecognition.onresult) {
          mockRecognition.onresult(mockEvent);
        }
      });

      // Fast-forward to trigger auto-save
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Verify warning message
      await waitFor(() => {
        expect(screen.getByText(/storage unavailable/i)).toBeInTheDocument();
      });

      // Restore original setItem
      Storage.prototype.setItem = originalSetItem;
      jest.useRealTimers();
    });
  });

  describe('Multi-Language Support', () => {
    test('should support language switching', async () => {
      const user = userEvent.setup();

      render(<VoiceInput />);

      // Find language selector
      const languageSelect = screen.getByRole('combobox', { name: /select voice input language/i });
      
      // Change to Spanish
      await user.selectOptions(languageSelect, 'es-ES');

      // Verify language changed
      expect(languageSelect).toHaveValue('es-ES');
    });

    test('should warn when switching languages mid-session', async () => {
      const user = userEvent.setup();

      render(<VoiceInput />);

      // Get some transcription first
      const startButton = screen.getByRole('button', { name: /start voice input/i });
      await user.click(startButton);

      act(() => {
        const mockEvent = {
          resultIndex: 0,
          results: [
            {
              0: { transcript: 'test transcription' },
              isFinal: true,
            },
          ],
        };
        if (mockRecognition.onresult) {
          mockRecognition.onresult(mockEvent);
        }
      });

      const stopButton = await screen.findByRole('button', { name: /stop voice input/i });
      await user.click(stopButton);

      // Try to change language
      const languageSelect = screen.getByRole('combobox', { name: /select voice input language/i });
      await user.selectOptions(languageSelect, 'fr-FR');

      // Verify warning dialog appears
      await waitFor(() => {
        expect(screen.getByText(/existing transcription may not match/i)).toBeInTheDocument();
      });
    });

    test('should pass language to form generation', async () => {
      const user = userEvent.setup();
      const onGenerateForm = jest.fn().mockResolvedValue(undefined);

      render(<VoiceInput onGenerateForm={onGenerateForm} />);

      // Change language to Spanish
      const languageSelect = screen.getByRole('combobox', { name: /select voice input language/i });
      await user.selectOptions(languageSelect, 'es-ES');

      // Get transcription
      const startButton = screen.getByRole('button', { name: /start voice input/i });
      await user.click(startButton);

      act(() => {
        const mockEvent = {
          resultIndex: 0,
          results: [
            {
              0: { transcript: 'formulario de contacto' },
              isFinal: true,
            },
          ],
        };
        if (mockRecognition.onresult) {
          mockRecognition.onresult(mockEvent);
        }
      });

      const stopButton = await screen.findByRole('button', { name: /stop voice input/i });
      await user.click(stopButton);

      // Generate form
      const generateButton = screen.getByRole('button', { name: /generate form/i });
      await user.click(generateButton);

      // Verify language was passed
      await waitFor(() => {
        expect(onGenerateForm).toHaveBeenCalledWith('formulario de contacto', 'es-ES');
      });
    });

    test('should restore language from saved session', async () => {
      // Save session with French language
      transcriptionStorage.save({
        id: 'test-session',
        transcript: 'formulaire de contact',
        language: 'fr-FR',
        timestamp: Date.now(),
      });

      render(<VoiceInput />);

      // Verify language is restored
      await waitFor(() => {
        const languageSelect = screen.getByRole('combobox', { name: /select voice input language/i });
        expect(languageSelect).toHaveValue('fr-FR');
      });
    });
  });

  describe('Integration with Form Builder', () => {
    test('should integrate with form builder state', async () => {
      const user = userEvent.setup();
      const onGenerateForm = jest.fn().mockResolvedValue(undefined);
      const onTranscriptComplete = jest.fn();

      render(
        <VoiceInput
          onGenerateForm={onGenerateForm}
          onTranscriptComplete={onTranscriptComplete}
        />
      );

      // Complete voice input
      const startButton = screen.getByRole('button', { name: /start voice input/i });
      await user.click(startButton);

      act(() => {
        const mockEvent = {
          resultIndex: 0,
          results: [
            {
              0: { transcript: 'contact form with name and email' },
              isFinal: true,
            },
          ],
        };
        if (mockRecognition.onresult) {
          mockRecognition.onresult(mockEvent);
        }
      });

      // Verify transcript callback
      await waitFor(() => {
        expect(onTranscriptComplete).toHaveBeenCalledWith('contact form with name and email');
      });

      const stopButton = await screen.findByRole('button', { name: /stop voice input/i });
      await user.click(stopButton);

      // Generate form
      const generateButton = screen.getByRole('button', { name: /generate form/i });
      await user.click(generateButton);

      // Verify form generation callback
      await waitFor(() => {
        expect(onGenerateForm).toHaveBeenCalledWith(
          'contact form with name and email',
          'en-US'
        );
      });
    });

    test('should preserve existing form when appending voice-generated fields', async () => {
      const user = userEvent.setup();
      const onGenerateForm = jest.fn().mockResolvedValue(undefined);

      // Start with existing transcript
      render(
        <VoiceInput
          onGenerateForm={onGenerateForm}
          initialTranscript="existing form description"
        />
      );

      // Verify initial transcript
      const textarea = screen.getByRole('textbox', { name: /voice transcription/i });
      expect(textarea).toHaveValue('existing form description');

      // Add more via voice
      const startButton = screen.getByRole('button', { name: /start voice input/i });
      await user.click(startButton);

      act(() => {
        const mockEvent = {
          resultIndex: 0,
          results: [
            {
              0: { transcript: 'and add phone number field' },
              isFinal: true,
            },
          ],
        };
        if (mockRecognition.onresult) {
          mockRecognition.onresult(mockEvent);
        }
      });

      // Verify transcripts are combined
      await waitFor(() => {
        expect(textarea).toHaveValue('existing form description and add phone number field');
      });
    });

    test('should handle disabled state', async () => {
      render(<VoiceInput disabled={true} />);

      // Verify buttons are disabled
      const startButton = screen.getByRole('button', { name: /start voice input/i });
      expect(startButton).toBeDisabled();

      const clearButton = screen.getByRole('button', { name: /clear all transcription/i });
      expect(clearButton).toBeDisabled();
    });
  });
});
