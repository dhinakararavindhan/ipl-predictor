import type { CapacitorConfig } from '@capacitor/cli';

// The native Android/iOS apps are thin shells around the deployed web app —
// one codebase, three platforms. Set STANDS_APP_URL (or edit server.url) to
// your production deployment before building the apps; without it the shells
// load the bundled placeholder page in public/.
const appUrl = process.env.STANDS_APP_URL || 'https://the-stands.vercel.app';

const config: CapacitorConfig = {
  appId: 'app.thestands.fan',
  appName: 'The Stands',
  webDir: 'public',
  server: {
    url: appUrl,
    cleartext: false,
  },
  backgroundColor: '#0a0a0f',
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
