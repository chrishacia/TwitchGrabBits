import { v4 as uuidv4 } from 'uuid';

import {
  db,
  ensureDefaultSettings,
  type TwitchGrabBitsDatabase,
} from '@/src/db/database';
import type { ClaimEvent, ClaimInput, StreamerStats } from '@/src/types/models';

export class ClaimRepository {
  constructor(private readonly database: TwitchGrabBitsDatabase = db) {}

  async recordClaim(input: ClaimInput): Promise<{ event: ClaimEvent; stats: StreamerStats }> {
    const now = new Date().toISOString();

    return this.database.transaction(
      'rw',
      [this.database.claimEvents, this.database.streamerStats],
      async () => {
        const existing = await this.database.streamerStats.get(input.username);

        const stats: StreamerStats = existing
          ? {
              ...existing,
              claimCount: existing.claimCount + 1,
              lastClaimedAt: input.claimedAt,
              updatedAt: now,
            }
          : {
              username: input.username,
              claimCount: 1,
              firstClaimedAt: input.claimedAt,
              lastClaimedAt: input.claimedAt,
              createdAt: now,
              updatedAt: now,
            };

        const event: ClaimEvent = {
          id: uuidv4(),
          username: input.username,
          claimedAt: input.claimedAt,
          pageUrl: input.pageUrl,
          buttonAriaLabel: input.buttonAriaLabel,
          syncStatus: 'pending',
          syncAttempts: 0,
        };

        await this.database.streamerStats.put(stats);
        await this.database.claimEvents.put(event);

        return { event, stats };
      },
    );
  }

  async getStreamerStats(): Promise<StreamerStats[]> {
    return this.database.streamerStats.toArray();
  }

  async getTotalClaims(): Promise<number> {
    const rows = await this.database.streamerStats.toArray();
    return rows.reduce((sum, row) => sum + row.claimCount, 0);
  }

  async deleteStreamer(username: string): Promise<void> {
    await this.database.transaction(
      'rw',
      [this.database.streamerStats, this.database.claimEvents],
      async () => {
        await this.database.streamerStats.delete(username);
        await this.database.claimEvents.where('username').equals(username).delete();
      },
    );
  }

  async clearAll(): Promise<void> {
    await this.database.transaction(
      'rw',
      [this.database.streamerStats, this.database.claimEvents],
      async () => {
        await this.database.streamerStats.clear();
        await this.database.claimEvents.clear();
      },
    );
  }

  async exportData() {
    const streamerStats = await this.database.streamerStats.toArray();
    const claimEvents = await this.database.claimEvents.toArray();
    return {
      streamerStats,
      claimEvents,
    };
  }

  async getPendingClaims(limit = 100): Promise<ClaimEvent[]> {
    return this.database.claimEvents.where('syncStatus').equals('pending').limit(limit).toArray();
  }

  async markSynced(successfulIds: string[], failedIds: string[], errorMessage?: string): Promise<void> {
    const now = new Date().toISOString();

    await this.database.transaction('rw', this.database.claimEvents, async () => {
      for (const id of successfulIds) {
        const event = await this.database.claimEvents.get(id);
        if (!event) {
          continue;
        }

        const nextEvent: ClaimEvent = {
          ...event,
          syncStatus: 'synced',
          syncAttempts: event.syncAttempts + 1,
          lastSyncAttemptAt: now,
        };

        delete nextEvent.lastSyncError;
        await this.database.claimEvents.put(nextEvent);
      }

      for (const id of failedIds) {
        const event = await this.database.claimEvents.get(id);
        if (!event) {
          continue;
        }

        await this.database.claimEvents.put({
          ...event,
          syncStatus: 'failed',
          syncAttempts: event.syncAttempts + 1,
          lastSyncAttemptAt: now,
          lastSyncError: errorMessage ?? 'Unknown synchronization error',
        });
      }
    });
  }

  async getOrCreateSettings() {
    return ensureDefaultSettings(this.database);
  }

  async updateSettings(input: {
    trackingEnabled?: boolean;
    remoteSyncEnabled?: boolean;
    apiBaseUrl?: string;
  }) {
    const current = await ensureDefaultSettings(this.database);
    const updated = {
      ...current,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    await this.database.extensionSettings.put(updated);
    return updated;
  }
}

export const claimRepository = new ClaimRepository();
