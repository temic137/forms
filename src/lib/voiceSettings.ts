/**
 * VoiceSettings - Manages user preferences for voice input features
 * Handles enabling/disabling voice input and storing privacy preferences
 */

export interface VoiceSettings {
  enabled: boolean;
  privacyNoticeAccepted: boolean;
  lastUpdated: number;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  enabled: true,
  privacyNoticeAccepted: false,
  lastUpdated: Date.now(),
};

export class VoiceSettingsManager {
  private readonly STORAGE_KEY = 'voice_input_settings';

  /**
   * Load voice settings from local storage
   * Returns default settings if none exist
   */
  load(): VoiceSettings {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        return { ...DEFAULT_SETTINGS };
      }

      const settings: VoiceSettings = JSON.parse(data);
      return {
        ...DEFAULT_SETTINGS,
        ...settings,
      };
    } catch (error) {
      console.warn('Failed to load voice settings from local storage', error);
      return { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Save voice settings to local storage
   */
  save(settings: Partial<VoiceSettings>): boolean {
    try {
      const currentSettings = this.load();
      const updatedSettings: VoiceSettings = {
        ...currentSettings,
        ...settings,
        lastUpdated: Date.now(),
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedSettings));
      return true;
    } catch (error) {
      console.warn('Failed to save voice settings to local storage', error);
      return false;
    }
  }

  /**
   * Check if voice input is enabled
   */
  isEnabled(): boolean {
    const settings = this.load();
    return settings.enabled;
  }

  /**
   * Enable or disable voice input
   */
  setEnabled(enabled: boolean): boolean {
    return this.save({ enabled });
  }

  /**
   * Check if privacy notice has been accepted
   */
  hasAcceptedPrivacyNotice(): boolean {
    const settings = this.load();
    return settings.privacyNoticeAccepted;
  }

  /**
   * Mark privacy notice as accepted
   */
  acceptPrivacyNotice(): boolean {
    return this.save({ privacyNoticeAccepted: true });
  }

  /**
   * Reset all settings to defaults
   */
  reset(): boolean {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.warn('Failed to reset voice settings', error);
      return false;
    }
  }

  /**
   * Check if local storage is available
   */
  isStorageAvailable(): boolean {
    try {
      const testKey = '__voice_settings_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}

// Export a singleton instance for convenience
export const voiceSettings = new VoiceSettingsManager();
