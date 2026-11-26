import { api, ok, renderApp, settle, signIn } from './support/harness';
import { fireEvent, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationsScreen from '../../../app/notifications';
import SettingsScreen from '../../../app/settings';
import { useTheme } from '../../theme';

const notice = (id: string, type: string, title: string, readAt: string | null = null) => ({
  id,
  type,
  title,
  body: null,
  link: null,
  readAt,
  createdAt: new Date().toISOString(),
});
const page = (rows: unknown[]) => ({ status: 200, body: { data: rows, meta: { page: 1, totalPages: 1 } } });

describe('ST-MOB-19 Notifications and theme', () => {
  it('ST-MOB-19 opens each tab, marks one and then all as read, and the unread marks update', async () => {
    await signIn();
    const all = [notice('n-1', 'COIN_RECEIVED', 'Đã hoàn 30 Coin'), notice('n-2', 'SUB_RENEWED', 'Gói Tháng đã gia hạn'), notice('n-3', 'REWARD_SPIN_WON', 'Bạn trúng 20 Coin')];
    api.on('GET /notifications', (call) => {
      const filter = call.query.get('filter.type');
      return page(filter ? all.filter((n) => filter.includes(n.type)) : all);
    });
    api.on('PATCH /notifications/n-1/read', ok({}));
    api.on('PATCH /notifications/read-all', ok({}));
    await renderApp(<NotificationsScreen />);
    await settle();

    const unread = () => screen.getAllByRole('button').filter((b) => b.props.accessibilityState?.selected === true);
    expect(screen.getByText('Đã hoàn 30 Coin')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Đã hoàn 30 Coin'));
    await settle();
    expect(api.called('PATCH /notifications/n-1/read')).toHaveLength(1);

    for (const [tab, title] of [['Coin', 'Đã hoàn 30 Coin'], ['Gói Tháng', 'Gói Tháng đã gia hạn'], ['Phim và quà', 'Bạn trúng 20 Coin']]) {
      await fireEvent.press(screen.getByRole('tab', { name: tab }));
      await settle();
      expect(screen.getByRole('tab', { name: tab })).toBeSelected();
      expect(screen.getByText(title)).toBeOnTheScreen();
    }
    expect(api.calls.filter((c) => c.path === '/notifications').map((c) => c.query.get('filter.type'))).toEqual([
      null,
      expect.stringContaining('COIN_RECEIVED'),
      expect.stringContaining('SUB_RENEWED'),
      expect.stringContaining('REWARD_SPIN_WON'),
    ]);

    await fireEvent.press(screen.getByRole('tab', { name: 'Tất cả' }));
    await settle();
    expect(unread().length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByLabelText('Đánh dấu đã đọc hết'));
    await settle();
    expect(api.called('PATCH /notifications/read-all')).toHaveLength(1);
    expect(unread()).toHaveLength(0);
    expect(screen.queryByLabelText('Đánh dấu đã đọc hết')).toBeNull();
  });

  it('ST-MOB-19 switches the theme and keeps the choice', async () => {
    const seen: { theme?: string } = {};
    function ThemeProbe() {
      seen.theme = useTheme().theme;
      return null;
    }
    await renderApp(
      <>
        <SettingsScreen />
        <ThemeProbe />
      </>,
    );
    await settle();
    expect(seen.theme).toBe('dark');
    await fireEvent.press(screen.getByText('Giao diện'));
    await settle();
    expect(seen.theme).toBe('light');
    expect(screen.getByText('Sáng')).toBeOnTheScreen();
    expect(await AsyncStorage.getItem('ai_cinema_theme_mode')).toBe('light');
  });
});
