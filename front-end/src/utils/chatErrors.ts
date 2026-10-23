import { ChatStreamError } from '../services/chat';

const statusMessages: Record<number, string> = {
  400: 'Escreva uma mensagem de até 1000 caracteres.',
  404: 'Não encontramos essa conversa. Envie sua mensagem novamente para começar outra.',
  429: 'Muitas perguntas seguidas. Aguarde um minuto e tente novamente.',
  500: 'O assistente está indisponível agora. Tente novamente em instantes.',
};

export const getChatErrorMessage = (err: unknown) => {
  if (err instanceof DOMException && err.name === 'TimeoutError') {
    return 'O servidor demorou para responder. Tente novamente.';
  }

  if (err instanceof TypeError) {
    return 'Não foi possível conectar ao servidor.';
  }

  if (err instanceof ChatStreamError) {
    return (err.status && statusMessages[err.status]) ?? 'Erro no servidor. Tente novamente mais tarde.';
  }

  return 'Algo deu errado. Tente novamente.';
};
