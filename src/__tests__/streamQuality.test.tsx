import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type { VideoPlayer } from 'expo-video';
import { useStreamQuality } from '../hooks/useStreamQuality';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const MASTER = 'https://api.example/api/playback/s/s1/master.m3u8?s=s1&exp=9&sig=x';
// What the BE serves a 720p plan: the 1080p rendition is already stripped from the master.
const PLAN_720 = [
  '#EXTM3U',
  '#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720',
  'renditions/720p/index.m3u8?s=s1&exp=9&sig=x',
  '#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360',
  'renditions/360p/index.m3u8?s=s1&exp=9&sig=x',
].join('\n');

const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

describe('useStreamQuality (player quality menu)', () => {
  let renderer: ReactTestRenderer | undefined;
  afterEach(() => {
    act(() => renderer?.unmount());
    jest.restoreAllMocks();
  });

  function mount(quality: string, player: VideoPlayer, text = PLAN_720) {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, text: async () => text } as Response);
    const box: { current?: ReturnType<typeof useStreamQuality> } = {};
    function Probe({ q }: { q: string }) {
      box.current = useStreamQuality(player, MASTER, q);
      return null;
    }
    act(() => {
      renderer = create(<Probe q={quality} />);
    });
    return { box, rerender: (q: string) => act(() => renderer!.update(<Probe q={q} />)) };
  }

  it('offers auto plus only the renditions the plan allows, and stays on the master for auto', async () => {
    const player = { replaceAsync: jest.fn(), currentTime: 0, playing: true, play: jest.fn() } as unknown as VideoPlayer;
    const { box } = mount('auto', player);
    await flush();

    expect(box.current!.options).toEqual(['auto', '720p', '360p']);
    expect(box.current!.url).toBe(MASTER);
    expect(player.replaceAsync).not.toHaveBeenCalled();
  });

  it('switches to the chosen rendition keeping the position and the play state', async () => {
    const replaceAsync = jest.fn().mockResolvedValue(undefined);
    const player = { replaceAsync, currentTime: 42, playing: true, play: jest.fn() } as unknown as VideoPlayer;
    const { box, rerender } = mount('auto', player);
    await flush();

    rerender('360p');
    await flush();

    expect(box.current!.url).toContain('/360p/');
    expect(replaceAsync).toHaveBeenCalledWith({ uri: expect.stringContaining('/360p/') });
    expect(player.currentTime).toBe(42);
    expect(player.play).toHaveBeenCalled();
  });

  it('keeps auto only when the master cannot be read', async () => {
    const player = { replaceAsync: jest.fn() } as unknown as VideoPlayer;
    const { box } = mount('auto', player, '');
    await flush();

    expect(box.current!.options).toEqual(['auto']);
  });
});
