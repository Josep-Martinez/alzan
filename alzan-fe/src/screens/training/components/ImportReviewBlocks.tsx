import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { AlertTriangle, Link2, Sparkles, Watch } from 'lucide-react-native';
import { GlassCard } from '../../../components/GlassCard';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { Alert } from '../../../components/common/Alert';
import { borderRadius, spacing, typography } from '../../../theme';
import { useTrainingStyles } from '../../../hooks/useTrainingStyles';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { useImportReview } from '../../../hooks/useImportReview';
import { useUnitConversion } from '../../../hooks/useUnitConversion';
import { ActivitySession } from '../../../types/requests.types';
import { formatDuration, getSportDefaultTitleKey } from '../../../constants/sports';

const STRONG_DUPLICATE_THRESHOLD = 80;

interface TemplateOption {
  id: string;
  name: string;
  description: string | null;
}

interface ImportReviewBlocksProps {
  session: ActivitySession;
  /** Whether the session already has logged workout sets (strength). */
  hasSets: boolean;
  /** Open the no-timer flow to complete exercises for this session. */
  onCompleteExercises: () => void;
  /** Called when an action replaced/deleted this session (merge, assignment). */
  onSessionReplaced: (newSessionId: string) => void;
}

/**
 * Post-import review blocks shown below the real watch data, per spec:
 * duplicate prompts, multiple-strength chooser, watch-metric conflicts,
 * template suggestion and template association management.
 */
export const ImportReviewBlocks: React.FC<ImportReviewBlocksProps> = ({
  session,
  hasSets,
  onCompleteExercises,
  onSessionReplaced,
}) => {
  const { t } = useTranslation();
  const { colors: themeColors } = useTrainingStyles();
  const { user } = useAuth();
  const { convertDistanceToUi } = useUnitConversion();
  const review = useImportReview(session.id);
  const [templatePickerVisible, setTemplatePickerVisible] = useState(false);
  const [plannedRoutineDismissed, setPlannedRoutineDismissed] = useState(false);
  const [reviewActionCompleted, setReviewActionCompleted] = useState(false);

  useEffect(() => {
    setReviewActionCompleted(false);
  }, [session.id]);

  const isStrength = session.sport_type === 'strength';
  const sportLabel = t(getSportDefaultTitleKey(session.sport_type, session.sport_subtype));
  const reviewActionPending =
    review.associateTemplate.isPending ||
    review.dismissSuggestion.isPending ||
    review.mergeDuplicate.isPending ||
    review.keepBothDuplicates.isPending ||
    review.revertWatchMetrics.isPending ||
    review.keepWatchMetrics.isPending ||
    review.assignStrengthSession.isPending;
  const duplicatePending =
    !reviewActionCompleted && session.duplicate_resolution === 'pending' && session.duplicate_of_session_id != null;
  const duplicateScore = session.duplicate_score ?? 0;
  const hasPendingWatchMetrics = !reviewActionCompleted && session.pending_watch_metrics != null;
  const associatedTemplateId = isStrength ? session.workout_template_id : session.endurance_template_id;

  const showError = () => Alert.alert(t('common.error'), t('training.importReviewActionError'));

  const handleReviewActionSuccess = (survivorId: string) => {
    setReviewActionCompleted(true);
    if (survivorId !== session.id) onSessionReplaced(survivorId);
  };

  const { data: suggestedTemplate } = useQuery({
    queryKey: ['importReviewSuggestedTemplate', session.suggested_endurance_template_id],
    queryFn: async (): Promise<TemplateOption | null> => {
      if (!session.suggested_endurance_template_id) return null;
      const { data, error } = await supabase
        .from('endurance_workout_templates')
        .select('id, base_name, description')
        .eq('id', session.suggested_endurance_template_id)
        .maybeSingle();
      if (error) throw error;
      return data ? { id: data.id, name: data.base_name, description: data.description } : null;
    },
    enabled: !!session.suggested_endurance_template_id,
  });

  const { data: associatedTemplate } = useQuery({
    queryKey: ['importReviewAssociatedTemplate', isStrength, associatedTemplateId],
    queryFn: async (): Promise<TemplateOption | null> => {
      if (!associatedTemplateId) return null;
      const { data, error } = await supabase
        .from(isStrength ? 'workout_templates' : 'endurance_workout_templates')
        .select('id, base_name, description')
        .eq('id', associatedTemplateId)
        .maybeSingle();
      if (error) throw error;
      return data ? { id: data.id, name: data.base_name, description: data.description } : null;
    },
    enabled: !!associatedTemplateId,
  });

  const { data: duplicateTarget } = useQuery({
    queryKey: ['importReviewDuplicateTarget', session.duplicate_of_session_id],
    queryFn: async (): Promise<ActivitySession | null> => {
      if (!session.duplicate_of_session_id) return null;
      const { data, error } = await supabase
        .from('activity_sessions')
        .select('*')
        .eq('id', session.duplicate_of_session_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: duplicatePending,
  });
  const reviewTargetSessionId = duplicateTarget?.id ?? session.duplicate_of_session_id ?? undefined;

  const { data: templateOptions = [] } = useQuery({
    queryKey: ['importReviewTemplateOptions', user?.id, session.sport_type],
    queryFn: async (): Promise<TemplateOption[]> => {
      if (!user) return [];
      const query = isStrength
        ? supabase.from('workout_templates').select('id, base_name, description').eq('user_id', user.id)
        : supabase
            .from('endurance_workout_templates')
            .select('id, base_name, description')
            .eq('user_id', user.id)
            .eq('sport_type', session.sport_type);
      const { data, error } = await query.order('base_name');
      if (error) throw error;
      return (data ?? []).map(row => ({ id: row.id, name: row.base_name, description: row.description }));
    },
    enabled: !!user && templatePickerVisible,
  });

  const sessionDayRange = useMemo(() => {
    const start = new Date(session.start_time);
    const dayStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 3600 * 1000);
    return { from: dayStart.toISOString(), to: dayEnd.toISOString() };
  }, [session.start_time]);

  const { data: todaysStrengthSessions = [] } = useQuery({
    queryKey: ['importReviewStrengthCandidates', user?.id, session.id, sessionDayRange.from],
    queryFn: async (): Promise<ActivitySession[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('activity_sessions')
        .select('*')
        .eq('user_id', user.id)
        .in('sport_type', ['strength', 'gym'])
        .neq('id', session.id)
        .neq('status', 'cancelled')
        .gte('start_time', sessionDayRange.from)
        .lt('start_time', sessionDayRange.to)
        .order('start_time');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && session.needs_strength_review,
  });

  // Strength BPMN: when a generic watch session lands on a day that has a
  // planned (not completed) gym routine, suggest associating it.
  const sessionLocalDate = format(new Date(session.start_time), 'yyyy-MM-dd');
  const { data: plannedRoutine } = useQuery({
    queryKey: ['importReviewPlannedRoutine', user?.id, sessionLocalDate],
    queryFn: async (): Promise<TemplateOption | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('workout_plans')
        .select('gym_template_id, workout_templates:gym_template_id(id, base_name, description)')
        .eq('user_id', user.id)
        .eq('planned_date', sessionLocalDate)
        .eq('status', 'planned')
        .not('gym_template_id', 'is', null)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      const template = data?.workout_templates;
      return template ? { id: template.id, name: template.base_name, description: template.description } : null;
    },
    enabled: !!user && isStrength && !associatedTemplateId,
  });

  const handleAssociateTemplate = (templateId: string) => {
    setTemplatePickerVisible(false);
    review.associateTemplate.mutate(
      isStrength
        ? { workoutTemplateId: templateId, targetSessionId: reviewTargetSessionId }
        : { enduranceTemplateId: templateId, targetSessionId: reviewTargetSessionId },
      {
        onSuccess: survivorId => {
          handleReviewActionSuccess(survivorId);
          if (survivorId === session.id && isStrength && !hasSets) {
            Alert.alert(t('training.importCompleteExercises'), t('training.importNoExercisesPrompt'), [
              { text: t('training.importNotNow'), style: 'cancel' },
              { text: t('training.importCompleteExercises'), onPress: onCompleteExercises },
            ]);
          }
        },
        onError: showError,
      },
    );
  };

  const handleRemoveAssociation = () => {
    Alert.alert(t('training.importRemoveAssociation'), t('training.importRemoveAssociationConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('training.importRemoveAssociation'),
        style: 'destructive',
        onPress: () =>
          review.associateTemplate.mutate(
            { enduranceTemplateId: null, targetSessionId: reviewTargetSessionId, workoutTemplateId: null },
            { onError: showError, onSuccess: handleReviewActionSuccess },
          ),
      },
    ]);
  };

  const handleMerge = () => {
    review.mergeDuplicate.mutate(
      { targetSessionId: reviewTargetSessionId },
      {
        onSuccess: handleReviewActionSuccess,
        onError: showError,
      },
    );
  };

  const handleKeepBoth = () => {
    review.keepBothDuplicates.mutate(
      { targetSessionId: reviewTargetSessionId },
      {
        onSuccess: handleReviewActionSuccess,
        onError: showError,
      },
    );
  };

  const handleDismissSuggestion = () => {
    review.dismissSuggestion.mutate(
      { targetSessionId: reviewTargetSessionId },
      {
        onSuccess: handleReviewActionSuccess,
        onError: showError,
      },
    );
  };

  const handleKeepWatchMetrics = () => {
    review.keepWatchMetrics.mutate(
      { targetSessionId: reviewTargetSessionId },
      {
        onSuccess: handleReviewActionSuccess,
        onError: showError,
      },
    );
  };

  const handleRevertWatchMetrics = () => {
    review.revertWatchMetrics.mutate(
      { targetSessionId: reviewTargetSessionId },
      {
        onSuccess: handleReviewActionSuccess,
        onError: showError,
      },
    );
  };

  const handleKeepPlannedRoutineGeneric = () => {
    if (reviewActionPending || reviewActionCompleted) return;
    setPlannedRoutineDismissed(true);
  };

  const handleOpenTemplatePicker = () => {
    if (reviewActionPending || reviewActionCompleted) return;
    setTemplatePickerVisible(true);
  };

  const handleCompleteExercises = () => {
    if (reviewActionPending || reviewActionCompleted) return;
    onCompleteExercises();
  };

  const handleAssign = (targetSessionId?: string) => {
    review.assignStrengthSession.mutate(
      { targetSessionId },
      {
        onSuccess: handleReviewActionSuccess,
        onError: showError,
      },
    );
  };

  const handleKeepAsNewStrength = () => {
    review.assignStrengthSession.mutate(
      {},
      {
        onSuccess: handleReviewActionSuccess,
        onError: showError,
      },
    );
  };

  const sessionDisplayName = (candidate: ActivitySession): string => {
    const base = candidate.name || t(getSportDefaultTitleKey(candidate.sport_type, candidate.sport_subtype));
    return `${base} · ${format(new Date(candidate.start_time), 'HH:mm')}`;
  };

  const sessionMetricSummary = (candidate: ActivitySession): string => {
    const parts = [format(new Date(candidate.start_time), 'HH:mm')];
    if (candidate.duration_s != null && candidate.duration_s > 0) {
      parts.push(formatDuration(candidate.duration_s));
    }
    if (candidate.distance_m != null && candidate.distance_m > 0) {
      const distance = convertDistanceToUi(candidate.distance_m, 2);
      parts.push(`${distance.value} ${distance.unit}`);
    }
    if (candidate.total_sets != null && candidate.total_sets > 0) {
      parts.push(t('training.importSessionSets', { count: candidate.total_sets }));
    }
    if (candidate.calories_kcal != null && candidate.calories_kcal > 0) {
      parts.push(t('training.importSessionKcal', { kcal: Math.round(candidate.calories_kcal) }));
    }
    return parts.join(' · ');
  };

  const renderTemplatePicker = () => (
    <Modal
      visible={templatePickerVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setTemplatePickerVisible(false)}
    >
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setTemplatePickerVisible(false)}>
        <View style={[styles.modalCard, { backgroundColor: themeColors.background }]}>
          <Text style={[typography.h3, { color: themeColors.textPrimary, marginBottom: spacing.m }]}>
            {t(isStrength ? 'training.importChooseStrengthTemplate' : 'training.importChooseEnduranceTemplate')}
          </Text>
          {templateOptions.length === 0 ? (
            <Text style={[typography.body, { color: themeColors.textSecondary }]}>
              {t('training.importNoTemplatesAvailable')}
            </Text>
          ) : (
            <FlatList
              data={templateOptions}
              keyExtractor={item => item.id}
              style={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.templateRow, { borderColor: themeColors.border }]}
                  disabled={reviewActionPending || reviewActionCompleted}
                  onPress={() => handleAssociateTemplate(item.id)}
                >
                  <Text style={[typography.body, { color: themeColors.textPrimary, fontWeight: '600' }]}>
                    {item.name}
                  </Text>
                  {item.description ? (
                    <Text style={[typography.caption, { color: themeColors.textSecondary }]} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View>
      {/* 1. Priority duplicate prompt (score >= 80, pending) */}
      {duplicatePending && duplicateScore >= STRONG_DUPLICATE_THRESHOLD && (
        <GlassCard style={styles.blockCard}>
          <View style={styles.blockHeader}>
            <AlertTriangle size={20} color={themeColors.warning} />
            <Text style={[typography.body, styles.blockTitle, { color: themeColors.textPrimary }]}>
              {isStrength
                ? t('training.importPossibleDuplicate')
                : t('training.importDuplicatePriorityTitle', { sport: sportLabel })}
            </Text>
          </View>
          {duplicateTarget && (
            <View style={[styles.comparisonBox, { borderColor: themeColors.border }]}>
              <View style={styles.comparisonColumn}>
                <Text style={[typography.caption, { color: themeColors.textSecondary }]}>
                  {t('training.importWatchActivity')}
                </Text>
                <Text
                  style={[typography.body, { color: themeColors.textPrimary, fontWeight: '600' }]}
                  numberOfLines={1}
                >
                  {session.name || t(getSportDefaultTitleKey(session.sport_type, session.sport_subtype))}
                </Text>
                <Text style={[typography.caption, { color: themeColors.textSecondary }]}>
                  {sessionMetricSummary(session)}
                </Text>
              </View>
              <View style={[styles.comparisonDivider, { backgroundColor: themeColors.border }]} />
              <View style={styles.comparisonColumn}>
                <Text style={[typography.caption, { color: themeColors.textSecondary }]}>
                  {t('training.importExistingWorkout')}
                </Text>
                <Text
                  style={[typography.body, { color: themeColors.textPrimary, fontWeight: '600' }]}
                  numberOfLines={1}
                >
                  {duplicateTarget.name ||
                    t(getSportDefaultTitleKey(duplicateTarget.sport_type, duplicateTarget.sport_subtype))}
                </Text>
                <Text style={[typography.caption, { color: themeColors.textSecondary }]}>
                  {sessionMetricSummary(duplicateTarget)}
                </Text>
              </View>
            </View>
          )}
          <Text style={[typography.caption, { color: themeColors.textSecondary, marginBottom: spacing.s }]}>
            {t(isStrength ? 'training.importStrengthMergeExplanation' : 'training.importMergeExplanation')}
          </Text>
          <View style={styles.buttonRow}>
            <PrimaryButton
              title={t('training.importMergeKeepExisting')}
              onPress={handleMerge}
              loading={review.mergeDuplicate.isPending}
              disabled={reviewActionPending || reviewActionCompleted}
              style={styles.rowButton}
            />
            <PrimaryButton
              title={t(isStrength ? 'training.importNoKeepBoth' : 'training.importKeepBoth')}
              onPress={handleKeepBoth}
              loading={review.keepBothDuplicates.isPending}
              disabled={reviewActionPending || reviewActionCompleted}
              variant="outline"
              style={styles.rowButton}
            />
          </View>
        </GlassCard>
      )}

      {/* 2. Subtle same-day notice (score < 80, pending) */}
      {duplicatePending && duplicateScore < STRONG_DUPLICATE_THRESHOLD && (
        <GlassCard style={styles.blockCard}>
          <Text style={[typography.caption, { color: themeColors.textSecondary }]}>
            {t('training.importDuplicateSubtle', { sport: sportLabel })}
          </Text>
          <TouchableOpacity onPress={handleMerge} disabled={reviewActionPending || reviewActionCompleted}>
            <Text style={[typography.caption, styles.linkText, { color: themeColors.primary }]}>
              {t('training.importMergeManually')}
            </Text>
          </TouchableOpacity>
        </GlassCard>
      )}

      {/* 3. Multiple strength sessions chooser */}
      {!reviewActionCompleted && session.needs_strength_review && (
        <GlassCard style={styles.blockCard}>
          <View style={styles.blockHeader}>
            <Link2 size={20} color={themeColors.primary} />
            <Text style={[typography.body, styles.blockTitle, { color: themeColors.textPrimary }]}>
              {t('training.importMultipleStrengthPrompt')}
            </Text>
          </View>
          {todaysStrengthSessions.map(candidate => (
            <PrimaryButton
              key={candidate.id}
              title={t('training.importAssignToSessionKeepingData', { name: sessionDisplayName(candidate) })}
              onPress={() => handleAssign(candidate.id)}
              loading={review.assignStrengthSession.isPending}
              disabled={reviewActionPending || reviewActionCompleted}
              variant="secondary"
              style={styles.stackedButton}
            />
          ))}
          <PrimaryButton
            title={t('training.importKeepAsNew')}
            onPress={handleKeepAsNewStrength}
            loading={review.assignStrengthSession.isPending}
            disabled={reviewActionPending || reviewActionCompleted}
            variant="outline"
            style={styles.stackedButton}
          />
        </GlassCard>
      )}

      {/* 4. Watch metrics applied (watch wins by default; optional revert) */}
      {hasPendingWatchMetrics && (
        <GlassCard style={styles.blockCard}>
          <View style={styles.blockHeader}>
            <Watch size={20} color={themeColors.primary} />
            <Text style={[typography.body, styles.blockTitle, { color: themeColors.textPrimary }]}>
              {t('training.importWatchDataPrompt')}
            </Text>
          </View>
          <View style={styles.buttonRow}>
            <PrimaryButton
              title={t('training.importKeepWatchData')}
              onPress={handleKeepWatchMetrics}
              loading={review.keepWatchMetrics.isPending}
              disabled={reviewActionPending || reviewActionCompleted}
              style={styles.rowButton}
            />
            <PrimaryButton
              title={t('training.importKeepMine')}
              onPress={handleRevertWatchMetrics}
              loading={review.revertWatchMetrics.isPending}
              disabled={reviewActionPending || reviewActionCompleted}
              variant="outline"
              style={styles.rowButton}
            />
          </View>
        </GlassCard>
      )}

      {/* 4b. Planned gym routine suggestion (strength BPMN) */}
      {isStrength && !reviewActionCompleted && !associatedTemplateId && plannedRoutine && !plannedRoutineDismissed && (
        <GlassCard style={styles.blockCard}>
          <View style={styles.blockHeader}>
            <Sparkles size={20} color={themeColors.success} />
            <Text style={[typography.body, styles.blockTitle, { color: themeColors.textPrimary }]}>
              {t('training.importSuggestedTemplate', { templateName: plannedRoutine.name })}
            </Text>
          </View>
          <View style={styles.buttonRow}>
            <PrimaryButton
              title={t('training.importAssociate')}
              onPress={() => handleAssociateTemplate(plannedRoutine.id)}
              loading={review.associateTemplate.isPending}
              disabled={reviewActionPending || reviewActionCompleted}
              style={styles.rowButton}
            />
            <PrimaryButton
              title={t('training.importKeepGeneric')}
              onPress={handleKeepPlannedRoutineGeneric}
              disabled={reviewActionPending || reviewActionCompleted}
              variant="outline"
              style={styles.rowButton}
            />
          </View>
        </GlassCard>
      )}

      {/* 5. Template suggestion (60-79%) */}
      {!reviewActionCompleted && !associatedTemplateId && suggestedTemplate && (
        <GlassCard style={styles.blockCard}>
          <View style={styles.blockHeader}>
            <Sparkles size={20} color={themeColors.success} />
            <Text style={[typography.body, styles.blockTitle, { color: themeColors.textPrimary }]}>
              {t('training.importSuggestedTemplate', { templateName: suggestedTemplate.name })}
            </Text>
          </View>
          {session.template_match_score != null && (
            <Text style={[typography.caption, { color: themeColors.textSecondary, marginBottom: spacing.s }]}>
              {t('training.importMatchScoreLabel', { score: Math.round(session.template_match_score) })}
            </Text>
          )}
          <View style={styles.buttonRow}>
            <PrimaryButton
              title={t('training.importAssociate')}
              onPress={() => handleAssociateTemplate(suggestedTemplate.id)}
              loading={review.associateTemplate.isPending}
              disabled={reviewActionPending || reviewActionCompleted}
              style={styles.rowButton}
            />
            <PrimaryButton
              title={t('training.importKeepGeneric')}
              onPress={handleDismissSuggestion}
              loading={review.dismissSuggestion.isPending}
              disabled={reviewActionPending || reviewActionCompleted}
              variant="outline"
              style={styles.rowButton}
            />
          </View>
        </GlassCard>
      )}

      {/* 6. Template association management */}
      {associatedTemplateId && associatedTemplate ? (
        <GlassCard style={styles.blockCard}>
          <Text style={[typography.caption, { color: themeColors.textSecondary }]}>
            {t('training.importAssociatedTemplate')}
          </Text>
          <Text style={[typography.h3, { color: themeColors.textPrimary, marginTop: 2 }]}>
            {associatedTemplate.name}
          </Text>
          {associatedTemplate.description ? (
            <View style={{ marginTop: spacing.s }}>
              <Text style={[typography.caption, { color: themeColors.textSecondary }]}>
                {t('training.importTemplateGoal')}
              </Text>
              <Text style={[typography.body, { color: themeColors.textPrimary }]}>
                {associatedTemplate.description}
              </Text>
            </View>
          ) : null}
          {session.template_match_score != null && (
            <Text style={[typography.caption, { color: themeColors.textSecondary, marginTop: spacing.s }]}>
              {t('training.importMatchScoreLabel', { score: Math.round(session.template_match_score) })}
            </Text>
          )}
          <View style={[styles.buttonRow, { marginTop: spacing.m }]}>
            <PrimaryButton
              title={t('training.importChangeTemplate')}
              onPress={handleOpenTemplatePicker}
              disabled={reviewActionPending || reviewActionCompleted}
              variant="secondary"
              style={styles.rowButton}
            />
            <PrimaryButton
              title={t('training.importRemoveAssociation')}
              onPress={handleRemoveAssociation}
              loading={review.associateTemplate.isPending}
              disabled={reviewActionPending || reviewActionCompleted}
              variant="outline"
              style={styles.rowButton}
            />
          </View>
          {isStrength && !hasSets && (
            <PrimaryButton
              title={t('training.importCompleteExercises')}
              onPress={handleCompleteExercises}
              disabled={reviewActionPending || reviewActionCompleted}
              variant="secondary"
              style={styles.stackedButton}
            />
          )}
        </GlassCard>
      ) : (
        <GlassCard style={styles.blockCard}>
          {isStrength ? (
            <>
              <Text style={[typography.body, { color: themeColors.textPrimary, marginBottom: spacing.s }]}>
                {t('training.importAssociateStrengthTemplate')}
              </Text>
              <View style={styles.buttonRow}>
                <PrimaryButton
                  title={t('training.importAssociate')}
                  onPress={handleOpenTemplatePicker}
                  disabled={reviewActionPending || reviewActionCompleted}
                  style={styles.rowButton}
                />
                {!hasSets && (
                  <PrimaryButton
                    title={t('training.importCompleteExercises')}
                    onPress={handleCompleteExercises}
                    disabled={reviewActionPending || reviewActionCompleted}
                    variant="outline"
                    style={styles.rowButton}
                  />
                )}
              </View>
            </>
          ) : (
            <TouchableOpacity
              onPress={handleOpenTemplatePicker}
              disabled={reviewActionPending || reviewActionCompleted}
            >
              <Text style={[typography.body, styles.linkText, { color: themeColors.primary }]}>
                {t('training.importAssociateTemplate')}
              </Text>
            </TouchableOpacity>
          )}
        </GlassCard>
      )}

      {renderTemplatePicker()}
    </View>
  );
};

const styles = StyleSheet.create({
  blockCard: {
    marginBottom: spacing.m,
    padding: spacing.m,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s,
    marginBottom: spacing.m,
  },
  blockTitle: {
    flex: 1,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  rowButton: {
    flex: 1,
    height: 44,
    paddingHorizontal: spacing.s,
  },
  stackedButton: {
    marginTop: spacing.s,
    height: 44,
  },
  comparisonBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: borderRadius.m,
    flexDirection: 'row',
    gap: spacing.s,
    marginBottom: spacing.s,
    padding: spacing.s,
  },
  comparisonColumn: {
    flex: 1,
    gap: 2,
  },
  comparisonDivider: {
    width: StyleSheet.hairlineWidth,
  },
  linkText: {
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: spacing.l,
  },
  modalCard: {
    borderRadius: borderRadius.l,
    padding: spacing.l,
    maxHeight: '70%',
  },
  modalList: {
    flexGrow: 0,
  },
  templateRow: {
    paddingVertical: spacing.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

export default ImportReviewBlocks;
