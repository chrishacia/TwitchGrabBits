import Dexie, { type Table } from 'dexie';

import { DB_NAME, DEFAULT_REMOTE_SYNC_ENABLED, DEFAULT_TRACKING_ENABLED } from '@/src/config/constants';
import type { ClaimEvent, ExtensionSettings, StreamerStats } from '@/src/types/models';

export class TwitchGrabBitsDatabase extends Dexie {
  streamerStats!: Table<StreamerStats, string>;
  claimEvents!: Table<ClaimEvent, string>;
  extensionSettings!: Table<ExtensionSettings, 'settings'>;

  constructor(name = DB_NAME) {
    super(name);

    this.version(1).stores({
      streamerStats: '&username, claimCount, lastClaimedAt, updatedAt',
      claimEvents: '&id, username, claimedAt, syncStatus',
      extensionSettings: '&id, trackingEnabled, remoteSyncEnabled',
    });
  }
}

export const db = new TwitchGrabBitsDatabase();

export async function ensureDefaultSettings(database: TwitchGrabBitsDatabase = db) {
  const existing = await database.extensionSettings.get('settings');
  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const initial: ExtensionSettings = {
    id: 'settings',
    trackingEnabled: DEFAULT_TRACKING_ENABLED,
    remoteSyncEnabled: DEFAULT_REMOTE_SYNC_ENABLED,
    createdAt: now,
    updatedAt: now,
  };

  await database.extensionSettings.put(initial);
  return initial;
}
