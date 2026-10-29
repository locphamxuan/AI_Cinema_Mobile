import { apiClient } from './apiClient';
import { API_ROUTES } from '../constants/apiRoutes';
import type { ApiResponse } from '../types/api';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPage {
  data: AppNotification[];
  meta: { totalItems: number; currentPage: number; totalPages: number };
}

/** The bell of the app: only the signed-in account's own notifications. */
export const notificationService = {
  list(types: string[], page = 1, limit = 20): Promise<ApiResponse<NotificationPage>> {
    return apiClient.get<NotificationPage>(API_ROUTES.NOTIFICATIONS.LIST, {
      params: { page, limit, ...(types.length ? { 'filter.type': `$in:${types.join(',')}` } : {}) },
      // The screen pages on, so it needs `meta` as well as the rows.
      keepEnvelope: true,
    });
  },
  unreadCount: () => apiClient.get<{ unread: number }>(API_ROUTES.NOTIFICATIONS.UNREAD_COUNT),
  markRead: (id: string) => apiClient.patch<unknown>(API_ROUTES.NOTIFICATIONS.READ(id)),
  markAllRead: () => apiClient.patch<unknown>(API_ROUTES.NOTIFICATIONS.READ_ALL),
};