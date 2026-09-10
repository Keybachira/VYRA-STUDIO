import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          include: ['src/main/**/*.test.ts', 'src/shared/**/*.test.ts'],
          environment: 'node',
          globals: true
        }
      },
      {
        test: {
          name: 'web',
          include: ['src/renderer/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
          globals: true,
          setupFiles: ['src/tests/setup.ts']
        }
      }
    ],
    coverage: {
      provider: 'v8',
      include: ['src/main/domains/**', 'src/shared/**', 'src/renderer/src/domains/**'],
      reporter: ['text', 'html']
    }
  }
})
