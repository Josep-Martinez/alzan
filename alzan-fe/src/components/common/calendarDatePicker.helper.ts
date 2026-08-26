import { addDays, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns';

const normalizeDate = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const formatCalendarDate = (date: Date): string => format(normalizeDate(date), 'yyyy-MM-dd');

export const isSameCalendarDate = (left: Date, right: Date): boolean =>
  formatCalendarDate(left) === formatCalendarDate(right);

export const buildCalendarMonth = (month: Date): Date[] => {
  const firstDay = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const lastDay = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days: Date[] = [];

  for (let day = firstDay; day <= lastDay || days.length < 42; day = addDays(day, 1)) {
    days.push(normalizeDate(day));
  }

  return days;
};

export const isCalendarDateSelectable = (date: Date, minimumDate?: Date, maximumDate?: Date): boolean => {
  const candidate = normalizeDate(date).getTime();
  const minimum = minimumDate ? normalizeDate(minimumDate).getTime() : Number.NEGATIVE_INFINITY;
  const maximum = maximumDate ? normalizeDate(maximumDate).getTime() : Number.POSITIVE_INFINITY;

  return candidate >= minimum && candidate <= maximum;
};

export const isCalendarMonthWithinBounds = (month: Date, minimumDate?: Date, maximumDate?: Date): boolean => {
  const monthStart = normalizeDate(startOfMonth(month)).getTime();
  const monthEnd = normalizeDate(endOfMonth(month)).getTime();
  const minimum = minimumDate ? normalizeDate(minimumDate).getTime() : Number.NEGATIVE_INFINITY;
  const maximum = maximumDate ? normalizeDate(maximumDate).getTime() : Number.POSITIVE_INFINITY;

  return monthEnd >= minimum && monthStart <= maximum;
};
