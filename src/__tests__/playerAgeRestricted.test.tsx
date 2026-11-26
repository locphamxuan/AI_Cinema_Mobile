/** POST /playback/sessions refuses a T18 episode (403 AGE_RESTRICTED) to a Guest and to a member under 18 or without a birthday. */
import { MEMBER, accountRoutes, answerDialog, api, fail, mockRoute, mockRouter, ok, renderApp, settle, shownDialog, signIn } from './system/support/harness';
import { fireEvent, screen } from '@testing-library/react-native';
import { granted, movieRoutes } from './system/support/fixtures';
import WatchScreen from '../../app/watch/[id]';
import { useUiStore } from '../store';

const refusal = fail(403, 'This episode is for viewers aged 18 or older', 'AGE_RESTRICTED');

async function pressPlay() {
  movieRoutes();
  api.on('GET /episodes/ep-1/access', ok(granted('ep-1')));
  api.on('POST /playback/sessions', refusal);
  mockRoute.params = { id: 'm-1', episodeId: 'ep-1' };
  await renderApp(<WatchScreen />);
  await settle();
  await fireEvent.press(screen.getByLabelText('Phát tập'));
  await settle();
}

describe('T18 episode refused by the player (AGE_RESTRICTED)', () => {
  it('asks a Guest to sign in with an adult account', async () => {
    await pressPlay();
    expect(shownDialog()).toMatchObject({ title: 'Tập dành cho người từ 18 tuổi', message: 'Đăng nhập bằng tài khoản đủ 18 tuổi để xem tập này.' });
    await answerDialog('Đăng nhập');
    expect(useUiStore.getState()).toMatchObject({ isAuthModalOpen: true, authModalMode: 'login' });
  });

  it('points a Google member without a birthday to the Account screen', async () => {
    await signIn({ ...MEMBER, dateOfBirth: null });
    accountRoutes();
    api.on('GET /playback/history', ok([]));
    await pressPlay();
    expect(shownDialog()?.message).toBe('Tài khoản chưa có ngày sinh. Thêm ngày sinh ở mục Tài khoản để xem tập này.');
    await answerDialog('Cập nhật ngày sinh');
    expect(mockRouter.push).toHaveBeenCalledWith('/account');
  });

  it('tells a member under 18 plainly', async () => {
    await signIn({ ...MEMBER, dateOfBirth: '2012-01-01' });
    accountRoutes();
    api.on('GET /playback/history', ok([]));
    await pressPlay();
    expect(shownDialog()?.message).toBe('Tài khoản của bạn chưa đủ 18 tuổi nên chưa xem được tập này.');
    expect(screen.queryByTestId('player-inline')).toBeNull();
  });
});
