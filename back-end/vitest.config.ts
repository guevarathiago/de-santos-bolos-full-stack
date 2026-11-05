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
            ORDERS_SERVICE_URL: 'http://orders.test',
            ORDERS_SERVICE_API_KEY: 'test-orders-api-key',
            R2_ACCOUNT_ID: 'test-account',
            R2_ACCESS_KEY_ID: 'test-access-key',
            R2_SECRET_ACCESS_KEY: 'test-secret-key',
            R2_BUCKET: 'test-bucket',
            R2_PUBLIC_URL: 'https://images.test',
        },
    },
});
