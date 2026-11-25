import { MEMBER, answerDialog, api, ok, renderApp, settle, shownDialog, signIn } from './support/harness';
import { fireEvent, screen, within } from '@testing-library/react-native';
import FriendsScreen from '../../../app/friends';

const row = (id: string, name: string, status: string, overrides: Record<string, unknown> = {}) => ({
  id,
  senderId: 'u-other',
  receiverId: MEMBER.id,
  status,
  createdAt: '2026-11-20T00:00:00.000Z',
  friend: { id: `u-${id}`, fullName: name },
  ...overrides,
});
const rowOf = (name: string) => screen.getByText(name).parent!.parent!;

describe('ST-MOB-24 Friends', () => {
  it('ST-MOB-24 adds by email, accepts one request, declines another after confirming, blocks and unblocks', async () => {
    await signIn();
    let rows = [
      row('f-an', 'Trần An', 'PENDING', { incoming: true }),
      row('f-binh', 'Lê Bình', 'PENDING', { incoming: true }),
    ];
    api.on('GET /friends', () => ok(rows));
    api.on('POST /friends', ok(row('f-new', 'Ngọc', 'PENDING', { senderId: MEMBER.id, incoming: false }), 201));
    api.on('POST /friends/f-an/respond', () => {
      rows = [row('f-an', 'Trần An', 'ACCEPTED'), rows[1]];
      return ok(rows[0]);
    });
    api.on('POST /friends/f-binh/respond', () => {
      rows = [rows[0]];
      return ok({});
    });
    api.on('POST /friends/u-f-an/block', () => {
      rows = [row('f-an', 'Trần An', 'BLOCKED', { senderId: MEMBER.id })];
      return ok(rows[0]);
    });
    api.on('DELETE /friends/u-f-an/block', () => {
      rows = [];
      return ok(true);
    });
    await renderApp(<FriendsScreen />);
    await settle();

    // 1. Add by email: a bad address is refused on the phone, a good one sends the request.
    await fireEvent.changeText(screen.getByLabelText('Thêm bạn bằng email'), 'ngoc@');
    await fireEvent.press(screen.getByRole('button', { name: 'Gửi lời mời kết bạn' }));
    expect(api.called('POST /friends')).toHaveLength(0);
    await fireEvent.changeText(screen.getByLabelText('Thêm bạn bằng email'), 'ngoc@example.com');
    await fireEvent.press(screen.getByRole('button', { name: 'Gửi lời mời kết bạn' }));
    await settle();
    expect(api.called('POST /friends')[0].body).toEqual({ receiverEmail: 'ngoc@example.com' });
    expect(shownDialog()?.title).toBe('Đã gửi lời mời kết bạn');
    await answerDialog('OK');

    // 2. Accept.
    await fireEvent.press(within(rowOf('Trần An')).getByText('Đồng ý'));
    await settle();
    expect(api.called('POST /friends/f-an/respond')[0].body).toEqual({ accept: true });
    expect(screen.getByText('Bạn bè (1)')).toBeOnTheScreen();

    // 3. Decline asks first (declining blocks the sender on the BE).
    await fireEvent.press(within(rowOf('Lê Bình')).getByText('Từ chối'));
    expect(shownDialog()?.title).toBe('Từ chối Lê Bình?');
    expect(api.called('POST /friends/f-binh/respond')).toHaveLength(0);
    await answerDialog('Từ chối');
    await settle();
    expect(api.called('POST /friends/f-binh/respond')[0].body).toEqual({ accept: false });
    expect(screen.queryByText('Lê Bình')).toBeNull();

    // 4. Block (confirmed) and unblock.
    await fireEvent.press(within(rowOf('Trần An')).getByText('Chặn'));
    expect(shownDialog()?.title).toBe('Chặn Trần An?');
    await answerDialog('Chặn');
    await settle();
    expect(screen.getByText('Đã chặn')).toBeOnTheScreen();
    expect(screen.getByText('Bạn bè (0)')).toBeOnTheScreen();
    await fireEvent.press(within(rowOf('Trần An')).getByText('Bỏ chặn'));
    await settle();
    expect(api.called('DELETE /friends/u-f-an/block')).toHaveLength(1);
    expect(shownDialog()?.title).toBe('Đã bỏ chặn');
    expect(screen.queryByText('Đã chặn')).toBeNull();
  });
});
