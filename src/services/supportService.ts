import { apiClient } from './apiClient';
import { API_ROUTES } from '../constants/apiRoutes';
import type { ApiResponse } from '../types/api';
import type {
  SupportConversation,
  SupportConversationDetail,
  SupportMessage,
  SupportQuickReply,
  SupportSendResult,
  SupportSenderType,
} from '../types/support';

const S = API_ROUTES.CHAT;

/** Kept for the chat screen's signature; the real assistant reads the catalog itself through its tools. */
export interface SupportCatalogContext {
  movieCount?: number;
  sampleTitles?: string[];
}

/** Suggested first questions, all inside the assistant's scope (BE docs/support-ai-member-scope.md). */
export const DEFAULT_QUICK_REPLIES: SupportQuickReply[] = [
  { label: 'Số dư Coin', message: 'Tôi còn bao nhiêu Coin chính và Coin thưởng?' },
  { label: 'Phim nhiều lượt xem', message: 'Phim nào đang có nhiều lượt xem nhất?' },
  { label: 'Gói Tháng', message: 'Gói Tháng của tôi khi nào gia hạn và hủy trước bao lâu?' },
  { label: 'Phim nên xem', message: 'Tôi nên xem phim gì tiếp theo?' },
];

/** The BE answers with action codes; the chat shows them as labelled chips that trigger the action. */
export const QUICK_ACTION = { REQUEST_STAFF: '__REQUEST_STAFF__', CONFIRM_RESOLVED: '__CONFIRM_RESOLVED__' } as const;
const ACTION_CHIPS: Record<string, SupportQuickReply> = {
  REQUEST_STAFF: { label: 'Gặp nhân viên', message: QUICK_ACTION.REQUEST_STAFF },
  CONFIRM_RESOLVED: { label: 'Đã giải quyết', message: QUICK_ACTION.CONFIRM_RESOLVED },
};
function toChips(replies: unknown[] | undefined): SupportQuickReply[] {
  return (replies ?? []).flatMap((reply) =>
    typeof reply === 'string' ? (ACTION_CHIPS[reply] ? [ACTION_CHIPS[reply]] : []) : [reply as SupportQuickReply],
  );
}

type BeSender = SupportSenderType | 'AI_CHATBOT' | 'SUPPORT_AGENT';
type BeMessage = Omit<SupportMessage, 'senderType'> & { senderType: BeSender; isInternal?: boolean };

/** The BE names its senders AI_CHATBOT / SUPPORT_AGENT; the chat screen speaks AI / STAFF. */
function normalize(message: BeMessage): SupportMessage {
  const senderType: SupportSenderType =
    message.senderType === 'AI_CHATBOT' ? 'AI' : message.senderType === 'SUPPORT_AGENT' ? 'STAFF' : message.senderType;
  return { id: message.id, content: message.content, createdAt: message.createdAt, senderType };
}

const visible = (messages: BeMessage[] | undefined) =>
  (messages ?? []).filter((m) => !m.isInternal).map(normalize);

/**
 * AI Customer Support on the BE (BR-22, BR-71): Gemini answers from the knowledge base and the member's own data,
 * "Gặp nhân viên" hands the case over to Staff with an AI summary. No local or canned answers: a guest is asked to
 * sign in (the BE allows the chat to Members only).
 */
export const supportService = {
  /** The member's open case, or a new one (the BE reuses an open case). */
  startOrGetOpen(): Promise<ApiResponse<SupportConversation>> {
    return apiClient.post<SupportConversation>(S.CONVERSATIONS, {});
  },

  async getDetail(id: string, fallback?: SupportConversation): Promise<ApiResponse<SupportConversationDetail>> {
    const res = await apiClient.get<{ conversation: SupportConversation; messages?: BeMessage[] }>(S.DETAIL(id));
    if (!res.success || !res.data) return { ...res, data: undefined as unknown as SupportConversationDetail };
    void apiClient.post(S.READ(id), {});
    return {
      ...res,
      data: {
        conversation: res.data.conversation ?? fallback,
        messages: visible(res.data.messages),
        quickReplies: DEFAULT_QUICK_REPLIES,
      },
    };
  },

  async sendMessage(
    id: string,
    content: string,
    clientMessageId?: string,
    _context?: SupportCatalogContext,
  ): Promise<ApiResponse<SupportSendResult>> {
    const res = await apiClient.post<SupportSendResult & { memberMessage: BeMessage; aiMessage: BeMessage | null; systemMessage: BeMessage | null }>(
      S.MESSAGES(id),
      { content, clientMessageId },
    );
    if (!res.success || !res.data) return res as ApiResponse<SupportSendResult>;
    const d = res.data;
    return {
      ...res,
      data: {
        conversation: d.conversation,
        memberMessage: normalize(d.memberMessage),
        aiMessage: d.aiMessage ? normalize(d.aiMessage) : null,
        systemMessage: d.systemMessage ? normalize(d.systemMessage) : null,
        quickReplies: toChips(d.quickReplies as unknown[]),
      },
    };
  },

  /** "Gặp nhân viên": Staff takes over; the AI writes the hand-off summary for them. */
  async requestStaff(id: string, note?: string): Promise<ApiResponse<SupportConversation>> {
    const res = await apiClient.post<{ conversation: SupportConversation }>(S.HANDOFF(id), note ? { note } : {});
    return { ...res, data: res.data?.conversation as SupportConversation };
  },

  confirmResolved(id: string, rating?: number) {
    return apiClient.post(S.CONFIRM_RESOLVED(id), rating ? { rating } : {});
  },

  /** A new conversation: the member closes the current one first (a member keeps one open case). */
  async startFresh(currentId?: string): Promise<ApiResponse<SupportConversation>> {
    if (currentId) await apiClient.post(S.CLOSE(currentId), {});
    return supportService.startOrGetOpen();
  },
};
