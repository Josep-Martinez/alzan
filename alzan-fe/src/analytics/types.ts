export type DateRange = {
  startDate: Date;
  endDate: Date;
};

export type TrendDirection = 'up' | 'down' | 'stable' | 'neutral';

export type Trend = {
  value: number; // The difference or percentage
  direction: TrendDirection;
  label: string; // "15% más que la semana anterior"
};

// Common return type patterns
export type DailyStatPoint = {
  date: string; // ISO date string YYYY-MM-DD
  value: number;
  label?: string; // Optional label for UI
};
