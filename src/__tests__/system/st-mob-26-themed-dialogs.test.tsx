import { renderApp } from './support/harness';
import { act, fireEvent, screen, within } from '@testing-library/react-native';
import { Alert, Platform, View } from 'react-native';
import { showDialog } from '../../lib/dialog';

describe('ST-MOB-26 Themed dialogs', () => {
  it.each(['android', 'web'] as const)('ST-MOB-26 draws a confirmation and an error with the app dialog on %s', async (os) => {
    jest.replaceProperty(Platform, 'OS', os);
    const alert = jest.spyOn(Alert, 'alert');
    const remove = jest.fn();
    await renderApp(<View />);

    await act(() =>
      showDialog('Gỡ thiết bị?', 'Máy sẽ dừng phát ngay.', [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Gỡ thiết bị', style: 'destructive', onPress: remove },
      ]),
    );
    const confirm = screen.getByRole('alert');
    expect(within(confirm).getByText('Gỡ thiết bị?')).toBeOnTheScreen();
    await fireEvent.press(within(confirm).getByRole('button', { name: 'Gỡ thiết bị' }));
    expect(remove).toHaveBeenCalledTimes(1);

    await act(() => showDialog('Không phát được tập', 'Vui lòng thử lại.'));
    expect(within(screen.getByRole('alert')).getByRole('button', { name: 'OK' })).toBeOnTheScreen();
    await fireEvent.press(within(screen.getByRole('alert')).getByRole('button', { name: 'OK' }));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(alert).not.toHaveBeenCalled();
  });

  it('ST-MOB-26 keeps all three buttons of a three-action dialog', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    const join = jest.fn();
    const create = jest.fn();
    await renderApp(<View />);
    await act(() =>
      showDialog('Xem cùng nhóm', 'Mở phòng cho tập này hoặc vào phòng bạn bè đã tạo.', [
        { text: 'Huỷ', style: 'cancel' },
        { text: 'Nhập mã phòng', onPress: join },
        { text: 'Tạo phòng', onPress: create },
      ]),
    );
    const buttons = within(screen.getByRole('alert')).getAllByRole('button');
    expect(buttons.map((b) => b.props.accessibilityLabel ?? '')).toHaveLength(3);
    expect(within(screen.getByRole('alert')).getByText('Nhập mã phòng')).toBeOnTheScreen();
    await fireEvent.press(within(screen.getByRole('alert')).getByText('Tạo phòng'));
    expect(create).toHaveBeenCalledTimes(1);
    expect(join).not.toHaveBeenCalled();
  });
});
