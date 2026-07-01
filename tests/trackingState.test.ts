import {
  getStoredTrackingEnabled,
  setStoredTrackingEnabled,
} from '@/src/utils/trackingState';

describe('trackingState storage utility', () => {
  beforeEach(() => {
    const storage = new Map<string, unknown>();

    vi.stubGlobal('browser', {
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: storage.get(key) })),
          set: vi.fn(async (entries: Record<string, unknown>) => {
            Object.entries(entries).forEach(([entryKey, value]) => {
              storage.set(entryKey, value);
            });
          }),
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns default and persists it when key is missing', async () => {
    const enabled = await getStoredTrackingEnabled();

    expect(enabled).toBe(true);
  });

  it('stores and reads explicit state', async () => {
    await setStoredTrackingEnabled(false);
    const enabled = await getStoredTrackingEnabled();

    expect(enabled).toBe(false);
  });
});
