import { NextResponse } from "next/server";
import { getAICompletion } from "@/lib/ai-provider";
import { contentAnalyzer, ContentAnalysis, SuggestedQuestion, FieldType } from "@/lib/content-analyzer";
import { generateFormDynamically } from "@/lib/dynamic-content-analyzer";
import { generateWithMultipleModels, MultiModelConfig } from "@/lib/multi-model-analyzer";

export const runtime = "nodejs";

interface EnhancedGenerationRequest {
  content: string;
  sourceType?: 'text' | 'voice' | 'json' | 'document' | 'form_scan';
  userContext?: string; // Additional context from user
  useDynamicAnalysis?: boolean; // Use new dynamic AI-driven approach
  useMultiModel?: boolean; // Use multiple AI models for enhanced intelligence
  multiModelConfig?: {
    useEnsemble?: boolean; // Get multiple opinions
    validateOutput?: boolean; // Validate with second model
    enableRefinement?: boolean; // Refine based on validation
  };
  options?: {
    maxQuestions?: number;
    includeOptionalFields?: boolean;
    targetAudience?: 'general' | 'professional' | 'academic' | 'medical';
    formComplexity?: 'simple' | 'moderate' | 'complex';
  };
}

interface Field {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
  conditionalLogic?: Array<{
    id: string;
    sourceFieldId?: string;
    condition?: string;
    value?: string;
    action?: string;
    nested?: Array<{
      condition: string;
      value: string;
      action: string;
    }>;
  }>;
  order?: number;
}

/**
 * Enhanced Form Generation API
 * Uses dynamic AI-driven analysis for flexible, adaptive form generation
 */
export async function POST(req: Request) {
  try {
    const body = await req.json() as EnhancedGenerationRequest;
    const { 
      content, 
      sourceType = 'text', 
      userContext,
      useDynamicAnalysis = true,
      useMultiModel = false, // Multi-model approach (opt-in for now)
      multiModelConfig,
      options 
    } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: "Invalid content provided" },
        { status: 400 }
      );
    }

    // Use multi-model intelligence for maximum accuracy
    if (useMultiModel) {
      const config: MultiModelConfig = {
        complexity: options?.formComplexity,
        useEnsemble: multiModelConfig?.useEnsemble ?? true,
        validateOutput: multiModelConfig?.validateOutput ?? true,
        enableRefinement: multiModelConfig?.enableRefinement ?? true,
      };

      const { form, analysis } = await generateWithMultipleModels(
        content,
        userContext,
        config
      );

      return NextResponse.json({
        title: form.title,
        fields: form.fields.map((f: Field, idx: number) => ({
          id: f.id || `field_${Date.now()}_${idx}`,
          label: f.label,
          type: f.type,
          required: f.required !== false,
          placeholder: f.placeholder,
          helpText: f.helpText,
          options: f.options,
          validation: f.validation,
          order: f.order || idx,
          conditionalLogic: f.conditionalLogic || []
        })),
        analysis: {
          documentType: analysis.primaryAnalysis?.metadata?.contentType || 'general',
          domain: analysis.primaryAnalysis?.metadata?.domain || 'general',
          confidence: Math.max(...Object.values(analysis.modelConfidence)),
          summary: `Multi-model analysis (${Object.keys(analysis.modelConfidence).length} models used)`,
          understanding: analysis.primaryAnalysis?.understanding,
          suggestions: analysis.validationResult?.suggestions || [],
          multiModel: {
            modelsUsed: Object.keys(analysis.modelConfidence),
            consensus: analysis.consensus,
            validation: analysis.validationResult,
            selectedModel: analysis.selectedModel
          }
        }
      });
    }

    // Use dynamic AI-driven analysis (flexible and adaptive)
    if (useDynamicAnalysis) {
      const { analysis, form } = await generateFormDynamically(content, userContext);
      
      return NextResponse.json({
        title: form.title,
        fields: form.fields.map((f, idx) => ({
          id: f.id || `field_${Date.now()}_${idx}`,
          label: f.label,
          type: f.type,
          required: f.required !== false,
          placeholder: f.placeholder,
          helpText: f.helpText,
          options: f.options,
          validation: f.validation,
          order: f.order || idx,
          conditionalLogic: f.conditionalLogic || []
        })),
        analysis: {
          documentType: analysis.metadata.contentType,
          domain: analysis.metadata.domain,
          confidence: analysis.metadata.confidence,
          summary: `${analysis.understanding.purpose}. Complexity: ${analysis.metadata.complexity}`,
          understanding: analysis.understanding,
          suggestions: analysis.metadata.suggestions
        }
      });
    }

    // Fallback to rule-based analysis (legacy)
    const analysis = await contentAnalyzer.analyze(content, options);
    const enhancedPrompt = buildEnhancedPrompt(content, analysis, sourceType);
    
    // Use multi-provider AI system (Cohere prioritized for structured JSON generation)
    const aiResponseObj = await getAICompletion({
      messages: [
        {
          role: "system",
          content: getEnhancedSystemPrompt(analysis, sourceType)
        },
        {
          role: "user",
          content: enhancedPrompt
        }
      ],
      temperature: 0.3,
      maxTokens: 3000,
      responseFormat: "json",
    });

    const aiResponse = aiResponseObj.content || "{}";
    console.log(`Enhanced form generated using ${aiResponseObj.provider} AI provider`);
    const generatedForm = JSON.parse(aiResponse) as { title: string; fields: Field[] };
    const enhancedFields = mergeFieldSuggestions(
      generatedForm.fields,
      analysis.suggestedQuestions,
      analysis
    );
    const fieldsWithLogic = applyRelationshipLogic(enhancedFields, analysis);

    return NextResponse.json({
      title: generatedForm.title || generateSmartTitle(analysis),
      fields: fieldsWithLogic,
      analysis: {
        documentType: analysis.documentType,
        domain: analysis.domain,
        confidence: analysis.confidence,
        summary: analysis.summary
      }
    });
  } catch (error) {
    console.error("Enhanced form generation error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate form";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

function getEnhancedSystemPrompt(analysis: ContentAnalysis, sourceType: string): string {
  return `You are an expert form designer with deep knowledge of UX, data collection best practices, and domain-specific requirements.

CONTEXT:
- Document Type: ${analysis.documentType}
- Domain: ${analysis.domain}
- Language: ${analysis.language}
- Source Type: ${sourceType}

YOUR TASK:
Generate an intelligent form that:
1. Captures all necessary information from the source content
2. Uses appropriate field types based on data being collected
3. Groups related questions logically
4. Avoids redundancy - don't ask for information already in the source
5. Adapts to the specific domain and document type
6. Provides helpful guidance through placeholders and help text

INTELLIGENT FIELD GENERATION RULES:

1. FIELD TYPE SELECTION:
- Email addresses → type: "email"
- Phone numbers → type: "tel"
- URLs/websites → type: "url"
- Dates → type: "date"
- Times → type: "time"
- Numbers/quantities → type: "number" with appropriate min/max
- Long text (>50 chars expected) → type: "textarea"
- Single choice from few options (2-5) → type: "radio"
- Single choice from many options (>5) → type: "select"
- Multiple choices → type: "checkbox"
- File uploads → type: "file"
- Passwords → type: "password" with validation
- Payments/donations → type: "payment" with amount, currency, description

2. DOMAIN-SPECIFIC ADAPTATIONS:
${getDomainSpecificRules(analysis.domain)}

3. SMART DEFAULTS:
- Required fields: Only mark truly essential fields as required
- Placeholders: Provide examples, not just repeat the label
- Help text: Add clarification for complex or ambiguous fields
- Validation: Include appropriate patterns/rules based on field type

4. QUESTION FLOW:
- Start with identification/basic info
- Group related fields together
- Place optional fields toward the end
- End with consent/agreement fields if needed

JSON STRUCTURE:
{
  "title": "Clear, descriptive form title based on content analysis",
  "fields": [
    {
      "id": "semantic_field_id",
      "label": "Clear question or label",
      "type": "appropriate_field_type",
      "required": true|false,
      "placeholder": "Helpful example (optional)",
      "helpText": "Additional guidance (optional)",
      "options": ["for", "select", "radio", "checkbox", "only"],
      "validation": {
        "pattern": "regex_if_needed",
        "min": number_if_applicable,
        "max": number_if_applicable,
        "minLength": number_if_applicable,
        "maxLength": number_if_applicable
      },
      "paymentConfig": { // for type: "payment"
        "amount": number, // in cents
        "currency": "usd",
        "description": "Payment description"
      },
      "order": sequential_number
    }
  ]
}

Remember: Create forms that feel natural and intelligent, as if designed by a domain expert who understands the user's needs.`;
}

function buildEnhancedPrompt(
  content: string,
  analysis: ContentAnalysis,
  sourceType: string
): string {
  const entitySummary = analysis.extractedEntities
    .map(e => `- ${e.type}: ${e.value}`)
    .join('\n');

  const suggestedQuestionsSummary = analysis.suggestedQuestions
    .slice(0, 5)
    .map(q => `- ${q.question} (${q.fieldType})`)
    .join('\n');

  return `Analyze this ${sourceType} content and generate an intelligent form:

CONTENT:
"${content}"

ANALYSIS RESULTS:
Document Type: ${analysis.documentType}
Domain: ${analysis.domain}
Confidence: ${(analysis.confidence * 100).toFixed(1)}%

EXTRACTED ENTITIES:
${entitySummary || 'No specific entities found'}

SUGGESTED QUESTIONS (Top 5):
${suggestedQuestionsSummary}

REQUIREMENTS:
1. Generate a form that captures all relevant information from this content
2. Use the document type (${analysis.documentType}) to guide form structure
3. Apply ${analysis.domain} domain best practices
4. Don't ask for information already present in the content
5. Create logical question flow with appropriate grouping
6. Use smart field types based on the data being collected
7. Add helpful placeholders and validation where appropriate

Generate a JSON response with a clear title and well-structured fields.`;
}

function getDomainSpecificRules(domain: string): string {
  const rules: Record<string, string> = {
    healthcare: `
- Include patient identification fields (name, DOB, ID)
- Add medical history sections with appropriate privacy considerations
- Use specific medical terminology in labels
- Include consent and HIPAA acknowledgment fields
- Add emergency contact information`,
    education: `
- Include student/applicant identification
- Add academic background sections
- Use education-specific terminology
- Include transcript/document upload options
- Add program/course selection fields`,
    business: `
- Include company/organization fields
- Add professional information sections
- Use business terminology
- Include budget/financial fields with number validation
- Add project/department selection`,
    government: `
- Include official identification fields
- Add residency/citizenship status
- Use formal language in labels
- Include document/permit numbers
- Add legal acknowledgments`,
    finance: `
- Include account/identification numbers
- Add financial information with security in mind
- Use precise financial terminology
- Include amount fields with currency formatting
- Add security questions`,
    legal: `
- Include party identification
- Add case/matter references
- Use precise legal terminology
- Include signature and witness fields
- Add jurisdiction selections`,
    retail: `
- Include customer information
- Add product/order details
- Use shopping-friendly terminology
- Include quantity and pricing fields
- Add shipping/billing addresses`,
    general: `
- Use clear, universal language
- Include standard contact fields
- Add common identification elements
- Keep terminology simple
- Focus on essential information`
  };

  return rules[domain] || rules.general;
}

function mergeFieldSuggestions(
  aiFields: Field[],
  suggestedQuestions: SuggestedQuestion[],
  analysis: ContentAnalysis
): Field[] {
  const mergedFields: Field[] = [];
  const processedQuestions = new Set<string>();

  // First, process AI-generated fields
  aiFields.forEach(field => {
    const enhancedField = { ...field };
    
    // Find matching suggested question
    const matchingQuestion = suggestedQuestions.find(q => 
      normalizeQuestion(q.question) === normalizeQuestion(field.label) ||
      q.fieldType === mapFieldType(field.type)
    );

    if (matchingQuestion) {
      // Enhance with suggestion details
      enhancedField.helpText = enhancedField.helpText || matchingQuestion.helpText;
      enhancedField.placeholder = enhancedField.placeholder || matchingQuestion.placeholder;
      if (matchingQuestion.validation && typeof matchingQuestion.validation === 'object') {
        // Only merge compatible validation properties
        const validation = matchingQuestion.validation as {pattern?: string; min?: number; max?: number; minLength?: number; maxLength?: number};
        enhancedField.validation = { ...enhancedField.validation, ...validation };
      }
      processedQuestions.add(matchingQuestion.question);
    }

    mergedFields.push(enhancedField);
  });

  // Add suggested questions not covered by AI
  suggestedQuestions
    .filter(q => !processedQuestions.has(q.question))
    .forEach((question, index) => {
      // Convert validation if present
      const validation = question.validation && typeof question.validation === 'object'
        ? question.validation as {pattern?: string; min?: number; max?: number; minLength?: number; maxLength?: number}
        : undefined;
      
      mergedFields.push({
        id: `field_${Date.now()}_${index}`,
        label: question.question,
        type: question.fieldType,
        required: question.required,
        placeholder: question.placeholder,
        helpText: question.helpText,
        options: question.options,
        validation,
        order: mergedFields.length + index
      });
    });

  // Sort by logical order
  return mergedFields.sort((a, b) => (a.order || 0) - (b.order || 0));
}

function applyRelationshipLogic(
  fields: Field[],
  analysis: ContentAnalysis
): Field[] {
  return fields.map((field, index) => {
    const relationships = analysis.relationships.filter(
      rel => rel.to === String(index)
    );

    if (relationships.length > 0) {
      field.conditionalLogic = relationships.map(rel => ({
        id: `condition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sourceFieldId: fields[parseInt(rel.from)]?.id,
        condition: rel.type === 'depends_on' ? 'equals' : 'not_empty',
        value: rel.type === 'depends_on' ? 'yes' : undefined,
        action: 'show'
      }));
    }

    return field;
  });
}

// Update interface to include nested
interface Field {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
  conditionalLogic?: Array<{
    id: string;
    sourceFieldId?: string;
    condition?: string;
    value?: string;
    action?: string;
    nested?: Array<{
      condition: string;
      value: string;
      action: string;
    }>;
  }>;
  order?: number;
}

// Remove metadata check to avoid type error
function generateAdvancedConditionalLogic(
  fields: Field[],
  analysis: ContentAnalysis
): Field[] {
  // Enhanced logic: Add nested conditions and multiple actions
  return fields.map((field, index) => {
    const enhancedField = { ...field };
    const related = analysis.relationships.filter(rel => rel.to === String(index));

    if (related.length > 0) {
      enhancedField.conditionalLogic = related.map(rel => {
        const baseCondition: {
          id: string;
          sourceFieldId?: string;
          condition: string;
          value?: string;
          action: string;
          nested?: Array<{
            condition: string;
            value: string;
            action: string;
          }>;
        } = {
          id: `adv_condition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sourceFieldId: fields[parseInt(rel.from)]?.id,
          condition: getAdvancedCondition(rel.type),
          value: getConditionValue(rel.type),
          action: getPrimaryAction(rel.type)
        };

        // TODO: Add nested conditions based on analysis complexity when integrating DynamicAnalysis
        // For now, add a default nested example for demonstration
        baseCondition.nested = [{
          condition: 'greater_than',
          value: '18',
          action: 'require'
        }];

        return baseCondition;
      });
    }

    return enhancedField;
  });
}

function getAdvancedCondition(type: string): string {
  const conditions: Record<string, string> = {
    depends_on: 'equals',
    requires: 'not_empty',
    validates: 'matches_pattern',
    thresholds: 'greater_than'
  };
  return conditions[type] || 'equals';
}

function getConditionValue(type: string): string | undefined {
  const values: Record<string, string> = {
    depends_on: 'yes',
    thresholds: '0'
  };
  return values[type];
}

function getPrimaryAction(type: string): string {
  const actions: Record<string, string> = {
    depends_on: 'show',
    requires: 'require',
    validates: 'validate'
  };
  return actions[type] || 'show';
}

function generateSmartTitle(analysis: ContentAnalysis): string {
  const typeNames: Record<string, string> = {
    registration_form: 'Registration Form',
    survey: 'Survey',
    medical_form: 'Medical Information Form',
    application: 'Application Form',
    feedback_form: 'Feedback Form',
    contact_form: 'Contact Form',
    booking_form: 'Booking Form',
    questionnaire: 'Questionnaire',
    assessment: 'Assessment Form',
    order_form: 'Order Form',
    consent_form: 'Consent Form',
    general: 'Form'
  };

  const domainAdjectives: Record<string, string> = {
    healthcare: 'Medical',
    education: 'Academic',
    business: 'Business',
    government: 'Official',
    finance: 'Financial',
    legal: 'Legal',
    retail: 'Customer',
    general: ''
  };

  const domainAdj = domainAdjectives[analysis.domain] || '';
  const typeName = typeNames[analysis.documentType] || 'Form';

  return `${domainAdj} ${typeName}`.trim();
}

function normalizeQuestion(question: string): string {
  return question.toLowerCase().replace(/[^\w\s]/g, '').trim();
}

function mapFieldType(fieldType: string): FieldType {
  const typeMap: Record<string, FieldType> = {
    'text': 'text',
    'email': 'email',
    'tel': 'tel',
    'phone': 'tel',
    'number': 'number',
    'date': 'date',
    'time': 'time',
    'datetime': 'datetime',
    'textarea': 'textarea',
    'select': 'select',
    'dropdown': 'select',
    'radio': 'radio',
    'checkbox': 'checkbox',
    'file': 'file',
    'upload': 'file',
    'range': 'range',
    'slider': 'range',
    'color': 'color',
    'url': 'url',
    'password': 'password'
  };

  return (typeMap[fieldType.toLowerCase()] || 'text') as FieldType;
}
