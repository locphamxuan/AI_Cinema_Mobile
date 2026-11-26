/** Double taps and Android back on the screens fixed on 2026-11-24: one request per burst, no screen popped twice. */
import { answerDialog, api, doubleTap, mockRoute, mockRouter, ok, renderApp, settle, shownDialog } from './system/support/harness';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { granted, movieRoutes } from './system/support/fixtures';
import { enterRoom, room } from './system/support/room';
import MovieDetailScreen from '../../app/movie/[id]';
import SearchScreen from '../../app/search';

describe('episode gate', () => {
  it('asks the BE once for a double tap on an episode, so only one stream opens', async () => {
    movieRoutes();
    api.slow('GET /episodes/ep-1/access', ok(granted('ep-1')));
    mockRoute.params = { id: 'm-1' };
    await renderApp(<MovieDetailScreen />);
    await settle();
    await doubleTap(screen.getByLabelText('Tập 1'));
    await settle();
    expect(api.called('GET /episodes/ep-1/access')).toHaveLength(1);
    expect(mockRouter.push).toHaveBeenCalledTimes(1);
  });
});

describe('leaving a watch room', () => {
  it('sends one leave and goes back once for a double tap on "Rời phòng"', async () => {
    await enterRoom();
    api.slow('POST /watch-rooms/r-1/leave', ok({ closed: false, newHostUserId: null }));
    await doubleTap(screen.getByLabelText('Rời phòng'));
    await act(() => new Promise((resolve) => setTimeout(resolve, 80)));
    expect(api.called('POST /watch-rooms/r-1/leave')).toHaveLength(1);
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  it('leaves the room the same way on Android back; a Host chooses to hand over or disband first', async () => {
    const handlers: (() => boolean)[] = [];
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
      handlers.push(handler as () => boolean);
      return { remove: jest.fn() };
    });
    await enterRoom({ asHost: true });
    api.on('GET /watch-rooms/r-1', ok(room()));
    api.on('POST /watch-rooms/r-1/leave', ok({ closed: false, newHostUserId: 'u-member' }));

    let handled = false;
    await act(() => {
      handled = handlers[handlers.length - 1]();
    });
    expect(handled).toBe(true);
    expect(shownDialog()?.title).toBe('Rời phòng');
    expect(mockRouter.back).not.toHaveBeenCalled();
    await answerDialog('Chuyển quyền');
    await settle();
    expect(shownDialog()?.title).toBe('Chọn chủ phòng mới');
    await answerDialog('Lan Anh');
    await settle();
    expect(api.called('POST /watch-rooms/r-1/leave')[0].body).toEqual({
      action: 'TRANSFER',
      newHostUserId: 'u-member',
    });
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });
});

describe('search history', () => {
  it('drops a damaged saved history instead of breaking the screen', async () => {
    await AsyncStorage.setItem('ai_cinema_recent_searches', JSON.stringify({ not: 'a list' }));
    await renderApp(<SearchScreen />);
    await settle();
    expect(screen.queryByText('Đã tìm gần đây')).toBeNull();
    // Saving a new search on top of the damaged value used to throw (it is not a list).
    api.on('GET /movies', ok([]));
    await fireEvent.changeText(screen.getByPlaceholderText('Tên phim'), 'gió');
    await fireEvent(screen.getByPlaceholderText('Tên phim'), 'submitEditing');
    await fireEvent.changeText(screen.getByPlaceholderText('Tên phim'), '');
    expect(screen.getByText('gió')).toBeOnTheScreen();

    await AsyncStorage.setItem('ai_cinema_recent_searches', JSON.stringify(['bếp', 7, null]));
    await screen.unmount();
    await renderApp(<SearchScreen />);
    await settle();
    expect(screen.getByText('bếp')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Xóa lịch sử tìm kiếm'));
    expect(screen.queryByText('bếp')).toBeNull();
  });
});
