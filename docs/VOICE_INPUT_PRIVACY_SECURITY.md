# Voice Input Privacy & Security Guide

Understanding how your data is protected when using Voice Input.

## 🔒 Privacy Overview

### Our Commitment

Your privacy is our top priority. Voice Input is designed with privacy-first principles:

- ✅ **No audio recording**: We never record or store your voice
- ✅ **Local processing**: Speech recognition happens in your browser
- ✅ **Text only**: Only text transcriptions are sent to our servers
- ✅ **Temporary storage**: Data is automatically deleted
- ✅ **Your control**: You can disable voice input anytime

---

## 🎤 How Voice Input Works

### Step-by-Step Data Flow

#### 1. You Speak
- You click the microphone button and speak
- Your voice is captured by your device's microphone
- **No recording is made**

#### 2. Browser Processes Speech
- Your browser's Web Speech API converts speech to text
- This happens **locally in your browser** (when possible)
- Some browsers may use cloud services (Google, Apple)
- **No audio is sent to our servers**

#### 3. Text Appears
- The transcribed text appears in your browser
- Stored temporarily in your browser's local storage
- **Only you can see this text**

#### 4. You Generate Form
- You click "Generate Form"
- **Only the text** (not audio) is sent to our AI service
- AI analyzes the text and creates form configuration
- Form configuration is returned to your browser

#### 5. Automatic Cleanup
- Transcription is cleared after successful form generation
- Local storage is cleaned up automatically
- **No permanent storage of your voice data**

---

## 🛡️ What We Do NOT Do

### We Never:

- ❌ Record your voice
- ❌ Store audio files
- ❌ Send audio to our servers
- ❌ Share your voice data with third parties
- ❌ Use your voice for training AI models (without consent)
- ❌ Listen when you're not actively using voice input
- ❌ Access your microphone without permission
- ❌ Keep transcriptions after form generation

---

## 📊 Data Storage

### Local Storage (Your Browser)

**What's Stored**:
- Text transcriptions only
- Session metadata (timestamp, language)
- User preferences (language selection)

**Duration**:
- Up to 24 hours
- Automatically deleted after form generation
- Cleared when you clear browser data

**Location**:
- Stored on your device only
- Not synced to cloud
- Not accessible to other websites

**Access**:
- Only you can access this data
- Only on the device where it was created
- Cleared when you use private/incognito mode

### Our Servers

**What's Stored**:
- Text transcriptions (temporarily during processing)
- Generated form configurations
- Usage analytics (if you opt in)

**Duration**:
- Transcriptions: Deleted immediately after processing
- Form configurations: Stored as part of your form data
- Analytics: Aggregated and anonymized

**Location**:
- Secure cloud servers (encrypted)
- Compliant with data protection regulations
- Not shared with third parties

---

## 🔐 Security Measures

### HTTPS Requirement

Voice Input **only works on HTTPS** (secure connections):

- ✅ All data transmitted is encrypted
- ✅ Protects against man-in-the-middle attacks
- ✅ Required by browsers for microphone access
- ✅ Industry standard for web security

### Permission-Based Access

Microphone access requires explicit permission:

- ✅ You must click "Allow" in browser prompt
- ✅ Permission is granted per-site
- ✅ You can revoke permission anytime
- ✅ No background listening

### Automatic Cleanup

Data is automatically cleaned up:

- ✅ Transcriptions cleared after form generation
- ✅ Session data expires after 24 hours
- ✅ No persistent voice data storage
- ✅ Cleared when you navigate away

### Secure Transmission

When text is sent to our servers:

- ✅ Encrypted in transit (TLS 1.3)
- ✅ Authenticated requests only
- ✅ Rate limiting to prevent abuse
- ✅ Input sanitization to prevent injection attacks

---

## 🌐 Third-Party Services

### Web Speech API

Voice Input uses your browser's built-in speech recognition:

**Chrome/Edge (Google)**:
- Uses Google's speech recognition service
- Subject to [Google's Privacy Policy](https://policies.google.com/privacy)
- May send audio to Google servers for processing
- Supports 100+ languages

**Safari (Apple)**:
- Uses Apple's speech recognition service
- Subject to [Apple's Privacy Policy](https://www.apple.com/legal/privacy/)
- Prioritizes on-device processing
- Supports 50+ languages

**What This Means**:
- Your browser vendor may process your speech
- We have no control over their processing
- Review their privacy policies for details
- Consider using Safari for more local processing

### Our AI Service

Text transcriptions are sent to our AI service:

**What We Do**:
- Process text to generate form configurations
- Delete transcriptions immediately after processing
- Do not use data for training (without consent)
- Comply with data protection regulations

**What We Don't Do**:
- Store transcriptions permanently
- Share data with third parties
- Use data for advertising
- Sell your data

---

## 👤 Your Privacy Rights

### Access and Control

You have full control over your data:

**View Your Data**:
- Transcriptions are visible in the voice input panel
- Form configurations are visible in the form builder
- Usage statistics (if enabled) in your profile

**Delete Your Data**:
- Click "Clear" to remove transcriptions
- Delete forms to remove form configurations
- Clear browser data to remove local storage
- Contact us to delete server-side data

**Export Your Data**:
- Export forms as JSON
- Download form submissions
- Request data export from support

**Opt Out**:
- Disable voice input in settings
- Opt out of analytics
- Use manual text input instead

### Data Protection Rights

Depending on your location, you may have additional rights:

**GDPR (EU)**:
- Right to access your data
- Right to rectification
- Right to erasure ("right to be forgotten")
- Right to data portability
- Right to object to processing

**CCPA (California)**:
- Right to know what data is collected
- Right to delete personal information
- Right to opt out of data sales (we don't sell data)
- Right to non-discrimination

**Contact Us**: privacy@example.com to exercise your rights

---

## 🔒 Best Practices for Privacy

### Maximize Your Privacy

**Do**:
- ✅ Use voice input in a private space
- ✅ Review transcriptions before generating forms
- ✅ Clear transcriptions after use
- ✅ Use Safari for more local processing (macOS/iOS)
- ✅ Keep your browser updated
- ✅ Use strong passwords for your account

**Don't**:
- ❌ Speak sensitive information (passwords, SSNs, credit cards)
- ❌ Use voice input in public spaces
- ❌ Share your device with others while using voice input
- ❌ Use voice input on shared/public computers
- ❌ Leave transcriptions visible on screen

### For Sensitive Forms

If you're creating forms that will collect sensitive data:

1. **Use manual input** instead of voice input
2. **Review privacy settings** carefully
3. **Enable encryption** for form submissions
4. **Comply with regulations** (HIPAA, GDPR, etc.)
5. **Consult legal counsel** if needed

---

## 🚨 Security Incidents

### What We Do

In the unlikely event of a security incident:

1. **Immediate Response**: Contain and investigate the incident
2. **Notification**: Notify affected users within 72 hours
3. **Remediation**: Fix vulnerabilities and prevent recurrence
4. **Transparency**: Provide clear information about the incident
5. **Support**: Offer assistance to affected users

### What You Should Do

If you suspect a security issue:

1. **Change your password** immediately
2. **Revoke microphone permissions** if concerned
3. **Clear browser data** to remove local storage
4. **Contact us**: security@example.com
5. **Monitor your account** for unusual activity

---

## 📋 Privacy Policy Summary

### Key Points

**Data Collection**:
- Voice input: Text transcriptions only (no audio)
- Usage: Analytics (optional, anonymized)
- Account: Email, name, preferences

**Data Use**:
- Provide voice input functionality
- Generate forms from transcriptions
- Improve service quality (with consent)
- Comply with legal obligations

**Data Sharing**:
- We do not sell your data
- We do not share with third parties (except service providers)
- We comply with legal requests (court orders, etc.)

**Data Retention**:
- Transcriptions: Deleted immediately after processing
- Forms: Retained until you delete them
- Account: Retained until you close your account
- Analytics: Aggregated and anonymized

**Your Rights**:
- Access, correct, delete your data
- Opt out of analytics
- Disable voice input
- Export your data

### Full Privacy Policy

Read our complete privacy policy: [Privacy Policy](#)

---

## 🔍 Transparency

### Open About Our Practices

We believe in transparency:

**What We Track**:
- Voice session duration (for performance monitoring)
- Error rates (to improve reliability)
- Feature usage (to prioritize improvements)
- Browser compatibility (to support more users)

**What We Don't Track**:
- Audio recordings
- Transcription content (after processing)
- Personal conversations
- Microphone usage outside voice input

**How We Use Data**:
- Improve voice recognition accuracy
- Fix bugs and errors
- Optimize performance
- Develop new features

**How We Don't Use Data**:
- Advertising or marketing
- Selling to third parties
- Training AI models (without consent)
- Profiling or tracking

---

## 🌍 Compliance

### Regulations We Comply With

**GDPR (General Data Protection Regulation)**:
- EU data protection law
- Applies to EU residents
- Strict privacy requirements
- User rights and consent

**CCPA (California Consumer Privacy Act)**:
- California privacy law
- Applies to California residents
- Consumer rights and transparency
- Opt-out mechanisms

**COPPA (Children's Online Privacy Protection Act)**:
- US law protecting children under 13
- Parental consent required
- Limited data collection
- We do not knowingly collect data from children

**HIPAA (Health Insurance Portability and Accountability Act)**:
- US healthcare privacy law
- Applies to healthcare data
- If you're creating healthcare forms, consult legal counsel
- Additional safeguards may be required

### International Data Transfers

If you're outside the US:

- Data may be transferred to US servers
- We use standard contractual clauses (SCCs)
- Compliant with EU-US Data Privacy Framework
- Your rights are protected regardless of location

---

## 📞 Privacy Questions?

### Contact Us

**Privacy Team**: privacy@example.com  
**Security Team**: security@example.com  
**Data Protection Officer**: dpo@example.com

### Resources

- 📖 [Full Privacy Policy](#)
- 📖 [Terms of Service](#)
- 📖 [Security Practices](#)
- 📖 [Data Processing Agreement](#)

### Report a Concern

If you have privacy or security concerns:

1. Email: privacy@example.com
2. Include: Detailed description of your concern
3. Response: Within 48 hours
4. Resolution: We take all concerns seriously

---

## ✅ Privacy Checklist

Before using voice input, ensure:

- [ ] You're in a private space
- [ ] You understand how voice input works
- [ ] You've reviewed the privacy policy
- [ ] You're comfortable with browser speech recognition
- [ ] You won't speak sensitive information
- [ ] You'll clear transcriptions after use
- [ ] You're using a secure connection (HTTPS)
- [ ] You trust the device you're using

---

**Last Updated**: November 2025  
**Version**: 1.0.0  
**Privacy Policy Version**: 2.1

---

## 🔐 Security Certifications

- ✅ SOC 2 Type II Certified
- ✅ ISO 27001 Compliant
- ✅ GDPR Compliant
- ✅ CCPA Compliant
- ✅ Regular security audits
- ✅ Penetration testing
- ✅ Bug bounty program

**Questions about our security?** Contact security@example.com
