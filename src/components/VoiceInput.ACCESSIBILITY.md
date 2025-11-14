# Voice Input Accessibility Features

This document describes the accessibility features implemented in the Voice Input system to ensure WCAG 2.1 AA compliance and provide an inclusive experience for all users.

## Overview

The Voice Input feature has been designed with accessibility as a core requirement, implementing comprehensive support for keyboard navigation, screen readers, and assistive technologies.

## Implemented Features

### 1. Keyboard Shortcuts (Requirement 8.1)

**Shortcut: Ctrl+Shift+V (Cmd+Shift+V on Mac)**

- **Purpose**: Toggle voice input panel on/off
- **Implementation**: `useKeyboardShortcut` hook in `VoiceInputPanel`
- **Behavior**: 
  - Works from anywhere in the form builder
  - Prevents default browser behavior
  - Supports both Ctrl (Windows/Linux) and Cmd (Mac)
  - Can be disabled when needed

**Usage Example**:
```typescript
useKeyboardShortcut(
  { key: 'v', ctrl: true, shift: true },
  onToggle,
  true
);
```

### 2. ARIA Labels and Roles (Requirement 8.2)

All interactive elements have proper ARIA labels and roles:

#### Main Container
- `role="region"` - Identifies the voice input area
- `aria-label="Voice input controls"` - Describes the region

#### Buttons
- **Start Recording Button**:
  - `aria-label="Start voice input recording"`
  - `aria-pressed="false"` (updates to "true" when recording)
  - `title="Start voice input (Ctrl+Shift+V)"`

- **Stop Recording Button**:
  - `aria-label="Stop voice input recording"`
  - `aria-pressed="true"`

- **Clear Button**:
  - `aria-label="Clear all transcription text"`

- **Generate Form Button**:
  - `aria-label="Generate form from transcription"`
  - `aria-busy="true"` when generating

#### Form Controls
- **Language Selector**:
  - `aria-label="Select voice input language"`
  - `aria-describedby="language-help"`

- **Transcription Textarea**:
  - `id="voice-transcript"`
  - `aria-label="Voice transcription text area"`
  - `aria-describedby="transcript-help"`

#### Status Indicators
- **Recording Status**:
  - `role="status"`
  - `aria-live="polite"`
  - `aria-label="Recording in progress"`

- **Audio Level Meter**:
  - `role="meter"`
  - `aria-label="Audio input level"`
  - `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
  - `aria-valuetext` for percentage

### 3. Screen Reader Announcements (Requirement 8.2, 8.3)

The system announces important status changes to screen readers using `aria-live` regions:

#### Polite Announcements (non-intrusive)
- "Voice input started. Recording in progress."
- "Voice input stopped. Recording complete."
- "Transcription cleared."
- "Generating form from transcription. Please wait."
- "Form generated successfully!"
- Transcription updates: "Transcription updated. X words captured."

#### Assertive Announcements (immediate)
- Error messages
- "Failed to generate form. Please try again."

**Implementation**:
```typescript
const { announcement, priority, announce } = useScreenReaderAnnouncement();

// Announce status change
announce('Voice input started. Recording in progress.', 'polite');

// Announce error
announce('Failed to generate form. Please try again.', 'assertive');
```

### 4. Visible Focus Indicators (Requirement 8.4)

All interactive elements have visible focus indicators using Tailwind CSS classes:

```css
focus:outline-none 
focus:ring-2 
focus:ring-black 
focus:ring-offset-2
```

**Global Focus Styles** (in `globals.css`):
```css
*:focus-visible {
  outline: 2px solid #000;
  outline-offset: 2px;
}
```

This ensures:
- High contrast focus rings (2px solid black)
- Consistent offset (2px) for visibility
- Works with keyboard navigation
- Doesn't show on mouse clicks (`:focus-visible`)

### 5. Non-Intrusive Transcription Updates (Requirement 8.5)

Transcription updates are announced to screen readers in a non-intrusive way:

- **Debounced Announcements**: Updates are debounced by 2 seconds to avoid overwhelming screen readers
- **Word Count**: Announces the number of words captured instead of reading the entire transcript
- **Polite Priority**: Uses `aria-live="polite"` to wait for natural pauses
- **Final Results Only**: Only announces final transcription, not interim results

**Implementation**:
```typescript
useEffect(() => {
  if (editableTranscript && editableTranscript !== lastAnnouncedTranscriptRef.current) {
    const timeoutId = setTimeout(() => {
      const wordCount = editableTranscript.trim().split(/\s+/).length;
      announce(`Transcription updated. ${wordCount} words captured.`, 'polite');
      lastAnnouncedTranscriptRef.current = editableTranscript;
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeoutId);
  }
}, [editableTranscript, announce]);
```

### 6. Error Announcements (Requirement 8.4)

Errors are announced to assistive technologies with high priority:

- **Role**: `role="alert"` on error containers
- **Priority**: `aria-live="assertive"` for immediate announcement
- **Atomic**: `aria-atomic="true"` to read entire error message
- **Dismissible**: Clear focus management when dismissing errors

**Error Types Announced**:
- Permission denied
- No speech detected
- Network errors
- Browser compatibility issues
- Form generation failures

### 7. Dialog Accessibility

The clear confirmation dialog follows best practices:

```typescript
<div 
  role="dialog"
  aria-modal="true"
  aria-labelledby="clear-dialog-title"
  aria-describedby="clear-dialog-description"
>
  <h4 id="clear-dialog-title">Clear Transcription?</h4>
  <p id="clear-dialog-description">
    This will remove all transcribed text. This action cannot be undone.
  </p>
</div>
```

## Screen Reader Only Content

The `.sr-only` class hides content visually but keeps it available for screen readers:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

**Used for**:
- Helper text for form controls
- Additional context for buttons
- Hidden labels for decorative elements

## Testing Accessibility

### Manual Testing Checklist

1. **Keyboard Navigation**:
   - [ ] Tab through all controls in logical order
   - [ ] Press Ctrl+Shift+V to toggle voice input
   - [ ] Use Enter/Space to activate buttons
   - [ ] Verify focus indicators are visible

2. **Screen Reader Testing** (NVDA/JAWS/VoiceOver):
   - [ ] Navigate through voice input controls
   - [ ] Verify status announcements when recording starts/stops
   - [ ] Verify error messages are announced
   - [ ] Verify transcription updates are announced
   - [ ] Check that decorative elements are hidden

3. **High Contrast Mode**:
   - [ ] Verify focus indicators are visible
   - [ ] Check button states are distinguishable
   - [ ] Verify error messages are readable

4. **Zoom Testing**:
   - [ ] Test at 200% zoom
   - [ ] Verify no content is cut off
   - [ ] Check that controls remain usable

### Automated Testing

Run accessibility tests:
```bash
npm test -- VoiceInput.accessibility.test.tsx
```

## Browser Support

Accessibility features are supported in:
- Chrome 90+ (full support)
- Edge 90+ (full support)
- Firefox 88+ (full support)
- Safari 14+ (full support)

## WCAG 2.1 AA Compliance

The Voice Input feature meets the following WCAG 2.1 AA criteria:

- **1.3.1 Info and Relationships**: Proper semantic HTML and ARIA
- **2.1.1 Keyboard**: All functionality available via keyboard
- **2.1.2 No Keyboard Trap**: Users can navigate away from all controls
- **2.4.3 Focus Order**: Logical tab order
- **2.4.7 Focus Visible**: Clear focus indicators
- **3.2.4 Consistent Identification**: Consistent labeling
- **4.1.2 Name, Role, Value**: Proper ARIA attributes
- **4.1.3 Status Messages**: Appropriate use of aria-live regions

## Future Enhancements

Potential accessibility improvements for future versions:

1. **Voice Commands**: Allow users to control the interface with voice
2. **Customizable Shortcuts**: Let users define their own keyboard shortcuts
3. **High Contrast Theme**: Dedicated high contrast color scheme
4. **Reduced Motion**: Respect `prefers-reduced-motion` for animations
5. **Language-Specific Announcements**: Announce in the selected language

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [Keyboard Accessibility](https://webaim.org/techniques/keyboard/)

## Support

For accessibility issues or questions, please contact the development team or file an issue in the project repository.
