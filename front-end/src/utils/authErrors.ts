import { getRequestErrorMessage } from './requestErrors';

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
