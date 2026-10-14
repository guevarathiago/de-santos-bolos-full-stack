import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/error-handler.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import type { AuthService } from './modules/auth/auth.service.js';

type AppDependencies = {
    authService: AuthService;
};

// Dependencies are injected so tests can build the app without a database.
export const createApp = ({ authService }: AppDependencies) => {
    const app = express();

    app.use(express.json());
    app.use(cookieParser());
    app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

    app.use(createAuthRouter(authService));

    app.use(errorHandler);

    return app;
};
