import React from 'react';
import { notificationService } from '../services/notificationService';

const UNREAD_POLL_MS = 60_000;

/** Unread notifications of the signed-in Member, read again every minute. */
export function useUnreadNotifications(signedIn: boolean): number {
  const [unread, setUnread] = React.useState(0);
  React.useEffect(() => {
    if (!signedIn) {
      setUnread(0);
      return;
    }
    let active = true;
    const read = () => void notificationService.unreadCount().then((res) => active && res.success && setUnread(res.data?.unread ?? 0));
    read();
    const timer = setInterval(read, UNREAD_POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [signedIn]);
  return unread;
}
