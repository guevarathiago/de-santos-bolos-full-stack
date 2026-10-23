import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { env } from '../config/env.js';

// Saves the chat graph state of logged-in users. Its tables live in their own schema, apart from ours.
export const checkpointer = PostgresSaver.fromConnString(env.DATABASE_URL, { schema: 'langgraph' });
