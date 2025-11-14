# Voice Input User Guide

Welcome to the Voice Input feature for the Form Builder! This guide will help you create forms faster by simply speaking your requirements.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Tutorial for First-Time Users](#tutorial-for-first-time-users)
3. [Tips for Effective Form Descriptions](#tips-for-effective-form-descriptions)
4. [Troubleshooting Guide](#troubleshooting-guide)
5. [Browser Requirements](#browser-requirements)
6. [Privacy & Security](#privacy--security)
7. [Language Support](#language-support)

---

## Getting Started

### What is Voice Input?

Voice Input allows you to create forms by speaking naturally instead of manually adding fields one by one. Simply describe what you need, and our AI will generate the form for you.

### Quick Start

1. Open the Form Builder
2. Click the **microphone icon** in the header
3. Grant microphone permissions when prompted
4. Speak your form requirements
5. Click **"Generate Form"** to create your form

---

## Tutorial for First-Time Users

### Step 1: Enable Voice Input

1. Navigate to the Form Builder page
2. Look for the **microphone button** in the top toolbar
3. Click it to open the Voice Input panel

### Step 2: Grant Microphone Permissions

When you first use voice input, your browser will ask for microphone access:

- **Chrome/Edge**: Click "Allow" in the popup at the top of the page
- **Safari**: Click "Allow" in the system dialog
- **Firefox**: Click "Allow" in the permission bar

💡 **Tip**: You only need to grant permission once. Your browser will remember your choice.

### Step 3: Start Speaking

Once the microphone is active (you'll see a red recording indicator):

1. Speak clearly and naturally
2. Watch your words appear in real-time
3. Pause briefly between sentences for better accuracy

**Example**: "I need a contact form with name, email, phone number, and a message field. Make the email required."

### Step 4: Review and Edit

After speaking:

1. Review the transcribed text
2. Click in the text area to make any corrections
3. You can also type additional details

### Step 5: Generate Your Form

1. Click the **"Generate Form"** button
2. Wait 2-3 seconds while AI processes your description
3. Your form fields will appear in the builder
4. Customize as needed using the standard form builder tools

### Step 6: Save Your Work

The transcription is automatically saved every 5 seconds. If you refresh the page, your work will be restored.

---

## Tips for Effective Form Descriptions

### Be Specific About Field Types

✅ **Good**: "Add an email field for contact email"  
❌ **Avoid**: "Add a field for email"

✅ **Good**: "Add a dropdown for country selection with USA, Canada, and Mexico"  
❌ **Avoid**: "Add countries"

### Mention Required Fields

✅ **Good**: "Name and email are required, phone is optional"  
❌ **Avoid**: Just listing fields without requirements

### Describe Validation Rules

✅ **Good**: "Phone number should be 10 digits"  
✅ **Good**: "Password must be at least 8 characters"  
✅ **Good**: "Age should be between 18 and 100"

### Use Natural Language

You don't need to use technical terms. Speak naturally:

- "I need a form for..." ✅
- "Add a box where users can type their address" ✅
- "Include a yes/no question about newsletter subscription" ✅

### Structure Your Description

For best results, organize your description:

1. **Start with the purpose**: "I need a registration form..."
2. **List the fields**: "with full name, email, password..."
3. **Add requirements**: "Name and email are required..."
4. **Include validation**: "Password should be at least 8 characters..."

### Example Descriptions

#### Simple Contact Form
```
"I need a contact form with full name, email address, phone number, 
and a message box. Name and email are required."
```

#### Registration Form
```
"Create a registration form with first name, last name, email, 
password, confirm password, and a checkbox to agree to terms. 
All fields are required. Password must be at least 8 characters."
```

#### Survey Form
```
"I need a customer satisfaction survey with a rating from 1 to 5, 
multiple choice for favorite product with options laptop, phone, 
and tablet, and a comment box for additional feedback."
```

#### Event Registration
```
"Create an event registration form with attendee name, email, 
company name, job title, dietary restrictions as a dropdown with 
none, vegetarian, vegan, and gluten-free, and a checkbox for 
bringing a guest."
```

### What to Avoid

❌ **Too vague**: "I need a form"  
❌ **Too technical**: "Add a VARCHAR(255) input with regex validation"  
❌ **Too fast**: Speaking too quickly without pauses  
❌ **Background noise**: Use voice input in a quiet environment

---

## Troubleshooting Guide

### Common Issues and Solutions

#### "Microphone access denied"

**Problem**: You clicked "Block" when asked for microphone permission.

**Solution**:
1. Click the lock icon in your browser's address bar
2. Find "Microphone" in the permissions list
3. Change it to "Allow"
4. Refresh the page and try again

**Chrome/Edge**: Settings → Privacy and security → Site settings → Microphone  
**Safari**: Safari → Settings for This Website → Microphone → Allow  
**Firefox**: Click the microphone icon in the address bar → Allow

#### "No speech detected"

**Problem**: The system didn't hear you speaking.

**Solutions**:
- Check that your microphone is working (test in another app)
- Speak louder or move closer to the microphone
- Check that the correct microphone is selected in your system settings
- Reduce background noise
- Try clicking the microphone button again

#### "Voice input not supported"

**Problem**: Your browser doesn't support voice input.

**Solution**:
- Use Chrome, Edge, or Safari (recommended browsers)
- Update your browser to the latest version
- Use the manual text input as an alternative

#### Transcription is inaccurate

**Solutions**:
- Speak more clearly and slowly
- Pause between sentences
- Use the text area to manually correct errors
- Avoid technical jargon or uncommon words
- Ensure you're in a quiet environment

#### Form generation failed

**Problem**: The AI couldn't understand your description.

**Solutions**:
- Review your transcription for clarity
- Add more specific details about field types
- Break complex forms into simpler descriptions
- Try rephrasing your requirements
- Use the examples in this guide as templates

#### Transcription disappeared

**Problem**: Your transcription was lost after closing the browser.

**Solution**:
- Transcriptions are saved automatically every 5 seconds
- They persist for 24 hours in your browser
- If you cleared your browser data, the transcription is lost
- Always generate the form before closing the browser

#### Voice input stops automatically

**Problem**: Recording stops after 10 seconds of silence.

**Solution**:
- This is normal behavior to save resources
- Simply click the microphone button again to resume
- Your previous transcription will be preserved
- Continue speaking where you left off

#### Language not recognized correctly

**Problem**: The system is transcribing in the wrong language.

**Solution**:
1. Click the language selector dropdown
2. Choose your preferred language
3. Start speaking again
4. The system will now recognize your selected language

---

## Browser Requirements

### Supported Browsers

Voice Input works best in modern browsers with Web Speech API support:

| Browser | Version | Support Level |
|---------|---------|---------------|
| **Google Chrome** | 25+ | ✅ Full Support |
| **Microsoft Edge** | 79+ | ✅ Full Support |
| **Safari** | 14.1+ | ✅ Full Support |
| **Opera** | 27+ | ✅ Full Support |
| **Firefox** | Any | ⚠️ Limited Support |

### Recommended Setup

For the best experience:

- **Browser**: Chrome or Edge (latest version)
- **Operating System**: Windows 10+, macOS 10.15+, or modern Linux
- **Microphone**: Built-in or external microphone
- **Internet**: Stable connection (required for AI form generation)
- **Environment**: Quiet space with minimal background noise

### Technical Requirements

- **JavaScript**: Must be enabled
- **Microphone**: Required for voice input
- **Local Storage**: Required for session persistence
- **HTTPS**: Required (voice input only works on secure connections)

### Checking Browser Compatibility

When you open the Voice Input panel:

- ✅ **Green indicator**: Full support, ready to use
- ⚠️ **Yellow warning**: Limited support, may have issues
- ❌ **Red error**: Not supported, use manual input instead

### Mobile Support

Voice Input is optimized for desktop browsers. Mobile support varies:

- **iOS Safari**: ✅ Supported (iOS 14.5+)
- **Chrome Android**: ⚠️ Limited (may have issues)
- **Firefox Mobile**: ❌ Not supported

💡 **Tip**: For the best mobile experience, use Safari on iOS devices.

---

## Privacy & Security

### Your Privacy Matters

We take your privacy seriously. Here's how voice input protects your data:

### Local Speech Processing

- ✅ **All speech recognition happens in your browser**
- ✅ **No audio is recorded or stored**
- ✅ **No audio is sent to our servers**
- ✅ **Only text transcriptions are processed**

### How It Works

1. **You speak** → Your browser's built-in speech recognition converts it to text
2. **Text appears** → The transcription is shown in your browser
3. **You generate** → Only the text (not audio) is sent to our AI service
4. **Form created** → The AI returns form configuration based on the text

### Data Storage

**Local Storage (Your Browser)**:
- Transcriptions are saved temporarily in your browser
- Stored for up to 24 hours for session recovery
- Automatically deleted after form generation
- Cleared when you clear browser data

**Our Servers**:
- Only text transcriptions are sent (never audio)
- Used solely to generate form configurations
- Not stored permanently
- Not used for training or analytics (unless you opt in)

### Your Control

You have full control over voice input:

- **Disable anytime**: Turn off voice input in settings
- **Clear data**: Use the "Clear" button to remove transcriptions
- **Opt out**: Voice input is optional; manual input always available
- **Review first**: Edit transcriptions before sending to AI

### Security Features

- **HTTPS Only**: Voice input requires a secure connection
- **Permission-based**: You must explicitly grant microphone access
- **No background listening**: Only active when you click the microphone button
- **Automatic cleanup**: Data is cleared when you navigate away

### Third-Party Services

Voice input uses:

1. **Web Speech API**: Built into your browser (Google, Apple, Microsoft)
   - Processes speech locally when possible
   - May use cloud services for some languages
   - Subject to your browser's privacy policy

2. **Our AI Service**: Processes text transcriptions
   - Only receives text, never audio
   - Used solely for form generation
   - Subject to our privacy policy

### Best Practices

For maximum privacy:

- ✅ Use voice input in a private space
- ✅ Review transcriptions before generating forms
- ✅ Clear transcriptions after use
- ✅ Don't speak sensitive information (passwords, SSNs, etc.)
- ✅ Use manual input for highly sensitive forms

### Questions?

If you have privacy concerns:
- Review our full Privacy Policy
- Contact our support team
- Use manual text input as an alternative

---

## Language Support

### Supported Languages

Voice Input supports 6 major languages:

| Language | Code | Variants |
|----------|------|----------|
| **English** | en-US | US, UK, Australia, Canada |
| **Spanish** | es-ES | Spain, Mexico, Latin America |
| **French** | fr-FR | France, Canada |
| **German** | de-DE | Germany, Austria, Switzerland |
| **Chinese** | zh-CN | Simplified, Traditional |
| **Japanese** | ja-JP | Japan |

### Selecting Your Language

1. Open the Voice Input panel
2. Click the **language dropdown** (top right)
3. Select your preferred language
4. Start speaking in that language

### Auto-Detection

By default, Voice Input uses your browser's language setting:

- If your browser is set to Spanish, voice input starts in Spanish
- You can change the language anytime using the dropdown
- Your choice is saved for future sessions

### Language-Specific Tips

#### English (en-US)
- Speak clearly with standard pronunciation
- Use common terms: "text field", "dropdown", "checkbox"
- Works well with technical terms

#### Spanish (es-ES)
- Use natural Spanish: "campo de texto", "lista desplegable"
- Both formal and informal speech work well
- AI understands regional variations

#### French (fr-FR)
- Speak naturally: "champ de texte", "liste déroulante"
- Both European and Canadian French supported
- AI handles accents and special characters

#### German (de-DE)
- Use standard German: "Textfeld", "Dropdown-Menü"
- Compound words are recognized correctly
- Works with Austrian and Swiss variants

#### Chinese (zh-CN)
- Both Simplified and Traditional characters supported
- Speak in Mandarin for best results
- AI understands context and generates appropriate labels

#### Japanese (ja-JP)
- Speak in standard Japanese
- Both formal and casual speech work
- AI handles kanji, hiragana, and katakana

### Switching Languages Mid-Session

If you switch languages during a session:

1. A warning appears: "Switching languages may affect transcription accuracy"
2. Your existing transcription remains unchanged
3. New speech is recognized in the new language
4. You can mix languages, but accuracy may decrease

💡 **Tip**: For best results, use one language per session.

### Form Generation in Multiple Languages

When you generate a form:

- Field labels are created in your selected language
- Validation messages match the language
- The form structure is language-agnostic
- You can manually translate labels after generation

### Language Limitations

**Not Supported**:
- Regional dialects with significant differences
- Mixed-language descriptions in one sentence
- Languages not listed above

**Workarounds**:
- Use English as a fallback (most widely supported)
- Type descriptions in unsupported languages
- Manually create forms and translate labels

### Improving Recognition

For better accuracy in any language:

- ✅ Speak at a moderate pace
- ✅ Use standard vocabulary
- ✅ Avoid slang or regional expressions
- ✅ Pause between sentences
- ✅ Enunciate clearly

### Adding More Languages

We're constantly expanding language support. Vote for your language:
- Visit our feedback page
- Request your language
- We prioritize based on user demand

---

## Need More Help?

### Additional Resources

- **Video Tutorials**: Watch step-by-step guides on our YouTube channel
- **Community Forum**: Ask questions and share tips with other users
- **Support**: Contact our support team for technical assistance
- **Feedback**: Help us improve by sharing your experience

### Quick Links

- [Form Builder Documentation](../README.md)
- [Privacy Policy](#)
- [Terms of Service](#)
- [Contact Support](#)

---

**Last Updated**: November 2025  
**Version**: 1.0.0
