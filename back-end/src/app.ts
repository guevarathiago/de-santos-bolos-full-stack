import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/error-handler.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import type { AuthService } from './modules/auth/auth.service.js';
import { createChatRouter } from './modules/chat/chat.routes.js';
import type { ConversationService } from './modules/conversations/conversation.service.js';
import { createDocumentRouter } from './modules/documents/document.routes.js';
import type { DocumentService } from './modules/documents/document.service.js';
import { createAdminProductsRouter, createMenuRouter } from './modules/products/products.routes.js';
import type { ProductsService } from './modules/products/products.service.js';
import type { RagService } from './modules/rag/rag.service.js';
import type { StorageService } from './modules/storage/storage.service.js';

type AppDependencies = {
    authService: AuthService;
    documentService: DocumentService;
    ragService: RagService;
    conversationService: ConversationService;
    productsService: ProductsService;
    storageService: StorageService;
};

export const createApp = ({
    authService,
    documentService,
    ragService,
    conversationService,
    productsService,
    storageService,
}: AppDependencies) => {
    const app = express();

    app.use(express.json());
    app.use(cookieParser());
    app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

    app.use(createAuthRouter(authService));
    app.use('/admin/documents', createDocumentRouter(documentService));
    app.use('/products', createMenuRouter({ productsService, storageService }));
    app.use('/admin/products', createAdminProductsRouter({ productsService, storageService }));
    app.use('/chat', createChatRouter({ ragService, conversationService }));

    app.use(errorHandler);

    return app;
};
