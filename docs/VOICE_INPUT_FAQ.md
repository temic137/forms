# Voice Input FAQ (Frequently Asked Questions)

Quick answers to common questions about Voice Input.

## 🎤 General Questions

### What is Voice Input?

Voice Input allows you to create forms by speaking instead of typing. Simply describe what you need, and our AI generates the form for you.

---

### How does it work?

1. You speak into your microphone
2. Your browser converts speech to text
3. You review and edit the transcription
4. Click "Generate Form" to create your form
5. AI analyzes the text and creates form fields

---

### Is Voice Input free?

Yes, Voice Input is included with your Form Builder account at no additional cost.

---

### Do I need special equipment?

No, just a working microphone (built-in or external). Most laptops and phones have built-in microphones that work fine.

---

## 🌐 Browser & Compatibility

### Which browsers support Voice Input?

**Full Support**:
- Google Chrome 25+
- Microsoft Edge 79+
- Safari 14.1+
- Opera 27+

**Limited Support**:
- Firefox (no native support)

[See full compatibility guide →](./VOICE_INPUT_BROWSER_COMPATIBILITY.md)

---

### Does it work on mobile?

Yes, with limitations:
- **iOS Safari**: ✅ Works well
- **Android Chrome**: ⚠️ Limited support
- **Other mobile browsers**: ❌ Not supported

Desktop browsers provide the best experience.

---

### Why doesn't it work in Firefox?

Firefox doesn't support the Web Speech API that Voice Input requires. Use Chrome, Edge, or Safari instead.

---

### Do I need an internet connection?

Yes, for two reasons:
1. Some browsers use cloud services for speech recognition
2. AI form generation requires internet connection

---

## 🔒 Privacy & Security

### Is my voice recorded?

**No.** Your voice is never recorded or stored. Speech recognition happens in your browser, and only text transcriptions are processed.

---

### Where is my data stored?

- **Transcriptions**: Temporarily in your browser (up to 24 hours)
- **Forms**: On our servers (until you delete them)
- **Audio**: Never stored anywhere

[Learn more about privacy →](./VOICE_INPUT_PRIVACY_SECURITY.md)

---

### Is Voice Input secure?

Yes:
- ✅ HTTPS encryption required
- ✅ No audio recording
- ✅ Local speech processing
- ✅ Automatic data cleanup
- ✅ Permission-based microphone access

---

### Can others hear what I'm saying?

No, unless they're physically near you. Voice Input doesn't transmit audio over the internet (only text).

---

### What happens to my transcriptions?

- Saved temporarily in your browser (24 hours max)
- Sent to AI service as text (not audio) when you generate a form
- Deleted immediately after form generation
- Cleared when you close the browser

---

## 🌍 Language Support

### What languages are supported?

- English (US, UK, Australia, Canada)
- Spanish (Spain, Mexico, Latin America)
- French (France, Canada)
- German (Germany, Austria, Switzerland)
- Chinese (Simplified, Traditional)
- Japanese

[See language guide →](./VOICE_INPUT_LANGUAGE_GUIDE.md)

---

### Can I switch languages?

Yes, use the language dropdown in the Voice Input panel. You can switch anytime, but it's best to use one language per session.

---

### Will the form be in my language?

Yes, field labels and validation messages will be in the language you selected.

---

### Can I use multiple languages in one form?

You can speak in one language and manually translate labels later, but it's better to use one language throughout.

---

## 🎯 Using Voice Input

### How do I start using Voice Input?

1. Click the microphone button in Form Builder
2. Grant microphone permission
3. Start speaking
4. Click "Generate Form" when done

[See quick start guide →](./VOICE_INPUT_QUICK_START.md)

---

### What should I say?

Describe your form naturally:

> "I need a contact form with name, email, phone, and message. Name and email are required."

[See more examples →](./VOICE_INPUT_GUIDE.md#tips-for-effective-form-descriptions)

---

### Can I edit the transcription?

Yes! Click in the text area and edit as needed before generating the form.

---

### How long can I speak?

There's no strict limit, but:
- Voice input pauses after 10 seconds of silence
- Best results with 30-60 seconds of speech
- You can resume speaking anytime

---

### Can I use voice commands?

Not yet. Voice Input is for describing forms, not controlling the interface. Use the buttons to control recording.

---

## 🔧 Troubleshooting

### "Microphone access denied" - What do I do?

1. Click the lock icon in your browser's address bar
2. Find "Microphone" and change to "Allow"
3. Refresh the page and try again

[See detailed fix →](./VOICE_INPUT_TROUBLESHOOTING.md#microphone-access-denied)

---

### "No speech detected" - Why?

Common causes:
- Microphone is muted
- Wrong microphone selected
- Background noise too loud
- Speaking too quietly

[See troubleshooting guide →](./VOICE_INPUT_TROUBLESHOOTING.md#no-speech-detected)

---

### The transcription is wrong - What can I do?

1. Edit the text manually before generating
2. Speak more slowly and clearly
3. Reduce background noise
4. Check that the correct language is selected

---

### Voice Input stops automatically - Is this normal?

Yes, it pauses after 10 seconds of silence to save resources. Just click the microphone button to resume.

---

### My transcription disappeared - Can I get it back?

If you refreshed the page within 24 hours, it should restore automatically. If you cleared browser data, it's lost.

**Prevention**: Generate your form before closing the browser.

---

### Form generation failed - What should I do?

1. Review your transcription for clarity
2. Add more specific details about field types
3. Try rephrasing your requirements
4. Use examples from the documentation

[See troubleshooting guide →](./VOICE_INPUT_TROUBLESHOOTING.md#form-generation-failed)

---

## 💡 Tips & Best Practices

### How can I get better results?

- ✅ Speak clearly and at moderate pace
- ✅ Be specific about field types
- ✅ Mention which fields are required
- ✅ Include validation rules
- ✅ Use natural language
- ✅ Reduce background noise

[See all tips →](./VOICE_INPUT_GUIDE.md#tips-for-effective-form-descriptions)

---

### Should I use technical terms?

You can, but natural language works better:

- ✅ "Add a text field for name"
- ✅ "Add a box where users can type their email"
- ❌ "Add a VARCHAR(255) input with regex validation"

---

### Can I describe complex forms?

Yes, but break them into clear sections:

1. State the purpose
2. List the fields
3. Specify requirements
4. Add validation rules

---

### What if I make a mistake while speaking?

Just keep speaking or edit the transcription afterward. The AI is good at understanding context.

---

## 🚀 Advanced Features

### Can I save my transcription?

It's automatically saved every 5 seconds in your browser. It persists for 24 hours.

---

### Can I use keyboard shortcuts?

Yes! Press **Ctrl+Shift+V** (or **Cmd+Shift+V** on Mac) to toggle voice input.

---

### Can I use Voice Input for existing forms?

Yes, voice-generated fields are added to your existing form. You can mix voice and manual input.

---

### Can I customize generated fields?

Absolutely! After generation, use the form builder to edit, reorder, or delete fields as needed.

---

## 📊 Performance

### How fast is Voice Input?

- Voice activation: < 500ms
- Transcription: < 1 second latency
- Form generation: 2-3 seconds

---

### Does it work offline?

No, you need internet for:
- Speech recognition (in most browsers)
- AI form generation

---

### Will it slow down my browser?

No, Voice Input is optimized for performance and uses minimal resources.

---

## 🆘 Getting Help

### Where can I find more help?

- 📖 [Complete User Guide](./VOICE_INPUT_GUIDE.md)
- 🚀 [Quick Start Guide](./VOICE_INPUT_QUICK_START.md)
- 🔧 [Troubleshooting Guide](./VOICE_INPUT_TROUBLESHOOTING.md)
- 💬 Live Chat on our website
- 📧 Email: support@example.com

---

### How do I report a bug?

Email: support@example.com with:
- Description of the issue
- Browser and version
- Steps to reproduce
- Screenshot (if applicable)

---

### How do I request a feature?

Email: feedback@example.com or use the feedback form on our website.

---

### Is there a video tutorial?

Yes! Check our YouTube channel for step-by-step video guides.

---

## 🔄 Updates & Roadmap

### Will more languages be added?

Yes! We're working on:
- Italian
- Portuguese
- Russian
- Korean
- Arabic

Vote for your language: feedback@example.com

---

### Will Firefox be supported?

Unfortunately, Firefox doesn't support the Web Speech API. We can't add support until Firefox implements this feature.

---

### Are voice commands coming?

Yes! Future versions will support voice commands like:
- "Add email field"
- "Make it required"
- "Delete last field"

---

### Can I use Voice Input for form responses?

Not yet, but it's on our roadmap. Currently, Voice Input is only for creating forms.

---

## 📱 Mobile-Specific Questions

### Does Voice Input work on iPhone?

Yes, use Safari on iOS 14.5 or later. Chrome and Firefox on iOS don't support voice input.

---

### Does Voice Input work on Android?

Limited support. Chrome on Android 11+ works but may have issues. Desktop browsers provide better experience.

---

### Why is mobile support limited?

Mobile browsers have limited Web Speech API support. We're working on improving mobile experience.

---

## 💰 Pricing & Limits

### Is there a usage limit?

No hard limits, but we recommend:
- Max 100 voice sessions per day
- Max 5 minutes per session
- Max 1000 words per transcription

---

### Do I need a premium account?

No, Voice Input is available to all Form Builder users.

---

### Are there any hidden costs?

No, Voice Input is completely free with your Form Builder account.

---

## 🎓 Learning Resources

### Where can I learn more?

**Documentation**:
- [User Guide](./VOICE_INPUT_GUIDE.md) - Complete guide
- [Quick Start](./VOICE_INPUT_QUICK_START.md) - Fast overview
- [Troubleshooting](./VOICE_INPUT_TROUBLESHOOTING.md) - Problem solving

**Videos**:
- YouTube channel (coming soon)

**Community**:
- Community forum
- Live chat support

---

### Are there example descriptions?

Yes! See the [User Guide - Tips Section](./VOICE_INPUT_GUIDE.md#tips-for-effective-form-descriptions) for 10+ example descriptions.

---

### Can I see a demo?

Yes! Visit our website for an interactive demo, or watch our video tutorials.

---

## 📞 Still Have Questions?

### Contact Us

- 📧 **Email**: support@example.com
- 💬 **Live Chat**: Available on our website
- 📖 **Documentation**: [docs/README.md](./README.md)
- 🎥 **Videos**: YouTube channel

### Response Times

- Live Chat: Immediate
- Email: Within 24 hours
- Community Forum: Varies

---

**Last Updated**: November 2025  
**Version**: 1.0.0

---

**Didn't find your answer?** [Contact Support](mailto:support@example.com)
