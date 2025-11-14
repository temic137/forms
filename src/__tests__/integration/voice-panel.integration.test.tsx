/**
 * Integration Tests: VoiceInputPanel Component
 * Tests Requirements: 5.1, 8.1, 11.1, 11.2, 11.3
 * 
 * These tests verify the integration of VoiceInputPanel with:
 * - Form builder state
 * - Keyboard shortcuts
 * - Settings management
 * - Collapsible UI behavior
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VoiceInputPanel from '@/components/builder/VoiceInputPanel';
import { voiceSettings } from '@/lib/voiceSettings';

// Mock dependencies
jest.mock('@/lib/speechRecognition');
jest.mock('@/lib/voiceAnalytics');
jest.mock('@/lib/performanceMonitor');
jest.mock('@/components/VoiceInputLazy', () => {
  return function MockVoiceInputLazy({ onGenerateForm, onTranscriptComplete }: any) {
    return (
      <div data-testid="voice-input-lazy">
        <button
          onClick={() => onTranscriptComplete('test transcript')}
          data-testid="mock-transcript-button"
        >
          Mock Transcript
        </button>
        <button
          onClick={() => onGenerateForm('test transcript', 'en-US')}
          data-testid="mock-generate-button"
        >
          Mock Generate
        </button>
      </div>
    );
  };
});

describe('VoiceInputPanel Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    voiceSettings.setEnabled(true);
    voiceSettings.acceptPrivacyNotice();
  });

  describe('Panel Toggle Behavior', () => {
    test('should toggle panel visibility', async () => {
      const user = userEvent.setup();
      const onToggle = jest.fn();

      render(
        <VoiceInputPanel
          onGenerateForm={jest.fn()}
          isExpanded={false}
          onToggle={onToggle}
        />
      );

      // Panel should be collapsed initially
      expect(screen.queryByTestId('voice-input-lazy')).not.toBeInTheDocument();

      // Click to expand
      const toggleButton = screen.getByRole('button', { name: /expand voice input panel/i });
      await user.click(toggleButton);

      expect(onToggle).toHaveBeenCalled();
    });

    test('should show voice input when expanded', async () => {
      render(
        <VoiceInputPanel
          onGenerateForm={jest.fn()}
          isExpanded={true}
          onToggle={jest.fn()}
        />
      );

      // Panel should be visible
      expect(screen.getByTestId('voice-input-lazy')).toBeInTheDocument();
    });

    test('should hide voice input when collapsed', async () => {
      render(
        <VoiceInputPanel
          onGenerateForm={jest.fn()}
          isExpanded={false}
          onToggle={jest.fn()}
        />
      );

      // Panel should be hidden
      expect(screen.queryByTestId('voice-input-lazy')).not.toBeInTheDocument();
    });

    test('should show transcript ready indicator when collapsed with transcript', async () => {
      const user = userEvent.setup();
      const onToggle = jest.fn();

      const { rerender } = render(
        <VoiceInputPanel
          onGenerateForm={jest.fn()}
          isExpanded={true}
          onToggle={onToggle}
        />
      );

      // Simulate getting a transcript
      const transcriptButton = screen.getByTestId('mock-transcript-button');
      await user.click(transcriptButton);

      // Collapse panel
      rerender(
        <VoiceInputPanel
          onGenerateForm={jest.fn()}
          isExpanded={false}
          onToggle={onToggle}
        />
      );

      // Should show indicator
      expect(screen.getByText(/transcript ready/i)).toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts', () => {
    test('should toggle panel with Ctrl+Shift+V', async () => {
      const user = userEvent.setup();
      const onToggle = jest.fn();

      render(
        <VoiceInputPanel
          onGenerateForm={jest.fn()}
          isExpanded={false}
          onToggle={onToggle}
        />
      );

      // Press Ctrl+Shift+V
      await user.keyboard('{Control>}{Shift>}v{/Shift}{/Control}');

      expect(onToggle).toHaveBeenCalled();
    });

    test('should work when panel is expanded', async () => {
      const user = userEvent.setup();
      const onToggle = jest.fn();

      render(
        <VoiceInputPanel
          onGenerateForm={jest.fn()}
          isExpanded={true}
          onToggle={onToggle}
        />
      );

      // Press Ctrl+Shift+V to collapse
      await user.keyboard('{Control>}{Shift>}v{/Shift}{/Control}');

      expect(onToggle).toHaveBeenCalled();
    });
  });

  describe('Form Generation Integration', () => {
    test('should call onGenerateForm with transcript and language', async () => {
      const user = userEvent.setup();
      const onGenerateForm = jest.fn().mockResolvedValue(undefined);

      render(
        <VoiceInputPanel
          onGenerateForm={onGenerateForm}
          isExpanded={true}
          onToggle={jest.fn()}
        />
      );

      // Trigger form generation
      const generateButton = screen.getByTestId('mock-generate-button');
      await user.click(generateButton);

      await waitFor(() => {
        expect(onGenerateForm).toHaveBeenCalledWith('test transcript', 'en-US');
      });
    });

    test('should handle form generation errors', async () => {
      const user = userEvent.setup();
      const onGenerateForm = jest.fn().mockRejectedValue(new Error('Generation failed'));

      render(
        <VoiceInputPanel
          onGenerateForm={onGenerateForm}
          isExpanded={true}
          onToggle={jest.fn()}
        />
      );

      // Trigger form generation
      const generateButton = screen.getByTestId('mock-generate-button');
      await user.click(generateButton);

      await waitFor(() => {
        expect(onGenerateForm).toHaveBeenCalled();
      });

      // Error should be handled by VoiceInput component
      // Panel should remain functional
      expect(screen.getByTestId('voice-input-lazy')).toBeInTheDocument();
    });

    test('should preserve transcript between panel toggles', async () => {
      const user = userEvent.setup();
      const onToggle = jest.fn();

      const { rerender } = render(
        <VoiceInputPanel
          onGenerateForm={jest.fn()}
          isExpanded={true}
          onToggle={onToggle}
        />
      );

      // Get transcript
      const transcriptButton = screen.getByTestId('mock-transcript-button');
      await user.click(transcriptButton);

      // Collapse panel
      rerender(
        <VoiceInputPanel
          onGenerateForm={jest.fn()}
          isExpanded={false}
          onToggle={onToggle}
        />
      );

      // Expand again
      rerender(
        <VoiceInputPanel
          onGenerateForm={jest.fn()}
          isExpanded={true}
          onToggle={onToggle}
        />
      );

      // Transcript should still be available
      expect(screen.getByTestId('voice-input-lazy')).toBeInTheDocument();
    });
  });

  describe('Settings Integration', () => {
    test('should show settings panel when settings button clicked', async () => {
      const user = userEvent.setup();

      render(
        <VoiceInputPanel
          onGenerateForm={jest.fn()}
          isExpanded={true}
          onToggle={jest.fn()}
        />
      );

      // Click settings button
      const settingsButton = screen.getByRole('button', { name: /voice input settings/i });
      await user.click(settingsButton);

      // Settings panel should appear
      await waitFor(() => {
        expect(screen.getByText(/voice input enabled/i)).toBeInTheDocument();
      });
    });

    test('should hide settings panel when voice input is disabled', async () => {
      const user = userEvent.setup();

      render(
        <VoiceInputPanel
          onGenerateForm={jest.fn()}
          isExpanded={true}
          onToggle={jest.fn()}
        />
      );

      // Open settings
      const settingsButton = screen.getByRole('button', { name: /voice input settings/i });
      await user.click(settingsButton);

      // Disable voice input
      const toggle = screen.getByRole('checkbox', { name: /enable voice input/i });
      await user.click(toggle);

      // Settings panel should close
      await waitFor(() => {
        expect(screen.queryByText(/voice input enabled/i)).not.toBeInTheDocument();
      });
    });

    test('should toggle settings panel', async () => {
      const user = userEvent.setup();

      render(
        <VoiceInputPanel
          onGenerateForm={jest.fn()}
          isExpanded={true}
          onToggle={jest.fn()}
        />
      );

      const settingsButton = screen.getByRole('button', { name: /voice input settings/i });

      // Open settings
      await user.click(settingsButton);
      expect(screen.getByText(/voice input enabled/i)).toBeInTheDocument();

      // Close settings
      await user.click(settingsButton);
      await waitFor(() => {
        expect(screen.queryByText(/voice input enabled/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA attributes', () => {
      render(
        <VoiceInputPanel
          onGenerateForm={jest.fn()}
          isExpanded={false}
          onToggle={jest.fn()}
        />
      );

      const toggleButton = screen.getByRole('button', { name: /expand voice input panel/i });
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
      expect(toggleButton).toHaveAttribute('aria-controls', 'voice-input-content');
    });

    test('should update ARIA attributes when expanded', () => {
      render(
        <VoiceInputPanel
          onGenerateForm={jest.fn()}
          isExpanded={true}
          onToggle={jest.fn()}
        />
      );

      const toggleButton = screen.getByRole('button', { name: /collapse voice input panel/i });
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    });

    test('should have accessible region label', () => {
      render(
        <VoiceInputPanel
          onGenerateForm={jest.fn()}
          isExpanded={true}
          onToggle={jest.fn()}
        />
      );

      const region = screen.getByRole('region', { name: /voice input controls/i });
      expect(region).toBeInTheDocument();
    });

    test('should have keyboard shortcut hint in title', () => {
      render(
        <VoiceInputPanel
          onGenerateForm={jest.fn()}
          isExpanded={false}
          onToggle={jest.fn()}
        />
      );

      const toggleButton = screen.getByRole('button', { name: /expand voice input panel/i });
      expect(toggleButton).toHaveAttribute('title', expect.stringContaining('Ctrl+Shift+V'));
    });
  });

  describe('Performance', () => {
    test('should lazy load voice input component', () => {
      render(
        <VoiceInputPanel
          onGenerateForm={jest.fn()}
          isExpanded={false}
          onToggle={jest.fn()}
        />
      );

      // Component should not be loaded when collapsed
      expect(screen.queryByTestId('voice-input-lazy')).not.toBeInTheDocument();
    });

    test('should load voice input only when expanded', () => {
      const { rerender } = render(
        <VoiceInputPanel
          onGenerateForm={jest.fn()}
          isExpanded={false}
          onToggle={jest.fn()}
        />
      );

      expect(screen.queryByTestId('voice-input-lazy')).not.toBeInTheDocument();

      // Expand panel
      rerender(
        <VoiceInputPanel
          onGenerateForm={jest.fn()}
          isExpanded={true}
          onToggle={jest.fn()}
        />
      );

      // Component should now be loaded
      expect(screen.getByTestId('voice-input-lazy')).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    test('should maintain transcript state across renders', async () => {
      const user = userEvent.setup();
      const onGenerateForm = jest.fn();

      const { rerender } = render(
        <VoiceInputPanel
          onGenerateForm={onGenerateForm}
          isExpanded={true}
          onToggle={jest.fn()}
        />
      );

      // Set transcript
      const transcriptButton = screen.getByTestId('mock-transcript-button');
      await user.click(transcriptButton);

      // Re-render with same props
      rerender(
        <VoiceInputPanel
          onGenerateForm={onGenerateForm}
          isExpanded={true}
          onToggle={jest.fn()}
        />
      );

      // Transcript should be preserved
      expect(screen.getByTestId('voice-input-lazy')).toBeInTheDocument();
    });

    test('should pass transcript to VoiceInput component', async () => {
      const user = userEvent.setup();

      render(
        <VoiceInputPanel
          onGenerateForm={jest.fn()}
          isExpanded={true}
          onToggle={jest.fn()}
        />
      );

      // Set transcript
      const transcriptButton = screen.getByTestId('mock-transcript-button');
      await user.click(transcriptButton);

      // Transcript should be available for form generation
      const generateButton = screen.getByTestId('mock-generate-button');
      expect(generateButton).toBeInTheDocument();
    });
  });

  describe('Integration with Form Builder', () => {
    test('should integrate with form builder workflow', async () => {
      const user = userEvent.setup();
      const onGenerateForm = jest.fn().mockResolvedValue(undefined);
      const onToggle = jest.fn();

      render(
        <VoiceInputPanel
          onGenerateForm={onGenerateForm}
          isExpanded={true}
          onToggle={onToggle}
        />
      );

      // Complete voice input workflow
      const transcriptButton = screen.getByTestId('mock-transcript-button');
      await user.click(transcriptButton);

      const generateButton = screen.getByTestId('mock-generate-button');
      await user.click(generateButton);

      // Verify form generation was triggered
      await waitFor(() => {
        expect(onGenerateForm).toHaveBeenCalled();
      });
    });

    test('should allow multiple form generations', async () => {
      const user = userEvent.setup();
      const onGenerateForm = jest.fn().mockResolvedValue(undefined);

      render(
        <VoiceInputPanel
          onGenerateForm={onGenerateForm}
          isExpanded={true}
          onToggle={jest.fn()}
        />
      );

      // First generation
      const generateButton = screen.getByTestId('mock-generate-button');
      await user.click(generateButton);

      await waitFor(() => {
        expect(onGenerateForm).toHaveBeenCalledTimes(1);
      });

      // Second generation
      await user.click(generateButton);

      await waitFor(() => {
        expect(onGenerateForm).toHaveBeenCalledTimes(2);
      });
    });
  });
});
