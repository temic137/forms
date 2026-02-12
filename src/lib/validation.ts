import { ValidationRule, FieldType } from "@/types/form";

/**
 * Validates a field value against an array of validation rules
 * @param value - The field value to validate
 * @param rules - Array of validation rules to apply
 * @returns Error message if validation fails, null if validation passes
 */
export function validateField(
  value: string | number | undefined,
  rules: ValidationRule[]
): string | null {
  if (!rules || rules.length === 0) {
    return null;
  }

  for (const rule of rules) {
    const error = validateRule(value, rule);
    if (error) {
      return error;
    }
  }

  return null;
}

/**
 * Validates a single validation rule
 * @param value - The field value to validate
 * @param rule - The validation rule to apply
 * @returns Error message if validation fails, null if validation passes
 */
function validateRule(
  value: string | number | undefined,
  rule: ValidationRule
): string | null {
  const stringValue = value?.toString() || "";

  switch (rule.type) {
    case "minLength":
      return validateMinLength(stringValue, rule);
    case "maxLength":
      return validateMaxLength(stringValue, rule);
    case "pattern":
      return validatePattern(stringValue, rule);
    case "min":
      return validateMin(value, rule);
    case "max":
      return validateMax(value, rule);
    case "custom":
      return validateCustom(value, rule);
    default:
      return null;
  }
}

/**
 * Validates minimum length constraint
 */
function validateMinLength(
  value: string,
  rule: ValidationRule
): string | null {
  const minLength = Number(rule.value);
  if (value.length < minLength) {
    return formatErrorMessage(rule.message, { minLength, actualLength: value.length });
  }
  return null;
}

/**
 * Validates maximum length constraint
 */
function validateMaxLength(
  value: string,
  rule: ValidationRule
): string | null {
  const maxLength = Number(rule.value);
  if (value.length > maxLength) {
    return formatErrorMessage(rule.message, { maxLength, actualLength: value.length });
  }
  return null;
}

/**
 * Validates regex pattern constraint
 */
function validatePattern(value: string, rule: ValidationRule): string | null {
  try {
    const pattern = new RegExp(rule.value.toString());
    if (!pattern.test(value)) {
      return formatErrorMessage(rule.message, { pattern: rule.value });
    }
    return null;
  } catch (error) {
    console.error("Invalid regex pattern:", rule.value, error);
    return "Invalid validation pattern";
  }
}

/**
 * Validates minimum value constraint (for numbers)
 */
function validateMin(
  value: string | number | undefined,
  rule: ValidationRule
): string | null {
  const numValue = Number(value);
  const minValue = Number(rule.value);

  if (isNaN(numValue)) {
    return "Value must be a number";
  }

  if (numValue < minValue) {
    return formatErrorMessage(rule.message, { min: minValue, actual: numValue });
  }

  return null;
}

/**
 * Validates maximum value constraint (for numbers)
 */
function validateMax(
  value: string | number | undefined,
  rule: ValidationRule
): string | null {
  const numValue = Number(value);
  const maxValue = Number(rule.value);

  if (isNaN(numValue)) {
    return "Value must be a number";
  }

  if (numValue > maxValue) {
    return formatErrorMessage(rule.message, { max: maxValue, actual: numValue });
  }

  return null;
}

/**
 * Validates custom validation rule
 */
function validateCustom(
  value: string | number | undefined,
  rule: ValidationRule
): string | null {
  // Custom validation logic can be extended here
  // For now, just return the message if value is empty
  if (!value || value.toString().trim() === "") {
    return rule.message;
  }
  return null;
}

/**
 * Formats error message with dynamic values
 * Replaces placeholders like {minLength}, {maxLength}, etc. with actual values
 */
export function formatErrorMessage(
  message: string,
  values: Record<string, string | number>
): string {
  let formattedMessage = message;

  for (const [key, value] of Object.entries(values)) {
    const placeholder = `{${key}}`;
    formattedMessage = formattedMessage.replace(placeholder, value.toString());
  }

  return formattedMessage;
}

/**
 * Common validation patterns for reuse
 */
export const ValidationPatterns = {
  email: /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/,
  phone: /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  numeric: /^\d+$/,
  alpha: /^[a-zA-Z]+$/,
  // More specific patterns
  phoneStrict: /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{4,15}$/,
  zipCode: /^[0-9]{5}(-[0-9]{4})?$/,
  postalCode: /^[A-Za-z0-9]{3,10}$/,
  currency: /^\d+(\.\d{1,2})?$/,
};

/**
 * Helper function to create common validation rules
 */
export const createValidationRule = {
  minLength: (length: number, message?: string): ValidationRule => ({
    type: "minLength",
    value: length,
    message: message || `Minimum length is {minLength} characters`,
  }),

  maxLength: (length: number, message?: string): ValidationRule => ({
    type: "maxLength",
    value: length,
    message: message || `Maximum length is {maxLength} characters`,
  }),

  pattern: (pattern: string | RegExp, message?: string): ValidationRule => ({
    type: "pattern",
    value: pattern.toString(),
    message: message || "Invalid format",
  }),

  min: (value: number, message?: string): ValidationRule => ({
    type: "min",
    value,
    message: message || `Minimum value is {min}`,
  }),

  max: (value: number, message?: string): ValidationRule => ({
    type: "max",
    value,
    message: message || `Maximum value is {max}`,
  }),

  email: (message?: string): ValidationRule => ({
    type: "pattern",
    value: ValidationPatterns.email.source,
    message: message || "Please enter a valid email address",
  }),

  phone: (message?: string): ValidationRule => ({
    type: "pattern",
    value: ValidationPatterns.phone.source,
    message: message || "Please enter a valid phone number",
  }),

  url: (message?: string): ValidationRule => ({
    type: "pattern",
    value: ValidationPatterns.url.source,
    message: message || "Please enter a valid URL",
  }),

  currency: (message?: string): ValidationRule => ({
    type: "pattern",
    value: ValidationPatterns.currency.source,
    message: message || "Please enter a valid currency amount (e.g., 10.99)",
  }),
};

/**
 * Get default validation rules for a field type
 * These provide built-in security and data integrity for common field types
 */
export function getDefaultValidationForFieldType(
  fieldType: FieldType
): ValidationRule[] {
  switch (fieldType) {
    case "email":
      return [createValidationRule.email()];
    
    case "phone":
    case "tel":
      return [createValidationRule.phone()];
    
    case "url":
      return [createValidationRule.url()];
    
    case "currency":
      return [createValidationRule.currency()];
    
    case "number":
      return [
        {
          type: "pattern",
          value: /^-?\d*\.?\d+$/.source,
          message: "Please enter a valid number",
        },
      ];
    
    default:
      return [];
  }
}

/**
 * Merge custom validation rules with default rules
 * Custom rules take precedence and can override defaults
 */
export function mergeValidationRules(
  fieldType: FieldType,
  customRules?: ValidationRule[]
): ValidationRule[] {
  const defaultRules = getDefaultValidationForFieldType(fieldType);
  
  if (!customRules || customRules.length === 0) {
    return defaultRules;
  }
  
  // If custom rules exist, use them as they may be more specific
  // but keep default pattern validation if no pattern is provided
  const hasCustomPattern = customRules.some(rule => rule.type === "pattern");
  
  if (hasCustomPattern) {
    // Custom pattern rules replace default pattern validation
    return customRules;
  }
  
  // Merge default pattern validation with custom rules
  return [...defaultRules, ...customRules];
}

/**
 * Convert validation rules to react-hook-form validation options
 * This provides client-side validation for better UX and security
 */
export function getReactHookFormValidation(
  fieldType: FieldType,
  required: boolean,
  customRules?: ValidationRule[]
): Record<string, unknown> {
  const allRules = mergeValidationRules(fieldType, customRules);
  
  const validation: Record<string, unknown> = {
    required: required ? "This field is required" : false,
  };
  
  // Debug logging (remove in production)
  if (fieldType === "email" || fieldType === "phone" || fieldType === "url") {
    console.log(`[Validation] ${fieldType} field - rules:`, allRules);
  }
  
  // Add validation rules
  allRules.forEach((rule) => {
    switch (rule.type) {
      case "minLength":
        validation.minLength = {
          value: Number(rule.value),
          message: rule.message,
        };
        break;
      case "maxLength":
        validation.maxLength = {
          value: Number(rule.value),
          message: rule.message,
        };
        break;
      case "pattern":
        try {
          // The pattern value is stored as a string (from .source)
          // We need to create a RegExp from it
          const patternStr = rule.value.toString();
          // Check if it's already in /pattern/flags format or just the pattern string
          const match = patternStr.match(/^\/(.+)\/([gimsuy]*)$/);
          const pattern = match 
            ? new RegExp(match[1], match[2]) 
            : new RegExp(patternStr); // patternStr is just the pattern without delimiters
          validation.pattern = {
            value: pattern,
            message: rule.message,
          };
        } catch (error) {
          console.error("Invalid regex pattern:", rule.value, error);
        }
        break;
      case "min":
        validation.min = {
          value: Number(rule.value),
          message: rule.message,
        };
        break;
      case "max":
        validation.max = {
          value: Number(rule.value),
          message: rule.message,
        };
        break;
      case "custom":
        validation.validate = (value: unknown) => {
          const error = validateCustom(value as string | number | undefined, rule);
          return error || true;
        };
        break;
    }
  });
  
  // Add valueAsNumber for number fields
  if (fieldType === "number" || fieldType === "currency") {
    validation.valueAsNumber = true;
  }
  
  // Debug logging (remove in production)
  if (fieldType === "email" || fieldType === "phone" || fieldType === "url") {
    console.log(`[Validation] ${fieldType} final validation:`, validation);
  }
  
  return validation;
}
