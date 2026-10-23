import type { DocumentInterface } from '@langchain/core/documents';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage, type BaseMessage, HumanMessage } from '@langchain/core/messages';
import type { BaseRetrieverInterface } from '@langchain/core/retrievers';
import type { RunnableConfig } from '@langchain/core/runnables';
import { Annotation, type BaseCheckpointSaver, END, MessagesAnnotation, START, StateGraph } from '@langchain/langgraph';
import { formatContext, ragPrompt } from './prompt.js';
import type { RetrievedMetadata } from './retrieval.service.js';

export const NO_CONTEXT_ANSWER =
    'Não encontrei essa informação nos documentos da loja. Para ajudar melhor, fale com a gente pelo WhatsApp.';

// The saved conversation can grow forever; only the latest messages go into the prompt.
export const MAX_PROMPT_HISTORY = 6;

export type Source = {
    documentId: string;
    filename: string;
    page?: number;
};

type RetrievedDocument = DocumentInterface<RetrievedMetadata>;

export const RagState = Annotation.Root({
    ...MessagesAnnotation.spec,
    documents: Annotation<RetrievedDocument[]>(),
});

type RagStateValue = typeof RagState.State;

type RagGraphDependencies = {
    retriever: Pick<BaseRetrieverInterface<RetrievedMetadata>, 'invoke'>;
    model: BaseChatModel;
    checkpointer?: BaseCheckpointSaver;
};

export const assistantMessage = (answer: string, sources: Source[]) =>
    new AIMessage({ content: answer, additional_kwargs: { sources } });

export const sourcesOf = (message: BaseMessage) => (message.additional_kwargs.sources ?? []) as Source[];

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

const isHuman = (message: BaseMessage) => message.getType() === 'human';

// Follow-ups like "e no domingo?" only make sense with the previous question.
const searchQuery = (messages: BaseMessage[]) => {
    const [question, previousQuestion] = messages.filter(isHuman).reverse();

    return previousQuestion ? `${previousQuestion.text}\n${question?.text ?? ''}` : (question?.text ?? '');
};

// Rebuilds the history with text only, so stored extras like the sources never reach the model.
const promptHistory = (messages: BaseMessage[]) =>
    messages
        .slice(-MAX_PROMPT_HISTORY)
        .map((message) => (isHuman(message) ? new HumanMessage(message.text) : new AIMessage(message.text)));

export const buildRagGraph = ({ retriever, model, checkpointer }: RagGraphDependencies) => {
    const chain = ragPrompt.pipe(model);

    const retrieve = async (state: RagStateValue, config: RunnableConfig) => ({
        documents: await retriever.invoke(searchQuery(state.messages), config),
    });

    const generate = async ({ messages, documents }: RagStateValue, config: RunnableConfig) => {
        const question = messages.at(-1)?.text ?? '';
        const response = await chain.invoke(
            { history: promptHistory(messages.slice(0, -1)), context: formatContext(documents), question },
            config,
        );

        const answer = response.text.trim();

        return {
            messages: [answer ? assistantMessage(answer, citedSources(answer, documents)) : assistantMessage(NO_CONTEXT_ANSWER, [])],
        };
    };

    const noContext = () => ({ messages: [assistantMessage(NO_CONTEXT_ANSWER, [])] });

    const graph = new StateGraph(RagState)
        .addNode('retrieve', retrieve)
        .addNode('generate', generate)
        .addNode('noContext', noContext)
        .addEdge(START, 'retrieve')
        .addConditionalEdges('retrieve', ({ documents }) => (documents.length > 0 ? 'generate' : 'noContext'), [
            'generate',
            'noContext',
        ])
        .addEdge('generate', END)
        .addEdge('noContext', END);

    return checkpointer ? graph.compile({ checkpointer }) : graph.compile();
};

export type RagGraph = ReturnType<typeof buildRagGraph>;
