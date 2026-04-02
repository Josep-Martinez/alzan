import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { measurementApi } from '../services/measurementApi';
import { MeasurementType } from '../../../types/requests.types';

export const useMeasurements = (type?: MeasurementType, limit = 100) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['measurements', user?.id, type, limit], // Keep original type in key to avoid cache thrashing if needed, or update to queryType
    queryFn: () => measurementApi.getMeasurements(user!.id, type, limit),
    enabled: !!user?.id,
  });
};

export const useAddMeasurement = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      measurement_type: MeasurementType;
      value_cm: number;
      measured_at?: string;
      notes?: string;
    }) => {
      if (!user?.id) throw new Error('No hay usuario autenticado');

      // Check if this measurement type already exists for this day
      const targetDate = data.measured_at ? new Date(data.measured_at) : new Date();
      const exists = await measurementApi.checkExistsForDay(user.id, data.measurement_type, targetDate);
      if (exists) {
        const error = new Error('DUPLICATE_DAY') as Error & { type: string; measurementType: string };
        error.type = 'DUPLICATE_DAY';
        error.measurementType = data.measurement_type;
        throw error;
      }

      const result = await measurementApi.addMeasurement({
        user_id: user.id,
        measured_at: new Date().toISOString(),
        ...data,
      });

      // NOTE: We intentionally do NOT recalculate existing weight logs here.
      // Saved body composition values (BMI, body fat %, muscle %) should remain unchanged.
      // New measurements will only be used for FUTURE weight log entries.
      // A manual "Recalculate" button may be added in the future for users who want to update.

      return result;
    },
    onSuccess: () => {
      // Invalidate measurements for this user
      queryClient.invalidateQueries({ queryKey: ['measurements', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['healthInsights'] });
      // Note: We do NOT invalidate weightLogs since saved body composition values should not change
    },
  });
};

export const useDeleteMeasurement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: measurementApi.deleteMeasurement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurements'] });
    },
  });
};
