import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from 'lucide-react-native';
import { useAlzanStyles } from '../../hooks/useAlzanStyles';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../../types/navigation.types';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ClipsScreen = () => {
  const { t } = useTranslation();
  const { styles: themeStyles, colors, isDark } = useAlzanStyles();
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  // Although the content is simple now, we might want to make it scrollable or just listen to the event
  // The current implementation has a View as root content, but we can wrap it in ScrollView if needed
  // or just ignore if it's not scrollable.
  // The user asked for "scroll to top" on all main screens.
  // Looking at the code: "Header" and "Content" are inside SafeAreaView.
  // The content seems static "Coming Soon".
  // However, for consistency, I'll make sure it is ready.
  // But wait, the current ClipsScreen does NOT have a ScrollView. It uses View style={styles.content}.
  // Converting to ScrollView for consistency and future proofing.

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      });
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.containerBackground }]}>
      {/* Aurora Background */}
      <View style={[styles.baseBackground, { backgroundColor: themeStyles.baseBackground }]} />

      <View style={styles.topOrb}>
        <LinearGradient
          colors={themeStyles.topOrbColors}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      <View style={styles.bottomOrb}>
        <LinearGradient
          colors={themeStyles.bottomOrbColors}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('alzan.clips')}</Text>
        </View>

        {/* Coming Soon Content */}
        <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Animated Icon Container */}
          <View style={styles.iconContainer}>
            <View
              style={[
                styles.iconRing,
                { backgroundColor: isDark ? 'rgba(10, 132, 255, 0.15)' : 'rgba(0, 122, 255, 0.08)' },
              ]}
            >
              <View
                style={[
                  styles.iconInner,
                  { backgroundColor: isDark ? 'rgba(10, 132, 255, 0.25)' : 'rgba(0, 122, 255, 0.12)' },
                ]}
              >
                <Video size={40} color={colors.primary} strokeWidth={1.5} />
              </View>
            </View>
          </View>

          {/* Text */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t('alzan.comingSoon')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('alzan.shareMomentsTitle')}
            {'\n'}
            {t('alzan.shortFormatDesc')}
          </Text>

          {/* Decorative dots */}
          <View style={styles.dots}>
            <View style={[styles.dot, styles.dotActive, { backgroundColor: colors.primary }]} />
            <View
              style={[styles.dot, { backgroundColor: isDark ? 'rgba(10, 132, 255, 0.3)' : 'rgba(0, 122, 255, 0.2)' }]}
            />
            <View
              style={[styles.dot, { backgroundColor: isDark ? 'rgba(10, 132, 255, 0.3)' : 'rgba(0, 122, 255, 0.2)' }]}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

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
  safeArea: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a2e',
  },

  // Content
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },

  // Icon
  iconContainer: {
    marginBottom: 32,
  },
  iconRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Text
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },

  // Dots
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
  },
  dotActive: {
    backgroundColor: '#007AFF',
    width: 24,
  },
});
