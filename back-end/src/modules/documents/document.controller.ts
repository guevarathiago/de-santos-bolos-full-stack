import type { Request, Response } from 'express';
import { z } from 'zod';
import type { DocumentService } from './document.service.js';

const idSchema = z.uuid();

export const createDocumentController = (documentService: DocumentService) => ({
    async upload(req: Request, res: Response) {
        if (!req.file) {
            return res.status(400).json({ message: 'File is required' });
        }

        const { originalname, mimetype, size, buffer } = req.file;

        const document = await documentService.create({
            filename: originalname,
            mimeType: mimetype,
            sizeBytes: size,
            uploadedById: req.user!.id,
        });

        documentService.process(document, buffer).catch((error: unknown) => {
            console.error(`Failed to process document ${document.id}:`, error);
        });

        return res.status(202).json({ document });
    },

    async list(_req: Request, res: Response) {
        return res.status(200).json({ documents: await documentService.list() });
    },

    async remove(req: Request, res: Response) {
        const id = idSchema.safeParse(req.params.id);

        if (!id.success) {
            return res.status(400).json({ message: 'Invalid document id' });
        }

        await documentService.remove(id.data);

        return res.status(204).send();
    },
});
