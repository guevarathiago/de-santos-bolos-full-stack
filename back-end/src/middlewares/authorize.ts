import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../modules/users/user.entity.js';

export const authorize = (...roles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    next();
};
