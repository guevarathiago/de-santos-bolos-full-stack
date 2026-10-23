import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authenticate } from '../../middlewares/authenticate.js';
import { optionalAuthenticate } from '../../middlewares/optional-authenticate.js';
import { validateBody } from '../../middlewares/validate.js';
import type { ConversationService } from '../conversations/conversation.service.js';
import type { RagService } from '../rag/rag.service.js';
import { createChatController } from './chat.controller.js';
import { chatMessageSchema } from './chat.schemas.js';

export const CHAT_RATE_LIMIT = { windowMs: 60 * 1000, limit: 10 };

type ChatDependencies = {
    ragService: RagService;
    conversationService: ConversationService;
};

export const createChatRouter = (dependencies: ChatDependencies) => {
    const controller = createChatController(dependencies);
    const router = Router();

    const limiter = rateLimit({
        ...CHAT_RATE_LIMIT,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: { message: 'Too many messages, please wait a minute' },
    });

    router.post('/', limiter, validateBody(chatMessageSchema), controller.send);
    router.post('/stream', limiter, optionalAuthenticate, validateBody(chatMessageSchema), controller.stream);
    router.get('/conversations/latest', authenticate, controller.latest);

    return router;
};
