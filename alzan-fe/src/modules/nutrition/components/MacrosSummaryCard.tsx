// src/modules/nutrition/components/MacrosSummaryCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiquidGlassFooter } from '../../../components/common/LiquidGlassFooter';
import { useUnitConversion } from '../../../hooks/useUnitConversion';
import { useNutritionStyles } from '../../../hooks/useNutritionStyles';
import { useTranslation } from 'react-i18next';

interface MacrosSummaryCardProps {
  totals: {
    kcal: number;
    protein_g: number;
    carbs_g: number;
    fats_g: number;
  };
  itemCount: number;
  hasIncompleteData?: boolean;
}

export const MacrosSummaryCard: React.FC<MacrosSummaryCardProps> = ({
  totals,
  itemCount,
  hasIncompleteData = false,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { convertEnergyToUi } = useUnitConversion();
  const { colors, isDark } = useNutritionStyles();
  const ingredientLabel = itemCount === 1 ? t('nutrition.ingredientSingular') : `${t('nutrition.ingredientSingular')}s`;
  const titleText = `${t('nutrition.mealWith')} ${itemCount} ${ingredientLabel}`;

  // Match the same footer separation used by workout timers:
  // keep a very small visual gap and compensate safe-area bottom
  // so it never overlaps the floating tab bar on any device.
  const floatingFooterHeight = 75;
  const floatingFooterBottom = 30;
  const summaryGapFromFooter = 2;
  const footerTopFromScreenBottom = floatingFooterHeight + floatingFooterBottom;
  const bottomPosition = Math.max(
    summaryGapFromFooter,
    footerTopFromScreenBottom - insets.bottom + summaryGapFromFooter,
  );

  return (
    <View style={[styles.summaryFooterContainer, { bottom: bottomPosition }]}>
      <LiquidGlassFooter style={styles.summaryGlass} borderRadius={30}>
        <View style={styles.summaryContent}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{titleText}</Text>

          <View style={styles.macrosGrid}>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: colors.textPrimary }]}>
                {convertEnergyToUi(totals.kcal).value}
              </Text>
              <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>
                {convertEnergyToUi(totals.kcal).unit.toUpperCase()}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />

            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: '#FF6B6B' }]}>{totals.protein_g.toFixed(1)}g</Text>
              <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>{t('nutrition.proteinCaps')}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />

            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: '#FFA500' }]}>{totals.carbs_g.toFixed(1)}g</Text>
              <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>{t('nutrition.carbsAllCaps')}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />

            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: '#4ECDC4' }]}>{totals.fats_g.toFixed(1)}g</Text>
              <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>{t('nutrition.fatsAllCaps')}</Text>
            </View>
          </View>

          {hasIncompleteData && <Text style={styles.warningText}>{t('nutrition.incompleteDataWarning')}</Text>}
        </View>
      </LiquidGlassFooter>
    </View>
  );
};

const styles = StyleSheet.create({
  summaryFooterContainer: {
    position: 'absolute',
    // bottom is set dynamically based on device safe area
    left: 16,
    right: 16,
    zIndex: 100,
  },
  summaryGlass: {
    borderRadius: 30,
  },
  summaryContent: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  macrosGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  warningText: {
    fontSize: 12,
    color: '#FF9500',
    textAlign: 'center',
    marginTop: 12,
  },
});
