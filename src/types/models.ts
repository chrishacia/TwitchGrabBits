export type SyncStatus = 'pending' | 'synced' | 'failed';

export interface StreamerStats {
  username: string;
  claimCount: number;
  firstClaimedAt: string;
  lastClaimedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClaimEvent {
  id: string;
  username: string;
  claimedAt: string;
  pageUrl: string;
  buttonAriaLabel: string;
  syncStatus: SyncStatus;
  syncAttempts: number;
  lastSyncAttemptAt?: string;
  lastSyncError?: string;
}

export interface ExtensionSettings {
  id: 'settings';
  trackingEnabled: boolean;
  remoteSyncEnabled: boolean;
  apiBaseUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PopupState {
  trackingEnabled: boolean;
  currentStreamer: string | null;
  status: 'active' | 'stopped' | 'waiting' | 'watching';
}

export interface ClaimInput {
  username: string;
  claimedAt: string;
  pageUrl: string;
  buttonAriaLabel: string;
}
