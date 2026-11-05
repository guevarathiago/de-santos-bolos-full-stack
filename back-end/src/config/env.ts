import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.url(),
    JWT_SECRET: z.string().min(1),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    GEMINI_API_KEY: z.string().min(1),
    GEMINI_CHAT_MODEL: z.string().min(1).default('gemini-3.5-flash'),
    ORDERS_SERVICE_URL: z.url().default('http://localhost:3001'),
    ORDERS_SERVICE_API_KEY: z.string().min(16),
    R2_ACCOUNT_ID: z.string().min(1),
    R2_ACCESS_KEY_ID: z.string().min(1),
    R2_SECRET_ACCESS_KEY: z.string().min(1),
    R2_BUCKET: z.string().min(1),
    // Base address where uploaded files are publicly readable, without a trailing slash.
    R2_PUBLIC_URL: z.url().transform((url) => url.replace(/\/+$/, '')),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('Invalid environment variables:', z.flattenError(parsed.error).fieldErrors);
    process.exit(1);
}

export const env = parsed.data;
