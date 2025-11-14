import { ValidationRule } from "@/types/form";

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
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d\s\-\+\(\)]+$/,
  url: /^https?:\/\/.+/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  numeric: /^\d+$/,
  alpha: /^[a-zA-Z]+$/,
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
    value: ValidationPatterns.email.toString(),
    message: message || "Please enter a valid email address",
  }),

  phone: (message?: string): ValidationRule => ({
    type: "pattern",
    value: ValidationPatterns.phone.toString(),
    message: message || "Please enter a valid phone number",
  }),

  url: (message?: string): ValidationRule => ({
    type: "pattern",
    value: ValidationPatterns.url.toString(),
    message: message || "Please enter a valid URL",
  }),
};
