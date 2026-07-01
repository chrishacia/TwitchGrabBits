import type { ClaimEvent } from '@/src/types/models';

export interface ClaimSyncResult {
  successfulIds: string[];
  failedIds: string[];
  skipped: boolean;
  error?: string;
}

export interface AuthProvider {
  getAuthorizationHeader(): Promise<string | null>;
}

export interface ClaimSyncProvider {
  syncPendingClaims(events: ClaimEvent[]): Promise<ClaimSyncResult>;
}
