import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { AppErrorScreen } from '../components/common/AppErrorScreen';
import { onLivePlayer, replaceSafely } from '../lib/playerSafe';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const released = () => {
  throw new Error('Cannot use shared object that was already released');
};

describe('crash guards', () => {
  it('drops a call on a released player instead of throwing', () => {
    expect(() => onLivePlayer(released)).not.toThrow();
  });

  it('swallows a failed or late replace and still runs the follow-up when it works', async () => {
    const after = jest.fn();
    replaceSafely(() => Promise.resolve(), after);
    replaceSafely(() => Promise.reject(new Error('network')), released);
    replaceSafely(released as () => Promise<void>, after);
    replaceSafely(() => Promise.resolve(), released);
    await new Promise((r) => setTimeout(r, 0));
    expect(after).toHaveBeenCalledTimes(1);
  });

  it('shows a retry screen when a screen throws, and retries on tap', () => {
    const retry = jest.fn(() => Promise.resolve());
    let tree!: ReactTestRenderer;
    act(() => {
      tree = create(<AppErrorScreen retry={retry} />);
    });
    const button = tree.root.find((n) => n.props.accessibilityLabel === 'Thử lại' && typeof n.props.onPress === 'function');
    act(() => button.props.onPress());
    expect(retry).toHaveBeenCalled();
    act(() => tree.unmount());
  });
});
