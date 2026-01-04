/**
 * AI Models Configuration & Routing
 * 
 * Multi-model architecture for form generation:
 * - Different models for different tasks (right tool for right job)
 * - Fallback chains for reliability
 * - Rate limit distribution
 */

import Groq from "groq-sdk";

// ============================================================================
// MODEL DEFINITIONS
// ============================================================================

export type ModelPurpose = 
  | 'content-analysis'      // Understanding user intent
  | 'form-generation'       // Creating form structure
  | 'field-optimization'    // Selecting optimal field types
  | 'question-enhancement'  // Improving question phrasing
  | 'quiz-generation'       // Generating quiz questions from content
  | 'fast-classification';  // Quick pattern matching

export interface ModelConfig {
  id: string;
  name: string;
  requestsPerMinute: number;
  requestsPerDay: number;
  tokensPerMinute: number;
  tokensPerDay: number;
  strengths: string[];
  bestFor: ModelPurpose[];
  avgLatencyMs: number; // Estimated average latency
  supportsJson: boolean;
}

export const GROQ_MODELS: Record<string, ModelConfig> = {
  // Fast & High Throughput - Great for classification and optimization
  'llama-3.1-8b-instant': {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    requestsPerMinute: 30,
    requestsPerDay: 14400,
    tokensPerMinute: 6000,
    tokensPerDay: 500000,
    strengths: ['fast', 'high-throughput', 'classification', 'simple-tasks'],
    bestFor: ['field-optimization', 'fast-classification', 'content-analysis'],
    avgLatencyMs: 500,
    supportsJson: true,
  },

  // High Quality - Best for complex generation
  'llama-3.3-70b-versatile': {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile',
    requestsPerMinute: 30,
    requestsPerDay: 1000,
    tokensPerMinute: 12000,
    tokensPerDay: 100000,
    strengths: ['high-quality', 'complex-reasoning', 'json-generation', 'nuanced'],
    bestFor: ['form-generation', 'quiz-generation'],
    avgLatencyMs: 2500,
    supportsJson: true,
  },

  // Good Reasoning - Balanced quality and speed
  'qwen/qwen3-32b': {
    id: 'qwen/qwen3-32b',
    name: 'Qwen3 32B',
    requestsPerMinute: 60,
    requestsPerDay: 1000,
    tokensPerMinute: 6000,
    tokensPerDay: 500000,
    strengths: ['reasoning', 'analysis', 'understanding', 'balanced'],
    bestFor: ['content-analysis', 'form-generation'],
    avgLatencyMs: 1500,
    supportsJson: true,
  },

  // Creative - Great for paraphrasing and variation
  'moonshotai/kimi-k2-instruct': {
    id: 'moonshotai/kimi-k2-instruct',
    name: 'Kimi K2 Instruct',
    requestsPerMinute: 60,
    requestsPerDay: 1000,
    tokensPerMinute: 10000,
    tokensPerDay: 300000,
    strengths: ['creative', 'paraphrasing', 'variation', 'natural-language'],
    bestFor: ['question-enhancement'],
    avgLatencyMs: 800,
    supportsJson: true,
  },

  // High Token Limit - Best for processing long reference documents
  'meta-llama/llama-4-scout-17b-16e-instruct': {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout 17B',
    requestsPerMinute: 30,
    requestsPerDay: 1000,
    tokensPerMinute: 30000,
    tokensPerDay: 500000,
    strengths: ['high-token-limit', 'document-processing', 'extraction'],
    bestFor: ['quiz-generation'],
    avgLatencyMs: 1800,
    supportsJson: true,
  },

  // Maverick - Alternative for complex tasks
  'meta-llama/llama-4-maverick-17b-128e-instruct': {
    id: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    name: 'Llama 4 Maverick 17B',
    requestsPerMinute: 30,
    requestsPerDay: 1000,
    tokensPerMinute: 6000,
    tokensPerDay: 500000,
    strengths: ['versatile', 'balanced', 'reliable'],
    bestFor: ['form-generation', 'content-analysis'],
    avgLatencyMs: 1500,
    supportsJson: true,
  },
};

// ============================================================================
// MODEL ROUTING & SELECTION
// ============================================================================

/**
 * Get the best model for a specific purpose
 */
export function getModelForPurpose(purpose: ModelPurpose): ModelConfig {
  const modelPriority: Record<ModelPurpose, string[]> = {
    'content-analysis': ['llama-3.1-8b-instant', 'qwen/qwen3-32b', 'llama-3.3-70b-versatile'],
    'form-generation': ['llama-3.3-70b-versatile', 'qwen/qwen3-32b', 'meta-llama/llama-4-maverick-17b-128e-instruct'],
    'field-optimization': ['llama-3.1-8b-instant', 'qwen/qwen3-32b'],
    'question-enhancement': ['moonshotai/kimi-k2-instruct', 'llama-3.1-8b-instant'],
    'quiz-generation': ['meta-llama/llama-4-scout-17b-16e-instruct', 'llama-3.3-70b-versatile'],
    'fast-classification': ['llama-3.1-8b-instant'],
  };

  const modelIds = modelPriority[purpose];
  return GROQ_MODELS[modelIds[0]];
}

/**
 * Get fallback models for a purpose
 */
export function getFallbackModels(purpose: ModelPurpose): ModelConfig[] {
  const fallbackChains: Record<ModelPurpose, string[]> = {
    'content-analysis': ['qwen/qwen3-32b', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
    'form-generation': ['qwen/qwen3-32b', 'meta-llama/llama-4-maverick-17b-128e-instruct', 'llama-3.1-8b-instant'],
    'field-optimization': ['qwen/qwen3-32b', 'llama-3.3-70b-versatile'],
    'question-enhancement': ['llama-3.1-8b-instant', 'qwen/qwen3-32b'],
    'quiz-generation': ['llama-3.3-70b-versatile', 'qwen/qwen3-32b'],
    'fast-classification': ['qwen/qwen3-32b'],
  };

  return fallbackChains[purpose].map(id => GROQ_MODELS[id]).filter(Boolean);
}

// ============================================================================
// GROQ CLIENT WITH MODEL SUPPORT
// ============================================================================

let groqClient: Groq | null = null;

export function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not set");
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

// ============================================================================
// AI COMPLETION WITH FALLBACK
// ============================================================================

export interface AICompletionOptions {
  purpose: ModelPurpose;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json' | 'text';
  timeoutMs?: number;
}

export interface AICompletionResult {
  content: string;
  model: string;
  usedFallback: boolean;
  latencyMs: number;
}

/**
 * Execute AI completion with automatic fallback
 */
export async function executeWithFallback(options: AICompletionOptions): Promise<AICompletionResult> {
  const {
    purpose,
    messages,
    temperature = 0.3,
    maxTokens = 4000,
    responseFormat = 'json',
    timeoutMs = 10000,
  } = options;

  const primaryModel = getModelForPurpose(purpose);
  const fallbackModels = getFallbackModels(purpose);
  const allModels = [primaryModel, ...fallbackModels];

  console.log(`\n🤖 [AI Models] ════════════════════════════════════════`);
  console.log(`📋 Task: ${purpose}`);
  console.log(`🎯 Primary Model: ${primaryModel.name} (${primaryModel.id})`);
  console.log(`⏱️  Timeout: ${timeoutMs}ms`);
  console.log(`🌡️  Temperature: ${temperature}`);
  console.log(`════════════════════════════════════════════════════════`);

  let lastError: Error | null = null;

  for (let i = 0; i < allModels.length; i++) {
    const model = allModels[i];
    const startTime = Date.now();

    console.log(`\n🔄 [AI Models] Attempting: ${model.name}${i > 0 ? ' (FALLBACK #' + i + ')' : ''}...`);

    try {
      const groq = getGroqClient();
      
      const completionPromise = groq.chat.completions.create({
        model: model.id,
        messages,
        temperature,
        max_tokens: maxTokens,
        ...(responseFormat === 'json' && model.supportsJson ? { response_format: { type: "json_object" } } : {}),
      });

      // Add timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
      });

      const response = await Promise.race([completionPromise, timeoutPromise]);
      const content = response.choices[0]?.message?.content || '';
      const latencyMs = Date.now() - startTime;

      console.log(`✅ [AI Models] SUCCESS: ${model.name}`);
      console.log(`   ⏱️  Latency: ${latencyMs}ms`);
      console.log(`   📊 Response length: ${content.length} chars`);
      if (i > 0) {
        console.log(`   ⚠️  Used fallback model (primary failed)`);
      }

      return {
        content,
        model: model.id,
        usedFallback: i > 0,
        latencyMs,
      };
    } catch (error) {
      lastError = error as Error;
      const latencyMs = Date.now() - startTime;
      console.log(`❌ [AI Models] FAILED: ${model.name}`);
      console.log(`   ⏱️  After: ${latencyMs}ms`);
      console.log(`   💥 Error: ${lastError.message}`);
      
      // If it's a rate limit error, try next model immediately
      if (lastError.message.includes('rate') || lastError.message.includes('429')) {
        console.log(`   🚫 Rate limited - trying next model...`);
        continue;
      }
      
      // For other errors, also try fallback
      console.log(`   🔄 Trying next fallback...`);
      continue;
    }
  }

  // All models failed
  console.log(`\n💀 [AI Models] ALL MODELS FAILED for ${purpose}`);
  throw new Error(`All models failed for ${purpose}: ${lastError?.message || 'Unknown error'}`);
}

// ============================================================================
// PARALLEL EXECUTION
// ============================================================================

export interface ParallelTask {
  id: string;
  options: AICompletionOptions;
}

export interface ParallelResult {
  id: string;
  result?: AICompletionResult;
  error?: Error;
}

/**
 * Execute multiple AI tasks in parallel
 */
export async function executeParallel(tasks: ParallelTask[]): Promise<ParallelResult[]> {
  const promises = tasks.map(async (task) => {
    try {
      const result = await executeWithFallback(task.options);
      return { id: task.id, result };
    } catch (error) {
      return { id: task.id, error: error as Error };
    }
  });

  return Promise.all(promises);
}

// ============================================================================
// LATENCY ESTIMATION
// ============================================================================

/**
 * Estimate total latency for a pipeline
 */
export function estimatePipelineLatency(stages: { purpose: ModelPurpose; parallel?: boolean }[]): number {
  let totalMs = 0;
  let parallelMax = 0;

  for (const stage of stages) {
    const model = getModelForPurpose(stage.purpose);
    
    if (stage.parallel) {
      parallelMax = Math.max(parallelMax, model.avgLatencyMs);
    } else {
      if (parallelMax > 0) {
        totalMs += parallelMax;
        parallelMax = 0;
      }
      totalMs += model.avgLatencyMs;
    }
  }

  // Add any remaining parallel time
  if (parallelMax > 0) {
    totalMs += parallelMax;
  }

  return totalMs;
}
