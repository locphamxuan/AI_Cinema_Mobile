import React from 'react';
import { Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { CinemaTabBar } from '../components/navigation/CinemaTabBar';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 }) }));

const routes = ['index', 'explore', 'profile', 'vip'].map((name) => ({ key: `${name}-k`, name }));

function renderBar(index = 0, prevented = false) {
  const emitter = { emit: jest.fn(() => ({ defaultPrevented: prevented })) };
  const navigateToTab = jest.fn();
  const props = { state: { index, routes }, emitter, navigateToTab, descriptors: {}, insets: { top: 0, bottom: 20, left: 0, right: 0 } };
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(<CinemaTabBar {...(props as unknown as React.ComponentProps<typeof CinemaTabBar>)} />);
  });
  // The composite Pressable of each tab: the one carrying onPress and the role.
  const tabs = tree.root.findAll((n) => typeof n.type !== 'string' && n.props.accessibilityRole === 'tab' && !!n.props.onPress, { deep: true }).filter((n, i, all) => all.findIndex((o) => o.props.accessibilityLabel === n.props.accessibilityLabel) === i);
  const tab = (label: string) => tabs.find((t) => t.props.accessibilityLabel === label)!;
  const texts = [...new Set(tree.root.findAllByType(Text).map((t) => t.props.children))];
  return { emitter, navigateToTab, tabs, tab, texts };
}

describe('CinemaTabBar', () => {
  it('shows the three tabs, the active one with its label, and no Lịch chiếu or Gói Tháng tab', () => {
    const { tabs, texts } = renderBar(0);
    expect(tabs.map((t) => t.props.accessibilityLabel)).toEqual(['Trang chủ', 'Khám phá', 'Hồ sơ']);
    // Inactive tabs show their icon only, still named for screen readers.
    expect(texts).toEqual(['Trang chủ']);
    expect(tabs[0].props.accessibilityState).toEqual({ selected: true });
  });

  it('opens a tab on press, and leaves the active one where it is', () => {
    const { emitter, navigateToTab, tab } = renderBar(0);
    act(() => tab('Khám phá').props.onPress());
    expect(emitter.emit).toHaveBeenCalledWith({ type: 'tabPress', target: 'explore-k', canPreventDefault: true });
    expect(navigateToTab).toHaveBeenCalledWith('explore-k');
    act(() => tab('Trang chủ').props.onPress());
    expect(navigateToTab).toHaveBeenCalledTimes(1);
  });

  it('lets a screen cancel the tab press, and tints a pressed inactive tab', () => {
    const { navigateToTab, tab } = renderBar(0, true);
    act(() => tab('Hồ sơ').props.onPress());
    expect(navigateToTab).not.toHaveBeenCalled();
    const style = tab('Hồ sơ').props.style as (s: { pressed: boolean }) => unknown[];
    expect(style({ pressed: true }).filter(Boolean)).toHaveLength(2);
    expect(style({ pressed: false }).filter(Boolean)).toHaveLength(1);
  });
});

describe('TabLayout', () => {
  it('draws the custom tab bar and hides Gói Tháng from it', () => {
    jest.isolateModules(() => {
      const screens: { name: string; options: { href?: null } }[] = [];
      let bar: React.ReactElement | null = null;
      const Tabs = Object.assign(
        ({ tabBar, children }: { tabBar: (p: unknown) => React.ReactElement; children: React.ReactNode }) => {
          bar = tabBar({ state: { index: 0, routes } });
          return <>{children}</>;
        },
        { Screen: (props: { name: string; options: { href?: null } }) => (screens.push(props), null) },
      );
      jest.doMock('expo-router', () => ({ Tabs }));
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const TabLayout = (require('../../app/(tabs)/_layout') as { default: React.FC }).default;
      act(() => {
        create(<TabLayout />);
      });
      expect(((bar as React.ReactElement | null)?.type as { name?: string }).name).toBe(CinemaTabBar.name);
      expect(screens.find((s) => s.name === 'vip')?.options.href).toBeNull();
    });
  });
});
