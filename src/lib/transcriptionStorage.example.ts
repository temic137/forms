/**
 * Example usage of TranscriptionStorage with useVoiceInput hook
 * This demonstrates how to integrate session persistence into voice input
 */

import { transcriptionStorage, TranscriptionSession } from './transcriptionStorage';

/**
 * Example: Save transcription during voice input
 */
export function saveTranscriptionExample(transcript: string, language: string): void {
  const session: TranscriptionSession = {
    id: `session-${Date.now()}`,
    transcript,
    language,
    timestamp: Date.now(),
  };

  const success = transcriptionStorage.save(session);

  if (!success) {
    console.warn('Failed to save transcription. Storage may be full.');
    // Fallback: Continue with in-memory storage only
  }
}

/**
 * Example: Restore transcription on page load
 */
export function restoreTranscriptionExample(): string | null {
  const session = transcriptionStorage.load();

  if (session) {

    return session.transcript;
  }

  return null;
}

/**
 * Example: Clear transcription after successful form generation
 */
export function clearTranscriptionExample(): void {
  transcriptionStorage.clear();

}

/**
 * Example: Auto-save transcription every 5 seconds
 */
export function setupAutoSave(
  getTranscript: () => string,
  getLanguage: () => string
): () => void {
  const intervalId = setInterval(() => {
    const transcript = getTranscript();
    const language = getLanguage();

    if (transcript.trim()) {
      const session: TranscriptionSession = {
        id: `session-${Date.now()}`,
        transcript,
        language,
        timestamp: Date.now(),
      };

      transcriptionStorage.save(session);
    }
  }, 5000); // Save every 5 seconds

  // Return cleanup function
  return () => clearInterval(intervalId);
}

/**
 * Example: Check storage availability before using
 */
export function checkStorageExample(): boolean {
  if (!transcriptionStorage.isStorageAvailable()) {
    console.warn('Local storage is not available. Transcriptions will not be persisted.');
    return false;
  }
  return true;
}

/**
 * Example: Display session age to user
 */
export function getSessionAgeDisplay(): string | null {
  const age = transcriptionStorage.getSessionAge();

  if (age === null) {
    return null;
  }

  const minutes = Math.floor(age / 60000);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'just now';
  }
}
