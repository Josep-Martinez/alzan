import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActionSheetIOS,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { TrainingScreenNavigationProp, TrainingStackParamList } from '../../types/navigation.types';
import { GlassCard } from '../../components/GlassCard';
import { colors, spacing, typography, borderRadius } from '../../theme';
import {
  Plus,
  Clock,
  Ruler,
  Zap,
  Repeat,
  Activity,
  Trash2,
  MoreVertical,
  ArrowLeft,
  Trophy,
} from 'lucide-react-native';
import { EnduranceStepEditorModal } from './components/EnduranceStepEditorModal';
import { WeekDaySelector } from '../../components/training/WeekDaySelector';
import { RepetitionsSelectorModal } from './components/RepetitionsSelectorModal';
import { useEnduranceWorkoutBuilder, BuilderStep } from '../../hooks/useEnduranceWorkoutBuilder';
import { useTrainingStyles } from '../../hooks/useTrainingStyles';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { addDays, format } from 'date-fns';
import { LiquidGlassFooter } from '../../components/common/LiquidGlassFooter';
import { LinearGradient } from 'expo-linear-gradient';
import { SportIcon } from '../../components/icons/SportIcon';
import { SPORT_COLORS } from '../../theme/sportColors';
import { SPORT_GOALS } from '../../constants/sports';
import { useUnitConversion } from '../../hooks/useUnitConversion';
import { DurationType, PhaseType, SportType, TargetType, WorkoutGoal } from '../../types/requests.types';
import { Nullable } from '../../types/common.types';
import { Alert } from '../../components/common/Alert';
import { useTranslation } from 'react-i18next';
import { getPhaseLabel } from './helpers/phase.helper';
import { getDateFnsLocale } from '../../i18n/dateLocale';

interface Step {
  id: string; // temp id
  phase_type: PhaseType;
  duration_type: DurationType;
  duration_s?: number;
  distance_m?: number;
  target_type: TargetType;
  target_min?: number;
  target_max?: number;
  repetitions: number;
  parent_step_id?: string | null;
  is_group: boolean;
  children?: Step[]; // For UI state
}

export const EnduranceWorkoutBuilderScreen = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigation = useNavigation<TrainingScreenNavigationProp>();
  const route = useRoute<RouteProp<TrainingStackParamList, 'EnduranceWorkoutBuilder'>>();
  const { saveWorkout } = useEnduranceWorkoutBuilder();
  const { convertDistanceToUi, convertSpeedToUi } = useUnitConversion();
  const { styles: dynamicStyles, colors: themeColors, isDark } = useTrainingStyles();
  // Dynamic tab bar height with safe fallback
  const insets = useSafeAreaInsets();

  // Custom Floating Tab Bar = 75 (height) + 30 (bottom) = 105
  // Target Visual Position = 105 + 20 (gap) = 125 from screen bottom
  // Since this is inside SafeAreaView, we subtract insets.bottom
  const footerBottomPosition = Math.max(20, 125 - insets.bottom);

  const contentBottomPadding = 125 + 100 + 20; // 125 + footer height + extra gap
  const getWeekdayName = (dayIndex: number) => {
    const baseSunday = new Date(2024, 0, 7); // Sunday
    return format(addDays(baseSunday, dayIndex), 'EEEE', { locale: getDateFnsLocale() });
  };

  // Edit mode: check if templateId is passed
  const templateId = route.params?.templateId;
  const isEditMode = !!templateId;

  // Wizard State
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);

  // Data State
  const [steps, setSteps] = useState<Step[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trainingGoal, setTrainingGoal] = useState<WorkoutGoal | undefined>(undefined);
  const [sportType, setSportType] = useState<Nullable<SportType>>(route.params?.sportType || null);
  const [scheduledDays, setScheduledDays] = useState<number[]>([]);
  const [originalScheduledDay, setOriginalScheduledDay] = useState<number | null>(null); // Track original day for edit mode
  const [isRecurring, setIsRecurring] = useState(false);
  const [manualDuration, setManualDuration] = useState<string>(''); // For 'other' sports

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStep, setEditingStep] = useState<Step | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [repsModalVisible, setRepsModalVisible] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  // Helpers (Moved inside to access hooks/state if needed, though formatTime is static)
  const formatTime = (seconds: number) => {
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const rem = seconds % 3600;
      const mins = Math.floor(rem / 60);
      const secs = rem % 60;
      return `${hours}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatTarget = (step: Step) => {
    if (step.target_type === 'pace') {
      const paceSeconds = step.target_min || 0;
      // Convert s/km -> speed m/s -> UI unit
      // Hook expects m/s
      const speedMps = paceSeconds ? 1000 / paceSeconds : 0;
      if (!speedMps) return '';

      const { label } = convertSpeedToUi(speedMps, sportType ?? undefined);
      return label;
    }
    if (step.target_type === 'heart_rate') {
      return `Zona ${step.target_min || step.target_max || '?'}`;
    }
    if (step.target_type === 'speed') {
      // Standardizing speed target storage to m/s?
      // If stored as km/h (legacy), we need to know.
      // If we standardized EnduranceStepEditorModal to store as km/h for legacy reasons:
      const val = step.target_min || 0;
      // convertSpeedToUi expects m/s
      // assuming val is km/h
      const mps = val / 3.6;
      const { label } = convertSpeedToUi(mps, sportType!);
      // Label might include "km/h" or "mph"
      // If formatTarget wants just value + unit:
      return label;
    }
    if (step.target_type === 'none') return '';

    return `${step.target_min || 0} - ${step.target_max || 0} ${step.target_type}`;
  };

  // Load existing template for edit mode
  const { data: existingTemplate, isLoading: isExistingTemplateLoading } = useQuery({
    queryKey: ['enduranceTemplate', templateId],
    queryFn: async () => {
      if (!templateId) return null;
      const { data, error } = await supabase
        .from('endurance_workout_templates')
        .select(`*, endurance_workout_steps(*)`)
        .eq('id', templateId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!templateId,
  });

  const isHydratingEditTemplate = isEditMode && isExistingTemplateLoading && !sportType;

  // Populate fields when template loads
  useEffect(() => {
    if (existingTemplate) {
      setName(existingTemplate.base_name || '');
      setDescription(existingTemplate.description || '');
      setTrainingGoal(existingTemplate.workout_goal || 'resistencia');
      setSportType((existingTemplate.sport_type as SportType) || 'running');
      if (existingTemplate.scheduled_day !== null && existingTemplate.scheduled_day !== undefined) {
        setScheduledDays([existingTemplate.scheduled_day]);
        setOriginalScheduledDay(existingTemplate.scheduled_day); // Store original for comparison
      } else {
        setScheduledDays([]);
        setOriginalScheduledDay(null);
      }
      setIsRecurring(!!existingTemplate.scheduled_day);

      // Convert DB steps to UI format
      if (existingTemplate.endurance_workout_steps) {
        const dbSteps = existingTemplate.endurance_workout_steps;
        const uiSteps: Step[] = dbSteps
          .filter(s => !s.parent_step_id)
          .sort((a, b) => a.order_index - b.order_index)
          .map(s => ({
            id: s.id,
            phase_type: s.phase_type,
            duration_type: s.duration_type,
            duration_s: s.duration_s,
            distance_m: s.distance_m,
            target_type: s.target_type,
            target_min: s.target_min,
            target_max: s.target_max,
            repetitions: s.repetitions || 1,
            is_group: s.is_group || false,
            children: dbSteps
              .filter(c => c.parent_step_id === s.id)
              .sort((a, b) => a.order_index - b.order_index)
              .map(c => ({
                id: c.id,
                phase_type: c.phase_type,
                duration_type: c.duration_type,
                duration_s: c.duration_s,
                distance_m: c.distance_m,
                target_type: c.target_type,
                target_min: c.target_min,
                target_max: c.target_max,
                repetitions: c.repetitions || 1,
                is_group: false,
                parent_step_id: s.id,
              })),
          })) as Step[];
        setSteps(uiSteps);
      }
    }
  }, [existingTemplate]);

  // Helper to estimate missing values
  const getStepEstimates = (step: Step): { duration: number; distance: number } => {
    let duration = 0;
    let distance = 0;

    // 1. Get known values
    if (step.duration_type === 'time') duration = step.duration_s || 0;
    if (step.duration_type === 'distance') distance = step.distance_m || 0;

    // 2. Estimate missing if valid target exists
    if (step.target_type === 'pace' && step.target_min && step.target_min > 0) {
      // Pace is in seconds per unit (km or 100m)
      const isSwim = sportType === 'swimming';
      const unitMeters = isSwim ? 100 : 1000;
      const secsPerUnit = step.target_min;

      if (step.duration_type === 'distance' && distance > 0) {
        // Time = (Dist / Unit) * Pace
        duration = (distance / unitMeters) * secsPerUnit; // seconds
      } else if (step.duration_type === 'time' && duration > 0) {
        // Dist = (Time / Pace) * Unit
        distance = (duration / secsPerUnit) * unitMeters; // meters
      }
    } else if (step.target_type === 'speed' && step.target_min && step.target_min > 0) {
      // Speed is in km/h
      const kmh = step.target_min;
      const mps = (kmh * 1000) / 3600; // meters per second

      if (step.duration_type === 'distance' && distance > 0) {
        // Time = Dist / Speed
        duration = distance / mps;
      } else if (step.duration_type === 'time' && duration > 0) {
        // Dist = Time * Speed
        distance = duration * mps;
      }
    }

    return { duration, distance };
  };

  // Summary calculation
  const calculateSummary = () => {
    let totalDuration = 0;
    let totalDistance = 0;

    const processStep = (step: Step) => {
      const reps = step.repetitions || 1;
      if (step.is_group && step.children) {
        step.children.forEach(child => {
          const estimates = getStepEstimates(child);
          totalDuration += estimates.duration * reps;
          totalDistance += estimates.distance * reps;
        });
      } else {
        const estimates = getStepEstimates(step);
        totalDuration += estimates.duration * reps;
        totalDistance += estimates.distance * reps;
      }
    };

    steps.forEach(processStep);
    return { totalDuration, totalDistance };
  };

  const { totalDuration, totalDistance } = calculateSummary();

  const renderEstimatedValue = (step: Step) => {
    const { duration, distance } = getStepEstimates(step);

    if (step.duration_type === 'distance' && duration > 0) {
      return ` (~${formatTime(Math.round(duration))})`;
    }
    if (step.duration_type === 'time' && distance > 0) {
      const dist = convertDistanceToUi(distance, 2);
      return ` (~${dist.value} ${dist.unit})`;
    }
    return '';
  };

  const executeSave = async () => {
    try {
      // Logic for One-Off scheduling vs Recurring
      // If isRecurring is FALSE but scheduledDays has items -> It's a one-off plan for next occurrences
      const isOneOff = !isRecurring && scheduledDays.length > 0;

      // Prepare data for Template (recurring day is saved ONLY if isRecurring is true)
      // LIMITATION: DB only supports one day for recurring. We take the first one.
      const templateScheduledDay = isRecurring && scheduledDays.length > 0 ? scheduledDays[0] : null;

      const result = await saveWorkout.mutateAsync({
        data: {
          base_name: name,
          description,
          sport_type: sportType || 'running',
          workout_goal: trainingGoal,
          total_duration_s: ['running', 'cycling', 'swimming'].includes(sportType || '')
            ? Math.round(totalDuration)
            : (parseInt(manualDuration) || 0) * 60,
          total_distance_m: Math.round(totalDistance),
          scheduled_day: templateScheduledDay,
        },
        steps: steps as BuilderStep[],
        templateId: templateId, // Pass templateId for edit mode
      });

      // Handle One-Off Plan Creation (Multi-Day Support)
      if (isOneOff && user) {
        // Iterate through ALL selected days
        for (const day of scheduledDays) {
          // Calculate next occurrence of this specific day
          let targetDate = new Date();
          // Safety loop to find next occurrence
          for (let i = 0; i < 7; i++) {
            if (targetDate.getDay() === day) break;
            targetDate = addDays(targetDate, 1);
          }
          const formattedDate = format(targetDate, 'yyyy-MM-dd');

          // Insert into workout_plans
          const { error: planError } = await supabase.from('workout_plans').insert({
            user_id: user.id,
            planned_date: formattedDate,
            endurance_template_id: result.id, // Use the ID returned from saveWorkout
          });

          if (planError) {
            console.error(`Error creating one-off plan for day ${day}:`, planError);
          } else {
            console.log(`Plan created for day ${day}:`, formattedDate);
          }
        }
      }

      const scheduledDayNames = scheduledDays.map(d => getWeekdayName(d)).join(', ');

      Alert.alert(
        isEditMode ? t('training.updatedTitle') : t('training.savedTitle'),
        isOneOff
          ? t('training.workoutSavedAndScheduledFor', { days: scheduledDayNames })
          : isEditMode
            ? t('training.workoutUpdatedSuccessfully')
            : t('training.workoutSavedSuccessfully'),
        [{ text: t('common.ok'), onPress: () => navigation.navigate('TrainingHome') }],
      );
    } catch (e) {
      console.error(e);
      Alert.alert(t('common.error'), t('training.workoutSaveError'));
    }
  };

  const handleSave = async () => {
    if (!name) {
      Alert.alert(t('common.error'), t('training.workoutNameRequired'));
      return;
    }

    // VALIDATION: If Recurring is checked, a day MUST be selected
    if (isRecurring && scheduledDays.length === 0) {
      Alert.alert(t('common.error'), t('training.repeatNeedsOneDay'));
      return;
    }

    // Check if day changed in edit mode
    const newDay = scheduledDays.length > 0 ? scheduledDays[0] : null;
    const dayChanged = isEditMode && originalScheduledDay !== null && newDay !== originalScheduledDay;

    if (dayChanged) {
      const oldDayName = getWeekdayName(originalScheduledDay);
      const newDayName = newDay !== null ? getWeekdayName(newDay) : t('training.none');

      Alert.alert(
        t('training.dayChangeTitle'),
        t('training.dayChangeMessage', { oldDay: oldDayName, newDay: newDayName }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('training.confirm'),
            style: 'destructive',
            onPress: async () => {
              // Delete future workout_plans for the old day ONLY
              // Only delete plans that:
              // 1. Are for this template
              // 2. Are in the future
              // 3. Fall on the OLD day of the week (originalScheduledDay)
              // 4. Are NOT completed
              if (user && templateId && originalScheduledDay !== null) {
                const today = format(new Date(), 'yyyy-MM-dd');

                // Fetch all future plans for this template
                const { data: matchingPlans, error: selectError } = await supabase
                  .from('workout_plans')
                  .select('id, planned_date, completed_at')
                  .eq('endurance_template_id', templateId)
                  .eq('user_id', user.id)
                  .gte('planned_date', today)
                  .is('completed_at', null); // Only non-completed

                if (!selectError && matchingPlans && matchingPlans.length > 0) {
                  // Filter to only those that match the old day of week
                  const plansToDelete = matchingPlans.filter(plan => {
                    const planDate = new Date(plan.planned_date + 'T00:00:00'); // Avoid timezone issues
                    const planDayOfWeek = planDate.getDay(); // 0 = Sunday
                    return planDayOfWeek === originalScheduledDay;
                  });

                  if (plansToDelete.length > 0) {
                    const idsToDelete = plansToDelete.map(p => p.id);
                    const { error: deleteError } = await supabase.from('workout_plans').delete().in('id', idsToDelete);

                    if (deleteError) {
                      console.error('Error deleting future plans:', deleteError);
                    }
                  }
                }
              }
              await executeSave();
            },
          },
        ],
      );
    } else {
      await executeSave();
    }
  };

  const handleAddStepPress = (groupId: string | null = null) => {
    setActiveGroupId(groupId);
    setEditingStep(null);
    setModalVisible(true);
  };

  const handleEditStep = (step: Step) => {
    setEditingStep(step);
    setModalVisible(true);
  };

  const handleSaveStep = (newStep: Step) => {
    if (editingStep) {
      // Update existing
      if (activeGroupId) {
        setSteps(prev =>
          prev.map(s => {
            if (s.id === activeGroupId) {
              return { ...s, children: s.children?.map(c => (c.id === newStep.id ? newStep : c)) };
            }
            return s;
          }),
        );
      } else {
        setSteps(prev => updateStepInTree(prev, newStep));
      }
    } else {
      // Create new
      if (activeGroupId) {
        setSteps(prev =>
          prev.map(s => {
            if (s.id === activeGroupId) {
              return { ...s, children: [...(s.children || []), { ...newStep, parent_step_id: s.id }] };
            }
            return s;
          }),
        );
      } else {
        setSteps(prev => [...prev, newStep]);
      }
    }
    setModalVisible(false);
    setActiveGroupId(null);
  };

  const updateStepInTree = (list: Step[], updated: Step): Step[] => {
    return list.map(s => {
      if (s.id === updated.id) return updated;
      if (s.children) return { ...s, children: updateStepInTree(s.children, updated) };
      return s;
    });
  };

  // Group helper
  const handleAddGroup = () => {
    const newGroup: Step = {
      id: Math.random().toString(),
      phase_type: 'interval',
      duration_type: 'time',
      repetitions: 3,
      is_group: true,
      target_type: 'none',
      children: [],
    };
    setSteps(prev => [...prev, newGroup]);
  };

  const handleDeleteStep = (stepId: string, isChild: boolean = false, parentId?: string) => {
    Alert.alert(t('training.deleteStepTitle'), t('training.deleteStepMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          if (isChild && parentId) {
            setSteps(prev =>
              prev.map(s => {
                if (s.id === parentId) {
                  return { ...s, children: s.children?.filter(c => c.id !== stepId) };
                }
                return s;
              }),
            );
          } else {
            setSteps(prev => prev.filter(s => s.id !== stepId));
          }
        },
      },
    ]);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newSteps = [...steps];
    [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
    setSteps(newSteps);
  };

  const handleMoveDown = (index: number) => {
    if (index === steps.length - 1) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    setSteps(newSteps);
  };

  const handleStepMenu = (item: Step, index: number) => {
    const isFirst = index === 0;
    const isLast = index === steps.length - 1;

    const options = [
      ...(!isFirst ? [t('training.moveUp')] : []),
      ...(!isLast ? [t('training.moveDown')] : []),
      t('common.delete'),
      t('common.cancel'),
    ];

    const destructiveIndex = options.indexOf(t('common.delete'));
    const cancelIndex = options.indexOf(t('common.cancel'));

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex: destructiveIndex,
          cancelButtonIndex: cancelIndex,
        },
        buttonIndex => {
          const action = options[buttonIndex];
          if (action === t('training.moveUp')) handleMoveUp(index);
          else if (action === t('training.moveDown')) handleMoveDown(index);
          else if (action === t('common.delete')) handleDeleteStep(item.id);
        },
      );
    } else {
      Alert.alert(t('training.optionsTitle'), '', [
        ...(!isFirst ? [{ text: t('training.moveUp'), onPress: () => handleMoveUp(index) }] : []),
        ...(!isLast ? [{ text: t('training.moveDown'), onPress: () => handleMoveDown(index) }] : []),
        { text: t('common.delete'), style: 'destructive', onPress: () => handleDeleteStep(item.id) },
        { text: t('common.cancel'), style: 'cancel' },
      ]);
    }
  };

  const renderStepItem = (item: Step, index: number) => {
    return (
      <GlassCard key={item.id} style={[styles.stepCard, dynamicStyles.card]}>
        <View style={styles.stepHeader}>
          <View style={styles.stepInfoProps}>
            <View
              style={[
                styles.phaseIndicator,
                {
                  backgroundColor: item.is_group ? themeColors.primary : getPhaseColor(item.phase_type),
                },
              ]}
            />
            <Text style={[styles.stepTitle, dynamicStyles.label]}>
              {item.is_group ? t('training.repCaps') : t(getPhaseLabel(item.phase_type))}
            </Text>
          </View>
          <View style={styles.stepActions}>
            {!item.is_group && (
              <TouchableOpacity onPress={() => handleEditStep(item)} style={styles.stepActionBtn}>
                <Text style={styles.editLabel}>{t('common.edit')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => handleStepMenu(item, index)} style={styles.stepActionBtn}>
              <MoreVertical size={18} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {item.is_group ? (
          <View style={styles.groupContainer}>
            <TouchableOpacity
              style={styles.repetitionsSelector}
              onPress={() => {
                setEditingGroupId(item.id);
                setRepsModalVisible(true);
              }}
            >
              <Repeat size={14} color={themeColors.primary} />
              <Text style={[styles.groupLabel, { color: themeColors.primary }]}>
                {item.repetitions}
                {t('training.xRepetitions')}
              </Text>
            </TouchableOpacity>
            <View style={[styles.groupChildren, { borderLeftColor: themeColors.border }]}>
              {item.children?.map(child => (
                <View key={child.id} style={styles.childStepCard}>
                  <GlassCard style={[styles.stepCard, styles.childStepInnerCard, dynamicStyles.glassCard]}>
                    <View style={styles.stepHeader}>
                      <View style={styles.stepInfoProps}>
                        <View style={[styles.phaseIndicator, { backgroundColor: getPhaseColor(child.phase_type) }]} />
                        <Text style={[styles.stepTitle, dynamicStyles.label]}>
                          {t(getPhaseLabel(child.phase_type))}
                        </Text>
                      </View>
                      <View style={styles.stepActions}>
                        <TouchableOpacity
                          onPress={() => {
                            setActiveGroupId(item.id);
                            handleEditStep(child);
                          }}
                          style={styles.stepActionBtn}
                        >
                          <Text style={styles.editLabel}>{t('common.edit')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteStep(child.id, true, item.id)}
                          style={styles.stepActionBtn}
                        >
                          <Trash2 size={16} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.stepDetails}>
                      <View style={styles.detailRow}>
                        <Ruler size={16} color={themeColors.textSecondary} />
                        <Text
                          style={[
                            styles.detailText,
                            { color: isDark ? themeColors.textPrimary : themeColors.textSecondary },
                          ]}
                        >
                          {child.duration_type === 'distance'
                            ? `${convertDistanceToUi(child.distance_m || 0, 2).value} ${convertDistanceToUi(child.distance_m || 0, 2).unit}`
                            : child.duration_type === 'time'
                              ? `${formatTime(child.duration_s || 0)}`
                              : t('training.lapButton')}
                          <Text style={{ color: themeColors.textSecondary, fontSize: 13 }}>
                            {renderEstimatedValue(child)}
                          </Text>
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                </View>
              ))}
              <TouchableOpacity style={styles.addToGroupBtn} onPress={() => handleAddStepPress(item.id)}>
                <Plus size={14} color={themeColors.primary} />
                <Text style={[styles.addToGroupText, { color: themeColors.primary }]}>{t('training.addToBlock')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.stepDetails}>
            <View style={styles.detailRow}>
              <Ruler size={16} color={themeColors.textSecondary} />
              <Text
                style={[styles.detailText, { color: isDark ? themeColors.textPrimary : themeColors.textSecondary }]}
              >
                {item.duration_type === 'distance'
                  ? `${convertDistanceToUi(item.distance_m || 0, 2).value} ${convertDistanceToUi(item.distance_m || 0, 2).unit}`
                  : item.duration_type === 'time'
                    ? `${formatTime(item.duration_s || 0)}`
                    : t('training.lapButton')}
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{renderEstimatedValue(item)}</Text>
              </Text>
            </View>
            {item.target_type !== 'none' && (
              <View style={styles.detailRow}>
                <Zap size={16} color={colors.textSecondary} />
                <Text style={styles.detailText}>{formatTarget(item)}</Text>
              </View>
            )}
          </View>
        )}
      </GlassCard>
    );
  };

  return (
    <LinearGradient
      colors={[themeColors.gradientStart || themeColors.background, themeColors.gradientEnd || themeColors.background]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Normal Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              // Logic for Back Button
              // 1. If currently selecting sport (wizardStep 1, no sportType) -> Go Back to Home
              if (wizardStep === 1 && !sportType) {
                navigation.goBack();
              }
              // 2. If sport selected but in "Simple" mode (not endurance) -> Clear sport, go back to selection
              else if (!['running', 'cycling', 'swimming'].includes(sportType || '')) {
                setSportType(null);
                setWizardStep(1); // Reset just in case
              }
              // 3. If in step 1 of Endurance Builder (sportType set) -> Clear sport, go back to selection
              else if (wizardStep === 1 && sportType && !isEditMode) {
                setSportType(null);
              }
              // 4. If in step 2 (Settings) of Endurance Builder -> Go back to Step 1
              else if (wizardStep === 2) {
                setWizardStep(1);
              } else {
                navigation.goBack();
              }
            }}
            style={styles.headerButton}
          >
            <ArrowLeft size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>
              {isHydratingEditTemplate
                ? t('training.editTemplate')
                : !sportType
                  ? t('training.chooseSport')
                  : wizardStep === 1
                    ? isEditMode
                      ? t('training.editSession')
                      : t('training.designSession')
                    : isEditMode
                      ? t('training.editTemplate')
                      : t('training.saveTemplate')}
            </Text>
          </View>

          {sportType && (
            <TouchableOpacity
              onPress={() => {
                if (wizardStep === 1) setWizardStep(2);
                else handleSave();
              }}
              style={styles.headerButton}
            >
              <Text style={styles.saveText}>{wizardStep === 1 ? t('common.next') : t('common.save')}</Text>
            </TouchableOpacity>
          )}
          {!sportType && <View style={{ width: 40 }} />}
        </View>

        {isHydratingEditTemplate ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={themeColors.primary} />
          </View>
        ) : !sportType ? (
          <ScrollView contentContainerStyle={styles.sportSelectionContainer}>
            <Text style={[styles.sportSelectionTitle, dynamicStyles.title]}>{t('training.planWorkoutQuery')}</Text>

            <View style={styles.sportGrid}>
              {[
                { id: 'running', label: t('constants.running') },
                { id: 'cycling', label: t('constants.cycling') },
                { id: 'swimming', label: t('constants.swimming') },
                { id: 'football', label: t('constants.football') },
                { id: 'basketball', label: t('constants.basketball') },
                { id: 'tennis', label: t('constants.tennis') },
                { id: 'padel', label: t('constants.padel') },
                { id: 'hiking', label: t('constants.hiking') },
              ].map(sport => (
                <TouchableOpacity
                  key={sport.id}
                  style={[styles.sportCard, dynamicStyles.card]}
                  onPress={() => {
                    setSportType(sport.id as SportType);
                    if (!['running', 'cycling', 'swimming'].includes(sport.id)) {
                      setWizardStep(2);
                    }
                  }}
                >
                  <View style={[styles.sportIcon, { backgroundColor: SPORT_COLORS[sport.id] || colors.primary }]}>
                    <SportIcon sport={sport.id} size={32} color="#FFF" />
                  </View>
                  <Text style={[styles.sportName, dynamicStyles.label]}>{sport.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : (
          <>
            {wizardStep === 1 ? (
              // If we are in step 1 but sport is one of the "simple" ones (which theoretically auto-skip,
              // but if user goes 'back' from step 2 they might land here), we should redirect or show simple view.
              // Ideally the auto-skip handles it, but let's handle the view just in case.
              !['running', 'cycling', 'swimming'].includes(sportType || '') ? (
                <View style={styles.content}>
                  <View style={styles.emptyState}>
                    <Trophy size={64} color={themeColors.primary} style={{ marginBottom: spacing.m }} />
                    <Text style={[styles.emptyTitle, dynamicStyles.title]}>
                      {t('training.sessionOf')}
                      {sportType.charAt(0).toUpperCase() + sportType.slice(1)}
                    </Text>
                    <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                      {t('training.configureGeneralDetails')}
                    </Text>
                    <TouchableOpacity
                      style={[styles.addStepButton, { marginTop: spacing.xl, maxWidth: 200 }]}
                      onPress={() => setWizardStep(2)}
                    >
                      <Text style={styles.addStepButtonText}>{t('common.next')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                // Endurance Builder (Run/Bike/Swim)
                <View style={styles.content}>
                  <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={[styles.listContent, { paddingBottom: contentBottomPadding }]}
                    showsVerticalScrollIndicator={true}
                  >
                    {steps.length === 0 ? (
                      <View style={[styles.emptyState, dynamicStyles.emptyState]}>
                        <Activity
                          size={48}
                          color={themeColors.textSecondary}
                          style={{ opacity: 0.5, marginBottom: spacing.m }}
                        />
                        <Text style={[styles.emptyTitle, dynamicStyles.title]}>{t('training.startRoutine')}</Text>
                        <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                          {t('training.addIntervalsHint')}{' '}
                          {sportType === 'swimming'
                            ? t('training.swimming')
                            : sportType === 'cycling'
                              ? t('training.cycling')
                              : t('constants.running')}
                          .
                        </Text>
                      </View>
                    ) : (
                      <>{steps.map((item, index) => renderStepItem(item, index))}</>
                    )}

                    <View style={styles.actions}>
                      <TouchableOpacity style={styles.addStepButton} onPress={() => handleAddStepPress(null)}>
                        <Plus size={20} color="#FFF" />
                        <Text style={styles.addStepButtonText}>{t('training.addStep')}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.addRepButton} onPress={handleAddGroup}>
                        <Repeat size={20} color={colors.primary} />
                      </TouchableOpacity>
                    </View>

                    {/* Dynamic spacer for floating footer */}
                    <View style={{ height: contentBottomPadding }} />
                  </ScrollView>

                  {/* Footer Summary - Liquid Glass */}
                  <View style={[styles.summaryFooterContainer, { bottom: footerBottomPosition }]}>
                    <LiquidGlassFooter style={styles.summaryGlass} borderRadius={30}>
                      <View style={styles.summaryContent}>
                        <View style={styles.summaryItem}>
                          <Text style={styles.summaryLabel}>{t('training.totalTime')}</Text>
                          <View style={styles.summaryValueContainer}>
                            <Clock size={16} color={themeColors.textPrimary} style={{ marginRight: 6 }} />
                            <Text style={[styles.summaryValue, { color: themeColors.textPrimary }]}>
                              {formatTime(Math.round(totalDuration))}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.summaryDivider} />

                        <View style={styles.summaryItem}>
                          <Text style={styles.summaryLabel}>{t('training.distanceParenAllCaps')}</Text>
                          <View style={styles.summaryValueContainer}>
                            <Activity size={16} color={themeColors.textPrimary} style={{ marginRight: 6 }} />
                            <Text style={[styles.summaryValue, { color: themeColors.textPrimary }]}>
                              {convertDistanceToUi(totalDistance, 2).value} {convertDistanceToUi(totalDistance, 2).unit}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </LiquidGlassFooter>
                  </View>
                </View>
              )
            ) : (
              <ScrollView contentContainerStyle={styles.formContent}>
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: themeColors.textSecondary }]}>{t('training.templateName')}</Text>
                  <TextInput
                    style={[styles.input, dynamicStyles.input]}
                    value={name}
                    onChangeText={setName}
                    placeholder={t('training.intervalsExample')}
                    placeholderTextColor={themeColors.textSecondary}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: themeColors.textSecondary }]}>{t('training.mainGoal')}</Text>
                  <View style={styles.goalSelector}>
                    <View style={styles.goalSelector}>
                      {(SPORT_GOALS[sportType] || []).map(goal => {
                        // Convert goal string to user's preferred unit
                        const convertGoalLabel = (label: string): string => {
                          // Match patterns like "5 km", "21 km", "400 m"
                          const kmMatch = label.match(/^(\d+)\s*km$/i);
                          const mMatch = label.match(/^(\d+)\s*m$/i);

                          if (kmMatch) {
                            const km = parseInt(kmMatch[1], 10);
                            const converted = convertDistanceToUi(km * 1000, 0); // Convert km to meters
                            return `${converted.value} ${converted.unit}`;
                          }
                          if (mMatch) {
                            return label; // Keep meters as-is (swimming)
                          }
                          return label; // Fallback
                        };

                        const displayLabel = convertGoalLabel(goal);

                        return (
                          <TouchableOpacity
                            key={goal}
                            style={[styles.goalChip, trainingGoal === goal && styles.activeGoalChip]}
                            onPress={() => setTrainingGoal(goal === trainingGoal ? undefined : trainingGoal)}
                          >
                            <Text
                              style={[
                                styles.goalText,
                                trainingGoal === goal && styles.activeGoalText,
                                {
                                  color: trainingGoal === goal ? '#FFF' : themeColors.textSecondary,
                                },
                              ]}
                            >
                              {displayLabel}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: themeColors.textSecondary }]}>{t('settings.description')}</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, dynamicStyles.input]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder={t('training.descriptionPlaceholder')}
                    placeholderTextColor={themeColors.textSecondary}
                    multiline
                  />
                </View>

                {/* Manual Duration Input for 'Other' sports */}
                {['running', 'cycling', 'swimming'].indexOf(sportType || '') === -1 && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: themeColors.textSecondary }]}>
                      {t('training.estimatedDurationMin')}
                    </Text>
                    <TextInput
                      style={[styles.input, dynamicStyles.input]}
                      keyboardType="numeric"
                      placeholder="60"
                      value={manualDuration}
                      placeholderTextColor={themeColors.textSecondary}
                      onChangeText={setManualDuration}
                    />
                    <Text style={[styles.helperDescription, { color: themeColors.textSecondary }]}>
                      {t('training.planningInfoOnly')}
                    </Text>
                  </View>
                )}

                <View style={styles.formGroup}>
                  <Text style={styles.label}>{t('training.scheduleForWeekday')}</Text>
                  <WeekDaySelector
                    selectedDays={scheduledDays}
                    onDaysChange={setScheduledDays}
                    isRecurring={isRecurring}
                    onToggleRecurring={() => setIsRecurring(!isRecurring)}
                    singleSelect={true}
                  />
                </View>
              </ScrollView>
            )}
          </>
        )}

        <EnduranceStepEditorModal
          visible={modalVisible}
          initialStep={editingStep}
          onSave={handleSaveStep}
          onCancel={() => {
            setModalVisible(false);
            setActiveGroupId(null);
          }}
          sportType={sportType || 'running'}
        />

        <RepetitionsSelectorModal
          visible={repsModalVisible}
          currentValue={steps.find(s => s.id === editingGroupId)?.repetitions || 3}
          onSelect={value => {
            setSteps(prev => prev.map(s => (s.id === editingGroupId ? { ...s, repetitions: value } : s)));
          }}
          onClose={() => {
            setRepsModalVisible(false);
            setEditingGroupId(null);
          }}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

// Utils
const getPhaseColor = (phase: PhaseType) => {
  switch (phase) {
    case 'warmup':
      return colors.success;
    case 'interval':
      return colors.danger;
    case 'recovery':
      return colors.textSecondary;
    case 'cooldown':
      return colors.accent;
    default:
      return colors.primary;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Background handled by LinearGradient
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.m,
    // backgroundColor: '#FFFFFF', // Removed for transparent look
  },
  cancelText: { ...typography.body, color: colors.primary },
  headerTitle: { ...typography.h4, fontWeight: 'bold', color: colors.textPrimary },
  saveText: { ...typography.body, color: colors.primary, fontWeight: 'bold' },
  headerButton: {
    padding: spacing.s,
  },

  wizardProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.l,
    backgroundColor: '#F5F5F5',
  },
  wizardStep: { alignItems: 'center', marginHorizontal: spacing.m },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleActive: { backgroundColor: colors.primary },
  stepNumber: { ...typography.caption, fontWeight: 'bold', color: colors.textSecondary },
  stepNumberActive: { color: '#FFFFFF' },
  stepLabel: { ...typography.caption, color: colors.textSecondary },
  stepLabelActive: { color: colors.primary, fontWeight: 'bold' },
  stepLine: { height: 1, backgroundColor: '#E0E0E0', flex: 1, maxWidth: 50 },

  content: { flex: 1 },
  scrollContainer: { flex: 1 },
  listContent: { padding: spacing.m },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },

  stepCard: {
    marginBottom: spacing.m,
    padding: spacing.m,
    backgroundColor: '#FFFFFF',
  },
  childStepCard: {
    marginLeft: spacing.l,
    marginTop: spacing.s,
    backgroundColor: 'transparent',
    borderRadius: borderRadius.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  childStepInnerCard: {
    backgroundColor: 'transparent',
    marginBottom: 0,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  stepActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  stepActionBtn: {
    padding: 4,
  },
  stepInfoProps: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  phaseIndicator: { width: 12, height: 12, borderRadius: 2, marginRight: 8 },
  stepTitle: { ...typography.body, fontWeight: 'bold' },
  editLabel: { ...typography.caption, color: colors.primary },

  stepDetails: { gap: 4 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { ...typography.body, color: colors.textSecondary },

  groupContainer: { marginTop: 8 },
  repetitionsSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.s,
    backgroundColor: 'rgba(0,122,255,0.1)',
    borderRadius: borderRadius.m,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  groupLabel: { ...typography.caption, fontWeight: 'bold', color: colors.primary },
  groupChildren: { borderLeftWidth: 2, borderLeftColor: '#E0E0E0', paddingLeft: 0 },
  addToGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    marginLeft: spacing.l,
  },
  addToGroupText: { ...typography.caption, color: colors.primary, marginLeft: 6 },

  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.m,
  },

  formContent: { padding: spacing.m },
  formGroup: { marginBottom: spacing.l },
  label: { ...typography.caption, marginBottom: 8, fontWeight: '600' },
  input: {
    backgroundColor: '#FFFFFF',
    padding: spacing.m,
    borderRadius: borderRadius.m,
    fontSize: 16,
  },
  textArea: { height: 100, textAlignVertical: 'top' },

  goalSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  goalChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeGoalChip: { backgroundColor: colors.primary, borderColor: colors.primary },
  goalText: { ...typography.caption, color: colors.textSecondary },
  activeGoalText: { color: '#FFFFFF', fontWeight: 'bold' },

  // New Styles
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.s },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },

  addStepButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.m,
    gap: spacing.s,
  },
  addStepButtonText: { ...typography.button, color: '#FFFFFF' },
  addRepButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.m,
  },

  // Footer Summary styles
  summaryFooterContainer: {
    position: 'absolute',
    bottom: 90, // Above tab bar
    left: spacing.m,
    right: spacing.m,
    zIndex: 100,
  },
  summaryGlass: {
    borderRadius: 30,
    // LiquidBackground adds shadows/blur
  },
  summaryContent: {
    flexDirection: 'row',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 1,
  },
  summaryValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20, // Bigger
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.5,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: spacing.s,
  },

  // Day selector styles
  // WeekDaySelector handles its own styles now
  helperDescription: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.s },

  // Sport Selection Styles
  sportSelectionContainer: {
    padding: spacing.m,
    // flex: 1, // Remove flex: 1 to ensure scroll works properly
    paddingBottom: 100, // Add padding for bottom
    alignItems: 'center',
  },
  sportSelectionTitle: {
    ...typography.h3,
    fontWeight: 'bold',
    marginBottom: spacing.xl,
    marginTop: spacing.l,
    textAlign: 'center',
  },
  sportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.l,
  },
  sportCard: {
    width: '40%',
    marginVertical: spacing.s,
    alignItems: 'center',
    padding: spacing.m,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.l,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sportIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  sportName: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
});
