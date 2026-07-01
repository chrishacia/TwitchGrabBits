import { Logger } from '@/src/utils/logger';

const CHECK_INTERVAL_MS = 1500;

export class RouteObserver {
  private lastUrl = window.location.href;
  private readonly logger = new Logger('RouteObserver');
  private readonly mutationObserver = new MutationObserver(() => {
    this.checkForUrlChange();
  });
  private intervalId: number | null = null;

  constructor(private readonly onChange: (url: URL) => void) {}

  start() {
    window.addEventListener('popstate', this.handlePopState);
    this.mutationObserver.observe(document.body, { childList: true, subtree: true });
    this.intervalId = window.setInterval(() => this.checkForUrlChange(), CHECK_INTERVAL_MS);
  }

  stop() {
    window.removeEventListener('popstate', this.handlePopState);
    this.mutationObserver.disconnect();
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private readonly handlePopState = () => {
    this.checkForUrlChange();
  };

  private checkForUrlChange() {
    const current = window.location.href;
    if (current === this.lastUrl) {
      return;
    }

    this.lastUrl = current;
    this.logger.debug('Detected Twitch SPA route change', { current });
    this.onChange(new URL(current));
  }
}
