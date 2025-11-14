# Voice Input Language Support Guide

Complete guide to using Voice Input in multiple languages.

## 🌍 Supported Languages

Voice Input supports **6 major languages** with multiple regional variants:

| Language | Code | Regions | Status |
|----------|------|---------|--------|
| **English** | en | US, UK, Australia, Canada, India | ✅ Full Support |
| **Spanish** | es | Spain, Mexico, Latin America | ✅ Full Support |
| **French** | fr | France, Canada, Belgium, Switzerland | ✅ Full Support |
| **German** | de | Germany, Austria, Switzerland | ✅ Full Support |
| **Chinese** | zh | Simplified, Traditional | ✅ Full Support |
| **Japanese** | ja | Japan | ✅ Full Support |

---

## 🎯 Quick Start by Language

### English (en-US)

**Variants**: en-US, en-GB, en-AU, en-CA, en-IN

**Example Description**:
```
"I need a contact form with full name, email address, phone number, 
and a message box. Name and email are required."
```

**Common Terms**:
- Text field, text box, input field
- Email field, email address
- Dropdown, select menu, dropdown list
- Checkbox, check box
- Radio button, radio option
- Text area, message box
- Number field, numeric input
- Date picker, date field

**Tips**:
- Use standard American/British English
- Technical terms are well-recognized
- Both formal and casual speech work

---

### Spanish (es-ES)

**Variants**: es-ES (Spain), es-MX (Mexico), es-AR (Argentina)

**Example Description**:
```
"Necesito un formulario de contacto con nombre completo, correo electrónico, 
número de teléfono y un cuadro de mensaje. El nombre y el correo son obligatorios."
```

**Common Terms**:
- Campo de texto, cuadro de texto
- Campo de correo electrónico
- Lista desplegable, menú desplegable
- Casilla de verificación
- Botón de opción, botón de radio
- Área de texto, cuadro de mensaje
- Campo numérico
- Selector de fecha

**Tips**:
- Both European and Latin American Spanish work
- Use natural Spanish phrases
- Formal and informal speech both supported
- AI understands regional variations

**Regional Differences**:
- Spain: "correo electrónico", "teléfono móvil"
- Mexico: "email", "celular"
- Both are understood correctly

---

### French (fr-FR)

**Variants**: fr-FR (France), fr-CA (Canada), fr-BE (Belgium)

**Example Description**:
```
"J'ai besoin d'un formulaire de contact avec nom complet, adresse e-mail, 
numéro de téléphone et une zone de message. Le nom et l'e-mail sont obligatoires."
```

**Common Terms**:
- Champ de texte, zone de texte
- Champ e-mail, adresse e-mail
- Liste déroulante, menu déroulant
- Case à cocher
- Bouton radio
- Zone de texte, boîte de message
- Champ numérique
- Sélecteur de date

**Tips**:
- Both European and Canadian French supported
- Accents are handled correctly (é, è, ê, à, etc.)
- Formal "vous" and informal "tu" both work
- Technical terms can be French or English

**Regional Differences**:
- France: "e-mail", "téléphone portable"
- Canada: "courriel", "cellulaire"
- Both variants are recognized

---

### German (de-DE)

**Variants**: de-DE (Germany), de-AT (Austria), de-CH (Switzerland)

**Example Description**:
```
"Ich brauche ein Kontaktformular mit vollständigem Namen, E-Mail-Adresse, 
Telefonnummer und einem Nachrichtenfeld. Name und E-Mail sind erforderlich."
```

**Common Terms**:
- Textfeld, Eingabefeld
- E-Mail-Feld, E-Mail-Adresse
- Dropdown-Menü, Auswahlmenü
- Kontrollkästchen, Checkbox
- Optionsfeld, Radio-Button
- Textbereich, Nachrichtenfeld
- Zahlenfeld, numerisches Feld
- Datumsauswahl, Datumsfeld

**Tips**:
- Compound words are recognized correctly
- Both formal "Sie" and informal "du" work
- Swiss and Austrian variants supported
- Technical English terms also understood

**Compound Words**:
- "Kontaktformular" (contact form)
- "E-Mail-Adresse" (email address)
- "Telefonnummer" (phone number)
- AI handles these correctly

---

### Chinese (zh-CN)

**Variants**: zh-CN (Simplified), zh-TW (Traditional)

**Example Description (Simplified)**:
```
"我需要一个联系表单，包含全名、电子邮件地址、电话号码和留言框。
姓名和电子邮件是必填项。"
```

**Example Description (Traditional)**:
```
"我需要一個聯絡表單，包含全名、電子郵件地址、電話號碼和留言框。
姓名和電子郵件是必填項。"
```

**Common Terms (Simplified)**:
- 文本字段 (text field)
- 电子邮件字段 (email field)
- 下拉菜单 (dropdown)
- 复选框 (checkbox)
- 单选按钮 (radio button)
- 文本区域 (text area)
- 数字字段 (number field)
- 日期选择器 (date picker)

**Tips**:
- Both Simplified and Traditional supported
- Speak in Mandarin for best results
- AI understands context and generates appropriate labels
- Technical terms can be Chinese or English

**Character Recognition**:
- Simplified: 简体中文
- Traditional: 繁體中文
- Both are processed correctly

---

### Japanese (ja-JP)

**Example Description**:
```
"氏名、メールアドレス、電話番号、メッセージボックスを含む
お問い合わせフォームが必要です。氏名とメールは必須です。"
```

**Common Terms**:
- テキストフィールド (text field)
- メールフィールド (email field)
- ドロップダウンメニュー (dropdown)
- チェックボックス (checkbox)
- ラジオボタン (radio button)
- テキストエリア (text area)
- 数値フィールド (number field)
- 日付ピッカー (date picker)

**Tips**:
- Both formal and casual Japanese work
- Kanji, hiragana, and katakana all recognized
- Technical terms can be Japanese or English
- AI handles honorifics correctly

**Writing Systems**:
- Kanji: 漢字 (Chinese characters)
- Hiragana: ひらがな (Japanese syllabary)
- Katakana: カタカナ (for foreign words)
- All three are processed correctly

---

## 🔄 Switching Languages

### How to Change Language

1. Open the Voice Input panel
2. Click the **language dropdown** (top right corner)
3. Select your preferred language
4. Start speaking in that language

### Auto-Detection

Voice Input automatically detects your browser's language:

- If your browser is set to Spanish, voice input starts in Spanish
- If your browser is set to French, voice input starts in French
- You can override this by selecting a different language

### Mid-Session Language Switch

If you switch languages during a session:

**What Happens**:
- A warning appears: "Switching languages may affect transcription accuracy"
- Your existing transcription remains unchanged
- New speech is recognized in the new language
- You can mix languages, but accuracy may decrease

**Best Practice**:
- Use one language per session for best results
- Clear transcription before switching languages
- Generate form before switching

---

## 💡 Language-Specific Tips

### English

**Accents**:
- American, British, Australian, Canadian, Indian accents all supported
- Speak clearly for best results
- Regional slang may not be recognized

**Technical Terms**:
- "Email" vs "e-mail" - both work
- "Checkbox" vs "check box" - both work
- Use standard terminology for best results

---

### Spanish

**Formal vs Informal**:
- "Necesito" (I need) - works well
- "Quiero" (I want) - also works
- Both formal and informal speech recognized

**Regional Variations**:
- Spain: "ordenador" (computer)
- Latin America: "computadora" (computer)
- Both understood in context

**Accents**:
- Accents are important: "correo" vs "correo"
- AI handles missing accents gracefully
- Speak naturally, don't over-enunciate

---

### French

**Liaisons**:
- Natural liaisons are handled correctly
- "Les enfants" pronounced as "lezenfants"
- Speak naturally, don't pause unnaturally

**Accents**:
- é, è, ê, à, ù, ç are recognized correctly
- Speak naturally, AI handles accents
- Missing accents are corrected automatically

**Canadian French**:
- Different pronunciation is recognized
- Different vocabulary is understood
- "Courriel" vs "e-mail" both work

---

### German

**Compound Words**:
- Long compound words are recognized
- "Kontaktformular" (contact form)
- "Telefonnummer" (phone number)
- Speak as one word, not separate words

**Umlauts**:
- ä, ö, ü are recognized correctly
- "Über" (over), "Für" (for)
- Speak naturally, AI handles umlauts

**Swiss German**:
- Standard German works best
- Swiss German dialect may have issues
- Use High German for best results

---

### Chinese

**Tones**:
- Mandarin tones are important
- Speak clearly with correct tones
- AI uses context to disambiguate

**Simplified vs Traditional**:
- Select the correct variant in settings
- Simplified: Mainland China
- Traditional: Taiwan, Hong Kong
- AI generates labels in selected variant

**Pinyin**:
- Not supported for voice input
- Use Chinese characters only
- Speak in Mandarin, not Pinyin

---

### Japanese

**Politeness Levels**:
- Both formal (です/ます) and casual (だ/である) work
- Use natural speech
- AI understands context

**Kanji Readings**:
- Multiple readings are handled correctly
- Context determines correct reading
- Speak naturally, AI disambiguates

**Katakana Words**:
- Foreign words in katakana work well
- "メール" (mail), "フォーム" (form)
- Speak clearly for best recognition

---

## 🌐 Form Generation by Language

### How Language Affects Form Generation

When you generate a form:

1. **Field Labels**: Created in your selected language
2. **Validation Messages**: Match the language
3. **Placeholder Text**: In the selected language
4. **Error Messages**: Localized to the language

### Example: English Form

```json
{
  "fields": [
    {
      "type": "text",
      "label": "Full Name",
      "placeholder": "Enter your full name",
      "required": true,
      "errorMessage": "Name is required"
    }
  ]
}
```

### Example: Spanish Form

```json
{
  "fields": [
    {
      "type": "text",
      "label": "Nombre Completo",
      "placeholder": "Ingrese su nombre completo",
      "required": true,
      "errorMessage": "El nombre es obligatorio"
    }
  ]
}
```

### Example: Japanese Form

```json
{
  "fields": [
    {
      "type": "text",
      "label": "氏名",
      "placeholder": "氏名を入力してください",
      "required": true,
      "errorMessage": "氏名は必須です"
    }
  ]
}
```

---

## 🔍 Language Detection

### Automatic Detection

Voice Input automatically detects:

1. **Browser Language**: Uses `navigator.language`
2. **Fallback**: Defaults to English if language not supported
3. **User Override**: You can manually select any supported language

### Detection Logic

```
1. Check browser language setting
2. Match to supported languages
3. If exact match found → Use that language
4. If partial match found → Use base language (e.g., en-GB → en-US)
5. If no match found → Default to en-US
```

### Changing Browser Language

**Chrome/Edge**:
- Settings → Languages → Add language → Move to top

**Safari**:
- System Preferences → Language & Region → Preferred Languages

**Firefox**:
- Settings → Language → Choose language

---

## 🚫 Unsupported Languages

### Not Currently Supported

Languages not in the list above are not supported:

- Italian, Portuguese, Russian, Arabic, Hindi, Korean, etc.

### Workarounds

If your language isn't supported:

1. **Use English**: Most widely supported
2. **Type Description**: Use manual text input in any language
3. **Build Manually**: Create form fields one by one
4. **Request Support**: Vote for your language on our feedback page

### Coming Soon

We're working on adding more languages:

- Italian (it-IT)
- Portuguese (pt-BR, pt-PT)
- Russian (ru-RU)
- Korean (ko-KR)
- Arabic (ar-SA)

**Vote for your language**: feedback@example.com

---

## 📊 Language Accuracy

### Recognition Accuracy by Language

| Language | Accuracy | Notes |
|----------|----------|-------|
| English | 95-98% | Best support |
| Spanish | 93-96% | Excellent support |
| French | 92-95% | Very good support |
| German | 92-95% | Very good support |
| Chinese | 90-94% | Good support, tone-dependent |
| Japanese | 90-93% | Good support, context-dependent |

**Factors Affecting Accuracy**:
- Microphone quality
- Background noise
- Speaking clarity
- Accent/dialect
- Technical vocabulary

---

## 🎓 Best Practices by Language

### Universal Tips

Regardless of language:

- ✅ Speak clearly and at moderate pace
- ✅ Use standard vocabulary
- ✅ Pause between sentences
- ✅ Reduce background noise
- ✅ Use a good microphone

### Language-Specific

**English**: Use standard terms, avoid slang  
**Spanish**: Speak naturally, both formal/informal work  
**French**: Natural liaisons are fine, speak normally  
**German**: Compound words as one word, not separate  
**Chinese**: Correct tones are important  
**Japanese**: Natural speech, AI handles politeness levels

---

## 🆘 Language Troubleshooting

### Wrong Language Detected

**Problem**: System transcribes in wrong language

**Solution**:
1. Check language selector dropdown
2. Select correct language manually
3. Clear transcription and start over
4. Ensure browser language is set correctly

### Poor Recognition in Your Language

**Problem**: Many errors in transcription

**Solution**:
1. Speak more slowly and clearly
2. Reduce background noise
3. Check microphone quality
4. Use standard vocabulary
5. Try editing transcription manually

### Mixed Language Transcription

**Problem**: Transcription mixes two languages

**Solution**:
1. Select one language and stick to it
2. Don't mix languages in one sentence
3. Clear transcription before switching languages
4. Use English as fallback if needed

---

## 📞 Language Support

### Need Help in Your Language?

**Support Available In**:
- English
- Spanish
- French
- German
- Chinese
- Japanese

**Contact**: support@example.com

### Documentation Translations

This guide is available in:
- English (this document)
- Spanish (coming soon)
- French (coming soon)
- German (coming soon)
- Chinese (coming soon)
- Japanese (coming soon)

---

**Last Updated**: November 2025  
**Version**: 1.0.0
