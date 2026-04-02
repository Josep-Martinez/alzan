import 'i18next';
import { TranslationObject } from './locales/en';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: TranslationObject;
    };
  }
}
