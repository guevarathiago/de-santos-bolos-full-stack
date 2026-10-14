import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { UserRole } from '../users/user.entity.js';
import { createDocumentController } from './document.controller.js';
import type { DocumentService } from './document.service.js';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
    defParamCharset: 'utf8',
});

export const createDocumentRouter = (documentService: DocumentService) => {
    const controller = createDocumentController(documentService);
    const router = Router();

    router.use(authenticate, authorize(UserRole.ADMIN));

    router.get('/', controller.list);
    router.post('/', upload.single('file'), controller.upload);
    router.delete('/:id', controller.remove);

    return router;
};
