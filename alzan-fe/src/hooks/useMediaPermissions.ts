import { useEffect, useState } from 'react';
import { PermissionService } from '../services/PermissionService';

export const useMediaPermissions = () => {
  const [cameraStatus, setCameraStatus] = useState<string | null>(null);
  const [micStatus, setMicStatus] = useState<string | null>(null);

  useEffect(() => {
    const requestPermissions = async () => {
      // Request Camera
      const camInfo = await PermissionService.requestCameraPermissionAsync();
      setCameraStatus(camInfo);

      // Request Mic
      const micInfo = await PermissionService.requestMicrophonePermissionAsync();
      setMicStatus(micInfo);
    };

    requestPermissions();
  }, []);

  return {
    cameraStatus,
    micStatus,
  };
};
