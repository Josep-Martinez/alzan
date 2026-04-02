import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, AlertButton } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { TrainingScreenNavigationProp, TrainingStackParamList } from '../../types/navigation.types';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Dumbbell, Activity } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useTrainingStyles } from '../../hooks/useTrainingStyles';
import { format, addDays, startOfWeek, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { Alert } from '../../components/common/Alert';
import { useTranslation } from 'react-i18next';
import { getDateFnsLocale } from '../../i18n/dateLocale';

export const WeeklyPlanScreen = () => {
  const { t } = useTranslation();
  const { styles: dynamicStyles, colors: themeColors, isDark } = useTrainingStyles();
  const navigation = useNavigation<TrainingScreenNavigationProp>();
  const route = useRoute<RouteProp<TrainingStackParamList, 'WeeklyPlan'>>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Initial date can come from params
  const [currentDate, setCurrentDate] = useState(route.params?.date ? new Date(route.params.date) : new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(currentDate, { weekStartsOn: 1 }));

  useEffect(() => {
    if (route.params?.date) {
      const date = new Date(route.params.date);
      setCurrentDate(date);
      setCurrentWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
    }
  }, [route.params?.date]);

  // Data Fetching
  const { data: weeklyPlans } = useQuery({
    queryKey: ['weeklyPlans', currentWeekStart, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const startStr = format(currentWeekStart, 'yyyy-MM-dd');
      const endStr = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('workout_plans')
        .select(
          `
                    *,
                    gym_template:workout_templates!gym_template_id(base_name, workout_goal),
                    endurance_template:endurance_workout_templates!endurance_template_id(base_name, workout_goal)
                `,
        )
        .eq('user_id', user.id)
        .gte('planned_date', startStr)
        .lte('planned_date', endStr);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase.from('workout_plans').delete().eq('id', planId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklyPlans'] });
      queryClient.invalidateQueries({ queryKey: ['dailyPlans'] });
      queryClient.invalidateQueries({ queryKey: ['calendarDots'] });
    },
  });

  const handlePreviousWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const handleNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));

  // Selection Modal (Simplified as specific pickers)
  // Ideally we navigate to a "SelectorScreen" which returns the ID.
  // For MVP, we'll assume we navigate to 'TemplateDataSelector'
  // But since that doesn't exist, we will create a Quick Selector Modal here later?
  // Or better: Navigate to "GymRoutinesList" with selection mode.

  // Implementation Decision:
  // Tapping a day -> Opens ActionSheet/Modal: "Assign Gym", "Assign Endurance", "Clear"

  const handleDayPress = (date: Date) => {
    const plan = weeklyPlans?.find(p => p.planned_date === format(date, 'yyyy-MM-dd'));

    const options: AlertButton[] = [
      {
        text: t('training.assignRoutine'),
        onPress: () =>
          navigation.navigate('GymRoutinesList', {
            selectMode: true,
            targetDate: format(date, 'yyyy-MM-dd'),
          }),
      },
      // Need an Endurance List picker too
      {
        text: t('training.sportsTemplate'),
        onPress: () =>
          navigation.navigate('EnduranceSessionsList', {
            selectMode: true,
            targetDate: format(date, 'yyyy-MM-dd'),
          }),
      }, // Using List as picker? No, need Template List.
      { text: t('common.cancel'), style: 'cancel' },
    ];

    if (plan) {
      options.unshift({
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          Alert.alert(t('common.delete'), t('settings.areYouSure'), [
            { text: t('common.cancel') },
            { text: t('common.delete'), style: 'destructive', onPress: () => deletePlanMutation.mutate(plan.id) },
          ]);
        },
      });
    }

    Alert.alert(
      `${t('training.scheduleForWeekday')}: ${format(date, 'EEEE d', { locale: getDateFnsLocale() })}`,
      t('training.planWorkoutQuery'),
      options,
    );
  };

  const renderGrid = () => {
    const days = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));

    return (
      <View style={styles.grid}>
        {days.map((date, i) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const plan = weeklyPlans?.find(p => p.planned_date === dateStr);
          const isGym = !!plan?.gym_template_id;
          const isToday = isSameDay(date, new Date());

          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.dayCell,
                dynamicStyles.card,
                isToday && [
                  styles.todayCell,
                  {
                    borderColor: themeColors.primary,
                    backgroundColor: isDark ? `${themeColors.primary}15` : 'rgba(52, 152, 219, 0.05)',
                  },
                ],
              ]}
              onPress={() => handleDayPress(date)}
            >
              <View style={styles.cellHeader}>
                <Text style={[styles.dayName, isToday && { color: themeColors.primary, fontWeight: 'bold' }]}>
                  {format(date, 'EEE', { locale: getDateFnsLocale() }).toUpperCase()}
                </Text>
                <Text
                  style={[
                    styles.dayNum,
                    dynamicStyles.title,
                    isToday && { color: themeColors.primary, fontWeight: 'bold' },
                  ]}
                >
                  {format(date, 'd')}
                </Text>
              </View>

              <View style={{ marginLeft: spacing.m, flex: 1 }}>
                {plan ? (
                  <View
                    style={[
                      styles.planPill,
                      isGym ? { backgroundColor: themeColors.secondary } : { backgroundColor: themeColors.accent },
                    ]}
                  >
                    {isGym ? <Dumbbell size={12} color="#FFF" /> : <Activity size={12} color="#FFF" />}
                    <Text style={styles.pillText} numberOfLines={1}>
                      {isGym ? plan.gym_template?.base_name : plan.endurance_template?.base_name}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.emptyPill, { borderColor: themeColors.border }]}>
                    <Plus size={12} color={themeColors.textSecondary} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <LinearGradient colors={dynamicStyles.gradientColors} style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.title, dynamicStyles.title]}>{t('training.weeklyPlanner')}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.weekControl}>
          <TouchableOpacity
            onPress={handlePreviousWeek}
            style={[styles.navBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
          >
            <ChevronLeft size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.weekLabel, dynamicStyles.title]}>
            {format(currentWeekStart, 'd MMM', { locale: getDateFnsLocale() })} -{' '}
            {format(addDays(currentWeekStart, 6), 'd MMM', { locale: getDateFnsLocale() })}
          </Text>
          <TouchableOpacity
            onPress={handleNextWeek}
            style={[styles.navBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
          >
            <ChevronRight size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>{renderGrid()}</ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
  },
  backBtn: { padding: spacing.xs },
  title: { ...typography.h3, color: colors.textPrimary },

  weekControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.m,
  },
  navBtn: { padding: spacing.s, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 20, marginHorizontal: spacing.m },
  weekLabel: { ...typography.h4, color: colors.textPrimary, minWidth: 150, textAlign: 'center' },

  content: {
    padding: spacing.m,
  },
  grid: {},
  dayCell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.m,
    padding: spacing.m,
    minHeight: 70,
    marginBottom: spacing.s,
    borderWidth: 1,
    borderColor: colors.border,
  },
  todayCell: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(52, 152, 219, 0.05)',
  },
  cellHeader: {
    alignItems: 'center',
    width: 40,
  },
  dayName: { ...typography.caption, color: colors.textSecondary, marginBottom: 2 },
  dayNum: { ...typography.h4, color: colors.textPrimary },
  todayText: { color: colors.primary, fontWeight: 'bold' },

  planPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  gymPill: { backgroundColor: colors.secondary },
  endurancePill: { backgroundColor: colors.accent },
  pillText: { ...typography.body, color: '#FFFFFF', fontWeight: '600', flex: 1, marginLeft: 8 },

  emptyPill: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
