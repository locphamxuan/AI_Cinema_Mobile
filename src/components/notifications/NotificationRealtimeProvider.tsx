import React from 'react';
import { AppState } from 'react-native';
import { io } from 'socket.io-client';
import { API_CONFIG } from '../../constants/config';
import { apiClient } from '../../services/apiClient';
import { useSessionStore } from '../../store';
import { NOTIFICATION_UPDATED_EVENT } from '../../lib/notificationEvents';

const NotificationRevisionContext = React.createContext(0);

function notificationSocketUrl(): string {
  const baseUrl = API_CONFIG.BASE_URL;
  const origin = baseUrl.startsWith('/') ? process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api' : baseUrl;
  return `${origin.replace(/\/api\/?$/, '')}/notifications`;
}

export function NotificationRealtimeProvider({ children }: React.PropsWithChildren) {
  const signedIn = useSessionStore((state) => state.isAuthenticated);
  const [revision, setRevision] = React.useState(0);

  React.useEffect(() => {
    if (!signedIn) return;
    let active = true;
    let sentToken = '';
    let refreshAttempted = false;
    const changed = () => {
      if (active) setRevision((value) => value + 1);
    };
    const socket = io(notificationSocketUrl(), {
      transports: ['websocket'],
      auth: (send) =>
        void apiClient.getFreshAccessToken().then((token) => {
          sentToken = token;
          send({ token });
        }),
      reconnection: true,
    });

    socket.on('connect', () => {
      refreshAttempted = false;
      changed();
    });
    socket.on(NOTIFICATION_UPDATED_EVENT, changed);
    socket.on('connect_error', (error: Error) => {
      if (error.message !== 'UNAUTHENTICATED' || refreshAttempted || !active) return;
      refreshAttempted = true;
      const rejected = sentToken;
      void apiClient.refreshAccessToken().then((token) => {
        if (!active) return;
        if (!token || token === rejected) {
          socket.disconnect();
          return;
        }
        socket.connect();
      });
    });
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') changed();
    });

    return () => {
      active = false;
      appState.remove();
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [signedIn]);

  return (
    <NotificationRevisionContext.Provider value={signedIn ? revision : 0}>
      {children}
    </NotificationRevisionContext.Provider>
  );
}

export function useNotificationRevision(): number {
  return React.useContext(NotificationRevisionContext);
}
