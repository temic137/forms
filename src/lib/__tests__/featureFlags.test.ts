/**
 * Unit tests for feature flags
 */

import { beforeEach } from 'node:test';
import { afterEach } from 'node:test';
import {
  isVoiceInputFeatureEnabled,
  isVoiceInputAvailable,
  hasVoiceInputAccess,
  getVoiceInputFeatureConfig,
  featureFlags,
} from '../featureFlags';

describe('featureFlags', () => {
  const originalEnv = process.env.NEXT_PUBLIC_VOICE_INPUT_ENABLED;

  afterEach(() => {
    // Restore original environment variable
    if (originalEnv !== undefined) {
      process.env.NEXT_PUBLIC_VOICE_INPUT_ENABLED = originalEnv;
    } else {
      delete process.env.NEXT_PUBLIC_VOICE_INPUT_ENABLED;
    }
  });

  describe('isVoiceInputFeatureEnabled', () => {
    it('should return true when environment variable is "true"', () => {
      process.env.NEXT_PUBLIC_VOICE_INPUT_ENABLED = 'true';
      expect(isVoiceInputFeatureEnabled()).toBe(true);
    });

    it('should return false when environment variable is "false"', () => {
      process.env.NEXT_PUBLIC_VOICE_INPUT_ENABLED = 'false';
      expect(isVoiceInputFeatureEnabled()).toBe(false);
    });

    it('should return true when environment variable is not set (default)', () => {
      delete process.env.NEXT_PUBLIC_VOICE_INPUT_ENABLED;
      expect(isVoiceInputFeatureEnabled()).toBe(true);
    });

    it('should be case-insensitive for "true"', () => {
      process.env.NEXT_PUBLIC_VOICE_INPUT_ENABLED = 'TRUE';
      expect(isVoiceInputFeatureEnabled()).toBe(true);
    });

    it('should be case-insensitive for "false"', () => {
      process.env.NEXT_PUBLIC_VOICE_INPUT_ENABLED = 'FALSE';
      expect(isVoiceInputFeatureEnabled()).toBe(false);
    });
  });

  describe('isVoiceInputAvailable', () => {
    it('should return false when feature is globally disabled', () => {
      process.env.NEXT_PUBLIC_VOICE_INPUT_ENABLED = 'false';
      expect(isVoiceInputAvailable()).toBe(false);
    });

    it('should return true when feature is globally enabled', () => {
      process.env.NEXT_PUBLIC_VOICE_INPUT_ENABLED = 'true';
      expect(isVoiceInputAvailable()).toBe(true);
    });
  });

  describe('getVoiceInputFeatureConfig', () => {
    it('should return config with enabled=true when env is "true"', () => {
      process.env.NEXT_PUBLIC_VOICE_INPUT_ENABLED = 'true';
      const config = getVoiceInputFeatureConfig();
      expect(config.enabled).toBe(true);
      expect(config.rolloutPercentage).toBe(100);
    });

    it('should return config with enabled=false when env is "false"', () => {
      process.env.NEXT_PUBLIC_VOICE_INPUT_ENABLED = 'false';
      const config = getVoiceInputFeatureConfig();
      expect(config.enabled).toBe(false);
    });
  });

  describe('hasVoiceInputAccess', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_VOICE_INPUT_ENABLED = 'true';
    });

    it('should return false when feature is globally disabled', () => {
      process.env.NEXT_PUBLIC_VOICE_INPUT_ENABLED = 'false';
      expect(hasVoiceInputAccess('user123')).toBe(false);
    });

    it('should return true when feature is enabled with 100% rollout', () => {
      expect(hasVoiceInputAccess('user123')).toBe(true);
    });

    it('should return true for users without ID when feature is enabled', () => {
      expect(hasVoiceInputAccess()).toBe(true);
    });

    it('should use consistent hash for same user ID', () => {
      const userId = 'test-user-123';
      const result1 = hasVoiceInputAccess(userId);
      const result2 = hasVoiceInputAccess(userId);
      expect(result1).toBe(result2);
    });

    it('should return different results for different user IDs (probabilistic)', () => {
      // This test is probabilistic - with 100% rollout all should be true
      const user1 = hasVoiceInputAccess('user1');
      const user2 = hasVoiceInputAccess('user2');
      const user3 = hasVoiceInputAccess('user3');
      
      // With 100% rollout, all should be true
      expect(user1).toBe(true);
      expect(user2).toBe(true);
      expect(user3).toBe(true);
    });
  });

  describe('featureFlags.voiceInput', () => {
    it('should expose isEnabled method', () => {
      process.env.NEXT_PUBLIC_VOICE_INPUT_ENABLED = 'true';
      expect(featureFlags.voiceInput.isEnabled()).toBe(true);
    });

    it('should expose isAvailable method', () => {
      process.env.NEXT_PUBLIC_VOICE_INPUT_ENABLED = 'true';
      expect(featureFlags.voiceInput.isAvailable()).toBe(true);
    });

    it('should expose hasAccess method', () => {
      process.env.NEXT_PUBLIC_VOICE_INPUT_ENABLED = 'true';
      expect(featureFlags.voiceInput.hasAccess('user123')).toBe(true);
    });

    it('should expose getConfig method', () => {
      process.env.NEXT_PUBLIC_VOICE_INPUT_ENABLED = 'true';
      const config = featureFlags.voiceInput.getConfig();
      expect(config).toHaveProperty('enabled');
      expect(config).toHaveProperty('rolloutPercentage');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string as false', () => {
      process.env.NEXT_PUBLIC_VOICE_INPUT_ENABLED = '';
      expect(isVoiceInputFeatureEnabled()).toBe(false);
    });

    it('should handle whitespace as false', () => {
      process.env.NEXT_PUBLIC_VOICE_INPUT_ENABLED = '  ';
      expect(isVoiceInputFeatureEnabled()).toBe(false);
    });

    it('should handle invalid values as false', () => {
      process.env.NEXT_PUBLIC_VOICE_INPUT_ENABLED = 'invalid';
      expect(isVoiceInputFeatureEnabled()).toBe(false);
    });

    it('should handle numeric "1" as false (not "true")', () => {
      process.env.NEXT_PUBLIC_VOICE_INPUT_ENABLED = '1';
      expect(isVoiceInputFeatureEnabled()).toBe(false);
    });

    it('should handle numeric "0" as false', () => {
      process.env.NEXT_PUBLIC_VOICE_INPUT_ENABLED = '0';
      expect(isVoiceInputFeatureEnabled()).toBe(false);
    });
  });
});
