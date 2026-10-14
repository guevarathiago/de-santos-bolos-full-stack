import { getRequestErrorMessage } from './requestErrors';

const permissionMessages = {
  401: 'Sua sessão expirou. Entre novamente.',
  403: 'Você não tem permissão para gerenciar documentos.',
};

export const getUploadErrorMessage = (err: unknown) =>
  getRequestErrorMessage(err, {
    ...permissionMessages,
    400: 'Selecione um arquivo para enviar.',
    413: 'O arquivo é maior que 10 MB.',
    415: 'Formato não suportado. Envie um arquivo PDF ou TXT.',
  });

export const getDocumentsErrorMessage = (err: unknown) =>
  getRequestErrorMessage(err, {
    ...permissionMessages,
    404: 'Este documento já foi excluído.',
  });
