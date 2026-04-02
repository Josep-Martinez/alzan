import React, { useState, createContext, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Settings,
  Play,
  Trophy,
  MapPin,
  Activity,
  Dumbbell,
  Navigation,
  Flame,
  Timer,
  Zap,
  Target,
  TrendingUp,
  Grid3X3,
  LucideIcon,
} from 'lucide-react-native';
import { AlzanRefreshControl, useRefresh } from '../../components/common/AlzanRefreshControl';
import { useAlzanStyles } from '../../hooks/useAlzanStyles';
import { useUserPreferences } from '../../hooks/useUserPreferences';

// Alzan Theme Context for child components
type AlzanThemeContextType = ReturnType<typeof useAlzanStyles>;
const AlzanThemeContext = createContext<AlzanThemeContextType | null>(null);
const useAlzanTheme = () => {
  const context = useContext(AlzanThemeContext);
  if (!context) throw new Error('useAlzanTheme must be used within AlzanThemeContext');
  return context;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_PROFILE_USER = {
  id: 'user1',
  name: 'Alzan User',
  username: '@josepbalague',
  avatar: 'https://i.pravatar.cc/150?img=12',
  level: 'gold',
  followers: 53,
  following: 29,
  weeklyActivities: 12,
  bio: 'Runner • Fitness enthusiast',
};

const MOCK_WEEKLY_STATS_DATA = {
  all: {
    activities: 12,
    distance: 42,
    time: '8h 45m',
    calories: 3200,
    avgPace: '5:30',
    longestRun: '10.5km',
  },
  running: {
    activities: 5,
    distance: 35,
    time: '4h 10m',
    calories: 2100,
    avgPace: '5:15',
    longestRun: '10.5km',
  },
  gym: {
    activities: 4,
    distance: 0,
    time: '3h 30m',
    calories: 800,
    avgPace: '-',
    longestRun: '-',
  },
  cycling: {
    activities: 3,
    distance: 7,
    time: '1h 05m',
    calories: 300,
    avgPace: '25.0',
    longestRun: '7km',
  },
};

// Simplified Activities for GRID view
const MOCK_GRID_ACTIVITIES = [
  { id: '1', type: 'running', image: 'map', title: 'Morning Run', distance: '5k' },
  { id: '2', type: 'gym', image: 'gym', title: 'Leg Day', exercises: '8' },
  { id: '3', type: 'challenge', image: 'challenge', title: 'Monthly QA', status: 'Active' },
  { id: '4', type: 'running', image: 'map', title: 'Evening Jog', distance: '3k' },
  { id: '5', type: 'gym', image: 'gym', title: 'Push Day', exercises: '6' },
  { id: '6', type: 'running', image: 'map', title: 'Marathon Prep', distance: '12k' },
  { id: '7', type: 'gym', image: 'gym', title: 'Pull Day', exercises: '7' },
  { id: '8', type: 'running', image: 'map', title: 'Intervals', distance: '4k' },
  { id: '9', type: 'challenge', image: 'challenge', title: 'Summer Shred', status: 'Done' },
];

const MOCK_PULSES = [
  {
    id: '1',
    gradient: ['#FF9A56', '#FF6B9D'] as const,
    title: 'Racha',
    value: '7',
    unit: 'días',
  },
  {
    id: '2',
    gradient: ['#E9A73C', '#F5CD87'] as const,
    title: 'Semana',
    value: '42',
    unit: 'km',
  },
  {
    id: '3',
    gradient: ['#4A90D9', '#81D4FA'] as const,
    title: 'Mejor',
    value: '3:45',
    unit: '/km',
  },
];

const MOCK_BADGES = [
  { id: '1', name: 'Madrugador', unlocked: true, emoji: '🌅' },
  { id: '2', name: 'Constante', unlocked: true, emoji: '📅' },
  { id: '3', name: 'Velocista', unlocked: true, emoji: '⚡' },
  { id: '4', name: 'Resistencia', unlocked: true, emoji: '🏃' },
  { id: '5', name: 'Fuerza', unlocked: false, emoji: '💪' },
  { id: '6', name: 'Guerrero', unlocked: false, emoji: '🦾' },
];

const MOCK_PRS = [
  { label: 'Mejor 1k', value: '3:45' },
  { label: 'Mejor 5k', value: '21:30' },
  { label: 'Mejor 10k', value: '42:00' },
  { label: 'Sentadilla', value: '120kg' },
];

// ============================================================================
// COMPONENTS
// ============================================================================

// 1. FIXED HEADER - Name on left, Settings on right
const FixedHeader = () => {
  const { t } = useTranslation();
  const { styles: themeStyles } = useAlzanTheme();
  return (
    <View style={styles.fixedHeader}>
      <Text style={[styles.fixedHeaderTitle, themeStyles.headerTitle]}>{t('alzan.brandName')}</Text>
      <TouchableOpacity style={[styles.fixedHeaderIcon, { backgroundColor: themeStyles.headerIconBg }]}>
        <Settings size={24} color={themeStyles.headerIconColor} />
      </TouchableOpacity>
    </View>
  );
};

// 2. PROFILE CONTENT (Avatar, Stats)
interface ProfileContentProps {
  onWeeklyPress: () => void;
  isWeeklyExpanded: boolean;
}

const ProfileContent = ({ onWeeklyPress, isWeeklyExpanded }: ProfileContentProps) => {
  const { t } = useTranslation();
  const { styles: themeStyles } = useAlzanTheme();
  return (
    <View style={styles.profileContentWrapper}>
      {/* Avatar with Glow Effect */}
      <View style={styles.avatarContainer}>
        <View style={[styles.avatarGlow, themeStyles.avatarGlow]}>
          <Image source={{ uri: MOCK_PROFILE_USER.avatar }} style={styles.avatarImage} />
        </View>
        <Text style={[styles.profileName, themeStyles.profileName]}>{MOCK_PROFILE_USER.name}</Text>
        <Text style={[styles.profileLevel, themeStyles.profileBio]}>{MOCK_PROFILE_USER.bio}</Text>
      </View>

      {/* Stats Cards Row - Clean Design */}
      <View style={styles.statsRow}>
        <TouchableOpacity style={[styles.statCard, themeStyles.statCard]}>
          <Text style={[styles.statValue, themeStyles.statValue]}>{MOCK_PROFILE_USER.following}</Text>
          <Text style={[styles.statLabel, themeStyles.statLabel]}>{t('alzan.followingCount')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.statCard, themeStyles.statCard]}>
          <Text style={[styles.statValue, themeStyles.statValue]}>{MOCK_PROFILE_USER.followers}</Text>
          <Text style={[styles.statLabel, themeStyles.statLabel]}>{t('alzan.followers')}</Text>
        </TouchableOpacity>
        {/* Esta Semana - Toggles Inline Summary */}
        <TouchableOpacity
          style={[
            styles.statCard,
            themeStyles.statCard,
            isWeeklyExpanded && [styles.statCardActive, themeStyles.statCardActive],
          ]}
          onPress={onWeeklyPress}
        >
          <Text style={[styles.statValue, themeStyles.statValue, isWeeklyExpanded && themeStyles.statValueActive]}>
            {MOCK_PROFILE_USER.weeklyActivities}
          </Text>
          <Text style={[styles.statLabel, themeStyles.statLabel, isWeeklyExpanded && themeStyles.statLabelActive]}>
            {t('alzan.thisWeek')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const InlineWeeklySummary = () => {
  const { t } = useTranslation();
  const { styles: themeStyles, colors, isDark } = useAlzanTheme();
  const [selectedSport, setSelectedSport] = useState<keyof typeof MOCK_WEEKLY_STATS_DATA>('all');
  const { preferences } = useUserPreferences();

  const currentStats = MOCK_WEEKLY_STATS_DATA[selectedSport];

  const SportPill = ({ id, label, icon: Icon }: { id: typeof selectedSport; label: string; icon?: LucideIcon }) => {
    const isSelected = selectedSport === id;
    return (
      <TouchableOpacity
        onPress={() => setSelectedSport(id)}
        style={[
          styles.sportPill,
          isSelected && {
            backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
            borderColor: colors.primary,
          },
        ]}
      >
        {Icon && <Icon size={14} color={isSelected ? colors.primary : colors.textSecondary} />}
        <Text
          style={[
            styles.sportPillText,
            { color: isSelected ? colors.primary : colors.textSecondary },
            isSelected && { fontWeight: '600' },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.inlineSummaryWrapper, { marginTop: 16 }]}>
      <View style={[styles.inlineSummaryCard, themeStyles.inlineSummaryCard]}>
        {/* Title & Selector */}
        <View style={styles.inlineHeaderRow}>
          <View style={styles.inlineTitleContainer}>
            <TrendingUp size={16} color="#4A90D9" />
            <Text style={[styles.inlineSummaryTitle, themeStyles.inlineSummaryTitle]}>{t('alzan.weeklySummary')}</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sportSelectorContent}
            style={styles.sportSelector}
          >
            <SportPill id="all" label={t('alzan.all')} />
            <SportPill id="running" label={t('constants.running')} icon={Activity} />
            <SportPill id="gym" label={t('alzan.gym')} icon={Dumbbell} />
            <SportPill id="cycling" label={t('alzan.bike')} icon={Zap} />
          </ScrollView>
        </View>

        {/* Stats Grid */}
        <View style={styles.inlineSummaryGrid}>
          <View style={styles.inlineSummaryStat}>
            <Target size={16} color="#34C759" />
            <Text style={[styles.inlineSummaryValue, themeStyles.inlineSummaryValue]}>{currentStats.activities}</Text>
            <Text style={[styles.inlineSummaryLabel, themeStyles.inlineSummaryLabel]}>{t('alzan.activitiesAbbr')}</Text>
          </View>
          <View style={styles.inlineSummaryDivider} />
          <View style={styles.inlineSummaryStat}>
            <MapPin size={16} color="#FF9500" />
            <Text style={[styles.inlineSummaryValue, themeStyles.inlineSummaryValue]}>{currentStats.distance}</Text>
            <Text style={[styles.inlineSummaryLabel, themeStyles.inlineSummaryLabel]}>{preferences.distance_unit}</Text>
          </View>
          <View style={styles.inlineSummaryDivider} />
          <View style={styles.inlineSummaryStat}>
            <Timer size={16} color="#AF52DE" />
            <Text style={[styles.inlineSummaryValue, themeStyles.inlineSummaryValue]}>{currentStats.time}</Text>
            <Text style={[styles.inlineSummaryLabel, themeStyles.inlineSummaryLabel]}>{t('alzan.time')}</Text>
          </View>
          <View style={styles.inlineSummaryDivider} />
          <View style={styles.inlineSummaryStat}>
            <Flame size={16} color="#FF3B30" />
            <Text style={[styles.inlineSummaryValue, themeStyles.inlineSummaryValue]}>{currentStats.calories}</Text>
            <Text style={[styles.inlineSummaryLabel, themeStyles.inlineSummaryLabel]}>{t('nutrition.kcal')}</Text>
          </View>
        </View>

        {/* Extra Stats */}
        <View style={[styles.inlineExtraRow, themeStyles.inlineExtraRow]}>
          <Text style={[styles.inlineExtraLabel, themeStyles.inlineExtraLabel]}>{t('alzan.avgPace')}</Text>
          <Text style={[styles.inlineExtraValue, themeStyles.inlineExtraValue]}>
            {currentStats.avgPace}/{preferences.distance_unit}
          </Text>
        </View>
        <View style={[styles.inlineExtraRow, themeStyles.inlineExtraRow]}>
          <Text style={[styles.inlineExtraLabel, themeStyles.inlineExtraLabel]}>{t('alzan.longestRun')}</Text>
          <Text style={[styles.inlineExtraValue, themeStyles.inlineExtraValue]}>{currentStats.longestRun}</Text>
        </View>
      </View>
    </View>
  );
};

// 3. TABS (Pill Style)
type TabType = 'posts' | 'clips' | 'saved';

interface TabSelectorProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TabSelector = ({ activeTab, onTabChange }: TabSelectorProps) => {
  const { styles: themeStyles } = useAlzanTheme();
  return (
    <View style={[styles.tabsContainer, { backgroundColor: themeStyles.tabsContainerBg }]}>
      <View style={[styles.tabsBackground, { backgroundColor: themeStyles.tabsBackgroundBg }]}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'posts' && [styles.tabButtonActive, { backgroundColor: themeStyles.tabButtonActiveBg }],
          ]}
          onPress={() => onTabChange('posts')}
        >
          <Grid3X3
            size={18}
            color={activeTab === 'posts' ? themeStyles.tabIconActiveColor : themeStyles.tabIconColor}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'clips' && [styles.tabButtonActive, { backgroundColor: themeStyles.tabButtonActiveBg }],
          ]}
          onPress={() => onTabChange('clips')}
        >
          <Play size={18} color={activeTab === 'clips' ? themeStyles.tabIconActiveColor : themeStyles.tabIconColor} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'saved' && [styles.tabButtonActive, { backgroundColor: themeStyles.tabButtonActiveBg }],
          ]}
          onPress={() => onTabChange('saved')}
        >
          <Trophy size={18} color={activeTab === 'saved' ? themeStyles.tabIconActiveColor : themeStyles.tabIconColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// 3. GRID ITEM
const GridItem = ({ item, index }: { item: (typeof MOCK_GRID_ACTIVITIES)[0]; index: number }) => {
  const { t } = useTranslation();
  const isChallenge = item.type === 'challenge';

  // Abstract map-like view for mock
  if (item.type === 'running') {
    return (
      <View style={styles.gridItem}>
        <View style={styles.gridMapBg}>
          {/* Fake route line */}
          <View style={[styles.gridRoute, { transform: [{ rotate: `${index * 45}deg` }] }]} />
          <View style={styles.gridMapPin}>
            <Navigation size={12} color="#fff" fill="#fff" />
          </View>
        </View>
        {/* Overlay Icon */}
        <View style={styles.gridTypeIcon}>
          <MapPin size={10} color="#fff" />
        </View>
        {/* Gradient Overlay Details */}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.gridOverlay}>
          <Text style={styles.gridOverlayText}>{item.distance}</Text>
        </LinearGradient>
      </View>
    );
  }

  if (item.type === 'gym') {
    return (
      <View style={styles.gridItem}>
        <View style={[styles.gridGymBg, { backgroundColor: index % 2 === 0 ? '#2a2a2a' : '#1a1a2e' }]}>
          {/* Gym Background Image placeholder */}
          <Activity size={32} color="#ffffff50" />
        </View>
        <View style={styles.gridTypeIcon}>
          <Dumbbell size={10} color="#fff" />
        </View>
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.gridOverlay}>
          <Text style={styles.gridOverlayText}>
            {item.exercises}
            {t('alzan.previousRecordAbbr')}
          </Text>
        </LinearGradient>
      </View>
    );
  }

  if (isChallenge) {
    return (
      <View style={[styles.gridItem, styles.gridItemChallenge]}>
        <Image source={{ uri: `https://picsum.photos/200?random=${index}` }} style={styles.gridImage} />
        <View style={styles.challengeBadge}>
          <Text style={styles.challengeBadgeText}>{t('alzan.challengeAllCaps')}</Text>
        </View>
      </View>
    );
  }

  return <View style={styles.gridItem} />;
};

// TABS CONTENT
const PostsGrid = () => {
  return (
    <View style={styles.gridContainer}>
      {MOCK_GRID_ACTIVITIES.map((item, index) => (
        <GridItem key={item.id} item={item} index={index} />
      ))}
    </View>
  );
};

const ClipsTab = () => {
  const { t } = useTranslation();
  return (
    <View style={styles.emptyTabContainer}>
      <Play size={48} color="#ccc" />
      <Text style={styles.emptyTabText}>{t('alzan.comingSoon')}</Text>
    </View>
  );
};

const LogrosTab = () => {
  const { t } = useTranslation();
  // "Saved" in reference, implementing Logros here
  return (
    <View style={styles.logrosContainer}>
      {/* Pulse Row */}
      <View style={styles.pulseRow}>
        {MOCK_PULSES.map(p => (
          <LinearGradient key={p.id} colors={p.gradient} style={styles.pulseCard}>
            <Text style={styles.pulseValue}>{p.value}</Text>
            <Text style={styles.pulseTitle}>{p.title}</Text>
          </LinearGradient>
        ))}
      </View>

      {/* Badges */}
      <Text style={styles.sectionHeader}>{t('alzan.medals')}</Text>
      <View style={styles.badgesRow}>
        {MOCK_BADGES.map(b => (
          <View key={b.id} style={[styles.badgeItem, !b.unlocked && { opacity: 0.3 }]}>
            <Text style={styles.badgeEmoji}>{b.emoji}</Text>
          </View>
        ))}
      </View>

      {/* PRs */}
      <Text style={styles.sectionHeader}>{t('alzan.records')}</Text>
      <View style={styles.prList}>
        {MOCK_PRS.map((pr, i) => (
          <View key={i} style={styles.prRow}>
            <Text style={styles.prLabel}>{pr.label}</Text>
            <Text style={styles.prValue}>{pr.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../../types/navigation.types';
import { useTranslation } from 'react-i18next';

// ...

export const AlzanProfileScreen = () => {
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [showWeeklySummary, setShowWeeklySummary] = useState(false);
  const { refreshing, onRefresh } = useRefresh();
  const alzanTheme = useAlzanStyles();
  const { styles: themeStyles } = alzanTheme;
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const scrollViewRef = React.useRef<ScrollView>(null);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      });
    });
    return unsubscribe;
  }, [navigation]);

  const renderContent = () => {
    switch (activeTab) {
      case 'posts':
        return <PostsGrid />;
      case 'clips':
        return <ClipsTab />;
      case 'saved':
        return <LogrosTab />;
      default:
        return <PostsGrid />;
    }
  };

  return (
    <AlzanThemeContext.Provider value={alzanTheme}>
      <View style={[styles.container, { backgroundColor: themeStyles.containerBackground }]}>
        {/* Aurora Background */}
        <View style={[styles.baseBackground, { backgroundColor: themeStyles.baseBackground }]} />

        {/* Top Orb (Blue Light) */}
        <View style={styles.topOrb}>
          <LinearGradient
            colors={themeStyles.topOrbColors}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </View>

        {/* Bottom Orb (Violet Depth) */}
        <View style={styles.bottomOrb}>
          <LinearGradient
            colors={themeStyles.bottomOrbColors}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </View>

        <SafeAreaView style={styles.safeArea}>
          {/* Fixed Header */}
          <FixedHeader />

          {/* Scrollable Content with Pull-to-Refresh */}
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<AlzanRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            <ProfileContent
              onWeeklyPress={() => setShowWeeklySummary(!showWeeklySummary)}
              isWeeklyExpanded={showWeeklySummary}
            />
            {showWeeklySummary && <InlineWeeklySummary />}
            <TabSelector activeTab={activeTab} onTabChange={setActiveTab} />
            <View style={styles.contentContainer}>{renderContent()}</View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </AlzanThemeContext.Provider>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  baseBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F5F7FA',
  },
  topOrb: {
    position: 'absolute',
    top: -100,
    left: -50,
    width: SCREEN_WIDTH * 1.5,
    height: 400,
    borderRadius: SCREEN_WIDTH,
    transform: [{ rotate: '-20deg' }],
    overflow: 'hidden',
  },
  bottomOrb: {
    position: 'absolute',
    bottom: -100,
    right: -50,
    width: SCREEN_WIDTH * 1.5,
    height: 500,
    borderRadius: SCREEN_WIDTH,
    transform: [{ rotate: '20deg' }],
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  safeArea: {
    flex: 1,
  },

  // Fixed Header
  fixedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  fixedHeaderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  fixedHeaderIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
  },

  // Profile Content Wrapper
  profileContentWrapper: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  // HEADER - Clean version without blue background
  headerWrapper: {
    marginBottom: 20,
  },
  headerSafeAreaClean: {
    paddingHorizontal: 20,
  },
  headerTopRowClean: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  headerTitleClean: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  headerIconClean: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
  },
  // Legacy styles - kept for reference
  headerBackground: {
    height: 180,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
  },
  headerSafeArea: {
    flex: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  headerIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },

  // PROFILE CONTENT
  profileContentContainer: {
    marginTop: 10,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarGlow: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 3,
    backgroundColor: '#fff', // White border/halo
    shadowColor: '#4A90D9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
    marginTop: 12,
  },
  profileLevel: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },

  // STATS CARDS
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
  statCardActive: {
    // Removed hardcoded background and border to let useAlzanStyles handle it
  },
  statValueActive: {
    color: '#4A90D9',
  },
  statLabelActive: {
    color: '#4A90D9',
  },

  // INLINE WEEKLY SUMMARY
  inlineSummaryWrapper: {
    paddingHorizontal: 16,
    // marginBottom removed to avoid double spacing with tabsContainer marginTop
  },
  inlineSummaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inlineSummaryHeader: {
    // Deprecated in favor of inlineHeaderRow
    marginBottom: 0,
  },
  inlineHeaderRow: {
    marginBottom: 16,
    gap: 12,
  },
  inlineTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sportSelector: {
    flexGrow: 0,
    // marginLeft removed
  },
  sportSelectorContent: {
    gap: 8,
  },
  sportPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sportPillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  inlineSummaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  inlineSummaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  inlineSummaryStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  inlineSummaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  inlineSummaryLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
  inlineSummaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#eee',
  },
  inlineExtraRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  inlineExtraLabel: {
    fontSize: 13,
    color: '#666',
  },
  inlineExtraValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a2e',
  },

  // TABS
  tabsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginTop: 16, // Adjusted to 16 to match inline summary margin
    backgroundColor: '#F7F8FA', // Match main bg for sticky blend
  },
  tabsBackground: {
    flexDirection: 'row',
    backgroundColor: '#EAECEF',
    borderRadius: 30, // Pill shape
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 24,
  },
  tabButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#888',
  },
  tabTextActive: {
    color: '#1a1a2e',
    fontWeight: '600',
  },

  // GRID CONTENT
  contentContainer: {
    paddingHorizontal: 16,
    minHeight: 400,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: (SCREEN_WIDTH - 32 - 24) / 3, // (Screen - Padding - Gaps) / 3
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
    position: 'relative',
  },
  gridItemChallenge: {
    backgroundColor: '#000',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridMapBg: {
    flex: 1,
    backgroundColor: '#A8C8E8', // Light blue map bg
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridGymBg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridRoute: {
    width: 40,
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  gridMapPin: {
    position: 'absolute',
    backgroundColor: '#4A90D9',
    padding: 4,
    borderRadius: 10,
  },
  gridTypeIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    paddingTop: 16,
  },
  gridOverlayText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  challengeBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: '#4A90D9',
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  challengeBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },

  // LOGROS / SAVED
  logrosContainer: {
    paddingBottom: 20,
  },
  pulseRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  pulseCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  pulseValue: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  pulseTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  badgeItem: {
    width: 50,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  badgeEmoji: {
    fontSize: 24,
  },
  prList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  prLabel: {
    fontSize: 14,
    color: '#666',
  },
  prValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },

  // EMPTY STATES
  emptyTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTabText: {
    color: '#999',
    marginTop: 8,
    fontWeight: '500',
  },

  // WEEKLY SUMMARY CARD
  weeklySummaryWrapper: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  weeklySummaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  weeklySummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weeklySummaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weeklySummaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  weeklyMainStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weeklyMainStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  weeklyMainValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  weeklyMainLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
  weeklyDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#eee',
  },
  weeklyExpandedSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  weeklyExpandedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weeklyExpandedLabel: {
    fontSize: 14,
    color: '#666',
  },
  weeklyExpandedValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  weeklyViewAllButton: {
    backgroundColor: '#4A90D9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  weeklyViewAllText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#888',
  },
  modalStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  modalStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  modalStatLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  modalExtraStats: {
    backgroundColor: '#F7F8FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  modalExtraRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalExtraLabel: {
    fontSize: 14,
    color: '#666',
  },
  modalExtraValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  modalActionButton: {
    backgroundColor: '#4A90D9',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalActionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default AlzanProfileScreen;
