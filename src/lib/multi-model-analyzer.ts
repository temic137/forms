/**
 * Multi-Model Intelligent Analyzer
 * Uses multiple AI models from Groq for superior intelligence
 */

import { getGroqClient } from './groq';

export interface MultiModelConfig {
  useEnsemble?: boolean; // Use multiple models and combine results
  complexity?: 'simple' | 'moderate' | 'complex'; // Auto-selects best model
  validateOutput?: boolean; // Use second model to validate first model's output
  enableRefinement?: boolean; // Use third model to refine results
}

// Groq's available models with their strengths
export const GROQ_MODELS = {
  // Largest, most capable - use for complex analysis
  LLAMA_70B: 'llama-3.3-70b-versatile',
  
  // Fast and efficient - use for simple tasks
  LLAMA_8B: 'llama-3.1-8b-instant',
  
  // Alternative for different perspectives
  MIXTRAL_8X7B: 'mixtral-8x7b-32768',
  
  // Good for JSON and structured outputs
  LLAMA_70B_SPECDEC: 'llama-3.3-70b-specdec',
} as const;

export interface EnhancedAnalysis {
  primaryAnalysis: any;
  validationResult?: ValidationResult;
  refinedAnalysis?: any;
  consensus?: ConsensusResult;
  modelConfidence: Record<string, number>;
  selectedModel: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  confidence: number;
}

export interface ConsensusResult {
  agreedFields: any[];
  conflicts: ConflictDetail[];
  recommendedApproach: string;
  confidenceScore: number;
}

export interface ConflictDetail {
  field: string;
  model1Opinion: string;
  model2Opinion: string;
  resolution: string;
}

export class MultiModelAnalyzer {
  /**
   * Analyzes content using multiple models for enhanced intelligence
   */
  async analyzeWithMultipleModels(
    content: string,
    userContext?: string,
    config: MultiModelConfig = {}
  ): Promise<EnhancedAnalysis> {
    const groq = getGroqClient();
    const complexity = config.complexity || this.detectComplexity(content);

    // Select primary model based on complexity
    const primaryModel = this.selectPrimaryModel(complexity);
    
    console.log(`Using ${primaryModel} for primary analysis (complexity: ${complexity})`);

    // Stage 1: Primary Analysis
    const primaryAnalysis = await this.performPrimaryAnalysis(
      content,
      userContext,
      primaryModel
    );

    const result: EnhancedAnalysis = {
      primaryAnalysis,
      modelConfidence: { [primaryModel]: this.calculateConfidence(primaryAnalysis) },
      selectedModel: primaryModel
    };

    // Stage 2: Ensemble Analysis (if enabled)
    if (config.useEnsemble) {
      const ensembleResult = await this.performEnsembleAnalysis(
        content,
        userContext,
        primaryAnalysis
      );
      result.consensus = ensembleResult.consensus;
      result.modelConfidence = { ...result.modelConfidence, ...ensembleResult.confidence };
    }

    // Stage 3: Validation (if enabled)
    if (config.validateOutput) {
      result.validationResult = await this.validateAnalysis(
        content,
        primaryAnalysis
      );
    }

    // Stage 4: Refinement (if enabled)
    if (config.enableRefinement) {
      result.refinedAnalysis = await this.refineAnalysis(
        content,
        primaryAnalysis,
        result.validationResult
      );
    }

    return result;
  }

  /**
   * Detects content complexity to choose appropriate model
   */
  private detectComplexity(content: string): 'simple' | 'moderate' | 'complex' {
    const length = content.length;
    const sentences = content.split(/[.!?]+/).length;
    const uniqueWords = new Set(content.toLowerCase().split(/\s+/)).size;
    
    // Simple: Short, straightforward
    if (length < 200 && sentences < 5) return 'simple';
    
    // Complex: Long, detailed, multiple topics
    if (length > 1000 || uniqueWords > 200 || sentences > 20) return 'complex';
    
    // Moderate: Everything else
    return 'moderate';
  }

  /**
   * Selects the best primary model based on complexity
   */
  private selectPrimaryModel(complexity: 'simple' | 'moderate' | 'complex'): string {
    switch (complexity) {
      case 'simple':
        return GROQ_MODELS.LLAMA_8B; // Fast for simple tasks
      case 'moderate':
        return GROQ_MODELS.LLAMA_70B_SPECDEC; // Optimized for structured output
      case 'complex':
        return GROQ_MODELS.LLAMA_70B; // Most capable for complex analysis
    }
  }

  /**
   * Performs primary analysis with selected model
   */
  private async performPrimaryAnalysis(
    content: string,
    userContext: string | undefined,
    model: string
  ): Promise<any> {
    const groq = getGroqClient();

    const response = await groq.chat.completions.create({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: this.getPrimaryAnalysisPrompt()
        },
        {
          role: "user",
          content: this.buildAnalysisRequest(content, userContext)
        }
      ]
    });

    return JSON.parse(response.choices[0]?.message?.content || "{}");
  }

  /**
   * Uses multiple models to reach consensus
   */
  private async performEnsembleAnalysis(
    content: string,
    userContext: string | undefined,
    primaryAnalysis: any
  ): Promise<{ consensus: ConsensusResult; confidence: Record<string, number> }> {
    const groq = getGroqClient();
    
    // Use a different model for second opinion
    const secondaryModel = GROQ_MODELS.MIXTRAL_8X7B;
    
    console.log(`Getting second opinion from ${secondaryModel}`);

    const secondaryResponse = await groq.chat.completions.create({
      model: secondaryModel,
      temperature: 0.3, // Lower temperature for consistency
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: this.getSecondOpinionPrompt()
        },
        {
          role: "user",
          content: `Analyze this content and form structure. Provide your independent analysis.

CONTENT:
${content}

${userContext ? `ADDITIONAL CONTEXT: ${userContext}` : ''}

PRIMARY ANALYSIS FROM ANOTHER MODEL:
${JSON.stringify(primaryAnalysis, null, 2)}

Provide your own analysis and note where you agree or disagree.`
        }
      ]
    });

    const secondaryAnalysis = JSON.parse(secondaryResponse.choices[0]?.message?.content || "{}");

    // Combine results
    const consensus = this.buildConsensus(primaryAnalysis, secondaryAnalysis);
    
    return {
      consensus,
      confidence: {
        [secondaryModel]: this.calculateConfidence(secondaryAnalysis)
      }
    };
  }

  /**
   * Validates analysis using a different model
   */
  private async validateAnalysis(
    content: string,
    analysis: any
  ): Promise<ValidationResult> {
    const groq = getGroqClient();
    
    // Use fastest model for validation
    const validatorModel = GROQ_MODELS.LLAMA_8B;
    
    console.log(`Validating with ${validatorModel}`);

    const response = await groq.chat.completions.create({
      model: validatorModel,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a validation expert. Review form analysis and identify issues.

Return JSON:
{
  "isValid": true/false,
  "issues": ["list of problems"],
  "suggestions": ["list of improvements"],
  "confidence": 0.0-1.0
}`
        },
        {
          role: "user",
          content: `Validate this form analysis.

ORIGINAL CONTENT:
${content}

PROPOSED ANALYSIS:
${JSON.stringify(analysis, null, 2)}

Check for:
- Missing critical fields
- Inappropriate field types
- Poor question wording
- Logical flow issues
- Redundancy
- Accessibility concerns`
        }
      ]
    });

    return JSON.parse(response.choices[0]?.message?.content || "{}");
  }

  /**
   * Refines analysis based on validation
   */
  private async refineAnalysis(
    content: string,
    originalAnalysis: any,
    validation?: ValidationResult
  ): Promise<any> {
    if (!validation || validation.isValid) {
      return originalAnalysis; // No refinement needed
    }

    const groq = getGroqClient();
    
    // Use best model for refinement
    const refinerModel = GROQ_MODELS.LLAMA_70B;
    
    console.log(`Refining analysis with ${refinerModel}`);

    const response = await groq.chat.completions.create({
      model: refinerModel,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a form design expert. Refine and improve form analysis based on validation feedback."
        },
        {
          role: "user",
          content: `Improve this form analysis.

ORIGINAL CONTENT:
${content}

CURRENT ANALYSIS:
${JSON.stringify(originalAnalysis, null, 2)}

ISSUES IDENTIFIED:
${validation.issues.join('\n')}

SUGGESTIONS:
${validation.suggestions.join('\n')}

Provide an improved analysis that addresses these issues.`
        }
      ]
    });

    return JSON.parse(response.choices[0]?.message?.content || "{}");
  }

  /**
   * Builds consensus from multiple model outputs
   */
  private buildConsensus(primary: any, secondary: any): ConsensusResult {
    const conflicts: ConflictDetail[] = [];
    const agreedFields: any[] = [];

    // Compare analyses and find agreements/conflicts
    // Simplified for now - would need deep comparison logic
    
    const primaryFields = primary.questions || primary.fields || [];
    const secondaryFields = secondary.questions || secondary.fields || [];

    // Fields both models agree on
    primaryFields.forEach((pField: any) => {
      const match = secondaryFields.find((sField: any) => 
        this.fieldsSimilar(pField, sField)
      );
      if (match) {
        agreedFields.push(pField);
      }
    });

    // Calculate confidence based on agreement
    const agreementRate = primaryFields.length > 0 
      ? agreedFields.length / primaryFields.length 
      : 0;

    return {
      agreedFields,
      conflicts,
      recommendedApproach: agreementRate > 0.7 
        ? "Models largely agree - use primary analysis" 
        : "Models disagree - review both carefully",
      confidenceScore: agreementRate
    };
  }

  /**
   * Checks if two fields are similar
   */
  private fieldsSimilar(field1: any, field2: any): boolean {
    const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '');
    
    const label1 = normalize(field1.label || field1.question || '');
    const label2 = normalize(field2.label || field2.question || '');
    
    // Simple similarity check
    return label1 === label2 || 
           label1.includes(label2) || 
           label2.includes(label1);
  }

  /**
   * Calculates confidence score for an analysis
   */
  private calculateConfidence(analysis: any): number {
    let score = 0.5; // Base score

    // Has title
    if (analysis.title) score += 0.1;
    
    // Has fields/questions
    const fieldCount = (analysis.fields || analysis.questions || []).length;
    if (fieldCount > 0) score += 0.1;
    if (fieldCount > 3) score += 0.1;
    
    // Has understanding
    if (analysis.understanding) score += 0.1;
    
    // Has metadata
    if (analysis.metadata) score += 0.1;

    return Math.min(score, 1.0);
  }

  private getPrimaryAnalysisPrompt(): string {
    return `You are an elite form architect combining expertise in psychometrics, UX design, behavioral psychology, and domain-specific knowledge. Your mission is to create forms that capture MAXIMUM STRATEGIC VALUE.

═══════════════════════════════════════════════════════════════
                    INTELLIGENCE FRAMEWORK
═══════════════════════════════════════════════════════════════

ANALYZE CONTENT FOR:
1. **Type Detection**: Quiz/Test, Survey/Questionnaire, or Data Collection Form
2. **Strategic Purpose**: What decisions will this data inform?
3. **Target Audience**: Who will fill this out? What's their expertise level?
4. **Domain Context**: Industry-specific requirements and terminology
5. **Insight Potential**: What patterns/correlations could be discovered?

FOR QUIZZES/TESTS:
- Generate ACTUAL KNOWLEDGE QUESTIONS (not opinion questions)
- Include multiple difficulty levels
- Use plausible distractors based on common misconceptions
- Provide correct answers with educational explanations
- Test across cognitive levels: recall, understanding, application, analysis

FOR SURVEYS/QUESTIONNAIRES:
- Use validated measurement scales (Likert, NPS, semantic differential)
- Avoid double-barreled and leading questions
- Include both attitude and behavior questions
- Design for statistical analysis capability

FOR DATA FORMS:
- Capture qualifying information
- Enable segmentation and routing
- Add strategic optional fields (source, intent, timeline)

═══════════════════════════════════════════════════════════════
                    OUTPUT STRUCTURE
═══════════════════════════════════════════════════════════════

Return JSON:
{
  "understanding": {
    "purpose": "Strategic explanation of form's value",
    "audience": "Detailed target user description",
    "context": "Broader situational context",
    "keyTopics": ["main", "themes"],
    "tone": "professional/casual/academic/medical",
    "isQuiz": true/false,
    "isSurvey": true/false
  },
  "questions": [
    {
      "question": "Well-crafted question text",
      "fieldType": "optimal field type",
      "required": true/false,
      "rationale": "Strategic purpose",
      "placeholder": "Helpful example",
      "helpText": "Value-adding guidance",
      "options": ["if applicable"],
      "correctAnswer": "for quizzes only",
      "explanation": "for quizzes only",
      "difficultyLevel": "easy/medium/hard"
    }
  ],
  "metadata": {
    "confidence": 0.0-1.0,
    "complexity": "simple/moderate/complex",
    "suggestions": ["improvements"],
    "analyticalValue": "what insights this enables"
  }
}`;
  }

  private getSecondOpinionPrompt(): string {
    return `You are a senior assessment designer and survey methodologist reviewing another expert's work.

YOUR REVIEW CRITERIA:

FOR QUIZZES:
- Are questions testing ACTUAL knowledge or just opinions?
- Are distractors plausible and based on real misconceptions?
- Is difficulty level appropriately varied?
- Are explanations educational and accurate?

FOR SURVEYS:
- Are measurement scales appropriate and validated?
- Are questions free of bias and leading language?
- Will data enable meaningful analysis?
- Are response options exhaustive and mutually exclusive?

FOR ALL FORMS:
- Is the question flow logical?
- Are field types optimal for data collection?
- Is strategic value being captured?
- Are there missing high-value fields?

Provide specific, actionable improvements.`;
  }

  private buildAnalysisRequest(content: string, userContext?: string): string {
    return `Analyze this content for form generation.

CONTENT:
${content}

${userContext ? `ADDITIONAL CONTEXT:\n${userContext}\n` : ''}

Provide comprehensive analysis with reasoning.`;
  }
}

/**
 * Smart form generator using multi-model intelligence
 */
export async function generateWithMultipleModels(
  content: string,
  userContext?: string,
  config: MultiModelConfig = {}
): Promise<{
  form: any;
  analysis: EnhancedAnalysis;
}> {
  const analyzer = new MultiModelAnalyzer();
  
  // Get enhanced analysis from multiple models
  const enhancedAnalysis = await analyzer.analyzeWithMultipleModels(
    content,
    userContext,
    config
  );

  // Use the best result (refined if available, otherwise primary)
  const bestAnalysis = enhancedAnalysis.refinedAnalysis || enhancedAnalysis.primaryAnalysis;

  // Generate final form
  const form = await generateFormFromEnhancedAnalysis(content, bestAnalysis);

  return {
    form,
    analysis: enhancedAnalysis
  };
}

async function generateFormFromEnhancedAnalysis(
  content: string,
  analysis: any
): Promise<any> {
  const groq = getGroqClient();

  const isQuiz = analysis?.understanding?.isQuiz || 
                 content.toLowerCase().includes('quiz') || 
                 content.toLowerCase().includes('test') ||
                 content.toLowerCase().includes('exam');

  const isSurvey = analysis?.understanding?.isSurvey ||
                   content.toLowerCase().includes('survey') ||
                   content.toLowerCase().includes('questionnaire');

  // Use specialized model for final form generation
  const response = await groq.chat.completions.create({
    model: GROQ_MODELS.LLAMA_70B_SPECDEC, // Optimized for structured JSON
    temperature: 0.25,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are generating the final form JSON based on multi-model analysis.

${isQuiz ? `
QUIZ MODE ACTIVE:
- Generate REAL knowledge questions, not opinion questions
- Include quizConfig with correctAnswer, points, explanation for EVERY question
- Use radio for single answer, checkbox for multiple correct answers
- Include quizMode configuration in root
- Vary question difficulty
` : ''}

${isSurvey ? `
SURVEY MODE ACTIVE:
- Use appropriate scales (Likert 5-7 point, NPS 0-10)
- Include a mix of quantitative and qualitative questions
- Add strategic segmentation fields
` : ''}

Return CLEAN, VALID JSON with:
{
  "title": "Strategic title",
  ${isQuiz ? '"quizMode": { "enabled": true, "showScoreImmediately": true, "showCorrectAnswers": true, "showExplanations": true, "passingScore": 70 },' : ''}
  "fields": [
    {
      "id": "semantic_id",
      "label": "Question text",
      "type": "appropriate_type",
      "required": true/false,
      "placeholder": "example",
      "helpText": "guidance",
      "options": ["if applicable"],
      ${isQuiz ? '"quizConfig": { "correctAnswer": "answer", "points": 1-3, "explanation": "why" },' : ''}
      "order": number
    }
  ]
}`
      },
      {
        role: "user",
        content: `Create the final form based on this analysis.

ORIGINAL CONTENT: ${content}

ANALYSIS:
${JSON.stringify(analysis, null, 2)}

Generate a complete form with:
- Proper semantic field IDs
- Optimal field types
- Intelligent validation
- Strategic ordering (essential → insightful → optional)
- For quizzes: Include quizConfig for every question field
- For surveys: Include appropriate measurement scales`
      }
    ]
  });

  return JSON.parse(response.choices[0]?.message?.content || "{}");
}

// Export singleton
export const multiModelAnalyzer = new MultiModelAnalyzer();







