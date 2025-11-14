# Design Document

## Overview

This design document outlines the architecture and implementation approach for enhancing the existing Next.js form builder with advanced features. The system will be extended to support conditional logic, file uploads, multi-step forms, enhanced validation, AI-powered capabilities, and improved UX features while maintaining the current clean architecture and minimalist design aesthetic.

The design follows a modular approach, extending existing components and adding new services without disrupting current functionality. All new features will integrate seamlessly with the existing Prisma database, Groq AI service, and React Hook Form validation.

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (React)                     │
├─────────────────────────────────────────────────────────────┤
│  Form Builder UI  │  Form Renderer  │  Preview Components   │
│  - Field Editor   │  - Multi-Step   │  - Device Previews    │
│  - Conditional    │  - Conditional  │  - Style Preview      │
│  - Styling        │  - File Upload  │                       │
│  - Templates      │  - Validation   │                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│  /api/forms/*     │  /api/ai/*      │  /api/uploads/*       │
│  - CRUD           │  - Validation   │  - File handling      │
│  - Submit         │  - Translation  │  - Storage            │
│  - Notifications  │  - Optimization │                       │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌──────────────────────────┐  ┌──────────────────────┐
│   Database (SQLite)      │  │  External Services   │
│   - Forms                │  │  - Groq AI           │
│   - Submissions          │  │  - Resend Email      │
│   - Files (metadata)     │  │  - File Storage      │
└──────────────────────────┘  └──────────────────────┘
```

### Data Flow

1. **Form Creation Flow**: Builder UI → API → Database → Response
2. **Form Rendering Flow**: Database → API → Renderer → User
3. **Submission Flow**: User Input → Validation → API → Database → Notifications
4. **AI Enhancement Flow**: User Request → API → Groq → Processing → Response
5. **File Upload Flow**: User File → API → Storage → Metadata → Database

## Components and Interfaces

### 1. Enhanced Field Type System

**Extended Field Interface:**

```typescript
interface Field {
  // Existing properties
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  
  // New properties
  placeholder?: string;
  helpText?: string;
  validation?: ValidationRule[];
  conditionalLogic?: ConditionalRule[];
  stepId?: string; // For multi-step forms
  order: number;
  
  // File upload specific
  fileConfig?: FileUploadConfig;
  
  // Styling
  customStyles?: FieldStyles;
}

type FieldType = 
  | "text" 
  | "email" 
  | "textarea" 
  | "number" 
  | "date" 
  | "select" 
  | "radio" 
  | "checkbox"
  | "file"; // New type

interface ValidationRule {
  type: "minLength" | "maxLength" | "pattern" | "min" | "max" | "custom";
  value: string | number;
  message: string;
}

interface ConditionalRule {
  id: string;
  sourceFieldId: string;
  operator: "equals" | "notEquals" | "contains" | "greaterThan" | "lessThan" | "isEmpty" | "isNotEmpty";
  value: string | number;
  action: "show" | "hide";
  logicOperator?: "AND" | "OR"; // For multiple conditions
}

interface FileUploadConfig {
  acceptedTypes: "images" | "documents" | "all";
  maxSizeMB: number;
  multiple: boolean;
}

interface FieldStyles {
  labelColor?: string;
  inputBgColor?: string;
  borderColor?: string;
}
```

### 2. Multi-Step Form Structure

**Step Interface:**

```typescript
interface FormStep {
  id: string;
  title: string;
  description?: string;
  order: number;
  fieldIds: string[];
}

interface MultiStepConfig {
  enabled: boolean;
  steps: FormStep[];
  showProgressBar: boolean;
  allowBackNavigation: boolean;
}
```

### 3. Form Configuration Extension

**Enhanced Form Schema:**

```typescript
interface FormConfig {
  // Existing
  id: string;
  title: string;
  fields: Field[];
  
  // New
  multiStep?: MultiStepConfig;
  styling?: FormStyling;
  notifications?: NotificationConfig;
  translations?: Record<string, FormTranslation>;
  templateId?: string;
  aiOptimizations?: OptimizationSuggestion[];
}

interface FormStyling {
  primaryColor: string;
  backgroundColor: string;
  buttonColor: string;
  buttonTextColor: string;
  fontFamily: "system" | "sans" | "serif" | "mono";
  buttonRadius: number;
}

interface NotificationConfig {
  enabled: boolean;
  recipients: string[];
  includeSubmissionData: boolean;
  customMessage?: string;
}

interface FormTranslation {
  title: string;
  fields: Record<string, {
    label: string;
    placeholder?: string;
    helpText?: string;
  }>;
  submitButton: string;
}
```

### 4. Component Architecture

**Builder Components:**

```
FormBuilder (page.tsx)
├── FormMetaEditor
│   ├── TitleInput
│   ├── TemplateSelector
│   └── StyleEditor
├── FieldListEditor
│   ├── FieldItem (draggable)
│   │   ├── FieldBasicConfig
│   │   ├── ValidationEditor
│   │   ├── ConditionalLogicEditor
│   │   └── FieldActions (duplicate, delete)
│   └── AddFieldButton
├── MultiStepEditor (conditional)
│   ├── StepList
│   └── StepFieldAssignment
├── PreviewPanel
│   ├── DeviceToggle
│   └── FormRenderer (preview mode)
└── PublishPanel
    ├── NotificationSettings
    ├── TranslationManager
    └── PublishButton
```

**Renderer Components:**

```
FormRenderer
├── MultiStepContainer (conditional)
│   ├── ProgressIndicator
│   ├── StepContent
│   └── NavigationButtons
├── FieldRenderer
│   ├── ConditionalWrapper
│   ├── FieldInput (by type)
│   │   ├── TextInput
│   │   ├── FileUpload
│   │   ├── SelectInput
│   │   └── ...
│   ├── ValidationDisplay
│   └── HelpText
└── SubmitButton
```

### 5. AI Service Extensions

**AI Service Interface:**

```typescript
interface AIService {
  // Existing
  generateForm(brief: string): Promise<FormConfig>;
  generateOptions(label: string, context: string): Promise<string[]>;
  
  // New methods
  suggestValidation(field: Field): Promise<ValidationRule[]>;
  translateForm(form: FormConfig, targetLang: string): Promise<FormTranslation>;
  generateAutoComplete(fieldId: string, input: string, context: FormConfig): Promise<string[]>;
  analyzeFormOptimization(form: FormConfig): Promise<OptimizationSuggestion[]>;
}

interface OptimizationSuggestion {
  id: string;
  priority: "high" | "medium" | "low";
  category: "length" | "required-fields" | "organization" | "validation" | "ux";
  title: string;
  description: string;
  autoApplicable: boolean;
  changes?: Partial<FormConfig>;
}
```

### 6. File Upload System

**File Storage Strategy:**

- Use Next.js API routes for upload handling
- Store files in `/public/uploads/{formId}/{submissionId}/` directory
- Store metadata in database (filename, size, type, path)
- Generate secure, time-limited access URLs
- Implement file cleanup for old submissions (7-day retention)

**Upload API Interface:**

```typescript
interface FileUploadResponse {
  fileId: string;
  filename: string;
  size: number;
  type: string;
  url: string;
  expiresAt: Date;
}

interface FileMetadata {
  id: string;
  submissionId: string;
  fieldId: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  path: string;
  uploadedAt: Date;
}
```

## Data Models

### Database Schema Extensions

**Updated Prisma Schema:**

```prisma
model Form {
  id              String        @id @default(cuid())
  title           String
  fieldsJson      Json          // Extended Field[] with new properties
  multiStepConfig Json?         // MultiStepConfig
  styling         Json?         // FormStyling
  notifications   Json?         // NotificationConfig
  translations    Json?         // Record<string, FormTranslation>
  templateId      String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  submissions     Submission[]
}

model Submission {
  id          String    @id @default(cuid())
  formId      String
  answersJson Json
  files       File[]
  createdAt   DateTime  @default(now())
  form        Form      @relation(fields: [formId], references: [id], onDelete: Cascade)
}

model File {
  id           String     @id @default(cuid())
  submissionId String
  fieldId      String
  filename     String
  originalName String
  size         Int
  mimeType     String
  path         String
  uploadedAt   DateTime   @default(now())
  submission   Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
}

model Template {
  id          String   @id @default(cuid())
  name        String
  category    String
  description String
  config      Json     // FormConfig
  createdAt   DateTime @default(now())
}
```

### State Management

**Client-Side State (React State):**

- Form builder state: Current form configuration
- Preview state: Device mode, current step
- UI state: Loading, errors, modals
- Drag-and-drop state: Active drag, drop zones

**Server-Side State (Database):**

- Persistent form configurations
- Submission data
- File metadata
- Templates

## Error Handling

### Validation Errors

**Client-Side Validation:**
- Real-time field validation using react-hook-form
- Custom validation rules executed on blur/change
- Conditional logic validation (hidden fields cleared)
- File upload validation (size, type)

**Server-Side Validation:**
- Schema validation using Zod
- File upload security checks
- Rate limiting for AI requests
- Database constraint validation

### Error Display Strategy

```typescript
interface ErrorDisplay {
  field: string;
  message: string;
  type: "validation" | "server" | "network";
}

// Error display locations:
// 1. Inline below field (validation errors)
// 2. Toast notification (server/network errors)
// 3. Modal dialog (critical errors)
```

### Error Recovery

- Auto-save form builder state to localStorage
- Retry logic for AI service calls (max 3 attempts)
- Graceful degradation for AI features (fallback to manual)
- File upload resume capability

## Testing Strategy

### Unit Testing

**Components to Test:**
- Field validation logic
- Conditional logic evaluation
- Multi-step navigation
- File upload validation
- AI response parsing

**Testing Framework:** Jest + React Testing Library

**Example Test Cases:**
```typescript
describe("ConditionalLogic", () => {
  test("hides field when condition is met");
  test("shows field when condition is not met");
  test("handles multiple AND conditions");
  test("handles multiple OR conditions");
  test("clears hidden field values");
});

describe("FileUpload", () => {
  test("rejects files exceeding size limit");
  test("rejects invalid file types");
  test("displays upload progress");
  test("allows file removal");
});

describe("MultiStepForm", () => {
  test("validates current step before proceeding");
  test("preserves data across steps");
  test("displays correct progress");
  test("allows back navigation");
});
```

### Integration Testing

**API Endpoint Tests:**
- Form CRUD operations
- Submission handling with files
- AI service integration
- Email notification delivery

**Test Scenarios:**
1. Create form with all feature types
2. Submit form with file uploads
3. Trigger conditional logic in renderer
4. Navigate multi-step form
5. Receive email notification

### End-to-End Testing

**User Flows to Test:**
1. Create form from template → customize → publish → submit
2. Build form with conditional logic → test in preview → verify behavior
3. Upload files → submit → verify storage and notification
4. Use AI features → apply suggestions → verify results
5. Translate form → switch language → verify translations

**Testing Tools:** Playwright or Cypress

## Implementation Phases

### Phase 1: Core Infrastructure (Foundation)
- Extend database schema with new models
- Update Field interface and types
- Implement file upload API and storage
- Add validation rule system

### Phase 2: Builder Enhancements (UX)
- Drag-and-drop field reordering
- Field duplication
- Validation editor UI
- Placeholder and help text inputs
- Custom styling editor

### Phase 3: Advanced Features (Conditional & Multi-Step)
- Conditional logic editor
- Conditional logic evaluation engine
- Multi-step form editor
- Multi-step renderer with navigation
- Progress indicator

### Phase 4: AI Enhancements
- Validation suggestion API
- Form translation API
- Auto-complete API
- Form optimization analyzer
- AI suggestion UI components

### Phase 5: Templates & Polish
- Template system and pre-built templates
- Responsive preview modes
- Email notification integration (Resend)
- Performance optimization
- Accessibility improvements

## Technical Considerations

### Performance Optimization

**Client-Side:**
- Lazy load AI features
- Debounce auto-complete requests (300ms)
- Virtualize long field lists (>20 fields)
- Memoize conditional logic calculations
- Optimize re-renders with React.memo

**Server-Side:**
- Cache AI responses (5-minute TTL)
- Implement request rate limiting
- Optimize database queries with indexes
- Use streaming for large file uploads
- Background job for email notifications

### Security

**File Upload Security:**
- Validate file types on server
- Scan for malicious content
- Limit file sizes (10MB max)
- Generate unique filenames
- Store outside public directory initially
- Implement access control for file URLs

**API Security:**
- CSRF protection
- Rate limiting (100 req/min per IP)
- Input sanitization
- SQL injection prevention (Prisma ORM)
- XSS prevention (React escaping)

**Data Privacy:**
- No PII in AI requests
- Secure file storage
- Time-limited file access URLs
- GDPR-compliant data retention

### Accessibility

**WCAG 2.1 AA Compliance:**
- Keyboard navigation for all features
- Screen reader support (ARIA labels)
- Focus management in multi-step forms
- Color contrast ratios (4.5:1 minimum)
- Error announcements for screen readers
- Skip links for long forms

**Implementation:**
- Use semantic HTML
- Add ARIA attributes where needed
- Test with screen readers (NVDA, JAWS)
- Keyboard-only navigation testing

### Browser Compatibility

**Target Support:**
- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile browsers (iOS Safari, Chrome Android)

**Polyfills Needed:**
- File API for older browsers
- Drag-and-drop API fallback
- CSS custom properties fallback

### Scalability Considerations

**Current Scale (MVP):**
- 100 forms per user
- 1000 submissions per form
- 10MB file uploads
- 100 AI requests per day

**Future Scale:**
- Horizontal scaling with load balancer
- Database migration to PostgreSQL
- CDN for file storage (S3/Cloudflare)
- Redis cache for AI responses
- Queue system for email notifications (Bull/BullMQ)

## Design Decisions & Rationale

### 1. Why extend JSON fields instead of normalized tables?

**Decision:** Store field configurations, styling, and translations in JSON columns.

**Rationale:**
- Flexible schema for evolving features
- Simpler queries for form retrieval
- Better performance for read-heavy operations
- Easier to version and migrate
- Current SQLite database supports JSON operations

**Trade-off:** Harder to query individual field properties, but acceptable for this use case.

### 2. Why client-side conditional logic evaluation?

**Decision:** Evaluate conditional logic in the Form Renderer component.

**Rationale:**
- Immediate user feedback without server round-trips
- Reduced server load
- Better user experience
- Simpler implementation

**Trade-off:** Logic duplicated between builder preview and renderer, but manageable with shared utility functions.

### 3. Why local file storage instead of cloud?

**Decision:** Store uploaded files in local `/public/uploads/` directory for MVP.

**Rationale:**
- Simpler implementation
- No external dependencies
- Lower cost for MVP
- Easier local development

**Trade-off:** Not scalable for production, but acceptable for MVP. Migration path to S3/Cloudflare R2 documented.

### 4. Why Resend for email notifications?

**Decision:** Use Resend API for email delivery.

**Rationale:**
- Modern, developer-friendly API
- Good deliverability
- Generous free tier
- React email template support
- Simple integration

**Alternative considered:** SendGrid, but Resend has better DX.

### 5. Why Groq for AI features?

**Decision:** Continue using Groq SDK (already in project).

**Rationale:**
- Already integrated
- Fast inference
- Cost-effective
- Good model selection (Llama 3.1)

**Note:** Ensure proper error handling and fallbacks for AI features.

### 6. Why react-hook-form for validation?

**Decision:** Extend existing react-hook-form usage with custom validation.

**Rationale:**
- Already in use
- Excellent performance
- Built-in validation support
- Easy integration with custom rules
- Good TypeScript support

### 7. Why single-page builder instead of wizard?

**Decision:** Keep all builder features on one page with collapsible sections.

**Rationale:**
- Faster workflow for power users
- Better overview of form structure
- Consistent with current design
- Easier to implement drag-and-drop

**Trade-off:** May be overwhelming for new users, but can add onboarding tooltips.

## Migration Strategy

### Database Migration

```typescript
// Migration steps:
// 1. Add new columns to Form table
// 2. Add File table
// 3. Add Template table
// 4. Migrate existing forms to new schema
// 5. Add indexes for performance

// Example migration:
prisma migrate dev --name add_advanced_features
```

### Backward Compatibility

- Existing forms without new features continue to work
- New fields have sensible defaults
- Graceful degradation for missing features
- Version field in form config for future migrations

## Monitoring & Analytics

### Metrics to Track

**Usage Metrics:**
- Forms created per day
- Submissions per form
- Feature adoption rates (conditional logic, multi-step, etc.)
- AI feature usage
- Template usage

**Performance Metrics:**
- Page load time
- API response times
- AI request latency
- File upload speed
- Error rates

**Business Metrics:**
- Form completion rates
- Abandonment points
- Average form length
- Popular templates

### Implementation

- Use Next.js built-in analytics
- Add custom event tracking
- Log AI request metrics
- Monitor error rates with error boundaries
- Track performance with Web Vitals

## Documentation Requirements

### Developer Documentation

- API endpoint documentation
- Component prop interfaces
- Database schema documentation
- AI service integration guide
- Testing guide

### User Documentation

- Feature tutorials
- Template guide
- Best practices for form design
- Conditional logic examples
- Troubleshooting guide

## Future Enhancements (Out of Scope)

- Webhook integrations
- Payment processing
- Advanced analytics dashboard
- Form versioning and rollback
- Collaboration features (multi-user editing)
- Custom domain support
- White-label options
- API for programmatic form creation
- Zapier integration
- Advanced logic (calculations, scoring)
