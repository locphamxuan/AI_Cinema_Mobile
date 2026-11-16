import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { AppDialog } from '../components/common/AppDialog';
import { showDialog } from '../lib/dialog';
import { useDialogStore } from '../store/dialogStore';

const labels = (tree: ReactTestRenderer) =>
  tree.root.findAllByType(TouchableOpacity).map((button) => button.findByType(Text).props.children as string);
const tap = (tree: ReactTestRenderer, label: string) =>
  act(() => {
    tree.root
      .findAllByType(TouchableOpacity)
      .find((button) => button.findByType(Text).props.children === label)!
      .props.onPress();
  });

describe('AppDialog (themed dialog instead of the system alert)', () => {
  beforeEach(() => useDialogStore.setState({ queue: [] }));

  it('draws nothing until a dialog is asked for', () => {
    let tree!: ReactTestRenderer;
    act(() => {
      tree = create(<AppDialog />);
    });
    expect(tree.toJSON()).toBeNull();
  });

  it('shows the title, the message and every button, and runs the one pressed', () => {
    const create3 = jest.fn();
    const join = jest.fn();
    let tree!: ReactTestRenderer;
    act(() => {
      tree = create(<AppDialog />);
      showDialog('Xem cùng nhóm', 'Mở phòng hoặc vào phòng bạn bè.', [
        { text: 'Huỷ', style: 'cancel' },
        { text: 'Nhập mã phòng', onPress: join },
        { text: 'Tạo phòng', onPress: create3 },
      ]);
    });
    const texts = tree.root.findAllByType(Text).map((t) => t.props.children as string);
    expect(texts).toEqual(expect.arrayContaining(['Xem cùng nhóm', 'Mở phòng hoặc vào phòng bạn bè.']));
    // Three buttons stack with cancel last; none is lost (the web confirm could hold only two).
    expect(labels(tree)).toEqual(['Nhập mã phòng', 'Tạo phòng', 'Huỷ']);
    tap(tree, 'Tạo phòng');
    expect(create3).toHaveBeenCalledTimes(1);
    expect(join).not.toHaveBeenCalled();
    expect(useDialogStore.getState().queue).toHaveLength(0);
  });

  it('puts cancel on the left of a two-button dialog and shows queued dialogs one after another', () => {
    let tree!: ReactTestRenderer;
    act(() => {
      tree = create(<AppDialog />);
      showDialog('Rời phòng', 'Chắc chưa?', [
        { text: 'Rời', style: 'destructive' },
        { text: 'Ở lại', style: 'cancel' },
      ]);
      showDialog('Đã gửi lời mời');
    });
    expect(labels(tree)).toEqual(['Ở lại', 'Rời']);
    tap(tree, 'Ở lại');
    expect(labels(tree)).toEqual(['OK']);
  });

  it('closes on the back button or a tap outside only when it can be cancelled, running cancel', () => {
    const cancel = jest.fn();
    act(() => {
      showDialog('A', undefined, [{ text: 'Thôi', style: 'cancel', onPress: cancel }, { text: 'Làm' }]);
      showDialog('B', undefined, [{ text: 'Chọn 1' }, { text: 'Chọn 2' }]);
    });
    expect(useDialogStore.getState().queue.map((d) => d.cancelable)).toEqual([true, false]);
    act(() => useDialogStore.getState().press(useDialogStore.getState().queue[0].buttons[0]));
    expect(cancel).toHaveBeenCalled();
  });
});
