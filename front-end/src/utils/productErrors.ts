import { isAxiosError } from 'axios';
import { ImageUploadError } from '../services/products';
import { getRequestErrorMessage } from './requestErrors';

const fieldLabels: Record<string, string> = {
  name: 'Nome',
  description: 'Descrição',
  category: 'Categoria',
  priceCents: 'Preço',
  imageUrl: 'Imagem',
  dietaryTags: 'Restrições',
  servings: 'Porções',
  weightGrams: 'Peso',
  leadTimeDays: 'Antecedência',
  sortOrder: 'Ordem',
};

const unavailable = {
  502: 'O serviço de produtos respondeu com erro. Tente novamente em instantes.',
  503: 'O serviço de produtos está indisponível agora. Tente novamente em instantes.',
};

export const getMenuErrorMessage = (err: unknown) =>
  getRequestErrorMessage(err, { ...unavailable, 500: 'Não foi possível carregar o cardápio.' });

export const getProductsErrorMessage = (err: unknown) => {
  if (err instanceof ImageUploadError) {
    return err.message;
  }

  // The orders service names the invalid fields; show them with their labels.
  if (isAxiosError(err) && err.response?.status === 400) {
    const fields = Object.keys((err.response.data as { errors?: Record<string, unknown> })?.errors ?? {});

    if (fields.length > 0) {
      return `Confira: ${fields.map((field) => fieldLabels[field] ?? field).join(', ')}.`;
    }
  }

  return getRequestErrorMessage(err, {
    ...unavailable,
    400: 'Confira os dados do produto.',
    401: 'Sua sessão expirou. Entre novamente.',
    403: 'Você não tem permissão para gerenciar produtos.',
    404: 'Este produto não existe mais.',
  });
};
