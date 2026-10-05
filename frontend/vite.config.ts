import { defineConfig } from 'vite';
import { mergeConfig, defineConfig as defineTestConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
const viteConfig = defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    port: 5183,
    strictPort: true,
  },
});

export default mergeConfig(
  viteConfig,
  defineTestConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      css: false,
    },
  })
);
