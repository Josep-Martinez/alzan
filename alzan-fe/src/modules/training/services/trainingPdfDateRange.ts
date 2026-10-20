import { addDays, parseISO, startOfDay } from 'date-fns';

export const getTrainingPdfDateRange = (startDate: string, endDate: string) => ({
  startInclusive: startOfDay(parseISO(startDate)).toISOString(),
  endExclusive: addDays(startOfDay(parseISO(endDate)), 1).toISOString(),
});
