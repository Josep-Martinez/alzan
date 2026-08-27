import { addDays, differenceInCalendarDays, format, startOfDay } from 'date-fns';

export const MAX_MANUAL_STEPS_RANGE_DAYS = 30;

export const getManualStepsRangeDayCount = (startDate: Date, endDate: Date): number => {
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);
  const difference = differenceInCalendarDays(end, start);
  return difference < 0 ? 0 : difference + 1;
};

export const isManualStepsRangeValid = (startDate: Date, endDate: Date): boolean => {
  const dayCount = getManualStepsRangeDayCount(startDate, endDate);
  return dayCount >= 1 && dayCount <= MAX_MANUAL_STEPS_RANGE_DAYS;
};

export const buildManualStepsDateRange = (startDate: Date, endDate: Date): string[] => {
  if (!isManualStepsRangeValid(startDate, endDate)) return [];

  const dayCount = getManualStepsRangeDayCount(startDate, endDate);
  const start = startOfDay(startDate);
  return Array.from({ length: dayCount }, (_, index) => format(addDays(start, index), 'yyyy-MM-dd'));
};
