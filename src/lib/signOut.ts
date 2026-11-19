import { showDialog } from './dialog';

/** Asks once before signing out: the wallet and the plan stay on the account, so nothing is lost. */
export function confirmSignOut(logout: () => void, leave: () => void): void {
  showDialog('Đăng xuất?', 'Ví Coin và gói Tháng vẫn giữ nguyên, bạn đăng nhập lại là thấy.', [
    { text: 'Ở lại', style: 'cancel' },
    {
      text: 'Đăng xuất',
      style: 'destructive',
      onPress: () => {
        logout();
        leave();
      },
    },
  ]);
}
