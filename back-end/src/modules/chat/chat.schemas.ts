import { z } from 'zod';

export const MAX_MESSAGE_LENGTH = 1000;
export const MAX_HISTORY_MESSAGES = 6;
const MAX_HISTORY_CONTENT_LENGTH = 4000;

export const chatMessageSchema = z.object({
    message: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
    history: z
        .array(z.object({
            role: z.enum(['user', 'assistant']),
            content: z.string().min(1).max(MAX_HISTORY_CONTENT_LENGTH),
        }))
        .max(MAX_HISTORY_MESSAGES)
        .default([]),
    conversationId: z.uuid().optional(),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type ChatHistory = ChatMessageInput['history'];
