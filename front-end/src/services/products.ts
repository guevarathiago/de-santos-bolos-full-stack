import { api } from './api';

export type ProductCategory = 'CAKE' | 'PIE' | 'BROWNIE' | 'SWEETS' | 'OTHER';
export type DietaryTag = 'GLUTEN_FREE' | 'LACTOSE_FREE' | 'VEGAN';

export type Product = {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  priceCents: number;
  imageUrl: string | null;
  dietaryTags: DietaryTag[];
  servings: number | null;
  weightGrams: number | null;
  leadTimeDays: number;
  available: boolean;
  featured: boolean;
  sortOrder: number;
};

export type ProductInput = Omit<Product, 'id'>;

type ImageUpload = {
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
  imageUrl: string;
};

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export class ImageUploadError extends Error {}

export const listMenu = async (category?: ProductCategory) => {
  const { data } = await api.get<{ products: Product[] }>('/products', { params: { category } });
  return data.products;
};

export const listAdminProducts = async () => {
  const { data } = await api.get<{ products: Product[] }>('/admin/products');
  return data.products;
};

export const createProduct = async (product: ProductInput) => {
  const { data } = await api.post<{ product: Product }>('/admin/products', product);
  return data.product;
};

export const updateProduct = async (id: string, changes: Partial<ProductInput>) => {
  const { data } = await api.patch<{ product: Product }>(`/admin/products/${id}`, changes);
  return data.product;
};

export const deleteProduct = async (id: string) => {
  await api.delete(`/admin/products/${id}`);
};

// Two steps: the API authorizes the upload, then the browser sends the file straight to the bucket.
export const uploadProductImage = async (file: File) => {
  if (!IMAGE_TYPES.includes(file.type)) {
    throw new ImageUploadError('Envie uma imagem JPG, PNG ou WebP.');
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new ImageUploadError('A imagem precisa ter até 5 MB.');
  }

  const { data: upload } = await api.post<ImageUpload>('/admin/products/image-upload', {
    contentType: file.type,
    sizeBytes: file.size,
  });

  const response = await fetch(upload.uploadUrl, { method: upload.method, headers: upload.headers, body: file });

  if (!response.ok) {
    throw new ImageUploadError('Não foi possível enviar a imagem. Tente novamente.');
  }

  return upload.imageUrl;
};
