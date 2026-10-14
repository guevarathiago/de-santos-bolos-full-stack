import type { TokenPayload } from '../modules/auth/token.js';

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export {};
