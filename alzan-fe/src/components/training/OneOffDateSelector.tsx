import React, { useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, ChevronRight } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { useTrainingStyles } from '../../hooks/useTrainingStyles';
import { formatLocalizedDate } from '../../i18n/dateLocale';
import { isValidIsoDate } from '../../modules/training/helpers/templateScheduling.helper';
import { CalendarDatePickerModal } from '../common/CalendarDatePickerModal';

interface OneOffDateSelectorProps {
  value: string | null;
  onChange: (date: string) => void;
  label: string;
  placeholder: string;
}

const dateToIso = (date: Date) => format(date, 'yyyy-MM-dd');

export const OneOffDateSelector = ({ value, onChange, label, placeholder }: OneOffDateSelectorProps) => {
  const { colors: themeColors, isDark } = useTrainingStyles();
  const [showNativePicker, setShowNativePicker] = useState(false);
  const [showWebCalendar, setShowWebCalendar] = useState(false);

  const selectedDate = isValidIsoDate(value) ? parseISO(value) : null;
  const pickerDate = selectedDate || new Date();

  const handlePress = () => {
    if (Platform.OS === 'web') {
      setShowWebCalendar(true);
      return;
    }
    setShowNativePicker(true);
  };

  return (
    <>
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 52,
          borderBottomWidth: 1,
          borderBottomColor: themeColors.border,
        }}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Calendar size={16} color={themeColors.textSecondary} />
          <Text style={{ color: themeColors.textPrimary, marginLeft: 8, fontSize: 15 }}>{label}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: selectedDate ? themeColors.textPrimary : themeColors.textSecondary, fontSize: 15 }}>
            {selectedDate
              ? formatLocalizedDate(selectedDate, { en: 'MMM d, yyyy', es: "d 'de' MMM yyyy" })
              : placeholder}
          </Text>
          <ChevronRight size={16} color={themeColors.textSecondary} style={{ marginLeft: 4 }} />
        </View>
      </TouchableOpacity>

      {showNativePicker && Platform.OS !== 'web' && (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display="default"
          themeVariant={isDark ? 'dark' : 'light'}
          onChange={(_event, nextDate) => {
            setShowNativePicker(false);
            if (nextDate) onChange(dateToIso(nextDate));
          }}
        />
      )}

      {Platform.OS === 'web' ? (
        <CalendarDatePickerModal
          visible={showWebCalendar}
          value={pickerDate}
          title={label}
          onCancel={() => setShowWebCalendar(false)}
          onConfirm={date => {
            onChange(dateToIso(date));
            setShowWebCalendar(false);
          }}
        />
      ) : null}
    </>
  );
};
