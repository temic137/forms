# Voice Input Error Handling Documentation

## Overview

This document describes the comprehensive error handling and recovery system implemented for the voice input feature. The implementation covers all requirements from task 7 of the voice-form-generation spec.

## Components

### 1. VoiceErrorDisplay Component

**Location:** `src/components/VoiceErrorDisplay.tsx`

**Purpose:** Display user-friendly error messages with troubleshooting guidance and recovery actions.

**Features:**
- User-friendly error titles and messages
- Detailed troubleshooting steps for each error type
- Retry functionality for recoverable errors
- Direct links to browser settings guides
- Dismissible error messages
- Animated slide-in effect

**Error Types Handled:**
- `not-supported`: Browser doesn't support Web Speech API
- `permission-denied`: Microphone access denied by user
- `no-speech`: No speech detected (auto-pause after 10 seconds)
- `network`: Network connectivity issues
- `aborted`: Recording stopped unexpectedly
- `audio-capture`: Microphone hardware/access issues
- `service-not-allowed`: Speech recognition service blocked

**Usage:**
```tsx
<VoiceErrorDisplay
  error={voiceError}
  onRetry={handleRetry}
  onDismiss={handleDismiss}
/>
```

### 2. BrowserCompatibilityWarning Component

**Location:** `src/components/BrowserCompatibilityWarning.tsx`

**Purpose:** Display browser compatibility warnings for unsupported browsers.

**Features:**
- Detects missing browser features (speech recognition, Web Audio API, local storage)
- Shows recommended browsers with version requirements
- Provides alternative input methods
- Dismissible warning
- Detailed browser information for debugging

**Supported Browsers:**
- Google Chrome (version 25+)
- Microsoft Edge (version 79+)
- Safari (version 14.1+)
- Opera (version 27+)

**Usage:**
```tsx
<BrowserCompatibilityWarning
  support={browserSupport}
  onDismiss={() => setShowWarning(false)}
/>
```

### 3. MicrophonePermissionPrompt Component

**Location:** `src/components/MicrophonePermissionPrompt.tsx`

**Purpose:** Guide users through the microphone permission request flow.

**Features:**
- Clear explanation of why permission is needed
- Privacy notice explaining local processing
- Step-by-step instructions
- Permission request button
- Error handling for denied permissions
- Help link for troubleshooting

**Usage:**
```tsx
<MicrophonePermissionPrompt
  onRequestPermission={handleRequestPermission}
  onCancel={() => setShowPrompt(false)}
/>
```

## Enhanced Hook: useVoiceInput

**Location:** `src/hooks/useVoiceInput.ts`

**New Features:**

### No-Speech Timeout (Requirement 10.2)
- Automatically pauses recording after 10 seconds of silence
- Displays user-friendly notification
- Allows easy retry with retry button
- Resets timeout on any speech detection

**Implementation:**
```typescript
const noSpeechTimeoutRef = useRef<NodeJS.Timeout | null>(null);

const resetNoSpeechTimeout = useCallback(() => {
  if (noSpeechTimeoutRef.current) {
    clearTimeout(noSpeechTimeoutRef.current);
  }
  
  noSpeechTimeoutRef.current = setTimeout(() => {
    service.stop();
    setError({
      type: 'no-speech',
      message: 'No speech detected for 10 seconds. Recording paused automatically.',
      recoverable: true,
    });
  }, 10000);
}, [service]);
```

## Error Recovery Strategies

### 1. Not Supported Error
**Action:** Manual Input Fallback
- Display browser compatibility warning
- Suggest using Chrome, Edge, or Safari
- Provide manual text input as alternative
- **Not Retryable**

### 2. Permission Denied Error
**Action:** Check Settings
- Display permission instructions
- Link to browser settings guide
- Show step-by-step fix instructions
- **Retryable** after fixing permissions

### 3. No Speech Error
**Action:** Retry
- Suggest speaking louder or closer to microphone
- Check microphone is not muted
- Verify correct microphone is selected
- **Retryable** immediately

### 4. Network Error
**Action:** Retry
- Check internet connection
- Suggest refreshing the page
- Wait and retry
- **Retryable** after connection restored

### 5. Audio Capture Error
**Action:** Check Settings
- Verify microphone is connected
- Check no other app is using microphone
- Try different microphone
- Restart browser
- **Retryable** after fixing

### 6. Service Not Allowed Error
**Action:** Check Settings
- Check browser privacy settings
- Disable blocking extensions
- Try incognito/private window
- Check organization policies
- **Retryable** after fixing

## Troubleshooting Guidance

Each error type includes specific troubleshooting steps displayed to users:

### Permission Denied Steps:
1. Click the lock icon in browser's address bar
2. Find "Microphone" in permissions list
3. Change setting to "Allow"
4. Refresh page and try again

### No Speech Steps:
1. Make sure microphone is not muted
2. Speak clearly and closer to microphone
3. Check correct microphone is selected
4. Try speaking louder or in quieter environment

### Audio Capture Steps:
1. Check microphone is properly connected
2. Make sure no other app is using microphone
3. Try selecting different microphone
4. Restart browser and try again

## Browser Settings Links

The system provides direct links to browser settings based on user agent:

- **Chrome:** `chrome://settings/content/microphone`
- **Edge:** `edge://settings/content/microphone`
- **Firefox:** `about:preferences#privacy`
- **Safari:** System Preferences → Security & Privacy → Microphone
- **Fallback:** Google Chrome help page

## Testing

### Test Page
**Location:** `src/app/voice-test/page.tsx`

The test page includes:
- Live voice input testing
- Error handling demonstrations
- Permission prompt demo
- Compatibility warning demo
- Browser support status display

### Manual Testing Scenarios

1. **Test Permission Denied:**
   - Block microphone in browser settings
   - Try to start recording
   - Verify error message and retry button
   - Follow troubleshooting steps
   - Grant permission and retry

2. **Test No Speech Timeout:**
   - Start recording
   - Don't speak for 10 seconds
   - Verify auto-pause notification
   - Click retry to resume

3. **Test Browser Compatibility:**
   - Open in unsupported browser (if available)
   - Verify compatibility warning displays
   - Check recommended browsers list
   - Verify alternative input method works

4. **Test Network Error:**
   - Start recording
   - Disconnect internet (if using cloud speech API)
   - Verify network error message
   - Reconnect and retry

5. **Test Audio Capture Error:**
   - Disconnect microphone during recording
   - Verify error message
   - Reconnect microphone
   - Retry recording

## Requirements Coverage

✅ **Requirement 1.3:** Microphone permission denied error handling
✅ **Requirement 2.5:** Speech recognition error handling with retry
✅ **Requirement 7.5:** Specific error messages with troubleshooting guidance
✅ **Requirement 10.1:** Browser compatibility detection and warnings
✅ **Requirement 10.2:** Microphone access loss handling with reconnection
✅ **Requirement 10.3:** Network connectivity loss handling with offline editing
✅ **Requirement 10.5:** Browser compatibility warnings for unsupported browsers

## Implementation Details

### Error Flow
1. Error occurs in Web Speech API or service
2. `createVoiceError()` maps error to VoiceError type
3. Error propagates to `useVoiceInput` hook
4. Hook updates error state and calls callback
5. `VoiceInput` component displays `VoiceErrorDisplay`
6. User sees error message with troubleshooting steps
7. User can retry (if recoverable) or dismiss

### Recovery Flow
1. User clicks "Try Again" button
2. Error state is cleared
3. `startListening()` is called again
4. If successful, recording resumes
5. If fails again, new error is displayed

### Auto-Pause Flow (No Speech)
1. Recording starts, timeout is set (10 seconds)
2. On any speech detection, timeout resets
3. If no speech for 10 seconds, timeout fires
4. Recording stops automatically
5. No-speech error is displayed
6. User can retry immediately

## Best Practices

1. **Always provide retry for recoverable errors**
2. **Include specific troubleshooting steps**
3. **Link to browser settings when relevant**
4. **Show alternative input methods**
5. **Use clear, non-technical language**
6. **Provide visual feedback (icons, colors)**
7. **Make errors dismissible**
8. **Log errors for debugging**
9. **Test all error scenarios**
10. **Keep error messages concise**

## Future Enhancements

- Add error analytics tracking
- Implement automatic retry with exponential backoff
- Add voice command to retry ("try again")
- Provide video tutorials for common issues
- Add live chat support for persistent errors
- Implement fallback to cloud speech API
- Add microphone testing tool
- Provide audio level calibration
