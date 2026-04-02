import React, { useState, createContext, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Edit3, Search } from 'lucide-react-native';
import { AlzanRefreshControl, useRefresh } from '../../components/common/AlzanRefreshControl';
import { useAlzanStyles } from '../../hooks/useAlzanStyles';
import { TabParamList } from '../../types/navigation.types';
import { useTranslation } from 'react-i18next';
import { TranslationKey } from '../../i18n/locales/en';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Alzan Theme Context for child components
type AlzanThemeContextType = ReturnType<typeof useAlzanStyles>;
const AlzanThemeContext = createContext<AlzanThemeContextType | null>(null);
const useAlzanTheme = () => {
  const context = useContext(AlzanThemeContext);
  if (!context) throw new Error('useAlzanTheme must be used within AlzanThemeContext');
  return context;
};

// ============================================================================
// MOCK DATA
// ============================================================================

type MockConversation = {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageKey?: TranslationKey;
  time: string;
  timeKey?: TranslationKey;
  isSentByMe: boolean;
  isUnread: boolean;
  unreadCount: number;
};

const MOCK_CONVERSATIONS: MockConversation[] = [
  {
    id: '1',
    name: 'Ana García',
    avatar: 'https://i.pravatar.cc/150?img=5',
    lastMessage: '',
    lastMessageKey: 'alzan.mockGreatRunMsg',
    time: '',
    timeKey: 'alzan.timeNow',
    isSentByMe: false,
    isUnread: true,
    unreadCount: 3, // MÚTIPLES MENSAJES SIN LEER
  },
  {
    id: '2',
    name: 'Carlos Ruiz',
    avatar: 'https://i.pravatar.cc/150?img=8',
    lastMessage: '',
    lastMessageKey: 'alzan.mockPerfectAt7Msg',
    time: '10 min',
    isSentByMe: true,
    isUnread: false,
    unreadCount: 0,
  },
  {
    id: '3',
    name: 'Laura Martín',
    avatar: 'https://i.pravatar.cc/150?img=9',
    lastMessage: '',
    lastMessageKey: 'alzan.mockChallengeMsg',
    time: '1h',
    isSentByMe: false,
    isUnread: true,
    unreadCount: 1, // UN SOLO MENSAJE SIN LEER
  },
  {
    id: '4',
    name: 'Miguel Ángel',
    avatar: 'https://i.pravatar.cc/150?img=12',
    lastMessage: '',
    lastMessageKey: 'alzan.mockSeeYouGymMsg',
    time: '3h',
    isSentByMe: false,
    isUnread: false,
    unreadCount: 0,
  },
  {
    id: '5',
    name: 'Sara López',
    avatar: 'https://i.pravatar.cc/150?img=25',
    lastMessage: '',
    lastMessageKey: 'alzan.mockTomorrowRun7Msg',
    time: '',
    timeKey: 'alzan.timeYesterday',
    isSentByMe: true,
    isUnread: false,
    unreadCount: 0,
  },
  {
    id: '6',
    name: 'Diego Fernández',
    avatar: 'https://i.pravatar.cc/150?img=15',
    lastMessage: '',
    lastMessageKey: 'alzan.mockGreat10kTimeMsg',
    time: '',
    timeKey: 'alzan.timeYesterday',
    isSentByMe: false,
    isUnread: false,
    unreadCount: 0,
  },
  {
    id: '7',
    name: 'Alba Ruiz',
    avatar: 'https://i.pravatar.cc/150?img=30',
    lastMessage: '',
    lastMessageKey: 'alzan.mockNewRouteMsg',
    time: '2d',
    isSentByMe: false,
    isUnread: true,
    unreadCount: 5, // MÚTIPLES MENSAJES SIN LEER
  },
];

// ============================================================================
// COMPONENTS
// ============================================================================

const ConversationItem = ({ conversation }: { conversation: MockConversation }) => {
  const { t } = useTranslation();
  const { colors, isDark } = useAlzanTheme();
  const isUnread = !conversation.isSentByMe && conversation.isUnread;
  const hasMultipleUnread = isUnread && conversation.unreadCount > 1;
  const resolvedMessage = conversation.lastMessageKey
    ? String(t(conversation.lastMessageKey))
    : conversation.lastMessage;
  const resolvedTime = conversation.timeKey ? String(t(conversation.timeKey)) : conversation.time;

  let messageText: string;
  if (hasMultipleUnread) {
    messageText = String(t('alzan.newMessagesCount', { count: conversation.unreadCount }));
  } else if (conversation.isSentByMe) {
    messageText = `${String(t('alzan.youPrefix'))}: ${resolvedMessage}`;
  } else {
    messageText = resolvedMessage;
  }

  return (
    <TouchableOpacity
      style={[styles.conversationItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
      activeOpacity={0.6}
    >
      <Image source={{ uri: conversation.avatar }} style={styles.avatar} />
      <View style={styles.textContainer}>
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: colors.textPrimary }, isUnread && { fontWeight: '800' }]}>
            {conversation.name}
          </Text>
          <Text style={[styles.time, { color: colors.textSecondary }]}>{resolvedTime}</Text>
        </View>
        <Text
          style={[
            styles.message,
            { color: colors.textSecondary },
            isUnread && { fontWeight: '700', color: colors.textPrimary },
          ]}
          numberOfLines={1}
        >
          {messageText}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const MessagesScreen = () => {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const { refreshing, onRefresh } = useRefresh();
  const alzanTheme = useAlzanStyles();
  const { styles: themeStyles, colors, isDark } = alzanTheme;
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

  return (
    <AlzanThemeContext.Provider value={alzanTheme}>
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
          {/* Fixed Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('alzan.messages')}</Text>
            <TouchableOpacity
              style={[
                styles.newButton,
                { backgroundColor: isDark ? 'rgba(10, 132, 255, 0.2)' : 'rgba(0, 122, 255, 0.1)' },
              ]}
            >
              <Edit3 size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content with Pull-to-Refresh */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<AlzanRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {/* Search Bar (scrolls with content) */}
            <View style={styles.searchContainer}>
              <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.searchBlur}>
                <View
                  style={[
                    styles.searchBar,
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.7)' },
                  ]}
                >
                  <Search size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.textPrimary }]}
                    placeholder={t('alzan.searchConversationsPlaceholder')}
                    placeholderTextColor={colors.textSecondary}
                    value={searchText}
                    onChangeText={setSearchText}
                  />
                </View>
              </BlurView>
            </View>

            {/* Conversations */}
            {MOCK_CONVERSATIONS.map(conv => (
              <ConversationItem key={conv.id} conversation={conv} />
            ))}
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
  safeArea: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  newButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBlur: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a2e',
  },

  // List
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  // Conversation
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  nameUnread: {
    fontWeight: '800', // Más negrita
    color: '#000', // Más oscuro para mayor contraste
  },
  time: {
    fontSize: 13,
    color: '#888',
  },
  message: {
    fontSize: 14,
    color: '#666',
  },
  messageUnread: {
    fontWeight: '700', // Más negrita
    color: '#000', // Negro puro para mayor contraste
  },
});
