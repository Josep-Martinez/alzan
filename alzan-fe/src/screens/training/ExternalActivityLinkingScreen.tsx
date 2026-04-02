import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { TrainingScreenNavigationProp } from '../../types/navigation.types';
import { GlassCard } from '../../components/GlassCard';
import { AlzanSwitch } from '../../components/common/AlzanSwitch';
import { colors, spacing, typography } from '../../theme';
import { useTrainingStyles } from '../../hooks/useTrainingStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { Alert } from '../../components/common/Alert';

export const ExternalActivityLinkingScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<TrainingScreenNavigationProp>();
  const { styles: dynamicStyles } = useTrainingStyles();

  // Mock state for connections
  const [suuntoConnected, setSuuntoConnected] = useState(false);
  const [stravaConnected, setStravaConnected] = useState(false);

  const handleConnect = (service: string, isConnected: boolean, setter: (val: boolean) => void) => {
    if (!isConnected) {
      // Simulate OAuth flow
      Alert.alert(t('training.connectServiceTitle', { service }), t('training.connectServiceMessage', { service }), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('settings.connect'), onPress: () => setter(true) },
      ]);
    } else {
      Alert.alert(t('training.disconnectServiceTitle', { service }), t('training.disconnectServiceMessage'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('settings.disconnect'), style: 'destructive', onPress: () => setter(false) },
      ]);
    }
  };

  return (
    <LinearGradient colors={dynamicStyles.gradientColors} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>{t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('navigation.integrations')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>{t('training.syncServicesDescription')}</Text>

          <GlassCard style={styles.card}>
            <View style={styles.row}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{t('training.suunto')}</Text>
                <Text style={styles.serviceDesc}>{t('training.syncRuns')}</Text>
              </View>
              <AlzanSwitch
                value={suuntoConnected}
                onValueChange={() => handleConnect(t('training.suunto'), suuntoConnected, setSuuntoConnected)}
              />
            </View>
          </GlassCard>

          <GlassCard style={styles.card}>
            <View style={styles.row}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{t('training.strava')}</Text>
                <Text style={styles.serviceDesc}>{t('training.shareActivities')}</Text>
              </View>
              <AlzanSwitch
                value={stravaConnected}
                onValueChange={() => handleConnect(t('training.strava'), stravaConnected, setStravaConnected)}
              />
            </View>
          </GlassCard>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
  },
  backText: {
    ...typography.body,
    color: colors.primary,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.l,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.l,
  },
  card: {
    marginBottom: spacing.m,
    padding: spacing.m,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    ...typography.h4,
    marginBottom: 4,
  },
  serviceDesc: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
