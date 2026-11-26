import { api, mockRouter, ok, renderApp, settle } from './support/harness';
import { fireEvent, screen, within } from '@testing-library/react-native';
import { movieDto } from './support/fixtures';
import HomeScreen from '../../../app/(tabs)/index';
import SearchScreen from '../../../app/search';

const catalog = [
  movieDto({ id: 'm-1', title: 'Mùa Hạ Trong Gương', genres: ['Tình cảm'], releaseYear: 2024 }),
  movieDto({ id: 'm-2', title: 'Thành Phố Không Ngủ', genres: ['Hành động'], releaseYear: 2026 }),
  movieDto({ id: 'm-3', title: 'Bếp Nhà Bà Tư', genres: ['Gia đình', 'Tình cảm'], releaseYear: 2025 }),
];
const trending = [{ movieId: 'm-2', title: 'Thành Phố Không Ngủ', posterUrl: null, score: 0.9, source: 'trending', reason: 'Đang được xem nhiều' }];

const posters = () => screen.queryAllByLabelText(/^(Mùa Hạ Trong Gương|Thành Phố Không Ngủ|Bếp Nhà Bà Tư)$/).map((p) => p.props.accessibilityLabel);

describe('ST-MOB-07 Browse, search and filter', () => {
  it('ST-MOB-07 loads Home rows, filters by genre and lists the newest releases', async () => {
    api.on('GET /movies', ok(catalog));
    api.on('GET /recommendations/trending', ok(trending));
    await renderApp(<HomeScreen />);
    await settle();

    expect(screen.getByText('Đề xuất nổi bật hôm nay')).toBeOnTheScreen();
    expect(screen.getByText('Đang được xem nhiều')).toBeOnTheScreen();
    expect(posters()).toEqual(['Thành Phố Không Ngủ']);

    await fireEvent.press(screen.getByRole('tab', { name: 'Thể loại' }));
    await fireEvent.press(screen.getByRole('tab', { name: 'Tình cảm' }));
    expect(screen.getByRole('tab', { name: 'Tình cảm' })).toBeSelected();
    expect(posters()).toEqual(['Mùa Hạ Trong Gương', 'Bếp Nhà Bà Tư']);

    // The Schedule tab was folded into "Phim mới" (2026-11-18): the newest releases first.
    await fireEvent.press(screen.getByRole('tab', { name: 'Phim mới' }));
    expect(posters()).toEqual(['Thành Phố Không Ngủ', 'Bếp Nhà Bà Tư', 'Mùa Hạ Trong Gương']);

    await fireEvent.press(screen.getByLabelText('Bếp Nhà Bà Tư'));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/movie/[id]', params: { id: 'm-3' } });
  });

  it('ST-MOB-07 searches a keyword on the server and shows an empty state for one with no result', async () => {
    api.on('GET /movies', (call) => {
      const term = (call.query.get('search') ?? '').toLowerCase();
      return ok(catalog.filter((m) => m.title.toLowerCase().includes(term)));
    });
    await renderApp(<SearchScreen />);
    const box = screen.getByPlaceholderText('Tên phim');

    await fireEvent.changeText(box, 'bếp');
    await act400();
    expect(api.calls.at(-1)?.query.get('search')).toBe('bếp');
    expect(within(screen.getByLabelText('Bếp Nhà Bà Tư')).getByText('Bếp Nhà Bà Tư')).toBeOnTheScreen();

    await fireEvent.changeText(box, 'không có phim này');
    await act400();
    expect(screen.getByText('Không có phim nào tên giống "không có phim này". Thử gõ ngắn hơn, chỉ một vài chữ trong tên.')).toBeOnTheScreen();
  });
});

/** The search box waits 350 ms after the last key before asking the server. */
async function act400() {
  await new Promise((resolve) => setTimeout(resolve, 400));
  await settle();
}
