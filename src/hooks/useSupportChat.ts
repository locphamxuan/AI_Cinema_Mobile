import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { supportService } from '../services/supportService';
import type { SupportConversation, SupportConversationDetail, SupportMessage, SupportQuickReply, SupportStatus } from '../types/support';
import type { ApiResponse } from '../types/api';

const HISTORY_ERROR = 'Không tải được lịch sử trò chuyện. Thử lại sau giây lát.';
/** How often an open chat checks for a Staff reply. */
export const POLL_MS = 4000;
/** Cases where someone else may write next: Staff, or the clock closing a resolved case. */
const LIVE_STATUSES: SupportStatus[] = ['WAITING_FOR_STAFF', 'STAFF_HANDLING', 'RESOLVED'];

/**
 * The member's support case on the BE (FE-11, BR-22): open or reuse a case, send messages to the AI, hand over to
 * Staff, confirm it is solved or say it is not, or start a fresh case. While the chat is open and Staff may answer,
 * the case is read again every few seconds, so a Staff reply shows without closing the chat. A Guest gets no case.
 */
export function useSupportChat(open: boolean, isAuthenticated: boolean) {
  const [conversation, setConversation] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [quickReplies, setQuickReplies] = useState<SupportQuickReply[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** The message being sent and its id: a retry of the same text reuses the id, so the BE never stores it twice. */
  const pending = useRef<{ text: string; id: string } | null>(null);

  const applyDetail = useCallback((res: ApiResponse<SupportConversationDetail>, quiet = false) => {
    if (!res.success || !res.data) return quiet ? undefined : setError(res.message || HISTORY_ERROR);
    setConversation(res.data.conversation);
    setMessages(res.data.messages);
    setQuickReplies(res.data.quickReplies ?? []);
  }, []);

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
    [isAuthenticated, applyDetail],
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

  /** Reads the case again without showing a loader or an error: what polling and a resync after a failure do. */
  const refresh = useCallback(async () => {
    if (!conversation) return;
    applyDetail(await supportService.getDetail(conversation.id, conversation), true);
  }, [conversation, applyDetail]);

  const caseId = conversation?.id;
  const live = !!conversation && LIVE_STATUSES.includes(conversation.status);
  useEffect(() => {
    if (!open || !caseId || !live || sending) return;
    const timer = setInterval(() => {
      // No reads while the app sits in the background.
      if (AppState.currentState !== 'background') void refresh();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [open, caseId, live, sending, refresh]);

  const startNew = () => {
    if (loading || sending) return;
    const currentId = conversation?.id;
    void openCase(() => supportService.startFresh(currentId), 'Chưa mở được hội thoại mới. Thử lại sau giây lát.');
  };

  /** Sends one message; true only once the BE took it, so the caller keeps the draft otherwise. */
  const send = async (text: string): Promise<boolean> => {
    const clean = text.trim();
    if (!clean || sending || loading) return false;
    if (!conversation) {
      setError('Hội thoại chưa sẵn sàng. Bấm "Hội thoại mới" rồi gửi lại.');
      return false;
    }
    if (pending.current?.text !== clean) pending.current = { text: clean, id: `mob-${Date.now()}-${Math.random().toString(36).slice(2, 10)}` };
    setError(null);
    setSending(true);
    try {
      const res = await supportService.sendMessage(conversation.id, clean, pending.current.id);
      if (!res.success || !res.data) {
        setError(res.message || 'Chưa gửi được tin nhắn. Nếu hội thoại đã đóng, hãy mở hội thoại mới.');
        // The BE may have taken the message although the answer did not arrive: show what it holds.
        await refresh();
        return false;
      }
      pending.current = null;
      const { memberMessage, aiMessage, systemMessage } = res.data;
      setConversation(res.data.conversation);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== memberMessage.id),
        memberMessage,
        ...(aiMessage ? [aiMessage] : []),
        ...(systemMessage ? [systemMessage] : []),
      ]);
      if (res.data.quickReplies?.length) setQuickReplies(res.data.quickReplies);
      return true;
    } finally {
      setSending(false);
    }
  };

  /** "Gặp nhân viên", or "Vẫn cần hỗ trợ" on a case Staff resolved: either way Staff picks it up. */
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
    await refresh();
  };

  return { conversation, messages, quickReplies, loading, sending, error, startNew, send, refresh, requestStaff, confirmResolved };
}
