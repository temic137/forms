# Implementation Plan

- [x] 1. Database schema and type system foundation

  - [x] 1.1 Update Prisma schema with File and Template models

    - Add File model with fields: id, submissionId, fieldId, filename, originalName, size, mimeType, path, uploadedAt
    - Add Template model with fields: id, name, category, description, config, createdAt
    - Add optional JSON fields to Form model: multiStepConfig, styling, notifications, translations, templateId
    - Run migration to apply schema changes
    - _Requirements: 2.5, 12.2, 13.4, 15.3_

  - [x] 1.2 Create comprehensive TypeScript type definitions

    - Create src/types/form.ts with Field, ValidationRule, ConditionalRule, FileUploadConfig interfaces
    - Add MultiStepConfig, FormStep, FormStyling, NotificationConfig, FormTranslation interfaces
    - Add OptimizationSuggestion, FileMetadata, ErrorDisplay types
    - Export all types for use across the application
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 13.1, 15.1_

  - [x] 1.3 Create validation utilities module

    - Create src/lib/validation.ts with validation rule evaluation functions
    - Implement validateField function that processes ValidationRule array
    - Add regex pattern validation, min/max length, min/max value validators
    - Create custom error message formatter
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 2. File upload system implementation

  - [x] 2.1 Create file upload API endpoint

    - Create src/app/api/uploads/route.ts for POST requests
    - Implement file validation (type, size checking)
    - Generate unique filenames and store in public/uploads/{formId}/{submissionId}/
    - Return FileUploadResponse with file metadata and temporary URL
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 2.2 Build FileUpload component for form renderer

    - Create src/components/FileUpload.tsx component
    - Implement drag-and-drop file selection
    - Add file preview with filename and size display
    - Show upload progress indicator
    - Add remove file functionality
    - Display validation errors for invalid files
    - _Requirements: 2.3, 2.4_

  - [x] 2.3 Integrate file upload in form submission flow

    - Update src/app/api/forms/[id]/submit/route.ts to handle file uploads
    - Store file metadata in File table linked to submission
    - Include file references in submission response
    - _Requirements: 2.5_

- [x] 3. Conditional logic system

  - [x] 3.1 Create conditional logic evaluation engine

    - Create src/lib/conditionalLogic.ts utility module
    - Implement evaluateCondition function for single condition (equals, notEquals, contains, greaterThan, lessThan, isEmpty, isNotEmpty)
    - Implement evaluateConditionalRules function handling AND/OR logic operators
    - Add getVisibleFields function that returns array of visible field IDs based on current form values
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 3.2 Build ConditionalLogicEditor component for builder

    - Create src/components/builder/ConditionalLogicEditor.tsx
    - Add UI to select source field from dropdown
    - Add operator selector (equals, not equals, contains, greater than, less than, isEmpty, isNotEmpty)
    - Add value input field
    - Support multiple conditions with AND/OR toggle
    - Add remove condition button
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 3.3 Integrate conditional logic in FormRenderer

    - Update src/app/f/[id]/renderer.tsx to use conditional logic engine
    - Wrap fields in ConditionalWrapper component that evaluates visibility
    - Clear hidden field values when fields become hidden
    - Re-evaluate conditions on every form value change
    - _Requirements: 1.4, 1.5_

- [x] 4. Multi-step form system

  - [x] 4.1 Create MultiStepEditor component for builder

    - Create src/components/builder/MultiStepEditor.tsx
    - Add enable/disable multi-step toggle
    - Display list of steps with add/remove/reorder functionality
    - Allow assigning fields to steps via drag-and-drop or dropdown
    - Show step names and field counts
    - _Requirements: 3.1, 3.2_

  - [x] 4.2 Build MultiStepRenderer component

    - Create src/components/MultiStepRenderer.tsx
    - Implement step navigation state management (current step index)
    - Add ProgressIndicator component showing step X of Y
    - Render only current step's fields
    - Add Previous/Next navigation buttons
    - _Requirements: 3.3, 3.4_

  - [x] 4.3 Implement step validation and data persistence

    - Validate all fields in current step before allowing Next navigation
    - Store all form data in state across step navigation
    - Highlight validation errors and prevent navigation if invalid
    - Allow back navigation without validation
    - _Requirements: 3.4, 3.5_

- [x] 5. Enhanced field configuration in builder

  - [x] 5.1 Add placeholder and help text inputs to field editor

    - Update src/app/builder/page.tsx field editor section
    - Add placeholder text input field below field label
    - Add help text textarea below field type selector
    - Update Field type to include placeholder and helpText properties
    - _Requirements: 5.1, 5.2_

  - [x] 5.2 Create ValidationEditor component

    - Create src/components/builder/ValidationEditor.tsx
    - Add validation rule type selector (minLength, maxLength, pattern, min, max)
    - Add value input for each rule type
    - Add custom error message input
    - Display list of active validation rules with remove option
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 5.3 Update FormRenderer to display placeholder and help text

    - Modify field rendering in src/app/f/[id]/renderer.tsx
    - Pass placeholder prop to input elements
    - Render help text below field label in muted styling
    - _Requirements: 5.3, 5.4, 5.5_

  - [x] 5.4 Integrate custom validation in FormRenderer

    - Update FormRenderer to use validation utilities
    - Display custom error messages from ValidationRule
    - Show validation errors in real-time on blur
    - Prevent submission if validation fails
    - _Requirements: 4.4, 4.5_

- [x] 6. Drag-and-drop field reordering

  - [x] 6.1 Implement drag-and-drop functionality in builder

    - Install @dnd-kit/core and @dnd-kit/sortable libraries
    - Wrap field list in DndContext and SortableContext
    - Make each field item draggable with useSortable hook
    - Add drag handle icon to each field
    - Update field order state on drag end
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 6.2 Maintain conditional logic and multi-step integrity during reorder

    - Preserve conditional logic references after reordering
    - Update step field assignments when fields are reordered
    - Ensure preview updates immediately after reorder
    - _Requirements: 10.4, 10.5_

- [x] 7. Field duplication feature

  - [x] 7.1 Add duplicate button to field editor

    - Add duplicate icon button next to remove button in field item
    - Implement duplicateField function that clones field configuration
    - Append " (copy)" to duplicated field label
    - Generate new unique field ID for duplicated field
    - Insert duplicated field immediately after original
    - _Requirements: 11.1, 11.2, 11.3, 11.5_

  - [x] 7.2 Handle duplication of fields with conditional logic

    - Copy conditional rules to duplicated field
    - Update conditional rule IDs to be unique
    - Preserve validation rules and other configurations
    - _Requirements: 11.4_

- [x] 8. Form styling system

  - [x] 8.1 Create StyleEditor component

    - Create src/components/builder/StyleEditor.tsx
    - Add color pickers for primaryColor, backgroundColor, buttonColor, buttonTextColor
    - Add font family selector (system, sans, serif, mono)
    - Add button radius slider (0-20px)
    - Display live preview of styling changes
    - _Requirements: 13.1, 13.2, 13.4_

  - [x] 8.2 Apply custom styling in FormRenderer

    - Update src/app/f/[id]/renderer.tsx to accept styling prop
    - Generate CSS custom properties from FormStyling object
    - Apply colors to form elements using CSS variables
    - Apply font family to form container
    - Apply button styling (color, background, radius)
    - _Requirements: 13.3, 13.5_

- [x] 9. Responsive preview modes

  - [x] 9.1 Create DevicePreviewToggle component

    - Create src/components/builder/DevicePreviewToggle.tsx
    - Add three toggle buttons: Desktop, Tablet, Mobile
    - Manage active device state
    - Style active button differently
    - _Requirements: 14.1_

  - [x] 9.2 Implement responsive preview container

    - Update preview panel in src/app/builder/page.tsx
    - Apply width constraints based on selected device (Desktop: 100%, Tablet: 768px, Mobile: 375px)
    - Add device frame styling for visual context
    - Ensure all form functionality works in all preview modes
    - _Requirements: 14.2, 14.3, 14.4, 14.5_

- [x] 10. Template system

  - [x] 10.1 Create template seed data

    - Create src/lib/templates.ts with pre-built template configurations
    - Define Contact Form template (name, email, message fields)
    - Define Survey template (rating, multiple choice, open-ended fields)
    - Define Registration template (personal info, password, terms acceptance)
    - Define Feedback template (rating, categories, comments)
    - Define Order Form template (product selection, quantity, shipping info)
    - Define Event RSVP template (attendance, guest count, dietary restrictions)
    - _Requirements: 12.1, 12.2, 12.3_

  - [x] 10.2 Build TemplateSelector component

    - Create src/components/builder/TemplateSelector.tsx
    - Display template cards with name, description, and preview icon
    - Add "Start from Template" button in builder
    - Show template modal on button click
    - Apply selected template to form on selection
    - _Requirements: 12.1, 12.2_

  - [x] 10.3 Implement template application logic

    - Create applyTemplate function that populates form with template config
    - Preserve ability to customize all fields after template application
    - Apply multi-step structure if template includes it
    - _Requirements: 12.4, 12.5_

- [x] 11. AI validation suggestions

  - [x] 11.1 Create AI validation suggestion API endpoint

    - Create src/app/api/ai/suggest-validation/route.ts
    - Accept field label and type as input
    - Use Groq to analyze field and suggest appropriate validation rules
    - Return array of ValidationRule suggestions with messages
    - Handle email, phone, age, date, URL field types
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 11.2 Integrate validation suggestions in ValidationEditor

    - Add "✨ AI Suggest" button in ValidationEditor component
    - Call AI validation API when button clicked
    - Display suggestions as clickable chips
    - Apply selected suggestion to validation rules
    - Show loading state during AI request
    - _Requirements: 6.4, 6.5_

- [x] 12. Form translation system

  - [x] 12.1 Create translation API endpoint

    - Create src/app/api/ai/translate/route.ts
    - Accept form config and target language as input
    - Use Groq to translate title, field labels, placeholders, help text, button labels
    - Return FormTranslation object with all translated strings
    - Support languages: English, Spanish, French, German, Chinese, Japanese
    - _Requirements: 7.1, 7.2_

  - [x] 12.2 Build TranslationManager component

    - Create src/components/builder/TranslationManager.tsx
    - Display list of supported languages with add button
    - Show original and translated text side-by-side for review
    - Allow manual editing of translations
    - Save translations to form config
    - _Requirements: 7.2, 7.3, 7.4_

  - [x] 12.3 Implement language detection and switching in FormRenderer

    - Detect browser language using navigator.language
    - Load appropriate translation if available
    - Add language selector dropdown if multiple translations exist
    - Fall back to original language if translation not available
    - _Requirements: 7.5_

- [x] 13. AI-powered auto-complete

  - [x] 13.1 Create auto-complete API endpoint

    - Create src/app/api/ai/autocomplete/route.ts
    - Accept field ID, current input, and form context
    - Use Groq to generate contextually relevant suggestions
    - Return up to 5 suggestions within 500ms timeout
    - Cache suggestions for identical requests
    - _Requirements: 8.2, 8.3_

  - [x] 13.2 Build AutoCompleteInput component

    - Create src/components/AutoCompleteInput.tsx
    - Debounce input changes (300ms)
    - Call auto-complete API after 2 characters entered
    - Display suggestions in dropdown below input
    - Handle keyboard navigation (arrow keys, enter, escape)
    - Populate field with selected suggestion
    - _Requirements: 8.2, 8.4, 8.5_

  - [x] 13.3 Add auto-complete configuration in builder

    - Add "Enable Auto-complete" checkbox in field editor
    - Add suggestion type selector (common values, contextual, custom list)
    - Store auto-complete config in field configuration
    - _Requirements: 8.1_

- [x] 14. Form optimization analyzer

  - [x] 14.1 Create optimization analysis API endpoint

    - Create src/app/api/ai/optimize/route.ts
    - Accept form configuration as input
    - Analyze field count, required fields ratio, form length, field types
    - Use Groq to generate optimization suggestions
    - Return array of OptimizationSuggestion objects with priority and category
    - _Requirements: 9.1, 9.3, 9.4_

  - [x] 14.2 Build OptimizationPanel component

    - Create src/components/builder/OptimizationPanel.tsx
    - Add "Analyze Form" button in builder
    - Display suggestions grouped by priority (high, medium, low)
    - Show suggestion title, description, and category
    - Add "Apply" button for auto-applicable suggestions
    - _Requirements: 9.2, 9.5_

  - [x] 14.3 Implement auto-apply optimization logic

    - Create applyOptimization function that modifies form config
    - Handle multi-step suggestion (break form into steps)
    - Handle required fields suggestion (mark some as optional)
    - Update form state and preview after applying optimization
    - _Requirements: 9.5_

- [x] 15. Email notification system with Resend

  - [x] 15.1 Set up Resend integration

    - Install resend package
    - Create src/lib/resend.ts with Resend client initialization
    - Add RESEND_API_KEY to environment variables
    - Create email template using React Email or HTML
    - _Requirements: 15.3_

  - [x] 15.2 Build NotificationSettings component

    - Create src/components/builder/NotificationSettings.tsx
    - Add enable notifications checkbox
    - Add email recipient input (support multiple emails)
    - Add custom message textarea
    - Add "Include submission data" checkbox
    - Save notification config to form
    - _Requirements: 15.1, 15.2_

  - [x] 15.3 Implement notification sending in submission flow

    - Update src/app/api/forms/[id]/submit/route.ts
    - Check if notifications are enabled for form
    - Format submission data for email
    - Send email via Resend API within 30 seconds of submission
    - Include form title, timestamp, and all field values
    - _Requirements: 15.3, 15.4_

  - [x] 15.4 Add file download links to notification emails

    - Generate secure, time-limited URLs for uploaded files (7-day expiration)
    - Include file download links in notification email
    - Format email with clear sections for each field
    - _Requirements: 15.5_

- [x] 16. Integration and polish


  - [x] 16.1 Update form builder page with all new features

    - Integrate all new components into src/app/builder/page.tsx
    - Organize features into collapsible sections
    - Add feature discovery tooltips
    - Ensure all features work together seamlessly
    - _Requirements: All_

  - [x] 16.2 Update FormRenderer with all enhancements

    - Integrate MultiStepRenderer, ConditionalWrapper, FileUpload, AutoCompleteInput
    - Apply custom styling from form config
    - Handle translations and language switching
    - Ensure accessibility compliance (ARIA labels, keyboard navigation)
    - _Requirements: All_

  - [x] 16.3 Add error boundaries and loading states

    - Wrap components in error boundaries
    - Add loading skeletons for async operations
    - Implement retry logic for failed AI requests
    - Add user-friendly error messages
    - _Requirements: All_

  - [x] 16.4 Performance optimization

    - Memoize expensive calculations (conditional logic, validation)
    - Debounce AI requests
    - Lazy load AI features
    - Optimize re-renders with React.memo
    - Add request caching for AI responses
    - _Requirements: All_
