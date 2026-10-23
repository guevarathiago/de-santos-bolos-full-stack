import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../modules/auth/token.js';

// For public routes that behave differently for logged-in users: a missing or invalid token just means a visitor.
export const optionalAuthenticate = (req: Request, _res: Response, next: NextFunction) => {
    const token: unknown = req.cookies?.token;

    if (typeof token === 'string') {
        try {
            req.user = verifyToken(token);
        } catch {
            // An expired or forged token is treated as a visitor.
        }
    }

    next();
};
