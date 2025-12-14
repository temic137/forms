# Multiple Form Creation Methods - Complete Guide

## Overview

We've expanded the form creation capabilities beyond just AI prompts. Now you can create forms using **5 different methods**, each designed for different use cases and preferences.

## Available Creation Methods

### 1. 🤖 AI Prompt (Original Method)
**Best for:** Quick form creation with natural language
- Describe your form in plain text
- AI automatically determines field types
- Smart field detection and validation
- Instant generation

**Example:**
```
Create a registration form with email, password, full name, and age
```

### 2. 🎤 Voice Input
**Best for:** Hands-free form creation, accessibility
- Speak your form requirements
- Multi-language support (50+ languages)
- Real-time transcription
- Edit transcript before generation
- Auto-submit after silence detection

**Features:**
- Browser-based speech recognition
- No external API needed
- Session restoration
- Privacy-focused (local processing)

### 3. 📁 File Upload
**Best for:** Bulk import, migrating from spreadsheets
- Upload CSV, JSON, TXT, or Excel files
- AI-enhanced field detection
- Automatic type inference
- Supports field validation rules

**Supported Formats:**

#### CSV Format
```csv
label,type,required,options
Full Name,text,true,
Email Address,email,true,
Country,select,true,"USA,UK,Canada,Australia"
Age,number,false,
```

#### JSON Format
```json
{
  "title": "Contact Form",
  "fields": [
    {
      "label": "Full Name",
      "type": "text",
      "required": true
    },
    {
      "label": "Email",
      "type": "email",
      "required": true
    }
  ]
}
```

#### Text Format (Simple)
```
Full Name
Email Address
Phone Number
Message
```

### 4. 📋 JSON Import
**Best for:** Developers, API integration, precise control
- Direct JSON structure import
- Full control over field properties
- Perfect for migrations
- API-friendly format

**Complete JSON Schema:**
```json
{
  "title": "Form Title (optional)",
  "fields": [
    {
      "id": "unique_field_id",           // Optional, auto-generated if missing
      "label": "Field Label",            // Required
      "type": "text",                    // Optional, default: "text"
      "required": true,                  // Optional, default: false
      "placeholder": "Hint text",        // Optional
      "options": ["Option 1", "Option 2"], // Required for select/radio/checkbox
      "validation": {                    // Optional
        "min": 0,
        "max": 100,
        "pattern": "regex",
        "minLength": 5,
        "maxLength": 50
      }
    }
  ]
}
```

**Valid Field Types:**
- `text` - Single-line text input
- `email` - Email with validation
- `tel` - Phone number
- `url` - Website URL
- `number` - Numeric input
- `date` - Date picker
- `textarea` - Multi-line text
- `select` - Dropdown menu
- `radio` - Single choice from options
- `checkbox` - Multiple selections

### 5. 📸 Scan Document
**Best for:** Digitizing existing paper forms
- Upload image or PDF of form
- OCR-powered text extraction
- AI analyzes form structure
- Automatic field recognition

**Supported Formats:**
- JPEG, PNG, WebP images
- PDF documents
- Max file size: 10MB

**Tips for Best Results:**
- Ensure good lighting and clear text
- Capture entire form in frame
- Avoid shadows and glare
- Use high-resolution images (300+ DPI)
- For PDFs, ensure text is selectable

## Accessing Creation Methods

### New Unified Interface

Visit `/create` to see all available methods in a beautiful card-based interface:

```typescript
// Navigate to creation page
router.push('/create');

// Or with pre-selected method
router.push('/create?method=voice');
```

### Integration Points

All methods save to the same database and redirect to the builder for further editing:

```typescript
// Flow for all methods
1. User selects creation method
2. Provides input (prompt, file, JSON, scan, or voice)
3. AI processes and generates form structure
4. Form saved to database
5. Redirect to /builder?formId={id}
6. User can further customize
```

## API Endpoints

### Generate from Prompt/Voice
```typescript
POST /api/ai/generate
Body: { brief: string }
Response: { title: string, fields: Field[] }
```

### Import from File
```typescript
POST /api/ai/import-file
Body: FormData with "file" field
Accepts: .csv, .json, .txt, .xlsx
Response: { title: string, fields: Field[] }
```

### Scan Document
```typescript
POST /api/ai/scan-form
Body: FormData with "file" field
Accepts: .jpg, .png, .webp, .pdf
Response: { title: string, fields: Field[], extractedText: string }
```

## Component Architecture

### Main Components

1. **FormCreationMethods** - Method selection interface
   - Visual cards for each method
   - Hover effects and animations
   - Feature descriptions

2. **FileUploadCreator** - File upload handler
   - Drag & drop support
   - File validation
   - Format examples

3. **DocumentScanner** - OCR integration
   - Image preview
   - Processing stages
   - Error handling

4. **JSONImportCreator** - JSON editor
   - Syntax validation
   - Example templates
   - Schema documentation
   - Format button

5. **VoiceInput** - Voice recording (existing)
   - Speech recognition
   - Language selection
   - Session restoration

## Usage Examples

### Example 1: CSV Import
```csv
label,type,required,placeholder,options
First Name,text,true,John,
Last Name,text,true,Doe,
Email,email,true,john@example.com,
Age,number,false,25,
Gender,radio,false,,"Male,Female,Other"
Subscribe,checkbox,false,,"Yes, I want to receive updates"
```

### Example 2: JSON Import
```json
{
  "title": "Event Registration",
  "fields": [
    {
      "id": "full_name",
      "label": "Full Name",
      "type": "text",
      "required": true
    },
    {
      "id": "email",
      "label": "Email Address",
      "type": "email",
      "required": true
    },
    {
      "id": "ticket_type",
      "label": "Ticket Type",
      "type": "select",
      "required": true,
      "options": ["General Admission", "VIP", "Student"]
    },
    {
      "id": "dietary_restrictions",
      "label": "Dietary Restrictions",
      "type": "checkbox",
      "required": false,
      "options": ["Vegetarian", "Vegan", "Gluten-Free", "None"]
    }
  ]
}
```

### Example 3: Text File Import
```
Full Name
Email Address
Phone Number
Company Name
Job Title
How did you hear about us?
Comments or Questions
```

## Error Handling

All methods include comprehensive error handling:

- **File Upload:** File type validation, size limits, format checking
- **JSON Import:** Syntax validation, schema validation, missing field detection
- **Document Scan:** OCR errors, empty extractions, format issues
- **Voice Input:** Browser support, microphone permissions, recognition errors

## Performance Considerations

- **File Upload:** Max 5MB for data files
- **Document Scan:** Max 10MB for images/PDFs
- **OCR Processing:** ~5-15 seconds depending on document complexity
- **AI Generation:** ~2-5 seconds for all methods

## Future Enhancements

Planned improvements:

1. **Excel Support:** Full .xlsx parsing with multiple sheets
2. **Real OCR Integration:** Google Vision API, AWS Textract
3. **Form Templates Library:** Pre-built forms for common use cases
4. **Batch Import:** Multiple files at once
5. **API Import:** Direct integration with external APIs
6. **Form Cloning:** Duplicate existing forms
7. **Version History:** Track form changes over time

## Best Practices

### When to Use Each Method

- **AI Prompt:** Quick forms, prototyping, simple requirements
- **Voice Input:** Accessibility needs, mobile users, hands-free scenarios
- **File Upload:** Migrating data, bulk import, existing spreadsheets
- **JSON Import:** Developer workflows, API integration, precise control
- **Document Scan:** Digitizing paper forms, replicating existing designs

### Optimization Tips

1. **For File Upload:**
   - Use CSV for simple field lists
   - Use JSON for complex validation rules
   - Include column headers in CSV

2. **For JSON Import:**
   - Validate JSON before importing
   - Use meaningful field IDs
   - Include validation rules when needed

3. **For Document Scan:**
   - Use clear, high-contrast images
   - Ensure proper lighting
   - Scan at 300 DPI or higher
   - Test with PDF if image fails

## Troubleshooting

### Common Issues

**File Upload Fails:**
- Check file format and size
- Ensure proper CSV headers
- Validate JSON syntax

**OCR Extraction Poor:**
- Improve image quality
- Remove shadows/glare
- Try PDF instead of image
- Increase scan resolution

**Voice Not Working:**
- Check browser compatibility
- Grant microphone permissions
- Ensure HTTPS connection
- Try different browser

## Accessibility

All creation methods are fully accessible:

- Keyboard navigation support
- Screen reader compatible
- ARIA labels and roles
- Focus management
- Error announcements
- High contrast support

## Code Examples

### Programmatic Form Creation

```typescript
import { useRouter } from "next/navigation";

// Create form programmatically
async function createFormFromData(title: string, fields: Field[]) {
  const response = await fetch("/api/forms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, fields, userId: session.user.id }),
  });
  
  const { form } = await response.json();
  router.push(`/builder?formId=${form.id}`);
}
```

### Custom File Parser

```typescript
async function parseCustomFormat(file: File): Promise<Field[]> {
  const text = await file.text();
  const lines = text.split("\n");
  
  return lines.map((line, idx) => ({
    id: `field_${idx}`,
    label: line.trim(),
    type: inferType(line),
    required: false,
    order: idx,
  }));
}
```

## Summary

The multiple creation methods provide flexibility for all users:
- **Beginners:** Use AI Prompt or Voice
- **Power Users:** Use File Upload or JSON Import
- **Digitization:** Use Document Scanner

All methods integrate seamlessly and produce the same high-quality forms ready for customization in the builder.

## Navigation

- Main Creation Page: `/create`
- Builder: `/builder`
- Dashboard: `/dashboard`

---

**Last Updated:** November 2025
**Version:** 2.0
