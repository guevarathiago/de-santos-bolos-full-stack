import type { CookieOptions, Request, Response } from 'express';
import { env } from '../../config/env.js';
import type { AuthService } from './auth.service.js';
import { signToken, TOKEN_MAX_AGE, type TokenPayload } from './token.js';

const cookieOptions: CookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
};

const setAuthCookie = (res: Response, payload: TokenPayload) => {
    res.cookie('token', signToken(payload), { ...cookieOptions, maxAge: TOKEN_MAX_AGE });
};

export const createAuthController = (authService: AuthService) => ({
    async login(req: Request, res: Response) {
        const user = await authService.login(req.body);

        setAuthCookie(res, user);

        return res.status(200).json({ message: 'Login successful', user });
    },

    async register(req: Request, res: Response) {
        const user = await authService.register(req.body);

        setAuthCookie(res, user);

        return res.status(201).json({ user });
    },

    me(req: Request, res: Response) {
        return res.status(200).json({ user: req.user });
    },

    logout(_req: Request, res: Response) {
        res.clearCookie('token', cookieOptions);

        return res.status(204).send();
    },
});
