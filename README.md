# 🎤 AnyForm - AI-Powered Form Builder

> Transform conversations into forms in seconds using **Google Gemini 3 API**

[![Built with Gemini 3](https://img.shields.io/badge/Built%20with-Gemini%203-blue?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/)

---

## 🌟 Overview

**AnyForm** is an AI-powered form builder that transforms natural language into fully functional, production-ready forms in seconds. Simply describe what you need—or better yet, **speak it**—and watch as Gemini 3 creates a professional form instantly.

### ✨ Key Features

- 🎤 **Voice Mode** - Speak your form requirements hands-free with smart auto-stop
- 🤖 **AI-Powered** - Gemini 3 understands context and creates appropriate fields
- 📱 **Mobile-Optimized** - Works flawlessly on iOS and Android
- 🔄 **Real-Time Collaboration** - Multiple users can edit simultaneously
- 📊 **Analytics Dashboard** - Track submissions and insights
- 🌐 **Embed Anywhere** - Generate embed codes for any website

---

### Quick Preview

![AnyForm Landing Page](https://i.imgur.com/Y6JkRtj.png)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Google Gemini API key ([Get one here](https://ai.google.dev/))

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/anyform.git
cd anyform
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/anyform"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here" # Generate with: openssl rand -base64 32

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Gemini API
GEMINI_API_KEY="your-gemini-api-key"

# Pusher (for real-time collaboration)
NEXT_PUBLIC_PUSHER_APP_KEY="your-pusher-key"
NEXT_PUBLIC_PUSHER_CLUSTER="your-cluster"
PUSHER_APP_ID="your-app-id"
PUSHER_SECRET="your-secret"

# Vercel Blob (optional, for file uploads)
BLOB_READ_WRITE_TOKEN="your-blob-token"
```

4. **Set up the database**

```bash
npx prisma generate
npx prisma db push
```

5. **Run the development server**

```bash
npm run dev
```

6. **Open your browser**

Visit [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety throughout
- **Tailwind CSS** - Custom "paper wireframe" theme
- **React Hooks** - State management

### Backend
- **Next.js API Routes** - Serverless functions
- **Prisma ORM** - Type-safe database access
- **PostgreSQL** - Production database
- **NextAuth.js** - Authentication

### AI Integration
- **Google Gemini 3 API** - Natural language processing
  - Gemini Pro (Text generation)
  - Gemini Vision (Image analysis)
  - Gemini Embeddings (Semantic search)
  - Function Calling (Structured output)

### Voice Technology
- **Web Speech API** - Browser-native speech recognition
- **Web Audio API** - Audio level visualization
- **Custom React Hooks** - Voice state management

### Real-Time
- **Pusher** - WebSocket-based collaboration
- **SWR** - Data fetching with caching

---

## 🎤 Voice Mode Architecture

The Voice Mode feature is the standout innovation of AnyForm:

```
User Speech → Web Speech API → Text Transcript 
           ↓
Gemini 3 API → Form Structure → React Components
```

### Key Features:
- ✅ **Smart Auto-Stop** - Detects 3 seconds of silence
- ✅ **Real-Time Transcription** - See your words as you speak
- ✅ **Audio Visualization** - 5-bar audio level indicator
- ✅ **Mobile-Optimized** - iOS/Android specific handling
- ✅ **Zero Backend** - Runs entirely client-side

### Mobile Optimization:

**iOS Safari:**
- Single-shot mode with auto-restart
- 300ms delay between restarts
- Explicit permission handling

**Android Chrome:**
- Continuous mode with error recovery
- 150ms restart delay
- Retry logic (up to 5 attempts)

---

## 🤖 Gemini 3 Integration

AnyForm leverages Gemini 3 extensively:

### Text Generation
```typescript
// Natural language → Structured form
const form = await generateForm("I need a contact form with name, email, and message");
```

### Vision API
```typescript
// Image → Form fields (OCR)
const form = await scanForm(imageFile);
```

### Function Calling
```typescript
// Ensures consistent JSON output
const schema = {
  title: "string",
  fields: [{ type: "string", label: "string", required: "boolean" }]
};
```

---

## 📂 Project Structure

```
anyform/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Homepage
│   │   ├── dashboard/         # Dashboard page
│   │   └── api/               # API routes
│   │       ├── ai/            # Gemini integration
│   │       └── forms/         # Form CRUD
│   ├── components/            # React components
│   │   ├── voice/             # Voice Mode components
│   │   │   ├── VoiceMode.tsx
│   │   │   └── VoiceModeLazy.tsx
│   │   └── builder/           # Form builder
│   ├── hooks/                 # Custom React hooks
│   │   └── useVoiceInput.ts   # Voice state management
│   ├── lib/                   # Utilities
│   │   └── speechRecognition.ts # Web Speech API wrapper
│   └── types/                 # TypeScript types
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                    # Static assets
└── package.json
```

---

## 🎨 Design Philosophy

AnyForm features a unique **"Paper Wireframe"** aesthetic:

- ✏️ Hand-drawn style (Patrick Hand font)
- ⚫ Black & white color scheme
- 📏 No shadows, clean 2px borders
- 📐 Consistent 8px spacing grid
- 🎯 Minimal and focused UI

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Deploy to Vercel**

```bash
npm i -g vercel
vercel --prod
```

3. **Set environment variables** in Vercel dashboard

4. **Done!** Your app is live 🎉

### Environment Variables Checklist

Make sure to set these in Vercel:
- ✅ `DATABASE_URL`
- ✅ `NEXTAUTH_URL` (your Vercel URL)
- ✅ `NEXTAUTH_SECRET`
- ✅ `GOOGLE_CLIENT_ID`
- ✅ `GOOGLE_CLIENT_SECRET`
- ✅ `GEMINI_API_KEY`
- ✅ `NEXT_PUBLIC_PUSHER_APP_KEY`
- ✅ `PUSHER_APP_ID`
- ✅ `PUSHER_SECRET`

---

## 📊 Performance

- ⚡ **Voice Activation**: < 500ms
- 🎯 **Transcription Latency**: < 1000ms
- 🚀 **Form Generation**: < 3 seconds
- 📦 **Voice Module Bundle**: ~35KB (lazy-loaded)
- 💯 **Lighthouse Score**: 95+

---

## 🎯 Use Cases

### For Teachers
- Create quizzes with automatic scoring
- Build registration forms for classes
- Collect feedback from students

### For Event Organizers
- Registration forms with custom fields
- RSVP forms with dietary restrictions
- Feedback surveys

### For Businesses
- Contact forms
- Lead generation forms
- Customer feedback surveys
- Job application forms
- And a lot more


---

<div align="center">

**Built with ❤️ and Google Gemini 3**

⭐ Star this repo if you find it helpful!

</div>
