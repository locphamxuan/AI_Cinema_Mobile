import { useCallback, useEffect, useState } from 'react';
import { supportService } from '../services/supportService';
import type { SupportConversation, SupportConversationDetail, SupportMessage, SupportQuickReply } from '../types/support';
import type { ApiResponse } from '../types/api';

const HISTORY_ERROR = 'Không tải được lịch sử trò chuyện. Thử lại sau giây lát.';

/**
 * The member's support case on the BE (FE-11, BR-22): open or reuse a case, send messages to the AI, hand over to
 * Staff, confirm it is solved, or start a fresh case. A Guest gets no case: the chat asks them to sign in.
 */
export function useSupportChat(open: boolean, isAuthenticated: boolean) {
  const [conversation, setConversation] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [quickReplies, setQuickReplies] = useState<SupportQuickReply[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyDetail = (res: ApiResponse<SupportConversationDetail>) => {
    if (!res.success || !res.data) return setError(res.message || HISTORY_ERROR);
    setConversation(res.data.conversation);
    setMessages(res.data.messages);
    setQuickReplies(res.data.quickReplies ?? []);
  };

  /** Opens the case through `start` (the open one, or a fresh one), then reads its messages. */
  const openCase = useCallback(
    async (start: () => Promise<ApiResponse<SupportConversation>>, failure: string) => {
      setError(null);
      if (!isAuthenticated) {
        setConversation(null);
        setMessages([]);
        setQuickReplies([]);
        return;
      }
      setLoading(true);
      try {
        const started = await start();
        if (!started.success || !started.data) {
          setConversation(null);
          setMessages([]);
          return setError(started.message || failure);
        }
        setConversation(started.data);
        applyDetail(await supportService.getDetail(started.data.id, started.data));
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated],
  );

  const reload = useCallback(
    () => openCase(() => supportService.startOrGetOpen(), 'Chưa kết nối được Trợ lý AI. Thử lại sau giây lát.'),
    [openCase],
  );

  // Read the case after the sheet has opened, not inside the render that opened it.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => void reload(), 0);
    return () => clearTimeout(timer);
  }, [open, reload]);

  const startNew = () => {
    if (loading || sending) return;
    const currentId = conversation?.id;
    void openCase(() => supportService.startFresh(currentId), 'Chưa mở được hội thoại mới. Thử lại sau giây lát.');
  };

  /** Sends one message; on failure the text goes back to the caller so the member does not retype it. */
  const send = async (text: string): Promise<boolean> => {
    const clean = text.trim();
    if (!clean || sending || loading) return true;
    if (!conversation) {
      setError('Hội thoại chưa sẵn sàng. Bấm "Hội thoại mới" rồi gửi lại.');
      return false;
    }
    setError(null);
    setSending(true);
    try {
      const res = await supportService.sendMessage(conversation.id, clean, `mob-${Date.now()}`);
      if (!res.success || !res.data) {
        setError(res.message || 'Chưa gửi được tin nhắn. Nếu hội thoại đã đóng, hãy mở hội thoại mới.');
        return false;
      }
      const { memberMessage, aiMessage, systemMessage } = res.data;
      setConversation(res.data.conversation);
      setMessages((prev) => [...prev, memberMessage, ...(aiMessage ? [aiMessage] : []), ...(systemMessage ? [systemMessage] : [])]);
      if (res.data.quickReplies?.length) setQuickReplies(res.data.quickReplies);
      return true;
    } finally {
      setSending(false);
    }
  };

  const requestStaff = async () => {
    if (!conversation || sending || loading) return;
    setError(null);
    setSending(true);
    try {
      const res = await supportService.requestStaff(conversation.id);
      if (!res.success || !res.data) return setError(res.message || 'Chưa chuyển được cho nhân viên. Thử lại sau giây lát.');
      setConversation(res.data);
      applyDetail(await supportService.getDetail(conversation.id, res.data));
    } finally {
      setSending(false);
    }
  };

  const confirmResolved = async () => {
    if (!conversation || sending) return;
    const res = await supportService.confirmResolved(conversation.id);
    if (!res.success) return setError(res.message || 'Chưa đóng được hội thoại. Thử lại sau giây lát.');
    await reload();
  };

  return { conversation, messages, quickReplies, loading, sending, error, startNew, send, requestStaff, confirmResolved };
}
