// Alert.ts
import { AlertButton, Platform, Alert as RNAlert } from 'react-native';

interface AlertConfig {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

class CustomAlertManager {
  private listener: ((config: AlertConfig) => void) | null = null;

  setListener(listener: (config: AlertConfig) => void) {
    this.listener = listener;
  }

  alert(title: string, message?: string, buttons?: AlertButton[]) {
    if (Platform.OS === 'web') {
      if (this.listener) {
        this.listener({ title, message, buttons });
      } else {
        // Fallback to browser alert if provider not mounted
        window.alert(message ? `${title}\n\n${message}` : title);
      }
    } else {
      // Use native Alert on iOS/Android
      RNAlert.alert(title, message, buttons);
    }
  }
}

export const Alert = new CustomAlertManager();
