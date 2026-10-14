import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../errors/http-error.js';

// Express 5 forwards rejected promises from async handlers here.
export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
        return res.status(err.status).json({ message: err.message });
    }

    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
};
