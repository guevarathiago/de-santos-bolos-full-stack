import { isAxiosError } from 'axios';

const getRequestErrorMessage = (err: unknown, statusMessages: Record<number, string>) => {
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

export const getLoginErrorMessage = (err: unknown) =>
  getRequestErrorMessage(err, {
    400: 'Preencha o e-mail e a senha.',
    401: 'E-mail ou senha inválidos.',
    404: 'E-mail ou senha inválidos.',
  });

export const getRegisterErrorMessage = (err: unknown) =>
  getRequestErrorMessage(err, {
    400: 'Preencha todos os campos.',
    409: 'Este e-mail já está cadastrado.',
  });
