import type { ClaimEvent, PopupState, StreamerStats } from '@/src/types/models';

export type ExtensionMessage =
  | {
      type: 'CLAIM_BONUS_RECORDED';
      payload: {
        username: string;
        pageUrl: string;
        claimedAt: string;
        buttonAriaLabel: string;
      };
    }
  | {
      type: 'GET_TRACKING_STATE';
    }
  | {
      type: 'SET_TRACKING_STATE';
      payload: {
        enabled: boolean;
      };
    }
  | {
      type: 'GET_STREAMER_STATS';
    }
  | {
      type: 'GET_CURRENT_STREAMER';
    }
  | {
      type: 'GET_POPUP_STATE';
    }
  | {
      type: 'CONTENT_STATUS_UPDATE';
      payload: {
        currentStreamer: string | null;
        pageUrl: string;
      };
    }
  | {
      type: 'DELETE_STREAMER';
      payload: {
        username: string;
      };
    }
  | {
      type: 'CLEAR_ALL_DATA';
    }
  | {
      type: 'EXPORT_DATA';
    };

export type RuntimeBroadcastMessage =
  | {
      type: 'TRACKING_STATE_CHANGED';
      payload: { enabled: boolean };
    }
  | {
      type: 'DATA_UPDATED';
      payload: {
        username: string;
        claimedAt: string;
      };
    }
  | {
      type: 'POPUP_STATE_UPDATED';
      payload: PopupState;
    };

export type ExtensionResponse =
  | { ok: true; enabled: boolean }
  | { ok: true; stats: StreamerStats[]; totalClaims: number }
  | { ok: true; streamer: string | null }
  | { ok: true; popupState: PopupState }
  | { ok: true; exported: { streamerStats: StreamerStats[]; claimEvents: ClaimEvent[] } }
  | { ok: true }
  | { ok: false; error: string };
