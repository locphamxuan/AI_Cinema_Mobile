import { Alert, Platform, type AlertButton, type AlertOptions } from 'react-native';

/**
 * `Alert.alert` with the same arguments, that also works on Expo web. react-native-web ships `Alert` as a
 * no-op, so on the web a dialog would never show and its buttons never run (subscribing to a plan, removing
 * a device...). There the browser's own dialogs stand in: one button is an alert, a cancel and an action
 * are a confirm.
 */
export function showDialog(title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons, options);
    return;
  }
  const text = message ? `${title}\n\n${message}` : title;
  const action = buttons?.find((button) => button.style !== 'cancel');
  const cancel = buttons?.find((button) => button.style === 'cancel');
  if (!action || !cancel) {
    window.alert(text);
    action?.onPress?.();
    return;
  }
  if (window.confirm(text)) action.onPress?.();
  else cancel.onPress?.();
}
