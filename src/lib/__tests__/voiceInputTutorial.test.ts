import { voiceInputTutorial } from '../voiceInputTutorial';

describe('voiceInputTutorial', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('hasCompletedTutorial', () => {
    it('should return false when tutorial has not been completed', () => {
      expect(voiceInputTutorial.hasCompletedTutorial()).toBe(false);
    });

    it('should return true when tutorial has been completed', () => {
      voiceInputTutorial.markTutorialCompleted();
      expect(voiceInputTutorial.hasCompletedTutorial()).toBe(true);
    });
  });

  describe('markTutorialCompleted', () => {
    it('should mark tutorial as completed', () => {
      voiceInputTutorial.markTutorialCompleted();
      expect(localStorage.getItem('voice_input_tutorial_completed')).toBe('true');
    });
  });

  describe('resetTutorial', () => {
    it('should reset tutorial status', () => {
      voiceInputTutorial.markTutorialCompleted();
      expect(voiceInputTutorial.hasCompletedTutorial()).toBe(true);
      
      voiceInputTutorial.resetTutorial();
      expect(voiceInputTutorial.hasCompletedTutorial()).toBe(false);
    });
  });
});
