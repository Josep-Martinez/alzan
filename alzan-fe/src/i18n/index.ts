import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en, { TranslationObject } from './locales/en';
import es from './locales/es';

const LANGUAGE_STORAGE_KEY = 'user_language';

// ============================================================================
// LOCALE CONFIGURATION - Add new languages here
// ============================================================================

export const LOCALE_CONFIG = {
  en: {
    translation: en,
    label: 'English',
    nativeLabel: 'English',
  },
  es: {
    translation: es,
    label: 'Spanish',
    nativeLabel: 'Español',
  },
  // Add more languages here:
  // fr: { translation: fr, label: 'French', nativeLabel: 'Français' },
} as const;

// ============================================================================
// TYPES - Automatically derived from LOCALE_CONFIG
// ============================================================================

export type Locale = keyof typeof LOCALE_CONFIG;
export const SUPPORTED_LOCALES = Object.keys(LOCALE_CONFIG) as Locale[];
export const DEFAULT_LOCALE: Locale = 'es';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Type guard to check if a string is a valid locale
 */
export const isValidLocale = (locale: string | null | undefined): locale is Locale => {
  return locale != null && locale in LOCALE_CONFIG;
};

/**
 * Get a valid locale or return default
 */
export const getValidLocale = (locale: string | null | undefined): Locale => {
  return isValidLocale(locale) ? locale : DEFAULT_LOCALE;
};

/**
 * Get locale options for UI dropdowns/selectors
 */
export const getLocaleOptions = () => {
  return SUPPORTED_LOCALES.map(locale => ({
    value: locale,
    label: LOCALE_CONFIG[locale].nativeLabel,
  }));
};

// ============================================================================
// I18N INITIALIZATION
// ============================================================================

const resources = Object.fromEntries(
  Object.entries(LOCALE_CONFIG).map(([key, config]) => [key, { translation: config.translation }]),
) as Record<Locale, { translation: TranslationObject }>;

/**
 * Get the initial language from storage or device locale
 */
const getInitialLanguage = async (): Promise<Locale> => {
  try {
    // 1. Try to get saved language from AsyncStorage
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isValidLocale(savedLanguage)) {
      return savedLanguage;
    }

    // 2. Fall back to device locale
    const locales = Localization.getLocales();
    const deviceLanguage = locales && locales.length > 0 ? locales[0].languageCode : null;

    if (isValidLocale(deviceLanguage)) {
      return deviceLanguage;
    }

    // 3. Default locale
    return DEFAULT_LOCALE;
  } catch (error) {
    console.error('[i18n] Error getting initial language:', error);
    return DEFAULT_LOCALE;
  }
};

/**
 * Initialize i18next with async language detection
 */
const initializeI18n = async () => {
  const initialLanguage = await getInitialLanguage();

  await i18n.use(initReactI18next).init({
    resources,
    lng: initialLanguage,
    fallbackLng: DEFAULT_LOCALE,
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
    react: {
      useSuspense: false, // Important for React Native
    },
  });

  console.log('[i18n] Initialized with language:', initialLanguage);
};

// Initialize immediately
initializeI18n();

/**
 * Change language and persist to storage
 */
export const changeLanguage = async (language: Locale) => {
  try {
    await i18n.changeLanguage(language);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    console.log('[i18n] Language changed to:', language);
  } catch (error) {
    console.error('[i18n] Error changing language:', error);
  }
};

export default i18n;
