import { Field, QuizModeConfig } from "@/types/form";

export interface QuestionScore {
  fieldId: string;
  fieldLabel: string;
  isCorrect: boolean;
  pointsEarned: number;
  pointsPossible: number;
  userAnswer: unknown;
  correctAnswer: unknown;
  explanation?: string;
}

export interface QuizScore {
  totalPoints: number;
  earnedPoints: number;
  percentage: number;
  passed: boolean;
  questionScores: QuestionScore[];
}

/**
 * Normalizes a value for comparison (case-insensitive, trimmed)
 */
function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim().toLowerCase();
}

/**
 * Checks if two values are equal based on field type and quiz config
 */
function areValuesEqual(
  userAnswer: unknown,
  correctAnswer: unknown,
  fieldType: Field["type"],
  caseSensitive: boolean = false,
  matchType: "exact" | "contains" = "exact"
): boolean {
  // Handle null/undefined
  if (userAnswer === null || userAnswer === undefined) return false;
  if (correctAnswer === null || correctAnswer === undefined) return false;

  // For text-based fields
  if (
    ["short-answer", "long-answer", "text", "textarea", "email", "url", "tel"].includes(fieldType)
  ) {
    const userStr = String(userAnswer).trim();
    const correctStr = String(correctAnswer).trim();
    
    if (matchType === "contains") {
      if (caseSensitive) {
        return userStr.includes(correctStr);
      }
      return userStr.toLowerCase().includes(correctStr.toLowerCase());
    }
    
    if (caseSensitive) {
      return userStr === correctStr;
    }
    return userStr.toLowerCase() === correctStr.toLowerCase();
  }

  // For number fields
  if (["number", "currency"].includes(fieldType)) {
    return Number(userAnswer) === Number(correctAnswer);
  }

  // For date fields
  if (["date", "date-picker"].includes(fieldType)) {
    return normalizeValue(userAnswer) === normalizeValue(correctAnswer);
  }

  // For single-choice fields
  if (["multiple-choice", "choices", "radio", "dropdown", "select"].includes(fieldType)) {
    return normalizeValue(userAnswer) === normalizeValue(correctAnswer);
  }

  // For multiple-choice fields (checkboxes, multiselect)
  if (["checkboxes", "multiselect"].includes(fieldType)) {
    if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswer)) {
      return false;
    }
    
    const userSet = new Set(userAnswer.map((v) => normalizeValue(v)));
    const correctSet = new Set(correctAnswer.map((v) => normalizeValue(v)));
    
    if (userSet.size !== correctSet.size) return false;
    
    for (const val of userSet) {
      if (!correctSet.has(val)) return false;
    }
    
    return true;
  }

  // Default: string comparison
  return normalizeValue(userAnswer) === normalizeValue(correctAnswer);
}

/**
 * Calculates partial credit for multiple-choice questions
 */
function calculatePartialCredit(
  userAnswer: unknown,
  correctAnswer: unknown,
  points: number
): number {
  if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswer)) {
    return 0;
  }

  if (correctAnswer.length === 0) return 0;

  const userSet = new Set(userAnswer.map((v) => normalizeValue(v)));
  const correctSet = new Set(correctAnswer.map((v) => normalizeValue(v)));

  let correctSelections = 0;
  let incorrectSelections = 0;

  // Count correct selections
  for (const val of userSet) {
    if (correctSet.has(val)) {
      correctSelections++;
    } else {
      incorrectSelections++;
    }
  }

  // Count missed selections
  const missedSelections = correctSet.size - correctSelections;

  // Calculate score: (correct - incorrect) / total correct, minimum 0
  const score = Math.max(0, (correctSelections - incorrectSelections) / correctSet.size);
  
  return score * points;
}

/**
 * Scores a single question
 */
function scoreQuestion(
  field: Field,
  userAnswer: unknown
): QuestionScore {
  const quizConfig = field.quizConfig;
  const points = quizConfig?.points || 1;
  const correctAnswer = quizConfig?.correctAnswer;
  const explanation = quizConfig?.explanation;

  // If no correct answer is set, the question is not scored
  if (correctAnswer === undefined || correctAnswer === null) {
    return {
      fieldId: field.id,
      fieldLabel: field.label,
      isCorrect: false,
      pointsEarned: 0,
      pointsPossible: 0,
      userAnswer,
      correctAnswer: undefined,
      explanation,
    };
  }

  // Check if answer is correct
  const isCorrect = areValuesEqual(
    userAnswer,
    correctAnswer,
    field.type,
    quizConfig?.caseSensitive || false,
    quizConfig?.matchType || "exact"
  );

  // Handle partial credit for multiple-choice
  if (
    ["checkboxes", "multiselect"].includes(field.type) &&
    quizConfig?.acceptPartialCredit &&
    !isCorrect
  ) {
    const partialPoints = calculatePartialCredit(userAnswer, correctAnswer, points);
    return {
      fieldId: field.id,
      fieldLabel: field.label,
      isCorrect: false,
      pointsEarned: partialPoints,
      pointsPossible: points,
      userAnswer,
      correctAnswer,
      explanation,
    };
  }

  return {
    fieldId: field.id,
    fieldLabel: field.label,
    isCorrect,
    pointsEarned: isCorrect ? points : 0,
    pointsPossible: points,
    userAnswer,
    correctAnswer,
    explanation,
  };
}

/**
 * Calculates the total score for a quiz submission
 */
export function calculateQuizScore(
  fields: Field[],
  answers: Record<string, unknown>,
  quizModeConfig?: QuizModeConfig
): QuizScore | null {
  // If quiz mode is not enabled, return null
  if (!quizModeConfig?.enabled) {
    return null;
  }

  // Filter fields that have quiz configurations
  const scorableFields = fields.filter((field) => {
    const ans = field.quizConfig?.correctAnswer;
    if (ans === undefined || ans === null) return false;
    if (typeof ans === "string" && ans.trim() === "") return false;
    if (Array.isArray(ans) && ans.length === 0) return false;
    return true;
  });

  if (scorableFields.length === 0) {
    return null;
  }

  // Score each question
  const questionScores: QuestionScore[] = scorableFields.map((field) =>
    scoreQuestion(field, answers[field.id])
  );

  // Calculate totals
  const totalPoints = questionScores.reduce((sum, q) => sum + q.pointsPossible, 0);
  const earnedPoints = questionScores.reduce((sum, q) => sum + q.pointsEarned, 0);
  const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
  const passed = percentage >= (quizModeConfig.passingScore || 70);

  return {
    totalPoints,
    earnedPoints,
    percentage,
    passed,
    questionScores,
  };
}

/**
 * Formats a score for display
 */
export function formatScore(score: QuizScore): string {
  return `${score.earnedPoints.toFixed(1)} / ${score.totalPoints} (${score.percentage.toFixed(1)}%)`;
}

/**
 * Gets a grade letter based on percentage
 */
export function getGradeLetter(percentage: number): string {
  if (percentage >= 90) return "A";
  if (percentage >= 80) return "B";
  if (percentage >= 70) return "C";
  if (percentage >= 60) return "D";
  return "F";
}


