import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { validateBody } from '../../middlewares/validate.js';
import type { RagService } from '../rag/rag.service.js';
import { createChatController } from './chat.controller.js';
import { chatMessageSchema } from './chat.schemas.js';

export const CHAT_RATE_LIMIT = { windowMs: 60 * 1000, limit: 10 };

export const createChatRouter = (ragService: RagService) => {
    const controller = createChatController(ragService);
    const router = Router();

    const limiter = rateLimit({
        ...CHAT_RATE_LIMIT,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: { message: 'Too many messages, please wait a minute' },
    });

    router.post('/', limiter, validateBody(chatMessageSchema), controller.send);
    router.post('/stream', limiter, validateBody(chatMessageSchema), controller.stream);

    return router;
};
