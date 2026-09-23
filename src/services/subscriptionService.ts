import { apiClient } from './apiClient';
import { API_ROUTES } from '../constants/apiRoutes';
import { mockSubscriptionVIP, subscriptionPlans } from '../mocks/mockData';
import type { ApiResponse } from '../types/api';
import type { UserSubscription, SubscriptionPlan } from '../types/subscription';

class SubscriptionService {
  async getCurrentSubscription(): Promise<ApiResponse<UserSubscription>> {
    return apiClient.get<UserSubscription>(
      API_ROUTES.SUBSCRIPTION.CURRENT,
      undefined,
      async () => mockSubscriptionVIP
    );
  }

  async getPlans(): Promise<ApiResponse<SubscriptionPlan[]>> {
    return apiClient.get<SubscriptionPlan[]>(
      API_ROUTES.SUBSCRIPTION.PLANS,
      undefined,
      async () => subscriptionPlans
    );
  }

  async subscribe(planId: string, paymentMethod = 'Thẻ Visa ****4242'): Promise<ApiResponse<UserSubscription>> {
    return apiClient.post<UserSubscription>(
      API_ROUTES.SUBSCRIPTION.SUBSCRIBE,
      { planId, paymentMethod },
      undefined,
      async () => {
        const plan = subscriptionPlans.find((p) => p.id === planId) || subscriptionPlans[1];
        const now = new Date();
        const end = new Date();
        end.setDate(now.getDate() + 30);

        return {
          plan,
          status: 'active',
          startDate: now.toISOString(),
          endDate: end.toISOString(),
          autoRenew: true,
          paymentMethod,
        };
      }
    );
  }

  async cancelSubscription(): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.post<{ success: boolean }>(
      API_ROUTES.SUBSCRIPTION.CANCEL,
      {},
      undefined,
      async () => ({ success: true })
    );
  }

  async toggleAutoRenew(currentValue: boolean): Promise<ApiResponse<{ autoRenew: boolean }>> {
    return apiClient.post<{ autoRenew: boolean }>(
      API_ROUTES.SUBSCRIPTION.TOGGLE_AUTO_RENEW,
      { autoRenew: !currentValue },
      undefined,
      async () => ({ autoRenew: !currentValue })
    );
  }
}

export const subscriptionService = new SubscriptionService();
