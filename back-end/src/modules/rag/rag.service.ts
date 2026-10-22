import type { DocumentInterface } from '@langchain/core/documents';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import type { BaseRetrieverInterface } from '@langchain/core/retrievers';
import { formatContext, ragPrompt } from './prompt.js';
import type { RetrievedMetadata } from './retrieval.service.js';

export const NO_CONTEXT_ANSWER =
    'Não encontrei essa informação nos documentos da loja. Para ajudar melhor, fale com a gente pelo WhatsApp.';

export type Source = {
    documentId: string;
    filename: string;
    page?: number;
};

export type HistoryMessage = {
    role: 'user' | 'assistant';
    content: string;
};

export type RagStreamEvent =
    | { type: 'token'; text: string }
    | { type: 'done'; answer: string; sources: Source[] };

type StreamOptions = {
    signal?: AbortSignal;
};

type RetrievedDocument = DocumentInterface<RetrievedMetadata>;

type RagDependencies = {
    retriever: Pick<BaseRetrieverInterface<RetrievedMetadata>, 'invoke'>;
    model: BaseChatModel;
};

const citedSources = (answer: string, documents: RetrievedDocument[]): Source[] => {
    const cited = new Set([...answer.matchAll(/\[(\d+)\]/g)].map((match) => Number(match[1])));
    const sources = new Map<string, Source>();

    documents.forEach(({ metadata: { documentId, filename, page } }, index) => {
        if (!cited.has(index + 1)) return;

        const key = `${documentId}:${page ?? ''}`;
        sources.set(key, page ? { documentId, filename, page } : { documentId, filename });
    });

    return [...sources.values()];
};

const searchQuery = (question: string, history: HistoryMessage[]) => {
    const previousQuestion = history.findLast((message) => message.role === 'user');

    return previousQuestion ? `${previousQuestion.content}\n${question}` : question;
};

const toMessages = (history: HistoryMessage[]) =>
    history.map(({ role, content }) => (role === 'assistant' ? new AIMessage(content) : new HumanMessage(content)));

export const createRagService = ({ retriever, model }: RagDependencies) => {
    const chain = ragPrompt.pipe(model).pipe(new StringOutputParser());

    async function* stream(
        question: string,
        history: HistoryMessage[] = [],
        options: StreamOptions = {},
    ): AsyncGenerator<RagStreamEvent> {
        const documents = await retriever.invoke(searchQuery(question, history), options);

        if (documents.length === 0) {
            yield { type: 'token', text: NO_CONTEXT_ANSWER };
            yield { type: 'done', answer: NO_CONTEXT_ANSWER, sources: [] };
            return;
        }

        const tokens = await chain.stream(
            { history: toMessages(history), context: formatContext(documents), question },
            options,
        );

        let response = '';

        for await (const text of tokens) {
            if (!text) continue;

            response += text;
            yield { type: 'token', text };
        }

        const answer = response.trim();

        if (!answer) {
            yield { type: 'token', text: NO_CONTEXT_ANSWER };
            yield { type: 'done', answer: NO_CONTEXT_ANSWER, sources: [] };
            return;
        }

        yield { type: 'done', answer, sources: citedSources(answer, documents) };
    }

    return {
        stream,

        async answer(question: string, history: HistoryMessage[] = []) {
            for await (const event of stream(question, history)) {
                if (event.type === 'done') {
                    return { answer: event.answer, sources: event.sources };
                }
            }

            throw new Error('The answer stream ended without a final event');
        },
    };
};

export type RagService = ReturnType<typeof createRagService>;
