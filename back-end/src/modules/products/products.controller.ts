import type { Request, Response } from 'express';
import type { ProductInput } from '../orders/orders.client.js';
import type { StorageService } from '../storage/storage.service.js';
import type { AdminProductsQuery, ImageUploadInput, MenuQuery } from './products.schemas.js';
import type { ProductsService } from './products.service.js';

type ProductsControllerDependencies = {
    productsService: ProductsService;
    storageService: StorageService;
};

export const createProductsController = ({ productsService, storageService }: ProductsControllerDependencies) => ({
    async menu(_req: Request, res: Response) {
        return res.status(200).json({ products: await productsService.menu(res.locals.query as MenuQuery) });
    },

    async list(_req: Request, res: Response) {
        return res.status(200).json({ products: await productsService.list(res.locals.query as AdminProductsQuery) });
    },

    async create(req: Request, res: Response) {
        return res.status(201).json({ product: await productsService.create(req.body as ProductInput) });
    },

    async update(req: Request<{ id: string }>, res: Response) {
        return res.status(200).json({ product: await productsService.update(req.params.id, req.body as ProductInput) });
    },

    async remove(req: Request<{ id: string }>, res: Response) {
        await productsService.remove(req.params.id);

        return res.status(204).send();
    },

    async imageUpload(req: Request, res: Response) {
        return res.status(201).json(await storageService.createProductImageUpload(req.body as ImageUploadInput));
    },
});
