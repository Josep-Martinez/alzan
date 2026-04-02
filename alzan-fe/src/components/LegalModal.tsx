import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { spacing, typography } from '../theme';
import { useTheme } from '../context/ThemeContext';

interface LegalModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export const LegalModal = ({ visible, onClose, title, content }: LegalModalProps) => {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <Text style={[styles.legalText, { color: colors.textPrimary }]}>{content}</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.m,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...typography.h4,
    flex: 1,
  },
  closeButton: {
    padding: spacing.s,
  },
  modalContent: {
    padding: spacing.m,
    paddingBottom: spacing.xl,
  },
  legalText: {
    ...typography.body,
    lineHeight: 24,
  },
});
