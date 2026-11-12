import { API_ROUTES } from '../constants/apiRoutes';
import { supportService } from '../services';
import { apiClient } from '../services/apiClient';

describe('supportService (Chatbox AI)', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    await supportService.resetLocalConversation();
  });

  it('reuses an active backend conversation and sends messages to the chat endpoint', async () => {
    const conversation = { id: 'conv-1', status: 'AI_HANDLING' as const, createdAt: '2026-11-10T00:00:00Z' };
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
      success: true,
      statusCode: 200,
      data: [conversation],
    });

    const convRes = await supportService.startOrGetOpen();
    expect(getSpy).toHaveBeenCalledWith(API_ROUTES.CHAT.CONVERSATIONS);
    expect(convRes.success).toBe(true);
    expect(convRes.data).toEqual(conversation);

    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      success: true,
      statusCode: 201,
      data: {
        conversation,
        memberMessage: { id: 'u1', senderType: 'MEMBER', content: 'Hỏi về Coin', createdAt: '2026-11-10T00:01:00Z' },
        aiMessage: { id: 'a1', senderType: 'AI', content: 'Bạn vào Ví Coin nhé.', createdAt: '2026-11-10T00:01:01Z' },
        systemMessage: null,
        quickReplies: [],
      },
    });

    const msgRes = await supportService.sendMessage('conv-1', ' Hỏi về Coin ', 'client-123');
    expect(postSpy).toHaveBeenCalledWith(API_ROUTES.CHAT.MESSAGES('conv-1'), {
      content: 'Hỏi về Coin',
      clientMessageId: 'client-123',
    });
    expect(msgRes.data?.aiMessage?.content).toBe('Bạn vào Ví Coin nhé.');
  });

  it('creates a new backend conversation when no active one exists', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      success: true,
      statusCode: 201,
      data: { id: 'conv-new', status: 'AI_HANDLING', createdAt: '2026-11-11T00:00:00Z' },
    });
    jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
      success: true,
      statusCode: 200,
      data: [{ id: 'conv-old', status: 'CLOSED', createdAt: '2026-11-10T00:00:00Z' }],
    });

    const fresh = await supportService.startOrGetOpen();
    expect(postSpy).toHaveBeenCalledWith(API_ROUTES.CHAT.CONVERSATIONS, {});
    expect(fresh.data?.id).toBe('conv-new');
  });

  it('loads message history from the backend and uses the handoff endpoint', async () => {
    const conversation = { id: 'conv-1', status: 'AI_HANDLING' as const };
    const messages = [{ id: 'm1', senderType: 'AI' as const, content: 'Xin chào', createdAt: '2026-11-10T00:00:00Z' }];
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
      success: true,
      statusCode: 200,
      data: messages,
    });

    const detail = await supportService.getDetail('conv-1', conversation);
    expect(getSpy).toHaveBeenCalledWith(API_ROUTES.CHAT.MESSAGES('conv-1'));
    expect(detail.data?.messages).toEqual(messages);

    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      success: true,
      statusCode: 200,
      data: { ...conversation, status: 'WAITING_FOR_STAFF' },
    });
    await supportService.requestStaff('conv-1');
    expect(postSpy).toHaveBeenCalledWith(API_ROUTES.CHAT.HANDOFF('conv-1'), {});
  });

  it('does not turn a missing backend endpoint into a successful local AI reply', async () => {
    jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
      success: false,
      statusCode: 404,
      data: null,
      message: 'Not found',
    });

    const conv = await supportService.startOrGetOpen();
    expect(conv.success).toBe(false);
    expect(conv.data).toBeNull();

    jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      success: false,
      statusCode: 404,
      data: null,
      message: 'Not found',
    });
    const reply = await supportService.sendMessage('conv-404', 'còn về điểm danh hàng ngày');
    expect(reply.success).toBe(false);
    expect(reply.data).toBeNull();
  });

  it('keeps the explicit guest FAQ mode local', async () => {
    const detail = await supportService.getDetail('local-ai-support');
    expect(detail.success).toBe(true);

    const sent = await supportService.sendMessage('local-ai-support', 'Làm sao để nạp Coin VNPay?');
    expect(sent.success).toBe(true);
    expect(sent.data?.aiMessage?.content).toContain('VNPay');

    const catalogAsk = await supportService.sendMessage(
      'local-ai-support',
      'đang có bao nhiêu phim',
      undefined,
      { movieCount: 12, sampleTitles: ['Cyber Saigon', 'Void Core'] },
    );
    expect(catalogAsk.data?.aiMessage?.content).toContain('12 bộ phim AI');
  });
});
