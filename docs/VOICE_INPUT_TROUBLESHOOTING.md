# Voice Input Troubleshooting Reference

Quick solutions to common voice input issues.

## 🚨 Error Messages

### "Microphone access denied"

**Cause**: You blocked microphone permissions.

**Fix**:
1. Click the **lock icon** (🔒) in your browser's address bar
2. Find **Microphone** in the permissions list
3. Change to **"Allow"**
4. Refresh the page

**Browser-Specific**:
- **Chrome/Edge**: `chrome://settings/content/microphone`
- **Safari**: Safari → Settings for This Website → Microphone → Allow
- **Firefox**: Click microphone icon in address bar → Allow

---

### "Voice input not supported in this browser"

**Cause**: Your browser doesn't support Web Speech API.

**Fix**:
- Switch to **Chrome**, **Edge**, or **Safari**
- Update your browser to the latest version
- Use manual text input as an alternative

**Supported Browsers**:
- ✅ Chrome 25+
- ✅ Edge 79+
- ✅ Safari 14.1+
- ⚠️ Firefox (limited)

---

### "No speech detected"

**Cause**: The system didn't hear you.

**Fix**:
1. **Check microphone**: Test in another app (Zoom, Discord, etc.)
2. **Speak louder**: Move closer to the microphone
3. **Reduce noise**: Find a quieter environment
4. **Check settings**: Ensure correct microphone is selected in system settings
5. **Try again**: Click the microphone button to restart

**Windows Microphone Check**:
- Settings → System → Sound → Input → Test your microphone

**Mac Microphone Check**:
- System Preferences → Sound → Input → Check input level

---

### "Network error occurred"

**Cause**: Connection issue during form generation.

**Fix**:
1. Check your internet connection
2. Refresh the page
3. Try generating the form again
4. Your transcription is saved automatically

---

### "Form generation failed"

**Cause**: AI couldn't understand your description.

**Fix**:
1. **Review transcription**: Check for errors or unclear text
2. **Add details**: Be more specific about field types
3. **Use examples**: Follow the patterns in the user guide
4. **Edit manually**: Correct the transcription before regenerating
5. **Simplify**: Break complex forms into simpler descriptions

**Example Improvements**:
- ❌ "Add fields for user info"
- ✅ "Add text fields for first name, last name, and email address"

---

## 🔍 Common Problems

### Transcription is Inaccurate

**Symptoms**: Words are wrong or missing.

**Solutions**:
- ✅ Speak more slowly and clearly
- ✅ Pause between sentences
- ✅ Reduce background noise
- ✅ Use standard vocabulary (avoid jargon)
- ✅ Edit the text manually after speaking
- ✅ Check that the correct language is selected

**Pro Tip**: Enunciate clearly and speak at a moderate pace.

---

### Voice Input Stops Automatically

**Symptoms**: Recording stops after 10 seconds of silence.

**Solutions**:
- This is **normal behavior** to conserve resources
- Click the microphone button to resume
- Your previous transcription is preserved
- Continue speaking where you left off

**Pro Tip**: Speak continuously or pause for less than 10 seconds.

---

### Transcription Disappeared

**Symptoms**: Your text is gone after closing the browser.

**Solutions**:
- Transcriptions are saved for **24 hours**
- If you cleared browser data, it's lost
- Always generate the form before closing
- Use the auto-save feature (saves every 5 seconds)

**Prevention**: Generate your form before leaving the page.

---

### Wrong Language Detected

**Symptoms**: Transcription is in the wrong language.

**Solutions**:
1. Click the **language dropdown** (top right of voice panel)
2. Select your preferred language
3. Clear the transcription and start over
4. Speak in the selected language

**Supported Languages**:
- English, Spanish, French, German, Chinese, Japanese

---

### Microphone Works in Other Apps But Not Here

**Symptoms**: Microphone works in Zoom/Discord but not in Form Builder.

**Solutions**:
1. **Check HTTPS**: Voice input requires a secure connection (https://)
2. **Check permissions**: Browser may have site-specific permissions
3. **Clear cache**: Clear browser cache and cookies
4. **Try incognito**: Test in a private/incognito window
5. **Restart browser**: Close and reopen your browser

---

### Form Fields Don't Match Description

**Symptoms**: Generated form is different from what you described.

**Solutions**:
1. **Review transcription**: Check if speech was captured correctly
2. **Be more specific**: Use clear field type names
3. **Add validation**: Specify requirements explicitly
4. **Use examples**: Follow the patterns in the documentation
5. **Edit after**: Customize fields using the form builder

**Example**:
- ❌ "Add a field for age"
- ✅ "Add a number field for age with minimum 18 and maximum 100"

---

### Audio Level Meter Not Moving

**Symptoms**: No visual feedback when speaking.

**Solutions**:
1. Check that recording is active (red indicator)
2. Verify microphone is not muted
3. Check system microphone settings
4. Try a different microphone
5. Restart the browser

---

### Keyboard Shortcut Not Working

**Symptoms**: Ctrl+Shift+V doesn't toggle voice input.

**Solutions**:
1. **Check focus**: Click on the page first
2. **Check conflicts**: Another extension may use the same shortcut
3. **Try alternative**: Use the microphone button instead
4. **Check OS**: Some operating systems reserve this shortcut

**Mac Users**: Use `Cmd+Shift+V` instead of `Ctrl+Shift+V`

---

## 🔧 Advanced Troubleshooting

### Clear Browser Data

If issues persist, try clearing browser data:

**Chrome/Edge**:
1. Press `Ctrl+Shift+Delete`
2. Select "Cached images and files"
3. Click "Clear data"
4. Refresh the page

**Safari**:
1. Safari → Preferences → Privacy
2. Click "Manage Website Data"
3. Remove data for the site
4. Refresh the page

---

### Check Browser Console

For technical users:

1. Press `F12` to open Developer Tools
2. Click the **Console** tab
3. Look for error messages in red
4. Share these with support if needed

---

### Test in Different Browser

If nothing works:

1. Try **Chrome** (best support)
2. Try **Edge** (second best)
3. Try **Safari** (Mac users)
4. Update to the latest version

---

## 📞 Still Need Help?

### Before Contacting Support

Gather this information:
- Browser name and version
- Operating system
- Error message (exact text)
- Steps to reproduce the issue
- Screenshot (if applicable)

### Contact Options

- 📧 **Email Support**: support@example.com
- 💬 **Live Chat**: Available on our website
- 📖 **Documentation**: [Full User Guide](./VOICE_INPUT_GUIDE.md)
- 🎥 **Video Tutorials**: YouTube channel

---

## 🔄 Workarounds

If voice input isn't working, you can:

1. **Use manual text input**: Type your form description
2. **Build manually**: Add fields one by one using the form builder
3. **Use templates**: Start with a pre-built template
4. **Try later**: Voice services may be temporarily unavailable

---

## 📊 Diagnostic Checklist

Use this checklist to diagnose issues:

- [ ] Browser is Chrome, Edge, or Safari
- [ ] Browser is up to date
- [ ] Site is using HTTPS (secure connection)
- [ ] Microphone permissions are granted
- [ ] Microphone works in other applications
- [ ] Internet connection is stable
- [ ] No browser extensions blocking microphone
- [ ] JavaScript is enabled
- [ ] Local storage is enabled
- [ ] Correct language is selected

If all items are checked and it still doesn't work, contact support.

---

**Last Updated**: November 2025  
**Version**: 1.0.0
