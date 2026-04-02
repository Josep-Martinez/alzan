import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import i18n from './index';

const isEnglishLocale = () => i18n.language?.startsWith('en');

export const getDateFnsLocale = () => (isEnglishLocale() ? enUS : es);

export const getLocaleTag = () => (isEnglishLocale() ? 'en-US' : 'es-ES');

export const formatLocalizedDate = (
  date: Date | number,
  patterns: {
    en: string;
    es: string;
  },
) => {
  const language = isEnglishLocale() ? 'en' : 'es';
  const pattern = language === 'en' ? patterns.en : patterns.es;

  return format(date, pattern, { locale: getDateFnsLocale() });
};
