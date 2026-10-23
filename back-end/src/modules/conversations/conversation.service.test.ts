import type { Repository } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';
import type { Conversation } from './conversation.entity.js';
import { createConversationService } from './conversation.service.js';

const makeConversations = (found: Partial<Conversation> | null = null) => {
    const mocks = {
        create: vi.fn((data: Partial<Conversation>) => data),
        save: vi.fn(async (data: Partial<Conversation>) => ({ id: 'conv-new', ...data })),
        findOneBy: vi.fn().mockResolvedValue(found),
        findOne: vi.fn().mockResolvedValue(found),
        update: vi.fn(),
    };

    return { conversations: mocks as unknown as Repository<Conversation>, mocks };
};

describe('conversationService.resolve', () => {
    it('starts a new conversation for the user when no id is given', async () => {
        const { conversations, mocks } = makeConversations();

        const conversation = await createConversationService(conversations).resolve('user-1');

        expect(mocks.save).toHaveBeenCalledWith({ userId: 'user-1' });
        expect(conversation.id).toBe('conv-new');
    });

    it('continues a conversation that belongs to the user and marks it as the latest', async () => {
        const { conversations, mocks } = makeConversations({ id: 'conv-1', userId: 'user-1' });

        const conversation = await createConversationService(conversations).resolve('user-1', 'conv-1');

        expect(mocks.findOneBy).toHaveBeenCalledWith({ id: 'conv-1', userId: 'user-1' });
        expect(mocks.update).toHaveBeenCalledWith('conv-1', { updatedAt: expect.any(Date) });
        expect(conversation.id).toBe('conv-1');
    });

    it('answers 404 for a conversation of another user, without creating one', async () => {
        const { conversations, mocks } = makeConversations(null);

        await expect(createConversationService(conversations).resolve('user-2', 'conv-1'))
            .rejects.toMatchObject({ status: 404 });
        expect(mocks.save).not.toHaveBeenCalled();
    });
});

describe('conversationService.latest', () => {
    it('returns the most recently used conversation of the user', async () => {
        const { conversations, mocks } = makeConversations({ id: 'conv-1' });

        await createConversationService(conversations).latest('user-1');

        expect(mocks.findOne).toHaveBeenCalledWith({ where: { userId: 'user-1' }, order: { updatedAt: 'DESC' } });
    });
});
