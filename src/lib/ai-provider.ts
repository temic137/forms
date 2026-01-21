/**
 * Multi-Provider AI Client
 * Supports multiple free AI providers with automatic fallback
 */

import Groq from "groq-sdk";
import { CohereClient } from "cohere-ai";

export type AIProvider = "gemini" | "groq" | "together" | "huggingface" | "cohere";

interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AICompletionOptions {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "json" | "text";
  model?: string;
}

interface AIResponse {
  content: string;
  provider: AIProvider;
}

// Export available Gemini models for easy reference
export const GEMINI_MODELS = {
  // Tier 1: Gemini 3 Preview (Cutting Edge)
  THREE_PRO: "gemini-3-pro-preview",    // Most Powerful
  THREE_FLASH: "gemini-3-flash-preview", // Fastest/Best Balance

  // Tier 2: Gemini 2.5 (Stable Backups)
  PRO: "gemini-2.5-pro",
  FLASH: "gemini-2.5-flash",
  FLASH_LITE: "gemini-2.5-flash-lite",
  
  // Tier 3: Gemini 2.0 (Deep Backups)
  FLASH_2_0: "gemini-2.0-flash",
  FLASH_LITE_2_0: "gemini-2.0-flash-lite",
  EXPERIMENTAL: "gemini-2.0-flash-exp",
  
  // Legacy Fallback
  FLASH_LEGACY: "gemini-1.5-flash-latest"
};

const GEMINI_ROTATION = [
  // Primary: Gemini 3
  GEMINI_MODELS.THREE_FLASH,
  GEMINI_MODELS.THREE_PRO,
  
  // Secondary: Gemini 2.5
  GEMINI_MODELS.FLASH,
  GEMINI_MODELS.FLASH_LITE,
  GEMINI_MODELS.PRO,
  
  // Tertiary: Gemini 2.0
  GEMINI_MODELS.FLASH_2_0,
  GEMINI_MODELS.FLASH_LITE_2_0,
  GEMINI_MODELS.EXPERIMENTAL
];

/**
 * Google Gemini API Client (FREE - Best for complex reasoning)
 * Get key from: https://makersuite.google.com/app/apikey
 */
async function callGemini(options: AICompletionOptions): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY not configured");
  }

  // Default to Gemini 3 Flash Preview if no model specified
  const activeModel = options.model || process.env.GEMINI_MODEL || GEMINI_MODELS.THREE_FLASH;
  
  // Attempt to call Gemini with smart rotation on rate limits
  for (const modelCandidate of [activeModel, ...GEMINI_ROTATION.filter(m => m !== activeModel)]) {
    try {
      console.log(`🔷 [Gemini] Using model: ${modelCandidate}`);
      return await executeGeminiRequest(modelCandidate, apiKey, options);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes("429") || errorMsg.includes("Rate Limit") || errorMsg.includes("Not Found") || errorMsg.includes("404")) {
        console.warn(`⚠️ [Gemini] ${modelCandidate} failed (Rate Limit/Not Found). Rotating to next model...`);
        continue; // Try next model in rotation
      }
      throw error; // If not a rate limit (e.g., invalid key), fail immediately
    }
  }

  throw new Error("All Gemini models exhausted due to rate limits.");
}

async function executeGeminiRequest(model: string, apiKey: string, options: AICompletionOptions): Promise<string> {
  // Convert messages to Gemini format
  const contents = options.messages
    .filter(m => m.role !== "system") // System messages go in systemInstruction
    .map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));
  
  const systemInstruction = options.messages.find(m => m.role === "system")?.content;

  const generationConfig: Record<string, unknown> = {
    temperature: options.temperature || 0.2,
    maxOutputTokens: options.maxTokens || 3000,
  };

  if (options.responseFormat === "json") {
    generationConfig.responseMimeType = "application/json";
  }

  const requestBody: Record<string, unknown> = {
    contents,
    generationConfig,
  };

  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    // Specifically catch 429 (Rate Limit) errors for better fallback handling
    if (response.status === 429) {
      throw new Error(`Gemini Rate Limit Exceeded (429): ${error}`);
    }
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

/**
 * Groq API Client (FREE - Fast inference with Llama/Mixtral)
 * Get key from: https://console.groq.com/keys
 */
async function callGroq(options: AICompletionOptions): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured");
  }

  const groq = new Groq({ apiKey });
  
  // If model is a Gemini model (fallback scenario), use Groq default
  let model = options.model;
  if (!model || model.startsWith("gemini")) {
    model = "llama-3.3-70b-versatile";
  }

  type GroqMessage = {
    role: "system" | "user" | "assistant";
    content: string;
  };

  const completionOptions = {
    messages: options.messages as GroqMessage[],
    model,
    temperature: options.temperature || 0.2,
    max_tokens: options.maxTokens || 3000,
    ...(options.responseFormat === "json" && { response_format: { type: "json_object" as const } }),
  };

  const completion = await groq.chat.completions.create(completionOptions);
  return completion.choices[0]?.message?.content || "";
}

/**
 * Together AI Client (FREE tier available - Good open source models)
 * Get key from: https://api.together.xyz/settings/api-keys
 */
async function callTogether(options: AICompletionOptions): Promise<string> {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    throw new Error("TOGETHER_API_KEY not configured");
  }

  // Use Qwen 2.5 72B (very capable, fast, free tier)
  // If model is a Gemini model (fallback scenario), use Together default
  let model = options.model;
  if (!model || model.startsWith("gemini")) {
    model = "Qwen/Qwen2.5-72B-Instruct-Turbo";
  }

  const requestBody: Record<string, unknown> = {
    model,
    messages: options.messages,
    temperature: options.temperature || 0.2,
    max_tokens: options.maxTokens || 3000,
  };

  if (options.responseFormat === "json") {
    requestBody.response_format = { type: "json_object" };
  }

  const response = await fetch("https://api.together.xyz/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Together AI error: ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

/**
 * Cohere API Client (FREE tier - Excellent for structured generation)
 * Get key from: https://dashboard.cohere.com/api-keys
 * Free tier: 100 requests/min, great for form generation
 */
async function callCohere(options: AICompletionOptions): Promise<string> {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) {
    throw new Error("COHERE_API_KEY not configured");
  }

  const cohere = new CohereClient({
    token: apiKey,
  });

  // Use Command R or Command R+ (free tier models, excellent for structured tasks)
  // Available models: command, command-r, command-r-plus, command-r7b-12-2024
  // If model is a Gemini model (fallback scenario), use Cohere default
  let model = options.model;
  if (!model || model.startsWith("gemini")) {
    model = "command";
  }

  // Combine system and user messages for Cohere
  const systemMessage = options.messages.find(m => m.role === "system")?.content || "";
  const userMessages = options.messages.filter(m => m.role !== "system");
  
  // Build the full prompt combining system and user messages
  let prompt = "";
  if (systemMessage) {
    prompt = `${systemMessage}\n\n`;
  }
  
  // Combine all user messages
  for (const msg of userMessages) {
    if (msg.role === "user") {
      prompt += `${msg.content}\n\n`;
    } else if (msg.role === "assistant") {
      prompt += `Assistant: ${msg.content}\n\n`;
    }
  }
  
  // For JSON format, add explicit instruction
  if (options.responseFormat === "json") {
    prompt += "\n\nIMPORTANT: Respond with ONLY valid JSON. No markdown, no code blocks, no explanatory text. Just the raw JSON object.";
  }

  try {
    // Use Cohere's generate endpoint for better structured output
    const response = await cohere.generate({
      model,
      prompt: prompt.trim(),
      temperature: options.temperature || 0.3,
      maxTokens: options.maxTokens || 3000,
    });

    let content = response.generations?.[0]?.text || "";
    
    // If JSON format is requested, try to extract JSON from the response
    if (options.responseFormat === "json") {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        content = jsonMatch[1];
      } else {
        // Try to find JSON object in the response
        const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          content = jsonObjectMatch[0];
        }
      }
    }

    return content.trim();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Cohere API error: ${errorMsg}`);
  }
}

/**
 * Main AI completion function with automatic provider fallback
 */
export async function getAICompletion(options: AICompletionOptions): Promise<AIResponse> {
  // Try providers in order of quality/speed for form generation
  // Gemini is prioritized for the Gemini 3 Hackathon
  const providers: { name: AIProvider; fn: () => Promise<string> }[] = [
    {
      name: "gemini",
      fn: () => callGemini(options),
    },
    {
      name: "cohere",
      fn: () => callCohere(options),
    },
    {
      name: "together",
      fn: () => callTogether(options),
    },
    {
      name: "groq",
      fn: () => callGroq(options),
    },
  ];

  const errors: Array<{ provider: AIProvider; error: string }> = [];

  // Try each provider
  for (const provider of providers) {
    try {
      console.log(`Trying AI provider: ${provider.name}`);
      const content = await provider.fn();
      console.log(`✓ Success with ${provider.name}`);
      return {
        content,
        provider: provider.name,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      // Smart logging for rate limits vs other errors
      if (errorMsg.includes("Rate Limit") || errorMsg.includes("429")) {
        console.warn(`⚠️ ${provider.name} rate limited, switching to fallback...`);
      } else {
        console.log(`✗ ${provider.name} failed: ${errorMsg}`);
      }
      
      errors.push({ provider: provider.name, error: errorMsg });
      // Continue to next provider
    }
  }

  // All providers failed
  throw new Error(
    `All AI providers failed:\n${errors.map(e => `- ${e.provider}: ${e.error}`).join("\n")}`
  );
}

/**
 * Get available providers (for debugging/status)
 */
export function getAvailableProviders(): AIProvider[] {
  const available: AIProvider[] = [];
  
  if (process.env.COHERE_API_KEY) {
    available.push("cohere");
  }
  if (process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY) {
    available.push("gemini");
  }
  if (process.env.TOGETHER_API_KEY) {
    available.push("together");
  }
  if (process.env.GROQ_API_KEY) {
    available.push("groq");
  }
  
  return available;
}

/**
 * Legacy function for backward compatibility
 */
export function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set");
  }
  return new Groq({ apiKey });
}

