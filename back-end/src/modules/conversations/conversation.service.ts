import type { Repository } from 'typeorm';
import { HttpError } from '../../errors/http-error.js';
import type { Conversation } from './conversation.entity.js';

export const createConversationService = (conversations: Repository<Conversation>) => ({
    // Continues the user's conversation, or starts one when no id is given.
    async resolve(userId: string, conversationId?: string) {
        if (!conversationId) {
            return conversations.save(conversations.create({ userId }));
        }

        const conversation = await conversations.findOneBy({ id: conversationId, userId });

        if (!conversation) {
            throw new HttpError(404, 'Conversation not found');
        }

        await conversations.update(conversation.id, { updatedAt: new Date() });

        return conversation;
    },

    latest(userId: string) {
        return conversations.findOne({ where: { userId }, order: { updatedAt: 'DESC' } });
    },
});

export type ConversationService = ReturnType<typeof createConversationService>;
