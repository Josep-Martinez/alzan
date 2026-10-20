import { format, parseISO } from 'date-fns';
import type { TranslationKey } from '../../../i18n/locales/en';
import type { Row } from '../../../types/requests.types';
import { getStressStateCategory } from '../helpers/suuntoHealthPresentation';

export type HealthMetricPdfSample = Pick<
  Row<'health_metric_samples'>,
  'provider' | 'source_channel' | 'metric_type' | 'recorded_at' | 'local_date' | 'unit' | 'value'
>;

export type HealthMetricPdfRow = { date: string; metric: string; value: string; provider: string };

type Translate = (key: TranslationKey, options?: Record<string, string | number>) => string;

const metricLabelKeys: Record<string, TranslationKey> = {
  heart_rate: 'health.heartRate',
  hrv_rmssd: 'health.pdfHrv',
  recovery_balance: 'health.pdfRecoveryBalance',
  stress_state: 'health.pdfStressState',
  spo2: 'health.pdfSpo2',
};

const stressStateLabelKeys: Record<NonNullable<ReturnType<typeof getStressStateCategory>>, TranslationKey> = {
  invalid: 'health.suuntoStressInvalid',
  relaxing: 'health.suuntoStressRelaxing',
  active: 'health.suuntoStressActive',
  passive: 'health.suuntoStressPassive',
  stressful: 'health.suuntoStressful',
  unknown: 'health.suuntoStressUnknown',
};

const getMetricDate = (sample: HealthMetricPdfSample): string =>
  sample.local_date ?? format(parseISO(sample.recorded_at), 'yyyy-MM-dd');

const formatMetricNumber = (value: number, metricType: string): string =>
  metricType === 'spo2' ? String(Math.round((value + Number.EPSILON) * 10) / 10) : String(Math.round(value));

export const summarizeHealthMetricPdfRows = (samples: HealthMetricPdfSample[], t: Translate): HealthMetricPdfRow[] => {
  const grouped = new Map<string, HealthMetricPdfSample[]>();
  for (const sample of samples) {
    if (!metricLabelKeys[sample.metric_type] || !Number.isFinite(Number(sample.value))) continue;
    const key = [getMetricDate(sample), sample.provider, sample.metric_type, sample.unit].join('|');
    const rows = grouped.get(key) ?? [];
    rows.push(sample);
    grouped.set(key, rows);
  }

  return [...grouped.values()]
    .map(rows => {
      const first = rows[0];
      const metric = t(metricLabelKeys[first.metric_type]);
      const provider = first.provider.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
      let value: string;

      if (first.metric_type === 'stress_state') {
        const counts = new Map<TranslationKey, number>();
        rows.forEach(row => {
          const category = getStressStateCategory(Number(row.value));
          if (!category) return;
          const label = stressStateLabelKeys[category];
          counts.set(label, (counts.get(label) ?? 0) + 1);
        });
        value = [...counts.entries()].map(([key, count]) => `${t(key)} (${count})`).join(' · ');
      } else if (first.metric_type === 'recovery_balance') {
        const latest = rows.reduce((current, row) => (row.recorded_at > current.recorded_at ? row : current));
        const rawValue = Number(latest.value);
        value = `${Math.round(rawValue <= 1 ? rawValue * 100 : rawValue)}%`;
      } else {
        const values = rows.map(row => Number(row.value));
        const average = values.reduce((sum, current) => sum + current, 0) / values.length;
        const unit = first.metric_type === 'spo2' && first.unit === 'fraction' ? '%' : first.unit;
        const toDisplay = (raw: number) => (first.metric_type === 'spo2' && raw <= 1 ? raw * 100 : raw);
        const averageDisplay = toDisplay(average);
        const minimum = toDisplay(Math.min(...values));
        const maximum = toDisplay(Math.max(...values));
        value = t('health.pdfMetricStats', {
          average: `${formatMetricNumber(averageDisplay, first.metric_type)} ${unit}`,
          minimum: `${formatMetricNumber(minimum, first.metric_type)} ${unit}`,
          maximum: `${formatMetricNumber(maximum, first.metric_type)} ${unit}`,
          count: rows.length,
        });
      }

      return { date: getMetricDate(first), metric, value, provider };
    })
    .filter(row => row.value.length > 0)
    .sort(
      (left, right) =>
        left.date.localeCompare(right.date) ||
        left.provider.localeCompare(right.provider) ||
        left.metric.localeCompare(right.metric),
    );
};
