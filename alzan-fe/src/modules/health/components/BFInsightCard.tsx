import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../../theme';
import { Info } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useUnitConversion } from '../../../hooks/useUnitConversion';

interface BFInsightCardProps {
  bodyFatPercent?: number;
  leanMassKg?: number;
  method?: string;
}

export const BFInsightCard: React.FC<BFInsightCardProps> = ({ bodyFatPercent, leanMassKg, method = 'estimado' }) => {
  const { t } = useTranslation();
  const { convertWeightToUi } = useUnitConversion();

  if (!bodyFatPercent && !leanMassKg) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('health.bodyComposition')}</Text>
        <Info size={16} color={colors.textSecondary} />
      </View>

      <View style={styles.content}>
        {bodyFatPercent && (
          <View style={styles.metric}>
            <Text style={styles.label}>{t('health.bodyFat')}</Text>
            <Text style={styles.value}>{bodyFatPercent.toFixed(1)}%</Text>
          </View>
        )}

        {leanMassKg && (
          <View style={styles.metric}>
            <Text style={styles.label}>{t('health.leanMass')}</Text>
            <Text style={styles.value}>
              {convertWeightToUi(leanMassKg).value}
              {convertWeightToUi(leanMassKg).unit}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.note}>
        {t('health.calculationLabel')}
        {method}
        {t('health.registerMeasurementsHint')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  metric: {
    alignItems: 'center',
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  value: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: '700',
  },
  note: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
