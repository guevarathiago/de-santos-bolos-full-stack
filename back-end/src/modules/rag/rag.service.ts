import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage, AIMessageChunk, type BaseMessage, HumanMessage } from '@langchain/core/messages';
import type { BaseRetrieverInterface } from '@langchain/core/retrievers';
import type { BaseCheckpointSaver } from '@langchain/langgraph';
import { buildRagGraph, sourcesOf, type Source } from './rag.graph.js';
import type { RetrievedMetadata } from './retrieval.service.js';

export { NO_CONTEXT_ANSWER, type Source } from './rag.graph.js';

export type HistoryMessage = {
    role: 'user' | 'assistant';
    content: string;
};

export type SavedMessage = HistoryMessage & {
    sources: Source[];
};

export type RagStreamEvent =
    | { type: 'token'; text: string }
    | { type: 'done'; answer: string; sources: Source[] };

// A visitor sends the recent history; a logged-in user sends the threadId and the graph loads the rest.
type AskOptions = {
    history?: HistoryMessage[];
    threadId?: string;
    signal?: AbortSignal;
};

type RagDependencies = {
    retriever: Pick<BaseRetrieverInterface<RetrievedMetadata>, 'invoke'>;
    model: BaseChatModel;
    checkpointer?: BaseCheckpointSaver;
};

const toMessages = (history: HistoryMessage[]) =>
    history.map(({ role, content }) => (role === 'assistant' ? new AIMessage(content) : new HumanMessage(content)));

const threadConfig = (threadId: string) => ({ configurable: { thread_id: threadId } });

export const createRagService = ({ retriever, model, checkpointer }: RagDependencies) => {
    const visitorGraph = buildRagGraph({ retriever, model });
    const memoryGraph = checkpointer ? buildRagGraph({ retriever, model, checkpointer }) : undefined;

    const requireMemoryGraph = () => {
        if (!memoryGraph) {
            throw new Error('Conversations need a checkpointer');
        }

        return memoryGraph;
    };

    async function* stream(question: string, { history = [], threadId, signal }: AskOptions = {}): AsyncGenerator<RagStreamEvent> {
        const newMessage = new HumanMessage(question);
        const runConfig = { ...(signal ? { signal } : {}), streamMode: ['messages', 'values'] as ('messages' | 'values')[] };
        const run = threadId
            ? requireMemoryGraph().stream({ messages: [newMessage] }, { ...threadConfig(threadId), ...runConfig })
            : visitorGraph.stream({ messages: [...toMessages(history), newMessage] }, runConfig);

        let streamed = '';
        let finalMessages: BaseMessage[] = [];

        for await (const [mode, chunk] of await run) {
            if (mode === 'values') {
                finalMessages = chunk.messages;
                continue;
            }

            const [message, metadata] = chunk;

            // Only the pieces the model writes in the "generate" node go out; the node's final message would repeat them.
            if (metadata.langgraph_node === 'generate' && AIMessageChunk.isInstance(message) && message.text) {
                streamed += message.text;
                yield { type: 'token', text: message.text };
            }
        }

        const reply = finalMessages.at(-1);
        const answer = reply?.text ?? '';

        // The no-context answer is not written by the model, so it is sent in one piece.
        if (!streamed.trim()) {
            yield { type: 'token', text: answer };
        }

        yield { type: 'done', answer, sources: reply ? sourcesOf(reply) : [] };
    }

    return {
        stream,

        async answer(question: string, options: AskOptions = {}) {
            for await (const event of stream(question, options)) {
                if (event.type === 'done') {
                    return { answer: event.answer, sources: event.sources };
                }
            }

            throw new Error('The answer stream ended without a final event');
        },

        async history(threadId: string): Promise<SavedMessage[]> {
            const { values } = await requireMemoryGraph().getState(threadConfig(threadId));
            const messages: BaseMessage[] = values.messages ?? [];

            return messages.map((message) =>
                message.getType() === 'human'
                    ? { role: 'user', content: message.text, sources: [] }
                    : { role: 'assistant', content: message.text, sources: sourcesOf(message) });
        },
    };
};

export type RagService = ReturnType<typeof createRagService>;
