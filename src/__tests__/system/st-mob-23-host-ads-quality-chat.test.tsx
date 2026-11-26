import { mockSocket } from './support/harness';
import { fireEvent, screen, within } from '@testing-library/react-native';
import { enterRoom, serverSends } from './support/room';
import { episodePlayer } from './support/watch';
import { ROOM_EVENT } from '../../lib/roomEvents';

describe('ST-MOB-23 Host ads, quality and chat', () => {
  it('ST-MOB-23 makes members wait for the Host ad, follow the Host quality, and words refused chat lines in Vietnamese', async () => {
    await enterRoom();
    const player = episodePlayer('ep-1');

    // 1. The Host reached an ad: the member sees it paused, with no skip of their own.
    await serverSends(ROOM_EVENT.AD_STATE, { active: true, title: 'Quảng cáo nước cam', durationSeconds: 15, startedAt: Date.now() });
    expect(player.pause).toHaveBeenCalled();
    expect(screen.getByText('Chờ chủ phòng bỏ qua quảng cáo')).toBeOnTheScreen();
    expect(screen.getAllByTestId('ai-label-overlay')).toHaveLength(1);
    await serverSends(ROOM_EVENT.AD_STATE, { active: false });
    expect(screen.queryByText('Chờ chủ phòng bỏ qua quảng cáo')).toBeNull();

    // 2. The Host picked 720p: members follow and cannot change it.
    await serverSends(ROOM_EVENT.QUALITY_CHANGED, { quality: '720p' });
    await fireEvent.press(screen.getByLabelText('Phụ đề và chất lượng'));
    expect(within(screen.getByTestId('player-settings-sheet')).getByText('Theo chủ phòng: 720p')).toBeOnTheScreen();

    // 3. Chat: a line goes to the room; the box holds at most 300 characters; refusals are in Vietnamese.
    const box = screen.getByLabelText('Tin nhắn trong phòng');
    expect(box.props.maxLength).toBe(300);
    await fireEvent.changeText(box, '  Chào cả nhà  ');
    await fireEvent.press(screen.getByLabelText('Gửi tin nhắn'));
    expect(mockSocket.sent(ROOM_EVENT.CHAT)).toEqual([{ roomId: 'r-1', text: 'Chào cả nhà' }]);

    await serverSends(ROOM_EVENT.CHAT_REJECTED, { reason: 'TOO_LONG' });
    expect(screen.getByText('Tin nhắn dài quá (tối đa 300 ký tự).')).toBeOnTheScreen();
    await serverSends(ROOM_EVENT.CHAT_REJECTED, { reason: 'RATE_LIMITED' });
    expect(screen.getByText('Bạn gửi nhanh quá, đợi vài giây nhé.')).toBeOnTheScreen();
    await serverSends(ROOM_EVENT.CHAT_MESSAGE, { id: 'c-1', userId: 'u-host', fullName: 'Chủ phòng', text: 'Xem tiếp nhé', sentAt: Date.now() });
    expect(screen.getByText('Xem tiếp nhé')).toBeOnTheScreen();
  });
});
