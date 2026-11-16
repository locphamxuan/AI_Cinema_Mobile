import type { AlertButton, AlertOptions } from 'react-native';
import { useDialogStore } from '../store/dialogStore';

/**
 * Same arguments as `Alert.alert`, drawn by `AppDialog` in the app theme on every platform: the system
 * alert looks out of place on Android, cannot hold more than one action on the web (react-native-web
 * ships `Alert` as a no-op and the browser confirm has two buttons) and differs on iOS.
 */
export function showDialog(title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions): void {
  const list = buttons?.length ? buttons : [{ text: 'OK' }];
  const hasCancel = list.some((button) => button.style === 'cancel');
  useDialogStore.getState().push({
    title,
    message,
    buttons: list,
    cancelable: options?.cancelable ?? (hasCancel || list.length === 1),
  });
}
