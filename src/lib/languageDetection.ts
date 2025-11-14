/**
 * Language detection and management utilities for voice input
 * 
 * Requirement 6.1: Language selector with 6 supported languages
 * Requirement 6.5: Auto-detect user's browser language as default
 */

export type SupportedLanguage = 'en-US' | 'es-ES' | 'fr-FR' | 'de-DE' | 'zh-CN' | 'ja-JP';

/**
 * Language display names for UI
 */
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  'en-US': 'English (US)',
  'es-ES': 'Spanish',
  'fr-FR': 'French',
  'de-DE': 'German',
  'zh-CN': 'Chinese',
  'ja-JP': 'Japanese',
};

/**
 * All supported languages
 */
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  'en-US',
  'es-ES',
  'fr-FR',
  'de-DE',
  'zh-CN',
  'ja-JP',
];

/**
 * Detect user's browser language and return the closest supported language
 * 
 * Requirement 6.5: Auto-detect user's browser language as default
 * 
 * @returns The detected supported language or 'en-US' as fallback
 */
export function detectUserLanguage(): SupportedLanguage {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'en-US';
  }

  // Get browser language (e.g., 'en-US', 'en', 'es-ES', etc.)
  const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || 'en-US';
  
  // Try exact match first
  if (SUPPORTED_LANGUAGES.includes(browserLang as SupportedLanguage)) {
    return browserLang as SupportedLanguage;
  }
  
  // Try base language match (e.g., 'en' matches 'en-US')
  const baseLang = browserLang.split('-')[0].toLowerCase();
  
  const languageMap: Record<string, SupportedLanguage> = {
    'en': 'en-US',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'zh': 'zh-CN',
    'ja': 'ja-JP',
  };
  
  return languageMap[baseLang] || 'en-US';
}

/**
 * Get the language name for display
 */
export function getLanguageName(language: SupportedLanguage): string {
  return LANGUAGE_NAMES[language] || language;
}

/**
 * Check if a language code is supported
 */
export function isSupportedLanguage(language: string): language is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(language as SupportedLanguage);
}
