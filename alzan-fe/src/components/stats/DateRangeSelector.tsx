import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, borderRadius, spacing, typography } from '../../theme';
import { useTranslation } from 'react-i18next';

export type DateRangeOption = '7d' | '4w' | '3m' | 'custom';

interface DateRangeSelectorProps {
  selected: DateRangeOption;
  onSelect: (option: DateRangeOption) => void;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ selected, onSelect }) => {
  const { t } = useTranslation();
  const options: { id: DateRangeOption; label: string }[] = [
    { id: '7d', label: t('health.last7Days') },
    { id: '4w', label: t('training.lastMonth') },
    { id: '3m', label: t('health.last3Months') },
  ];

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {options.map(opt => {
          const isActive = selected === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => onSelect(opt.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.label, isActive && styles.labelActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.m,
  },
  scrollContent: {
    flexDirection: 'row',
    paddingHorizontal: spacing.s,
  },
  pill: {
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: borderRadius.l,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginRight: spacing.s,
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.white,
  },
});
