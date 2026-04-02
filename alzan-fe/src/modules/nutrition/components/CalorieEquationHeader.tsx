import { View, Text, StyleSheet } from 'react-native';
import { useNutritionStyles } from '../../../hooks/useNutritionStyles';
import { useTranslation } from 'react-i18next';

interface NutritionSummaryHeaderProps {
  calories: {
    current: number;
    target: number;
    unit?: string;
  };
  macros: {
    protein: { current: number; target: number };
    carbs: { current: number; target: number };
    fats: { current: number; target: number };
  };
}

export const CalorieEquationHeader: React.FC<NutritionSummaryHeaderProps> = ({ calories, macros }) => {
  const { t } = useTranslation();
  const { colors: themeColors, isDark } = useNutritionStyles();

  // Helper to render macro card
  const renderMacroCard = (label: string, current: number, target: number, color: string) => {
    const percentage = Math.min((current / target) * 100, 100);

    return (
      <View style={[styles.macroCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8F9FA' }]}>
        <View style={styles.macroHeader}>
          <View style={[styles.macroIconDot, { backgroundColor: color }]} />
          <Text style={[styles.macroLabel, { color: themeColors.textSecondary }]}>{label}</Text>
        </View>
        <Text style={[styles.macroValue, { color: themeColors.textPrimary }]}>
          {Math.round(current)}
          <Text style={[styles.macroTarget, { color: themeColors.textSecondary }]}>/{target}g</Text>
        </Text>
        <View style={[styles.progressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }]}>
          <View style={[styles.progressFill, { backgroundColor: color, width: `${percentage}%` }]} />
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          shadowColor: isDark ? 'rgba(0,0,0,0.8)' : '#000',
        },
      ]}
    >
      {/* Calories Display */}
      <View style={styles.caloriesSection}>
        <Text style={[styles.objectiveLabel, { color: themeColors.textSecondary }]}>{t('nutrition.goal')}</Text>
        <View style={styles.caloriesRow}>
          <Text style={[styles.caloriesCurrent, { color: themeColors.textPrimary }]}>
            {Math.round(calories.current)}
          </Text>
          <Text style={[styles.caloriesSeparator, { color: themeColors.textSecondary }]}>/</Text>
          <Text style={[styles.caloriesTarget, { color: themeColors.textSecondary }]}>
            {calories.target} {calories.unit || t('nutrition.kcal')}
          </Text>
        </View>
      </View>

      {/* Macros Grid */}
      <View style={styles.macrosGrid}>
        {renderMacroCard(t('nutrition.proteinCaps'), macros.protein.current, macros.protein.target, '#FF3B30')}
        {renderMacroCard(t('nutrition.carbs'), macros.carbs.current, macros.carbs.target, '#007AFF')}
        {renderMacroCard(t('nutrition.fats'), macros.fats.current, macros.fats.target, '#FFCC00')}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  caloriesSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  objectiveLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  caloriesRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  caloriesCurrent: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  caloriesSeparator: {
    fontSize: 24,
    fontWeight: '600',
  },
  caloriesTarget: {
    fontSize: 18,
    fontWeight: '600',
  },
  macrosGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  macroCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  macroIconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  macroTarget: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
