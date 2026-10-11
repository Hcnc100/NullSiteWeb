import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  server: { host: '127.0.0.1' },
  plugins: [angular({ tsconfig: fileURLToPath(new URL('./tsconfig.spec.json', import.meta.url)) })],
  resolve: { alias: { src: fileURLToPath(new URL('./src', import.meta.url)) } },
  css: { preprocessorOptions: { scss: { loadPaths: ['.', 'src/app/scss', 'src'] } } },
  test: {
    globals: true,
    include: ['src/**/*.spec.ts'],
    setupFiles: ['src/testing/setup.ts'],
    browser: { enabled: true, headless: true, provider: playwright(), instances: [{ browser: 'chromium' }] },
    server: { deps: { inline: [/^@angular\//] } },
  },
});
