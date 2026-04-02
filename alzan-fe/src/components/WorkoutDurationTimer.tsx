import React from 'react';
import { Text, TextStyle } from 'react-native';

interface WorkoutDurationTimerProps {
  seconds: number;
  style?: TextStyle | TextStyle[];
}

export const WorkoutDurationTimer: React.FC<WorkoutDurationTimerProps> = ({ seconds, style }) => {
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return <Text style={style}>{formatTime(seconds)}</Text>;
};
