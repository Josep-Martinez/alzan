import { supabase } from '../../../lib/supabaseClient';
import { PREDEFINED_TEMPLATES } from '../../../data/predefinedTemplates';
import { propagateTrainingPlans } from './trainingCopyService';

export const copyPredefinedTemplateToMyRoutines = async (
  userId: string,
  templateId: string,
  targetDayOfWeek: number | null,
) => {
  try {
    // 1. Find the predefined template
    const template = PREDEFINED_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      throw new Error('Plantilla no encontrada');
    }

    // 2. Insert into workout_templates
    const { data: newTemplate, error: templateError } = await supabase
      .from('workout_templates')
      .insert({
        user_id: userId,
        base_name: template.name,
        description: template.description || 'Plantilla importada',
        suggested_day_of_week: targetDayOfWeek,
        source: 'user', // Explicitly set source as user since they are copying it
      })
      .select()
      .single();

    if (templateError) throw templateError;

    // 3. Insert exercises
    if (template.exercises.length > 0) {
      const exercisesToInsert = template.exercises.map((ex, index) => ({
        workout_template_id: newTemplate.id,
        exercise_id: ex.exercise_id,
        order_index: index,
        target_sets: ex.target_sets,
        target_reps_min: ex.target_reps_min,
        target_reps_max: ex.target_reps_max,
        rest_seconds: ex.rest_seconds,
        notes: ex.notes,
      }));

      const { error: exercisesError } = await supabase.from('workout_template_exercises').insert(exercisesToInsert);

      if (exercisesError) throw exercisesError;
    }

    // 4. Propagate plans if it has a scheduled day
    if (targetDayOfWeek !== null) {
      await propagateTrainingPlans(userId);
    }

    return newTemplate;
  } catch (error) {
    console.error('Error copying template:', error);
    throw error;
  }
};
