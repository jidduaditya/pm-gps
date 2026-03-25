import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { supabase } from '../lib/supabase';
import { AppError } from '../utils/AppError';
import { v4 as uuidv4 } from 'uuid';

export const documentService = {
  validateSessionOwnership: async (sessionId: string, userId: string) => {
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();
    if (error || !session) throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    return session;
  },

  checkDocumentLimit: async (sessionId: string) => {
    const { count, error } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);
    if (error) throw new AppError(error.message, 500, 'DB_ERROR');
    if ((count ?? 0) >= 5) throw new AppError('Maximum 5 documents per session', 400, 'DOC_LIMIT_REACHED');
  },

  processUploadedFiles: async (sessionId: string, files: Express.Multer.File[]) => {
    const docs = [];
    for (const file of files) {
      const rawText = await extractText(file.buffer, file.mimetype);
      const storageUrl = await uploadToStorage(file);

      const { data: doc, error } = await supabase
        .from('documents')
        .insert({
          session_id: sessionId,
          type: 'cv',
          storage_url: storageUrl,
          raw_text: rawText,
          upload_source: 'computer',
        })
        .select()
        .single();
      if (error) throw new AppError(error.message, 500, 'DB_ERROR');
      docs.push(doc);
    }
    return docs;
  },

  saveTextDocument: async (sessionId: string, text: string) => {
    const { data: doc, error } = await supabase
      .from('documents')
      .insert({
        session_id: sessionId,
        type: 'text_paste',
        raw_text: text,
        upload_source: 'text_box',
      })
      .select()
      .single();
    if (error) throw new AppError(error.message, 500, 'DB_ERROR');
    return doc;
  },

};

async function extractText(buffer: Buffer, mimetype: string): Promise<string> {
  if (mimetype === 'application/pdf') {
    const data = await pdf(buffer);
    return data.text;
  }
  if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimetype === 'application/msword') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  if (mimetype === 'text/plain') {
    return buffer.toString('utf-8');
  }
  throw new AppError('Unsupported file type', 400, 'UNSUPPORTED_TYPE');
}

async function uploadToStorage(file: Express.Multer.File): Promise<string> {
  const fileName = `${uuidv4()}-${file.originalname}`;
  const { error } = await supabase.storage
    .from(process.env.SUPABASE_STORAGE_BUCKET || 'documents')
    .upload(fileName, file.buffer, { contentType: file.mimetype });

  if (error) throw new AppError('Storage upload failed', 500, 'UPLOAD_FAILED');

  const { data } = supabase.storage
    .from(process.env.SUPABASE_STORAGE_BUCKET || 'documents')
    .getPublicUrl(fileName);

  return data.publicUrl;
}
