import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addDays, addMonths, format, isSameMonth, startOfWeek, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { getDateFnsLocale } from '../../i18n/dateLocale';
import {
  buildCalendarMonth,
  formatCalendarDate,
  isCalendarDateSelectable,
  isCalendarMonthWithinBounds,
  isSameCalendarDate,
} from './calendarDatePicker.helper';

type CalendarDatePickerModalProps = {
  visible: boolean;
  value: Date;
  title: string;
  minimumDate?: Date;
  maximumDate?: Date;
  isDateDisabled?: (date: Date) => boolean;
  onCancel: () => void;
  onConfirm: (date: Date) => void;
};

const clampDate = (date: Date, minimumDate?: Date, maximumDate?: Date): Date => {
  if (minimumDate && !isCalendarDateSelectable(date, minimumDate)) return new Date(minimumDate);
  if (maximumDate && !isCalendarDateSelectable(date, undefined, maximumDate)) return new Date(maximumDate);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const getMonthLabel = (month: Date): string => format(month, 'LLLL yyyy', { locale: getDateFnsLocale() });

export const CalendarDatePickerModal = ({
  visible,
  value,
  title,
  minimumDate,
  maximumDate,
  isDateDisabled,
  onCancel,
  onConfirm,
}: CalendarDatePickerModalProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(() => clampDate(value, minimumDate, maximumDate));
  const [visibleMonth, setVisibleMonth] = useState(() => clampDate(value, minimumDate, maximumDate));

  useEffect(() => {
    if (!visible) return;
    const nextDate = clampDate(value, minimumDate, maximumDate);
    setSelectedDate(nextDate);
    setVisibleMonth(nextDate);
  }, [maximumDate, minimumDate, value, visible]);

  const calendarDays = useMemo(() => buildCalendarMonth(visibleMonth), [visibleMonth]);
  const monday = startOfWeek(new Date(2024, 0, 1), { weekStartsOn: 1 });
  const weekdayLabels = Array.from({ length: 7 }, (_, index) =>
    format(addDays(monday, index), 'EEE', { locale: getDateFnsLocale() }),
  );

  const previousMonth = subMonths(visibleMonth, 1);
  const nextMonth = addMonths(visibleMonth, 1);
  const canGoPrevious = isCalendarMonthWithinBounds(previousMonth, minimumDate, maximumDate);
  const canGoNext = isCalendarMonthWithinBounds(nextMonth, minimumDate, maximumDate);

  const handleSelectDate = (date: Date) => {
    if (!isCalendarDateSelectable(date, minimumDate, maximumDate) || isDateDisabled?.(date)) return;
    setSelectedDate(date);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityLabel={t('common.cancel')} />
        <View
          style={[
            styles.content,
            {
              backgroundColor: colors.surfaceSolid,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onCancel}
              style={styles.headerButton}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
            >
              <Text style={[styles.headerButtonText, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.textPrimary }]} accessibilityRole="header">
              {title}
            </Text>
            <TouchableOpacity
              onPress={() => onConfirm(selectedDate)}
              style={styles.headerButton}
              accessibilityRole="button"
              accessibilityLabel={t('common.done')}
            >
              <Text style={[styles.headerButtonText, { color: colors.primary }]}>{t('common.done')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.monthHeader}>
            <TouchableOpacity
              onPress={() => setVisibleMonth(previousMonth)}
              disabled={!canGoPrevious}
              style={[styles.navigationButton, !canGoPrevious && styles.disabled]}
              accessibilityRole="button"
              accessibilityLabel={t('common.previousMonth')}
              accessibilityState={{ disabled: !canGoPrevious }}
            >
              <ChevronLeft size={22} color={canGoPrevious ? colors.textPrimary : colors.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.monthLabel, { color: colors.textPrimary }]} accessibilityRole="header">
              {getMonthLabel(visibleMonth)}
            </Text>
            <TouchableOpacity
              onPress={() => setVisibleMonth(nextMonth)}
              disabled={!canGoNext}
              style={[styles.navigationButton, !canGoNext && styles.disabled]}
              accessibilityRole="button"
              accessibilityLabel={t('common.nextMonth')}
              accessibilityState={{ disabled: !canGoNext }}
            >
              <ChevronRight size={22} color={canGoNext ? colors.textPrimary : colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekdayRow}>
            {weekdayLabels.map(label => (
              <Text key={label} style={[styles.weekdayLabel, { color: colors.textSecondary }]}>
                {label.slice(0, 2)}
              </Text>
            ))}
          </View>

          <ScrollView contentContainerStyle={styles.calendarGrid} showsVerticalScrollIndicator={false}>
            {calendarDays.map(day => {
              const isCurrentMonth = isSameMonth(day, visibleMonth);
              const isSelectable = isCalendarDateSelectable(day, minimumDate, maximumDate) && !isDateDisabled?.(day);
              const isSelected = isSameCalendarDate(day, selectedDate);
              return (
                <TouchableOpacity
                  key={formatCalendarDate(day)}
                  onPress={() => handleSelectDate(day)}
                  disabled={!isSelectable}
                  style={[
                    styles.dayButton,
                    isSelected && { backgroundColor: colors.primary },
                    !isCurrentMonth && styles.outsideMonth,
                    !isSelectable && styles.disabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={format(day, 'PPPP', { locale: getDateFnsLocale() })}
                  accessibilityState={{ disabled: !isSelectable, selected: isSelected }}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                      !isCurrentMonth && { color: colors.textSecondary },
                      !isSelectable && { color: colors.textSecondary },
                    ]}
                  >
                    {format(day, 'd')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            onPress={onCancel}
            style={[styles.cancelButton, { borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
          >
            <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.48)' },
  content: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '88%',
    alignSelf: 'center',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  header: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerButton: { minWidth: 72, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  headerButtonText: { fontSize: 15, fontWeight: '700' },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800' },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  navigationButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: 18, fontWeight: '800', textTransform: 'capitalize' },
  weekdayRow: { flexDirection: 'row', marginTop: 8, marginBottom: 4 },
  weekdayLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 8 },
  dayButton: { width: '14.2857%', minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  dayText: { fontSize: 16, fontWeight: '600' },
  outsideMonth: { opacity: 0.55 },
  disabled: { opacity: 0.35 },
  cancelButton: { minHeight: 48, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { fontSize: 15, fontWeight: '700' },
});
