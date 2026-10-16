import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import {
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { sendChatMessage } from '../../services/chat';
import type { ChatSource } from '../../services/chat';
import { getChatErrorMessage } from '../../utils/chatErrors';

type ChatMessage =
  | { id: number; role: 'user'; text: string }
  | { id: number; role: 'assistant'; text: string; sources: ChatSource[] };

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_MESSAGES = 6;

const suggestions = ['Vocês entregam em Bertioga?', 'Tem bolo sem glúten?', 'Posso pagar parcelado?'];

const removeCitations = (text: string) => text.replace(/\s?\[\d+\]/g, '');

const describeSource = ({ filename, page }: ChatSource) => (page ? `${filename} · p. ${page}` : filename);

const headerButtonClass =
  'cursor-pointer rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface hover:text-text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-40';

let nextId = 0;

const ChatPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const conversationRef = useRef(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    inputRef.current?.focus();

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('keydown', handleEscape);

    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isWaiting]);

  const send = async (text: string) => {
    const message = text.trim();

    if (!message || isWaiting) {
      return;
    }

    const conversation = conversationRef.current;
    const history = messages.slice(-MAX_HISTORY_MESSAGES).map(({ role, text: content }) => ({ role, content }));

    setMessages((current) => [...current, { id: nextId++, role: 'user', text: message }]);
    setDraft('');
    setIsWaiting(true);

    try {
      const { answer, sources } = await sendChatMessage(message, history);

      if (conversation === conversationRef.current) {
        setMessages((current) => [
          ...current,
          { id: nextId++, role: 'assistant', text: removeCitations(answer), sources },
        ]);
      }
    } catch (err) {
      toast.error(getChatErrorMessage(err));
    } finally {
      setIsWaiting(false);
    }
  };

  const startNewConversation = () => {
    conversationRef.current += 1;
    setMessages([]);
    setDraft('');
    setIsWaiting(false);
    inputRef.current?.focus();
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

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir assistente"
        title="Assistente"
        className="fixed right-4 bottom-20 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-brand text-text-strong shadow-lg shadow-black/40 transition-transform hover:scale-110 hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:scale-95 sm:right-6 sm:bottom-24"
      >
        <ChatBubbleLeftRightIcon className="h-7 w-7" aria-hidden="true" />
      </button>
    );
  }

  return (
    <section
      role="dialog"
      aria-label="Assistente De Santos Bolos"
      className="fixed inset-0 z-60 flex flex-col bg-surface sm:inset-auto sm:right-6 sm:bottom-6 sm:h-144 sm:max-h-[calc(100dvh-6rem)] sm:w-96 sm:overflow-hidden sm:rounded-lg sm:border sm:border-surface-border sm:shadow-2xl sm:shadow-black/60"
    >
      <header className="flex items-center gap-3 border-b border-surface-border bg-surface-elevated px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/20">
          <SparklesIcon className="h-5 w-5 text-brand-accent" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-text-strong">Assistente</h2>
          <p className="truncate text-xs text-text-muted">Tire suas dúvidas sobre a loja</p>
        </div>
        <button
          type="button"
          onClick={startNewConversation}
          disabled={messages.length === 0}
          aria-label="Nova conversa"
          title="Nova conversa"
          className={headerButtonClass}
        >
          <ArrowPathIcon className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Fechar assistente"
          title="Fechar"
          className={headerButtonClass}
        >
          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm font-medium text-text-strong">Olá! Como posso ajudar?</p>
            <p className="text-xs text-text-muted">Escolha uma sugestão ou escreva sua pergunta.</p>
            <div className="mt-3 flex flex-col items-center gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  className="cursor-pointer rounded-full border border-surface-border px-3.5 py-1.5 text-xs text-text transition-colors hover:border-brand hover:bg-surface-elevated hover:text-text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((message) =>
              message.role === 'user' ? (
                <li key={message.id} className="flex justify-end">
                  <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-sm bg-brand px-3.5 py-2 text-sm text-text-strong">
                    {message.text}
                  </p>
                </li>
              ) : (
                <li key={message.id} className="flex flex-col items-start gap-1.5">
                  <p className="max-w-[90%] whitespace-pre-line rounded-2xl rounded-bl-sm border border-surface-border bg-surface-elevated px-3.5 py-2 text-sm text-text">
                    {message.text}
                  </p>
                  {message.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {message.sources.map((source) => (
                        <span
                          key={`${source.documentId}-${source.page ?? ''}`}
                          className="flex items-center gap-1 rounded-full border border-surface-border px-2 py-0.5 text-[11px] text-text-muted"
                        >
                          <DocumentTextIcon className="h-3 w-3" aria-hidden="true" />
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
                  className="animate-pulse rounded-2xl rounded-bl-sm border border-surface-border bg-surface-elevated px-3.5 py-2 text-sm text-text-muted"
                >
                  Pensando...
                </p>
              </li>
            )}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-surface-border px-3 py-3">
        <div className="flex items-end gap-2">
          <label htmlFor="chat-widget-message" className="sr-only">
            Mensagem
          </label>
          <textarea
            id="chat-widget-message"
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua pergunta..."
            rows={1}
            maxLength={MAX_MESSAGE_LENGTH}
            disabled={isWaiting}
            className="max-h-32 min-h-10 flex-1 resize-none rounded-md border border-input-border bg-input px-3 py-2 text-sm text-text-strong placeholder-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isWaiting || !draft.trim()}
            aria-label="Enviar"
            title="Enviar"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md bg-brand text-text-strong transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PaperAirplaneIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </form>
    </section>
  );
};

const ChatWidget = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return <ChatPanel key={user?.id ?? 'guest'} />;
};

export default ChatWidget;
