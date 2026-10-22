import { GoogleGenAI } from '@google/genai';
import { ChatGoogle } from '@langchain/google';
import { env } from '../../config/env.js';

export const gemini = new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
    httpOptions: { retryOptions: { attempts: 3, initialDelay: 1, maxDelay: 8 } },
});

export const geminiChat = new ChatGoogle({
    model: env.GEMINI_CHAT_MODEL,
    apiKey: env.GEMINI_API_KEY,
    temperature: 0.2,
    maxRetries: 3,
});
