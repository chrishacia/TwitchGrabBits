import { defineConfig } from 'wxt';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
) as { version: string };

const buildVersion = process.env.BUILD_VERSION ?? 'local-dev';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'TwitchGrabBits',
    description:
      'A sleek Chrome extension that automatically claims Twitch channel bonus rewards and tracks per-streamer claim counts locally using IndexedDB.',
    version: pkg.version,
    version_name: buildVersion,
    permissions: ['storage'],
    host_permissions: ['https://www.twitch.tv/*'],
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      128: 'icon/128.png',
    },
    action: {
      default_title: 'TwitchGrabBits',
    },
  },
});
