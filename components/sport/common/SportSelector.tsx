// components/SportSelector.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SPORT_TRANSLATIONS, SportType } from './sports';

interface SportSelectorProps {
  onSportSelect: (sport: SportType) => void;
  onClose: () => void;
}

const SPORT_ICONS: Record<SportType, string> = {
  gym: 'dumbbell',
  running: 'run',
  cycling: 'bike',
  swimming: 'swim',
  yoga: 'meditation',
  football: 'soccer',
  basketball: 'basketball'
};

const SPORT_COLORS: Record<SportType, string[]> = {
  gym: ['#FF6B6B', '#FF5252'],
  running: ['#4ECDC4', '#26C6DA'],
  cycling: ['#45B7D1', '#2196F3'],
  swimming: ['#96CEB4', '#4CAF50'],
  yoga: ['#FECA57', '#FF9800'],
  football: ['#6C5CE7', '#673AB7'],
  basketball: ['#FD79A8', '#E91E63']
};

export default function SportSelector({ onSportSelect, onClose }: SportSelectorProps) {
  const sports: SportType[] = ['gym', 'running', 'cycling', 'swimming', 'yoga', 'football', 'basketball'];

  const handleSportSelect = (sport: SportType) => {
    onSportSelect(sport);
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={['#0F0F23', '#1A1A3A', '#2D2D5F']}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Seleccionar Deporte</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color="#B0B0C4"
              />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>¿Qué deporte vas a entrenar hoy?</Text>
        </View>

        {/* Sports Grid */}
        <View style={styles.content}>
          <View style={styles.sportsGrid}>
            {sports.map((sport) => (
              <Pressable
                key={sport}
                onPress={() => handleSportSelect(sport)}
                style={styles.sportButton}
              >
                <LinearGradient
                  colors={SPORT_COLORS[sport] as [string, string]}
                  style={styles.sportCard}
                >
                  <MaterialCommunityIcons
                    name={SPORT_ICONS[sport] as any}
                    size={32}
                    color="#FFFFFF"
                  />
                  <Text style={styles.sportName}>
                    {SPORT_TRANSLATIONS[sport]}
                  </Text>
                </LinearGradient>
              </Pressable>
            ))}
          </View>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },

  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  subtitle: {
    fontSize: 16,
    color: '#B0B0C4',
  },

  closeButton: {
    padding: 8,
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },

  sportButton: {
    width: '47%', // 2 columns with gap
    marginBottom: 16,
  },

  sportCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },

  sportName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
    textAlign: 'center',
  },
});