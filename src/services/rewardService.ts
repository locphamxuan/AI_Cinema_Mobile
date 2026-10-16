import { apiClient } from './apiClient';
import { API_ROUTES } from '../constants/apiRoutes';
import { idempotencyKey } from '../lib/ids';
import type { ApiResponse } from '../types/api';
import type { CheckInResult, DailyRewardStatus, RewardWheelStatus, SpinResult } from '../types/episodeAccess';

class RewardService {
  /** GET /daily-rewards/status - today, the streak and the Admin's ladder. */
  getDailyStatus(): Promise<ApiResponse<DailyRewardStatus>> {
    return apiClient.get<DailyRewardStatus>(API_ROUTES.REWARDS.STATUS);
  }

  /** POST /daily-rewards/check-in - once per Vietnam business day, bonus Coins only (BR-05). */
  checkIn(): Promise<ApiResponse<CheckInResult>> {
    return apiClient.post<CheckInResult>(API_ROUTES.REWARDS.CHECK_IN, {}, { headers: { 'Idempotency-Key': idempotencyKey('checkin-') } });
  }

  /** GET /rewards/spins - spins left, the prizes on the wheel, the latest results (BR-09). */
  getWheel(): Promise<ApiResponse<RewardWheelStatus>> {
    return apiClient.get<RewardWheelStatus>(API_ROUTES.REWARDS.SPINS);
  }

  /** POST /rewards/spins - uses the oldest spin; the BE draws and pays the prize. */
  spin(key = idempotencyKey('spin-')): Promise<ApiResponse<SpinResult>> {
    return apiClient.post<SpinResult>(API_ROUTES.REWARDS.SPINS, {}, { headers: { 'Idempotency-Key': key } });
  }
}

export const rewardService = new RewardService();
