import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type { VideoPlayer } from 'expo-video';
import { STALL_FALLBACK_MS, usePlayerHealth, type PlayerHealth } from '../hooks/usePlayerHealth';
import { NetworkOverlay } from '../components/player/NetworkOverlay';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function fakePlayer() {
  let listener: (e: { status: string }) => void = () => undefined;
  const player = {
    status: 'readyToPlay',
    currentTime: 30,
    play: jest.fn(),
    replaceAsync: jest.fn().mockResolvedValue(undefined),
    addListener: jest.fn((_: string, fn: typeof listener) => {
      listener = fn;
      return { remove: jest.fn() };
    }),
  };
  return { player: player as unknown as VideoPlayer, raw: player, emit: (status: string) => act(() => listener({ status })) };
}

describe('usePlayerHealth (weak network)', () => {
  let renderer: ReactTestRenderer | undefined;
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    act(() => renderer?.unmount());
    jest.useRealTimers();
  });

  function mount(player: VideoPlayer, quality: string, setQuality = jest.fn()) {
    const box: { current?: PlayerHealth } = {};
    function Probe() {
      box.current = usePlayerHealth(player, 'https://cdn/x/720p/index.m3u8', quality, setQuality);
      return null;
    }
    act(() => {
      renderer = create(<Probe />);
    });
    return { box, setQuality };
  }

  it('says it is loading while the player waits for data, in auto never forcing a quality', () => {
    const { player, emit } = fakePlayer();
    const { box, setQuality } = mount(player, 'auto');

    emit('loading');
    expect(box.current!.buffering).toBe(true);
    act(() => jest.advanceTimersByTime(STALL_FALLBACK_MS * 2));
    expect(setQuality).not.toHaveBeenCalled();

    emit('readyToPlay');
    expect(box.current!.buffering).toBe(false);
  });

  it('drops a fixed quality that stalls too long back to auto, so the player can step down', () => {
    const { player, emit } = fakePlayer();
    const { box, setQuality } = mount(player, '1080p');

    emit('loading');
    act(() => jest.advanceTimersByTime(STALL_FALLBACK_MS - 1));
    expect(setQuality).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(1));
    expect(setQuality).toHaveBeenCalledWith('auto');
    expect(box.current!.downgraded).toBe(true);
  });

  it('drops a fixed quality that fails to auto at once, and offers a retry when auto fails', async () => {
    const fixed = fakePlayer();
    const first = mount(fixed.player, '720p');
    fixed.emit('error');
    act(() => jest.advanceTimersByTime(0));
    expect(first.setQuality).toHaveBeenCalledWith('auto');
    expect(first.box.current!.failed).toBe(false);
    act(() => renderer?.unmount());

    const auto = fakePlayer();
    const { box } = mount(auto.player, 'auto');
    auto.emit('error');
    expect(box.current!.failed).toBe(true);
    await act(async () => {
      box.current!.retry();
      await Promise.resolve();
    });
    expect(auto.raw.replaceAsync).toHaveBeenCalledWith({ uri: 'https://cdn/x/720p/index.m3u8' });
    expect(auto.raw.currentTime).toBe(30);
    expect(auto.raw.play).toHaveBeenCalled();
  });
});

describe('NetworkOverlay', () => {
  const health = (over: Partial<PlayerHealth>): PlayerHealth => ({ buffering: false, failed: false, downgraded: false, retry: jest.fn(), ...over });

  const render = (h: PlayerHealth) => {
    let r: ReactTestRenderer | undefined;
    act(() => {
      r = create(<NetworkOverlay health={h} />);
    });
    return r!;
  };

  it('shows loading, the fallback notice, or the lost stream with Thử lại', () => {
    expect(render(health({ buffering: true })).root.findAllByProps({ testID: 'network-buffering' }).length).toBeGreaterThan(0);
    expect(JSON.stringify(render(health({ downgraded: true })).toJSON())).toContain('Tự động');
    const retry = jest.fn();
    const failed = render(health({ failed: true, retry }));
    act(() => failed.root.findByProps({ accessibilityRole: 'button' }).props.onPress());
    expect(retry).toHaveBeenCalled();
    expect(render(health({})).toJSON()).toBeNull();
  });
});
