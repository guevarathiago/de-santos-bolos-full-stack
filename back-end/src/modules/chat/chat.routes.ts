import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { validateBody } from '../../middlewares/validate.js';
import type { RagService } from '../rag/rag.service.js';
import { createChatController } from './chat.controller.js';
import { chatMessageSchema } from './chat.schemas.js';

export const createChatRouter = (ragService: RagService) => {
    const controller = createChatController(ragService);
    const router = Router();

    router.post('/', authenticate, validateBody(chatMessageSchema), controller.send);

    return router;
};
