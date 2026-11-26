import { answerDialog, api, mockRouter, ok, settle, shownDialog } from './support/harness';
import { fireEvent, screen } from '@testing-library/react-native';
import { enterRoom, room } from './support/room';

describe('ST-MOB-37 The Host picks the new Host', () => {
  it('ST-MOB-37 lists the members in the room and hands the room to the chosen one', async () => {
    await enterRoom({ asHost: true });
    api.on('GET /watch-rooms/r-1', ok(room()));
    api.on('POST /watch-rooms/r-1/leave', ok({ closed: false, newHostUserId: 'u-member' }));

    await fireEvent.press(screen.getByLabelText('Rời phòng'));
    await answerDialog('Chuyển quyền');
    await settle();
    expect(shownDialog()?.title).toBe('Chọn chủ phòng mới');
    await answerDialog('Lan Anh');
    await settle();

    expect(api.called('POST /watch-rooms/r-1/leave')[0].body).toEqual({ action: 'TRANSFER', newHostUserId: 'u-member' });
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });
});
