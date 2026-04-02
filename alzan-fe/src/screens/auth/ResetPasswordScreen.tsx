import React, { useState } from 'react';
import { View, TextInput, Text } from 'react-native';
import { supabase } from '../../lib/supabaseClient';
import { PrimaryButton } from '../../components/PrimaryButton';

import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation.types';

import { useAuth } from '../../context/AuthContext';
import { Alert } from '../../components/common/Alert';
import { useTranslation } from 'react-i18next';

export const ResetPasswordScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { setIsPasswordRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    setLoading(true);
    try {
      if (password.length < 8) {
        Alert.alert(t('common.error'), t('auth.passwordMinLengthError'));
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      Alert.alert(t('common.done'), t('auth.passwordUpdatedSuccess'), [
        {
          text: t('common.ok'),
          onPress: () => {
            // Si estamos en el stack logueado, vamos a Home/Main
            setIsPasswordRecovery(false);
            navigation.navigate('Main');
          },
        },
      ]);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t('auth.unknownError');
      Alert.alert(t('common.error'), message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, paddingTop: 60, backgroundColor: 'white' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>{t('auth.newPassword')}</Text>
      <TextInput
        placeholder={t('auth.setNewPassword')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 15,
          borderRadius: 8,
          marginBottom: 20,
          fontSize: 16,
        }}
      />
      <PrimaryButton title={t('auth.savePassword')} onPress={handleUpdatePassword} loading={loading} />
    </View>
  );
};
