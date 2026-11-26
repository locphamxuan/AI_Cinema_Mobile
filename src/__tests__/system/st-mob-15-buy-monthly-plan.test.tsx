import { accountRoutes, answerDialog, api, ok, renderApp, settle, shownDialog, signIn } from './support/harness';
import { fireEvent, screen } from '@testing-library/react-native';
import { activePlan, monthlyPlan } from './support/fixtures';
import VipScreen from '../../../app/vip';
import { useAccountStore } from '../../store';

describe('ST-MOB-15 Buy the Monthly plan', () => {
  it('ST-MOB-15 pays the plan with Coins and shows the plan, its expiry and the renewal state', async () => {
    await signIn();
    accountRoutes({ main: 80, bonus: 40 });
    api.on('GET /membership-plans', ok([monthlyPlan]));
    api.on('POST /subscriptions', ok({ id: 'sub-1', status: 'PENDING', priceCoins: 99, enoughCoins: true, missingCoins: 0 }, 201));
    const plan = activePlan();
    api.on(
      'POST /subscriptions/sub-1/activate',
      ok({ id: 'sub-1', status: 'ACTIVE', priceCoins: 99, charged: { mainCoins: 80, bonusCoins: 19 }, mainBalance: 0, bonusBalance: 21, currentPeriodEnd: plan.currentPeriodEnd, nextRenewalAt: plan.nextRenewalAt }),
    );
    await renderApp(<VipScreen />);
    await settle();

    await fireEvent.press(screen.getByRole('button', { name: 'Đăng ký' }));
    // BR-01 on the plan too: Main Coins first, Bonus Coins for the rest.
    expect(shownDialog()?.message).toContain('Trừ 80 Coin chính và 19 Coin thưởng');
    // The account read after activation sees the running plan.
    accountRoutes({ main: 0, bonus: 21, subscription: plan });
    await answerDialog('Đăng ký');
    await settle();

    expect(api.called('POST /subscriptions')[0].body).toEqual({ planId: 'plan-monthly' });
    expect(api.called('POST /subscriptions/sub-1/activate')).toHaveLength(1);
    expect(shownDialog()?.title).toBe('Đã bật gói');
    expect(screen.getByText(/^Dùng được đến /)).toBeOnTheScreen();
    expect(screen.getByLabelText('Tự gia hạn')).toHaveProp('value', true);
    expect(screen.getByText(/^Bạn còn tắt được tự gia hạn đến /)).toBeOnTheScreen();
    expect(useAccountStore.getState()).toMatchObject({ isVIPMode: true, wallet: { mainCoin: 0, bonusCoin: 21 } });
  });
});
