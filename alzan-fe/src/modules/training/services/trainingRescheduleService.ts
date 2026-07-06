import { supabase } from '../../../lib/supabaseClient';
import {
  buildMovedWorkoutSourceSkipInsert,
  buildWorkoutPlanMoveUpdate,
  validateWorkoutPlanMove,
  type MoveWorkoutPlanInput,
} from '../helpers/trainingReschedule.helper';

export type { MoveWorkoutPlanInput, MoveWorkoutPlanValidation } from '../helpers/trainingReschedule.helper';
export {
  buildMovedWorkoutSourceSkipInsert,
  buildWorkoutPlanMoveUpdate,
  validateWorkoutPlanMove,
} from '../helpers/trainingReschedule.helper';

const getDayOfWeek = (date: string) => new Date(`${date}T00:00:00`).getDay();

const shouldBlockMovedSourceRecurrence = async (
  sourcePlan: {
    endurance_template_id: string | null;
    gym_template_id: string | null;
    user_id: string;
  },
  fromDate: string,
): Promise<boolean> => {
  const sourceDay = getDayOfWeek(fromDate);

  if (sourcePlan.gym_template_id) {
    const { data, error } = await supabase
      .from('workout_templates')
      .select('suggested_day_of_week')
      .eq('id', sourcePlan.gym_template_id)
      .eq('user_id', sourcePlan.user_id)
      .maybeSingle();

    if (error) throw error;
    return data?.suggested_day_of_week === sourceDay;
  }

  if (sourcePlan.endurance_template_id) {
    const { data, error } = await supabase
      .from('endurance_workout_templates')
      .select('scheduled_day')
      .eq('id', sourcePlan.endurance_template_id)
      .eq('user_id', sourcePlan.user_id)
      .maybeSingle();

    if (error) throw error;
    return data?.scheduled_day === sourceDay;
  }

  return false;
};

export const moveWorkoutPlan = async (input: MoveWorkoutPlanInput): Promise<void> => {
  const validation = validateWorkoutPlanMove(input);
  if (!validation.ok) {
    throw new Error(`workout_plan_move_${validation.reason}`);
  }

  const { data: sourcePlan, error: sourceError } = await supabase
    .from('workout_plans')
    .select('id, user_id, gym_template_id, endurance_template_id')
    .eq('id', input.planId)
    .eq('planned_date', input.fromDate)
    .neq('status', 'completed')
    .is('completed_at', null)
    .maybeSingle();

  if (sourceError) throw sourceError;
  if (!sourcePlan) throw new Error('workout_plan_move_not_found');

  const { data, error } = await supabase
    .from('workout_plans')
    .update(buildWorkoutPlanMoveUpdate(input.toDate))
    .eq('id', input.planId)
    .eq('planned_date', input.fromDate)
    .neq('status', 'completed')
    .is('completed_at', null)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('workout_plan_move_not_found');

  const shouldInsertSourceSkip = await shouldBlockMovedSourceRecurrence(sourcePlan, input.fromDate);
  if (!shouldInsertSourceSkip) return;

  const sourceSkip = buildMovedWorkoutSourceSkipInsert(sourcePlan, input.fromDate);
  if (!sourceSkip) return;

  const existingSkipQuery = supabase
    .from('workout_plans')
    .select('id')
    .eq('user_id', sourceSkip.user_id)
    .eq('planned_date', sourceSkip.planned_date)
    .eq('status', 'skipped');

  const { data: existingSkipRows, error: existingSkipError } = sourceSkip.gym_template_id
    ? await existingSkipQuery.eq('gym_template_id', sourceSkip.gym_template_id).limit(1)
    : sourceSkip.endurance_template_id
      ? await existingSkipQuery.eq('endurance_template_id', sourceSkip.endurance_template_id).limit(1)
      : { data: [], error: null };

  if (existingSkipError) throw existingSkipError;
  if (existingSkipRows && existingSkipRows.length > 0) return;

  const { error: skipError } = await supabase.from('workout_plans').insert(sourceSkip);
  if (skipError) throw skipError;
};
