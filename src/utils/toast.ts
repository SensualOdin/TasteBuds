import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';

export function showToast({ title, message }: { title: string; message?: string }) {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  Alert.alert(title, message);
}

export function showErrorToast({ title, message }: { title: string; message?: string }) {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  Alert.alert(title, message);
}
