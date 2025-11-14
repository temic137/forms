# Form Builder - Multiple Creation Methods 🚀

A powerful Next.js form builder application with **5 different ways to create forms**, including AI-powered generation, voice input, file upload, JSON import, and document scanning.

## ✨ Key Features

### Multiple Form Creation Methods

1. **🤖 AI Prompt Generation** - Describe your form in natural language
2. **🎤 Voice Input** - Speak your requirements (50+ languages)
3. **📁 File Upload** - Import from CSV, JSON, or TXT files
4. **📋 JSON Import** - Developer-friendly direct structure import
5. **📸 Document Scanner** - OCR-powered form digitization from images/PDFs

### Advanced Builder Features

- Drag-and-drop field reordering
- 10+ field types (text, email, number, date, select, radio, checkbox, etc.)
- Multi-step form support
- Conditional logic with intelligent relationship detection
- Custom styling and themes
- Real-time preview (desktop, tablet, mobile)
- Keyboard shortcuts
- Bulk field operations
- Template library
- Form analytics
- Email notifications

### 🧠 Enhanced Intelligent Form Generation

- **Context Understanding**: Analyzes source material to identify key topics and data types
- **Smart Question Generation**: Creates questions aligned with content purpose
- **Intelligent Field Matching**: Uses appropriate input formats based on data type
- **Flow Optimization**: Ensures logical question progression
- **Redundancy Prevention**: Avoids asking for already-present information
- **Domain Adaptation**: Recognizes document types (medical, survey, business, etc.)
- **Multi-source Support**: Works with text, voice, JSON, documents, and scanned forms
- **🚀 Multi-Model AI**: Uses 3+ AI models for validation, consensus, and refinement
  - Automatic complexity detection
  - Ensemble analysis with multiple perspectives
  - Built-in validation layer
  - Iterative refinement for excellence

## 🎯 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start building forms!

### Create Your First Form

1. Navigate to `/create`
2. Choose your preferred creation method:
   - **Quick start?** Use AI Prompt
   - **Hands-free?** Use Voice Input
   - **Have data?** Use File Upload
   - **Need precision?** Use JSON Import
   - **Digitizing?** Use Document Scanner
3. Customize in the builder
4. Publish and share!

## 📖 Documentation

- **[Multiple Creation Methods Guide](./MULTIPLE_CREATION_METHODS_GUIDE.md)** - Complete guide for all creation methods
- **[Multi-Model AI Intelligence](./docs/MULTI_MODEL_INTELLIGENCE.md)** - **🚀 NEW!** Multiple AI models for superior accuracy
- **[Dynamic Intelligent Generation](./docs/DYNAMIC_INTELLIGENT_GENERATION.md)** - AI-driven flexible form generation
- **[Enhanced Form Generation Guide](./docs/ENHANCED_FORM_GENERATION.md)** - Intelligent content analysis and question generation
- **[Voice Input Guide](./docs/VOICE_INPUT_GUIDE.md)** - Voice features and language support
- **[Design System](./DESIGN_SYSTEM.md)** - UI components and styling
- **[Feature Flags](./FEATURE_FLAGS.md)** - Managing features
- **[Testing Guide](./AI_TESTING_GUIDE.md)** - Running tests

## 🎨 Creation Methods in Detail

### AI Prompt

```typescript
"Create a customer feedback form with rating, comments, and email"
```

AI automatically generates appropriate fields with smart type detection.

### Voice Input

Speak naturally in 50+ languages:
- English, Spanish, French, German, Japanese, Chinese, and more
- Auto-submit after silence
- Edit transcript before generation
- Session restoration

### File Upload

**CSV Example:**
```csv
label,type,required,options
Full Name,text,true,
Email,email,true,
Country,select,true,"USA,UK,Canada"
```

**JSON Example:**
```json
{
  "title": "Contact Form",
  "fields": [
    {"label": "Name", "type": "text", "required": true},
    {"label": "Email", "type": "email", "required": true}
  ]
}
```

### Document Scanner

Upload a photo or PDF of an existing form:
- OCR extracts text and structure
- AI identifies field types
- Recreates digital form automatically

## 🛠 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** Prisma + PostgreSQL
- **AI:** Groq (Llama 3.3 70B)
- **Styling:** Tailwind CSS
- **Speech Recognition:** Web Speech API
- **Testing:** Jest + React Testing Library
- **Drag & Drop:** @dnd-kit

## 📂 Project Structure

```
forms/
├── src/
│   ├── app/
│   │   ├── create/          # Multiple creation methods page
│   │   ├── builder/         # Form builder
│   │   ├── dashboard/       # User dashboard
│   │   └── api/
│   │       └── ai/
│   │           ├── generate/      # AI prompt generation
│   │           ├── import-file/   # File upload processing
│   │           └── scan-form/     # OCR scanning
│   ├── components/
│   │   ├── FormCreationMethods.tsx   # Method selector
│   │   ├── FileUploadCreator.tsx     # File upload UI
│   │   ├── DocumentScanner.tsx       # Scanner UI
│   │   ├── JSONImportCreator.tsx     # JSON editor
│   │   └── VoiceInput.tsx           # Voice recording
│   ├── lib/                # Utilities
│   └── types/              # TypeScript types
├── prisma/                 # Database schema
└── docs/                   # Documentation
```

## 🔧 API Endpoints

### Form Generation

```typescript
// AI Prompt / Voice
POST /api/ai/generate
Body: { brief: string }

// File Upload
POST /api/ai/import-file
Body: FormData (file: .csv, .json, .txt)

// Document Scanner
POST /api/ai/scan-form
Body: FormData (file: .jpg, .png, .pdf)
```

### Form Management

```typescript
// Create form
POST /api/forms
Body: { title: string, fields: Field[], userId: string }

// Get form
GET /api/forms/[id]

// Update form
PATCH /api/forms/[id]

// Delete form
DELETE /api/forms/[id]
```

## 🎯 Use Cases

### Business
- Customer feedback forms
- Lead generation forms
- Registration forms
- Order forms
- Survey forms

### Education
- Student registration
- Course evaluation
- Assignment submission
- Parent consent forms

### Events
- RSVP forms
- Ticket booking
- Volunteer signup
- Speaker applications

### Healthcare
- Patient intake forms
- Appointment scheduling
- Symptom checkers
- Consent forms

## 🚀 Deployment

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# AI Service
GROQ_API_KEY="your-key"

# Authentication
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or use the [Vercel Dashboard](https://vercel.com/new) with one-click deployment.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test suite
npm test -- voice-input
```

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines.

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) - React framework
- [Groq](https://groq.com) - AI inference
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Prisma](https://prisma.io) - Database ORM
- [dnd-kit](https://dndkit.com) - Drag and drop

## 📞 Support

- Documentation: [Read the guides](./MULTIPLE_CREATION_METHODS_GUIDE.md)
- Issues: [GitHub Issues](https://github.com/yourusername/forms/issues)
- Discussions: [GitHub Discussions](https://github.com/yourusername/forms/discussions)

---

**Built with ❤️ using Next.js and AI**
