import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../../theme';

export const ProviderOAuthWebCallback = () => {
  const { t } = useTranslation();
  const [message, setMessage] = useState(t('settings.oauthCallbackCompleting'));

  useEffect(() => {
    try {
      const result = WebBrowser.maybeCompleteAuthSession();
      if (result.type === 'failed') setMessage(t('settings.oauthCallbackManualClose'));
    } catch {
      setMessage(t('settings.oauthCallbackManualClose'));
    }
  }, [t]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[typography.body, styles.message]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.m,
    justifyContent: 'center',
    padding: spacing.l,
  },
  message: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
