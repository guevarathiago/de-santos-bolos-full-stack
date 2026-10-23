import type { Request, Response } from 'express';
import type { ConversationService } from '../conversations/conversation.service.js';
import type { RagService } from '../rag/rag.service.js';
import type { ChatMessageInput } from './chat.schemas.js';

type ChatDependencies = {
    ragService: RagService;
    conversationService: ConversationService;
};

export const createChatController = ({ ragService, conversationService }: ChatDependencies) => ({
    async send(req: Request, res: Response) {
        const { message, history } = req.body as ChatMessageInput;

        return res.status(200).json(await ragService.answer(message, { history }));
    },

    async stream(req: Request, res: Response) {
        const { message, history, conversationId } = req.body as ChatMessageInput;

        // Resolved before the stream starts, so a foreign conversation still gets a plain 404.
        const conversation = req.user ? await conversationService.resolve(req.user.id, conversationId) : null;

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

        if (conversation) {
            send({ type: 'conversation', conversationId: conversation.id });
        }

        const options = conversation
            ? { threadId: conversation.id, signal: abort.signal }
            : { history, signal: abort.signal };

        try {
            for await (const event of ragService.stream(message, options)) {
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

    async latest(req: Request, res: Response) {
        const conversation = await conversationService.latest(req.user!.id);

        if (!conversation) {
            return res.status(200).json({ conversation: null });
        }

        const messages = await ragService.history(conversation.id);

        return res.status(200).json({ conversation: { id: conversation.id, messages } });
    },
});
