import type { Request, Response } from 'express';
import type { RagService } from '../rag/rag.service.js';
import type { ChatMessageInput } from './chat.schemas.js';

export const createChatController = (ragService: RagService) => ({
    async send(req: Request, res: Response) {
        const { message } = req.body as ChatMessageInput;

        return res.status(200).json(await ragService.answer(message));
    },
});
