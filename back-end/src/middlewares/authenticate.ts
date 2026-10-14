import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../modules/auth/token.js';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const token: unknown = req.cookies?.token;

    if (typeof token !== 'string') {
        return res.status(401).json({ message: 'No token found' });
    }

    try {
        req.user = verifyToken(token);
    } catch {
        return res.status(401).json({ message: 'Invalid token' });
    }

    next();
};
