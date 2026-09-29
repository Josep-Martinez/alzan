import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { format } from 'date-fns';
import * as Linking from 'expo-linking';

import { copyTextToClipboard, copyTextToClipboardAsync, copyTextToClipboardSync } from '../../../utils/clipboard';
import { buildMenuImportAiPrompt } from '../services/menuImportAiPrompt';
import {
  buildMenuImportAiLaunchTarget,
  type MenuImportAiLaunchResult,
  type MenuImportAiProvider,
} from '../services/menuImportAiProvider';
import { launchTrainingAiOnWeb } from '../../training/services/trainingPlanAiProvider';

export const useMenuImportAi = () => {
  const [isLaunching, setIsLaunching] = useState(false);

  const launchWithAi = useCallback(
    async (provider: MenuImportAiProvider): Promise<MenuImportAiLaunchResult> => {
      if (isLaunching) return { ok: false, kind: 'open-error' };

      const prompt = buildMenuImportAiPrompt({
        currentDate: format(new Date(), 'yyyy-MM-dd'),
      });
      const target = buildMenuImportAiLaunchTarget(provider, prompt);

      setIsLaunching(true);
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          let reservedWindow: Window | null = null;
          const webResult = await launchTrainingAiOnWeb({
            copySync: () => target.mode === 'prefilled' || copyTextToClipboardSync(prompt),
            copyAsync: () => (target.mode === 'prefilled' ? Promise.resolve() : copyTextToClipboardAsync(prompt)),
            openInNewTab: () => {
              reservedWindow = window.open(target.url, '_blank');
              return Boolean(reservedWindow);
            },
            redirectCurrentTab: () => window.location.assign(target.url),
            closeOpenedWindow: () => {
              if (reservedWindow && !reservedWindow.closed) reservedWindow.close();
            },
          });

          if (webResult === 'clipboard-error') return { ok: false, kind: 'clipboard-error' };
          if (webResult === 'open-error') return { ok: false, kind: 'open-error' };
          return { ok: true, provider, mode: target.mode };
        }

        if (target.mode === 'clipboard') {
          try {
            await copyTextToClipboard(prompt);
          } catch {
            return { ok: false, kind: 'clipboard-error' };
          }
        }

        try {
          const canOpen = await Linking.canOpenURL(target.url);
          if (!canOpen) throw new Error('Unable to open AI provider');
          await Linking.openURL(target.url);
        } catch {
          return { ok: false, kind: 'open-error' };
        }

        return { ok: true, provider, mode: target.mode };
      } finally {
        setIsLaunching(false);
      }
    },
    [isLaunching],
  );

  return { isLaunching, launchWithAi };
};
