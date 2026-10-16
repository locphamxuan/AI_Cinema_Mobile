import { apiClient } from './apiClient';
import { API_ROUTES } from '../constants/apiRoutes';
import { idempotencyKey } from '../lib/ids';
import type { ApiResponse } from '../types/api';
import type {
  AccessDecision,
  AutoRenewState,
  MembershipPlan,
  MySubscription,
  PurchaseResult,
  SubscriptionActivation,
  SubscriptionIntent,
  SubscriptionCycleView,
} from '../types/episodeAccess';

const once = (key: string) => ({ headers: { 'Idempotency-Key': key } });

class EpisodeAccessService {
  /** GET /episodes/:id/access - whether this Guest or Member may watch it, and if not, how. */
  checkAccess(episodeId: string): Promise<ApiResponse<AccessDecision>> {
    return apiClient.get<AccessDecision>(API_ROUTES.ACCESS.DECISION(episodeId));
  }

  /** POST /episodes/:id/purchase - unlocks one episode, main Coins first, then bonus Coins. */
  purchaseEpisode(episodeId: string, key = idempotencyKey('ep-')): Promise<ApiResponse<PurchaseResult>> {
    return apiClient.post<PurchaseResult>(API_ROUTES.ACCESS.PURCHASE(episodeId), {}, once(key));
  }

  /** GET /membership-plans - the plans on sale, the free one included. */
  getPlans(): Promise<ApiResponse<MembershipPlan[]>> {
    return apiClient.get<MembershipPlan[]>(API_ROUTES.SUBSCRIPTION.PLANS);
  }

  /** GET /subscriptions/me - the open plan, or null. */
  getMySubscription(): Promise<ApiResponse<MySubscription | null>> {
    return apiClient.get<MySubscription | null>(API_ROUTES.SUBSCRIPTION.MINE);
  }

  /** GET /subscriptions/:id/cycles - billing history, including unsuccessful renewal attempts. */
  getSubscriptionCycles(subscriptionId: string): Promise<ApiResponse<SubscriptionCycleView[]>> {
    return apiClient.get<SubscriptionCycleView[]>(API_ROUTES.SUBSCRIPTION.CYCLES(subscriptionId));
  }

  /**
   * Joining is two calls: POST /subscriptions quotes a PENDING intent, then /activate takes the
   * Coins. A wallet short of Coins answers 422 on the second call and the intent stays PENDING.
   */
  async joinPlan(planId: string, key = idempotencyKey('plan-')): Promise<ApiResponse<SubscriptionActivation>> {
    const intent = await apiClient.post<SubscriptionIntent>(API_ROUTES.SUBSCRIPTION.QUOTE, { planId }, once(`${key}:quote`));
    if (!intent.success || !intent.data) return { ...intent, data: null as unknown as SubscriptionActivation };
    return apiClient.post<SubscriptionActivation>(API_ROUTES.SUBSCRIPTION.ACTIVATE(intent.data.id), {}, once(`${key}:pay`));
  }

  /** Stops or resumes auto-renew; stopping is refused once the cancel window has closed (BR-30). */
  setAutoRenew(subscriptionId: string, on: boolean): Promise<ApiResponse<AutoRenewState>> {
    const route = on ? API_ROUTES.SUBSCRIPTION.RESUME_RENEW : API_ROUTES.SUBSCRIPTION.CANCEL_RENEW;
    return apiClient.post<AutoRenewState>(route(subscriptionId), {});
  }
}

export const episodeAccessService = new EpisodeAccessService();
