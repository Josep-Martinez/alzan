import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Droplets, Check, Plus, Minus } from 'lucide-react-native';
import { useNutritionStyles } from '../../../hooks/useNutritionStyles';
import { useTranslation } from 'react-i18next';

interface WaterTrackerProps {
  currentMl: number;
  targetMl: number;
  onSave: (ml: number) => Promise<void> | void;
}

export const WaterTracker: React.FC<WaterTrackerProps> = ({ currentMl, targetMl = 4000, onSave }) => {
  const { t } = useTranslation();
  const { colors: themeColors, isDark } = useNutritionStyles();
  const [localMl, setLocalMl] = useState(currentMl);
  const [isSaving, setIsSaving] = useState(false);

  // Sync local state when prop updates
  useEffect(() => {
    setLocalMl(currentMl);
  }, [currentMl]);

  const hasChanges = localMl !== currentMl;

  const SEGMENT_SIZE = 500; // 500ml per segment
  const SEGMENTS = Math.ceil(targetMl / SEGMENT_SIZE);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(localMl);
    } finally {
      setIsSaving(false);
    }
  };

  const adjustMl = (amount: number) => {
    const newVal = Math.max(0, localMl + amount);
    setLocalMl(newVal);
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(0, 122, 255, 0.15)' : '#E8F4FF' }]}>
            <Droplets size={20} color={themeColors.primary} fill={themeColors.primary} />
          </View>
          <Text style={[styles.title, { color: themeColors.textPrimary }]}>{t('nutrition.hydration')}</Text>
        </View>
        <View style={styles.counterContainer}>
          <Text style={[styles.counterCurrent, { color: themeColors.primary }]}>{localMl}</Text>
          <Text style={[styles.counterTarget, { color: themeColors.textSecondary }]}>
            / {targetMl}
            {t('nutrition.ml')}
          </Text>
        </View>
      </View>

      {/* Water Segments - Enhanced */}
      <View style={[styles.trackContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F4F8' }]}>
        {Array.from({ length: SEGMENTS }).map((_, i) => {
          const segmentStart = i * SEGMENT_SIZE;
          const fillAmount = localMl - segmentStart;
          const fillRatio = Math.min(1, Math.max(0, fillAmount / SEGMENT_SIZE));

          return (
            <TouchableOpacity
              key={i}
              style={styles.segmentWrapper}
              activeOpacity={0.7}
              onPress={() => {
                const newLevel = (i + 1) * SEGMENT_SIZE;
                setLocalMl(newLevel);
              }}
            >
              <View
                style={[
                  styles.segment,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E1E8ED' },
                  i === 0 && styles.segmentFirst,
                  i === SEGMENTS - 1 && styles.segmentLast,
                ]}
              >
                {/* Fill with gradient effect */}
                <View
                  style={[
                    styles.segmentFill,
                    {
                      backgroundColor: themeColors.primary,
                      width: `${fillRatio * 100}%`,
                      opacity: fillRatio > 0 ? 1 : 0,
                    },
                  ]}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={() => adjustMl(-250)}
          style={[
            styles.controlBtn,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0F4F8',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#D1D9E0',
            },
          ]}
        >
          <Minus size={22} color={themeColors.primary} strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.controlLabelContainer}>
          <Text style={[styles.controlLabel, { color: themeColors.textSecondary }]}>{t('nutrition.adjust')}</Text>
          <Text style={[styles.controlHint, { color: themeColors.textSecondary }]}>{t('nutrition.approx250ml')}</Text>
        </View>

        <TouchableOpacity
          onPress={() => adjustMl(250)}
          style={[
            styles.controlBtn,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0F4F8',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#D1D9E0',
            },
          ]}
        >
          <Plus size={22} color={themeColors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Save Button */}
      {hasChanges && (
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: themeColors.primary,
              shadowColor: themeColors.primary,
            },
          ]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Check size={18} color="#FFF" strokeWidth={3} />
              <Text style={styles.saveButtonText}>{t('nutrition.confirmChanges')}</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  counterCurrent: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  counterTarget: {
    fontSize: 14,
    fontWeight: '600',
  },
  trackContainer: {
    flexDirection: 'row',
    height: 44,
    backgroundColor: '#F0F4F8',
    borderRadius: 22,
    padding: 5,
    gap: 4,
    marginBottom: 20,
  },
  segmentWrapper: {
    flex: 1,
    height: '100%',
  },
  segment: {
    flex: 1,
    backgroundColor: '#E1E8ED',
    borderRadius: 4,
    overflow: 'hidden',
  },
  segmentFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  segmentFirst: {
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  segmentLast: {
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  controlBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D1D9E0',
  },
  controlLabelContainer: {
    alignItems: 'center',
    minWidth: 80,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  controlHint: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.7,
  },
  saveButton: {
    marginTop: 8,
    backgroundColor: '#007AFF',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
