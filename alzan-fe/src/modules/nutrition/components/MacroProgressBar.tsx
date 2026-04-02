import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useNutritionStyles } from '../../../hooks/useNutritionStyles';

interface MacroProgressBarProps {
  current: number;
  target?: number;
  label: string;
  color: string;
  height?: number;
  showValue?: boolean;
}

export const MacroProgressBar: React.FC<MacroProgressBarProps> = ({
  current,
  target = 100, // Avoid div by zero
  label,
  color,
  height = 6,
  showValue = false,
}) => {
  const { colors, isDark } = useNutritionStyles();
  const safeTarget = target > 0 ? target : 100;
  const progress = Math.min(Math.max(current / safeTarget, 0), 1);
  const isOver = current > safeTarget;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
        {showValue && (
          <Text style={[styles.value, { color: colors.textPrimary }]}>
            {Math.round(current)} / {Math.round(safeTarget)}
          </Text>
        )}
      </View>
      <View
        style={[
          styles.track,
          {
            height,
            borderRadius: height / 2,
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              backgroundColor: isOver ? '#FF453A' : color,
              width: `${progress * 100}%`,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  track: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
