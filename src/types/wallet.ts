export interface WalletState {
  mainCoin: number;
  bonusCoin: number;
}

export interface CheckInDay {
  dayIndex: number; // 0-6 (Mon-Sun)
  dayLabel: string; // 'T2', 'T3', ... 'CN'
  reward: number;
  claimed: boolean;
  isToday: boolean;
}

export interface CheckInStreak {
  days: CheckInDay[];
  currentStreak: number;
  lastCheckInDate: string | null;
  todayClaimed: boolean;
}
