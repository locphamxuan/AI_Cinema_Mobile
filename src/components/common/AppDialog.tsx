import React from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View, type AlertButton } from 'react-native';
import { useTheme } from '../../theme';
import { useDialogStore } from '../../store/dialogStore';
import { styles } from '../../styles/components/common/AppDialog.styles';

/**
 * Draws the dialog `showDialog()` queued, in the app theme: the main action pink, a destructive one red,
 * "cancel" grey. Two buttons sit side by side (action on the right), three or more stack.
 */
export const AppDialog: React.FC = () => {
  const { colors } = useTheme();
  const dialog = useDialogStore((state) => state.queue[0]);
  const press = useDialogStore((state) => state.press);
  if (!dialog) return null;

  const cancel = dialog.buttons.find((button) => button.style === 'cancel');
  const dismiss = () => {
    if (dialog.cancelable) press(cancel);
  };
  const inRow = dialog.buttons.length === 2;
  // The last non-cancel button is the one the dialog is for.
  const primary = [...dialog.buttons].reverse().find((button) => button.style !== 'cancel');
  const tone = (button: AlertButton) => {
    if (button.style === 'destructive') return { bg: colors.danger, fg: colors.white };
    if (button.style === 'cancel') return { bg: colors.cardAlt, fg: colors.text };
    if (button === primary) return { bg: colors.ruby, fg: colors.white };
    return { bg: colors.rubySoft, fg: colors.ruby };
  };
  // Side by side: cancel on the left. Stacked: the main action first, cancel last.
  const isCancel = (button: AlertButton) => Number(button.style === 'cancel');
  const ordered = [...dialog.buttons].sort((a, b) => (inRow ? isCancel(b) - isCancel(a) : isCancel(a) - isCancel(b)));

  return (
    <Modal transparent visible animationType="fade" onRequestClose={dismiss} statusBarTranslucent>
      <Pressable
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
        onPress={dismiss}
        accessibilityLabel="Đóng hộp thoại"
      >
        <Pressable
          style={[styles.card, { backgroundColor: colors.surface }]}
          onPress={() => undefined}
          accessibilityRole="alert"
          accessibilityViewIsModal
        >
          <Text style={[styles.title, { color: colors.text }]}>{dialog.title}</Text>
          {dialog.message ? (
            <Text style={[styles.message, { color: colors.textSecondary }]}>{dialog.message}</Text>
          ) : null}
          <View style={[styles.actions, inRow && styles.actionsRow]}>
            {ordered.map((button, index) => {
              const { bg, fg } = tone(button);
              return (
                <TouchableOpacity
                  key={`${button.text ?? 'ok'}-${index}`}
                  activeOpacity={0.85}
                  onPress={() => press(button)}
                  accessibilityRole="button"
                  style={[styles.action, inRow && styles.actionInRow, { backgroundColor: bg }]}
                >
                  <Text style={[styles.actionLabel, { color: fg }]}>{button.text ?? 'OK'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
