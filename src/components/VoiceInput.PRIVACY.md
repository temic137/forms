# Voice Input Privacy & Security Features

This document describes the privacy and security features implemented for the voice input system.

## Overview

The voice input feature has been designed with privacy and security as top priorities. All speech processing happens locally in the browser, and users have full control over the feature.

## Implemented Features

### 1. Privacy Notice (Requirement 9.1)

**Component:** `VoicePrivacyNotice.tsx`

- Displays comprehensive privacy information when users first access voice input
- Explains that speech processing happens locally using Web Speech API
- Clarifies that no audio data is sent to servers
- Details temporary storage and automatic cleanup
- Expandable section with additional privacy details
- Must be accepted before voice input can be used

**Key Points:**
- Speech processing is browser-based (Web Speech API)
- No audio transmitted to servers
- Only text transcriptions are sent to AI service
- Temporary storage with 24-hour expiration
- Automatic cleanup on navigation/form generation

### 2. Voice Input Settings (Requirement 9.2)

**Component:** `VoiceSettingsToggle.tsx`
**Storage:** `voiceSettings.ts`

- Toggle to enable/disable voice input feature
- Settings persisted in browser local storage
- Confirmation dialog before disabling
- Accessible from VoiceInputPanel settings button
- Can be re-enabled at any time

**Settings Stored:**
- `enabled`: Whether voice input is enabled
- `privacyNoticeAccepted`: Whether user accepted privacy notice
- `lastUpdated`: Timestamp of last settings update

### 3. Text-Only Transmission (Requirement 9.3)

**API Route:** `/api/ai/generate-from-voice/route.ts`

- API endpoint validates that only text data is received
- Explicit type checking for string transcriptions
- Documentation comments clarify privacy approach
- No audio data handling in server code

**Validation:**
```typescript
if (typeof transcript !== "string" || !transcript.trim()) {
  return NextResponse.json(
    { error: "Invalid transcript" },
    { status: 400 }
  );
}
```

### 4. Automatic Cleanup (Requirement 9.4)

**Hook:** `useVoiceCleanup.ts`

- Automatically cleans up voice data on navigation
- Listens for `beforeunload` and `pagehide` events
- Clears transcription storage when user leaves page
- Prevents data persistence beyond session
- Optional callback for cleanup notifications

**Cleanup Triggers:**
- Browser tab/window close
- Navigation away from page
- Successful form generation
- Manual clear action

### 5. Clear Privacy Messaging (Requirement 9.5)

**Components:** 
- `VoiceInput.tsx` - Privacy reminder in UI
- `VoicePrivacyNotice.tsx` - Detailed privacy notice
- `VoiceInputHelpModal.tsx` - Privacy information in help

**UI Elements:**
- Privacy reminder banner with lock icon
- "Learn more" link to detailed privacy information
- Disabled state message when voice input is off
- Help modal includes privacy section

## User Flow

### First-Time User

1. User opens voice input panel
2. Privacy notice is displayed automatically
3. User reads privacy information (can expand for details)
4. User accepts or declines:
   - **Accept:** Privacy notice is saved, tutorial shown, voice input enabled
   - **Decline:** Voice input is disabled, can be re-enabled later

### Returning User

1. User opens voice input panel
2. If privacy accepted: Voice input is ready to use
3. If voice disabled: Message shown with option to re-enable
4. Privacy reminder banner always visible (subtle)

### Disabling Voice Input

1. User clicks settings icon in VoiceInputPanel
2. Settings toggle is displayed
3. User toggles off
4. Confirmation dialog appears
5. User confirms: Voice input disabled, settings saved
6. Can re-enable anytime from same toggle

## Data Storage

### Local Storage Keys

- `voice_input_settings`: User preferences (enabled, privacy accepted)
- `voice_transcription_session`: Current transcription (24-hour TTL)

### Data Lifecycle

1. **Creation:** Transcription saved every 5 seconds during recording
2. **Persistence:** Stored in browser local storage (24-hour max)
3. **Cleanup:** Removed on:
   - Successful form generation
   - Manual clear action
   - Page navigation/close
   - 24-hour expiration

## Security Considerations

### Browser-Based Processing

- Web Speech API processes audio entirely in browser
- No audio data leaves user's device during speech recognition
- Browser handles microphone permissions

### Server Communication

- Only text transcriptions sent to server
- HTTPS required for Web Speech API
- No PII in analytics or logs
- Rate limiting on API endpoint (20 req/min per user)

### Data Protection

- No persistent storage of voice data
- Transcriptions sanitized before AI processing
- Local storage can be cleared by user
- No cross-site data sharing

## Accessibility

All privacy features are accessible:

- Screen reader announcements for privacy notices
- Keyboard navigation for all controls
- ARIA labels on privacy elements
- Focus indicators on interactive elements
- Clear, plain language in privacy notices

## Testing

To test privacy features:

1. **Privacy Notice:**
   - Clear local storage
   - Open voice input
   - Verify privacy notice appears
   - Test accept/decline flows

2. **Settings Toggle:**
   - Enable/disable voice input
   - Verify settings persist across page reloads
   - Test confirmation dialog

3. **Automatic Cleanup:**
   - Record transcription
   - Navigate away or close tab
   - Verify transcription is cleared

4. **Text-Only API:**
   - Inspect network requests
   - Verify only JSON text data is sent
   - No binary/audio data in requests

## Compliance

This implementation follows privacy best practices:

- **GDPR:** User consent required, data minimization, right to disable
- **CCPA:** Clear privacy notice, opt-out available
- **WCAG 2.1 AA:** Accessible privacy controls and notices

## Future Enhancements

Potential privacy improvements:

- End-to-end encryption for transcriptions
- User data export functionality
- Privacy dashboard with usage statistics
- Configurable data retention periods
- Audit log of voice input usage
