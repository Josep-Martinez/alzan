import { TranslationKey } from '../../../i18n/locales/en';

export const getPhaseLabel = (phase: string, isGroup?: boolean): TranslationKey => {
  if (isGroup) return 'training.repCaps';
  switch (phase) {
    case 'warmup':
      return 'training.warmup';
    case 'cooldown':
      return 'training.cooldown';
    case 'main':
      return 'training.work';
    case 'interval':
      return 'training.interval';
    case 'work':
      return 'training.work';
    case 'recovery':
      return 'training.recovery';
    case 'rest':
      return 'common.rest';
    default:
      return (phase.charAt(0).toUpperCase() + phase.slice(1)) as TranslationKey;
  }
};
