import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { documentService } from '../services/documentService';
import { AppError } from '../utils/AppError';

export const documentController = {
  uploadFiles: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { session_id } = req.body;
    if (!session_id) throw new AppError('session_id required', 400, 'MISSING_FIELD');

    const files = req.files as Express.Multer.File[];
    if (!files?.length) throw new AppError('No files provided', 400, 'NO_FILES');

    await documentService.validateSessionOwnership(session_id, req.user!.id);
    await documentService.checkDocumentLimit(session_id);

    const docs = await documentService.processUploadedFiles(session_id, files);
    res.status(201).json({ documents: docs });
  }),

  pasteText: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { session_id, text } = req.body;
    if (!session_id || !text) throw new AppError('session_id and text required', 400, 'MISSING_FIELD');
    if (text.length > 10000) throw new AppError('Text exceeds 10,000 characters', 400, 'TEXT_TOO_LONG');

    await documentService.validateSessionOwnership(session_id, req.user!.id);

    const doc = await documentService.saveTextDocument(session_id, text);
    res.status(201).json({ document: doc });
  }),

};
