import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography } from '../../../theme';
import { LucideIcon } from 'lucide-react-native';
import { TrendArrow } from './TrendArrow';

interface HealthCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  trend?: 'increasing' | 'decreasing' | 'stable';
  icon?: LucideIcon;
  iconColor?: string;
  onPress?: () => void;
}

export const HealthCard: React.FC<HealthCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  trend,
  icon: Icon,
  iconColor,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} disabled={!onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {Icon && <Icon size={20} color={iconColor || colors.primary} />}
      </View>

      <View style={styles.valueContainer}>
        <Text style={styles.value}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
        {trend && <TrendArrow trend={trend} size={20} />}
      </View>

      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </TouchableOpacity>
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
    marginBottom: 8,
  },
  title: {
    ...typography.h4,
    color: colors.textSecondary,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    ...typography.h2,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  unit: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
