# Form Creation Architecture - Visual Guide

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE                          │
│                   /create (Main Entry)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              FormCreationMethods Component                   │
│                  (Method Selector)                           │
│                                                              │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐        │
│  │ AI   │  │Voice │  │File  │  │JSON  │  │Scan  │        │
│  │Prompt│  │Input │  │Upload│  │Import│  │Doc   │        │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘        │
└─────────────────────────────────────────────────────────────┘
       │           │          │         │          │
       ▼           ▼          ▼         ▼          ▼
┌──────────┐ ┌──────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│  Prompt  │ │  Voice   │ │  File   │ │  JSON   │ │Document │
│  Input   │ │Recording │ │ Upload  │ │ Editor  │ │ Scanner │
│Component │ │Component │ │Component│ │Component│ │Component│
└──────────┘ └──────────┘ └─────────┘ └─────────┘ └─────────┘
       │           │          │         │          │
       └───────────┴──────────┴─────────┴──────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API LAYER                                │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │   /ai/     │  │   /ai/     │  │   /ai/     │           │
│  │ generate   │  │import-file │  │ scan-form  │           │
│  └────────────┘  └────────────┘  └────────────┘           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   PROCESSING LAYER                           │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │            AI Enhancement (Groq/LLaMA)              │    │
│  │  • Field type detection                             │    │
│  │  • Validation rules                                 │    │
│  │  • Smart suggestions                                │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  DATA NORMALIZATION                          │
│                                                              │
│  • Convert all inputs to Field[]                            │
│  • Generate unique IDs                                      │
│  • Apply defaults                                           │
│  • Validate structure                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE (Prisma + PostgreSQL)              │
│                                                              │
│  • Save form metadata                                       │
│  • Store fields                                             │
│  • Link to user                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    FORM BUILDER                              │
│                  /builder?formId={id}                        │
│                                                              │
│  • Further customization                                    │
│  • Drag & drop reordering                                   │
│  • Add conditional logic                                    │
│  • Style configuration                                      │
│  • Multi-step setup                                         │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### 1. AI Prompt Flow

```
User Input
    │
    ▼
"Create a contact form with name and email"
    │
    ▼
POST /api/ai/generate
    │
    ▼
Groq AI Processing
    │
    ▼
{
  title: "Contact Form",
  fields: [
    { label: "Name", type: "text", ... },
    { label: "Email", type: "email", ... }
  ]
}
    │
    ▼
Database Save
    │
    ▼
Redirect to Builder
```

### 2. File Upload Flow

```
CSV/JSON/TXT File
    │
    ▼
File Validation
    │
    ▼
POST /api/ai/import-file
    │
    ├─→ Parse CSV      → Extract fields
    ├─→ Parse JSON     → Extract fields
    └─→ Parse TXT      → Extract fields
    │
    ▼
AI Enhancement (type inference, validation)
    │
    ▼
Normalized Field[]
    │
    ▼
Database Save
    │
    ▼
Redirect to Builder
```

### 3. Document Scanner Flow

```
Image/PDF Upload
    │
    ▼
File Validation
    │
    ▼
POST /api/ai/scan-form
    │
    ▼
OCR Processing (extract text)
    │
    ▼
Extracted Text:
"Name: ___
 Email: ___
 Phone: ___"
    │
    ▼
AI Analysis (identify fields, types)
    │
    ▼
Structured Fields
    │
    ▼
Database Save
    │
    ▼
Redirect to Builder
```

### 4. JSON Import Flow

```
JSON Input
    │
    ▼
Client-side Validation
    │
    ▼
{
  "title": "Form",
  "fields": [...]
}
    │
    ▼
Direct Import (no API call needed)
    │
    ▼
Normalized Field[]
    │
    ▼
POST /api/forms (save)
    │
    ▼
Database Save
    │
    ▼
Redirect to Builder
```

## Component Architecture

```
src/
│
├── app/
│   ├── create/
│   │   └── page.tsx ─────────────┐ Main creation page
│   │                              │ Manages method selection
│   │                              │ Handles form generation
│   │                              │ Saves to database
│   │
│   ├── builder/
│   │   └── page.tsx ─────────────┐ Form customization
│   │                              │ Drag & drop fields
│   │                              │ Advanced settings
│   │
│   └── api/
│       └── ai/
│           ├── generate/
│           │   └── route.ts ─────┐ AI prompt processing
│           │
│           ├── import-file/
│           │   └── route.ts ─────┐ File parsing
│           │                      │ CSV/JSON/TXT support
│           │
│           └── scan-form/
│               └── route.ts ─────┐ OCR processing
│                                  │ Form extraction
│
└── components/
    ├── FormCreationMethods.tsx ──┐ Method selector UI
    │                              │ Visual cards
    │                              │ Navigation
    │
    ├── FileUploadCreator.tsx ────┐ File upload UI
    │                              │ Drag & drop
    │                              │ Format examples
    │
    ├── DocumentScanner.tsx ───────┐ Document scanning UI
    │                              │ Image preview
    │                              │ Processing stages
    │
    ├── JSONImportCreator.tsx ─────┐ JSON editor UI
    │                              │ Validation
    │                              │ Schema docs
    │
    └── VoiceInput.tsx ────────────┐ Voice recording UI
                                   │ Multi-language
                                   │ Transcription
```

## State Management Flow

```
┌───────────────────────────────────────────────────────┐
│              Create Page State                        │
│                                                       │
│  • selectedMethod: CreationMethod | null             │
│  • prompt: string                                    │
│  • loading: boolean                                  │
│                                                       │
│  Methods:                                            │
│  • setSelectedMethod()                               │
│  • handleFormGenerated()                             │
│  • handlePromptSubmit()                              │
│  • handleVoiceGenerate()                             │
└───────────────────────────────────────────────────────┘
            │                        │
            ▼                        ▼
┌─────────────────┐      ┌──────────────────────┐
│ Method          │      │ Individual Component │
│ Components      │      │ State                │
│                 │      │                      │
│ • File select   │      │ • selectedFile       │
│ • JSON input    │      │ • preview            │
│ • Voice status  │      │ • error              │
│ • Scan progress │      │ • success            │
└─────────────────┘      └──────────────────────┘
            │                        │
            └────────┬───────────────┘
                     ▼
         ┌───────────────────────┐
         │   Form Generation     │
         │   Callback            │
         │                       │
         │ onFormGenerated(      │
         │   title: string,      │
         │   fields: Field[]     │
         │ )                     │
         └───────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   API Call            │
         │   POST /api/forms     │
         └───────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   Database Save       │
         └───────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   Router.push()       │
         │   /builder?formId=... │
         └───────────────────────┘
```

## Field Normalization Pipeline

```
Input (varies by method)
    │
    ▼
┌────────────────────────────────────┐
│  Raw Field Data                    │
│  • May be incomplete               │
│  • Different formats               │
│  • Missing properties              │
└────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────┐
│  Type Detection                    │
│  • Infer from label                │
│  • Check for patterns              │
│  • Apply AI suggestions            │
└────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────┐
│  ID Generation                     │
│  • Create unique ID                │
│  • snake_case from label           │
│  • Ensure no duplicates            │
└────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────┐
│  Default Values                    │
│  • required: false                 │
│  • options: []                     │
│  • order: index                    │
│  • conditionalLogic: []            │
└────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────┐
│  Validation                        │
│  • Check required properties       │
│  • Validate field types            │
│  • Ensure options exist            │
└────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────┐
│  Normalized Field                  │
│  {                                 │
│    id: string,                     │
│    label: string,                  │
│    type: FieldType,                │
│    required: boolean,              │
│    options: string[],              │
│    order: number,                  │
│    conditionalLogic: []            │
│  }                                 │
└────────────────────────────────────┘
```

## Error Handling Flow

```
User Action
    │
    ▼
Try Block
    │
    ├─→ Success → Continue
    │
    └─→ Error
         │
         ▼
    ┌─────────────────────┐
    │  Error Catch        │
    │  • Parse error      │
    │  • Log to console   │
    │  • Set error state  │
    └─────────────────────┘
         │
         ▼
    ┌─────────────────────┐
    │  User Feedback      │
    │  • Error message    │
    │  • Suggestions      │
    │  • Retry option     │
    └─────────────────────┘
         │
         ▼
    ┌─────────────────────┐
    │  Recovery           │
    │  • Preserve input   │
    │  • Allow retry      │
    │  • Suggest fix      │
    └─────────────────────┘
```

## Integration Points

```
┌────────────────────────────────────────────────────┐
│             External Integrations                  │
│                                                    │
│  ┌──────────────┐  ┌──────────────┐             │
│  │  Groq AI     │  │  Web Speech  │             │
│  │  (LLaMA)     │  │  API         │             │
│  │              │  │              │             │
│  │  • Generate  │  │  • Voice     │             │
│  │  • Enhance   │  │  • Transcribe│             │
│  │  • Analyze   │  │  • Languages │             │
│  └──────────────┘  └──────────────┘             │
│                                                    │
│  ┌──────────────┐  ┌──────────────┐             │
│  │  Future:     │  │  Future:     │             │
│  │  OCR Service │  │  File Parser │             │
│  │              │  │  (xlsx)      │             │
│  │  • Vision AI │  │  • Excel     │             │
│  │  • Textract  │  │  • Multi-tab │             │
│  └──────────────┘  └──────────────┘             │
└────────────────────────────────────────────────────┘
```

## Performance Optimization

```
┌───────────────────────────────────────┐
│  Client-Side Optimizations            │
│  • Lazy load components               │
│  • Debounce input handlers            │
│  • Show loading states                │
│  • Cache validation results           │
└───────────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────┐
│  Server-Side Optimizations            │
│  • Stream responses                   │
│  • Parallel processing                │
│  • Cache AI responses                 │
│  • Batch database ops                 │
└───────────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────┐
│  Database Optimizations               │
│  • Indexed queries                    │
│  • Connection pooling                 │
│  • Prepared statements                │
│  • Transaction batching               │
└───────────────────────────────────────┘
```

## Security Layers

```
┌────────────────────────────────────────┐
│  Client-Side Validation                │
│  • File type check                     │
│  • Size limits                         │
│  • JSON syntax                         │
└────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────┐
│  Server-Side Validation                │
│  • Re-validate all inputs              │
│  • Sanitize content                    │
│  • Rate limiting                       │
└────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────┐
│  Database Layer                        │
│  • Parameterized queries               │
│  • User authentication                 │
│  • Authorization checks                │
└────────────────────────────────────────┘
```

## Future Architecture Enhancements

```
Current: Single Server
    │
    ▼
Future: Microservices

┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   API       │    │   OCR       │    │   AI        │
│   Gateway   │───→│   Service   │    │   Service   │
└─────────────┘    └─────────────┘    └─────────────┘
      │                    │                  │
      └────────────────────┴──────────────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │   Message Queue │
                 │   (Redis/RabbitMQ)│
                 └─────────────────┘
```

---

**Legend:**
- `┌─┐` = Component/Service
- `│` = Data flow
- `▼` = Direction
- `→` = Process flow
- `├─→` = Branch
