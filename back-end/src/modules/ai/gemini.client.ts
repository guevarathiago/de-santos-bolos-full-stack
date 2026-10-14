import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env.js';

export const gemini = new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
    httpOptions: { retryOptions: { attempts: 3, initialDelay: 1, maxDelay: 8 } },
});
