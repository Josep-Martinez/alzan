import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2', justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, fontWeight: '600' },
});

const Template = ({ name }: { name: string }) => (
  <SafeAreaView style={styles.container}>
    <Text style={styles.text}>{name}</Text>
  </SafeAreaView>
);

export const TrainingHomeScreen = () => <Template name="Training Home" />;
export const GymRoutinesListScreen = () => <Template name="Gym Routines" />;
export const GymRoutineEditorScreen = () => <Template name="Routine Editor" />;
export const ExerciseSearchScreen = () => <Template name="Exercise Search" />;
export const StartWorkoutScreen = () => <Template name="Start Workout" />;
export const ActiveWorkoutScreen = () => <Template name="Active Workout" />;
export const FinishWorkoutScreen = () => <Template name="Finish Workout" />;
export const ExerciseDetailScreen = () => <Template name="Exercise Detail" />;
export const EnduranceSessionsListScreen = () => <Template name="Endurance Sessions" />;
export const EnduranceSessionFormScreen = () => <Template name="Endurance Form" />;
export const EnduranceSessionDetailScreen = () => <Template name="Endurance Detail" />;
export const WeeklyPlanScreen = () => <Template name="Weekly Plan" />;
export const ExternalActivityLinkingScreen = () => <Template name="External Linking" />;
