import { api } from './api';

export type DocumentStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';

export type KnowledgeDocument = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
  errorMessage: string | null;
  chunkCount: number;
  createdAt: string;
};

export const listDocuments = async () => {
  const { data } = await api.get<{ documents: KnowledgeDocument[] }>('/admin/documents');
  return data.documents;
};

export const uploadDocument = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post<{ document: KnowledgeDocument }>('/admin/documents', formData);
  return data.document;
};

export const deleteDocument = async (id: string) => {
  await api.delete(`/admin/documents/${id}`);
};
