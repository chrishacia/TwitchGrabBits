import { claimRepository } from '@/src/db/repositories/claimRepository';
import { isExtensionMessage } from '@/src/messaging/messageGuards';
import type {
  ExtensionMessage,
  ExtensionResponse,
  RuntimeBroadcastMessage,
} from '@/src/messaging/messages';
import { DisabledClaimSyncProvider } from '@/src/sync/DisabledClaimSyncProvider';
import { Logger } from '@/src/utils/logger';
import {
  getStoredTrackingEnabled,
  setStoredTrackingEnabled,
} from '@/src/utils/trackingState';

const logger = new Logger('Background');
const syncProvider = new DisabledClaimSyncProvider();

const streamerByTab = new Map<number, string | null>();
let lastKnownStreamer: string | null = null;

async function getTrackingEnabled(): Promise<boolean> {
  return getStoredTrackingEnabled();
}

async function setTrackingEnabled(enabled: boolean): Promise<void> {
  await setStoredTrackingEnabled(enabled);
  await claimRepository.updateSettings({ trackingEnabled: enabled });
}

function broadcast(message: RuntimeBroadcastMessage) {
  void browser.runtime.sendMessage(message).catch((error) => {
    logger.debug('Broadcast skipped without listeners', error);
  });
}

function buildPopupState(trackingEnabled: boolean) {
  if (!trackingEnabled) {
    return {
      trackingEnabled,
      currentStreamer: null,
      status: 'stopped' as const,
    };
  }

  if (lastKnownStreamer) {
    return {
      trackingEnabled,
      currentStreamer: lastKnownStreamer,
      status: 'watching' as const,
    };
  }

  return {
    trackingEnabled,
    currentStreamer: null,
    status: 'active' as const,
  };
}

async function maybeSyncPendingClaims() {
  const settings = await claimRepository.getOrCreateSettings();
  if (!settings.remoteSyncEnabled) {
    return;
  }

  const pending = await claimRepository.getPendingClaims();
  const result = await syncProvider.syncPendingClaims(pending);
  await claimRepository.markSynced(result.successfulIds, result.failedIds, result.error);
}

export default defineBackground(() => {
  void claimRepository.getOrCreateSettings();
  void getTrackingEnabled();

  browser.runtime.onMessage.addListener((message: unknown, sender) => {
    if (!isExtensionMessage(message)) {
      return Promise.resolve({
        ok: false,
        error: 'Invalid message payload',
      } satisfies ExtensionResponse);
    }

    const run = async (
      request: ExtensionMessage,
      runtimeSender: chrome.runtime.MessageSender,
    ): Promise<ExtensionResponse> => {
      switch (request.type) {
        case 'GET_TRACKING_STATE': {
          const enabled = await getTrackingEnabled();
          return { ok: true, enabled };
        }
        case 'SET_TRACKING_STATE': {
          await setTrackingEnabled(request.payload.enabled);
          broadcast({
            type: 'TRACKING_STATE_CHANGED',
            payload: { enabled: request.payload.enabled },
          });

          const popupState = buildPopupState(request.payload.enabled);
          broadcast({
            type: 'POPUP_STATE_UPDATED',
            payload: popupState,
          });

          return { ok: true, enabled: request.payload.enabled };
        }
        case 'CLAIM_BONUS_RECORDED': {
          const trackingEnabled = await getTrackingEnabled();
          if (!trackingEnabled) {
            logger.debug('Claim bonus message ignored because tracking is disabled');
            return { ok: true };
          }

          const normalizedUsername = request.payload.username.trim().toLowerCase();
          if (!normalizedUsername) {
            return { ok: false, error: 'Missing username in claim payload' };
          }

          await claimRepository.recordClaim({
            username: normalizedUsername,
            claimedAt: request.payload.claimedAt,
            pageUrl: request.payload.pageUrl,
            buttonAriaLabel: request.payload.buttonAriaLabel,
          });

          logger.info('Claim event stored', {
            username: normalizedUsername,
            claimedAt: request.payload.claimedAt,
          });

          broadcast({
            type: 'DATA_UPDATED',
            payload: {
              username: normalizedUsername,
              claimedAt: request.payload.claimedAt,
            },
          });

          await maybeSyncPendingClaims();
          return { ok: true };
        }
        case 'CONTENT_STATUS_UPDATE': {
          if (runtimeSender.tab?.id !== undefined) {
            streamerByTab.set(runtimeSender.tab.id, request.payload.currentStreamer);
          }

          lastKnownStreamer = request.payload.currentStreamer;
          const trackingEnabled = await getTrackingEnabled();
          const popupState = buildPopupState(trackingEnabled);
          broadcast({ type: 'POPUP_STATE_UPDATED', payload: popupState });
          return { ok: true };
        }
        case 'GET_STREAMER_STATS': {
          const stats = await claimRepository.getStreamerStats();
          const totalClaims = await claimRepository.getTotalClaims();
          return { ok: true, stats, totalClaims };
        }
        case 'GET_CURRENT_STREAMER': {
          const tabId = runtimeSender.tab?.id;
          const streamer = tabId === undefined ? lastKnownStreamer : streamerByTab.get(tabId) ?? null;
          return { ok: true, streamer };
        }
        case 'GET_POPUP_STATE': {
          const trackingEnabled = await getTrackingEnabled();
          return {
            ok: true,
            popupState: buildPopupState(trackingEnabled),
          };
        }
        case 'DELETE_STREAMER': {
          await claimRepository.deleteStreamer(request.payload.username);
          return { ok: true };
        }
        case 'CLEAR_ALL_DATA': {
          await claimRepository.clearAll();
          return { ok: true };
        }
        case 'EXPORT_DATA': {
          const exported = await claimRepository.exportData();
          return { ok: true, exported };
        }
        default:
          return { ok: false, error: 'Unsupported message' };
      }
    };

    return run(message, sender)
      .catch((error: unknown) => {
        logger.error('Message processing failed', error);
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Unknown background error',
        } satisfies ExtensionResponse;
      });
  });
});
