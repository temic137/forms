/**
 * Enhanced Content Analyzer for Intelligent Form Generation
 * Analyzes source content to understand context, extract key information,
 * and generate relevant form questions
 */

export interface ContentAnalysis {
  documentType: DocumentType;
  domain: Domain;
  extractedEntities: ExtractedEntity[];
  suggestedQuestions: SuggestedQuestion[];
  dataTypes: DataTypeMapping[];
  relationships: EntityRelationship[];
  confidence: number;
  language: string;
  summary: string;
}

export type DocumentType = 
  | 'registration_form'
  | 'survey'
  | 'medical_form' 
  | 'application'
  | 'feedback_form'
  | 'contact_form'
  | 'booking_form'
  | 'questionnaire'
  | 'assessment'
  | 'order_form'
  | 'consent_form'
  | 'general';

export type Domain =
  | 'healthcare'
  | 'education'
  | 'business'
  | 'government'
  | 'retail'
  | 'hospitality'
  | 'technology'
  | 'finance'
  | 'legal'
  | 'general';

export interface ExtractedEntity {
  type: EntityType;
  value: string;
  context: string;
  confidence: number;
  position?: number;
}

export type EntityType =
  | 'personal_info'
  | 'contact_info'
  | 'date_time'
  | 'numeric_value'
  | 'categorical_choice'
  | 'free_text'
  | 'file_reference'
  | 'agreement'
  | 'rating';

export interface SuggestedQuestion {
  question: string;
  fieldType: FieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  validation?: ValidationRule;
  relatedTo?: string[]; // IDs of related questions
  order: number;
  category: QuestionCategory;
  rationale: string; // Why this question is suggested
}

export type FieldType = 
  | 'text'
  | 'email'
  | 'tel'
  | 'number'
  | 'date'
  | 'time'
  | 'datetime'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'range'
  | 'color'
  | 'url'
  | 'password';

export type QuestionCategory =
  | 'identification'
  | 'contact'
  | 'demographic'
  | 'preference'
  | 'experience'
  | 'opinion'
  | 'quantitative'
  | 'temporal'
  | 'consent'
  | 'additional_info';

export interface ValidationRule {
  type: 'pattern' | 'range' | 'length' | 'required' | 'custom';
  value?: any;
  message?: string;
}

export interface DataTypeMapping {
  pattern: RegExp | string;
  suggestedType: FieldType;
  validation?: ValidationRule;
}

export interface EntityRelationship {
  from: string;
  to: string;
  type: 'depends_on' | 'follows' | 'grouped_with' | 'validates';
}

// Domain-specific patterns and keywords
const DOMAIN_PATTERNS: Record<Domain, string[]> = {
  healthcare: [
    'patient', 'medical', 'diagnosis', 'symptoms', 'treatment', 'medication',
    'allergy', 'condition', 'insurance', 'physician', 'clinic', 'hospital',
    'health', 'prescription', 'dosage', 'emergency contact'
  ],
  education: [
    'student', 'course', 'grade', 'enrollment', 'transcript', 'degree',
    'school', 'university', 'academic', 'semester', 'class', 'major'
  ],
  business: [
    'company', 'business', 'revenue', 'employee', 'department', 'position',
    'salary', 'budget', 'project', 'client', 'contract', 'invoice'
  ],
  government: [
    'citizen', 'resident', 'permit', 'license', 'registration', 'tax',
    'social security', 'passport', 'visa', 'identification'
  ],
  retail: [
    'product', 'order', 'cart', 'shipping', 'billing', 'payment',
    'customer', 'item', 'quantity', 'price', 'discount'
  ],
  hospitality: [
    'guest', 'booking', 'reservation', 'room', 'check-in', 'check-out',
    'amenities', 'dietary', 'special requests'
  ],
  technology: [
    'user', 'account', 'system', 'software', 'platform', 'feature',
    'integration', 'api', 'settings', 'configuration'
  ],
  finance: [
    'account', 'balance', 'transaction', 'payment', 'credit', 'debit',
    'loan', 'investment', 'interest', 'statement'
  ],
  legal: [
    'agreement', 'contract', 'terms', 'conditions', 'consent', 'liability',
    'signature', 'witness', 'notary', 'jurisdiction'
  ],
  general: []
};

// Document type patterns
const DOCUMENT_TYPE_PATTERNS: Record<DocumentType, string[]> = {
  registration_form: ['register', 'sign up', 'create account', 'join', 'enroll'],
  survey: ['survey', 'questionnaire', 'poll', 'research', 'feedback study'],
  medical_form: ['medical', 'patient', 'health', 'clinical', 'treatment'],
  application: ['apply', 'application', 'submit', 'request', 'candidate'],
  feedback_form: ['feedback', 'review', 'rating', 'satisfaction', 'experience'],
  contact_form: ['contact', 'get in touch', 'reach out', 'inquiry', 'message'],
  booking_form: ['book', 'reserve', 'schedule', 'appointment', 'reservation'],
  questionnaire: ['questions', 'assessment', 'evaluation', 'test'],
  assessment: ['assess', 'evaluate', 'measure', 'score', 'grade'],
  order_form: ['order', 'purchase', 'buy', 'cart', 'checkout'],
  consent_form: ['consent', 'agree', 'authorize', 'permission', 'approval'],
  general: []
};

// Field type inference patterns
const FIELD_TYPE_PATTERNS: DataTypeMapping[] = [
  { pattern: /email|e-mail|mail/i, suggestedType: 'email' },
  { pattern: /phone|tel|mobile|cell/i, suggestedType: 'tel' },
  { pattern: /url|website|link/i, suggestedType: 'url' },
  { pattern: /password|pin|secret/i, suggestedType: 'password' },
  { pattern: /date|dob|birthday|when/i, suggestedType: 'date' },
  { pattern: /time|hour|schedule/i, suggestedType: 'time' },
  { pattern: /age|number|count|quantity|amount|price|cost/i, suggestedType: 'number' },
  { pattern: /color|colour/i, suggestedType: 'color' },
  { pattern: /range|scale|slider/i, suggestedType: 'range' },
  { pattern: /file|upload|document|attachment/i, suggestedType: 'file' },
  { pattern: /description|comment|message|notes|details|bio/i, suggestedType: 'textarea' },
  { pattern: /agree|accept|consent|terms/i, suggestedType: 'checkbox' },
  { pattern: /yes.*no|true.*false/i, suggestedType: 'radio' }
];

export class ContentAnalyzer {
  /**
   * Analyzes content and generates intelligent form configuration
   */
  async analyze(content: string, options?: AnalyzeOptions): Promise<ContentAnalysis> {
    const normalizedContent = content.toLowerCase();
    
    // Detect language (simplified - could use a proper language detection library)
    const language = this.detectLanguage(content);
    
    // Identify document type and domain
    const documentType = this.identifyDocumentType(normalizedContent);
    const domain = this.identifyDomain(normalizedContent);
    
    // Extract entities and key information
    const extractedEntities = this.extractEntities(content);
    
    // Generate intelligent questions based on content
    const suggestedQuestions = this.generateQuestions(
      content,
      documentType,
      domain,
      extractedEntities,
      options
    );
    
    // Identify relationships between questions
    const relationships = this.identifyRelationships(suggestedQuestions);
    
    // Calculate confidence score
    const confidence = this.calculateConfidence(extractedEntities, suggestedQuestions);
    
    // Generate summary
    const summary = this.generateSummary(content, documentType, domain);
    
    return {
      documentType,
      domain,
      extractedEntities,
      suggestedQuestions,
      dataTypes: FIELD_TYPE_PATTERNS,
      relationships,
      confidence,
      language,
      summary
    };
  }
  
  private identifyDocumentType(content: string): DocumentType {
    let bestMatch: DocumentType = 'general';
    let highestScore = 0;
    
    for (const [type, keywords] of Object.entries(DOCUMENT_TYPE_PATTERNS)) {
      const score = keywords.filter(keyword => 
        content.includes(keyword.toLowerCase())
      ).length;
      
      if (score > highestScore) {
        highestScore = score;
        bestMatch = type as DocumentType;
      }
    }
    
    return bestMatch;
  }
  
  private identifyDomain(content: string): Domain {
    let bestMatch: Domain = 'general';
    let highestScore = 0;
    
    for (const [domain, keywords] of Object.entries(DOMAIN_PATTERNS)) {
      const score = keywords.filter(keyword => 
        content.includes(keyword.toLowerCase())
      ).length;
      
      if (score > highestScore) {
        highestScore = score;
        bestMatch = domain as Domain;
      }
    }
    
    return bestMatch;
  }
  
  private extractEntities(content: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    
    // Extract email patterns
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = content.match(emailRegex);
    if (emails) {
      emails.forEach(email => {
        entities.push({
          type: 'contact_info',
          value: email,
          context: this.getContext(content, email),
          confidence: 0.95
        });
      });
    }
    
    // Extract phone patterns
    const phoneRegex = /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g;
    const phones = content.match(phoneRegex);
    if (phones) {
      phones.forEach(phone => {
        entities.push({
          type: 'contact_info',
          value: phone,
          context: this.getContext(content, phone),
          confidence: 0.85
        });
      });
    }
    
    // Extract dates
    const dateRegex = /\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})\b/g;
    const dates = content.match(dateRegex);
    if (dates) {
      dates.forEach(date => {
        entities.push({
          type: 'date_time',
          value: date,
          context: this.getContext(content, date),
          confidence: 0.8
        });
      });
    }
    
    // Extract numeric values
    const numberRegex = /\b\d+(?:\.\d+)?\s*(?:dollars?|usd|\$|€|£|%|percent|years?|months?|days?|hours?)\b/gi;
    const numbers = content.match(numberRegex);
    if (numbers) {
      numbers.forEach(num => {
        entities.push({
          type: 'numeric_value',
          value: num,
          context: this.getContext(content, num),
          confidence: 0.9
        });
      });
    }
    
    return entities;
  }
  
  private generateQuestions(
    content: string,
    documentType: DocumentType,
    domain: Domain,
    entities: ExtractedEntity[],
    options?: AnalyzeOptions
  ): SuggestedQuestion[] {
    const questions: SuggestedQuestion[] = [];
    let orderIndex = 0;
    
    // Add domain-specific questions
    const domainQuestions = this.getDomainSpecificQuestions(domain, documentType);
    questions.push(...domainQuestions.filter(q => q.question).map(q => ({ ...q, order: orderIndex++ }) as SuggestedQuestion));
    
    // Add document type specific questions
    const typeQuestions = this.getDocumentTypeQuestions(documentType);
    questions.push(...typeQuestions.filter(q => q.question).map(q => ({ ...q, order: orderIndex++ }) as SuggestedQuestion));
    
    // Analyze content for implicit questions
    const implicitQuestions = this.extractImplicitQuestions(content, entities);
    questions.push(...implicitQuestions.filter(q => q.question).map(q => ({ ...q, order: orderIndex++ }) as SuggestedQuestion));
    
    // Remove redundant questions
    const uniqueQuestions = this.removeRedundancy(questions);
    
    // Reorder for logical flow
    return this.optimizeQuestionFlow(uniqueQuestions);
  }
  
  private getDomainSpecificQuestions(domain: Domain, documentType: DocumentType): Partial<SuggestedQuestion>[] {
    const questions: Partial<SuggestedQuestion>[] = [];
    
    switch (domain) {
      case 'healthcare':
        questions.push(
          {
            question: "What is your full name?",
            fieldType: 'text',
            required: true,
            category: 'identification',
            rationale: 'Essential for patient identification'
          },
          {
            question: "What is your date of birth?",
            fieldType: 'date',
            required: true,
            category: 'identification',
            rationale: 'Required for medical records'
          },
          {
            question: "Do you have any allergies?",
            fieldType: 'textarea',
            required: false,
            placeholder: 'Please list any allergies to medications, foods, or other substances',
            category: 'demographic',
            rationale: 'Critical for patient safety'
          }
        );
        break;
        
      case 'education':
        questions.push(
          {
            question: "What is your student ID?",
            fieldType: 'text',
            required: true,
            category: 'identification',
            rationale: 'Primary identifier in educational systems'
          },
          {
            question: "Which program are you applying to?",
            fieldType: 'select',
            required: true,
            category: 'preference',
            rationale: 'Determines application routing'
          }
        );
        break;
        
      // Add more domain-specific patterns...
    }
    
    return questions;
  }
  
  private getDocumentTypeQuestions(documentType: DocumentType): Partial<SuggestedQuestion>[] {
    const questions: Partial<SuggestedQuestion>[] = [];
    
    switch (documentType) {
      case 'registration_form':
        questions.push(
          {
            question: "Email address",
            fieldType: 'email',
            required: true,
            category: 'contact',
            rationale: 'Primary contact and login credential'
          },
          {
            question: "Create a password",
            fieldType: 'password',
            required: true,
            validation: { type: 'length', value: { min: 8 }, message: 'Password must be at least 8 characters' },
            category: 'identification',
            rationale: 'Account security'
          }
        );
        break;
        
      case 'feedback_form':
        questions.push(
          {
            question: "How would you rate your overall experience?",
            fieldType: 'radio',
            options: ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'],
            required: true,
            category: 'opinion',
            rationale: 'Primary satisfaction metric'
          },
          {
            question: "What could we improve?",
            fieldType: 'textarea',
            required: false,
            placeholder: 'Share your suggestions...',
            category: 'opinion',
            rationale: 'Actionable feedback collection'
          }
        );
        break;
        
      // Add more document type patterns...
    }
    
    return questions;
  }
  
  private extractImplicitQuestions(content: string, entities: ExtractedEntity[]): Partial<SuggestedQuestion>[] {
    const questions: Partial<SuggestedQuestion>[] = [];
    const contentLower = content.toLowerCase();
    
    // Look for question indicators in content
    const questionPatterns = [
      { pattern: /(?:need|require|collect)\s+(?:your\s+)?(\w+)/gi, category: 'identification' as QuestionCategory },
      { pattern: /(?:how many|number of)\s+(\w+)/gi, category: 'quantitative' as QuestionCategory },
      { pattern: /(?:when|what date)\s+(?:will|do|did)\s+(?:you\s+)?(\w+)/gi, category: 'temporal' as QuestionCategory },
      { pattern: /(?:select|choose)\s+(?:your\s+)?(\w+)/gi, category: 'preference' as QuestionCategory }
    ];
    
    questionPatterns.forEach(({ pattern, category }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const subject = match[1];
        questions.push({
          question: `What is your ${subject}?`,
          fieldType: this.inferFieldType(subject),
          required: contentLower.includes('required') || contentLower.includes('must'),
          category,
          rationale: `Extracted from content: "${match[0]}"`
        });
      }
    });
    
    return questions;
  }
  
  private inferFieldType(subject: string): FieldType {
    const lowerSubject = subject.toLowerCase();
    
    for (const mapping of FIELD_TYPE_PATTERNS) {
      if (typeof mapping.pattern === 'string' 
        ? lowerSubject.includes(mapping.pattern)
        : mapping.pattern.test(lowerSubject)) {
        return mapping.suggestedType;
      }
    }
    
    return 'text';
  }
  
  private removeRedundancy(questions: SuggestedQuestion[]): SuggestedQuestion[] {
    const seen = new Set<string>();
    const uniqueQuestions: SuggestedQuestion[] = [];
    
    for (const question of questions) {
      const normalizedQuestion = question.question.toLowerCase().replace(/[^\w\s]/g, '');
      const key = `${normalizedQuestion}_${question.fieldType}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        uniqueQuestions.push(question);
      }
    }
    
    return uniqueQuestions;
  }
  
  private optimizeQuestionFlow(questions: SuggestedQuestion[]): SuggestedQuestion[] {
    // Group by category for logical flow
    const categoryOrder: QuestionCategory[] = [
      'identification',
      'contact',
      'demographic',
      'temporal',
      'preference',
      'quantitative',
      'experience',
      'opinion',
      'additional_info',
      'consent'
    ];
    
    const grouped = questions.reduce((acc, q) => {
      const category = q.category || 'additional_info';
      if (!acc[category]) acc[category] = [];
      acc[category].push(q);
      return acc;
    }, {} as Record<QuestionCategory, SuggestedQuestion[]>);
    
    // Reorder based on logical flow
    let orderIndex = 0;
    const reordered: SuggestedQuestion[] = [];
    
    for (const category of categoryOrder) {
      if (grouped[category]) {
        grouped[category].forEach(q => {
          reordered.push({ ...q, order: orderIndex++ });
        });
      }
    }
    
    return reordered;
  }
  
  private identifyRelationships(questions: SuggestedQuestion[]): EntityRelationship[] {
    const relationships: EntityRelationship[] = [];
    
    // Identify conditional relationships
    questions.forEach((q, i) => {
      // Check if this question mentions another question
      questions.forEach((otherQ, j) => {
        if (i !== j) {
          const qText = q.question.toLowerCase();
          const otherQKeywords = otherQ.question.toLowerCase().split(' ')
            .filter(word => word.length > 3);
          
          if (otherQKeywords.some(keyword => qText.includes(keyword))) {
            relationships.push({
              from: String(j),
              to: String(i),
              type: 'follows'
            });
          }
        }
      });
      
      // Group related categories
      if (q.category === 'contact' && questions.some(oq => oq.category === 'identification')) {
        const identQ = questions.find(oq => oq.category === 'identification');
        if (identQ) {
          relationships.push({
            from: String(questions.indexOf(identQ)),
            to: String(i),
            type: 'grouped_with'
          });
        }
      }
    });
    
    return relationships;
  }
  
  private calculateConfidence(entities: ExtractedEntity[], questions: SuggestedQuestion[]): number {
    if (questions.length === 0) return 0;
    
    const entityConfidence = entities.reduce((sum, e) => sum + e.confidence, 0) / Math.max(entities.length, 1);
    const questionCoverage = Math.min(questions.length / 10, 1); // Assume 10 questions is good coverage
    const hasRequiredFields = questions.some(q => q.required) ? 0.2 : 0;
    
    return Math.min((entityConfidence * 0.4) + (questionCoverage * 0.4) + hasRequiredFields, 1);
  }
  
  private generateSummary(content: string, documentType: DocumentType, domain: Domain): string {
    const words = content.split(/\s+/).length;
    return `Analyzed ${words} words. Identified as ${documentType.replace('_', ' ')} in ${domain} domain.`;
  }
  
  private getContext(content: string, value: string, windowSize: number = 50): string {
    const index = content.indexOf(value);
    if (index === -1) return '';
    
    const start = Math.max(0, index - windowSize);
    const end = Math.min(content.length, index + value.length + windowSize);
    
    return content.substring(start, end).trim();
  }
  
  private detectLanguage(content: string): string {
    // Simplified language detection - in production, use a proper library
    const languagePatterns: Record<string, RegExp[]> = {
      'en': [/\b(the|is|are|was|were|been|have|has|had)\b/gi],
      'es': [/\b(el|la|los|las|es|son|está|están)\b/gi],
      'fr': [/\b(le|la|les|est|sont|être|avoir)\b/gi],
      'de': [/\b(der|die|das|ist|sind|haben|hatte)\b/gi]
    };
    
    let bestMatch = 'en';
    let highestScore = 0;
    
    for (const [lang, patterns] of Object.entries(languagePatterns)) {
      const score = patterns.reduce((sum, pattern) => {
        const matches = content.match(pattern);
        return sum + (matches ? matches.length : 0);
      }, 0);
      
      if (score > highestScore) {
        highestScore = score;
        bestMatch = lang;
      }
    }
    
    return bestMatch;
  }
}

export interface AnalyzeOptions {
  maxQuestions?: number;
  includeOptionalFields?: boolean;
  targetAudience?: 'general' | 'professional' | 'academic' | 'medical';
  formComplexity?: 'simple' | 'moderate' | 'complex';
}

// Export singleton instance
export const contentAnalyzer = new ContentAnalyzer();

