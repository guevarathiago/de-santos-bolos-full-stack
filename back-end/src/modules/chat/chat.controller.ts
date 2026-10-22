import type { Request, Response } from 'express';
import type { RagService } from '../rag/rag.service.js';
import type { ChatMessageInput } from './chat.schemas.js';

export const createChatController = (ragService: RagService) => ({
    async send(req: Request, res: Response) {
        const { message, history } = req.body as ChatMessageInput;

        return res.status(200).json(await ragService.answer(message, history));
    },

    async stream(req: Request, res: Response) {
        const { message, history } = req.body as ChatMessageInput;
        const abort = new AbortController();

        // Stops the model when the visitor leaves before the answer ends.
        res.on('close', () => {
            if (!res.writableEnded) abort.abort();
        });

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        });

        const send = (event: object) => res.write(`data: ${JSON.stringify(event)}\n\n`);

        try {
            for await (const event of ragService.stream(message, history, { signal: abort.signal })) {
                send(event);
            }
        } catch (error) {
            if (!abort.signal.aborted) {
                console.error(error);
                send({ type: 'error', message: 'Internal server error' });
            }
        }

        res.end();
    },
});
