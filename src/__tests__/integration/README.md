# Voice Form Generation - Integration Tests

This directory contains integration tests for the voice form generation feature. These tests verify the end-to-end functionality and integration between components.

## Test Files

### 1. voice-to-form.integration.test.tsx

**Purpose:** Tests the complete voice-to-form workflow from user interaction to form generation.

**Coverage:**
- Complete voice input flow (start → speak → stop → generate)
- Transcription editing and manual corrections
- Multiple speech segment accumulation
- Error recovery scenarios (permission denied, no-speech, network errors)
- Session persistence and restoration
- Storage quota handling
- Multi-language support and language switching
- Integration with form builder state
- Disabled state handling

**Key Test Scenarios:**
- User starts recording, speaks, stops, and generates form
- User edits transcription before generating form
- System accumulates multiple speech segments
- System recovers from permission denied error
- System handles no-speech timeout
- System preserves transcription on form generation failure
- System saves transcription to local storage automatically
- System restores previous session on page load
- System clears storage after successful form generation
- System handles expired sessions (>24 hours)
- System handles storage quota errors gracefully
- User switches language mid-session with warning
- System passes language to form generation API
- System restores language from saved session

### 2. voice-api.integration.test.ts

**Purpose:** Tests the AI form generation API endpoint.

**Coverage:**
- Form generation from text transcriptions
- Multi-language support (English, Spanish, French, German, Chinese, Japanese)
- Various field types (text, email, number, select, checkbox, etc.)
- Field property normalization
- Privacy and security (text-only processing)
- Error handling (AI service errors, invalid responses, malformed JSON)
- Confidence score normalization
- Performance benchmarks

**Key Test Scenarios:**
- API generates form from English transcription
- API generates form from Spanish transcription
- API generates form with various field types
- API normalizes missing field properties
- API only accepts text transcriptions (not audio)
- API rejects invalid transcript types
- API includes language context in AI prompt
- API defaults to English if language not specified
- API handles AI service errors
- API handles invalid AI response structure
- API handles malformed JSON from AI
- API normalizes confidence scores to 0.0-1.0 range
- API completes form generation within 5 seconds

### 3. voice-panel.integration.test.tsx

**Purpose:** Tests the VoiceInputPanel component integration with form builder.

**Coverage:**
- Panel toggle behavior (expand/collapse)
- Keyboard shortcuts (Ctrl+Shift+V)
- Form generation integration
- Settings management
- Accessibility features
- Performance (lazy loading)
- State management
- Integration with form builder workflow

**Key Test Scenarios:**
- Panel toggles visibility on button click
- Panel shows voice input when expanded
- Panel shows "transcript ready" indicator when collapsed with transcript
- Panel toggles with Ctrl+Shift+V keyboard shortcut
- Panel calls onGenerateForm with transcript and language
- Panel handles form generation errors
- Panel preserves transcript between toggles
- Panel shows/hides settings panel
- Panel has proper ARIA attributes
- Panel lazy loads voice input component
- Panel maintains transcript state across renders
- Panel allows multiple form generations

## Running the Tests

### Run All Integration Tests

```bash
npm test -- --testPathPattern=integration
```

### Run Specific Test File

```bash
npm test -- voice-to-form.integration.test.tsx
npm test -- voice-api.integration.test.ts
npm test -- voice-panel.integration.test.tsx
```

### Run with Coverage

```bash
npm test -- --testPathPattern=integration --coverage
```

### Run in Watch Mode

```bash
npm test -- --testPathPattern=integration --watch
```

## Test Requirements Coverage

These integration tests verify the following requirements from the design document:

### Complete Voice-to-Form Flow
- **Requirement 1.1-1.5:** Voice input activation and control
- **Requirement 2.1-2.5:** Speech recognition and transcription
- **Requirement 3.1-3.5:** Voice input control (start/stop/pause)
- **Requirement 4.1-4.5:** Transcription editing
- **Requirement 5.1-5.5:** AI form generation from voice

### Error Recovery
- **Requirement 2.5:** Speech recognition error handling
- **Requirement 5.5:** Form generation failure handling
- **Requirement 7.5:** Error display and recovery
- **Requirement 10.1-10.5:** Error recovery strategies

### Session Persistence
- **Requirement 14.1:** Auto-save to local storage every 5 seconds
- **Requirement 14.2:** Restore transcription on page load
- **Requirement 14.3:** Clear storage after successful form generation
- **Requirement 14.4:** Handle storage errors with fallback
- **Requirement 14.5:** Session expiration (24-hour TTL)

### Multi-Language Support
- **Requirement 6.1:** Language selector with 6 supported languages
- **Requirement 6.2:** Update speech recognition language when changed
- **Requirement 6.3:** Warning when switching languages mid-session
- **Requirement 6.4:** Pass language to AI service
- **Requirement 6.5:** Auto-detect user's browser language

### Integration with Form Builder
- **Requirement 5.1:** Voice input toggle in form builder
- **Requirement 5.4:** Connect voice generation to form builder state
- **Requirement 5.5:** Populate form fields from AI-generated configuration
- **Requirement 11.1-11.3:** Integration with existing form builder features

### Privacy and Security
- **Requirement 9.1:** Privacy notice explaining local processing
- **Requirement 9.2:** Option to disable voice input
- **Requirement 9.3:** Only text sent to AI service (not audio)
- **Requirement 9.4:** Automatic cleanup on navigation
- **Requirement 9.5:** Clear privacy messaging

### Accessibility
- **Requirement 8.1:** Keyboard shortcut (Ctrl+Shift+V)
- **Requirement 8.2:** Screen reader announcements
- **Requirement 8.3:** ARIA labels and roles
- **Requirement 8.4:** Error announcements to assistive technologies

## Test Architecture

### Mocking Strategy

The integration tests use the following mocking approach:

1. **SpeechRecognition API:** Mocked to simulate browser speech recognition
2. **AudioContext:** Mocked to simulate audio level monitoring
3. **MediaDevices:** Mocked to simulate microphone access
4. **Fetch API:** Mocked for AI API calls
5. **Groq Client:** Mocked for AI service integration
6. **Local Storage:** Real implementation (jsdom)
7. **Voice Settings:** Real implementation
8. **Transcription Storage:** Real implementation

### Test Data

Tests use realistic transcription examples:
- "I need a contact form with name, email, and message"
- "registration form with name, email, age, country dropdown, and terms checkbox"
- "formulario de contacto con nombre y correo" (Spanish)
- "formulaire de contact" (French)

### Assertions

Tests verify:
- Component rendering and visibility
- User interactions (clicks, typing, keyboard shortcuts)
- State changes and updates
- API calls with correct parameters
- Error handling and recovery
- Accessibility attributes
- Performance characteristics

## Best Practices

1. **Test Real User Flows:** Tests simulate actual user interactions
2. **Verify Integration Points:** Tests check component communication
3. **Handle Async Operations:** Tests use waitFor for async updates
4. **Test Error Scenarios:** Tests verify error handling and recovery
5. **Check Accessibility:** Tests verify ARIA attributes and screen reader support
6. **Measure Performance:** Tests include performance benchmarks
7. **Use Realistic Data:** Tests use realistic transcription examples
8. **Clean Up:** Tests clean up mocks and state after each test

## Troubleshooting

### Tests Timeout

If tests timeout, increase the timeout:
```javascript
jest.setTimeout(10000); // 10 seconds
```

### Mock Not Working

Ensure mocks are set up before component render:
```javascript
beforeEach(() => {
  // Setup mocks here
});
```

### Async Issues

Use `waitFor` for async operations:
```javascript
await waitFor(() => {
  expect(screen.getByText('Expected text')).toBeInTheDocument();
});
```

### Storage Issues

Clear storage between tests:
```javascript
beforeEach(() => {
  transcriptionStorage.clear();
});
```

## Future Enhancements

Potential additions to integration tests:

1. **Real Browser Testing:** Use Playwright or Cypress for real browser tests
2. **Performance Profiling:** Add detailed performance measurements
3. **Visual Regression:** Add screenshot comparison tests
4. **Load Testing:** Test with large transcriptions
5. **Network Conditions:** Test with slow/unreliable networks
6. **Browser Compatibility:** Test across different browsers
7. **Mobile Testing:** Test on mobile devices
8. **Accessibility Audit:** Automated accessibility testing

## Contributing

When adding new integration tests:

1. Follow existing test structure and naming conventions
2. Add test descriptions that explain what is being tested
3. Include requirement references in test comments
4. Use realistic test data
5. Verify both success and error scenarios
6. Update this README with new test coverage
7. Ensure tests are deterministic and don't flake
8. Keep tests focused and maintainable

## Resources

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Voice Form Generation Design Document](../../.kiro/specs/voice-form-generation/design.md)
- [Voice Form Generation Requirements](../../.kiro/specs/voice-form-generation/requirements.md)
