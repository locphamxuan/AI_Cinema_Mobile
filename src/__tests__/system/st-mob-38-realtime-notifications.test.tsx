import { api, mockSocket, page, renderApp, settle, signIn } from './support/harness';
import { act } from '@testing-library/react-native';
import NotificationsScreen from '../../../app/notifications';
import { NotificationRealtimeProvider } from '../../components/notifications/NotificationRealtimeProvider';
import { NOTIFICATION_UPDATED_EVENT } from '../../lib/notificationEvents';

describe('ST-MOB-38 Notifications arrive in real time', () => {
  it('ST-MOB-38 reads the list again as soon as the server announces a change', async () => {
    await signIn();
    api.on('GET /notifications', page([]));
    await renderApp(
      <NotificationRealtimeProvider>
        <NotificationsScreen />
      </NotificationRealtimeProvider>,
    );
    await settle();
    const before = api.called('GET /notifications').length;

    await act(() => mockSocket.serverEmit(NOTIFICATION_UPDATED_EVENT));
    await settle();

    expect(api.called('GET /notifications').length).toBeGreaterThan(before);
  });
});
