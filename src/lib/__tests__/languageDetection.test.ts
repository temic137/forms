/**
 * Tests for language detection utilities
 */

import { 
  detectUserLanguage, 
  getLanguageName, 
  isSupportedLanguage,
  SUPPORTED_LANGUAGES,
  LANGUAGE_NAMES 
} from '../languageDetection';

describe('languageDetection', () => {
  describe('detectUserLanguage', () => {
    it('should return en-US as default when navigator is not available', () => {
      const result = detectUserLanguage();
      expect(SUPPORTED_LANGUAGES).toContain(result);
    });
  });

  describe('getLanguageName', () => {
    it('should return correct language names', () => {
      expect(getLanguageName('en-US')).toBe('English (US)');
      expect(getLanguageName('es-ES')).toBe('Spanish');
      expect(getLanguageName('fr-FR')).toBe('French');
      expect(getLanguageName('de-DE')).toBe('German');
      expect(getLanguageName('zh-CN')).toBe('Chinese');
      expect(getLanguageName('ja-JP')).toBe('Japanese');
    });
  });

  describe('isSupportedLanguage', () => {
    it('should return true for supported languages', () => {
      expect(isSupportedLanguage('en-US')).toBe(true);
      expect(isSupportedLanguage('es-ES')).toBe(true);
      expect(isSupportedLanguage('fr-FR')).toBe(true);
      expect(isSupportedLanguage('de-DE')).toBe(true);
      expect(isSupportedLanguage('zh-CN')).toBe(true);
      expect(isSupportedLanguage('ja-JP')).toBe(true);
    });

    it('should return false for unsupported languages', () => {
      expect(isSupportedLanguage('en-GB')).toBe(false);
      expect(isSupportedLanguage('pt-BR')).toBe(false);
      expect(isSupportedLanguage('invalid')).toBe(false);
    });
  });

  describe('SUPPORTED_LANGUAGES', () => {
    it('should contain exactly 6 languages', () => {
      expect(SUPPORTED_LANGUAGES).toHaveLength(6);
    });

    it('should contain all expected languages', () => {
      expect(SUPPORTED_LANGUAGES).toEqual([
        'en-US',
        'es-ES',
        'fr-FR',
        'de-DE',
        'zh-CN',
        'ja-JP',
      ]);
    });
  });

  describe('LANGUAGE_NAMES', () => {
    it('should have names for all supported languages', () => {
      SUPPORTED_LANGUAGES.forEach(lang => {
        expect(LANGUAGE_NAMES[lang]).toBeDefined();
        expect(typeof LANGUAGE_NAMES[lang]).toBe('string');
      });
    });
  });
});
