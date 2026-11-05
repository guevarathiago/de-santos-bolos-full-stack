import { HttpError } from '../../errors/http-error.js';
import type { OrdersClient, ProductFilters, ProductInput } from '../orders/orders.client.js';
import type { StorageService } from '../storage/storage.service.js';
import type { MenuQuery } from './products.schemas.js';

type ProductsDependencies = {
    orders: Pick<OrdersClient, 'listProducts' | 'createProduct' | 'updateProduct' | 'deleteProduct'>;
    storage: Pick<StorageService, 'isProductImageUrl'>;
};

export const createProductsService = ({ orders, storage }: ProductsDependencies) => {
    const assertOwnImage = (data: ProductInput) => {
        if (typeof data.imageUrl === 'string' && !storage.isProductImageUrl(data.imageUrl)) {
            throw new HttpError(400, 'Product images must be uploaded through /admin/products/image-upload');
        }
    };

    return {
        // Visitors only ever see what can be ordered.
        menu({ category }: MenuQuery = {}) {
            return orders.listProducts({ available: true, ...(category ? { category } : {}) });
        },

        list(filters: ProductFilters = {}) {
            return orders.listProducts(filters);
        },

        create(data: ProductInput) {
            assertOwnImage(data);
            return orders.createProduct(data);
        },

        update(id: string, data: ProductInput) {
            assertOwnImage(data);
            return orders.updateProduct(id, data);
        },

        remove(id: string) {
            return orders.deleteProduct(id);
        },
    };
};

export type ProductsService = ReturnType<typeof createProductsService>;
