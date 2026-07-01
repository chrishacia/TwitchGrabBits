import type {
  AuthProvider,
  ClaimSyncProvider,
  ClaimSyncResult,
} from '@/src/sync/ClaimSyncProvider';
import type { ClaimEvent } from '@/src/types/models';

export class RemoteClaimSyncProvider implements ClaimSyncProvider {
  constructor(
    private readonly apiBaseUrl: string,
    private readonly authProvider: AuthProvider,
  ) {}

  async syncPendingClaims(events: ClaimEvent[]): Promise<ClaimSyncResult> {
    if (!this.apiBaseUrl || events.length === 0) {
      return {
        successfulIds: [],
        failedIds: [],
        skipped: true,
      };
    }

    const authHeader = await this.authProvider.getAuthorizationHeader();

    // Scaffold only. Remote sync remains disabled by default in v1.
    void authHeader;
    return {
      successfulIds: [],
      failedIds: events.map((event) => event.id),
      skipped: true,
      error: 'Remote sync scaffold is present but disabled by default.',
    };
  }
}
