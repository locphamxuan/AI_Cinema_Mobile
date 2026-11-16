import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import AccountScreen from '../../app/account';
import { profileFormErrors } from '../lib/accountForm';
import { useSessionStore } from '../store';
import type { UserProfile } from '../types/auth';

// The first render of the auth / player tree loads and transforms many modules; on a slow machine that alone can
// pass 20 s, so these render suites get a generous per-test timeout.
jest.setTimeout(90_000);

jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const member = (over: Partial<UserProfile> = {}): UserProfile => ({
  id: 'u1',
  name: 'Minh Anh',
  email: 'a@b.co',
  avatarUrl: '',
  role: 'user',
  isVIP: false,
  createdAt: '',
  ...over,
});

const valueOf = (root: ReactTestRenderer, label: string) =>
  root.root.find((n) => n.props.accessibilityLabel === label && n.props.onChangeText !== undefined).props.value;

afterEach(() => useSessionStore.setState({ isAuthenticated: false, user: null }));

describe('Account screen', () => {
  it('fills the form when the profile arrives after the screen opened, until the member types', async () => {
    useSessionStore.setState({ isAuthenticated: true, user: member({ name: '' }) });
    let root!: ReactTestRenderer;
    await act(async () => {
      root = create(<AccountScreen />);
    });
    expect(valueOf(root, 'Họ tên')).toBe('');

    await act(async () => {
      useSessionStore.setState({ user: member({ dateOfBirth: '2003-05-14', phoneNumber: '0912345678' }) });
    });
    expect(valueOf(root, 'Họ tên')).toBe('Minh Anh');
    expect(valueOf(root, 'Ngày sinh')).toBe('14/05/2003');

    const name = root.root.find((n) => n.props.accessibilityLabel === 'Họ tên' && n.props.onChangeText !== undefined);
    await act(async () => {
      name.props.onChangeText('Minh Anh Nguyễn');
    });
    await act(async () => {
      useSessionStore.setState({ user: member({ name: 'Khác', dateOfBirth: '2003-05-14' }) });
    });
    expect(valueOf(root, 'Họ tên')).toBe('Minh Anh Nguyễn');
    act(() => root.unmount());
  });

  it('lets an account without a stored birthday save its name; a stored one cannot be cleared', () => {
    const now = new Date('2026-11-16T12:00:00');
    expect(profileFormErrors({ name: 'Minh Anh', phone: '', dateOfBirth: '' }, now, null)).toEqual({});
    expect(profileFormErrors({ name: 'Minh Anh', phone: '', dateOfBirth: '' }, now, '2003-05-14').dateOfBirth).toBeDefined();
    expect(profileFormErrors({ name: 'Minh Anh', phone: '', dateOfBirth: '01/01/2015' }, now, null).dateOfBirth).toContain('18 tuổi');
  });
});
