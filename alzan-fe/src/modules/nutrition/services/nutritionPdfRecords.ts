type NutritionPdfLog = { adherence_status: string | null };

export const isNutritionPdfRecord = (log: NutritionPdfLog): boolean => log.adherence_status !== 'skipped';

export const hasNutritionPdfRecords = (logs: NutritionPdfLog[]): boolean => logs.some(isNutritionPdfRecord);
