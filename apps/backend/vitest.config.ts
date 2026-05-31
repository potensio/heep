import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@bantujual/categories': path.resolve(__dirname, '../../packages/categories/index.ts'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    fileParallelism: false, // integration tests share one test DB
  },
});
