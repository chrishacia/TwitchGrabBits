import { BonusButtonDetector } from '@/src/twitch/bonusButtonDetector';
import { RouteObserver } from '@/src/twitch/routeObserver';
import { detectCurrentStreamer } from '@/src/twitch/streamerDetector';
import { Logger } from '@/src/utils/logger';
import type { ExtensionResponse, RuntimeBroadcastMessage } from '@/src/messaging/messages';

export default defineContentScript({
  matches: ['https://www.twitch.tv/*'],
  runAt: 'document_idle',
  main() {
    const logger = new Logger('ContentScript');
    let trackingEnabled = true;
    let currentStreamer: string | null = null;

    const postStatus = async () => {
      await browser.runtime.sendMessage({
        type: 'CONTENT_STATUS_UPDATE',
        payload: {
          currentStreamer,
          pageUrl: window.location.href,
        },
      });
    };

    const readTrackingState = async () => {
      const response = (await browser.runtime.sendMessage({
        type: 'GET_TRACKING_STATE',
      })) as ExtensionResponse;

      if (!response.ok || !('enabled' in response)) {
        logger.warn('Failed to load tracking state from background', response);
        return;
      }

      trackingEnabled = response.enabled;
      logger.debug('Tracking state synced in content script', { trackingEnabled });
    };

    const refreshStreamer = () => {
      currentStreamer = detectCurrentStreamer(document, new URL(window.location.href));
      logger.debug('Streamer detection result', { currentStreamer, href: window.location.href });
    };

    const routeObserver = new RouteObserver((url) => {
      logger.info('Twitch SPA navigation detected', { href: url.href });
      refreshStreamer();
      detector.resetForNavigation();
      void postStatus();
    });

    const detector = new BonusButtonDetector({
      getTrackingEnabled: () => trackingEnabled,
      getCurrentStreamer: () => currentStreamer,
      onClaim: async ({ username, pageUrl, claimedAt, buttonAriaLabel }) => {
        const response = (await browser.runtime.sendMessage({
          type: 'CLAIM_BONUS_RECORDED',
          payload: {
            username,
            pageUrl,
            claimedAt,
            buttonAriaLabel,
          },
        })) as ExtensionResponse;

        if (!response.ok) {
          logger.error('Claim record message failed', response.error);
        }
      },
    });

    const onRuntimeMessage = (message: RuntimeBroadcastMessage) => {
      if (message.type === 'TRACKING_STATE_CHANGED') {
        trackingEnabled = message.payload.enabled;
        logger.info('Tracking state updated from popup/background', { trackingEnabled });
        void postStatus();
      }
    };

    const init = async () => {
      await readTrackingState();
      refreshStreamer();
      await postStatus();

      detector.start();
      routeObserver.start();
      browser.runtime.onMessage.addListener(onRuntimeMessage);
    };

    void init();
  },
});
