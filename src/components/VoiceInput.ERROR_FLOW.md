# Voice Input Error Handling Flow

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Starts Voice Input                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Browser Check  │
                    └────────┬───────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
        ┌──────────────┐          ┌──────────────┐
        │  Supported   │          │ Not Supported│
        └──────┬───────┘          └──────┬───────┘
               │                         │
               │                         ▼
               │              ┌─────────────────────────┐
               │              │ BrowserCompatibility    │
               │              │ Warning Component       │
               │              │ - Show recommended      │
               │              │   browsers              │
               │              │ - Offer manual input    │
               │              └─────────────────────────┘
               │
               ▼
    ┌──────────────────┐
    │ Request Mic      │
    │ Permission       │
    └────────┬─────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌─────────┐      ┌─────────┐
│ Granted │      │ Denied  │
└────┬────┘      └────┬────┘
     │                │
     │                ▼
     │     ┌──────────────────────┐
     │     │ VoiceErrorDisplay    │
     │     │ - Permission denied  │
     │     │ - Show instructions  │
     │     │ - Retry button       │
     │     └──────────────────────┘
     │
     ▼
┌──────────────────┐
│ Start Recording  │
│ - Set 10s timer  │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐  ┌──────────┐
│ Speech │  │ No Speech│
│ Detected│  │ 10s      │
└────┬───┘  └────┬─────┘
     │           │
     │           ▼
     │    ┌──────────────────────┐
     │    │ Auto-Pause           │
     │    │ - Stop recording     │
     │    │ - Show no-speech     │
     │    │   error              │
     │    │ - Offer retry        │
     │    └──────────────────────┘
     │
     ▼
┌──────────────────┐
│ Transcription    │
│ Accumulates      │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐  ┌──────────┐
│Success │  │  Error   │
└────────┘  └────┬─────┘
                 │
                 ▼
        ┌────────────────┐
        │ Error Type?    │
        └────┬───────────┘
             │
    ┌────────┼────────┬────────┐
    │        │        │        │
    ▼        ▼        ▼        ▼
┌────────┐┌────────┐┌────────┐┌────────┐
│Network ││Audio   ││Service ││Aborted │
│Error   ││Capture ││Not     ││        │
└───┬────┘└───┬────┘│Allowed │└───┬────┘
    │         │     └───┬────┘    │
    │         │         │         │
    └─────────┴─────────┴─────────┘
                 │
                 ▼
    ┌────────────────────────┐
    │ VoiceErrorDisplay      │
    │ - Show error message   │
    │ - Troubleshooting      │
    │ - Retry if recoverable │
    │ - Settings link        │
    └────────────────────────┘
```

## Error Type Decision Tree

```
Error Occurs
    │
    ├─ not-supported
    │   └─> Show BrowserCompatibilityWarning
    │       └─> Offer manual input
    │           └─> NOT RETRYABLE
    │
    ├─ permission-denied
    │   └─> Show VoiceErrorDisplay
    │       └─> Show permission instructions
    │           └─> Link to browser settings
    │               └─> RETRYABLE after fix
    │
    ├─ no-speech
    │   └─> Auto-pause after 10s
    │       └─> Show VoiceErrorDisplay
    │           └─> Suggest speaking louder
    │               └─> RETRYABLE immediately
    │
    ├─ network
    │   └─> Show VoiceErrorDisplay
    │       └─> Check connection
    │           └─> RETRYABLE after fix
    │
    ├─ audio-capture
    │   └─> Show VoiceErrorDisplay
    │       └─> Check microphone
    │           └─> RETRYABLE after fix
    │
    ├─ service-not-allowed
    │   └─> Show VoiceErrorDisplay
    │       └─> Check privacy settings
    │           └─> RETRYABLE after fix
    │
    └─ aborted
        └─> Show VoiceErrorDisplay
            └─> Suggest restart
                └─> RETRYABLE immediately
```

## Component Interaction Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      VoiceInput Component                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              useVoiceInput Hook                       │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │      SpeechRecognitionService                   │ │  │
│  │  │  ┌───────────────────────────────────────────┐  │ │  │
│  │  │  │        Web Speech API                     │  │ │  │
│  │  │  └───────────────┬───────────────────────────┘  │ │  │
│  │  │                  │                               │ │  │
│  │  │                  ▼                               │ │  │
│  │  │          ┌───────────────┐                      │ │  │
│  │  │          │ Error Event   │                      │ │  │
│  │  │          └───────┬───────┘                      │ │  │
│  │  │                  │                               │ │  │
│  │  │                  ▼                               │ │  │
│  │  │          ┌───────────────┐                      │ │  │
│  │  │          │ createVoice   │                      │ │  │
│  │  │          │ Error()       │                      │ │  │
│  │  │          └───────┬───────┘                      │ │  │
│  │  └──────────────────┼───────────────────────────────┘ │  │
│  │                     │                                 │  │
│  │                     ▼                                 │  │
│  │            ┌────────────────┐                        │  │
│  │            │ handleError()  │                        │  │
│  │            │ - setError()   │                        │  │
│  │            │ - callback     │                        │  │
│  │            └────────┬───────┘                        │  │
│  └─────────────────────┼─────────────────────────────────┘  │
│                        │                                    │
│                        ▼                                    │
│               ┌─────────────────┐                          │
│               │ error state     │                          │
│               └────────┬────────┘                          │
│                        │                                    │
│                        ▼                                    │
│        ┌───────────────────────────────┐                   │
│        │ Conditional Rendering         │                   │
│        └───────────┬───────────────────┘                   │
│                    │                                        │
│    ┌───────────────┼───────────────┐                       │
│    │               │               │                       │
│    ▼               ▼               ▼                       │
│ ┌──────┐  ┌────────────────┐  ┌────────────┐             │
│ │Voice │  │Browser         │  │Microphone  │             │
│ │Error │  │Compatibility   │  │Permission  │             │
│ │Display│  │Warning         │  │Prompt      │             │
│ └──────┘  └────────────────┘  └────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

## State Management Flow

```
Initial State
    │
    ├─ isListening: false
    ├─ transcript: ""
    ├─ error: null
    ├─ isSupported: true/false
    └─ audioLevel: 0

User Action: Start Recording
    │
    ▼
Check Browser Support
    │
    ├─ If not supported
    │   └─> error = { type: 'not-supported', ... }
    │       └─> Show BrowserCompatibilityWarning
    │
    └─ If supported
        └─> Request Permission
            │
            ├─ If denied
            │   └─> error = { type: 'permission-denied', ... }
            │       └─> Show VoiceErrorDisplay with retry
            │
            └─ If granted
                └─> isListening = true
                    └─> Start 10s timeout
                        │
                        ├─ Speech detected
                        │   └─> Reset timeout
                        │       └─> transcript += newText
                        │           └─> Continue listening
                        │
                        └─ No speech for 10s
                            └─> isListening = false
                                └─> error = { type: 'no-speech', ... }
                                    └─> Show VoiceErrorDisplay with retry

User Action: Retry
    │
    └─> error = null
        └─> Start Recording (repeat flow)

User Action: Dismiss Error
    │
    └─> error = null
        └─> Keep transcript
            └─> Allow manual editing
```

## Recovery Paths

### Path 1: Permission Denied → Granted
```
1. User clicks "Start Recording"
2. Browser shows permission prompt
3. User clicks "Block"
4. VoiceErrorDisplay shows with instructions
5. User clicks "Open Settings Guide"
6. User follows steps to enable permission
7. User clicks "Try Again"
8. Browser shows permission prompt again
9. User clicks "Allow"
10. Recording starts successfully
```

### Path 2: No Speech → Retry
```
1. User clicks "Start Recording"
2. Recording starts, 10s timer begins
3. User doesn't speak
4. After 10s, auto-pause triggers
5. VoiceErrorDisplay shows "No speech detected"
6. User clicks "Try Again"
7. Recording restarts
8. User speaks immediately
9. Transcription appears
10. Timer resets on speech
```

### Path 3: Browser Not Supported → Manual Input
```
1. User opens app in Firefox
2. BrowserCompatibilityWarning shows
3. User sees recommended browsers
4. User sees "Alternative" section
5. User types description manually
6. User clicks "Generate Form"
7. Form generates from typed text
```

### Path 4: Audio Capture Error → Fix → Retry
```
1. User clicks "Start Recording"
2. Microphone disconnected
3. VoiceErrorDisplay shows audio-capture error
4. User sees troubleshooting steps
5. User reconnects microphone
6. User clicks "Try Again"
7. Recording starts successfully
```

## Error Message Examples

### Not Supported
```
Title: Browser Not Supported
Message: Voice input is not supported in this browser. 
         Please use Chrome, Edge, or Safari.
Action: Manual Input (not retryable)
```

### Permission Denied
```
Title: Microphone Access Denied
Message: Microphone access was denied. Please enable 
         microphone permissions in your browser settings.
Action: Check Settings (retryable)
Steps:
  1. Click the lock icon in your browser's address bar
  2. Find "Microphone" in the permissions list
  3. Change the setting to "Allow"
  4. Refresh the page and try again
```

### No Speech
```
Title: No Speech Detected
Message: No speech detected for 10 seconds. Recording 
         paused automatically.
Action: Retry (retryable)
Steps:
  1. Make sure your microphone is not muted
  2. Speak clearly and closer to your microphone
  3. Check that the correct microphone is selected
  4. Try speaking louder or in a quieter environment
```

### Network Error
```
Title: Network Error
Message: Network error occurred. Please check your 
         connection and try again.
Action: Retry (retryable)
Steps:
  1. Check your internet connection
  2. Try refreshing the page
  3. If the problem persists, try again in a few minutes
```

## Testing Checklist

- [ ] Browser not supported warning displays
- [ ] Permission denied error shows with instructions
- [ ] No-speech timeout triggers after 10 seconds
- [ ] Retry button works for recoverable errors
- [ ] Settings link opens correct browser settings
- [ ] Error dismissal clears error state
- [ ] Transcript preserved after error
- [ ] Manual input works as fallback
- [ ] Multiple retry attempts work
- [ ] Error animations display smoothly
- [ ] Screen reader announces errors
- [ ] Keyboard navigation works
- [ ] Mobile responsive layout
- [ ] All error types tested
- [ ] Recovery paths verified
