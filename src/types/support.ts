export type SupportStatus =
  | 'AI_HANDLING'
  | 'WAITING_FOR_STAFF'
  | 'STAFF_HANDLING'
  | 'RESOLVED'
  | 'CLOSED';

export type SupportSenderType = 'MEMBER' | 'AI' | 'STAFF' | 'SYSTEM';

export interface SupportConversation {
  id: string;
  status: SupportStatus;
  aiSummary?: string | null;
  lastMessageAt?: string | null;
  createdAt?: string;
}

export interface SupportMessage {
  id: string;
  senderType: SupportSenderType;
  content: string;
  createdAt: string;
}

export interface SupportQuickReply {
  label: string;
  message: string;
}

export interface SupportConversationDetail {
  conversation: SupportConversation;
  messages: SupportMessage[];
  quickReplies?: SupportQuickReply[];
}

export interface SupportSendResult {
  conversation: SupportConversation;
  memberMessage: SupportMessage;
  aiMessage: SupportMessage | null;
  systemMessage: SupportMessage | null;
  quickReplies: SupportQuickReply[];
}
