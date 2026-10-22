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

type ChatStreamEvent =
  | { type: 'token'; text: string }
  | ({ type: 'done' } & ChatReply)
  | { type: 'error'; message: string };

type StreamOptions = {
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

export const streamChatMessage = async (
  message: string,
  history: ChatHistoryMessage[],
  { onToken, signal }: StreamOptions,
): Promise<ChatReply> => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
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
