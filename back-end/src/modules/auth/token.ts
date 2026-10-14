import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { UserRole } from '../users/user.entity.js';

export const TOKEN_MAX_AGE = 5 * 60 * 60 * 1000;

const tokenPayloadSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.enum(UserRole),
});

export type TokenPayload = z.infer<typeof tokenPayloadSchema>;

export const signToken = (payload: TokenPayload) =>
    jwt.sign(payload, env.JWT_SECRET, { expiresIn: TOKEN_MAX_AGE / 1000 });

// Throws if the token is invalid, expired or was issued without the expected claims.
export const verifyToken = (token: string): TokenPayload =>
    tokenPayloadSchema.parse(jwt.verify(token, env.JWT_SECRET));
