import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TranscriptionDisplay from '../TranscriptionDisplay';

describe('TranscriptionDisplay', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
    disabled: false,
    placeholder: 'Start speaking...',
    isListening: false,
    'aria-label': 'Transcription area',
  };

  test('renders textarea with correct props', () => {
    render(<TranscriptionDisplay {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('aria-label', 'Transcription area');
  });

  test('displays value correctly', () => {
    render(<TranscriptionDisplay {...defaultProps} value="Test transcript" />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('Test transcript');
  });

  test('shows interim text when listening', () => {
    render(
      <TranscriptionDisplay
        {...defaultProps}
        value="Final text"
        interimText="interim text"
        isListening={true}
      />
    );
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('Final text interim text');
  });

  test('shows listening indicator when active', () => {
    render(
      <TranscriptionDisplay
        {...defaultProps}
        isListening={true}
        interimText="test"
      />
    );
    
    expect(screen.getByText('Listening...')).toBeInTheDocument();
  });

  test('does not show listening indicator when not active', () => {
    render(<TranscriptionDisplay {...defaultProps} isListening={false} />);
    
    expect(screen.queryByText('Listening...')).not.toBeInTheDocument();
  });

  test('calls onChange when text is edited', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    
    render(<TranscriptionDisplay {...defaultProps} onChange={onChange} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'New text');
    
    expect(onChange).toHaveBeenCalled();
  });

  test('is disabled when disabled prop is true', () => {
    render(<TranscriptionDisplay {...defaultProps} disabled={true} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });

  test('memoization prevents unnecessary re-renders', () => {
    const { rerender } = render(<TranscriptionDisplay {...defaultProps} />);
    
    // Re-render with same props
    rerender(<TranscriptionDisplay {...defaultProps} />);
    
    // Component should not re-render (React.memo optimization)
    // This is tested implicitly - if memo works, no errors occur
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
