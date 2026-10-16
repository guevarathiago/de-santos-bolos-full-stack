import { getRequestErrorMessage } from './requestErrors';

export const getChatErrorMessage = (err: unknown) =>
  getRequestErrorMessage(err, {
    400: 'Escreva uma mensagem de até 1000 caracteres.',
    429: 'Muitas perguntas seguidas. Aguarde um minuto e tente novamente.',
    500: 'O assistente está indisponível agora. Tente novamente em instantes.',
  });
