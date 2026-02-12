import { 
  validateField, 
  ValidationPatterns,
  getDefaultValidationForFieldType,
  mergeValidationRules,
  getReactHookFormValidation,
  createValidationRule
} from '../validation';
import { ValidationRule, FieldType } from '@/types/form';

describe('ValidationPatterns', () => {
  describe('email pattern', () => {
    it('should match valid email addresses', () => {
      expect(ValidationPatterns.email.test('user@example.com')).toBe(true);
      expect(ValidationPatterns.email.test('test.user+tag@domain.co.uk')).toBe(true);
      expect(ValidationPatterns.email.test('user123@test-domain.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(ValidationPatterns.email.test('notanemail')).toBe(false);
      expect(ValidationPatterns.email.test('@example.com')).toBe(false);
      expect(ValidationPatterns.email.test('user@')).toBe(false);
      expect(ValidationPatterns.email.test('user @example.com')).toBe(false);
    });
  });

  describe('phone pattern', () => {
    it('should match valid phone numbers', () => {
      expect(ValidationPatterns.phone.test('+1 555-123-4567')).toBe(true);
      expect(ValidationPatterns.phone.test('555-123-4567')).toBe(true);
      expect(ValidationPatterns.phone.test('+44 20 7123 4567')).toBe(true);
      expect(ValidationPatterns.phone.test('(555) 123-4567')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(ValidationPatterns.phone.test('abc-defg')).toBe(false);
      expect(ValidationPatterns.phone.test('123')).toBe(false);
      expect(ValidationPatterns.phone.test('not a phone')).toBe(false);
    });
  });

  describe('url pattern', () => {
    it('should match valid URLs', () => {
      expect(ValidationPatterns.url.test('https://example.com')).toBe(true);
      expect(ValidationPatterns.url.test('http://www.site.com/page')).toBe(true);
      expect(ValidationPatterns.url.test('https://sub.domain.com/path?query=1')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(ValidationPatterns.url.test('example.com')).toBe(false);
      expect(ValidationPatterns.url.test('not a url')).toBe(false);
      expect(ValidationPatterns.url.test('ftp://example.com')).toBe(false);
    });
  });

  describe('currency pattern', () => {
    it('should match valid currency amounts', () => {
      expect(ValidationPatterns.currency.test('10')).toBe(true);
      expect(ValidationPatterns.currency.test('99.99')).toBe(true);
      expect(ValidationPatterns.currency.test('1234.56')).toBe(true);
      expect(ValidationPatterns.currency.test('0.5')).toBe(true);
    });

    it('should reject invalid currency amounts', () => {
      expect(ValidationPatterns.currency.test('-5')).toBe(false);
      expect(ValidationPatterns.currency.test('10.999')).toBe(false);
      expect(ValidationPatterns.currency.test('$10')).toBe(false);
      expect(ValidationPatterns.currency.test('abc')).toBe(false);
    });
  });
});

describe('validateField', () => {
  it('should return null for valid values', () => {
    const rules: ValidationRule[] = [
      { type: 'minLength', value: 3, message: 'Too short' }
    ];
    expect(validateField('hello', rules)).toBeNull();
  });

  it('should return error message for invalid values', () => {
    const rules: ValidationRule[] = [
      { type: 'minLength', value: 5, message: 'Too short' }
    ];
    expect(validateField('hi', rules)).toBe('Too short');
  });

  it('should validate pattern rules', () => {
    const rules: ValidationRule[] = [
      { type: 'pattern', value: ValidationPatterns.email.source, message: 'Invalid email' }
    ];
    expect(validateField('user@example.com', rules)).toBeNull();
    expect(validateField('notanemail', rules)).toBe('Invalid email');
  });

  it('should validate min/max rules for numbers', () => {
    const rules: ValidationRule[] = [
      { type: 'min', value: 18, message: 'Must be 18+' },
      { type: 'max', value: 100, message: 'Must be under 100' }
    ];
    expect(validateField(25, rules)).toBeNull();
    expect(validateField(15, rules)).toBe('Must be 18+');
    expect(validateField(150, rules)).toBe('Must be under 100');
  });
});

describe('getDefaultValidationForFieldType', () => {
  it('should return email validation for email fields', () => {
    const rules = getDefaultValidationForFieldType('email');
    expect(rules).toHaveLength(1);
    expect(rules[0].type).toBe('pattern');
  });

  it('should return phone validation for phone fields', () => {
    const rules = getDefaultValidationForFieldType('phone');
    expect(rules).toHaveLength(1);
    expect(rules[0].type).toBe('pattern');
  });

  it('should return phone validation for tel fields', () => {
    const rules = getDefaultValidationForFieldType('tel');
    expect(rules).toHaveLength(1);
    expect(rules[0].type).toBe('pattern');
  });

  it('should return url validation for url fields', () => {
    const rules = getDefaultValidationForFieldType('url');
    expect(rules).toHaveLength(1);
    expect(rules[0].type).toBe('pattern');
  });

  it('should return empty array for text fields', () => {
    const rules = getDefaultValidationForFieldType('text');
    expect(rules).toHaveLength(0);
  });
});

describe('mergeValidationRules', () => {
  it('should return default rules when no custom rules provided', () => {
    const merged = mergeValidationRules('email', undefined);
    expect(merged).toHaveLength(1);
    expect(merged[0].type).toBe('pattern');
  });

  it('should use custom rules when provided', () => {
    const customRules: ValidationRule[] = [
      { type: 'minLength', value: 10, message: 'Too short' }
    ];
    const merged = mergeValidationRules('email', customRules);
    expect(merged.length).toBeGreaterThan(0);
    expect(merged.some(r => r.type === 'minLength')).toBe(true);
  });

  it('should replace default pattern when custom pattern provided', () => {
    const customRules: ValidationRule[] = [
      { type: 'pattern', value: '^custom$', message: 'Custom pattern' }
    ];
    const merged = mergeValidationRules('email', customRules);
    expect(merged).toHaveLength(1);
    expect(merged[0].value).toBe('^custom$');
  });
});

describe('getReactHookFormValidation', () => {
  it('should return required validation', () => {
    const validation = getReactHookFormValidation('text', true, undefined);
    expect(validation.required).toBeTruthy();
  });

  it('should include pattern validation for email fields', () => {
    const validation = getReactHookFormValidation('email', false, undefined);
    expect(validation.pattern).toBeDefined();
  });

  it('should include valueAsNumber for number fields', () => {
    const validation = getReactHookFormValidation('number', false, undefined);
    expect(validation.valueAsNumber).toBe(true);
  });

  it('should include custom validation rules', () => {
    const customRules: ValidationRule[] = [
      { type: 'minLength', value: 5, message: 'Too short' }
    ];
    const validation = getReactHookFormValidation('text', false, customRules);
    expect(validation.minLength).toBeDefined();
    expect((validation.minLength as any).value).toBe(5);
  });
});

describe('createValidationRule helpers', () => {
  it('should create email validation rule', () => {
    const rule = createValidationRule.email();
    expect(rule.type).toBe('pattern');
    expect(rule.message).toContain('email');
  });

  it('should create phone validation rule', () => {
    const rule = createValidationRule.phone();
    expect(rule.type).toBe('pattern');
    expect(rule.message).toContain('phone');
  });

  it('should create min/max rules', () => {
    const minRule = createValidationRule.min(18);
    const maxRule = createValidationRule.max(100);
    expect(minRule.value).toBe(18);
    expect(maxRule.value).toBe(100);
  });

  it('should create minLength/maxLength rules', () => {
    const minRule = createValidationRule.minLength(5);
    const maxRule = createValidationRule.maxLength(100);
    expect(minRule.value).toBe(5);
    expect(maxRule.value).toBe(100);
  });
});

describe('Security: SQL Injection Prevention', () => {
  it('should reject email with SQL injection attempts', () => {
    const rules = getDefaultValidationForFieldType('email');
    const sqlInjection = "admin'--";
    const error = validateField(sqlInjection, rules);
    expect(error).toBeTruthy();
  });

  it('should reject phone with special characters', () => {
    const rules = getDefaultValidationForFieldType('phone');
    const injection = "'; DROP TABLE users--";
    const error = validateField(injection, rules);
    expect(error).toBeTruthy();
  });
});

describe('Security: XSS Prevention', () => {
  it('should reject email with script tags', () => {
    const rules = getDefaultValidationForFieldType('email');
    const xss = "<script>alert('xss')</script>@example.com";
    const error = validateField(xss, rules);
    expect(error).toBeTruthy();
  });
});
