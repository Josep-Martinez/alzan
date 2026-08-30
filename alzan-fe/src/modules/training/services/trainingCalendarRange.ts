import { addWeeks, startOfWeek } from 'date-fns';

export const TRAINING_FUTURE_WEEK_HORIZON = 5;

export const getTrainingHorizonWeek = (referenceDate: Date = new Date()): Date => {
  const currentWeekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  return addWeeks(currentWeekStart, TRAINING_FUTURE_WEEK_HORIZON);
};
