/** Tabs of the Member's notifications: the kinds of event each one gathers (BE `notifications.type`). */
export interface MemberNotificationTab {
  key: string;
  label: string;
  types: string[];
}

export const MEMBER_NOTIFICATION_TABS: MemberNotificationTab[] = [
  { key: 'all', label: 'Tất cả', types: [] },
  {
    key: 'wallet',
    label: 'Ví & Coin',
    types: [
      'COIN_TOPUP_SUCCESS',
      'COIN_TOPUP_FAILED',
      'COIN_SPENT',
      'COIN_RECEIVED',
      'COIN_ADJUSTED',
      'COIN_LOW_BALANCE',
      'COIN_BONUS_EXPIRING',
    ],
  },
  {
    key: 'plan',
    label: 'Gói thành viên',
    types: ['SUB_RENEWED', 'SUB_RENEWAL_FAILED', 'SUB_EXPIRING', 'SUBSCRIPTION_CANCELLED'],
  },
  { key: 'movies', label: 'Phim & thưởng', types: ['EPISODE_ACCESS_REFUNDED', 'REWARD_SPIN_WON'] },
];

/** Icon of a notification kind (Ionicons). */
export function notificationIcon(type: string): string {
  if (type === 'COIN_SPENT' || type === 'COIN_LOW_BALANCE') return 'remove-circle-outline';
  if (type.startsWith('COIN_TOPUP_FAILED')) return 'alert-circle-outline';
  if (type.startsWith('COIN')) return 'wallet-outline';
  if (type.startsWith('SUB')) return 'card-outline';
  if (type === 'REWARD_SPIN_WON') return 'gift-outline';
  return 'film-outline';
}