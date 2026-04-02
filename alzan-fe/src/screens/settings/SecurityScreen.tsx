import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, typography, borderRadius } from '../../theme';
import { supabase } from '../../lib/supabaseClient';
import { useSettingsStyles } from '../../hooks/useSettingsStyles';
import { useTranslation } from 'react-i18next';
import { Alert } from '../../components/common/Alert';

export const SecurityScreen = () => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { styles: dynamicStyles, colors: themeColors } = useSettingsStyles();

  const handleUpdatePassword = async () => {
    if (password.length < 8) {
      Alert.alert(t('common.error'), t('auth.passwordMinLengthError'));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('settings.passwordsDoNotMatch'));
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      Alert.alert(t('common.error'), error.message);
    } else {
      Alert.alert(t('common.done'), t('auth.passwordUpdatedSuccess'));
      setPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <LinearGradient colors={dynamicStyles.gradientColors} style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['bottom']}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: themeColors.textPrimary }]}>{t('settings.changePassword')}</Text>

          <View style={styles.form}>
            <Text style={[styles.label, { color: themeColors.textPrimary }]}>{t('settings.newPassword')}</Text>
            <TextInput
              style={[styles.input, dynamicStyles.input, { borderColor: themeColors.border }]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder={t('auth.reqMinLength')}
              placeholderTextColor={themeColors.textSecondary}
            />

            <Text style={[styles.label, { color: themeColors.textPrimary }]}>{t('settings.confirmPassword')}</Text>
            <TextInput
              style={[styles.input, dynamicStyles.input, { borderColor: themeColors.border }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder={t('settings.repeatPassword')}
              placeholderTextColor={themeColors.textSecondary}
            />

            <Text style={[styles.hint, { color: themeColors.textSecondary }]}>
              {t('settings.passwordRequirements')}
            </Text>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled, { backgroundColor: themeColors.primary }]}
              onPress={handleUpdatePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={themeColors.white} />
              ) : (
                <Text style={[styles.buttonText, { color: themeColors.white }]}>{t('settings.update')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.m,
  },
  title: {
    ...typography.h4,
    marginBottom: spacing.l,
  },
  form: {
    gap: spacing.m,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
  },
  input: {
    padding: spacing.m,
    borderRadius: borderRadius.m,
    borderWidth: 1,
    fontSize: 16,
  },
  hint: {
    ...typography.caption,
  },
  button: {
    padding: spacing.m,
    borderRadius: borderRadius.m,
    alignItems: 'center',
    marginTop: spacing.m,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
