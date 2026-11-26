import { api, ok, renderApp, settle, signIn } from './support/harness';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { ChatModal } from '../../components/chat/ChatModal';
import { useUiStore } from '../../store';

const message = (id: string, senderType: string, content: string) => ({ id, senderType, content, createdAt: '2026-11-24T08:00:00.000Z', isInternal: false });
const conversation = (status: string, aiSummary: string | null = null) => ({ id: 'case-1', status, aiSummary });

async function openChat() {
  await renderApp(<ChatModal />);
  await act(() => useUiStore.getState().setChatModalOpen(true));
  await settle();
}

describe('ST-MOB-25 AI support chat', () => {
  it('ST-MOB-25 answers with the AI, hands the case to Staff with an AI summary, and lets the member confirm it is solved', async () => {
    await signIn();
    let status = 'AI_HANDLING';
    const thread = [message('m-1', 'AI_CHATBOT', 'Xin chào, mình có thể giúp gì?')];
    api.on('POST /support/conversations', () => ok(conversation(status), 201));
    api.on('GET /support/conversations/case-1', () => ok({ conversation: conversation(status), messages: thread }));
    api.on('POST /support/conversations/case-1/read', ok({}));
    api.on('POST /support/conversations/case-1/messages', (call) => {
      const asked = message('m-2', 'MEMBER', (call.body as { content: string }).content);
      const answer = message('m-3', 'AI_CHATBOT', 'Coin thưởng được trừ sau Coin chính.');
      thread.push(asked, answer);
      return ok({ conversation: conversation(status), memberMessage: asked, aiMessage: answer, systemMessage: null, quickReplies: [] }, 201);
    });
    api.on('POST /support/conversations/case-1/request-staff', () => {
      status = 'WAITING_FOR_STAFF';
      return ok({ conversation: conversation(status, 'Thành viên hỏi về thứ tự trừ Coin.') });
    });
    api.on('POST /support/conversations/case-1/confirm-resolved', ok({}));
    await openChat();

    // 1. Ask the assistant.
    await fireEvent.changeText(screen.getByLabelText('Câu hỏi cho Trợ lý AI'), 'Coin nào bị trừ trước?');
    await fireEvent.press(screen.getByLabelText('Gửi tin nhắn'));
    await settle();
    expect(api.called('POST /support/conversations/case-1/messages')[0].body).toMatchObject({ content: 'Coin nào bị trừ trước?' });
    expect(screen.getByText('Coin thưởng được trừ sau Coin chính.')).toBeOnTheScreen();

    // 2. Ask for Staff: the case waits for Staff (the BE writes the AI summary for them).
    await fireEvent.press(screen.getByLabelText('Liên hệ trực tiếp nhân viên hỗ trợ'));
    await settle();
    expect(api.called('POST /support/conversations/case-1/request-staff')).toHaveLength(1);
    expect(screen.getByText('Đang chờ nhân viên hỗ trợ')).toBeOnTheScreen();

    // 3. Staff marked it solved: the member confirms.
    status = 'RESOLVED';
    thread.push(message('m-4', 'SUPPORT_AGENT', 'Mình đã kiểm tra, ví của bạn đúng.'));
    await act(() => new Promise((resolve) => setTimeout(resolve, 4200)));
    await settle();
    expect(screen.getByText('Mình đã kiểm tra, ví của bạn đúng.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Xác nhận đã giải quyết'));
    await settle();
    expect(api.called('POST /support/conversations/case-1/confirm-resolved')).toHaveLength(1);
  }, 30_000);

  it('ST-MOB-25 opens no case for a Guest', async () => {
    await openChat();
    expect(screen.getByPlaceholderText('Đăng nhập để trò chuyện')).toBeOnTheScreen();
    expect(api.called('POST /support/conversations')).toHaveLength(0);
  });
});
