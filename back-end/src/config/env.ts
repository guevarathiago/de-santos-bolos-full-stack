import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.url(),
    JWT_SECRET: z.string().min(1),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    GEMINI_API_KEY: z.string().min(1),
    GEMINI_CHAT_MODEL: z.string().min(1).default('gemini-3.5-flash'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('Invalid environment variables:', z.flattenError(parsed.error).fieldErrors);
    process.exit(1);
}

export const env = parsed.data;
