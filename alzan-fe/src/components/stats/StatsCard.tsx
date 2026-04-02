import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassCard } from '../GlassCard';
import { colors, typography, spacing } from '../../theme';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { TrendDirection } from '../../analytics/types';

interface StatsCardProps {
  title: string;
  value?: string | number;
  subValue?: string; // e.g. "kg" or small unit
  description?: string; // "15% más que period anterior"
  trend?: TrendDirection;
  children?: React.ReactNode;
  icon?: React.ReactNode;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, subValue, description, trend, children, icon }) => {
  const getTrendIcon = () => {
    if (!trend || trend === 'neutral') return null;
    if (trend === 'up') return <TrendingUp size={16} color={colors.success} />;
    if (trend === 'down') return <TrendingDown size={16} color={colors.danger} />;
    return <Minus size={16} color={colors.textSecondary} />;
  };

  return (
    <GlassCard style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
      </View>

      {value !== undefined && (
        <View style={styles.valueRow}>
          <Text style={styles.value}>{value}</Text>
          {subValue && <Text style={styles.subValue}>{subValue}</Text>}
        </View>
      )}

      {(description || trend) && (
        <View style={styles.footer}>
          {trend && <View style={styles.trendIcon}>{getTrendIcon()}</View>}
          {description && <Text style={styles.description}>{description}</Text>}
        </View>
      )}

      {children && <View style={styles.content}>{children}</View>}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.m,
    padding: spacing.m,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  title: {
    ...typography.h4,
    color: colors.textSecondary,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconContainer: {
    opacity: 0.7,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.h2,
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  subValue: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  trendIcon: {
    marginRight: spacing.xs,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  content: {
    marginTop: spacing.m,
  },
});
