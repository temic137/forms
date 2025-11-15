/**
 * Dynamic Content Analyzer - AI-driven flexible content analysis
 * Uses AI to understand context organically without rigid rules
 */

import { getGroqClient } from './groq';

export interface DynamicAnalysis {
  understanding: ContentUnderstanding;
  questions: DynamicQuestion[];
  metadata: AnalysisMetadata;
}

export interface ContentUnderstanding {
  purpose: string; // What is this content trying to accomplish?
  audience: string; // Who is this for?
  context: string; // What's the broader context?
  keyTopics: string[]; // Main topics identified
  dataPoints: DataPoint[]; // Specific data points found or needed
  tone: string; // Professional, casual, medical, etc.
}

export interface DataPoint {
  name: string;
  description: string;
  alreadyPresent: boolean;
  dataType: string; // Inferred from context
  importance: 'critical' | 'important' | 'optional';
  reasoning: string;
}

export interface DynamicQuestion {
  question: string;
  rationale: string; // Why this question is needed
  suggestedFieldType: string;
  validationSuggestions?: string;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  required: boolean;
  reasoning: string; // Why this field type and configuration
  relatesTo?: string[]; // Related questions for conditional logic
  category: string; // Dynamically determined category
}

export interface AnalysisMetadata {
  contentType: string; // Dynamically identified
  domain: string; // Organically detected
  confidence: number;
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedFieldCount: number;
  suggestions: string[]; // AI suggestions for improvement
}

export class DynamicContentAnalyzer {
  /**
   * Performs AI-driven content analysis without rigid rules
   */
  async analyze(content: string, userContext?: string): Promise<DynamicAnalysis> {
    const groq = getGroqClient();

    const analysisPrompt = this.buildDynamicAnalysisPrompt(content, userContext);

    try {
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.4, // Balanced for creativity and consistency
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: this.getFlexibleSystemPrompt()
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ]
      });

      const result = JSON.parse(response.choices[0]?.message?.content || "{}");
      
      return this.normalizeAnalysis(result);
    } catch (error) {
      console.error("Dynamic analysis error:", error);
      throw error;
    }
  }

  private getFlexibleSystemPrompt(): string {
    return `You are an intelligent form design assistant with deep understanding of human communication, data collection, and user experience.

Your role is to UNDERSTAND content organically and generate appropriate form questions, NOT to follow rigid rules.

CORE PRINCIPLES:

1. **Understand, Don't Match**: Read the content like a human would. Understand the intent, context, and purpose.

2. **Be Adaptive**: Every piece of content is unique. Don't force patterns - discover them naturally.

3. **Think Critically**: Ask yourself:
   - What is the user trying to accomplish?
   - What information do they need to collect?
   - What information is already present?
   - What would make sense to ask?

4. **Be Creative**: Don't limit yourself to predefined categories. If content suggests a unique approach, take it.

5. **Consider Context**: The same words mean different things in different contexts. A "patient" in healthcare is different from a "patient" customer.

6. **Optimize Flow**: Think about the user journey. What feels natural? What order makes sense?

7. **Avoid Redundancy Intelligently**: Don't ask for information that's already clear, but DO ask follow-up questions when it makes sense.

RESPONSE FORMAT (flexible JSON):

{
  "understanding": {
    "purpose": "What this content is trying to accomplish",
    "audience": "Who this is for",
    "context": "The broader context",
    "keyTopics": ["topic1", "topic2"],
    "dataPoints": [
      {
        "name": "data point name",
        "description": "what this represents",
        "alreadyPresent": true/false,
        "dataType": "inferred type",
        "importance": "critical/important/optional",
        "reasoning": "why this matters"
      }
    ],
    "tone": "overall tone/style"
  },
  "questions": [
    {
      "question": "The actual question to ask",
      "rationale": "Why this question is necessary",
      "suggestedFieldType": "text/email/select/etc",
      "validationSuggestions": "any validation needed",
      "placeholder": "helpful example",
      "helpText": "additional guidance if needed",
      "options": ["if", "applicable"],
      "required": true/false,
      "reasoning": "why this field type and configuration",
      "relatesTo": ["related question indices"],
      "category": "dynamically determined category"
    }
  ],
  "metadata": {
    "contentType": "what you identify this as",
    "domain": "what domain/industry",
    "confidence": 0.0-1.0,
    "complexity": "simple/moderate/complex",
    "estimatedFieldCount": number,
    "suggestions": ["suggestions for improvement"]
  }
}

IMPORTANT:
- Don't force content into predefined buckets
- Be flexible with field types - suggest what makes sense
- Think about real user experience
- Consider cultural and contextual nuances
- Adapt your strategy to the content, not vice versa
- If something is unclear, acknowledge it in metadata.suggestions`;
  }

  private buildDynamicAnalysisPrompt(content: string, userContext?: string): string {
    return `Analyze this content and help me design the perfect form for it.

CONTENT TO ANALYZE:
"""
${content}
"""

${userContext ? `ADDITIONAL CONTEXT FROM USER:\n${userContext}\n` : ''}

YOUR TASK:
1. Read and understand this content deeply
2. Identify what information needs to be collected
3. Determine what questions would make sense to ask
4. Suggest appropriate field types based on the data
5. Consider the user journey and flow
6. Think about validation and help text that would be useful

THINK STEP BY STEP:
- What is the core purpose here?
- Who is the intended audience?
- What data points are mentioned or implied?
- What's already present vs what needs to be asked?
- What field types would work best for each piece of information?
- How should questions flow logically?
- What would make the form user-friendly?

Generate a comprehensive analysis following the JSON structure. Be thorough in your reasoning.`;
  }

  private normalizeAnalysis(rawAnalysis: any): DynamicAnalysis {
    return {
      understanding: {
        purpose: rawAnalysis.understanding?.purpose || "Unknown purpose",
        audience: rawAnalysis.understanding?.audience || "General audience",
        context: rawAnalysis.understanding?.context || "",
        keyTopics: rawAnalysis.understanding?.keyTopics || [],
        dataPoints: rawAnalysis.understanding?.dataPoints || [],
        tone: rawAnalysis.understanding?.tone || "neutral"
      },
      questions: (rawAnalysis.questions || []).map((q: any, idx: number) => ({
        question: q.question || "Untitled question",
        rationale: q.rationale || "",
        suggestedFieldType: q.suggestedFieldType || "text",
        validationSuggestions: q.validationSuggestions,
        placeholder: q.placeholder,
        helpText: q.helpText,
        options: q.options,
        required: q.required !== false, // Default to true
        reasoning: q.reasoning || "",
        relatesTo: q.relatesTo || [],
        category: q.category || "general"
      })),
      metadata: {
        contentType: rawAnalysis.metadata?.contentType || "general",
        domain: rawAnalysis.metadata?.domain || "general",
        confidence: rawAnalysis.metadata?.confidence || 0.5,
        complexity: rawAnalysis.metadata?.complexity || "moderate",
        estimatedFieldCount: rawAnalysis.metadata?.estimatedFieldCount || 0,
        suggestions: rawAnalysis.metadata?.suggestions || []
      }
    };
  }
}

/**
 * Two-stage dynamic generation: Analysis + Form Creation
 */
export async function generateFormDynamically(
  content: string,
  userContext?: string
): Promise<{
  analysis: DynamicAnalysis;
  form: { title: string; fields: any[] };
}> {
  const analyzer = new DynamicContentAnalyzer();
  
  // Stage 1: Understand the content
  const analysis = await analyzer.analyze(content, userContext);
  
  // Stage 2: Generate form based on understanding
  const form = await generateFormFromAnalysis(content, analysis);
  
  return { analysis, form };
}

async function generateFormFromAnalysis(
  content: string,
  analysis: DynamicAnalysis
): Promise<{ title: string; fields: any[] }> {
  const groq = getGroqClient();

  const formPrompt = `Based on this content analysis, generate a complete form.

ORIGINAL CONTENT:
"""
${content}
"""

ANALYSIS:
- Purpose: ${analysis.understanding.purpose}
- Audience: ${analysis.understanding.audience}
- Context: ${analysis.understanding.context}
- Key Topics: ${analysis.understanding.keyTopics.join(", ")}
- Tone: ${analysis.understanding.tone}

DATA POINTS IDENTIFIED:
${analysis.understanding.dataPoints.map(dp => 
  `- ${dp.name}: ${dp.description} (${dp.importance}, ${dp.alreadyPresent ? 'present' : 'needed'})`
).join('\n')}

SUGGESTED QUESTIONS:
${analysis.questions.map((q, i) => 
  `${i + 1}. ${q.question} (${q.suggestedFieldType}) - ${q.rationale}`
).join('\n')}

GENERATE A FORM with:
- A clear, concise title that reflects the purpose
- Fields that match the suggested questions
- Appropriate field types and validation
- Logical ordering
- Helpful placeholders and help text
- Smart required/optional designation

JSON FORMAT:
{
  "title": "Form Title",
  "fields": [
    {
      "id": "unique_id",
      "label": "Question/Label",
      "type": "field_type",
      "required": true/false,
      "placeholder": "example",
      "helpText": "guidance",
      "options": ["if applicable"],
      "validation": {
        "pattern": "regex if needed",
        "min": number,
        "max": number,
        "minLength": number,
        "maxLength": number
      },
      "order": sequential_number
    }
  ]
}`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You are a form design expert. Generate clean, user-friendly forms based on content analysis. Return only valid JSON."
      },
      {
        role: "user",
        content: formPrompt
      }
    ]
  });

  const formData = JSON.parse(response.choices[0]?.message?.content || "{}");
  
  return {
    title: formData.title || "Untitled Form",
    fields: formData.fields || []
  };
}

// Export singleton
export const dynamicAnalyzer = new DynamicContentAnalyzer();





