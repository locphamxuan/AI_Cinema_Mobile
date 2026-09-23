import { apiClient } from './apiClient';
import { API_ROUTES } from '../constants/apiRoutes';
import { mockInitialMessages, botResponses } from '../mocks/mockData';
import type { ApiResponse } from '../types/api';
import type { ChatMessage } from '../types/chat';

class ChatService {
  async sendMessage(content: string): Promise<ApiResponse<ChatMessage>> {
    return apiClient.post<ChatMessage>(
      API_ROUTES.CHAT.SEND_MESSAGE,
      { message: content },
      undefined,
      async () => {
        let reply = botResponses.default;
        const lower = content.toLowerCase();

        if (lower.includes('vip') || lower.includes('gói')) {
          reply = botResponses.vip;
        } else if (lower.includes('coin') || lower.includes('nạp') || lower.includes('tiền')) {
          reply = botResponses.coin;
        } else if (lower.includes('lỗi') || lower.includes('lag') || lower.includes('không xem')) {
          reply = botResponses.error;
        }

        return {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          content: reply,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };
      }
    );
  }

  async getHistory(): Promise<ApiResponse<ChatMessage[]>> {
    return apiClient.get<ChatMessage[]>(
      API_ROUTES.CHAT.HISTORY,
      undefined,
      async () => mockInitialMessages
    );
  }
}

export const chatService = new ChatService();
