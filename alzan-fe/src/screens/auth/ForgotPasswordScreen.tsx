import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { AuthScreenNavigationProp } from '../../types/navigation.types';
import { supabase } from '../../lib/supabaseClient';
import { typography } from '../../theme';
import { PrimaryButton } from '../../components/PrimaryButton';
import { GlassCard } from '../../components/GlassCard';
import { ArrowLeft } from 'lucide-react-native';
import { useAuthStyles } from '../../hooks/useAuthStyles';
import { CONFIG } from '../../constants/environment';
import { Alert } from '../../components/common/Alert';

export const ForgotPasswordScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<AuthScreenNavigationProp>();
  const { styles, colors } = useAuthStyles();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert(t('common.error'), t('auth.enterEmailAddressError'));
      return;
    }

    setLoading(true);
    try {
      // Redirigimos a la web para el cambio de contraseña
      const websiteUrl = CONFIG.baseUrl;
      const redirectTo = `${websiteUrl}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) throw error;

      Alert.alert(t('auth.emailSentTitle'), t('auth.checkInbox'));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('auth.unknownError');
      Alert.alert(t('common.error'), message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: 60, paddingHorizontal: 24 }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, typography.h2, { marginBottom: 0 }]}>{t('auth.recoverPassword')}</Text>
      </View>

      <GlassCard style={styles.formCard}>
        <Text style={styles.description}>{t('auth.resetPasswordInstructions')}</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('auth.email')}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder={t('auth.emailPlaceholder')}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <PrimaryButton
          title={t('auth.sendLink')}
          onPress={handleResetPassword}
          loading={loading}
          style={styles.button}
        />
      </GlassCard>
    </View>
  );
};
