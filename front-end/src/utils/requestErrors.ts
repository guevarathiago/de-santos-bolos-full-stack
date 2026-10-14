import { isAxiosError } from 'axios';

export const getRequestErrorMessage = (err: unknown, statusMessages: Record<number, string>) => {
  if (!isAxiosError(err)) {
    return 'Algo deu errado. Tente novamente.';
  }

  if (err.code === 'ECONNABORTED') {
    return 'O servidor demorou para responder. Tente novamente.';
  }

  if (!err.response) {
    return 'Não foi possível conectar ao servidor.';
  }

  return statusMessages[err.response.status] ?? 'Erro no servidor. Tente novamente mais tarde.';
};
