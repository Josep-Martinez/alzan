import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { DietTemplateMeal, DietTemplateMealInsert } from '../types/requests.types';

export const useDietTemplates = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 1. Listar todas las plantillas
  const {
    data: templates = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dietTemplates', user?.id],
    queryFn: async () => {
      console.log('[useDietTemplates.list] Fetching templates');
      try {
        if (!user) return [];
        const { data, error } = await supabase
          .from('diet_templates')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[useDietTemplates.list] Error:', error);
          throw error;
        }
        console.log('[useDietTemplates.list] Éxito - templates:', data?.length);
        return data;
      } catch (err) {
        console.error('[useDietTemplates.list] Exception:', err);
        throw err;
      }
    },
    enabled: !!user,
  });

  // 2. Crear nueva plantilla (cabecera)
  const createTemplate = useMutation({
    mutationFn: async (vars: { name: string; description?: string; targetKcal?: number }) => {
      console.log('[useDietTemplates.create] Iniciando - name:', vars.name);
      try {
        if (!user) throw new Error('No user');
        const { data, error } = await supabase
          .from('diet_templates')
          .insert({
            user_id: user.id,
            base_name: vars.name,
            description: vars.description,
            daily_calorie_target_kcal: vars.targetKcal,
          })
          .select()
          .single();

        if (error) {
          console.error('[useDietTemplates.create] Error:', error);
          throw error;
        }
        console.log('[useDietTemplates.create] Éxito - id:', data?.id);
        return data;
      } catch (err) {
        console.error('[useDietTemplates.create] Exception:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dietTemplates'] });
    },
  });

  // 3. Eliminar plantilla
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      console.log('[useDietTemplates.delete] Iniciando - id:', id);
      try {
        const { error } = await supabase.from('diet_templates').delete().eq('id', id);
        if (error) {
          console.error('[useDietTemplates.delete] Error:', error);
          throw error;
        }
        console.log('[useDietTemplates.delete] Éxito');
      } catch (err) {
        console.error('[useDietTemplates.delete] Exception:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dietTemplates'] });
    },
  });

  return {
    templates,
    isLoading,
    error,
    createTemplate,
    deleteTemplate,
  };
};

export const useDietTemplateDetails = (templateId: string | null) => {
  const queryClient = useQueryClient();

  const { data: template, isLoading: isLoadingTemplate } = useQuery({
    queryKey: ['dietTemplate', templateId],
    queryFn: async () => {
      if (!templateId) return null;
      const { data, error } = await supabase.from('diet_templates').select('*').eq('id', templateId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!templateId,
  });

  const { data: meals = [], isLoading: isLoadingMeals } = useQuery({
    queryKey: ['dietTemplateMeals', templateId],
    queryFn: async () => {
      if (!templateId) return [];
      const { data, error } = await supabase
        .from('diet_template_meals')
        .select('*')
        .eq('diet_template_id', templateId)
        .order('day_of_week', { ascending: true })
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!templateId,
  });

  // Guardar (Upsert) lista de comidas
  const saveMeals = useMutation({
    mutationFn: async (mealsToSave: Partial<DietTemplateMeal>[]) => {
      if (!templateId) throw new Error('No template ID');

      // Aseguramos que tengan el diet_template_id
      const prepared = mealsToSave.map(m => ({
        ...m,
        diet_template_id: templateId,
      }));

      // Supabase upsert
      const { data, error } = await supabase
        .from('diet_template_meals')
        .upsert(prepared as unknown as DietTemplateMealInsert) // cast necesario por partial id
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dietTemplateMeals', templateId] });
    },
  });

  const deleteMeal = useMutation({
    mutationFn: async (mealId: string) => {
      const { error } = await supabase.from('diet_template_meals').delete().eq('id', mealId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dietTemplateMeals', templateId] });
    },
  });

  return {
    template,
    meals,
    isLoading: isLoadingTemplate || isLoadingMeals,
    saveMeals,
    deleteMeal,
  };
};
