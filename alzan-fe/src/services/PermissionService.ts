import { Camera } from 'expo-camera';
import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';

export const PermissionService = {
  /**
   * Request camera permissions.
   * Returns the final status of the permission.
   */
  async requestCameraPermissionAsync() {
    // Check existing status first
    const { status: existingStatus } = await Camera.getCameraPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Camera.requestCameraPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Camera permission denied');
    }

    return finalStatus;
  },

  /**
   * Request microphone permissions.
   * Returns the final status of the permission.
   */
  async requestMicrophonePermissionAsync() {
    // Check existing status first
    const { status: existingStatus } = await getRecordingPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await requestRecordingPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Microphone permission denied');
    }

    return finalStatus;
  },
};
