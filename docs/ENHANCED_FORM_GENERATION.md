# Enhanced Intelligent Form Generation

The enhanced form generation system intelligently analyzes source content to create contextually relevant, meaningful survey questions. It understands context, generates logical questions, matches question types to data, maintains coherence, avoids redundancy, and adapts to different source types.

## Features

### 1. Content Analysis
- **Document Type Detection**: Automatically identifies if content is a registration form, survey, medical form, application, etc.
- **Domain Recognition**: Detects the domain (healthcare, education, business, government, etc.)
- **Entity Extraction**: Finds emails, phone numbers, dates, and other structured data
- **Language Detection**: Supports multiple languages

### 2. Intelligent Question Generation
- **Context-Aware**: Questions are generated based on the document type and domain
- **Smart Field Types**: Automatically selects appropriate input types (email, date, number, etc.)
- **Validation Rules**: Adds intelligent validation based on data type
- **Help Text**: Provides contextual help and placeholder examples

### 3. Question Flow Management
- **Logical Ordering**: Questions are organized in a natural flow
- **Category Grouping**: Related questions are grouped together
- **Conditional Logic**: Sets up dependencies between questions
- **Progressive Disclosure**: Complex forms use conditional visibility

### 4. Redundancy Prevention
- **Duplicate Detection**: Avoids asking for the same information twice
- **Smart Merging**: Combines similar questions into one
- **Information Extraction**: Doesn't ask for data already present in the source

## Usage Examples

### Example 1: Medical Intake Form

**Input (Text Description):**
```
A medical intake form for new patients including personal information, 
medical history, current medications, allergies, insurance information, 
and emergency contact details.
```

**Generated Form:**
- **Title**: Medical Patient Intake Form
- **Document Type**: medical_form
- **Domain**: healthcare

**Questions Generated:**
1. Patient Information (grouped)
   - Full Name (text, required)
   - Date of Birth (date, required)
   - Gender (select: Male, Female, Other, Prefer not to say)
   - Phone Number (tel, required)
   - Email Address (email)

2. Medical History (grouped)
   - Do you have any chronic conditions? (textarea)
   - Current medications (textarea, placeholder: "List all medications with dosages")
   - Known allergies (textarea, placeholder: "Include drug, food, and environmental allergies")
   - Previous surgeries (textarea)

3. Insurance Information (grouped)
   - Insurance Provider (text)
   - Policy Number (text)
   - Group Number (text)

4. Emergency Contact (grouped)
   - Emergency Contact Name (text, required)
   - Relationship (select: Spouse, Parent, Child, Sibling, Friend, Other)
   - Emergency Contact Phone (tel, required)

5. Consent
   - I consent to treatment (checkbox, required)
   - I acknowledge privacy practices (checkbox, required)

### Example 2: Customer Feedback Survey

**Input (Voice Transcript):**
```
We need to collect customer feedback about their recent purchase experience. 
Ask them to rate their satisfaction, what they liked most, any issues they faced, 
and if they would recommend us to others.
```

**Generated Form:**
- **Title**: Customer Feedback Survey
- **Document Type**: feedback_form
- **Domain**: retail

**Questions Generated:**
1. Overall Experience
   - How would you rate your overall experience? (radio: Excellent, Good, Average, Poor, Very Poor)
   - What did you like most about your purchase? (textarea)

2. Feedback Details
   - Did you experience any issues? (radio: Yes, No)
   - If yes, please describe the issues (textarea, conditional on previous = Yes)
   - How likely are you to recommend us? (range: 0-10 with labels)

3. Additional Information (optional)
   - Any suggestions for improvement? (textarea, optional)
   - May we contact you about your feedback? (checkbox)
   - If yes, preferred contact method (radio: Email, Phone, conditional)

### Example 3: Event Registration

**Input (JSON Data):**
```json
{
  "event": "Annual Tech Conference 2024",
  "dates": "March 15-17, 2024",
  "location": "San Francisco Convention Center",
  "tracks": ["AI/ML", "Cloud", "Security", "Mobile"],
  "meals": ["Vegetarian", "Vegan", "Gluten-free", "No restrictions"],
  "workshops": true
}
```

**Generated Form:**
- **Title**: Annual Tech Conference 2024 Registration
- **Document Type**: registration_form
- **Domain**: technology

**Questions Generated:**
1. Attendee Information
   - Full Name (text, required)
   - Email (email, required)
   - Company/Organization (text)
   - Job Title (text)

2. Conference Preferences
   - Which tracks interest you? (checkbox: AI/ML, Cloud, Security, Mobile)
   - Dietary restrictions (select: Vegetarian, Vegan, Gluten-free, No restrictions)
   - Will you attend workshops? (radio: Yes, No)
   - T-shirt size (select: XS, S, M, L, XL, XXL)

3. Additional Options
   - Need parking? (checkbox)
   - Bringing guests? (number, min: 0, max: 3)
   - Special accommodations needed? (textarea, optional)

## Implementation Details

### Content Analyzer
The system uses the `ContentAnalyzer` class to:
- Parse and understand source content
- Extract entities and patterns
- Identify document type and domain
- Generate question suggestions
- Calculate confidence scores

### Enhanced AI Generation
The `/api/ai/generate-enhanced` endpoint:
- Accepts various source types (text, voice, JSON, document, form scan)
- Uses content analysis to guide AI generation
- Merges AI suggestions with analyzer recommendations
- Applies domain-specific rules
- Ensures logical flow and coherence

### UI Integration
The builder interface now includes:
- Source type selector
- Intelligent analysis toggle
- Real-time analysis feedback
- Confidence indicators
- Domain and document type display

## Best Practices

1. **Provide Clear Context**: The more descriptive your input, the better the generated form
2. **Use Appropriate Source Types**: Select the correct source type for optimal results
3. **Review and Refine**: Always review generated forms and make adjustments as needed
4. **Test with Real Data**: Try the system with actual content samples from your domain

## Advanced Features

### Domain-Specific Adaptations
- **Healthcare**: HIPAA-compliant field suggestions, medical terminology
- **Education**: Academic year selections, grade levels, course codes
- **Finance**: Currency formatting, account number validation
- **Government**: Official ID formats, jurisdiction selections

### Multi-Language Support
- Generates forms in detected language
- Adapts field labels and help text
- Maintains cultural appropriateness

### Accessibility
- Proper label associations
- Descriptive help text
- Logical tab order
- Screen reader friendly

## API Reference

### POST /api/ai/generate-enhanced

**Request Body:**
```json
{
  "content": "string - The source content to analyze",
  "sourceType": "text | voice | json | document | form_scan",
  "options": {
    "maxQuestions": 20,
    "includeOptionalFields": true,
    "targetAudience": "general | professional | academic | medical",
    "formComplexity": "simple | moderate | complex"
  }
}
```

**Response:**
```json
{
  "title": "Generated Form Title",
  "fields": [
    {
      "id": "field_id",
      "label": "Question text",
      "type": "field_type",
      "required": true,
      "placeholder": "Example input",
      "helpText": "Additional guidance",
      "options": ["for", "select", "types"],
      "validation": {},
      "conditionalLogic": []
    }
  ],
  "analysis": {
    "documentType": "form_type",
    "domain": "domain_name",
    "confidence": 0.95,
    "summary": "Analysis summary"
  }
}
```

## Troubleshooting

**Low Confidence Scores:**
- Provide more detailed descriptions
- Use proper grammar and punctuation
- Include specific requirements
- Select the correct source type

**Missing Expected Fields:**
- Check if information is already in the source
- Add explicit mentions of required data
- Use domain-specific keywords

**Wrong Field Types:**
- Include data format hints (e.g., "email address", "phone number")
- Mention validation requirements
- Provide example values

## Future Enhancements

1. **OCR Integration**: Direct image/PDF upload for form scanning
2. **Multi-Page Forms**: Automatic section detection and pagination
3. **Template Learning**: Learn from user corrections to improve generation
4. **Export Formats**: Generate forms for various platforms (Google Forms, Typeform, etc.)
5. **Compliance Checking**: Ensure forms meet regulatory requirements







