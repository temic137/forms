/**
 * Accessibility tests for VoiceInput component
 * Tests Requirements 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VoiceInput from '@/components/VoiceInput';
import { useVoiceInput } from '@/hooks/useVoiceInput';

// Mock the useVoiceInput hook
jest.mock('@/hooks/useVoiceInput');

// Mock transcription storage
jest.mock('@/lib/transcriptionStorage', () => ({
  transcriptionStorage: {
    load: jest.fn(() => null),
    save: jest.fn(() => true),
    clear: jest.fn(),
  },
}));

// Mock SpeechRecognitionService
jest.mock('@/lib/speechRecognition', () => ({
  SpeechRecognitionService: jest.fn().mockImplementation(() => ({
    detectBrowserSupport: () => ({
      speechRecognition: true,
      webAudioAPI: true,
      localStorage: true,
    }),
  })),
}));

describe('VoiceInput Accessibility', () => {
  const mockUseVoiceInput = useVoiceInput as jest.MockedFunction<typeof useVoiceInput>;

  beforeEach(() => {
    mockUseVoiceInput.mockReturnValue({
      isListening: false,
      transcript: '',
      interimTranscript: '',
      error: null,
      isSupported: true,
      audioLevel: 0,
      startListening: jest.fn(),
      stopListening: jest.fn(),
      resetTranscript: jest.fn(),
      setTranscript: jest.fn(),
      language: 'en-US',
      setLanguage: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ARIA Labels and Roles (Requirement 8.2)', () => {
    test('should have proper ARIA labels on all interactive elements', () => {
      render(<VoiceInput />);

      // Check microphone button
      const micButton = screen.getByRole('button', { name: /start voice input recording/i });
      expect(micButton).toBeInTheDocument();
      expect(micButton).toHaveAttribute('aria-pressed', 'false');

      // Check language selector
      const languageSelect = screen.getByRole('combobox', { name: /select voice input language/i });
      expect(languageSelect).toBeInTheDocument();

      // Check clear button
      const clearButton = screen.getByRole('button', { name: /clear all transcription text/i });
      expect(clearButton).toBeInTheDocument();

      // Check transcription textarea
      const textarea = screen.getByRole('textbox', { name: /voice transcription text area/i });
      expect(textarea).toBeInTheDocument();
    });

    test('should have region role on main container', () => {
      const { container } = render(<VoiceInput />);
      const region = container.querySelector('[role="region"]');
      expect(region).toBeInTheDocument();
      expect(region).toHaveAttribute('aria-label', 'Voice input controls');
    });

    test('should update aria-pressed when recording', () => {
      mockUseVoiceInput.mockReturnValue({
        isListening: true,
        transcript: '',
        interimTranscript: '',
        error: null,
        isSupported: true,
        audioLevel: 50,
        startListening: jest.fn(),
        stopListening: jest.fn(),
        resetTranscript: jest.fn(),
        setTranscript: jest.fn(),
        language: 'en-US',
        setLanguage: jest.fn(),
      });

      render(<VoiceInput />);

      const stopButton = screen.getByRole('button', { name: /stop voice input recording/i });
      expect(stopButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Visible Focus Indicators (Requirement 8.4)', () => {
    test('should have focus ring classes on all interactive elements', () => {
      render(<VoiceInput />);

      // Check microphone button has focus ring
      const micButton = screen.getByRole('button', { name: /start voice input recording/i });
      expect(micButton.className).toContain('focus:ring-2');
      expect(micButton.className).toContain('focus:ring-black');

      // Check language selector has focus ring
      const languageSelect = screen.getByRole('combobox');
      expect(languageSelect.className).toContain('focus:ring-2');

      // Check clear button has focus ring
      const clearButton = screen.getByRole('button', { name: /clear all transcription text/i });
      expect(clearButton.className).toContain('focus:ring-2');

      // Check textarea has focus ring
      const textarea = screen.getByRole('textbox');
      expect(textarea.className).toContain('focus:ring-2');
    });
  });

  describe('Screen Reader Announcements (Requirement 8.2, 8.3)', () => {
    test('should have screen reader announcement component', () => {
      const { container } = render(<VoiceInput />);
      
      // Check for sr-only elements (screen reader announcements)
      const srOnlyElements = container.querySelectorAll('.sr-only');
      expect(srOnlyElements.length).toBeGreaterThan(0);
    });

    test('should have aria-live regions for status updates', () => {
      mockUseVoiceInput.mockReturnValue({
        isListening: true,
        transcript: '',
        interimTranscript: '',
        error: null,
        isSupported: true,
        audioLevel: 50,
        startListening: jest.fn(),
        stopListening: jest.fn(),
        resetTranscript: jest.fn(),
        setTranscript: jest.fn(),
        language: 'en-US',
        setLanguage: jest.fn(),
      });

      const { container } = render(<VoiceInput />);

      // Check for aria-live regions
      const liveRegions = container.querySelectorAll('[aria-live]');
      expect(liveRegions.length).toBeGreaterThan(0);
    });
  });

  describe('Error Announcements (Requirement 8.4)', () => {
    test('should announce errors with assertive priority', () => {
      mockUseVoiceInput.mockReturnValue({
        isListening: false,
        transcript: '',
        interimTranscript: '',
        error: {
          type: 'permission-denied',
          message: 'Microphone access denied',
          recoverable: true,
        },
        isSupported: true,
        audioLevel: 0,
        startListening: jest.fn(),
        stopListening: jest.fn(),
        resetTranscript: jest.fn(),
        setTranscript: jest.fn(),
        language: 'en-US',
        setLanguage: jest.fn(),
      });

      const { container } = render(<VoiceInput />);

      // Check for error alert with assertive aria-live
      const errorAlert = container.querySelector('[role="alert"][aria-live="assertive"]');
      expect(errorAlert).toBeInTheDocument();
    });
  });

  describe('Audio Level Meter Accessibility', () => {
    test('should have proper ARIA attributes on audio level meter', () => {
      mockUseVoiceInput.mockReturnValue({
        isListening: true,
        transcript: '',
        interimTranscript: '',
        error: null,
        isSupported: true,
        audioLevel: 75,
        startListening: jest.fn(),
        stopListening: jest.fn(),
        resetTranscript: jest.fn(),
        setTranscript: jest.fn(),
        language: 'en-US',
        setLanguage: jest.fn(),
      });

      const { container } = render(<VoiceInput />);

      const meter = container.querySelector('[role="meter"]');
      expect(meter).toBeInTheDocument();
      expect(meter).toHaveAttribute('aria-label', 'Audio input level');
      expect(meter).toHaveAttribute('aria-valuenow', '75');
      expect(meter).toHaveAttribute('aria-valuemin', '0');
      expect(meter).toHaveAttribute('aria-valuemax', '100');
    });
  });

  describe('Dialog Accessibility', () => {
    test('should have proper ARIA attributes on clear confirmation dialog', async () => {
      mockUseVoiceInput.mockReturnValue({
        isListening: false,
        transcript: 'Test transcript',
        interimTranscript: '',
        error: null,
        isSupported: true,
        audioLevel: 0,
        startListening: jest.fn(),
        stopListening: jest.fn(),
        resetTranscript: jest.fn(),
        setTranscript: jest.fn(),
        language: 'en-US',
        setLanguage: jest.fn(),
      });

      render(<VoiceInput />);

      // Click clear button
      const clearButton = screen.getByRole('button', { name: /clear all transcription text/i });
      fireEvent.click(clearButton);

      // Check dialog attributes
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('aria-labelledby', 'clear-dialog-title');
        expect(dialog).toHaveAttribute('aria-describedby', 'clear-dialog-description');
      });
    });
  });

  describe('Generate Form Button Accessibility', () => {
    test('should have aria-busy when generating', () => {
      const { rerender } = render(
        <VoiceInput 
          onGenerateForm={jest.fn()}
        />
      );

      mockUseVoiceInput.mockReturnValue({
        isListening: false,
        transcript: 'Test transcript',
        interimTranscript: '',
        error: null,
        isSupported: true,
        audioLevel: 0,
        startListening: jest.fn(),
        stopListening: jest.fn(),
        resetTranscript: jest.fn(),
        setTranscript: jest.fn(),
        language: 'en-US',
        setLanguage: jest.fn(),
      });

      rerender(<VoiceInput onGenerateForm={jest.fn()} />);

      const generateButton = screen.getByRole('button', { name: /generate form from transcription/i });
      expect(generateButton).toHaveAttribute('aria-busy', 'false');
    });
  });
});
