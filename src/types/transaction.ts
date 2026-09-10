export type TransactionType = 'deposit' | 'checkin' | 'episode_purchase' | 'subscription' | 'refund';
export type TransactionStatus = 'success' | 'pending' | 'failed' | 'review';

export interface Transaction {
  id: string;
  type: TransactionType;
  typeLabel: string;
  description: string;
  mainCoinDelta: number;
  bonusCoinDelta: number;
  totalAmount: number;
  status: TransactionStatus;
  statusLabel: string;
  createdAt: string;
  episodeInfo?: string;
}
