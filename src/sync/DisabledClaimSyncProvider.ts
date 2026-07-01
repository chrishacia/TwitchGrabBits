import type { ClaimSyncProvider, ClaimSyncResult } from '@/src/sync/ClaimSyncProvider';
import type { ClaimEvent } from '@/src/types/models';

export class DisabledClaimSyncProvider implements ClaimSyncProvider {
  async syncPendingClaims(_events: ClaimEvent[]): Promise<ClaimSyncResult> {
    return {
      successfulIds: [],
      failedIds: [],
      skipped: true,
    };
  }
}
