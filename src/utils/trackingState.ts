import { DEFAULT_TRACKING_ENABLED, TRACKING_STORAGE_KEY } from '@/src/config/constants';

export async function getStoredTrackingEnabled(): Promise<boolean> {
  const stored = await browser.storage.local.get(TRACKING_STORAGE_KEY);
  const value = stored[TRACKING_STORAGE_KEY];

  if (typeof value === 'boolean') {
    return value;
  }

  await browser.storage.local.set({
    [TRACKING_STORAGE_KEY]: DEFAULT_TRACKING_ENABLED,
  });

  return DEFAULT_TRACKING_ENABLED;
}

export async function setStoredTrackingEnabled(enabled: boolean): Promise<void> {
  await browser.storage.local.set({
    [TRACKING_STORAGE_KEY]: enabled,
  });
}
