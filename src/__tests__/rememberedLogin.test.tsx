import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TextInput } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import RootLayout from '../../app/_layout';
import { AuthModal } from '../components/auth/AuthModal';
import { Button } from '../components/common/Button';
import { purgeLegacyCredentials, readRememberedEmail, rememberEmail } from '../lib/rememberedLogin';
import { STORAGE_KEYS } from '../lib/storage';
import { useAppStore } from '../store/useAppStore';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('../components/auth/GoogleSignInSection', () => ({ GoogleSignInSection: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: unknown }) => children,
}));
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: async () => undefined,
  hideAsync: async () => undefined,
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  Stack: Object.assign(() => null, { Screen: () => null }),
}));
jest.mock('../components/wallet/CheckInModal', () => ({ CheckInModal: () => null }));
jest.mock('../components/wallet/TopUpModal', () => ({ TopUpModal: () => null }));
jest.mock('../components/wallet/RewardSpinModal', () => ({ RewardSpinModal: () => null }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const LEGACY_PASSWORD = 'ai_cinema_remembered_password';
const LEGACY_FLAG = 'ai_cinema_remember_me';
const PASSWORD = 'Secret-pass-123';

const settle = () =>
  act(async () => {
    for (let i = 0; i < 5; i += 1) await Promise.resolve();
  });

const closed = { isAuthModalOpen: false, authModalMode: 'login' as const, initialAuthEmail: '' };

async function openModal() {
  let root!: ReactTestRenderer;
  act(() => {
    useAppStore.setState({ ...closed, isAuthModalOpen: true });
    root = create(<AuthModal />);
  });
  await settle();
  return root;
}

const inputs = (root: ReactTestRenderer) => root.root.findAllByType(TextInput);
const emailField = (root: ReactTestRenderer) => inputs(root).find((i) => i.props.keyboardType === 'email-address')!;
const passwordField = (root: ReactTestRenderer) => inputs(root).find((i) => i.props.secureTextEntry !== undefined)!;

async function signIn(root: ReactTestRenderer, email: string) {
  act(() => emailField(root).props.onChangeText(email));
  act(() => passwordField(root).props.onChangeText(PASSWORD));
  await act(async () => {
    await root.root.findByType(Button).props.onPress();
  });
  await settle();
}

const storedValues = async () => {
  const keys = await AsyncStorage.getAllKeys();
  return (await AsyncStorage.multiGet(keys)).map(([, value]) => value);
};

beforeEach(async () => {
  await AsyncStorage.clear();
  act(() => {
    useAppStore.setState({ ...closed, login: jest.fn(async () => ({ success: true })) });
  });
});

afterEach(() => jest.restoreAllMocks());

describe('remembered login', () => {
  it('keeps the email and never writes the password', async () => {
    const setItem = jest.spyOn(AsyncStorage, 'setItem');
    const root = await openModal();

    await signIn(root, ' viewer@example.com ');

    expect(useAppStore.getState().login).toHaveBeenCalledWith(' viewer@example.com ', PASSWORD);
    expect(await readRememberedEmail()).toBe('viewer@example.com');
    expect(setItem.mock.calls.map(([, value]) => value)).not.toContain(PASSWORD);
    expect(await storedValues()).not.toContain(PASSWORD);
    expect(await AsyncStorage.getItem(LEGACY_PASSWORD)).toBeNull();
    act(() => root.unmount());
  });

  it('fills in the remembered email and leaves the password empty', async () => {
    await rememberEmail('viewer@example.com');
    await AsyncStorage.setItem(LEGACY_PASSWORD, PASSWORD);

    const root = await openModal();

    expect(emailField(root).props.value).toBe('viewer@example.com');
    expect(passwordField(root).props.value).toBe('');
    act(() => root.unmount());
  });

  it('removes the password an older version saved when the app starts', async () => {
    await AsyncStorage.multiSet([
      [LEGACY_PASSWORD, PASSWORD],
      [LEGACY_FLAG, 'true'],
      [STORAGE_KEYS.REMEMBERED_EMAIL, 'viewer@example.com'],
    ]);

    let root!: ReactTestRenderer;
    act(() => {
      root = create(<RootLayout />);
    });
    await settle();

    expect(await AsyncStorage.getItem(LEGACY_PASSWORD)).toBeNull();
    expect(await AsyncStorage.getItem(LEGACY_FLAG)).toBeNull();
    expect(await readRememberedEmail()).toBe('viewer@example.com');
    act(() => root.unmount());
  });

  it('does not throw when the old key cannot be removed', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValue(new Error('disk error'));

    await expect(purgeLegacyCredentials()).resolves.toBeUndefined();
  });
});
