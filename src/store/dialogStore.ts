import type { AlertButton } from 'react-native';
import { create } from 'zustand';

export interface DialogRequest {
  id: number;
  title: string;
  message?: string;
  buttons: AlertButton[];
  /** Tapping outside or the back button closes it (runs the cancel button, if any). */
  cancelable: boolean;
}

interface DialogState {
  /** The dialog on screen first; later ones wait their turn. */
  queue: DialogRequest[];
  push: (dialog: Omit<DialogRequest, 'id'>) => void;
  /** Closes the dialog on screen, then runs the button's action. */
  press: (button?: AlertButton) => void;
}

let nextId = 1;

/** App-wide dialogs drawn by `AppDialog` in the app theme, instead of the system alert. */
export const useDialogStore = create<DialogState>()((set) => ({
  queue: [],
  push: (dialog) => set((state) => ({ queue: [...state.queue, { ...dialog, id: nextId++ }] })),
  press: (button) => {
    set((state) => ({ queue: state.queue.slice(1) }));
    button?.onPress?.();
  },
}));
