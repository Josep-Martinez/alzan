import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { useSettingsStyles } from '../../hooks/useSettingsStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

export const ConnectedAppsScreen = () => {
  const { t } = useTranslation();
  const { styles: dynamicStyles, colors: themeColors } = useSettingsStyles();

  const AppCard = ({
    name,
    connected,
    onConnect,
    onDisconnect,
    comingSoon = false,
  }: {
    name: string;
    connected: boolean;
    onConnect: () => void;
    onDisconnect: () => void;
    comingSoon?: boolean;
  }) => (
    <View style={[styles.card, dynamicStyles.card]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconPlaceholder, dynamicStyles.iconContainer]}>
          <Text style={[styles.iconText, { color: themeColors.textSecondary }]}>{name[0]}</Text>
        </View>
        <View style={styles.appInfo}>
          <Text style={[styles.appName, { color: themeColors.textPrimary }]}>{name}</Text>
          {comingSoon ? (
            <Text style={[styles.statusTextPending, { color: themeColors.primary }]}>{t('alzan.comingSoon')}</Text>
          ) : (
            <Text
              style={
                connected
                  ? styles.statusTextConnected
                  : [styles.statusTextDisconnected, { color: themeColors.textSecondary }]
              }
            >
              {connected ? t('settings.connected') : t('settings.disconnected')}
            </Text>
          )}
        </View>
      </View>
      {!comingSoon && (
        <TouchableOpacity
          style={[
            styles.button,
            connected
              ? [styles.buttonDisconnect, { borderColor: themeColors.border }]
              : { backgroundColor: themeColors.primary, borderColor: themeColors.primary },
          ]}
          onPress={connected ? onDisconnect : onConnect}
        >
          <Text
            style={[
              styles.buttonText,
              connected
                ? [styles.buttonTextDisconnect, { color: themeColors.textPrimary }]
                : { color: themeColors.white },
            ]}
          >
            {connected ? t('settings.disconnect') : t('settings.connect')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <LinearGradient colors={dynamicStyles.gradientColors} style={styles.container}>
      <ScrollView style={[styles.container, dynamicStyles.container]} contentContainerStyle={styles.content}>
        <Text style={[styles.description, { color: themeColors.textSecondary }]}>
          {t('settings.syncAppsDescription')}
        </Text>

        <AppCard name="Suunto" connected={false} onConnect={() => {}} onDisconnect={() => {}} comingSoon />

        <AppCard name="Strava" connected={false} onConnect={() => {}} onDisconnect={() => {}} comingSoon />

        <AppCard name="Garmin" connected={false} onConnect={() => {}} onDisconnect={() => {}} comingSoon />

        <AppCard name="Apple Health" connected={false} onConnect={() => {}} onDisconnect={() => {}} comingSoon />

        <AppCard name="Google Fit" connected={false} onConnect={() => {}} onDisconnect={() => {}} comingSoon />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.m,
    gap: spacing.m,
  },
  description: {
    ...typography.body,
    marginBottom: spacing.m,
  },
  card: {
    borderRadius: borderRadius.m,
    padding: spacing.m,
    ...shadows.soft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.s,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  iconText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    ...typography.h4,
  },
  statusTextConnected: {
    fontSize: 12,
    color: colors.success,
    marginTop: 2,
  },
  statusTextDisconnected: {
    fontSize: 12,
    marginTop: 2,
  },
  statusTextPending: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  buttonConnect: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  buttonDisconnect: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTextConnect: {
    color: colors.white,
  },
  buttonTextDisconnect: {},
});
