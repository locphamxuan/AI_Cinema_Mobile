import { useCatalogStore } from './catalogStore';
import { useSessionStore } from './sessionStore';

/** Start-up read: the catalog, then (for a member) the session check and the account. */
export async function loadInitialData(): Promise<void> {
  try {
    await useCatalogStore.getState().loadCatalog();
    await useSessionStore.getState().verifySession();
  } catch {
    // Catalog or profile unreachable: the screens keep what they already show.
  }
}

// Runs once the persisted session is back, as the single store did on rehydration.
if (useSessionStore.persist.hasHydrated()) void loadInitialData();
else useSessionStore.persist.onFinishHydration(() => void loadInitialData());
