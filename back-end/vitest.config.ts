import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['src/**/*.test.ts'],
        env: {
            NODE_ENV: 'test',
            DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
            JWT_SECRET: 'test-secret',
            GEMINI_API_KEY: 'test-gemini-key',
        },
    },
});
