import { addWeeks, endOfWeek, startOfDay, startOfWeek } from 'date-fns';

// Keep five complete weeks available in both directions, including the current week.
const WEEKS_BUFFER = 5;

export interface NutritionCalendarRange {
  weeks: Date[];
  minimumDate: Date;
  maximumDate: Date;
  currentWeekIndex: number;
}

export const getNutritionCalendarRange = (referenceDate: Date = new Date()): NutritionCalendarRange => {
  const currentWeekStart = startOfWeek(startOfDay(referenceDate), { weekStartsOn: 1 });
  const weeks = Array.from({ length: WEEKS_BUFFER * 2 + 1 }, (_, index) =>
    addWeeks(currentWeekStart, index - WEEKS_BUFFER),
  );

  return {
    weeks,
    minimumDate: startOfDay(weeks[0]),
    maximumDate: endOfWeek(weeks[weeks.length - 1], { weekStartsOn: 1 }),
    currentWeekIndex: WEEKS_BUFFER,
  };
};
