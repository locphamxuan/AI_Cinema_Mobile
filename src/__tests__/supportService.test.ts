import { API_ROUTES } from '../constants/apiRoutes';
import { supportService } from '../services';
import { apiClient } from '../services/apiClient';

describe('supportService (Chatbox AI)', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    await supportService.resetLocalConversation();
  });

  it('uses backend MemberSupportController endpoints when available', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      success: true,
      statusCode: 201,
      data: { id: 'conv-1', status: 'AI_HANDLING', createdAt: '2026-11-10T00:00:00Z' },
    });

    const convRes = await supportService.startOrGetOpen();
    expect(postSpy).toHaveBeenCalledWith(API_ROUTES.SUPPORT.CONVERSATIONS, {});
    expect(convRes.success).toBe(true);
    expect(convRes.data?.id).toBe('conv-1');

    postSpy.mockResolvedValueOnce({
      success: true,
      statusCode: 201,
      data: {
        conversation: { id: 'conv-1', status: 'AI_HANDLING', createdAt: '2026-11-10T00:00:00Z' },
        memberMessage: { id: 'u1', senderType: 'MEMBER', content: 'Hỏi về Coin', createdAt: '2026-11-10T00:01:00Z' },
        aiMessage: { id: 'a1', senderType: 'AI', content: 'Bạn vào Ví Coin nhé.', createdAt: '2026-11-10T00:01:01Z' },
        systemMessage: null,
        quickReplies: [],
      },
    });

    const msgRes = await supportService.sendMessage('conv-1', ' Hỏi về Coin ', 'client-123');
    expect(postSpy).toHaveBeenLastCalledWith(API_ROUTES.SUPPORT.MESSAGES('conv-1'), {
      content: 'Hỏi về Coin',
      clientMessageId: 'client-123',
    });
    expect(msgRes.data?.aiMessage?.content).toBe('Bạn vào Ví Coin nhé.');
  });

  it('closes old thread and starts a fresh AI conversation via startFresh', async () => {
    const postSpy = jest
      .spyOn(apiClient, 'post')
      .mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: { id: 'conv-old', status: 'CLOSED', createdAt: '2026-11-10T00:00:00Z' },
      })
      .mockResolvedValueOnce({
        success: true,
        statusCode: 201,
        data: { id: 'conv-new', status: 'AI_HANDLING', createdAt: '2026-11-11T00:00:00Z' },
      });

    const fresh = await supportService.startFresh('conv-old');
    expect(postSpy).toHaveBeenNthCalledWith(1, API_ROUTES.SUPPORT.CLOSE('conv-old'), {
      note: 'Người dùng tạo cuộc hội thoại mới',
    });
    expect(postSpy).toHaveBeenNthCalledWith(2, API_ROUTES.SUPPORT.CONVERSATIONS, {});
    expect(fresh.success).toBe(true);
    expect(fresh.data?.id).toBe('conv-new');
    expect(fresh.data?.status).toBe('AI_HANDLING');
  });

  it('falls back cleanly to local AI assistant and resets when starting fresh on 404', async () => {
    jest.spyOn(apiClient, 'post').mockResolvedValue({
      success: false,
      statusCode: 404,
      data: null,
      message: 'Not found',
    });

    const conv = await supportService.startOrGetOpen();
    expect(conv.success).toBe(true);
    expect(conv.data?.id).toBe('local-ai-support');

    const sent = await supportService.sendMessage('local-ai-support', 'Làm sao để nạp Coin VNPay?');
    expect(sent.success).toBe(true);
    expect(sent.data?.memberMessage.content).toBe('Làm sao để nạp Coin VNPay?');
    expect(sent.data?.aiMessage?.content).toContain('VNPay');

    const catalogAsk = await supportService.sendMessage(
      'local-ai-support',
      'đang có bao nhiêu phim',
      undefined,
      { movieCount: 12, sampleTitles: ['Cyber Saigon', 'Void Core'] },
    );
    expect(catalogAsk.data?.aiMessage?.content).toContain('12 bộ phim AI');

    const escalated = await supportService.requestStaff('local-ai-support');
    expect(escalated.success).toBe(true);
    expect(escalated.data?.status).toBe('WAITING_FOR_STAFF');

    const freshLocal = await supportService.startFresh('local-ai-support');
    expect(freshLocal.success).toBe(true);
    expect(freshLocal.data?.status).toBe('AI_HANDLING');
  });
});
