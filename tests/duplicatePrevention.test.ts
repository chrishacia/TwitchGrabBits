import { BonusButtonDetector } from '@/src/twitch/bonusButtonDetector';

describe('duplicate prevention', () => {
  it('handles duplicate mutation notifications without double counting same button', async () => {
    document.body.innerHTML = '<div id="root"></div>';
    const root = document.getElementById('root') as HTMLDivElement;

    const button = document.createElement('button');
    button.setAttribute('aria-label', 'Claim Bonus');
    Object.defineProperty(button, 'getClientRects', {
      configurable: true,
      value: () => [{ width: 12, height: 12 }],
    });

    const onClaim = vi.fn().mockResolvedValue(undefined);

    const detector = new BonusButtonDetector({
      getTrackingEnabled: () => true,
      getCurrentStreamer: () => 'wackyjackietv',
      onClaim,
    });

    detector.start();
    root.appendChild(button);

    root.setAttribute('data-noise', '1');
    root.setAttribute('data-noise', '2');
    root.setAttribute('data-noise', '3');

    await new Promise((resolve) => setTimeout(resolve, 450));

    expect(onClaim).toHaveBeenCalledTimes(1);
    detector.stop();
  });

  it('does not click when tracking is disabled', async () => {
    document.body.innerHTML = '<button aria-label="Claim Bonus">Claim</button>';
    const button = document.querySelector('button') as HTMLButtonElement;
    Object.defineProperty(button, 'getClientRects', {
      configurable: true,
      value: () => [{ width: 12, height: 12 }],
    });

    const clickSpy = vi.spyOn(button, 'click');
    const onClaim = vi.fn().mockResolvedValue(undefined);

    const detector = new BonusButtonDetector({
      getTrackingEnabled: () => false,
      getCurrentStreamer: () => 'wackyjackietv',
      onClaim,
    });

    detector.start();
    await new Promise((resolve) => setTimeout(resolve, 350));

    expect(clickSpy).not.toHaveBeenCalled();
    expect(onClaim).not.toHaveBeenCalled();

    detector.stop();
  });
});
