import { api, doubleTap, fail, mockRouter, renderApp, settle, signIn } from './support/harness';
import { fireEvent, screen } from '@testing-library/react-native';
import JoinWatchPartyScreen from '../../../app/watch-party/join';
import { useUiStore } from '../../store';

describe('ST-MOB-34 Join a room by code', () => {
  it('ST-MOB-34 keeps only the room alphabet as XXX-XXX', async () => {
    await signIn();
    await renderApp(<JoinWatchPartyScreen />);
    await fireEvent.changeText(screen.getByLabelText('Mã phòng'), 'a0o1ib2cd9');
    expect(screen.getByLabelText('Mã phòng')).toHaveDisplayValue('AB2-CD9');
  });

  it('ST-MOB-34 sends a Guest to sign in without calling the API', async () => {
    await renderApp(<JoinWatchPartyScreen />);
    await fireEvent.changeText(screen.getByLabelText('Mã phòng'), 'AB2CD9');
    await fireEvent.press(screen.getByText('Vào phòng'));
    expect(useUiStore.getState().isAuthModalOpen).toBe(true);
    expect(useUiStore.getState().authModalMode).toBe('login');
    expect(api.called('POST /watch-rooms/join')).toHaveLength(0);
  });

  it('ST-MOB-34 sends one join for a double tap on "Vào phòng"', async () => {
    await signIn();
    api.slow('POST /watch-rooms/join', fail(404, 'Room not found'));
    await renderApp(<JoinWatchPartyScreen />);
    await fireEvent.changeText(screen.getByLabelText('Mã phòng'), 'AB2CD9');
    await doubleTap(screen.getByText('Vào phòng'));
    expect(api.called('POST /watch-rooms/join')).toHaveLength(1);
    await settle();
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(screen.getByText('Không tìm thấy phòng.')).toBeOnTheScreen();
  });
});
