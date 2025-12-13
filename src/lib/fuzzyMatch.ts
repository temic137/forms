/**
 * Dynamic fuzzy matching for intelligent word correction
 * More flexible than rigid vocabulary matching
 */

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching to find similar words
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score between two strings (0-1)
 * Higher score = more similar
 */
function similarityScore(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - distance / maxLen;
}

/**
 * Common form-related terms for context awareness
 * Used as suggestions, not rigid replacements
 */
const FORM_CONTEXT_TERMS = [
  // Field types
  'text', 'email', 'textarea', 'number', 'date', 'select', 
  'dropdown', 'radio', 'checkbox', 'file', 'upload', 'phone',
  
  // Common field names
  'name', 'firstname', 'lastname', 'fullname',
  'address', 'street', 'city', 'state', 'zip', 'zipcode',
  'message', 'comment', 'feedback', 'description',
  'password', 'confirm',
  
  // Actions/Modifiers
  'required', 'optional', 'form', 'field', 'input',
  'create', 'add', 'include', 'with', 'and',
];

/**
 * Dynamically find the best match for a word using fuzzy matching
 * @param word - The word to match
 * @param alternatives - Alternative transcriptions
 * @param minSimilarity - Minimum similarity threshold (0-1)
 */
export function findBestMatch(
  word: string,
  alternatives: string[],
  minSimilarity: number = 0.7
): {
  match: string;
  confidence: number;
  corrected: boolean;
} {
  const wordLower = word.toLowerCase();
  let bestMatch = word;
  let bestScore = 0;
  let corrected = false;

  // Check alternatives first (highest priority)
  for (const alt of alternatives) {
    const altLower = alt.toLowerCase();
    
    // Check against form context terms
    for (const term of FORM_CONTEXT_TERMS) {
      const score = similarityScore(altLower, term);
      
      if (score > bestScore && score >= minSimilarity) {
        bestScore = score;
        bestMatch = term;
        corrected = altLower !== term;
      }
    }
  }

  // If no good alternative match, check the original word
  if (bestScore === 0) {
    for (const term of FORM_CONTEXT_TERMS) {
      const score = similarityScore(wordLower, term);
      
      if (score > bestScore && score >= minSimilarity) {
        bestScore = score;
        bestMatch = term;
        corrected = wordLower !== term;
      }
    }
  }

  // If still no match, return original word
  if (bestScore < minSimilarity) {
    bestMatch = word;
    bestScore = 1.0;
    corrected = false;
  }

  return {
    match: bestMatch,
    confidence: bestScore,
    corrected,
  };
}

/**
 * Intelligently correct a full transcript using fuzzy matching and alternatives
 * More dynamic than rigid vocabulary replacement
 */
export function fuzzyCorrectTranscript(
  transcript: string,
  alternatives: Array<{ transcript: string; confidence: number }> = []
): {
  corrected: string;
  corrections: Array<{ original: string; corrected: string; confidence: number }>;
} {
  const words = transcript.split(/\s+/);
  const correctedWords: string[] = [];
  const corrections: Array<{ original: string; corrected: string; confidence: number }> = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    // Get alternatives for this word position
    const wordAlternatives = alternatives
      .map(alt => alt.transcript.split(/\s+/)[i])
      .filter(Boolean);

    // Find best match using fuzzy matching
    const result = findBestMatch(word, wordAlternatives, 0.7);

    if (result.corrected) {
      corrections.push({
        original: word,
        corrected: result.match,
        confidence: result.confidence,
      });
    }

    correctedWords.push(result.match);
  }

  return {
    corrected: correctedWords.join(' '),
    corrections,
  };
}

/**
 * Check if a word is likely a form-related term based on context
 * Returns confidence score (0-1)
 */
export function isFormRelatedTerm(word: string): number {
  const wordLower = word.toLowerCase();
  
  // Exact match = highest confidence
  if (FORM_CONTEXT_TERMS.includes(wordLower)) {
    return 1.0;
  }
  
  // Find best similarity match
  let bestScore = 0;
  for (const term of FORM_CONTEXT_TERMS) {
    const score = similarityScore(wordLower, term);
    if (score > bestScore) {
      bestScore = score;
    }
  }
  
  return bestScore;
}

/**
 * Analyze transcript context to determine likely intent
 */
export function analyzeTranscriptContext(transcript: string): {
  isFormRequest: boolean;
  confidence: number;
  suggestedCorrections: string[];
} {
  const words = transcript.toLowerCase().split(/\s+/);
  let formRelatedScore = 0;
  const suggestedCorrections: string[] = [];
  
  // Check each word for form relevance
  for (const word of words) {
    const score = isFormRelatedTerm(word);
    formRelatedScore += score;
    
    // Suggest corrections for low-scoring words
    if (score < 0.7 && word.length > 3) {
      const match = findBestMatch(word, [], 0.6);
      if (match.corrected) {
        suggestedCorrections.push(`"${word}" → "${match.match}"?`);
      }
    }
  }
  
  // Calculate overall confidence
  const avgScore = words.length > 0 ? formRelatedScore / words.length : 0;
  const isFormRequest = avgScore > 0.3 || words.some(w => 
    ['form', 'field', 'input', 'create'].includes(w.toLowerCase())
  );
  
  return {
    isFormRequest,
    confidence: avgScore,
    suggestedCorrections,
  };
}







