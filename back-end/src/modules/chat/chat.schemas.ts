import { z } from 'zod';

export const MAX_MESSAGE_LENGTH = 1000;

export const chatMessageSchema = z.object({
    message: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
