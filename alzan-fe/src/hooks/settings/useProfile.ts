import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Alert } from '../../components/common/Alert';
import { User, UserUpdate } from '../../types/requests.types';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

export const useProfile = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data, error: dbError } = await supabase.from('users').select('*').eq('id', user.id).single();

      if (dbError) {
        throw dbError;
      }

      if (data) {
        setProfile({
          ...data,
          email: user.email ?? '',
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: UserUpdate) => {
    try {
      setUpdating(true);
      if (!user) throw new Error('No authenticated user');

      // Filter out email as it's not in public.users usually
      const { email: _email, ...updateData } = updates;
      const { error: updateError } = await supabase.from('users').update(updateData).eq('id', user.id);

      if (updateError) throw updateError;

      await fetchProfile(); // Refresh data
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error updating profile:', err);
      Alert.alert(t('common.error'), `${t('settings.profileUpdateError')} ${message}`);
      return false;
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  return {
    profile,
    loading,
    updating,
    error,
    refetch: fetchProfile,
    updateProfile,
  };
};
