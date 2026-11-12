import { API_ROUTES } from '../constants/apiRoutes';
import { supportService } from '../services';
import { apiClient } from '../services/apiClient';

const ok = <T,>(data: T) => ({ success: true, statusCode: 200, data });
const conversation = { id: 'conv-1', status: 'AI_HANDLING' as const, createdAt: '2026-11-13T00:00:00Z' };

describe('supportService (real AI Customer Support on the BE)', () => {
  beforeEach(() => jest.restoreAllMocks());

  it('opens or reuses the member case on the BE support routes', async () => {
    const post = jest.spyOn(apiClient, 'post').mockResolvedValueOnce(ok(conversation));
    const res = await supportService.startOrGetOpen();
    expect(post).toHaveBeenCalledWith('/support/conversations', {});
    expect(res.data).toEqual(conversation);
  });

  it('shows the transcript with BE sender names mapped and internal notes hidden', async () => {
    jest.spyOn(apiClient, 'get').mockResolvedValueOnce(
      ok({
        conversation,
        messages: [
          { id: 'm1', senderType: 'MEMBER', content: 'Số dư?', createdAt: 'x' },
          { id: 'm2', senderType: 'AI_CHATBOT', content: 'Bạn còn 120 Coin.', createdAt: 'x' },
          { id: 'm3', senderType: 'SUPPORT_AGENT', content: 'Ghi chú', createdAt: 'x', isInternal: true },
          { id: 'm4', senderType: 'SUPPORT_AGENT', content: 'Chào bạn', createdAt: 'x' },
        ],
      }),
    );
    const post = jest.spyOn(apiClient, 'post').mockResolvedValue(ok({}));
    const res = await supportService.getDetail('conv-1');
    expect(res.data.messages.map((m) => [m.id, m.senderType])).toEqual([
      ['m1', 'MEMBER'],
      ['m2', 'AI'],
      ['m4', 'STAFF'],
    ]);
    expect(post).toHaveBeenCalledWith(API_ROUTES.CHAT.READ('conv-1'), {});
  });

  it('sends a question to the real assistant and maps its answer', async () => {
    const post = jest.spyOn(apiClient, 'post').mockResolvedValueOnce(
      ok({
        conversation,
        memberMessage: { id: 'm1', senderType: 'MEMBER', content: 'Phim hot?', createdAt: 'x' },
        aiMessage: { id: 'm2', senderType: 'AI_CHATBOT', content: 'Top 1 là Phim A.', createdAt: 'x' },
        systemMessage: null,
        quickReplies: [],
      }),
    );
    const res = await supportService.sendMessage('conv-1', 'Phim hot?', 'mob-1');
    expect(post).toHaveBeenCalledWith('/support/conversations/conv-1/messages', { content: 'Phim hot?', clientMessageId: 'mob-1' });
    expect(res.data.aiMessage).toMatchObject({ senderType: 'AI', content: 'Top 1 là Phim A.' });
  });

  it('hands the case to Staff with request-staff and starts fresh by closing the old case', async () => {
    const post = jest
      .spyOn(apiClient, 'post')
      .mockResolvedValueOnce(ok({ conversation: { ...conversation, status: 'WAITING_FOR_STAFF' } }))
      .mockResolvedValueOnce(ok({}))
      .mockResolvedValueOnce(ok({ ...conversation, id: 'conv-2' }));
    const staff = await supportService.requestStaff('conv-1');
    expect(post).toHaveBeenNthCalledWith(1, '/support/conversations/conv-1/request-staff', {});
    expect(staff.data.status).toBe('WAITING_FOR_STAFF');
    const fresh = await supportService.startFresh('conv-1');
    expect(post).toHaveBeenNthCalledWith(2, '/support/conversations/conv-1/close', {});
    expect(fresh.data.id).toBe('conv-2');
  });
});
