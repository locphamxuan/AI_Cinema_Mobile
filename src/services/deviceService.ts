import { apiClient } from './apiClient';
import { API_ROUTES } from '../constants/apiRoutes';
import { deviceKey } from '../lib/device';
import type { ApiResponse } from '../types/api';
import type { DeviceOverview } from '../types/device';

const { DEVICES } = API_ROUTES;

/** MF-4: the member's registered devices and live streams, and the actions that free a slot. */
export const deviceService = {
  /** X-Device-Id lets the BE flag this install as the current device. */
  async overview(): Promise<ApiResponse<DeviceOverview>> {
    return apiClient.get<DeviceOverview>(DEVICES.LIST, { headers: { 'X-Device-Id': await deviceKey() } });
  },
  /** Also ends what that device is playing; it registers again on its next play. */
  remove: (deviceId: string) => apiClient.delete<null>(DEVICES.REMOVE(deviceId)),
  endStream: (sessionId: string) => apiClient.post<null>(DEVICES.END_SESSION(sessionId)),
};
