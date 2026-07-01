import { BonusButtonDetector } from '@/src/twitch/bonusButtonDetector';

function makeVisible(button: HTMLButtonElement) {
  Object.defineProperty(button, 'getClientRects', {
    configurable: true,
    value: () => [{ width: 10, height: 10 }],
  });
}

describe('BonusButtonDetector', () => {
  it('clicks an existing claim button when enabled', async () => {
    document.body.innerHTML = '<button aria-label="Claim Bonus">Claim</button>';
    const button = document.querySelector('button') as HTMLButtonElement;
    makeVisible(button);

    const onClaim = vi.fn().mockResolvedValue(undefined);
    const clickSpy = vi.spyOn(button, 'click');

    const detector = new BonusButtonDetector({
      getTrackingEnabled: () => true,
      getCurrentStreamer: () => 'wackyjackietv',
      onClaim,
    });

    detector.start();
    await Promise.resolve();

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(onClaim).toHaveBeenCalledTimes(1);

    detector.stop();
  });

  it('does not click disabled or hidden buttons', async () => {
    document.body.innerHTML = '<button aria-label="Claim Bonus" disabled>Claim</button>';
    const disabledButton = document.querySelector('button') as HTMLButtonElement;
    makeVisible(disabledButton);

    const onClaim = vi.fn().mockResolvedValue(undefined);
    const clickSpy = vi.spyOn(disabledButton, 'click');

    const detector = new BonusButtonDetector({
      getTrackingEnabled: () => true,
      getCurrentStreamer: () => 'wackyjackietv',
      onClaim,
    });

    detector.start();
    await Promise.resolve();

    expect(clickSpy).not.toHaveBeenCalled();
    expect(onClaim).not.toHaveBeenCalled();

    detector.stop();
  });

  it('detects button inserted later and then replacement button', async () => {
    document.body.innerHTML = '<div id="root"></div>';
    const onClaim = vi.fn().mockResolvedValue(undefined);

    const detector = new BonusButtonDetector({
      getTrackingEnabled: () => true,
      getCurrentStreamer: () => 'wackyjackietv',
      onClaim,
    });

    detector.start();

    const first = document.createElement('button');
    first.setAttribute('aria-label', 'Claim Bonus');
    first.textContent = 'Claim';
    makeVisible(first);

    document.getElementById('root')?.appendChild(first);
    await new Promise((resolve) => setTimeout(resolve, 350));

    first.remove();

    const second = document.createElement('button');
    second.setAttribute('aria-label', 'Claim Bonus');
    second.textContent = 'Claim 2';
    makeVisible(second);

    document.getElementById('root')?.appendChild(second);
    await new Promise((resolve) => setTimeout(resolve, 1350));

    expect(onClaim).toHaveBeenCalledTimes(2);

    detector.stop();
  });
});
