import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { addDays, format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { spacing, typography } from '../../../theme';
import { RootStackParamList } from '../../../types/navigation.types';
import { useHealthStyles } from '../../../hooks/useHealthStyles';
import { Alert } from '../../../components/common/Alert';
import { CalendarDatePickerModal } from '../../../components/common/CalendarDatePickerModal';
import { getDateFnsLocale, getLocaleTag } from '../../../i18n/dateLocale';
import {
  useManualStepsForDate,
  useManualStepsForRange,
  useUpsertManualSteps,
  useUpsertManualStepsRange,
} from '../hooks/useSteps';
import { StackNavigationProp } from '@react-navigation/stack';
import { INTEGER_INPUT_PROPS } from '../../../utils/numericInput';
import {
  MAX_MANUAL_STEPS_RANGE_DAYS,
  buildManualStepsDateRange,
  isManualStepsRangeValid,
} from '../helpers/stepsRange.helper';

type StepsAddNavigationProp = StackNavigationProp<RootStackParamList, 'StepsAdd'>;
type StepsAddRouteProp = RouteProp<RootStackParamList, 'StepsAdd'>;

const MAX_STEPS = 200000;
type StepsEntryMode = 'single' | 'range';
type DatePickerTarget = 'single' | 'start' | 'end';

const isSameDay = (a: Date, b: Date) =>
  a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

const isToday = (d: Date) => isSameDay(d, new Date());

const isYesterday = (d: Date) => {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return isSameDay(d, y);
};

export const StepsAdd = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<StepsAddNavigationProp>();
  const route = useRoute<StepsAddRouteProp>();
  const upsertSteps = useUpsertManualSteps();
  const upsertStepsRange = useUpsertManualStepsRange();
  const { colors: themeColors, isDark } = useHealthStyles();

  const [steps, setSteps] = useState('');
  const [date, setDate] = useState(route.params?.date ? new Date(route.params.date) : new Date());
  const [entryMode, setEntryMode] = useState<StepsEntryMode>('single');
  const [rangeStart, setRangeStart] = useState(route.params?.date ? new Date(route.params.date) : new Date());
  const [rangeEnd, setRangeEnd] = useState(route.params?.date ? new Date(route.params.date) : new Date());
  const [rangeSteps, setRangeSteps] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<DatePickerTarget>('single');
  const manualStepsQuery = useManualStepsForDate(date);
  const rangeDateKeys = useMemo(() => buildManualStepsDateRange(rangeStart, rangeEnd), [rangeEnd, rangeStart]);
  const manualStepsRangeQuery = useManualStepsForRange(rangeStart, rangeEnd, entryMode === 'range');

  useEffect(() => {
    if (manualStepsQuery.isFetching) return;
    setSteps(manualStepsQuery.data ? String(manualStepsQuery.data.total_steps) : '');
  }, [manualStepsQuery.data, manualStepsQuery.isFetching]);

  useEffect(() => {
    if (entryMode !== 'range' || !isManualStepsRangeValid(rangeStart, rangeEnd)) return;
    const existingByDate = new Map((manualStepsRangeQuery.data ?? []).map(row => [row.date, String(row.total_steps)]));
    setRangeSteps(
      rangeDateKeys.reduce<Record<string, string>>((values, dateKey) => {
        values[dateKey] = existingByDate.get(dateKey) ?? '';
        return values;
      }, {}),
    );
  }, [entryMode, manualStepsRangeQuery.data, rangeDateKeys, rangeStart, rangeEnd]);

  const parseStepValue = (value: string): number | null => {
    const parsedValue = parseInt(value.replace(/[^0-9]/g, ''), 10);
    return isNaN(parsedValue) || parsedValue < 0 || parsedValue > MAX_STEPS ? null : parsedValue;
  };

  const handleSave = () => {
    if (entryMode === 'range') {
      if (!isManualStepsRangeValid(rangeStart, rangeEnd)) {
        Alert.alert(t('common.error'), t('steps.invalidRangeDates', { max: MAX_MANUAL_STEPS_RANGE_DAYS }));
        return;
      }

      const rows = rangeDateKeys
        .filter(dateKey => (rangeSteps[dateKey] ?? '').trim().length > 0)
        .map(dateKey => ({
          date: parseISO(dateKey),
          steps: parseInt((rangeSteps[dateKey] ?? '').replace(/[^0-9]/g, ''), 10),
        }));
      if (rows.length === 0) {
        Alert.alert(t('common.error'), t('steps.noRangeValues'));
        return;
      }
      const invalidRow = rows.find(row => isNaN(row.steps) || row.steps < 0 || row.steps > MAX_STEPS);
      if (invalidRow) {
        const invalidDate = format(invalidRow.date, 'PPPP', { locale: getDateFnsLocale() });
        Alert.alert(t('common.error'), t('steps.missingRangeValue', { date: invalidDate }));
        return;
      }

      upsertStepsRange.mutate(
        { rows },
        {
          onSuccess: () => navigation.goBack(),
          onError: () => {
            Alert.alert(t('common.error'), t('steps.rangeSaveError'));
          },
        },
      );
      return;
    }

    const value = parseStepValue(steps);
    if (value === null) {
      Alert.alert(t('common.error'), t('steps.invalidRange', { max: MAX_STEPS }));
      return;
    }

    upsertSteps.mutate(
      { date, steps: value },
      {
        onSuccess: () => navigation.goBack(),
        onError: (error: unknown) => {
          const err = error as { message?: string };
          Alert.alert(t('common.error'), t('steps.saveError', { message: err?.message ?? '' }));
        },
      },
    );
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android' || event.type === 'set') {
      setShowDatePicker(false);
    }
    if (!selectedDate) return;
    if (datePickerTarget === 'single') setDate(selectedDate);
    if (datePickerTarget === 'start') setRangeStart(selectedDate);
    if (datePickerTarget === 'end') setRangeEnd(selectedDate);
  };

  const openDatePicker = (target: DatePickerTarget) => {
    setDatePickerTarget(target);
    setShowDatePicker(true);
  };

  const selectedDateForPicker =
    datePickerTarget === 'single' ? date : datePickerTarget === 'start' ? rangeStart : rangeEnd;
  const pickerMinimumDate = datePickerTarget === 'end' ? rangeStart : undefined;
  const pickerMaximumDate =
    datePickerTarget === 'single'
      ? new Date()
      : datePickerTarget === 'start'
        ? new Date()
        : new Date(Math.min(new Date().getTime(), addDays(rangeStart, MAX_MANUAL_STEPS_RANGE_DAYS - 1).getTime()));
  const selectedDateLabel = (selectedDate: Date) =>
    selectedDate.toLocaleDateString(getLocaleTag(), { weekday: 'long', day: 'numeric', month: 'long' });
  const isSaving = upsertSteps.isPending || upsertStepsRange.isPending;

  const onCalendarConfirm = (selectedDate: Date) => {
    if (datePickerTarget === 'single') setDate(selectedDate);
    if (datePickerTarget === 'start') setRangeStart(selectedDate);
    if (datePickerTarget === 'end') setRangeEnd(selectedDate);
    setShowDatePicker(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => navigation.goBack()}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' }} />
        </TouchableOpacity>

        <View style={[styles.content, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: themeColors.textPrimary }]}>{t('steps.addTitle')}</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
              <X size={24} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modeSelector} accessibilityRole="tablist">
            {(['single', 'range'] as const).map(mode => {
              const selected = entryMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.modeButton,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                    selected && { backgroundColor: themeColors.primary },
                  ]}
                  onPress={() => {
                    setShowDatePicker(false);
                    setEntryMode(mode);
                  }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.modeButtonText, { color: selected ? '#FFFFFF' : themeColors.textSecondary }]}>
                    {mode === 'single' ? t('steps.singleDay') : t('steps.multipleDays')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {entryMode === 'single' ? (
            <>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, { color: themeColors.textPrimary, borderBottomColor: themeColors.primary }]}
                  value={steps}
                  onChangeText={setSteps}
                  placeholder="0"
                  placeholderTextColor={themeColors.textSecondary}
                  {...INTEGER_INPUT_PROPS}
                  autoFocus
                  maxLength={6}
                />
                <Text style={[styles.unit, { color: themeColors.textSecondary }]}>{t('steps.unit')}</Text>
              </View>

              <Text style={[styles.sectionLabel, { color: themeColors.textSecondary }]}>{t('health.recordDate')}</Text>
              <View style={styles.dateSelectorContainer}>
                <View style={styles.dateQuickActions}>
                  <TouchableOpacity
                    style={[
                      styles.dateChip,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
                      isYesterday(date) && {
                        backgroundColor: themeColors.primary + '20',
                        borderColor: themeColors.primary,
                      },
                    ]}
                    onPress={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 1);
                      setDate(d);
                    }}
                  >
                    <Text
                      style={[
                        styles.dateChipText,
                        { color: themeColors.textSecondary },
                        isYesterday(date) && { color: themeColors.primary },
                      ]}
                    >
                      {t('health.yesterday')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.dateChip,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
                      isToday(date) && {
                        backgroundColor: themeColors.primary + '20',
                        borderColor: themeColors.primary,
                      },
                    ]}
                    onPress={() => setDate(new Date())}
                  >
                    <Text
                      style={[
                        styles.dateChipText,
                        { color: themeColors.textSecondary },
                        isToday(date) && { color: themeColors.primary },
                      ]}
                    >
                      {t('health.today')}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.dateDisplayRow}>
                  <TouchableOpacity
                    onPress={() => setDate(d => new Date(new Date(d).setDate(d.getDate() - 1)))}
                    style={styles.arrowButton}
                  >
                    <ChevronLeft size={24} color={themeColors.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.dateTextContainer,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
                      showDatePicker && { borderColor: themeColors.primary },
                    ]}
                    onPress={() => openDatePicker('single')}
                  >
                    <CalendarIcon size={18} color={themeColors.primary} style={{ marginRight: 8 }} />
                    <Text style={[styles.dateTextMain, { color: themeColors.textPrimary }]}>
                      {selectedDateLabel(date)}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setDate(d => new Date(new Date(d).setDate(d.getDate() + 1)))}
                    style={styles.arrowButton}
                    disabled={isToday(date)}
                  >
                    <ChevronRight size={24} color={isToday(date) ? themeColors.textSecondary : themeColors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.rangeHint, { color: themeColors.textSecondary }]}>
                {t('steps.rangeLimit', { max: MAX_MANUAL_STEPS_RANGE_DAYS })}
              </Text>
              <Text style={[styles.rangeHint, { color: themeColors.textSecondary }]}>
                {t('steps.rangePartialHint')}
              </Text>
              <View style={styles.rangeDateSelectors}>
                {(
                  [
                    ['start', t('steps.rangeStart'), rangeStart],
                    ['end', t('steps.rangeEnd'), rangeEnd],
                  ] as const
                ).map(([target, label, targetDate]) => (
                  <TouchableOpacity
                    key={target}
                    style={[
                      styles.rangeDateButton,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                    ]}
                    onPress={() => openDatePicker(target)}
                    accessibilityRole="button"
                    accessibilityLabel={`${label}: ${selectedDateLabel(targetDate)}`}
                  >
                    <Text style={[styles.rangeDateLabel, { color: themeColors.textSecondary }]}>{label}</Text>
                    <View style={styles.rangeDateValue}>
                      <CalendarIcon size={18} color={themeColors.primary} />
                      <Text style={[styles.dateTextMain, { color: themeColors.textPrimary }]}>
                        {selectedDateLabel(targetDate)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {manualStepsRangeQuery.isError && (
                <Text style={[styles.rangeError, { color: themeColors.danger }]}>{t('steps.rangeLoadError')}</Text>
              )}

              {rangeDateKeys.length === 0 ? (
                <Text style={[styles.rangeError, { color: themeColors.danger }]}>
                  {t('steps.invalidRangeDates', { max: MAX_MANUAL_STEPS_RANGE_DAYS })}
                </Text>
              ) : manualStepsRangeQuery.isFetching ? (
                <ActivityIndicator color={themeColors.primary} style={styles.rangeLoader} />
              ) : (
                <ScrollView style={styles.rangeList} contentContainerStyle={styles.rangeListContent}>
                  {rangeDateKeys.map(dateKey => {
                    const rowDate = parseISO(dateKey);
                    return (
                      <View key={dateKey} style={styles.rangeRow}>
                        <Text style={[styles.rangeRowDate, { color: themeColors.textPrimary }]}>
                          {selectedDateLabel(rowDate)}
                        </Text>
                        <TextInput
                          style={[
                            styles.rangeInput,
                            { color: themeColors.textPrimary, borderBottomColor: themeColors.primary },
                          ]}
                          value={rangeSteps[dateKey] ?? ''}
                          onChangeText={value => setRangeSteps(current => ({ ...current, [dateKey]: value }))}
                          placeholder="0"
                          placeholderTextColor={themeColors.textSecondary}
                          {...INTEGER_INPUT_PROPS}
                          maxLength={6}
                          accessibilityLabel={`${t('steps.unit')}: ${selectedDateLabel(rowDate)}`}
                        />
                        <Text style={[styles.rangeRowUnit, { color: themeColors.textSecondary }]}>
                          {t('steps.unit')}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </>
          )}

          {showDatePicker && Platform.OS === 'ios' && (
            <View
              style={[
                styles.inlinePickerContainer,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
              ]}
            >
              <DateTimePicker
                value={selectedDateForPicker}
                mode="date"
                display="inline"
                onChange={onDateChange}
                accentColor={themeColors.primary}
                themeVariant={isDark ? 'dark' : 'light'}
                minimumDate={pickerMinimumDate}
                maximumDate={pickerMaximumDate}
              />
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
              onPress={() => navigation.goBack()}
              disabled={isSaving}
            >
              <Text style={[styles.cancelText, { color: themeColors.textPrimary }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: themeColors.primary }, isSaving && { opacity: 0.8 }]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveText}>{t('common.save')}</Text>
              )}
            </TouchableOpacity>
          </View>

          {showDatePicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={selectedDateForPicker}
              mode="date"
              display="default"
              onChange={onDateChange}
              minimumDate={pickerMinimumDate}
              maximumDate={pickerMaximumDate}
            />
          )}

          <CalendarDatePickerModal
            visible={showDatePicker && Platform.OS === 'web'}
            value={selectedDateForPicker}
            title={t('health.recordDate')}
            minimumDate={pickerMinimumDate}
            maximumDate={pickerMaximumDate}
            onCancel={() => setShowDatePicker(false)}
            onConfirm={onCalendarConfirm}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    width: '100%',
    maxHeight: '92%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  modeSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  modeButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    paddingHorizontal: 8,
  },
  modeButtonText: {
    ...typography.body,
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  closeButton: {
    padding: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 8,
  },
  input: {
    fontSize: 56,
    fontWeight: '700',
    paddingHorizontal: 12,
    minWidth: 160,
    textAlign: 'center',
    borderBottomWidth: 2,
  },
  unit: {
    ...typography.h3,
    marginLeft: 8,
  },
  sectionLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
    marginTop: 24,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateSelectorContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  dateQuickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.m,
  },
  dateChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dateChipText: {
    ...typography.body,
    fontWeight: '600',
  },
  dateDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  arrowButton: {
    padding: 10,
  },
  dateTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 8,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dateTextMain: {
    ...typography.body,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  inlinePickerContainer: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.l,
  },
  rangeHint: {
    ...typography.body,
    marginBottom: spacing.m,
  },
  rangeDateSelectors: {
    gap: spacing.s,
    marginBottom: spacing.m,
  },
  rangeDateButton: {
    minHeight: 64,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  rangeDateLabel: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  rangeDateValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rangeError: {
    ...typography.body,
    marginBottom: spacing.m,
  },
  rangeLoader: {
    marginVertical: spacing.xl,
  },
  rangeList: {
    maxHeight: 320,
    marginBottom: spacing.m,
  },
  rangeListContent: {
    gap: spacing.xs,
  },
  rangeRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rangeRowDate: {
    ...typography.body,
    flex: 1,
    textTransform: 'capitalize',
  },
  rangeInput: {
    width: 88,
    minHeight: 44,
    borderBottomWidth: 2,
    textAlign: 'right',
    fontSize: 20,
    fontWeight: '700',
  },
  rangeRowUnit: {
    width: 46,
    ...typography.caption,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 12,
  },
  cancelText: {
    ...typography.body,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 12,
  },
  saveText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
