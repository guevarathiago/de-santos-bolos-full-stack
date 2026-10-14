import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { DocumentTextIcon, PaperAirplaneIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { sendChatMessage } from '../services/chat';
import type { ChatSource } from '../services/chat';
import { getChatErrorMessage } from '../utils/chatErrors';

type ChatMessage =
  | { id: number; role: 'user'; text: string }
  | { id: number; role: 'assistant'; text: string; sources: ChatSource[] };

const MAX_MESSAGE_LENGTH = 1000;

const suggestions = [
  'Vocês entregam em Bertioga?',
  'Tem bolo sem glúten?',
  'Qual o horário de funcionamento?',
  'Posso pagar parcelado?',
];

const removeCitations = (text: string) => text.replace(/\s?\[\d+\]/g, '');

const describeSource = ({ filename, page }: ChatSource) => (page ? `${filename} · p. ${page}` : filename);

let nextId = 0;

const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isWaiting]);

  const send = async (text: string) => {
    const message = text.trim();

    if (!message || isWaiting) {
      return;
    }

    setMessages((current) => [...current, { id: nextId++, role: 'user', text: message }]);
    setDraft('');
    setIsWaiting(true);

    try {
      const { answer, sources } = await sendChatMessage(message);
      setMessages((current) => [
        ...current,
        { id: nextId++, role: 'assistant', text: removeCitations(answer), sources },
      ]);
    } catch (err) {
      toast.error(getChatErrorMessage(err));
    } finally {
      setIsWaiting(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    send(draft);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send(draft);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-3xl flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <SparklesIcon className="h-10 w-10 text-brand-accent" aria-hidden="true" />
            <h1 className="text-2xl font-semibold text-text-strong">Assistente De Santos Bolos</h1>
            <p className="max-w-md text-sm text-text-muted">
              Tire suas dúvidas sobre entregas, encomendas, pagamentos e nossos produtos.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  className="cursor-pointer rounded-full border border-surface-border px-4 py-2 text-sm text-text transition-colors hover:border-brand hover:bg-surface-elevated hover:text-text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {messages.map((message) =>
              message.role === 'user' ? (
                <li key={message.id} className="flex justify-end">
                  <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-sm bg-brand px-4 py-2.5 text-sm text-text-strong">
                    {message.text}
                  </p>
                </li>
              ) : (
                <li key={message.id} className="flex flex-col items-start gap-2">
                  <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-bl-sm border border-surface-border bg-surface-elevated px-4 py-2.5 text-sm text-text">
                    {message.text}
                  </p>
                  {message.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {message.sources.map((source) => (
                        <span
                          key={`${source.documentId}-${source.page ?? ''}`}
                          className="flex items-center gap-1 rounded-full border border-surface-border px-2.5 py-0.5 text-xs text-text-muted"
                        >
                          <DocumentTextIcon className="h-3.5 w-3.5" aria-hidden="true" />
                          {describeSource(source)}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ),
            )}
            {isWaiting && (
              <li className="flex">
                <p
                  role="status"
                  className="animate-pulse rounded-2xl rounded-bl-sm border border-surface-border bg-surface-elevated px-4 py-2.5 text-sm text-text-muted"
                >
                  Pensando...
                </p>
              </li>
            )}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-surface-border px-4 py-3 sm:px-6">
        <div className="flex items-end gap-2">
          <label htmlFor="chat-message" className="sr-only">
            Mensagem
          </label>
          <textarea
            id="chat-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua pergunta..."
            rows={1}
            maxLength={MAX_MESSAGE_LENGTH}
            disabled={isWaiting}
            className="max-h-40 min-h-11 flex-1 resize-none rounded-md border border-input-border bg-input px-3 py-2.5 text-sm text-text-strong placeholder-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isWaiting || !draft.trim()}
            aria-label="Enviar"
            title="Enviar"
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md bg-brand text-text-strong transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PaperAirplaneIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <p className="mt-1.5 text-center text-xs text-text-muted">
          O assistente responde com base nos documentos da loja e pode cometer erros.
        </p>
      </form>
    </div>
  );
};

export default Chat;
