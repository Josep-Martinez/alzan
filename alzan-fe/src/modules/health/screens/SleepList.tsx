import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HealthScreenNavigationProp } from '../../../types/navigation.types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, Moon, Trash2, TrendingUp, TrendingDown, Clock, Star } from 'lucide-react-native';
import { typography } from '../../../theme';
import { useSleepLogs, useDeleteSleepLog } from '../hooks/useSleep';
import { format, subDays, differenceInDays, isAfter, isBefore, startOfDay, isSameDay } from 'date-fns';
import { useHealthStyles } from '../../../hooks/useHealthStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../../../components/GlassCard';
import { SleepLog } from '../../../types/requests.types';
import { useTranslation } from 'react-i18next';
import { getDateFnsLocale } from '../../../i18n/dateLocale';

// Range options
type RangeOption = '7D' | '15D' | '1M' | '3M';

const RANGE_OPTIONS: { key: RangeOption; days: number }[] = [
  { key: '7D', days: 7 },
  { key: '15D', days: 15 },
  { key: '1M', days: 30 },
  { key: '3M', days: 90 },
];

export const SleepList = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<HealthScreenNavigationProp>();
  const { data: logs, isLoading } = useSleepLogs();
  const deleteMutation = useDeleteSleepLog();
  const { styles: dynamicStyles, colors: themeColors, isDark } = useHealthStyles();

  const [selectedRange, setSelectedRange] = useState<RangeOption>('7D');

  const getRangeLabel = (key: RangeOption) => {
    switch (key) {
      case '7D':
        return t('health.last7Days');
      case '15D':
        return t('health.last15Days');
      case '1M':
        return t('health.last30Days');
      case '3M':
        return t('health.last3Months');
      default:
        return key;
    }
  };

  // Get days count for selected range
  const rangeDays = RANGE_OPTIONS.find(r => r.key === selectedRange)?.days || 7;

  // Filter logs by selected range
  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    const now = new Date();
    const cutoffDate = startOfDay(subDays(now, rangeDays));

    return logs.filter(log => {
      const logDate = startOfDay(new Date(log.date));
      return isAfter(logDate, cutoffDate) || isBefore(cutoffDate, logDate);
    });
  }, [logs, rangeDays]);

  // Calculate statistics for the selected range
  const stats = useMemo(() => {
    if (!filteredLogs || filteredLogs.length === 0) {
      return {
        avgDuration: 0,
        avgQuality: 0,
        totalNights: 0,
        trend: null,
        chartDays: [] as { date: Date; duration: number; quality: number | null }[],
      };
    }

    const totalDuration = filteredLogs.reduce((sum, log) => sum + (log.duration_min || 0), 0);
    const avgDuration = totalDuration / filteredLogs.length;

    const logsWithQuality = filteredLogs.filter(l => l.quality_score);
    const avgQuality =
      logsWithQuality.length > 0
        ? logsWithQuality.reduce((sum, l) => sum + (l.quality_score || 0), 0) / logsWithQuality.length
        : 0;

    // Calculate trend (compare first half vs second half of range) - ONLY with existing data
    let trend: number | null = null;
    // Relaxed requirement: just need at least 1 data point in each half to compare
    if (filteredLogs.length >= 2) {
      const halfPoint = Math.floor(filteredLogs.length / 2);
      const firstHalf = filteredLogs.slice(halfPoint); // Older data
      const secondHalf = filteredLogs.slice(0, halfPoint); // Newer data

      // Check if we have valid data in both halves
      const hasDataFirst = firstHalf.some(l => (l.duration_min || 0) > 0);
      const hasDataSecond = secondHalf.some(l => (l.duration_min || 0) > 0);

      if (hasDataFirst && hasDataSecond) {
        const avgFirst = firstHalf.reduce((sum, l) => sum + (l.duration_min || 0), 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((sum, l) => sum + (l.duration_min || 0), 0) / secondHalf.length;

        if (avgFirst > 0) {
          trend = ((avgSecond - avgFirst) / avgFirst) * 100;
        }
      }
    }

    // Chart days - determine how many bars to show based on range
    const now = new Date();
    const chartDays = [];

    if (selectedRange === '7D') {
      // 7 bars, 1 day each
      for (let i = 6; i >= 0; i--) {
        const date = subDays(now, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const log = (logs || []).find(l => l.date === dateStr);
        chartDays.push({
          date,
          duration: log?.duration_min || 0,
          quality: log?.quality_score || null,
        });
      }
    } else if (selectedRange === '15D') {
      // 15 bars, 1 day each
      for (let i = 14; i >= 0; i--) {
        const date = subDays(now, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const log = (logs || []).find(l => l.date === dateStr);
        chartDays.push({
          date,
          duration: log?.duration_min || 0,
          quality: log?.quality_score || null,
        });
      }
    } else if (selectedRange === '1M') {
      // 15 bars, 2 days each (30 days total)
      for (let i = 14; i >= 0; i--) {
        const endDate = subDays(now, i * 2);
        const startDate = subDays(endDate, 1);

        const twoDayLogs = (logs || []).filter(l => {
          const logDate = new Date(l.date);
          return (
            isSameDay(logDate, startDate) ||
            isSameDay(logDate, endDate) ||
            (isAfter(logDate, startDate) && isBefore(logDate, endDate))
          );
        });

        // Average of EXISTING data only
        const twoDayAvg =
          twoDayLogs.length > 0 ? twoDayLogs.reduce((sum, l) => sum + (l.duration_min || 0), 0) / twoDayLogs.length : 0;
        const twoDayQuality =
          twoDayLogs.filter(l => l.quality_score).length > 0
            ? twoDayLogs.filter(l => l.quality_score).reduce((sum, l) => sum + (l.quality_score || 0), 0) /
              twoDayLogs.filter(l => l.quality_score).length
            : null;

        chartDays.push({
          date: endDate,
          duration: twoDayAvg,
          quality: twoDayQuality,
        });
      }
    } else if (selectedRange === '3M') {
      // 12 bars, 1 week each (84 days total)
      for (let i = 11; i >= 0; i--) {
        const weekEnd = subDays(now, i * 7);
        const weekStart = subDays(weekEnd, 6);

        const weekLogs = (logs || []).filter(l => {
          const logDate = new Date(l.date);
          return logDate >= weekStart && logDate <= weekEnd;
        });

        // Average of EXISTING data only
        const weekAvg =
          weekLogs.length > 0 ? weekLogs.reduce((sum, l) => sum + (l.duration_min || 0), 0) / weekLogs.length : 0;
        const weekQuality =
          weekLogs.filter(l => l.quality_score).length > 0
            ? weekLogs.filter(l => l.quality_score).reduce((sum, l) => sum + (l.quality_score || 0), 0) /
              weekLogs.filter(l => l.quality_score).length
            : null;

        chartDays.push({
          date: weekEnd,
          duration: weekAvg,
          quality: weekQuality,
        });
      }
    }

    return {
      avgDuration,
      avgQuality,
      totalNights: filteredLogs.length,
      trend,
      chartDays,
    };
  }, [filteredLogs, logs, selectedRange]);

  const handleDelete = (id: string, duration: number) => {
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    Alert.alert(t('common.delete'), `${t('health.deleteRecordOf')} ${hours}h ${mins}m?`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => deleteMutation.mutate(id),
      },
    ]);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const getQualityColor = (score: number | null) => {
    if (!score) return themeColors.textSecondary;
    if (score >= 4) return '#10B981';
    if (score >= 3) return '#F59E0B';
    return '#EF4444';
  };

  const getDurationColor = (minutes: number) => {
    if (minutes >= 420) return '#10B981'; // 7+ hours
    if (minutes >= 360) return '#F59E0B'; // 6+ hours
    return '#EF4444';
  };

  // Chart bar max height
  const maxBarHeight = 100;
  const maxDuration = Math.max(...stats.chartDays.map(d => d.duration), 480);

  const getChartLabel = (date: Date, index: number) => {
    if (selectedRange === '3M') {
      return `S${stats.chartDays.length - index}`;
    }
    if (selectedRange === '1M' || selectedRange === '15D') {
      return format(date, 'd');
    }
    const dayName = format(date, 'EEE', { locale: getDateFnsLocale() });
    // Handle Wednesday: Miércoles -> X
    if (dayName.toLowerCase().startsWith('mi')) {
      return 'X';
    }
    return dayName.charAt(0).toUpperCase();
  };

  const renderItem = ({ item }: { item: SleepLog }) => {
    // Format start and end times if available
    let timeRange = '';
    if (item.sleep_start && item.sleep_end) {
      const start = new Date(item.sleep_start);
      const end = new Date(item.sleep_end);
      timeRange = `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
    }

    return (
      <GlassCard style={[styles.logItem, dynamicStyles.glassCard]}>
        <View style={styles.logItemContent}>
          <View style={styles.logItemLeft}>
            <View style={[styles.dayIndicator, { backgroundColor: getDurationColor(item.duration_min || 0) }]} />
            <View style={{ gap: 2 }}>
              <Text style={[styles.logDate, dynamicStyles.title]}>
                {format(new Date(item.date), 'EEEE, d MMM', { locale: getDateFnsLocale() })}
              </Text>
              <Text style={[styles.logDuration, dynamicStyles.subtitle]}>
                {item.duration_min ? formatDuration(item.duration_min) : '--'}
              </Text>
              {timeRange ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, opacity: 0.7 }}>
                  <Clock size={12} color={themeColors.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={[typography.caption, { color: themeColors.textSecondary }]}>{timeRange}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.logItemRight}>
            {item.quality_score && (
              <View
                style={[
                  styles.qualityBadge,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
                ]}
              >
                <Star
                  size={12}
                  color={getQualityColor(item.quality_score)}
                  fill={getQualityColor(item.quality_score)}
                />
                <Text style={[styles.qualityText, { color: getQualityColor(item.quality_score) }]}>
                  {item.quality_score}
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => handleDelete(item.id, item.duration_min || 0)}
              style={styles.deleteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Trash2 size={18} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>
    );
  };

  const renderHeader = () => (
    <View style={styles.statsContainer}>
      {/* Range Selector */}
      <View style={styles.rangeSelector}>
        {RANGE_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.rangeButton,
              selectedRange === option.key && styles.rangeButtonActive,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
            ]}
            onPress={() => setSelectedRange(option.key)}
          >
            <Text
              style={[
                styles.rangeButtonText,
                dynamicStyles.subtitle,
                selectedRange === option.key && styles.rangeButtonTextActive,
              ]}
            >
              {getRangeLabel(option.key)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Cards Row */}
      <View style={styles.summaryRow}>
        <GlassCard style={[styles.summaryCard, dynamicStyles.glassCard]}>
          <Clock size={20} color="#8B5CF6" />
          <Text style={[styles.summaryValue, dynamicStyles.title]} numberOfLines={1}>
            {formatDuration(stats.avgDuration)}
          </Text>
          <Text style={[styles.summaryLabel, dynamicStyles.subtitle]}>{t('health.averageLabel')}</Text>
        </GlassCard>

        <GlassCard style={[styles.summaryCard, dynamicStyles.glassCard]}>
          <Star size={20} color="#F59E0B" fill="#F59E0B" />
          <Text style={[styles.summaryValue, dynamicStyles.title]} numberOfLines={1}>
            {stats.avgQuality > 0 ? stats.avgQuality.toFixed(1) : '--'}
          </Text>
          <Text style={[styles.summaryLabel, dynamicStyles.subtitle]}>{t('health.quality')}</Text>
        </GlassCard>

        <GlassCard style={[styles.summaryCard, dynamicStyles.glassCard]}>
          {stats.trend !== null && stats.trend >= 0 ? (
            <TrendingUp size={20} color="#10B981" />
          ) : stats.trend !== null && stats.trend < 0 ? (
            <TrendingDown size={20} color="#EF4444" />
          ) : (
            <TrendingUp size={20} color={themeColors.textSecondary} />
          )}
          <Text
            style={[
              styles.summaryValue,
              dynamicStyles.title,
              stats.trend !== null && { color: stats.trend >= 0 ? '#10B981' : '#EF4444' },
            ]}
            numberOfLines={1}
          >
            {stats.trend !== null ? `${stats.trend > 0 ? '+' : ''}${stats.trend.toFixed(0)}%` : '--'}
          </Text>
          <Text style={[styles.summaryLabel, dynamicStyles.subtitle]}>{t('health.trend')}</Text>
        </GlassCard>
      </View>

      {/* Chart */}
      <GlassCard style={[styles.chartCard, dynamicStyles.glassCard]}>
        <Text style={[styles.chartTitle, dynamicStyles.title]}>
          {selectedRange === '3M' ? t('health.last12Weeks') : `${t('health.last')} ${rangeDays} ${t('health.days')}`}
        </Text>
        <View style={styles.chartContainer}>
          {stats.chartDays.map((day, index) => {
            const barHeight = maxDuration > 0 ? (day.duration / maxDuration) * maxBarHeight : 0;
            const isToday = differenceInDays(new Date(), day.date) === 0;

            return (
              <View key={index} style={styles.chartBarContainer}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: Math.max(barHeight, 4),
                        backgroundColor:
                          day.duration > 0
                            ? getDurationColor(day.duration)
                            : isDark
                              ? 'rgba(255,255,255,0.1)'
                              : 'rgba(0,0,0,0.05)',
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.chartDayLabel,
                    dynamicStyles.subtitle,
                    isToday && { color: '#8B5CF6', fontWeight: '700' },
                  ]}
                >
                  {getChartLabel(day.date, index)}
                </Text>
                {day.duration > 0 && selectedRange === '7D' && (
                  <Text style={[styles.chartHoursLabel, dynamicStyles.subtitle]}>
                    {(day.duration / 60).toFixed(1)}h
                  </Text>
                )}
              </View>
            );
          })}
        </View>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.legendText, dynamicStyles.subtitle]}>{t('health.moreThan7h')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={[styles.legendText, dynamicStyles.subtitle]}>{t('health.between6And7h')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={[styles.legendText, dynamicStyles.subtitle]}>{t('health.lessThan6h')}</Text>
          </View>
        </View>
      </GlassCard>

      {/* Section Title */}
      <Text style={[styles.sectionTitle, dynamicStyles.title]}>{t('health.history')}</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Moon size={64} color={themeColors.textSecondary} strokeWidth={1} />
      <Text style={[styles.emptyTitle, dynamicStyles.title]}>{t('health.noSleepRecords')}</Text>
      <Text style={[styles.emptySubtitle, dynamicStyles.subtitle]}>{t('health.addFirstSleepRecordBtn')}</Text>
    </View>
  );

  return (
    <LinearGradient colors={dynamicStyles.gradientColors} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={28} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, dynamicStyles.title]}>{t('settings.sleep')}</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('SleepAdd')}
            style={styles.addButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Plus size={24} color="#8B5CF6" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredLogs}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
          ListHeaderComponent={logs && logs.length > 0 ? renderHeader : null}
          ListEmptyComponent={!isLoading ? renderEmpty : null}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  addButton: {
    padding: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  statsContainer: {
    marginBottom: 8,
  },
  rangeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  rangeButtonActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  rangeButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  rangeButtonTextActive: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderRadius: 20,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  chartCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingBottom: 24,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 100,
  },
  chartBar: {
    width: 20,
    borderRadius: 6,
    minWidth: 8,
  },
  qualityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    top: -10,
  },
  chartDayLabel: {
    fontSize: 11,
    marginTop: 8,
    fontWeight: '500',
  },
  chartHoursLabel: {
    fontSize: 9,
    marginTop: 2,
    opacity: 0.6,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  logItem: {
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  logItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  logItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  logDate: {
    fontSize: 15,
    fontWeight: '600',
  },
  logDuration: {
    fontSize: 14,
    marginTop: 2,
  },
  logItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  qualityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 24,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
});
