import { api } from './api';

export type ChatSource = {
  documentId: string;
  filename: string;
  page?: number;
};

export type ChatHistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ChatReply = {
  answer: string;
  sources: ChatSource[];
};

export type SavedChatMessage = ChatHistoryMessage & {
  sources: ChatSource[];
};

export type SavedConversation = {
  id: string;
  messages: SavedChatMessage[];
};

type ChatStreamEvent =
  | { type: 'conversation'; conversationId: string }
  | { type: 'token'; text: string }
  | ({ type: 'done' } & ChatReply)
  | { type: 'error'; message: string };

// Visitors send the recent history; logged-in users send only the conversation id and the server loads the rest.
type StreamOptions = {
  history: ChatHistoryMessage[];
  conversationId?: string;
  onConversation: (conversationId: string) => void;
  onToken: (partialAnswer: string) => void;
  signal: AbortSignal;
};

const CHAT_TIMEOUT_MS = 60000;

export class ChatStreamError extends Error {
  status: number | undefined;

  constructor(status?: number) {
    super('Chat stream failed');
    this.status = status;
  }
}

const parseEvent = (raw: string): ChatStreamEvent | null =>
  raw.startsWith('data: ') ? (JSON.parse(raw.slice('data: '.length)) as ChatStreamEvent) : null;

export const getLatestConversation = async () => {
  const { data } = await api.get<{ conversation: SavedConversation | null }>('/chat/conversations/latest');
  return data.conversation;
};

export const streamChatMessage = async (
  message: string,
  { history, conversationId, onConversation, onToken, signal }: StreamOptions,
): Promise<ChatReply> => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, conversationId }),
    // Sends the login cookie to the API, which runs on another origin.
    credentials: 'include',
    signal: AbortSignal.any([signal, AbortSignal.timeout(CHAT_TIMEOUT_MS)]),
  });

  if (!response.ok || !response.body) {
    throw new ChatStreamError(response.status);
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  let answer = '';

  for (;;) {
    const { value, done } = await reader.read();

    if (done) {
      throw new ChatStreamError(500);
    }

    buffer += value;

    // Events end with a blank line; the last piece may still be incomplete.
    const rawEvents = buffer.split('\n\n');
    buffer = rawEvents.pop() ?? '';

    for (const event of rawEvents.map(parseEvent)) {
      if (event?.type === 'conversation') {
        onConversation(event.conversationId);
      }

      if (event?.type === 'token') {
        answer += event.text;
        onToken(answer);
      }

      if (event?.type === 'done') {
        return { answer: event.answer, sources: event.sources };
      }

      if (event?.type === 'error') {
        throw new ChatStreamError(500);
      }
    }
  }
};
