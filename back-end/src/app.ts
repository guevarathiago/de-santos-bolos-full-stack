import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/error-handler.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import type { AuthService } from './modules/auth/auth.service.js';
import { createDocumentRouter } from './modules/documents/document.routes.js';
import type { DocumentService } from './modules/documents/document.service.js';

type AppDependencies = {
    authService: AuthService;
    documentService: DocumentService;
};

export const createApp = ({ authService, documentService }: AppDependencies) => {
    const app = express();

    app.use(express.json());
    app.use(cookieParser());
    app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

    app.use(createAuthRouter(authService));
    app.use('/admin/documents', createDocumentRouter(documentService));

    app.use(errorHandler);

    return app;
};
