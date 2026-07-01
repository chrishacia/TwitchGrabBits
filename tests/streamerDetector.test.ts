import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  detectCurrentStreamer,
  normalizePotentialChannelPath,
} from '@/src/twitch/streamerDetector';

describe('normalizePotentialChannelPath', () => {
  it('normalizes channel-style pathname', () => {
    expect(normalizePotentialChannelPath('/wackyjackietv')).toBe('wackyjackietv');
    expect(normalizePotentialChannelPath('/WACKYJACKIETV/')).toBe('wackyjackietv');
    expect(normalizePotentialChannelPath('/wackyjackietv?x=1#foo')).toBe('wackyjackietv');
  });

  it('rejects twitch reserved/system routes', () => {
    expect(normalizePotentialChannelPath('/directory')).toBeNull();
    expect(normalizePotentialChannelPath('/directory/category/fortnite')).toBeNull();
    expect(normalizePotentialChannelPath('/videos')).toBeNull();
    expect(normalizePotentialChannelPath('/inventory')).toBeNull();
  });
});

describe('detectCurrentStreamer', () => {
  const fixturePath = resolve(__dirname, 'fixtures/twitch-stream-info.html');
  const fixtureHtml = readFileSync(fixturePath, 'utf-8');

  it('extracts normalized streamer from stream info section', () => {
    document.body.innerHTML = fixtureHtml;
    const url = new URL('https://www.twitch.tv/wackyjackietv');

    expect(detectCurrentStreamer(document, url)).toBe('wackyjackietv');
  });

  it('falls back to location pathname when stream section is unavailable', () => {
    document.body.innerHTML = '<main><h1>Loading Twitch...</h1></main>';
    const url = new URL('https://www.twitch.tv/AnotherStreamer/?x=1#chat');

    expect(detectCurrentStreamer(document, url)).toBe('anotherstreamer');
  });

  it('rejects non-channel path fallback values', () => {
    document.body.innerHTML = '<main></main>';
    const url = new URL('https://www.twitch.tv/directory/category/fortnite');

    expect(detectCurrentStreamer(document, url)).toBeNull();
  });

  it('prefers candidate matching current pathname when multiple anchors are present', () => {
    document.body.innerHTML = `
      <section id="live-channel-stream-information">
        <a href="/someotherstreamer">Other</a>
        <a href="/WackyJackieTV">Current</a>
      </section>
    `;

    const url = new URL('https://www.twitch.tv/wackyjackietv');
    expect(detectCurrentStreamer(document, url)).toBe('wackyjackietv');
  });
});
