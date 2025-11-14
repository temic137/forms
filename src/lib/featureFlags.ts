/**
 * Feature Flags Configuration
 * 
 * Centralized feature flag management for gradual rollout and A/B testing.
 * Supports environment variables and user-level settings.
 */

/**
 * Check if voice input feature is enabled globally via environment variable
 * Requirement 9.5, 10.5: Feature flag for voice input
 */
export function isVoiceInputFeatureEnabled(): boolean {
  // Check environment variable (set at build time or runtime)
  const envFlag = process.env.NEXT_PUBLIC_VOICE_INPUT_ENABLED;
  
  // Default to true if not explicitly set to false
  if (envFlag === undefined || envFlag === null) {
    return true; // Default enabled for backward compatibility
  }
  
  return envFlag.toLowerCase() === 'true';
}

/**
 * Check if voice input is available for the current user
 * Combines feature flag with user settings
 */
export function isVoiceInputAvailable(): boolean {
  // First check if feature is globally enabled
  if (!isVoiceInputFeatureEnabled()) {
    return false;
  }
  
  // Feature is enabled, user can control it via settings
  return true;
}

/**
 * Feature flag configuration for gradual rollout
 * Can be extended to support percentage-based rollouts, user segments, etc.
 */
export interface FeatureFlagConfig {
  enabled: boolean;
  rolloutPercentage?: number; // 0-100, for gradual rollout
  allowedUserIds?: string[]; // Specific users who have access
  blockedUserIds?: string[]; // Specific users who are blocked
}

/**
 * Get feature flag configuration for voice input
 * Can be extended to read from a database or remote config service
 */
export function getVoiceInputFeatureConfig(): FeatureFlagConfig {
  return {
    enabled: isVoiceInputFeatureEnabled(),
    rolloutPercentage: 100, // 100% rollout by default
  };
}

/**
 * Check if a specific user has access to voice input
 * Supports gradual rollout based on user ID
 * 
 * @param userId - Optional user ID for user-specific rollout
 * @returns true if user has access to voice input
 */
export function hasVoiceInputAccess(userId?: string): boolean {
  const config = getVoiceInputFeatureConfig();
  
  if (!config.enabled) {
    return false;
  }
  
  // Check if user is explicitly blocked
  if (userId && config.blockedUserIds?.includes(userId)) {
    return false;
  }
  
  // Check if user is explicitly allowed
  if (userId && config.allowedUserIds?.includes(userId)) {
    return true;
  }
  
  // Check rollout percentage (simple hash-based distribution)
  if (config.rolloutPercentage !== undefined && config.rolloutPercentage < 100) {
    if (!userId) {
      // No user ID, use random distribution
      return Math.random() * 100 < config.rolloutPercentage;
    }
    
    // Use user ID hash for consistent rollout
    const hash = simpleHash(userId);
    const userPercentile = hash % 100;
    return userPercentile < config.rolloutPercentage;
  }
  
  // Full rollout
  return true;
}

/**
 * Simple hash function for consistent user-based rollout
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Feature flags for other features (can be extended)
 */
export const featureFlags = {
  voiceInput: {
    isEnabled: isVoiceInputFeatureEnabled,
    isAvailable: isVoiceInputAvailable,
    hasAccess: hasVoiceInputAccess,
    getConfig: getVoiceInputFeatureConfig,
  },
} as const;
