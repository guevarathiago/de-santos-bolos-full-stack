import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { validateBody } from '../../middlewares/validate.js';
import { createAuthController } from './auth.controller.js';
import { loginSchema, registerSchema } from './auth.schemas.js';
import type { AuthService } from './auth.service.js';

export const createAuthRouter = (authService: AuthService) => {
    const controller = createAuthController(authService);
    const router = Router();

    router.post('/login', validateBody(loginSchema), controller.login);
    router.post('/register', validateBody(registerSchema), controller.register);
    router.get('/me', authenticate, controller.me);
    router.post('/logout', controller.logout);

    return router;
};
