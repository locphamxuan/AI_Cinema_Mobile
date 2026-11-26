import { accountRoutes, api, renderApp, settle, signIn } from './support/harness';
import { screen } from '@testing-library/react-native';
import CreateWatchPartyScreen from '../../../app/watch-party/create';

describe('ST-MOB-36 Watch Party needs a Monthly plan', () => {
  it('ST-MOB-36 shows the plan gate and creates no room for a member without a running plan', async () => {
    await signIn();
    accountRoutes();
    await renderApp(<CreateWatchPartyScreen />);
    await settle();

    expect(screen.getByText('Cần gói Tháng còn hiệu lực')).toBeOnTheScreen();
    expect(screen.getByText('Xem gói Tháng')).toBeOnTheScreen();
    expect(api.called('POST /watch-rooms')).toHaveLength(0);
  });
});
