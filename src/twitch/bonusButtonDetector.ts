import { BONUS_BUTTON_SELECTOR } from '@/src/twitch/selectors';
import { Logger } from '@/src/utils/logger';

interface ClaimPayload {
  username: string;
  pageUrl: string;
  claimedAt: string;
  buttonAriaLabel: string;
}

interface BonusButtonDetectorOptions {
  getTrackingEnabled: () => boolean;
  getCurrentStreamer: () => string | null;
  onClaim: (payload: ClaimPayload) => Promise<void>;
}

const SCAN_THROTTLE_MS = 300;
const CLICK_COOLDOWN_MS = 1250;

export class BonusButtonDetector {
  private readonly logger = new Logger('BonusButtonDetector');
  private readonly handledButtons = new WeakSet<HTMLButtonElement>();
  private readonly observer = new MutationObserver(() => {
    this.scheduleScan();
  });

  private scanTimeoutId: number | null = null;
  private cooldownTimeoutId: number | null = null;
  private processing = false;
  private lastClickAt = 0;

  constructor(private readonly options: BonusButtonDetectorOptions) {}

  start() {
    this.scanNow();
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-label', 'disabled', 'style', 'class'],
    });
  }

  stop() {
    this.observer.disconnect();
    if (this.scanTimeoutId !== null) {
      window.clearTimeout(this.scanTimeoutId);
      this.scanTimeoutId = null;
    }
    if (this.cooldownTimeoutId !== null) {
      window.clearTimeout(this.cooldownTimeoutId);
      this.cooldownTimeoutId = null;
    }
  }

  resetForNavigation() {
    this.processing = false;
    this.lastClickAt = 0;
    this.scanNow();
  }

  private scheduleScan() {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.scanTimeoutId !== null) {
      return;
    }

    this.scanTimeoutId = window.setTimeout(() => {
      this.scanTimeoutId = null;
      this.scanNow();
    }, SCAN_THROTTLE_MS);
  }

  private scanNow() {
    if (this.processing) {
      return;
    }

    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(BONUS_BUTTON_SELECTOR));
    for (const button of buttons) {
      if (this.handledButtons.has(button)) {
        continue;
      }

      void this.tryHandleButton(button);
      return;
    }
  }

  private isVisible(button: HTMLButtonElement) {
    if (button.getClientRects().length === 0) {
      return false;
    }

    const style = window.getComputedStyle(button);
    return style.visibility !== 'hidden' && style.display !== 'none';
  }

  private async tryHandleButton(button: HTMLButtonElement) {
    if (this.processing) {
      return;
    }

    if (!this.options.getTrackingEnabled()) {
      this.logger.debug('Skipping bonus button click because tracking is disabled');
      return;
    }

    const now = Date.now();
    if (now - this.lastClickAt < CLICK_COOLDOWN_MS) {
      this.logger.debug('Skipping bonus button click due to cooldown');
      this.schedulePostCooldownScan(CLICK_COOLDOWN_MS - (now - this.lastClickAt));
      return;
    }

    if (!button.isConnected || button.disabled || !this.isVisible(button)) {
      this.logger.debug('Skipping invalid/hidden/disabled claim button');
      return;
    }

    if (button.getAttribute('aria-label') !== 'Claim Bonus') {
      return;
    }

    const username = this.options.getCurrentStreamer();
    if (!username) {
      this.logger.warn('Claim bonus button found but streamer detection failed');
      return;
    }

    this.handledButtons.add(button);
    this.processing = true;
    this.lastClickAt = now;

    try {
      this.logger.info('Claim button detected and clicked', { username });
      button.click();

      await this.options.onClaim({
        username,
        pageUrl: window.location.href,
        claimedAt: new Date().toISOString(),
        buttonAriaLabel: 'Claim Bonus',
      });

      await this.waitForButtonInvalidation(button);
    } catch (error) {
      this.logger.error('Failed during bonus claim flow', error);
    } finally {
      this.processing = false;
      this.scheduleScan();
    }
  }

  private waitForButtonInvalidation(button: HTMLButtonElement) {
    return new Promise<void>((resolve) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      const timeout = window.setTimeout(() => {
        localObserver.disconnect();
        resolve();
      }, 2500);

      const localObserver = new MutationObserver(() => {
        if (!button.isConnected || button.getAttribute('aria-label') !== 'Claim Bonus') {
          if (typeof window !== 'undefined') {
            window.clearTimeout(timeout);
          }
          localObserver.disconnect();
          resolve();
        }
      });

      localObserver.observe(document.body, { childList: true, subtree: true, attributes: true });

      if (!button.isConnected || button.getAttribute('aria-label') !== 'Claim Bonus') {
        if (typeof window !== 'undefined') {
          window.clearTimeout(timeout);
        }
        localObserver.disconnect();
        resolve();
      }
    });
  }

  private schedulePostCooldownScan(delayMs: number) {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.cooldownTimeoutId !== null) {
      return;
    }

    const safeDelay = Math.max(delayMs, 50);
    this.cooldownTimeoutId = window.setTimeout(() => {
      this.cooldownTimeoutId = null;
      this.scanNow();
    }, safeDelay);
  }
}
