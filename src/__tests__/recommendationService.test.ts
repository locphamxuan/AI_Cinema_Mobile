import { recommendationService } from '../services/recommendationService';
import { apiClient } from '../services/apiClient';

describe('recommendationService (BR-68, real BE data)', () => {
  beforeEach(() => jest.restoreAllMocks());

  it('maps the BE rows to movie cards carrying the AI reason', async () => {
    const get = jest.spyOn(apiClient, 'get').mockResolvedValue({
      success: true,
      statusCode: 200,
      data: [{ movieId: 'm1', title: 'Phim A', posterUrl: 'p.jpg', ageRating: 'T16', score: 0.83, source: 'after', reason: 'Vì bạn vừa xem "X"' }],
    });
    const res = await recommendationService.afterWatching('x');
    expect(get).toHaveBeenCalledWith('/recommendations/after/x');
    expect(res.data[0]).toMatchObject({ id: 'm1', title: 'Phim A', posterUrl: 'p.jpg', matchScore: 83, recommendReason: 'Vì bạn vừa xem "X"' });
  });

  it('calls the for-you, trending and similar endpoints and is empty on failure', async () => {
    const get = jest.spyOn(apiClient, 'get').mockResolvedValue({ success: false, statusCode: 500, data: null });
    await expect(recommendationService.forYou()).resolves.toMatchObject({ data: [] });
    await recommendationService.trending();
    await recommendationService.similar('m9');
    expect(get.mock.calls.map((c) => c[0])).toEqual(['/recommendations/for-you', '/recommendations/trending', '/recommendations/similar/m9']);
  });
});
