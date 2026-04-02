import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { TrainingScreenNavigationProp } from '../../types/navigation.types';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { CheckCircle } from 'lucide-react-native';
import { useTrainingStyles } from '../../hooks/useTrainingStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

export const FinishWorkoutScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<TrainingScreenNavigationProp>();
  const { styles: dynamicStyles, colors: themeColors } = useTrainingStyles();

  return (
    <LinearGradient colors={dynamicStyles.gradientColors} style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, dynamicStyles.container]}>
        <View style={styles.content}>
          <CheckCircle size={80} color={themeColors.success} />
          <Text style={[styles.title, dynamicStyles.title]}>{t('training.workoutCompleted')}</Text>
          <Text style={[styles.subtitle, dynamicStyles.subtitle]}>{t('training.sessionSavedSuccess')}</Text>

          <TouchableOpacity
            style={[styles.button, dynamicStyles.primaryButton]}
            onPress={() =>
              navigation.reset({
                index: 0,
                routes: [{ name: 'TrainingHome' }],
              })
            }
          >
            <Text style={styles.buttonText}>{t('training.backToHome')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.l,
    marginBottom: spacing.s,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.m,
    borderRadius: borderRadius.full,
  },
  buttonText: {
    ...typography.h3,
    color: '#FFFFFF',
  },
});
