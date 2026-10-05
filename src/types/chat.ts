export type ChatSender = 'user' | 'bot' | 'agent' | 'system';
export type ChatPhase = 'bot' | 'escalating' | 'waiting' | 'agent';

export interface ChatMessage {
  id: string;
  sender: ChatSender;
  content: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  summary: string;
  userMessages: string[];
  createdAt: string;
}
