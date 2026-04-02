import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SimpleChart } from '../../../components/stats/SimpleChart';
import { colors, typography } from '../../../theme';
import { WeightLog } from '../../../types/requests.types';
import { useTranslation } from 'react-i18next';

interface WeightChartProps {
  data: WeightLog[];
}

export const WeightChart: React.FC<WeightChartProps> = ({ data }) => {
  const { t } = useTranslation();
  if (!data || data.length === 0) {
    return null;
  }

  // Transform data for SimpleChart (reverse to show chronologically)
  const chartData = data
    .slice()
    .reverse()
    .map(log => ({
      label: new Date(log.measured_at).getDate().toString(),
      value: log.weight_kg,
    }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('health.last30Days')}</Text>
      <SimpleChart data={chartData} type="line" height={200} color={colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: 16,
  },
});
