export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: 'user' | 'vip';
  isVIP: boolean;
  vipExpiresAt?: string;
  createdAt: string;
}
