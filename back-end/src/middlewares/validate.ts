import type { NextFunction, Request, Response } from 'express';
import { z, type ZodType } from 'zod';

// Replaces req.body with the parsed (and trimmed/coerced) data on success.
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
