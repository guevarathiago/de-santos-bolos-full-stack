import type { DietaryTag, ProductCategory } from '../services/products';

export const categoryLabels: Record<ProductCategory, string> = {
  CAKE: 'Bolos',
  PIE: 'Tortas',
  BROWNIE: 'Brownies',
  SWEETS: 'Docinhos',
  OTHER: 'Outros',
};

export const dietaryTagLabels: Record<DietaryTag, string> = {
  GLUTEN_FREE: 'Sem glúten',
  LACTOSE_FREE: 'Sem lactose',
  VEGAN: 'Vegano',
};

const priceFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatPrice = (cents: number) => priceFormatter.format(cents / 100);

export const formatWeight = (grams: number) =>
  grams >= 1000 ? `${(grams / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg` : `${grams} g`;

// "65,00", "65" or "1.250,50" → cents; null when it is not a valid amount.
export const parsePriceToCents = (value: string) => {
  const normalized = value.trim().replace(/\./g, '').replace(',', '.');

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  return Math.round(Number(normalized) * 100);
};

export const centsToPriceInput = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');
