import { MEMBER, accountRoutes, api, ok, renderApp, settle, signIn } from './support/harness';
import { screen } from '@testing-library/react-native';
import { movieDto } from './support/fixtures';
import HomeScreen from '../../../app/(tabs)/index';

// The catalog holds a T18 movie; the age rule is applied by the BE recommender, never re-built on the phone.
const catalog = [movieDto({ id: 'm-adult', title: 'Đêm Đỏ', ageRating: 'T18' }), movieDto({ id: 'm-1', title: 'Mùa Hạ Trong Gương' })];
const pick = (movieId: string, title: string, source: string) => ({ movieId, title, ageRating: 'T13', posterUrl: null, score: 0.8, source, reason: null });

describe('ST-MOB-20 Age gate on recommendations', () => {
  it('ST-MOB-20 shows a Guest only the BE trending picks, never a T18 movie from the catalog', async () => {
    api.on('GET /movies', ok(catalog));
    api.on('GET /recommendations/trending', ok([pick('m-1', 'Mùa Hạ Trong Gương', 'trending')]));
    await renderApp(<HomeScreen />);
    await settle();

    expect(api.called('GET /recommendations/trending')).toHaveLength(1);
    expect(api.called('GET /recommendations/for-you')).toHaveLength(0);
    expect(screen.getByLabelText('Mùa Hạ Trong Gương')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Đêm Đỏ')).toBeNull();
  });

  it('ST-MOB-20 shows a member under 18 only their own For You list from the BE', async () => {
    await signIn({ ...MEMBER, dateOfBirth: '2011-03-02' });
    accountRoutes();
    api.on('GET /movies', ok(catalog));
    api.on('GET /auth/me', ok({ id: MEMBER.id, email: MEMBER.email, fullName: MEMBER.name, dateOfBirth: '2011-03-02', role: 'MEMBER' }));
    api.on('GET /daily-rewards/status', ok(null));
    api.on('GET /recommendations/for-you', ok([pick('m-1', 'Mùa Hạ Trong Gương', 'hybrid')]));
    await renderApp(<HomeScreen />);
    await settle();

    expect(api.called('GET /recommendations/for-you')).toHaveLength(1);
    expect(api.called('GET /recommendations/for-you')[0].headers.Authorization).toMatch(/^Bearer /);
    expect(screen.getByText('Đề xuất dành riêng cho bạn')).toBeOnTheScreen();
    expect(screen.getByLabelText('Mùa Hạ Trong Gương')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Đêm Đỏ')).toBeNull();
  });
});
