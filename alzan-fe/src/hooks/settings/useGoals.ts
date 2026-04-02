import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Alert } from 'react-native';
import { Insert, UserGoal } from '../../types/requests.types';
import { useAuth } from '../../context/AuthContext';

export const useGoals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      if (!user) return;

      const { data, error } = await supabase.from('user_goals').select('*').eq('user_id', user.id);

      if (error) throw error;
      setGoals(data || []);
    } catch (err) {
      console.error('Error fetching goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const addGoal = async (goal: Omit<Insert<'user_goals'>, 'user_id'>) => {
    try {
      if (!user) return false;

      const { error } = await supabase.from('user_goals').insert({
        ...goal,
        user_id: user.id,
        // valid_from: new Date().toISOString() // Assuming column exists
      });

      if (error) throw error;
      fetchGoals();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Error', message);
      return false;
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const { error } = await supabase.from('user_goals').delete().eq('id', id);

      if (error) throw error;
      fetchGoals();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Error', message);
    }
  };

  // Assumes goal with type 'main_objective' is the main one
  const mainGoal = goals.find(g => g.goal_type === 'main_objective');
  const specificGoals = goals.filter(g => g.goal_type !== 'main_objective');

  const updateMainGoal = async (type: string) => {
    // Upsert logic for main goal
    try {
      if (!user) return;

      // Delete old main goal if exists (simplest way to ensure only one, or update if exists)
      if (mainGoal) {
        await supabase
          .from('user_goals')
          .update({
            description: type, // Storing "Perder grasa" etc in description or maybe goal_type?
            // If I use goal_type 'main_objective', I need to store the actual objective value somewhere.
            // Let's assume description holds "Perder grasa" and goal_type is 'main_objective'.
          })
          .eq('id', mainGoal.id);
      } else {
        await supabase.from('user_goals').insert({
          user_id: user.id,
          goal_type: 'main_objective',
          description: type,
        });
      }
      fetchGoals();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Error', message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  return {
    goals,
    mainGoal,
    specificGoals,
    loading,
    addGoal,
    deleteGoal,
    updateMainGoal,
  };
};
