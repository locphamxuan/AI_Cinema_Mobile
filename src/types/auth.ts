export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  /** `YYYY-MM-DD` (BR-54); editable on the Account screen. */
  dateOfBirth?: string | null;
  phoneNumber?: string | null;
  role: 'user' | 'vip';
  isVIP: boolean;
  vipExpiresAt?: string;
  createdAt: string;
}
