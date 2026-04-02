import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface PulseCardProps {
  avatar: string;
  achievement: string;
  value: string;
  gradient: [string, string];
  icon: React.ReactNode; // Cambiado a ReactNode para aceptar componentes de iconos
  onPress?: () => void;
}

export const PulseCard: React.FC<PulseCardProps> = ({ avatar, achievement, value, gradient, icon, onPress }) => {
  return (
    <TouchableOpacity style={styles.pulseCard} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient colors={gradient} style={styles.pulseGradient} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}>
        {/* Icono de fondo - sutil y decorativo */}
        <View style={styles.backgroundIconContainer}>{icon}</View>

        {/* Contenido principal centrado */}
        <View style={styles.contentContainer}>
          {/* Avatar protagonista */}
          <View style={styles.pulseAvatarBorder}>
            <Image source={{ uri: avatar }} style={styles.pulseAvatar} />
          </View>

          {/* Texto del logro */}
          <Text style={styles.pulseAchievementText} numberOfLines={2}>
            {achievement}
          </Text>
          <Text style={styles.pulseValueText}>{value}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pulseCard: {
    width: 75,
    height: 110,
    borderRadius: 38,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  pulseGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.15,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 10,
    gap: 4,
  },
  pulseAvatarBorder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  pulseAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  pulseAchievementText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  pulseValueText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
