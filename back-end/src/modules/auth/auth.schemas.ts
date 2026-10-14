import { z } from 'zod';

export const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(1),
});

export const registerSchema = z.object({
    name: z.string().trim().min(1),
    email: z.email(),
    password: z.string().min(1),
    celular: z.string().regex(/^\d{10,11}$/, 'Celular must have 10 or 11 digits'),
    cep: z.string().regex(/^\d{8}$/, 'CEP must have 8 digits'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
