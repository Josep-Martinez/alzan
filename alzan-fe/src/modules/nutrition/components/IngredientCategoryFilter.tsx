// src/modules/nutrition/components/IngredientCategoryFilter.tsx
// Horizontal chips for filtering ingredients by category

import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNutritionStyles } from '../../../hooks/useNutritionStyles';
import { IngredientsCategory } from '../../../types/requests.types';
import { useTranslation } from 'react-i18next';
import { TranslationKey } from '../../../i18n/locales/en';

export const CATEGORY_LABELS: Record<IngredientsCategory | 'todas', TranslationKey> = {
  todas: 'nutrition.categoryAll',
  proteina_animal: 'nutrition.categoryAnimalProtein',
  proteina_vegetal: 'nutrition.categoryPlantProtein',
  cereal: 'nutrition.categoryCereals',
  tuberculo: 'nutrition.categoryTubers',
  legumbre: 'nutrition.categoryLegumes',
  verdura: 'nutrition.categoryVegetables',
  fruta: 'nutrition.categoryFruits',
  lacteo: 'nutrition.categoryDairy',
  grasa: 'nutrition.categoryFats',
  fruto_seco: 'nutrition.categoryNuts',
  semilla: 'nutrition.categorySeeds',
  bebida: 'nutrition.categoryDrinks',
  condimento: 'nutrition.categoryCondiments',
  otro: 'nutrition.categoryOthers',
  dulce: 'nutrition.categorySweets',
  precocinado: 'nutrition.categoryPrecooked',
  snack: 'nutrition.categorySnacks',
};

export const CATEGORY_OPTIONS: (IngredientsCategory | 'todas')[] = [
  'todas',
  'proteina_animal',
  'proteina_vegetal',
  'cereal',
  'tuberculo',
  'legumbre',
  'verdura',
  'fruta',
  'lacteo',
  'grasa',
  'fruto_seco',
  'semilla',
  'bebida',
  'condimento',
  'otro',
  'dulce',
  'precocinado',
  'snack',
];

interface IngredientCategoryFilterProps {
  selected: string;
  onSelect: (category: IngredientsCategory | 'todas') => void;
}

export const IngredientCategoryFilter: React.FC<IngredientCategoryFilterProps> = ({ selected, onSelect }) => {
  const { t } = useTranslation();
  const { colors: themeColors, isDark } = useNutritionStyles();

  const getCategoryLabel = (category: IngredientsCategory | 'todas') => {
    const key = CATEGORY_LABELS[category];
    return key ? String(t(key)) : category;
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {CATEGORY_OPTIONS.map(cat => {
        const isSelected = selected === cat;
        return (
          <TouchableOpacity
            key={cat}
            onPress={() => onSelect(cat)}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected
                  ? themeColors.primary
                  : isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.05)',
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                {
                  color: isSelected ? '#FFF' : themeColors.textSecondary,
                },
              ]}
            >
              {getCategoryLabel(cat)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
