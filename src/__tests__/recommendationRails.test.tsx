import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { useHomeRecommendations } from '../hooks/useHomeRecommendations';
import { useAfterWatching } from '../hooks/useAfterWatching';
import { recommendationService } from '../services/recommendationService';
import type { ApiResponse } from '../types/api';
import type { Movie } from '../types/movie';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void) => jest.requireActual('react').useEffect(effect, [effect]),
}));

const ok = (ids: string[]): ApiResponse<Movie[]> => ({
  success: true,
  statusCode: 200,
  data: ids.map((id) => ({ id, title: id, recommendReason: `vì ${id}` }) as Movie),
});
const failed: ApiResponse<Movie[]> = { success: false, statusCode: 0, data: [], message: 'Không có mạng' };
const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

/** Renders a hook with props that can change, and reads its latest value. */
function renderHook<P, R>(useHook: (props: P) => R, initial: P) {
  const box: { current?: R } = {};
  function Probe(props: { value: P }) {
    const value = useHook(props.value);
    React.useEffect(() => {
      box.current = value;
    });
    return null;
  }
  let root!: ReactTestRenderer;
  act(() => {
    root = create(<Probe value={initial} />);
  });
  return {
    get current() {
      return box.current as R;
    },
    rerender: (next: P) => act(() => root.update(<Probe value={next} />)),
  };
}

afterEach(() => jest.restoreAllMocks());

describe('useHomeRecommendations', () => {
  it('gives a Guest the BE trending list, never a list built on the phone', async () => {
    const trending = jest.spyOn(recommendationService, 'trending').mockResolvedValue(ok(['t1']));
    const forYou = jest.spyOn(recommendationService, 'forYou');
    const hook = renderHook(({ signedIn, id }) => useHomeRecommendations(signedIn, id), { signedIn: false, id: undefined as string | undefined });
    await flush();
    expect(trending).toHaveBeenCalled();
    expect(forYou).not.toHaveBeenCalled();
    expect(hook.current.movies.map((m) => m.id)).toEqual(['t1']);
  });

  it("drops the previous account's picks at once when another member signs in", async () => {
    const forYou = jest.spyOn(recommendationService, 'forYou').mockResolvedValueOnce(ok(['a1']));
    const hook = renderHook(({ signedIn, id }) => useHomeRecommendations(signedIn, id), { signedIn: true, id: 'A' as string | undefined });
    await flush();
    expect(hook.current.movies.map((m) => m.id)).toEqual(['a1']);

    let answer!: (value: ApiResponse<Movie[]>) => void;
    forYou.mockReturnValueOnce(new Promise((resolve) => (answer = resolve)));
    hook.rerender({ signedIn: true, id: 'B' });
    expect(hook.current.movies).toEqual([]);
    await act(async () => answer(ok(['b1'])));
    expect(hook.current.movies.map((m) => m.id)).toEqual(['b1']);
  });

  it('shows the failure with a retry instead of an empty or guessed list', async () => {
    const forYou = jest.spyOn(recommendationService, 'forYou').mockResolvedValueOnce(failed);
    const hook = renderHook(({ signedIn, id }) => useHomeRecommendations(signedIn, id), { signedIn: true, id: 'A' as string | undefined });
    await flush();
    expect(hook.current.error).toBe('Không có mạng');
    expect(hook.current.movies).toEqual([]);

    forYou.mockResolvedValueOnce(ok(['m1']));
    await act(async () => {
      await hook.current.reload();
    });
    expect(hook.current.error).toBeNull();
    expect(hook.current.movies.map((m) => m.id)).toEqual(['m1']);
  });
});

describe('useAfterWatching', () => {
  it('asks once per finished episode and clears when another episode plays', async () => {
    const after = jest.spyOn(recommendationService, 'afterWatching').mockResolvedValue(ok(['x']));
    const hook = renderHook(({ episodeId }) => useAfterWatching('movie-1', episodeId), { episodeId: 'ep-last' });
    act(() => hook.current.load());
    act(() => hook.current.load());
    await flush();
    expect(after).toHaveBeenCalledTimes(1);
    expect(after).toHaveBeenCalledWith('movie-1');
    expect(hook.current.movies.map((m) => m.id)).toEqual(['x']);

    hook.rerender({ episodeId: 'ep-other' });
    expect(hook.current.movies).toEqual([]);
  });

  it('reports a failed read and retries on demand', async () => {
    const after = jest.spyOn(recommendationService, 'afterWatching').mockResolvedValueOnce(failed);
    const hook = renderHook(() => useAfterWatching('movie-1', 'ep-last'), {});
    act(() => hook.current.load());
    await flush();
    expect(hook.current.error).toBe('Không có mạng');

    after.mockResolvedValueOnce(ok(['y']));
    act(() => hook.current.retry());
    await flush();
    expect(hook.current.error).toBeNull();
    expect(hook.current.movies.map((m) => m.id)).toEqual(['y']);
  });
});
