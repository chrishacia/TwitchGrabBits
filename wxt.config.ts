import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'TwitchGrabBits',
    description:
      'A sleek Chrome extension that automatically claims Twitch channel bonus rewards and tracks per-streamer claim counts locally using IndexedDB.',
    version: '1.0.0',
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
