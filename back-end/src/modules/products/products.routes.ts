import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validateBody, validateQuery } from '../../middlewares/validate.js';
import type { StorageService } from '../storage/storage.service.js';
import { UserRole } from '../users/user.entity.js';
import { createProductsController } from './products.controller.js';
import { adminProductsQuerySchema, imageUploadSchema, menuQuerySchema, productBodySchema } from './products.schemas.js';
import type { ProductsService } from './products.service.js';

type ProductsRouterDependencies = {
    productsService: ProductsService;
    storageService: StorageService;
};

// Public menu: available products only.
export const createMenuRouter = (dependencies: ProductsRouterDependencies) => {
    const controller = createProductsController(dependencies);
    const router = Router();

    router.get('/', validateQuery(menuQuerySchema), controller.menu);

    return router;
};

export const createAdminProductsRouter = (dependencies: ProductsRouterDependencies) => {
    const controller = createProductsController(dependencies);
    const router = Router();

    router.use(authenticate, authorize(UserRole.ADMIN));

    router.get('/', validateQuery(adminProductsQuerySchema), controller.list);
    router.post('/', validateBody(productBodySchema), controller.create);
    router.post('/image-upload', validateBody(imageUploadSchema), controller.imageUpload);
    router.patch('/:id', validateBody(productBodySchema), controller.update);
    router.delete('/:id', controller.remove);

    return router;
};
