import { apiClient } from './apiClient';
import { API_ROUTES } from '../constants/apiRoutes';
import type { ApiResponse } from '../types/api';
import type { ChatMessage, SupportTicket } from '../types/chat';

class ChatService {
  async sendMessage(content: string): Promise<ApiResponse<ChatMessage>> {
    return apiClient.post<ChatMessage>(API_ROUTES.CHAT.SEND_MESSAGE, { message: content });
  }

  async createTicket(messages: ChatMessage[]): Promise<ApiResponse<SupportTicket>> {
    return apiClient.post<SupportTicket>(API_ROUTES.CHAT.TICKET, { messages });
  }
}

export const chatService = new ChatService();
