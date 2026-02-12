# Form Input Validation

This document explains the comprehensive input validation system implemented to protect your forms from malicious input and ensure data integrity.

## Overview

All form input fields now have automatic validation based on their field type. This prevents users from submitting invalid or potentially harmful data.

## Field Type Validation

### Email Fields (`type: "email"`)
- **Pattern**: Must be a valid email format (e.g., `user@example.com`)
- **Validation**: `/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/`
- **Error Message**: "Please enter a valid email address"
- **Example Valid**: `john.doe@example.com`, `user+tag@domain.co.uk`
- **Example Invalid**: `notanemail`, `@example.com`, `user@`

### Phone Fields (`type: "phone"` or `type: "tel"`)
- **Pattern**: International phone number format with optional country code
- **Validation**: `/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{4,15}$/`
- **Error Message**: "Please enter a valid phone number"
- **Example Valid**: `+1 (555) 123-4567`, `555-123-4567`, `+44 20 7123 4567`
- **Example Invalid**: `abc-defg`, `123` (too short), letters mixed with numbers

### URL Fields (`type: "url"`)
- **Pattern**: Valid HTTP/HTTPS URL
- **Validation**: Must start with `http://` or `https://` and have a valid domain
- **Error Message**: "Please enter a valid URL"
- **Example Valid**: `https://example.com`, `http://www.site.com/page`
- **Example Invalid**: `example.com` (missing protocol), `not a url`

### Number Fields (`type: "number"`)
- **Pattern**: Numeric values including decimals and negative numbers
- **Validation**: `/^-?\d*\.?\d+$/`
- **Error Message**: "Please enter a valid number"
- **Example Valid**: `42`, `3.14`, `-10`, `0.5`
- **Example Invalid**: `abc`, `12.34.56`, `10px`

### Currency Fields (`type: "currency"`)
- **Pattern**: Numeric values with up to 2 decimal places
- **Validation**: `/^\d+(\.\d{1,2})?$/`
- **Error Message**: "Please enter a valid currency amount (e.g., 10.99)"
- **Example Valid**: `10`, `99.99`, `1234.56`
- **Example Invalid**: `-5` (negative), `10.999` (too many decimals), `$10` (symbols)

### Text Fields (`type: "text"`, `type: "short-answer"`, `type: "textarea"`)
- **Default**: No pattern validation (accepts any text)
- **Custom Rules**: You can add custom validation rules for minimum/maximum length, custom patterns, etc.

## Custom Validation Rules

In addition to the built-in validation, you can add custom validation rules to any field:

### Available Rule Types

1. **minLength**: Minimum character length
   ```typescript
   {
     type: "minLength",
     value: 5,
     message: "Must be at least 5 characters"
   }
   ```

2. **maxLength**: Maximum character length
   ```typescript
   {
     type: "maxLength",
     value: 100,
     message: "Must be no more than 100 characters"
   }
   ```

3. **pattern**: Custom regex pattern
   ```typescript
   {
     type: "pattern",
     value: "^[A-Z]{2}[0-9]{4}$",
     message: "Must be 2 letters followed by 4 numbers (e.g., AB1234)"
   }
   ```

4. **min**: Minimum numeric value
   ```typescript
   {
     type: "min",
     value: 18,
     message: "Must be at least 18"
   }
   ```

5. **max**: Maximum numeric value
   ```typescript
   {
     type: "max",
     value: 100,
     message: "Must be no more than 100"
   }
   ```

## How Validation Works

### Client-Side Validation
- **React Hook Form**: All forms use `react-hook-form` for efficient client-side validation
- **Real-Time Feedback**: Users see validation errors immediately when they leave a field (onBlur)
- **Submit Prevention**: Invalid forms cannot be submitted until all errors are fixed

### Validation Flow
1. User enters data into a field
2. When they leave the field (blur), validation runs
3. Built-in validation rules for the field type are checked first
4. Custom validation rules (if any) are checked next
5. Error messages are displayed if validation fails
6. Form submission is blocked until all validations pass

### Server-Side Validation
The same validation rules are checked on the server when forms are submitted to ensure security even if JavaScript is disabled or bypassed.

## Security Benefits

1. **SQL Injection Prevention**: Email and phone validation prevents special characters that could be used in SQL injection attacks
2. **XSS Protection**: Pattern validation ensures data matches expected formats, reducing XSS risks
3. **Data Integrity**: Type-specific validation ensures data is in the correct format for processing
4. **Business Logic Protection**: Number and currency validation prevent invalid calculations
5. **User Experience**: Clear error messages help users fix issues before submission

## Code Examples

### Using Built-in Validation (Automatic)
```typescript
// Email field automatically validates email format
const field: Field = {
  id: "email",
  label: "Email Address",
  type: "email",
  required: true
};
// No additional validation needed - email pattern is automatic!
```

### Adding Custom Validation
```typescript
import { createValidationRule } from "@/lib/validation";

const field: Field = {
  id: "age",
  label: "Age",
  type: "number",
  required: true,
  validation: [
    createValidationRule.min(18, "You must be at least 18 years old"),
    createValidationRule.max(120, "Please enter a valid age")
  ]
};
```

### Combining Built-in and Custom Validation
```typescript
// Phone field gets automatic phone validation
// Plus custom length requirement
const field: Field = {
  id: "phone",
  label: "Phone Number",
  type: "phone",
  required: true,
  validation: [
    createValidationRule.minLength(10, "Phone number must be at least 10 digits")
  ]
};
```

## Available Validation Patterns

The validation library provides these pre-built patterns:

```typescript
ValidationPatterns.email        // Email addresses
ValidationPatterns.phone        // Phone numbers
ValidationPatterns.url          // URLs
ValidationPatterns.alphanumeric // Letters and numbers only
ValidationPatterns.numeric      // Numbers only
ValidationPatterns.alpha        // Letters only
ValidationPatterns.currency     // Currency amounts
ValidationPatterns.zipCode      // US ZIP codes
ValidationPatterns.postalCode   // International postal codes
```

## Testing Validation

To test that validation is working:

1. **Email Field Test**:
   - Try entering "notanemail" → Should show error
   - Try entering "user@example.com" → Should accept

2. **Phone Field Test**:
   - Try entering "abc" → Should show error
   - Try entering "+1 555-123-4567" → Should accept

3. **Number Field Test**:
   - Try entering "hello" → Should show error
   - Try entering "42" → Should accept

4. **Currency Field Test**:
   - Try entering "-5.99" → Should show error (negative)
   - Try entering "10.99" → Should accept

## Migration Notes

All existing forms automatically get validation without any changes needed. The validation is applied based on the field type:

- Forms with `type: "email"` now validate email format
- Forms with `type: "phone"` now validate phone format
- Forms with `type: "number"` now validate numeric input
- Forms with `type: "currency"` now validate currency format

Custom validation rules you've already added will continue to work and will be combined with the built-in validation.

## Troubleshooting

### "My valid input is being rejected"
Check the validation pattern for your field type. You may need to adjust your input format or add a custom validation rule that's more lenient.

### "I want to override the default validation"
Add a custom `pattern` validation rule - it will replace the default pattern:

```typescript
validation: [
  {
    type: "pattern",
    value: "your-custom-regex",
    message: "Your custom error message"
  }
]
```

### "Validation isn't showing on my form"
Ensure your form is using the updated renderer components:
- Standard forms: `src/app/f/[formId]/renderer.tsx`
- Conversational forms: `src/components/ConversationalForm.tsx`
- Embedded forms: `src/app/embed/[formId]/EmbedFormRenderer.tsx`

## Further Reading

- [React Hook Form Validation](https://react-hook-form.com/get-started#Applyvalidation)
- [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [HTML5 Input Types](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#input_types)
