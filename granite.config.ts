import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'sajutoday',
  brand: {
    displayName: '오늘의 운세',
    primaryColor: '#1C1C5E',
    icon: 'https://saju-toss.vercel.app/icon.png',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite',
      build: 'vite build',
    },
  },
  permissions: [],
  outdir: 'dist',
});
