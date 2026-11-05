import type { NextFunction, Request, Response } from 'express';
import { z, type ZodType } from 'zod';

export const validateBody = (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body ?? {});

    if (!result.success) {
        return res.status(400).json({
            message: 'Invalid request body',
            errors: z.flattenError(result.error).fieldErrors,
        });
    }

    req.body = result.data;
    next();
};

// Express 5 makes req.query read-only, so the parsed query goes to res.locals.query.
export const validateQuery = (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
        return res.status(400).json({
            message: 'Invalid query string',
            errors: z.flattenError(result.error).fieldErrors,
        });
    }

    res.locals.query = result.data;
    next();
};
