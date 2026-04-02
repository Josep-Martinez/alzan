// src/modules/nutrition/components/AlphabetFilter.tsx
// Horizontal A-Z letter filter for ingredients

import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNutritionStyles } from '../../../hooks/useNutritionStyles';
import { useTranslation } from 'react-i18next';

const ALPHABET = [
  'A-Z',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
];

interface AlphabetFilterProps {
  selected: string;
  onSelect: (letter: string) => void;
}

export const AlphabetFilter: React.FC<AlphabetFilterProps> = ({ selected, onSelect }) => {
  const { t } = useTranslation();
  const { colors: themeColors, isDark } = useNutritionStyles();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {ALPHABET.map(letter => {
        // 'A-Z' means "todas"
        const value = letter === 'A-Z' ? t('nutrition.all') : letter;
        const isSelected = selected === value;

        return (
          <TouchableOpacity
            key={letter}
            onPress={() => onSelect(value)}
            style={[
              styles.letterBtn,
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
                styles.letterText,
                {
                  color: isSelected ? '#FFF' : themeColors.textSecondary,
                },
              ]}
            >
              {letter}
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
    paddingVertical: 6,
    gap: 4,
    flexDirection: 'row',
  },
  letterBtn: {
    width: 36,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  letterText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
