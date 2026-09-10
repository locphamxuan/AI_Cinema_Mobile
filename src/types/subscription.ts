export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'none';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: number; // days
  features: string[];
  popular?: boolean;
}

export interface UserSubscription {
  plan: SubscriptionPlan | null;
  status: SubscriptionStatus;
  startDate: string | null;
  endDate: string | null;
  autoRenew: boolean;
  paymentMethod: string;
}
