import { accountRoutes, answerDialog, api, ok, renderApp, settle, shownDialog, signIn } from './support/harness';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { activePlan, hoursFromNow, monthlyPlan } from './support/fixtures';
import VipScreen from '../../../app/vip';
import { useAccountStore } from '../../store';

async function openPlan(plan: ReturnType<typeof activePlan>) {
  await signIn();
  accountRoutes({ subscription: plan });
  api.on('GET /membership-plans', ok([monthlyPlan]));
  await act(() => useAccountStore.getState().loadAccountData());
  await renderApp(<VipScreen />);
  await settle();
}

describe('ST-MOB-16 Turn off renewal', () => {
  it('ST-MOB-16 before the 24 h mark shows the deadline in the confirmation and turns renewal off (BR-05)', async () => {
    const plan = activePlan();
    await openPlan(plan);
    api.on('POST /subscriptions/sub-1/cancel-auto-renew', ok({ id: 'sub-1', autoRenew: false, nextRenewalAt: null }));

    await fireEvent(screen.getByLabelText('Tự gia hạn'), 'valueChange', false);
    const dialog = shownDialog()!;
    expect(dialog.title).toBe('Tắt tự gia hạn?');
    expect(dialog.message).toMatch(/^Bạn còn tắt được tự gia hạn đến .+ \(phải tắt trước kỳ gia hạn ít nhất 24 giờ\)\./);
    expect(dialog.message).toContain('Gói vẫn dùng được đến hết kỳ đã trả.');
    expect(api.called('POST /subscriptions/sub-1/cancel-auto-renew')).toHaveLength(0);

    accountRoutes({ subscription: { ...plan, autoRenew: false } });
    await answerDialog('Tắt tự gia hạn');
    await settle();
    expect(api.called('POST /subscriptions/sub-1/cancel-auto-renew')).toHaveLength(1);
    expect(screen.getByLabelText('Tự gia hạn')).toHaveProp('value', false);
    expect(screen.getByText(/^Đã tắt tự gia hạn\. Gói dừng khi hết kỳ/)).toBeOnTheScreen();
  });

  it('ST-MOB-16 after the 24 h mark says which side of the mark it is and sends no cancel (BR-05)', async () => {
    await openPlan(activePlan({ currentPeriodEnd: hoursFromNow(10), cancelDeadline: hoursFromNow(-14) }));
    expect(screen.getByText(/^Đã quá hạn tắt tự gia hạn của kỳ này \(phải tắt trước kỳ gia hạn ít nhất 24 giờ\)/)).toBeOnTheScreen();

    await fireEvent(screen.getByLabelText('Tự gia hạn'), 'valueChange', false);
    expect(shownDialog()?.title).toBe('Chưa tắt được tự gia hạn');
    expect(api.called('POST /subscriptions/sub-1/cancel-auto-renew')).toHaveLength(0);
  });
});
