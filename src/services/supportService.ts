import { apiClient } from './apiClient';
import { API_ROUTES } from '../constants/apiRoutes';
import type { ApiResponse } from '../types/api';
import type {
  SupportConversation,
  SupportConversationDetail,
  SupportMessage,
  SupportQuickReply,
  SupportSendResult,
} from '../types/support';

const S = API_ROUTES.CHAT;

type ConversationListResponse = SupportConversation[] | { conversations?: SupportConversation[]; items?: SupportConversation[] };

function getConversationList(data: ConversationListResponse): SupportConversation[] | undefined {
  if (Array.isArray(data)) return data;
  return data.conversations ?? data.items;
}

const DEFAULT_QUICK_REPLIES: SupportQuickReply[] = [
  { label: 'Nạp Coin VNPay', message: 'Làm sao để nạp Coin qua VNPay?' },
  { label: 'Mua Gói Tháng', message: 'Quyền lợi và cách đăng ký Gói Tháng?' },
  { label: 'Kho phim hiện có', message: 'Hiện nay trên AI Cinema đang có bao nhiêu phim?' },
  { label: 'Giới hạn thiết bị', message: 'Tài khoản của tôi xem được tối đa mấy thiết bị?' },
];

const WELCOME_CONTENT =
  'Xin chào! Tôi là Trợ lý AI của AI Cinema. Bạn cần hỗ trợ về kho phim, nạp Coin, Gói Tháng hay lỗi phát video?';

function makeWelcomeMessage(): SupportMessage {
  return {
    id: `msg-welcome-${Date.now()}`,
    senderType: 'AI',
    content: WELCOME_CONTENT,
    createdAt: new Date().toISOString(),
  };
}

// Local FAQ mode is used only for guests.
let localConv: SupportConversation = {
  id: 'local-ai-support',
  status: 'AI_HANDLING',
  createdAt: new Date().toISOString(),
};
let localMessages: SupportMessage[] = [makeWelcomeMessage()];

export interface SupportCatalogContext {
  movieCount?: number;
  sampleTitles?: string[];
}

export function localAiReply(content: string, context?: SupportCatalogContext): string {
  const q = content.toLowerCase();
  if (q.includes('bao nhiêu phim') || q.includes('có mấy phim') || q.includes('kho phim') || q.includes('film')) {
    if (context?.movieCount && context.movieCount > 0) {
      const titles = context.sampleTitles?.slice(0, 3).join(', ');
      return `Hiện tại hệ thống đang có ${context.movieCount} bộ phim AI đã phát hành${titles ? ` (nổi bật: ${titles})` : ''}. Bạn có thể tìm hoặc xem danh sách đầy đủ ở mục Khám phá và Trang chủ.`;
    }
    return 'Bạn có thể xem toàn bộ danh sách phim đang phát hành và bảng xếp hạng mới nhất ngay tại tab Trang chủ hoặc Khám phá.';
  }
  if (q.includes('coin') || q.includes('nạp') || q.includes('vnpay')) {
    return 'Bạn có thể nạp Coin trực tiếp tại mục Hồ sơ → Ví Coin → Nạp Coin qua cổng VNPay. Coin sẽ được cộng ngay sau khi giao dịch thành công.';
  }
  if (q.includes('gói') || q.includes('tháng') || q.includes('vip')) {
    return 'Gói Tháng cho phép bạn xem không giới hạn mọi tập phim đã phát hành trong chu kỳ hiệu lực. Bạn có thể đăng ký tại tab Gói Tháng bằng số dư Coin.';
  }
  if (q.includes('thiết bị') || q.includes('máy') || q.includes('giới hạn')) {
    return 'Bạn có thể kiểm tra và gỡ bớt thiết bị đã đăng nhập tại mục Hồ sơ → Thiết bị của tôi để tiếp tục xem phim trên máy mới.';
  }
  if (q.includes('nhân viên') || q.includes('staff') || q.includes('người')) {
    return 'Bạn có thể bấm nút "Gặp nhân viên" ở góc trên khung chat để chuyển yêu cầu này sang đội ngũ CSKH của AI Cinema.';
  }
  return 'Tôi đã ghi nhận câu hỏi của bạn. Bạn có thể hỏi về kho phim, nạp Coin VNPay, Gói Tháng, thiết bị xem phim hoặc bấm "Gặp nhân viên" để kết nối CSKH.';
}

export const supportService = {
  async startOrGetOpen(): Promise<ApiResponse<SupportConversation>> {
    const listRes = await apiClient.get<ConversationListResponse>(S.CONVERSATIONS);
    if (!listRes.success || !listRes.data) {
      return {
        success: false,
        data: null as unknown as SupportConversation,
        message: listRes.message,
        statusCode: listRes.statusCode,
        reason: listRes.reason,
      };
    }

    const conversations = getConversationList(listRes.data);
    if (!conversations) {
      return {
        success: false,
        data: null as unknown as SupportConversation,
        message: 'Dữ liệu danh sách hội thoại không hợp lệ.',
        statusCode: listRes.statusCode,
      };
    }

    const activeConversation = conversations.find((item) =>
      ['AI_HANDLING', 'WAITING_FOR_STAFF', 'STAFF_HANDLING'].includes(item.status),
    );
    if (activeConversation) return { ...listRes, data: activeConversation };

    return apiClient.post<SupportConversation>(S.CONVERSATIONS, {});
  },

  async getDetail(
    id: string,
    conversation?: SupportConversation,
  ): Promise<ApiResponse<SupportConversationDetail>> {
    if (id === localConv.id) {
      return {
        success: true,
        data: { conversation: localConv, messages: [...localMessages], quickReplies: DEFAULT_QUICK_REPLIES },
        statusCode: 200,
      };
    }

    let targetConversation = conversation;
    if (!targetConversation) {
      const conversationsRes = await apiClient.get<ConversationListResponse>(S.CONVERSATIONS);
      if (!conversationsRes.success || !conversationsRes.data) {
        return {
          success: false,
          data: null as unknown as SupportConversationDetail,
          message: conversationsRes.message,
          statusCode: conversationsRes.statusCode,
          reason: conversationsRes.reason,
        };
      }
      const conversations = getConversationList(conversationsRes.data);
      if (!conversations) {
        return {
          success: false,
          data: null as unknown as SupportConversationDetail,
          message: 'Dữ liệu danh sách hội thoại không hợp lệ.',
          statusCode: conversationsRes.statusCode,
        };
      }
      targetConversation = conversations.find((item) => item.id === id);
    }

    if (!targetConversation) {
      return {
        success: false,
        data: null as unknown as SupportConversationDetail,
        message: 'Không tìm thấy hội thoại.',
      };
    }

    const res = await apiClient.get<SupportMessage[] | { messages: SupportMessage[] }>(S.MESSAGES(id));
    if (!res.success || !res.data) return res as ApiResponse<SupportConversationDetail>;

    const messages = Array.isArray(res.data) ? res.data : res.data.messages;
    if (!Array.isArray(messages)) {
      return {
        success: false,
        data: null as unknown as SupportConversationDetail,
        message: 'Dữ liệu lịch sử trò chuyện không hợp lệ.',
      };
    }

    return {
      ...res,
      data: { conversation: targetConversation, messages, quickReplies: DEFAULT_QUICK_REPLIES },
    };
  },

  async sendMessage(
    id: string,
    content: string,
    clientMessageId?: string,
    context?: SupportCatalogContext,
  ): Promise<ApiResponse<SupportSendResult>> {
    const body = { content: content.trim(), ...(clientMessageId ? { clientMessageId } : {}) };
    if (id !== localConv.id) return apiClient.post<SupportSendResult>(S.MESSAGES(id), body);

    const memberMessage: SupportMessage = {
      id: `m-${Date.now()}`,
      senderType: 'MEMBER',
      content: body.content,
      createdAt: new Date().toISOString(),
    };
    const aiMessage: SupportMessage | null =
      localConv.status === 'AI_HANDLING'
        ? {
            id: `ai-${Date.now() + 1}`,
            senderType: 'AI',
            content: localAiReply(body.content, context),
            createdAt: new Date().toISOString(),
          }
        : null;
    localMessages = [...localMessages, memberMessage, ...(aiMessage ? [aiMessage] : [])];
    return {
      success: true,
      statusCode: 200,
      data: {
        conversation: localConv,
        memberMessage,
        aiMessage,
        systemMessage: null,
        quickReplies: DEFAULT_QUICK_REPLIES,
      },
    };
  },

  async requestStaff(id: string, note?: string): Promise<ApiResponse<SupportConversation>> {
    if (id !== localConv.id) {
      return apiClient.post<SupportConversation>(S.HANDOFF(id), note ? { note } : {});
    }
    localConv = { ...localConv, status: 'WAITING_FOR_STAFF' };
    localMessages = [
      ...localMessages,
      {
        id: `sys-${Date.now()}`,
        senderType: 'SYSTEM',
        content: 'Yêu cầu của bạn đã được chuyển sang nhân viên CSKH. Vui lòng chờ trong giây lát.',
        createdAt: new Date().toISOString(),
      },
    ];
    return { success: true, data: localConv, statusCode: 200 };
  },

  async startFresh(currentId?: string): Promise<ApiResponse<SupportConversation>> {
    if (currentId === localConv.id) {
      await this.resetLocalConversation();
      return { success: true, data: localConv, statusCode: 200 };
    }
    return apiClient.post<SupportConversation>(S.CONVERSATIONS, {});
  },

  async resetLocalConversation(): Promise<void> {
    localConv = {
      id: 'local-ai-support',
      status: 'AI_HANDLING',
      createdAt: new Date().toISOString(),
    };
    localMessages = [makeWelcomeMessage()];
  },
};
