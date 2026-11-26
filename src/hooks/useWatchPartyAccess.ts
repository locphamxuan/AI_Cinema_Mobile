import { useCallback, useEffect, useRef, useState } from 'react';
import { episodeAccessService } from '../services/episodeAccessService';
import { useSessionStore } from '../store';

export type WatchPartyAccessStatus = 'loading' | 'allowed' | 'plan-required' | 'sign-in' | 'error';

interface WatchPartyAccess {
  status: WatchPartyAccessStatus;
  message: string | null;
  reload: () => Promise<void>;
}

function hasCurrentMonthlyPlan(plan: Awaited<ReturnType<typeof episodeAccessService.getMySubscription>>['data']): boolean {
  if (!plan || (plan.status !== 'ACTIVE' && plan.status !== 'PAST_DUE')) return false;
  const periodEnd = Date.parse(plan.currentPeriodEnd);
  return Number.isFinite(periodEnd) && periodEnd > Date.now();
}

/** UI hint from a fresh BE read; every room action is still authorized by the BE. */
export function useWatchPartyAccess(): WatchPartyAccess {
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated);
  const [status, setStatus] = useState<WatchPartyAccessStatus>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const request = useRef(0);

  const reload = useCallback(async () => {
    const current = ++request.current;
    if (!isAuthenticated) {
      setMessage(null);
      setStatus('sign-in');
      return;
    }

    setMessage(null);
    setStatus('loading');
    try {
      const response = await episodeAccessService.getMySubscription();
      if (current !== request.current) return;
      if (!response.success) {
        setMessage(response.message || 'Chưa kiểm tra được gói Tháng.');
        setStatus('error');
        return;
      }
      setStatus(hasCurrentMonthlyPlan(response.data) ? 'allowed' : 'plan-required');
    } catch (error) {
      if (current !== request.current) return;
      setMessage(error instanceof Error ? error.message : 'Chưa kiểm tra được gói Tháng.');
      setStatus('error');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void reload();
    });
    return () => {
      active = false;
      request.current += 1;
    };
  }, [reload]);

  const visibleStatus = !isAuthenticated ? 'sign-in' : status === 'sign-in' ? 'loading' : status;
  return { status: visibleStatus, message, reload };
}
