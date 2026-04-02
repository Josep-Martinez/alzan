import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { MoreHorizontal, MessageCircle, Share2, Flame } from 'lucide-react-native';
import { AlzanStyles, useAlzanStyles } from '../../hooks/useAlzanStyles';
import IconA from '../../../assets/iconA.png';
import { useTranslation } from 'react-i18next';

interface FeedPost {
  id: string;
  type: string;
  user: {
    name: string;
    avatar: string;
    isFollowing?: boolean;
  };
  workoutTitle?: string;
  description?: string;
  sportName?: string;
  timestamp: string;
  stats: {
    distance?: string;
    distanceUnit?: string;
    pace?: string;
    paceUnit?: string;
    time?: string;
    timeUnit?: string;
    calories?: string;
    caloriesUnit?: string;
    exercises?: string;
    exercisesUnit?: string;
  };
  kudos: number;
  comments: number;
  muscles?: string[];
}

interface AlzanFeedCardProps {
  post: FeedPost;
  onPress?: () => void;
}

// Mapa Placeholder para posts de Cardio
const CardioMapPlaceholder = ({ themeStyles, isDark }: { themeStyles: AlzanStyles; isDark: boolean }) => {
  return (
    <View style={styles.mapContainer}>
      <View style={[styles.mapBackground, { backgroundColor: themeStyles.gridMapBg }]}>
        {/* Áreas verdes simuladas */}
        <View
          style={[styles.mapGreenArea, { top: '20%', left: '30%', width: 80, height: 60, opacity: isDark ? 0.2 : 1 }]}
        />
        <View
          style={[styles.mapGreenArea, { top: '50%', left: '50%', width: 100, height: 80, opacity: isDark ? 0.2 : 1 }]}
        />
        <View
          style={[styles.mapGreenArea, { top: '60%', left: '10%', width: 60, height: 50, opacity: isDark ? 0.2 : 1 }]}
        />

        {/* Ruta azul */}
        <View style={styles.mapRoute}>
          <View style={[styles.routePoint, { top: '20%', left: '10%', backgroundColor: themeStyles.gridRoute }]} />
          <View
            style={[
              styles.routeLine,
              {
                top: '20%',
                left: '10%',
                width: '25%',
                transform: [{ rotate: '45deg' }],
                backgroundColor: themeStyles.gridRoute,
              },
            ]}
          />
          <View style={[styles.routePoint, { top: '35%', left: '30%', backgroundColor: themeStyles.gridRoute }]} />
          <View
            style={[
              styles.routeLine,
              {
                top: '35%',
                left: '30%',
                width: '30%',
                transform: [{ rotate: '-20deg' }],
                backgroundColor: themeStyles.gridRoute,
              },
            ]}
          />
          <View style={[styles.routePoint, { top: '25%', left: '55%', backgroundColor: themeStyles.gridRoute }]} />
          <View
            style={[
              styles.routeLine,
              {
                top: '25%',
                left: '55%',
                width: '25%',
                transform: [{ rotate: '60deg' }],
                backgroundColor: themeStyles.gridRoute,
              },
            ]}
          />
          <View style={[styles.routePoint, { top: '55%', left: '70%', backgroundColor: themeStyles.gridRoute }]} />
          <View
            style={[
              styles.routeLine,
              {
                top: '55%',
                left: '70%',
                width: '20%',
                transform: [{ rotate: '120deg' }],
                backgroundColor: themeStyles.gridRoute,
              },
            ]}
          />
          <View style={[styles.routePoint, { top: '70%', left: '55%', backgroundColor: themeStyles.gridRoute }]} />
          <View
            style={[
              styles.routeLine,
              {
                top: '70%',
                left: '55%',
                width: '35%',
                transform: [{ rotate: '200deg' }],
                backgroundColor: themeStyles.gridRoute,
              },
            ]}
          />
          <View style={[styles.routePoint, { top: '60%', left: '25%', backgroundColor: themeStyles.gridRoute }]} />
        </View>

        {/* Icono de ubicación */}
        <View
          style={[
            styles.mapPinContainer,
            { backgroundColor: isDark ? 'rgba(10, 132, 255, 0.3)' : 'rgba(74, 144, 217, 0.2)' },
          ]}
        >
          <Image source={IconA} style={{ width: 24, height: 24, borderRadius: 12 }} />
        </View>
      </View>
    </View>
  );
};

// Grid de músculos para posts de Gym
const MuscleGrid = ({
  muscles,
  themeStyles,
  isDark,
}: {
  muscles: string[];
  themeStyles: AlzanStyles;
  isDark: boolean;
}) => {
  const muscleIcons: Record<string, string> = {
    Pecho: '💪',
    Hombro: '🦾',
    Tríceps: '💪',
    Core: '🔥',
    Espalda: '🏋️',
    Bíceps: '💪',
    Piernas: '🦵',
  };

  return (
    <View style={styles.muscleGrid}>
      {muscles.map((muscle, index) => (
        <View
          key={index}
          style={[styles.muscleChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,26,46,0.08)' }]}
        >
          <Text style={styles.muscleIcon}>{muscleIcons[muscle] || '💪'}</Text>
          <Text style={[styles.muscleName, { color: themeStyles.postUserName.color }]}>{muscle}</Text>
        </View>
      ))}
    </View>
  );
};

/**
 * AlzanFeedCard - Component extracted from AlzanHomeScreen
 * Includes dark mode adaptation using useAlzanStyles
 */
export const AlzanFeedCard: React.FC<AlzanFeedCardProps> = ({ post }) => {
  const { t } = useTranslation();
  const isCardio = post.type === 'cardio';
  const { styles: themeStyles, isDark } = useAlzanStyles();

  return (
    <View style={styles.feedCardWrapper}>
      {/* Tarjeta principal con cristal */}
      <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.feedCard}>
        <View style={[styles.feedCardInner, { backgroundColor: themeStyles.feedCard.backgroundColor }]}>
          {/* Header del Post */}
          <View style={styles.postHeader}>
            <View style={styles.postUserInfo}>
              <Image source={{ uri: post.user.avatar }} style={styles.postAvatar} />
              <View style={styles.postUserText}>
                <Text style={[styles.postUserName, themeStyles.postUserName]}>{post.user.name}</Text>
                <View style={styles.postMetaRow}>
                  <Text style={[styles.postTimestamp, themeStyles.postTimestamp]}>{post.timestamp}</Text>
                  <Text style={[styles.postMetaSeparator, { color: themeStyles.postTimestamp.color }]}>•</Text>
                  <Text style={[styles.postSportName, themeStyles.postTimestamp, { fontWeight: '500' }]}>
                    {post.sportName || t('alzan.activity')}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.postHeaderRight}>
              {!post.user.isFollowing && (
                <TouchableOpacity style={styles.followButton}>
                  <Text style={styles.followButtonText}>{t('alzan.follow')}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.moreButton}>
                <MoreHorizontal size={20} color={themeStyles.actionCount.color} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Título y Descripción */}
          <View style={styles.postTextContent}>
            <Text style={[styles.postWorkoutTitle, themeStyles.postWorkoutTitle]}>{post.workoutTitle}</Text>
            {post.description && (
              <Text
                style={[
                  styles.postDescription,
                  themeStyles.postDescription,
                  { color: themeStyles.postTimestamp.color },
                ]}
              >
                {post.description}
              </Text>
            )}
          </View>

          {/* Cuerpo Visual */}
          <View style={styles.postBody}>
            {isCardio ? (
              <CardioMapPlaceholder themeStyles={themeStyles} isDark={isDark} />
            ) : (
              <MuscleGrid muscles={post.muscles || []} themeStyles={themeStyles} isDark={isDark} />
            )}
          </View>

          {/* Data Row */}
          <View style={[styles.dataRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,26,46,0.08)' }]}>
            {isCardio ? (
              <>
                <View style={styles.dataItem}>
                  <Text style={[styles.dataValue, themeStyles.dataValue]}>{post.stats.distance}</Text>
                  <Text style={[styles.dataUnit, themeStyles.dataUnit]}>{post.stats.distanceUnit}</Text>
                </View>
                <View
                  style={[
                    styles.dataDivider,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,26,46,0.1)' },
                  ]}
                />
                <View style={styles.dataItem}>
                  <Text style={[styles.dataValue, themeStyles.dataValue]}>{post.stats.pace}</Text>
                  <Text style={[styles.dataUnit, themeStyles.dataUnit]}>{post.stats.paceUnit}</Text>
                </View>
                <View
                  style={[
                    styles.dataDivider,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,26,46,0.1)' },
                  ]}
                />
                <View style={styles.dataItem}>
                  <Text style={[styles.dataValue, themeStyles.dataValue]}>{post.stats.time}</Text>
                  <Text style={[styles.dataUnit, themeStyles.dataUnit]}>{post.stats.timeUnit}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.dataItem}>
                  <Text style={[styles.dataValue, themeStyles.dataValue]}>{post.stats.time}</Text>
                  <Text style={[styles.dataUnit, themeStyles.dataUnit]}>{post.stats.timeUnit}</Text>
                </View>
                <View
                  style={[
                    styles.dataDivider,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,26,46,0.1)' },
                  ]}
                />
                <View style={styles.dataItem}>
                  <View style={styles.dataValueRow}>
                    <Text style={[styles.dataValue, themeStyles.dataValue]}>{post.stats.calories}</Text>
                    <Flame size={14} color="#FF6B35" style={{ marginLeft: 4 }} />
                  </View>
                  <Text style={[styles.dataUnit, themeStyles.dataUnit]}>{post.stats.caloriesUnit}</Text>
                </View>
                <View
                  style={[
                    styles.dataDivider,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,26,46,0.1)' },
                  ]}
                />
                <View style={styles.dataItem}>
                  <Text style={[styles.dataValue, themeStyles.dataValue]}>{post.stats.exercises}</Text>
                  <Text style={[styles.dataUnit, themeStyles.dataUnit]}>{post.stats.exercisesUnit}</Text>
                </View>
              </>
            )}
          </View>

          {/* Footer - Interacciones */}
          <View
            style={[styles.postFooter, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,26,46,0.08)' }]}
          >
            <View style={styles.postActions}>
              <TouchableOpacity style={styles.postAction}>
                <Flame size={18} color="#FF6B35" />
                <Text style={[styles.actionCount, themeStyles.actionCount]}>{post.kudos}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.postAction}>
                <MessageCircle size={18} color={themeStyles.actionCount.color} />
                <Text style={[styles.actionCount, themeStyles.actionCount]}>{post.comments}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.shareButton}>
              <Share2 size={18} color={themeStyles.actionCount.color} />
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  feedCardWrapper: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  feedCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  feedCardInner: {
    // Background color is now handled by styles.feedCard.backgroundColor from hook
    borderRadius: 24,
    padding: 16,
  },

  // Post Header
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  postUserText: {
    marginLeft: 10,
    flex: 1,
  },
  postUserName: {
    fontSize: 15,
    fontWeight: '700',
    // color handled by theme
  },
  postHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  followButton: {
    backgroundColor: '#007AFF', // Alzan Primary Blue
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  moreButton: {
    padding: 4,
  },
  postDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
    // color handled by theme
  },
  postTimestamp: {
    fontSize: 12,
    // color handled by theme
  },
  postMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  postMetaSeparator: {
    fontSize: 12,
    marginHorizontal: 4,
    // color handled by theme
  },
  postSportName: {
    fontSize: 12,
    // color handled by theme
  },
  postTextContent: {
    marginBottom: 12,
  },
  postWorkoutTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    // color handled by theme
  },

  // Post Body
  postBody: {
    marginBottom: 12,
  },

  // Map Container
  mapContainer: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapBackground: {
    flex: 1,
    // backgroundColor handled by theme
    position: 'relative',
  },
  mapGreenArea: {
    position: 'absolute',
    backgroundColor: 'rgba(144, 238, 144, 0.4)',
    borderRadius: 8,
  },
  mapRoute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  routePoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    // backgroundColor handled by theme
  },
  routeLine: {
    position: 'absolute',
    height: 3,
    // backgroundColor handled by theme
    borderRadius: 2,
  },
  mapPinContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
    borderRadius: 12,
    // backgroundColor handled by theme
  },

  // Muscle Grid
  muscleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 8,
  },
  muscleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor handled by theme
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  muscleIcon: {
    fontSize: 16,
  },
  muscleName: {
    fontSize: 13,
    fontWeight: '500',
    // color handled by theme
  },

  // Data Row
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    // borderTopColor handled by theme logic
  },
  dataItem: {
    flex: 1,
    alignItems: 'center',
  },
  dataValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataValue: {
    fontSize: 20,
    fontWeight: '700',
    // color handled by theme
  },
  dataUnit: {
    fontSize: 12,
    marginTop: 2,
    // color handled by theme
  },
  dataDivider: {
    width: 1,
    height: 30,
    // backgroundColor handled by theme logic
  },

  // Post Footer
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    // borderTopColor handled by theme logic
    marginTop: 4,
  },
  postActions: {
    flexDirection: 'row',
    gap: 16,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    fontSize: 14,
    fontWeight: '500',
    // color handled by theme
  },
  shareButton: {
    padding: 4,
  },
});

export type { FeedPost };
