/**
 * Utility for managing voice input tutorial state
 * Requirement 13.1: Track first-time user tutorial completion
 */

const TUTORIAL_STORAGE_KEY = 'voice_input_tutorial_completed';

export const voiceInputTutorial = {
  /**
   * Check if user has completed the tutorial
   */
  hasCompletedTutorial(): boolean {
    if (typeof window === 'undefined') return true;
    
    try {
      const completed = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      return completed === 'true';
    } catch (error) {
      console.warn('Failed to check tutorial status:', error);
      return true; // Default to completed if storage fails
    }
  },

  /**
   * Mark tutorial as completed
   */
  markTutorialCompleted(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    } catch (error) {
      console.warn('Failed to save tutorial status:', error);
    }
  },

  /**
   * Reset tutorial status (for testing or user preference)
   */
  resetTutorial(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to reset tutorial status:', error);
    }
  },
};
