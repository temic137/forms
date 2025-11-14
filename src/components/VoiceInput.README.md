# VoiceInput Component

A React component that provides voice-powered form input using the Web Speech API. Users can speak their form requirements naturally, and the component converts speech to text in real-time.

## Features

- ✅ Real-time speech-to-text transcription
- ✅ Visual recording status indicator with pulsing animation
- ✅ Editable transcription text area
- ✅ Multi-language support (6 languages)
- ✅ Clear button with confirmation dialog
- ✅ Start/Stop recording controls
- ✅ Interim results display with visual distinction
- ✅ Error handling with recovery options
- ✅ Browser compatibility detection
- ✅ Loading state for form generation
- ✅ Accessible with ARIA labels

## Usage

```tsx
import VoiceInput from '@/components/VoiceInput';

function MyComponent() {
  const handleTranscriptComplete = (transcript: string) => {
    console.log('Transcript:', transcript);
  };

  const handleGenerateForm = async (transcript: string) => {
    // Process the transcript and generate form
    await generateFormFromTranscript(transcript);
  };

  return (
    <VoiceInput
      onTranscriptComplete={handleTranscriptComplete}
      onGenerateForm={handleGenerateForm}
      initialTranscript=""
      disabled={false}
    />
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onTranscriptComplete` | `(transcript: string) => void` | No | - | Callback fired when transcript changes |
| `onGenerateForm` | `(transcript: string) => Promise<void>` | No | - | Callback to generate form from transcript |
| `initialTranscript` | `string` | No | `''` | Initial transcript text |
| `disabled` | `boolean` | No | `false` | Disable all controls |

## Supported Languages

- English (US) - `en-US`
- Spanish - `es-ES`
- French - `fr-FR`
- German - `de-DE`
- Chinese - `zh-CN`
- Japanese - `ja-JP`

## Browser Support

The component uses the Web Speech API, which is supported in:

- ✅ Chrome 25+
- ✅ Edge 79+
- ✅ Safari 14.1+
- ✅ Opera 27+
- ❌ Firefox (limited support)

The component automatically detects browser support and displays a warning if the browser doesn't support voice input.

## Component Structure

### Main Controls
- **Microphone Button**: Starts voice recording
- **Stop Button**: Stops active recording (appears when recording)
- **Clear Button**: Clears all transcription with confirmation
- **Language Selector**: Dropdown to select input language

### Status Indicators
- **Recording Indicator**: Red pulsing dot with "Recording..." text
- **Interim Results Badge**: Blue badge showing "Listening..." when processing
- **Error Display**: Red alert box with error message and retry option

### Transcription Area
- **Editable Textarea**: Displays and allows editing of transcription
- **Placeholder Text**: Helpful example when empty
- **Helper Text**: Tips for effective voice input

### Action Button
- **Generate Form Button**: Triggers form generation with loading state

## Visual Feedback

1. **Recording State**: 
   - Stop button replaces microphone button
   - Red pulsing dot indicator
   - "Recording..." status text

2. **Interim Results**:
   - Displayed in textarea with final text
   - Blue "Listening..." badge in bottom-right corner

3. **Error State**:
   - Red alert box with error message
   - "Try Again" button for recoverable errors

4. **Loading State**:
   - Spinning loader icon
   - "Generating Form..." text
   - Disabled controls

## Error Handling

The component handles various error types:

- **Not Supported**: Browser doesn't support Web Speech API
- **Permission Denied**: User denied microphone access
- **No Speech**: No speech detected during recording
- **Network Error**: Network connectivity issues
- **Audio Capture**: Microphone access problems

Each error displays a user-friendly message with recovery options when applicable.

## Accessibility

- All interactive elements have ARIA labels
- Recording status announced via `aria-live="polite"`
- Keyboard accessible controls
- Focus indicators on all buttons
- Screen reader friendly error messages

## Example: Integration with Form Builder

```tsx
import VoiceInput from '@/components/VoiceInput';

function FormBuilder() {
  const [showVoiceInput, setShowVoiceInput] = useState(false);

  const handleGenerateForm = async (transcript: string) => {
    const response = await fetch('/api/ai/generate-from-voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, language: 'en-US' }),
    });
    
    const { form } = await response.json();
    // Populate form builder with generated fields
    setFields(form.fields);
  };

  return (
    <div>
      <button onClick={() => setShowVoiceInput(!showVoiceInput)}>
        Toggle Voice Input
      </button>
      
      {showVoiceInput && (
        <VoiceInput onGenerateForm={handleGenerateForm} />
      )}
    </div>
  );
}
```

## Testing

A test page is available at `/voice-test` to verify the component functionality:

```bash
npm run dev
# Navigate to http://localhost:3000/voice-test
```

## Requirements Satisfied

This component satisfies the following requirements from the specification:

- **1.1**: Microphone button to initiate voice input
- **1.5**: Visual indicator showing recording in progress
- **2.2**: Real-time transcription display
- **2.3**: Interim results with visual distinction
- **3.1**: Stop button to end voice input
- **3.2**: Restart capability after stopping
- **6.1**: Language selector with supported languages

## Notes

- The component automatically saves transcript changes to parent via `onTranscriptComplete`
- Manual edits to the transcript are preserved when resuming recording
- The clear action requires confirmation to prevent accidental data loss
- Language changes during recording will restart the recognition service
