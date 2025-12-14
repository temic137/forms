# Quiz Mode Feature Documentation

## Overview
The Quiz Mode feature allows forms to be converted into graded quizzes or tests. Form creators can assign point values, correct answers, and explanations to fields. Submissions are automatically scored, and results are displayed to the user and the form owner.

## Key Features

### 1. Form-Level Configuration
- **Enable/Disable**: Toggle quiz mode for any form.
- **Passing Score**: Set a percentage threshold for passing (e.g., 70%).
- **Show Results**: Option to show/hide scores immediately after submission.
- **Show Answers**: Option to show/hide correct answers and explanations after submission.
- **Allow Retakes**: (Future) Option to allow multiple submissions.

### 2. Field-Level Configuration
Each field can have a `quizConfig` object with:
- **Grade this field**: Toggle to enable/disable scoring for a specific field (e.g., disable for Name/Email).
- **Points**: Number of points awarded for a correct answer (default: 1).
- **Correct Answer**: The expected answer to receive points.
- **Match Type (New)**: For text fields, choose between "Exact Match" or "Contains".
  - **Exact Match**: User must type the answer exactly (good for names, dates).
  - **Contains**: User's answer must contain the correct text (good for essays, sentences).
- **Explanation**: A helpful text displayed to the user after submission (if enabled).
- **Case Sensitivity**: For text answers, whether capitalization matters.
- **Partial Credit**: For multiple-choice (checkboxes), allow partial points.

### 3. Scoring Logic
- **Excluded Fields**: Fields with no correct answer set (or "Grade this field" disabled) are strictly ignored in score calculation.
- **Text Fields**: Compares user input with the correct answer string. Supports exact match and "contains" match.
- **Number Fields**: Compares numeric values.
- **Choice Fields**: Compares selected option value(s).
- **Multiple Choice**: Calculates partial credit if enabled (correct - incorrect selections).

### 4. Results & Analytics
- **User View**: "Thank You" page displays Score, Percentage, Pass/Fail status, and a breakdown of questions (if enabled).
- **Admin View**:
  - **Submissions List**: Shows score badges and points for each submission.
  - **Submission Details**: Detailed breakdown of the quiz result.
  - **Analytics Dashboard**: Aggregated metrics:
    - Average Score
    - Pass Rate
    - Highest/Lowest Scores
    - Score Distribution Chart

## Technical Implementation

### Data Model
- **Form**: Added `quizMode` JSON field to store global settings.
- **Field**: Added `quizConfig` JSON field to store question settings.
- **Submission**: Added `score` JSON field to store the calculated result.

### Files
- `src/types/form.ts`: Definitions for `QuizConfig`, `QuizModeConfig`.
- `src/lib/scoring.ts`: Core scoring logic (`calculateQuizScore`, `areValuesEqual`).
- `src/components/builder/QuizSettings.tsx`: UI for form-level settings.
- `src/components/builder/DraggableField.tsx`: UI for field-level settings (inline).
- `src/components/builder/FieldPropertiesPanel.tsx`: UI for field-level settings (sidebar).

## Future Enhancements
- **AI Grading**: Use LLMs to grade long-form answers based on semantic meaning rather than keywords.
- **Timer**: Add a countdown timer for the quiz.
- **Question Bank**: Randomize questions from a pool.
- **Certificates**: Generate a PDF certificate for passing scores.
