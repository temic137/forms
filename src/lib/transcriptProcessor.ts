import type { SpeechAlternative } from '@/types/voice';
import { fuzzyCorrectTranscript, analyzeTranscriptContext } from '@/lib/fuzzyMatch';

/**
 * Intelligent transcript post-processing service
 * Now uses dynamic fuzzy matching instead of rigid vocabulary
 * More flexible and adaptive to various speech patterns
 */

/**
 * Process transcript with intelligent corrections and enhancements
 */
export function processTranscript(
  primaryTranscript: string,
  alternatives?: SpeechAlternative[],
  confidence?: number
): {
  processed: string;
  confidence: number;
  corrections: string[];
} {
  const corrections: string[] = [];
  let processed = primaryTranscript;

  // 1. Basic cleanup
  processed = basicCleanup(processed);

  // 2. DYNAMIC: Fuzzy matching with alternatives (more flexible than rigid vocabulary)
  if (alternatives && alternatives.length > 1) {
    const fuzzyResult = fuzzyCorrectTranscript(processed, alternatives);
    processed = fuzzyResult.corrected;

    // Add fuzzy corrections to our list
    fuzzyResult.corrections.forEach(corr => {
      corrections.push(
        `Fuzzy matched "${corr.original}" → "${corr.corrected}" (${Math.round(corr.confidence * 100)}% confident)`
      );
    });
  }

  // 3. Context analysis (understand if it's really a form request)
  const context = analyzeTranscriptContext(processed);
  if (context.suggestedCorrections.length > 0) {

  }

  // 4. Grammar and punctuation improvements
  processed = improveGrammar(processed);

  // 5. Adjust confidence based on context and corrections
  let adjustedConfidence = confidence || 0.8;

  // Boost confidence if it's clearly a form request
  if (context.isFormRequest && context.confidence > 0.5) {
    adjustedConfidence = Math.min(1.0, adjustedConfidence + 0.1);
  }

  // Reduce confidence slightly for corrections, but intelligently
  if (corrections.length > 0) {
    // High-confidence corrections don't reduce overall confidence much
    const avgCorrectionConfidence = corrections.length > 0 ? 0.85 : 1.0;
    adjustedConfidence = Math.max(0.6, adjustedConfidence * avgCorrectionConfidence);
  }

  return {
    processed,
    confidence: adjustedConfidence,
    corrections,
  };
}

/**
 * Basic cleanup: trim, normalize whitespace, remove filler words
 */
function basicCleanup(text: string): string {
  let cleaned = text.trim();

  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Remove common filler words that don't add meaning
  const fillers = /\b(um|uh|like|you know|sort of|kind of)\b/gi;
  cleaned = cleaned.replace(fillers, '');

  // Clean up extra spaces after punctuation
  cleaned = cleaned.replace(/\s+([,.!?])/g, '$1');
  cleaned = cleaned.replace(/([,.!?])\s+/g, '$1 ');

  // Trim again after cleanup
  cleaned = cleaned.trim();

  return cleaned;
}

// Old rigid vocabulary functions removed - now using dynamic fuzzy matching!

/**
 * Improve grammar and punctuation
 */
function improveGrammar(text: string): string {
  let improved = text;

  // Capitalize first letter
  improved = improved.charAt(0).toUpperCase() + improved.slice(1);

  // Ensure proper spacing around common conjunctions
  improved = improved.replace(/\s*(,)\s*/g, ', ');

  // Add period at the end if missing
  if (!/[.!?]$/.test(improved)) {
    improved += '.';
  }

  // Capitalize after sentence endings
  improved = improved.replace(/([.!?])\s+([a-z])/g, (match, p1, p2) => {
    return p1 + ' ' + p2.toUpperCase();
  });

  return improved;
}

/**
 * Analyze transcript quality and provide suggestions
 */
export function analyzeTranscriptQuality(
  transcript: string,
  confidence: number
): {
  quality: 'high' | 'medium' | 'low';
  suggestions: string[];
  shouldAskForClarification: boolean;
} {
  const suggestions: string[] = [];
  let quality: 'high' | 'medium' | 'low' = 'high';

  // Check length
  if (transcript.length < 10) {
    quality = 'low';
    suggestions.push('Transcript is very short. Try speaking more clearly and providing more details.');
  }

  // Check confidence
  if (confidence < 0.5) {
    quality = 'low';
    suggestions.push('Low confidence in recognition. Try speaking more clearly or reducing background noise.');
  } else if (confidence < 0.7) {
    quality = 'medium';
    suggestions.push('Medium confidence. Consider speaking more clearly for better results.');
  }

  // Check for form-related keywords
  const hasFormKeywords = /\b(form|field|input|create|name|email|phone|message|address)\b/i.test(transcript);
  if (!hasFormKeywords) {
    quality = quality === 'high' ? 'medium' : 'low';
    suggestions.push('No form-related keywords detected. Describe what fields you want in your form.');
  }

  // Determine if we should ask for clarification
  const shouldAskForClarification = quality === 'low' || (quality === 'medium' && confidence < 0.6);

  return {
    quality,
    suggestions,
    shouldAskForClarification,
  };
}

/**
 * Enhance transcript with additional context for AI processing
 */
export function enhanceTranscriptForAI(transcript: string): string {
  // Add context hints if the transcript is too vague
  if (transcript.length < 20 || !/\b(form|field)\b/i.test(transcript)) {
    return `Create a form with these requirements: ${transcript}`;
  }

  return transcript;
}

