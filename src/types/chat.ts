export type ChatSender = 'user' | 'bot' | 'agent' | 'system';
export type ChatPhase = 'bot' | 'escalating' | 'waiting' | 'agent';

export interface ChatMessage {
  id: string;
  sender: ChatSender;
  content: string;
  timestamp: string;
}

export interface QuickReply {
  id: string;
  text: string;
  payload: string;
}

export interface SupportTicket {
  id: string;
  summary: string;
  userMessages: string[];
  createdAt: string;
}

export interface ChatState {
  messages: ChatMessage[];
  phase: ChatPhase;
  isOpen: boolean;
  ticket: SupportTicket | null;
  estimatedWaitMinutes: number;
}
